import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, appUrl } from "@/lib/hcm/notify";
import {
  JOINER_SELECT, JOIN_STAGES, BGV_STATUSES, TASK_TEAMS, OnboardingError,
  joinerReadiness, syncJoinerStatus, applyTemplate, announceTask, addDays,
} from "@/lib/hcm/onboarding";

const EDITABLE = [
  "joining_date", "reporting_time", "reporting_location", "day1_notes", "manager_id", "buddy_id",
  "join_stage", "department_id", "location_id", "grade_id", "bgv_status", "bgv_note",
];

async function loadJoiner(id) {
  const { data } = await createHcmAdminClient().from("joiners").select(JOINER_SELECT).eq("id", id).maybeSingle();
  if (!data) throw new OnboardingError("Joiner not found.", 404);
  return data;
}

function assertOpen(joiner) {
  if (["Joined", "Cancelled"].includes(joiner.status)) {
    throw new OnboardingError(`This joiner is ${joiner.status.toLowerCase()} and can no longer be changed.`);
  }
}

async function detail(id) {
  const db = createHcmAdminClient();
  const joiner = await loadJoiner(id);
  const [{ data: documents }, { data: tasks }, { data: activity }, { data: templates }, { data: types }] = await Promise.all([
    db.from("joiner_documents").select("*, document_types(description, sort)").eq("joiner_id", id),
    db.from("tasks").select("*, assignee:internal_users!tasks_assignee_id_fkey(id, full_name)")
      .eq("context_type", "onboarding").eq("context_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    db.from("audit_logs").select("id, action, actor_email, before, after, created_at")
      .eq("entity_type", "joiner").eq("entity_id", id).order("created_at", { ascending: false }).limit(100),
    db.from("checklist_templates").select("id, name, employment_type, is_default").eq("archived", false).order("name"),
    db.from("document_types").select("code, name, required").eq("archived", false).order("sort"),
  ]);
  const docs = (documents || []).sort((a, b) => (a.document_types?.sort ?? 999) - (b.document_types?.sort ?? 999));
  return {
    joiner,
    documents: docs,
    tasks: tasks || [],
    activity: activity || [],
    templates: templates || [],
    documentTypes: types || [],
    readiness: joinerReadiness(joiner, docs, tasks || []),
  };
}

export async function GET(request, { params }) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    return NextResponse.json({ success: true, ...(await detail(id)) });
  } catch (err) {
    if (err instanceof OnboardingError) return jsonError(err.message, err.status);
    return serverError("Joiner GET", err);
  }
}

async function sendJoiningDetails(joiner) {
  const vars = {
    joiner_name: joiner.full_name,
    job_title: joiner.position,
    joining_date: joiner.joining_date,
    reporting_time: joiner.reporting_time || "—",
    reporting_location: joiner.reporting_location || joiner.locations?.name || "—",
    manager_name: joiner.manager?.full_name || "—",
    buddy_name: joiner.buddy?.full_name || "—",
    day1_notes: joiner.day1_notes || "",
  };
  const related = { entity: "joiner", id: joiner.id };
  await queueEmail("joining_details", joiner.personal_email, { ...vars, name: joiner.full_name }, related);
  for (const person of [joiner.manager, joiner.buddy]) {
    if (person?.email) await queueEmail("joining_details", person.email, { ...vars, name: person.full_name }, related);
  }
  await createHcmAdminClient().from("joiners").update({ joining_details_sent_at: new Date().toISOString() }).eq("id", joiner.id);
}

// PATCH: edit pre-joining details and BGV.
export async function PATCH(request, { params }) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const db = createHcmAdminClient();
    const joiner = await loadJoiner(id);
    assertOpen(joiner);
    const body = await request.json();

    const update = {};
    for (const key of EDITABLE) {
      if (key in body) update[key] = typeof body[key] === "string" ? body[key].trim() || null : body[key] ?? null;
    }
    if ("joining_date" in update && !update.joining_date) return jsonError("Joining date is required.");
    if ("join_stage" in update && !JOIN_STAGES.includes(update.join_stage)) return jsonError("Invalid joining stage.");
    if ("bgv_status" in update && !BGV_STATUSES.includes(update.bgv_status)) return jsonError("Invalid background check status.");
    if (update.bgv_status === "Failed" && !(update.bgv_note ?? joiner.bgv_note)) return jsonError("Add a note explaining the failed background check.");
    if (update.manager_id && update.manager_id === (update.buddy_id ?? joiner.buddy_id)) return jsonError("The buddy should be someone other than the manager.");

    const changed = Object.fromEntries(Object.entries(update).filter(([k, v]) => (joiner[k] ?? null) !== v));
    if (!Object.keys(changed).length) return NextResponse.json({ success: true, ...(await detail(id)) });

    const { error } = await db.from("joiners").update(changed).eq("id", id);
    if (error) throw error;

    // Move open task due dates with the joining date.
    if (changed.joining_date) {
      const delta = Math.round((new Date(changed.joining_date) - new Date(joiner.joining_date)) / 86400000);
      const { data: open } = await db.from("tasks").select("id, due_date").eq("context_type", "onboarding").eq("context_id", id).eq("status", "Open");
      for (const t of open || []) {
        if (t.due_date) await db.from("tasks").update({ due_date: addDays(t.due_date, delta) }).eq("id", t.id);
      }
    }

    // Hand Manager / Buddy tasks to the new person.
    const fresh = await loadJoiner(id);
    for (const [field, team] of [["manager_id", "Manager"], ["buddy_id", "Buddy"]]) {
      if (!(field in changed)) continue;
      let query = db.from("tasks").update({ assignee_id: changed[field] })
        .eq("context_type", "onboarding").eq("context_id", id).eq("team", team).eq("status", "Open");
      query = joiner[field] ? query.or(`assignee_id.is.null,assignee_id.eq.${joiner[field]}`) : query.is("assignee_id", null);
      const { data: moved } = await query.select();
      if (changed[field]) for (const task of moved || []) await announceTask(task, fresh);
    }

    const before = Object.fromEntries(Object.keys(changed).map((k) => [k, joiner[k] ?? null]));
    await logAudit({
      actor: auth.user,
      action: "bgv_status" in changed ? "onboarding.bgv" : "onboarding.update",
      entityType: "joiner",
      entityId: id,
      before,
      after: changed,
      request,
    });

    if (changed.joining_date && fresh.joining_details_sent_at) await sendJoiningDetails(fresh);
    await syncJoinerStatus(id);
    return NextResponse.json({ success: true, ...(await detail(id)) });
  } catch (err) {
    if (err instanceof OnboardingError) return jsonError(err.message, err.status);
    return serverError("Joiner PATCH", err);
  }
}

// POST { action }: cancel | send_joining_details | apply_template | add_task | request_document
export async function POST(request, { params }) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const db = createHcmAdminClient();
    const joiner = await loadJoiner(id);
    assertOpen(joiner);
    const body = await request.json();
    const audit = (action, after) =>
      logAudit({ actor: auth.user, action, entityType: "joiner", entityId: id, after, request });

    switch (body.action) {
      case "cancel": {
        const reason = String(body.reason || "").trim();
        if (!reason) return jsonError("A reason is required to cancel onboarding.");
        await db.from("joiners").update({ status: "Cancelled", cancel_reason: reason }).eq("id", id);
        await db.from("tasks").update({ status: "Skipped" }).eq("context_type", "onboarding").eq("context_id", id).eq("status", "Open");
        await audit("onboarding.cancel", { reason });
        break;
      }
      case "send_joining_details": {
        await sendJoiningDetails(joiner);
        await audit("onboarding.send_joining_details", { joining_date: joiner.joining_date });
        break;
      }
      case "apply_template": {
        if (!body.template_id) return jsonError("Choose a checklist template.");
        const tasks = await applyTemplate(joiner, body.template_id, auth.user);
        await audit("onboarding.apply_template", { template_id: body.template_id, tasks: tasks.length });
        break;
      }
      case "add_task": {
        const title = String(body.title || "").trim();
        if (!title) return jsonError("Task title is required.");
        const team = TASK_TEAMS.includes(body.team) ? body.team : "HR";
        const { data: task, error } = await db
          .from("tasks")
          .insert({
            context_type: "onboarding",
            context_id: id,
            title,
            description: body.description?.trim() || null,
            team,
            assignee_id: body.assignee_id || null,
            due_date: body.due_date || null,
            created_by: auth.user.id,
          })
          .select()
          .single();
        if (error) throw error;
        await announceTask(task, joiner);
        await audit("onboarding.add_task", { task_id: task.id, title, team, assignee_id: task.assignee_id });
        break;
      }
      case "request_document": {
        const { data: type } = await db.from("document_types").select("*").eq("code", body.type_code).eq("archived", false).maybeSingle();
        if (!type) return jsonError("Unknown document type.");
        const { data: existing } = await db.from("joiner_documents").select("id").eq("joiner_id", id).eq("type_code", type.code).maybeSingle();
        if (existing) return jsonError(`${type.name} is already on this joiner's checklist.`);
        const { error } = await db.from("joiner_documents").insert({
          joiner_id: id, type_code: type.code, name: type.name, required: body.required ?? type.required,
        });
        if (error) throw error;
        await queueEmail(
          "documents_requested",
          joiner.personal_email,
          { candidate_name: joiner.full_name, job_title: joiner.position, joining_date: joiner.joining_date, documents: `- ${type.name}`, link: appUrl("/candidate/joining") },
          { entity: "joiner", id }
        );
        await audit("onboarding.request_document", { type_code: type.code });
        await syncJoinerStatus(id);
        break;
      }
      default:
        return jsonError("Unknown action.");
    }
    return NextResponse.json({ success: true, ...(await detail(id)) });
  } catch (err) {
    if (err instanceof OnboardingError) return jsonError(err.message, err.status);
    return serverError("Joiner POST", err);
  }
}
