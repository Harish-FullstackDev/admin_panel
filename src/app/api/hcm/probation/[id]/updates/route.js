import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { notifyUsers } from "@/lib/hcm/notify";
import { StageError, loadStage, weekStart } from "@/lib/hcm/stage";

// POST { summary, blockers?, next_week? }: the employee's update for the
// current week. Re-posting in the same week edits it until it is rated.
export async function POST(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const { record, employee } = await loadStage(id);
    if (employee.id !== user.id) return jsonError("Record not found.", 404);
    if (record.status === "Completed") return jsonError("This record is closed.");
    const body = await request.json();
    const summary = String(body.summary || "").trim();
    if (!summary) return jsonError("Tell us what you worked on this week.");

    const db = createHcmAdminClient();
    const week = weekStart();
    const { data: existing } = await db.from("stage_updates").select("id, mentor_rating").eq("stage_record_id", id).eq("week_start", week).maybeSingle();
    if (existing?.mentor_rating) return jsonError("This week's update has already been reviewed.");
    const row = { summary, blockers: String(body.blockers || "").trim() || null, next_week: String(body.next_week || "").trim() || null };
    const { data, error } = existing
      ? await db.from("stage_updates").update(row).eq("id", existing.id).select().single()
      : await db.from("stage_updates").insert({ ...row, stage_record_id: id, week_start: week }).select().single();
    if (error) throw error;

    if (!existing) {
      await notifyUsers([record.mentor_id, employee.manager_id].filter(Boolean), {
        title: `${employee.full_name} posted a weekly update`,
        body: summary.slice(0, 120),
        link: `/admin/dashboard/probation/${id}`,
      });
    }
    return NextResponse.json({ success: true, update: data, created: !existing }, { status: existing ? 200 : 201 });
  } catch (err) {
    if (err instanceof StageError) return jsonError(err.message, err.status);
    return serverError("Weekly update POST", err);
  }
}
