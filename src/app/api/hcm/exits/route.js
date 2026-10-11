import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { ExitError, EXIT_EMPLOYEE_SELECT, initiateSeparation } from "@/lib/hcm/exit";

const GROUPS = {
  action: ["Pending manager", "Pending HR", "Pending approval"],
  notice: ["In notice"],
  completed: ["Completed"],
  closed: ["Withdrawn", "Cancelled"],
};
const LIST_FIELDS =
  "id, employee_id, type, status, reason_category, submitted_at, requested_last_day, notice_days, last_working_date, manager_id, initiated_by, interview_submitted_at, settlement_status, completed_at, employees(id, full_name, employee_code, designation, stage, manager_id, departments(name))";

function myAction(user, c) {
  if (c.employee_id === user.id) return false;
  const hr = hasPermission(user, "exit.manage");
  const isManager = c.manager_id === user.id || c.employees?.manager_id === user.id;
  if (c.status === "Pending manager") return isManager || hr;
  if (c.status === "Pending HR") return hr;
  if (c.status === "Pending approval") return hasPermission(user, "exit.approve") && c.initiated_by !== user.id;
  return false;
}

// GET ?group=action|notice|completed|closed|all. HR / CHRO see everyone; managers their team.
export async function GET(request) {
  const auth = await requirePermission(request, ["exit.manage", "exit.review", "exit.approve"]);
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    const group = new URL(request.url).searchParams.get("group") || "action";
    const db = createHcmAdminClient();
    let query = db.from("exit_cases").select(LIST_FIELDS).order("created_at", { ascending: false }).limit(500);
    if (GROUPS[group]) query = query.in("status", GROUPS[group]);
    const { data, error } = await query;
    if (error) throw error;

    const all = hasPermission(user, "exit.manage") || hasPermission(user, "exit.approve") || user.permissions["exit.review"] === "all";
    const cases = (data || []).filter((c) => all || c.manager_id === user.id || c.employees?.manager_id === user.id);

    const ids = cases.map((c) => c.id);
    const { data: tasks } = ids.length ? await db.from("tasks").select("context_id, status").eq("context_type", "exit").in("context_id", ids) : { data: [] };
    const progress = {};
    for (const t of tasks || []) {
      progress[t.context_id] ??= { done: 0, total: 0 };
      progress[t.context_id].total += 1;
      if (t.status !== "Open") progress[t.context_id].done += 1;
    }
    return NextResponse.json({
      success: true,
      scope: all ? "all" : "team",
      canManage: hasPermission(user, "exit.manage"),
      exits: cases.map((c) => ({ ...c, clearance: progress[c.id] || { done: 0, total: 0 }, myAction: myAction(user, c) })),
    });
  } catch (err) {
    return serverError("Exits GET", err);
  }
}

// POST { employee_id, type, last_working_date, reason }: HR starts a separation (needs CHRO approval).
export async function POST(request) {
  const auth = await requirePermission(request, "exit.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { data: employee } = await createHcmAdminClient().from("employees").select(EXIT_EMPLOYEE_SELECT).eq("id", body.employee_id || "").maybeSingle();
    if (!employee) return jsonError("Employee not found.", 404);
    const created = await initiateSeparation(employee, body, auth.user, request);
    return NextResponse.json({ success: true, exitCase: created }, { status: 201 });
  } catch (err) {
    if (err instanceof ExitError) return jsonError(err.message, err.status);
    return serverError("Exits POST", err);
  }
}
