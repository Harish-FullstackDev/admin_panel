import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { notifyUsers, usersWithPermission } from "@/lib/hcm/notify";
import {
  StageError, loadStage, stageAccess, proposeOutcome, decideOutcome, weekStart, REVIEW_CRITERIA, RECOMMENDATIONS,
} from "@/lib/hcm/stage";

const RECOMMENDATIONS_BY_TYPE = {
  Probation: ["Confirm", "Extend", "Release"],
  Intern: ["Convert to probation", "Convert to full-time", "Extend", "Release"],
};

async function authorize(request, id) {
  const user = await getInternalUser(request);
  if (!user) return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  const { record, employee } = await loadStage(id);
  const access = stageAccess(user, record, employee);
  if (!access.manage && !access.review && !access.approve && !access.self) {
    return { error: jsonError("Record not found.", 404) };
  }
  return { user, record, employee, access };
}

async function detail(user, record, employee, access) {
  const db = createHcmAdminClient();
  const [{ data: tasks }, { data: updates }, { data: reviews }, { data: letters }, { data: approvals }, { data: activity }] = await Promise.all([
    db.from("tasks").select("*").eq("context_type", "stage").eq("context_id", record.id).order("due_date", { ascending: true, nullsFirst: false }),
    db.from("stage_updates").select("*").eq("stage_record_id", record.id).order("week_start", { ascending: false }),
    db.from("stage_reviews").select("*, reviewer:internal_users!stage_reviews_reviewer_id_fkey(id, full_name)").eq("stage_record_id", record.id),
    db.from("letters").select("id, type, title, issued_at").eq("stage_record_id", record.id).order("issued_at", { ascending: false }),
    db.from("approvals").select("*").eq("entity_type", "stage_record").eq("entity_id", record.id).order("created_at"),
    access.manage || access.approve
      ? db.from("audit_logs").select("id, action, actor_email, after, created_at").eq("entity_type", "stage_record").eq("entity_id", record.id).order("created_at", { ascending: false }).limit(50)
      : { data: [] },
  ]);

  // The employee only sees their own self-assessment and submitted manager reviews.
  const visibleReviews = (reviews || []).filter((r) => {
    if (access.manage || access.review) return r.type !== "self" || r.submitted_at || access.self;
    return r.type === "self" || r.submitted_at;
  });

  const deciderIds = [...new Set((approvals || []).map((a) => a.decided_by).filter(Boolean))];
  const { data: deciders } = deciderIds.length ? await db.from("internal_users").select("id, full_name").in("id", deciderIds) : { data: [] };
  const names = Object.fromEntries((deciders || []).map((d) => [d.id, d.full_name]));

  return {
    record,
    employee,
    access: { ...access, canDecide: access.approve && record.status === "Pending approval" && record.proposed_by !== user.id },
    criteria: REVIEW_CRITERIA[record.type],
    currentWeek: weekStart(),
    recommendations: RECOMMENDATIONS_BY_TYPE[record.type],
    tasks: tasks || [],
    updates: updates || [],
    reviews: visibleReviews,
    letters: letters || [],
    approvals: (approvals || []).map((a) => ({ ...a, decided_by_name: names[a.decided_by] || null })),
    activity: activity || [],
  };
}

function fail(err, label) {
  if (err instanceof StageError) return jsonError(err.message, err.status);
  return serverError(label, err);
}

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const a = await authorize(request, id);
    if (a.error) return a.error;
    return NextResponse.json({ success: true, ...(await detail(a.user, a.record, a.employee, a.access)) });
  } catch (err) {
    return fail(err, "Probation record GET");
  }
}

// PATCH (probation.manage): mentor and review dates.
export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const a = await authorize(request, id);
    if (a.error) return a.error;
    if (!a.access.manage) return jsonError("You do not have permission to do this.", 403);
    if (a.record.status === "Completed") return jsonError("This record is closed.");
    const body = await request.json();
    const update = {};
    if ("mentor_id" in body) {
      if (body.mentor_id && body.mentor_id === a.employee.id) return jsonError("Someone else must be the mentor.");
      update.mentor_id = body.mentor_id || null;
    }
    for (const key of ["mid_review_date", "final_review_date"]) {
      if (!(key in body)) continue;
      const value = body[key] || null;
      if (value && (value < a.record.start_date || value > a.record.end_date)) return jsonError("Review dates must fall within the period.");
      update[key] = value;
      if (value !== a.record[key]) update[key.replace("review_date", "reminded_at")] = null;
    }
    const midDate = update.mid_review_date ?? a.record.mid_review_date;
    const finalDate = update.final_review_date ?? a.record.final_review_date;
    if (midDate && finalDate && finalDate < midDate) return jsonError("The final review must come after the mid-point review.");

    const db = createHcmAdminClient();
    const { error } = await db.from("stage_records").update(update).eq("id", id);
    if (error) throw error;
    await logAudit({
      actor: a.user,
      action: "stage.update",
      entityType: "stage_record",
      entityId: id,
      before: Object.fromEntries(Object.keys(update).map((k) => [k, a.record[k] ?? null])),
      after: update,
      request,
    });
    if (update.mentor_id && update.mentor_id !== a.record.mentor_id) {
      await notifyUsers([update.mentor_id], { title: `You are now mentoring ${a.employee.full_name}`, body: a.record.type, link: `/admin/dashboard/probation/${id}` });
    }
    const fresh = await loadStage(id);
    return NextResponse.json({ success: true, ...(await detail(a.user, fresh.record, fresh.employee, stageAccessFresh(a, fresh))) });
  } catch (err) {
    return fail(err, "Probation record PATCH");
  }
}

function stageAccessFresh(a, fresh) {
  return { ...a.access, ...stageAccess(a.user, fresh.record, fresh.employee) };
}

function cleanReview(body, criteria) {
  const ratings = {};
  for (const c of criteria) {
    const v = Number(body.ratings?.[c]);
    if (Number.isInteger(v) && v >= 1 && v <= 5) ratings[c] = v;
  }
  const overall = Number(body.overall);
  return {
    ratings,
    overall: Number.isInteger(overall) && overall >= 1 && overall <= 5 ? overall : null,
    strengths: String(body.strengths || "").trim() || null,
    improvements: String(body.improvements || "").trim() || null,
    comments: String(body.comments || "").trim() || null,
    recommendation: RECOMMENDATIONS.includes(body.recommendation) ? body.recommendation : null,
  };
}

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const a = await authorize(request, id);
    if (a.error) return a.error;
    const { user, record, employee, access } = a;
    const body = await request.json();
    const db = createHcmAdminClient();
    const reviewer = access.manage || access.review;

    switch (body.action) {
      case "add_task": {
        if (!reviewer || access.self) return jsonError("You do not have permission to do this.", 403);
        if (record.status === "Completed") return jsonError("This record is closed.");
        const title = String(body.title || "").trim();
        if (!title) return jsonError("Task title is required.");
        const { data: task, error } = await db
          .from("tasks")
          .insert({
            context_type: "stage",
            context_id: id,
            title,
            description: body.description?.trim() || null,
            team: "Self",
            assignee_id: employee.id,
            due_date: body.due_date || null,
            progress: 0,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        await notifyUsers([employee.id], { title: `New task: ${title}`, body: task.due_date ? `Due ${task.due_date}` : null, link: "/admin/dashboard/tasks" });
        await logAudit({ actor: user, action: "stage.add_task", entityType: "stage_record", entityId: id, after: { task_id: task.id, title }, request });
        break;
      }
      case "rate_update": {
        if (!reviewer || access.self) return jsonError("You do not have permission to do this.", 403);
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return jsonError("Rating must be 1 to 5.");
        const { data: upd, error } = await db
          .from("stage_updates")
          .update({ mentor_rating: rating, mentor_comment: String(body.comment || "").trim() || null, rated_by: user.id, rated_at: new Date().toISOString() })
          .eq("id", body.update_id)
          .eq("stage_record_id", id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!upd) return jsonError("Update not found.", 404);
        await notifyUsers([employee.id], { title: "Feedback on your weekly update", body: `Week of ${upd.week_start}: ${rating}/5`, link: "/admin/dashboard/my-stage" });
        break;
      }
      case "save_review":
      case "submit_review": {
        const type = body.type;
        if (!["self", "mid", "final"].includes(type)) return jsonError("Unknown review type.");
        if (type === "self" && !access.self) return jsonError("Only the employee can write the self-assessment.", 403);
        if (type !== "self" && (!reviewer || access.self)) return jsonError("You do not have permission to do this.", 403);
        if (record.status !== "Active") return jsonError(`This record is ${record.status.toLowerCase()}.`);
        const { data: existing } = await db.from("stage_reviews").select("*").eq("stage_record_id", id).eq("type", type).maybeSingle();
        if (existing?.submitted_at) return jsonError("This review has been submitted and is locked.");
        if (existing && type !== "self" && existing.reviewer_id && existing.reviewer_id !== user.id && !access.manage) {
          return jsonError("Another reviewer has started this review.", 409);
        }
        const criteria = REVIEW_CRITERIA[record.type];
        const fields = cleanReview(body, criteria);
        if (type !== "final") fields.recommendation = null;
        else if (fields.recommendation && !RECOMMENDATIONS_BY_TYPE[record.type].includes(fields.recommendation)) {
          return jsonError("That recommendation doesn't apply to this record.");
        }
        const submit = body.action === "submit_review";
        if (submit) {
          if (Object.keys(fields.ratings).length !== criteria.length) return jsonError("Rate every criterion from 1 to 5.");
          if (!fields.overall) return jsonError("Give an overall rating.");
          if (type === "final" && !fields.recommendation) return jsonError("The final review needs a recommendation.");
          if (type !== "self" && !fields.comments && !fields.improvements && !fields.strengths) return jsonError("Add some written feedback.");
        }
        const row = { ...fields, reviewer_id: user.id, submitted_at: submit ? new Date().toISOString() : null };
        const { error } = existing
          ? await db.from("stage_reviews").update(row).eq("id", existing.id)
          : await db.from("stage_reviews").insert({ ...row, stage_record_id: id, type });
        if (error) throw error;

        if (submit) {
          await logAudit({ actor: user, action: `stage.review_${type}`, entityType: "stage_record", entityId: id, after: { overall: fields.overall, recommendation: fields.recommendation }, request });
          const hr = await usersWithPermission("probation.manage");
          if (type === "self") {
            await notifyUsers([employee.manager_id, record.mentor_id].filter(Boolean), { title: `${employee.full_name} submitted a self-assessment`, link: `/admin/dashboard/probation/${id}` });
          } else {
            await notifyUsers([employee.id], { title: `Your ${type === "mid" ? "mid-point" : "final"} review is available`, link: "/admin/dashboard/my-stage" });
          }
          if (type === "final") {
            await db.from("stage_records").update({ recommendation: fields.recommendation, recommended_by: user.id }).eq("id", id);
            await notifyUsers(hr.map((u) => u.id).filter((uid) => uid !== user.id), {
              title: `Final review: ${employee.full_name} — ${fields.recommendation}`,
              body: "Decide the outcome.",
              link: `/admin/dashboard/probation/${id}`,
            });
          }
        }
        break;
      }
      case "reopen_review": {
        if (!access.manage) return jsonError("Only HR can reopen a review.", 403);
        if (record.status !== "Active") return jsonError("Reviews can only be reopened while the record is active.");
        const { data: rev } = await db.from("stage_reviews").select("id, submitted_at").eq("stage_record_id", id).eq("type", body.type).maybeSingle();
        if (!rev?.submitted_at) return jsonError("That review isn't submitted.");
        await db.from("stage_reviews").update({ submitted_at: null, reopened_by: user.id }).eq("id", rev.id);
        if (body.type === "final") await db.from("stage_records").update({ recommendation: null, recommended_by: null }).eq("id", id);
        await logAudit({ actor: user, action: "stage.review_reopen", entityType: "stage_record", entityId: id, after: { type: body.type }, request });
        break;
      }
      case "propose_outcome": {
        if (!access.manage) return jsonError("Only HR can decide outcomes.", 403);
        if (access.self) return jsonError("You cannot decide your own outcome.", 403);
        await proposeOutcome(record, employee, body, user, request);
        break;
      }
      case "decide_outcome": {
        if (!access.approve) return jsonError("Only the CHRO can approve this.", 403);
        if (access.self) return jsonError("You cannot decide your own outcome.", 403);
        await decideOutcome(record, employee, { decision: body.decision, comment: body.comment }, user, request);
        break;
      }
      default:
        return jsonError("Unknown action.");
    }

    const fresh = await loadStage(id);
    return NextResponse.json({ success: true, ...(await detail(user, fresh.record, fresh.employee, stageAccessFresh(a, fresh))) });
  } catch (err) {
    return fail(err, "Probation record POST");
  }
}
