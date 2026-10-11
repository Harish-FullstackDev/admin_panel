import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, requirePermission, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { JOIN_STAGES } from "@/lib/hcm/onboarding";
import { EMPLOYEE_SELECT, EMPLOYEE_EDITABLE, canViewEmployee } from "@/lib/hcm/employees";

// GET: profile, joining documents and lifecycle timeline. Anyone may read
// their own record; others need employee.view within scope.
export async function GET(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const db = createHcmAdminClient();
    const { data: employee } = await db.from("employees").select(EMPLOYEE_SELECT).eq("id", id).maybeSingle();
    if (!employee || !canViewEmployee(user, employee)) return jsonError("Employee not found.", 404);

    const [{ data: events }, { data: documents }, { data: reports }, { data: letters }, { data: openStage }, { data: exitCase }] = await Promise.all([
      db.from("employee_events").select("*").eq("employee_id", id).order("created_at", { ascending: false }),
      employee.joiner_id
        ? db.from("joiner_documents").select("id, joiner_id, type_code, name, required, status, file_name, verified_at").eq("joiner_id", employee.joiner_id)
        : { data: [] },
      db.from("employees").select("id, full_name, designation, employee_code, stage").eq("manager_id", id).order("full_name"),
      db.from("letters").select("id, type, title, issued_at").eq("employee_id", id).order("issued_at", { ascending: false }),
      db.from("stage_records").select("id, type, status").eq("employee_id", id).in("status", ["Active", "Pending approval"]).maybeSingle(),
      db.from("exit_cases").select("id, status").eq("employee_id", id).in("status", ["Pending manager", "Pending HR", "Pending approval", "In notice", "Completed"])
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const actorIds = [...new Set((events || []).map((e) => e.actor_id).filter(Boolean))];
    const { data: actors } = actorIds.length ? await db.from("internal_users").select("id, full_name").in("id", actorIds) : { data: [] };
    const names = Object.fromEntries((actors || []).map((a) => [a.id, a.full_name]));

    return NextResponse.json({
      success: true,
      employee,
      events: (events || []).map((e) => ({ ...e, actor_name: names[e.actor_id] || null })),
      documents: hasPermission(user, "employee.manage") || hasPermission(user, "onboarding.manage") || id === user.id ? documents || [] : [],
      directReports: reports || [],
      letters: letters || [],
      stageRecord: openStage || null,
      // Unapproved HR separations stay hidden from the employee themselves.
      exitCase: exitCase && !(id === user.id && exitCase.status === "Pending approval") ? exitCase : null,
      canEdit: hasPermission(user, "employee.manage"),
    });
  } catch (err) {
    return serverError("Employee GET", err);
  }
}

// PATCH: edit job details. Records an 'update' lifecycle event with the diff.
export async function PATCH(request, { params }) {
  const auth = await requirePermission(request, "employee.manage");
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const db = createHcmAdminClient();
    const { data: employee } = await db.from("employees").select("*").eq("id", id).maybeSingle();
    if (!employee) return jsonError("Employee not found.", 404);
    const body = await request.json();

    const update = {};
    for (const key of EMPLOYEE_EDITABLE) {
      if (key in body) update[key] = typeof body[key] === "string" ? body[key].trim() || null : body[key] ?? null;
    }
    if ("stage" in update && !JOIN_STAGES.includes(update.stage)) return jsonError("Invalid stage.");
    if ((("stage" in update && update.stage !== employee.stage) || ("stage_end_date" in update && update.stage_end_date !== employee.stage_end_date))) {
      const { data: open } = await db.from("stage_records").select("id").eq("employee_id", id).in("status", ["Active", "Pending approval"]).maybeSingle();
      if (open) return jsonError("This person has an open intern/probation record. Change the stage from the probation tracker.");
    }
    if (update.manager_id && update.manager_id === id) return jsonError("An employee cannot be their own manager.");
    if ((update.stage ?? employee.stage) === "Full-time") update.stage_end_date = null;
    if (update.stage_end_date && update.stage_end_date <= employee.joining_date) return jsonError("Stage end date must be after the joining date.");

    const changed = Object.fromEntries(Object.entries(update).filter(([k, v]) => (employee[k] ?? null) !== v));
    if (!Object.keys(changed).length) return NextResponse.json({ success: true, employee });

    const { data: updated, error } = await db.from("employees").update(changed).eq("id", id).select().single();
    if (error) throw error;

    const mirror = {};
    if ("designation" in changed) mirror.designation = changed.designation;
    if ("department_id" in changed) mirror.department_id = changed.department_id;
    if (Object.keys(mirror).length) await db.from("internal_users").update(mirror).eq("id", id);

    const before = Object.fromEntries(Object.keys(changed).map((k) => [k, employee[k] ?? null]));
    await db.from("employee_events").insert({
      employee_id: id, type: "update", before, after: changed, note: body.note?.trim() || null, actor_id: auth.user.id,
    });
    await logAudit({ actor: auth.user, action: "employee.update", entityType: "employee", entityId: id, before, after: changed, request });
    return NextResponse.json({ success: true, employee: updated });
  } catch (err) {
    return serverError("Employee PATCH", err);
  }
}
