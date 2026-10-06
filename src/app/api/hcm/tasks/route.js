import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { loadStage, stageAccess, StageError } from "@/lib/hcm/stage";

const TASK_SELECT = "*, assignee:internal_users!tasks_assignee_id_fkey(id, full_name)";

// GET (default): tasks assigned to me. ?context=<joinerId|stageRecordId>: all tasks
// of that joiner (onboarding.manage) or stage record (HR, manager, mentor, employee).
// ?status=Open|Done|Skipped|all (default Open).
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const params = new URL(request.url).searchParams;
    const context = params.get("context");
    const status = params.get("status") || "Open";
    const db = createHcmAdminClient();

    let query = db.from("tasks").select(TASK_SELECT).order("due_date", { ascending: true, nullsFirst: false }).limit(500);
    if (context) {
      const { data: isJoiner } = await db.from("joiners").select("id").eq("id", context).maybeSingle();
      let allowed = Boolean(isJoiner) && hasPermission(user, "onboarding.manage");
      if (!isJoiner) {
        try {
          const { record, employee } = await loadStage(context);
          const access = stageAccess(user, record, employee);
          allowed = access.manage || access.review || access.self;
        } catch (err) {
          if (!(err instanceof StageError)) throw err;
        }
      }
      if (!allowed) return jsonError("You do not have permission to do this.", 403);
      query = query.eq("context_id", context);
    } else {
      query = query.eq("assignee_id", user.id);
    }
    if (status !== "all") query = query.eq("status", status);
    const { data: tasks, error } = await query;
    if (error) throw error;

    const joinerIds = [...new Set(tasks.filter((t) => t.context_type === "onboarding").map((t) => t.context_id))];
    const stageIds = [...new Set(tasks.filter((t) => t.context_type === "stage").map((t) => t.context_id))];
    const [{ data: joiners }, { data: stages }] = await Promise.all([
      joinerIds.length ? db.from("joiners").select("id, full_name, position, joining_date, status").in("id", joinerIds) : { data: [] },
      stageIds.length ? db.from("stage_records").select("id, type, status, end_date, employee_id, employees(full_name)").in("id", stageIds) : { data: [] },
    ]);
    const byId = Object.fromEntries([
      ...(joiners || []).map((j) => [j.id, { ...j, kind: "onboarding" }]),
      ...(stages || []).map((r) => [r.id, { id: r.id, kind: "stage", type: r.type, status: r.status, end_date: r.end_date, employee_id: r.employee_id, full_name: r.employees?.full_name }]),
    ]);
    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => ({ ...t, context: byId[t.context_id] || null })),
    });
  } catch (err) {
    return serverError("Tasks GET", err);
  }
}
