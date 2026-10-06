import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, hasPermission, serverError } from "@/lib/hcm/auth";
import { remindDueReviews, OPEN_STATUSES } from "@/lib/hcm/stage";

// GET: intern / probation records. probation.manage (or review scope 'all')
// sees everyone; managers and mentors see their own people.
// ?status=open (default) | Completed | all, ?type=Intern|Probation
export async function GET(request) {
  const auth = await requirePermission(request, ["probation.manage", "probation.review"]);
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    await remindDueReviews();
    const db = createHcmAdminClient();
    const p = new URL(request.url).searchParams;
    const status = p.get("status") || "open";

    let query = db
      .from("stage_records")
      .select(
        "*, mentor:internal_users!stage_records_mentor_id_fkey(id, full_name), employees!inner(id, full_name, employee_code, designation, manager_id, status, departments(name), manager:internal_users!employees_manager_id_fkey(id, full_name))"
      )
      .order("end_date");
    if (status === "open") query = query.in("status", OPEN_STATUSES);
    else if (status !== "all") query = query.eq("status", status);
    if (p.get("type")) query = query.eq("type", p.get("type"));
    const all = hasPermission(user, "probation.manage") || user.permissions["probation.review"] === "all";
    const { data, error } = await query;
    if (error) throw error;
    const records = all ? data : data.filter((r) => r.mentor_id === user.id || r.employees.manager_id === user.id);

    const ids = records.map((r) => r.id);
    const [{ data: tasks }, { data: reviews }] = await Promise.all([
      ids.length ? db.from("tasks").select("context_id, status, progress").eq("context_type", "stage").in("context_id", ids) : { data: [] },
      ids.length ? db.from("stage_reviews").select("stage_record_id, type, submitted_at").in("stage_record_id", ids) : { data: [] },
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const rows = records.map((r) => {
      const t = (tasks || []).filter((x) => x.context_id === r.id && x.status !== "Skipped");
      const submitted = new Set((reviews || []).filter((x) => x.stage_record_id === r.id && x.submitted_at).map((x) => x.type));
      let nextReview = null;
      if (!submitted.has("mid") && r.mid_review_date) nextReview = { type: "Mid-point", date: r.mid_review_date };
      else if (!submitted.has("final") && r.final_review_date) nextReview = { type: "Final", date: r.final_review_date };
      return {
        ...r,
        tasks: { done: t.filter((x) => x.status === "Done").length, total: t.length },
        reviewsSubmitted: [...submitted],
        nextReview,
        overdueReview: Boolean(nextReview && nextReview.date < today && r.status === "Active"),
      };
    });
    return NextResponse.json({ success: true, records: rows });
  } catch (err) {
    return serverError("Probation GET", err);
  }
}
