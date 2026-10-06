import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";

const TASK_SELECT = "*, assignee:internal_users!tasks_assignee_id_fkey(id, full_name)";

// GET ?mine=1 (default): tasks assigned to me. ?context=<joinerId> needs onboarding.manage.
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
      if (!hasPermission(user, "onboarding.manage")) return jsonError("You do not have permission to do this.", 403);
      query = query.eq("context_id", context);
    } else {
      query = query.eq("assignee_id", user.id);
    }
    if (status !== "all") query = query.eq("status", status);
    const { data: tasks, error } = await query;
    if (error) throw error;

    const joinerIds = [...new Set(tasks.filter((t) => t.context_type === "onboarding").map((t) => t.context_id))];
    const { data: joiners } = joinerIds.length
      ? await db.from("joiners").select("id, full_name, position, joining_date, status").in("id", joinerIds)
      : { data: [] };
    const byId = Object.fromEntries((joiners || []).map((j) => [j.id, j]));
    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => ({ ...t, context: byId[t.context_id] || null })),
    });
  } catch (err) {
    return serverError("Tasks GET", err);
  }
}
