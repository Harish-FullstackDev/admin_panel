import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { balanceSummary, todayIso } from "@/lib/hcm/leave";
import { TASK_TEAMS } from "@/lib/hcm/onboarding";
import {
  ExitError, loadExit, exitAccess, exitReadiness, defaultLetters, fullNoticeEnd,
  decideResignation, decideSeparation, changeLastDay, cancelExit, applyExitChecklist, announceExitTask,
  submitInterview, updateSettlement, completeExit, REASONS, INTERVIEW_RATINGS, SETTLEMENT_STATUSES,
} from "@/lib/hcm/exit";

const TASK_SELECT = "*, assignee:internal_users!tasks_assignee_id_fkey(id, full_name)";

async function detail(id, user) {
  const { exitCase, employee } = await loadExit(id);
  const access = exitAccess(user, exitCase, employee);
  if (!access.view) throw new ExitError("Exit case not found.", 404);
  const db = createHcmAdminClient();
  const [{ data: tasks }, { data: approvals }, { data: letters }, { data: activity }, { data: reports }] = await Promise.all([
    db.from("tasks").select(TASK_SELECT).eq("context_type", "exit").eq("context_id", id).order("due_date"),
    db.from("approvals").select("*").eq("entity_type", "exit_case").eq("entity_id", id).order("created_at"),
    db.from("letters").select("id, type, title, issued_at").eq("exit_case_id", id).order("issued_at"),
    access.hr || access.chro
      ? db.from("audit_logs").select("id, action, actor_email, after, created_at").eq("entity_type", "exit_case").eq("entity_id", id).order("created_at", { ascending: false }).limit(50)
      : { data: [] },
    db.from("employees").select("id, full_name").eq("manager_id", employee.id).neq("status", "Exited"),
  ]);
  const people = [...new Set([exitCase.initiated_by, exitCase.accepted_by, exitCase.completed_by, exitCase.interview_by, ...(approvals || []).map((a) => a.decided_by)].filter(Boolean))];
  const { data: names } = people.length ? await db.from("internal_users").select("id, full_name").in("id", people) : { data: [] };
  const nameOf = Object.fromEntries((names || []).map((u) => [u.id, u.full_name]));

  const year = Number((exitCase.last_working_date || todayIso()).slice(0, 4));
  const balances = access.hr && employee.status !== "Exited" ? await balanceSummary(employee, year) : [];
  const { interview, ...rest } = exitCase;
  return {
    exitCase: { ...rest, interview: access.interview ? interview : null, full_notice_end: fullNoticeEnd(exitCase) },
    employee,
    tasks: tasks || [],
    approvals: (approvals || []).map((a) => ({ ...a, decided_by_name: nameOf[a.decided_by] || null })),
    names: nameOf,
    letters: letters || [],
    activity: activity || [],
    directReports: reports || [],
    balances,
    readiness: exitReadiness(exitCase, tasks || []),
    defaultLetters: defaultLetters(exitCase),
    access,
    reasons: REASONS,
    interviewQuestions: INTERVIEW_RATINGS,
    settlementStatuses: SETTLEMENT_STATUSES,
  };
}

export async function GET(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json({ success: true, ...(await detail(id, user)) });
  } catch (err) {
    if (err instanceof ExitError) return jsonError(err.message, err.status);
    return serverError("Exit GET", err);
  }
}

// POST { action }: accept | approve | reject | change_lwd | cancel | apply_checklist | add_task | interview | settlement | complete
export async function POST(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const { exitCase, employee } = await loadExit(id);
    const access = exitAccess(user, exitCase, employee);
    if (!access.view) return jsonError("Exit case not found.", 404);
    const body = await request.json();
    let extra = {};

    switch (body.action) {
      case "accept":
        await decideResignation(exitCase, employee, body, user, request);
        break;
      case "approve":
      case "reject":
        await decideSeparation(exitCase, employee, { decision: body.action, comment: body.comment }, user, request);
        break;
      case "change_lwd":
        await changeLastDay(exitCase, employee, body, user, request);
        break;
      case "cancel":
        await cancelExit(exitCase, employee, body.reason, user, request);
        break;
      case "apply_checklist":
        if (!access.hr) return jsonError("Only HR can do this.", 403);
        if (exitCase.status !== "In notice") return jsonError("Clearance starts once the exit is accepted.");
        extra = { created: (await applyExitChecklist(exitCase, employee, body.template_id || null, user)).length };
        break;
      case "add_task": {
        if (!access.hr) return jsonError("Only HR can do this.", 403);
        if (exitCase.status !== "In notice") return jsonError("Clearance tasks can only be added during the notice period.");
        const title = String(body.title || "").trim();
        if (!title) return jsonError("Task title is required.");
        const team = TASK_TEAMS.includes(body.team) ? body.team : "HR";
        const { data: task, error } = await createHcmAdminClient()
          .from("tasks")
          .insert({
            context_type: "exit",
            context_id: id,
            title,
            description: String(body.description || "").trim() || null,
            team,
            assignee_id: body.assignee_id || (team === "Manager" ? employee.manager_id : null) || null,
            due_date: body.due_date || exitCase.last_working_date,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        await announceExitTask(task, exitCase, employee);
        break;
      }
      case "interview":
        await submitInterview(exitCase, employee, body, user, request);
        break;
      case "settlement":
        await updateSettlement(exitCase, employee, body, user, request);
        break;
      case "complete": {
        const result = await completeExit(exitCase, employee, body, user, request);
        extra = { warnings: result.warnings };
        break;
      }
      default:
        return jsonError("Unknown action.");
    }
    return NextResponse.json({ success: true, ...extra, ...(await detail(id, user).catch(() => ({}))) });
  } catch (err) {
    if (err instanceof ExitError) return jsonError(err.message, err.status);
    return serverError("Exit POST", err);
  }
}
