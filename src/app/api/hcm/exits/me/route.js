import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { getEmployeeForUser } from "@/lib/hcm/employees";
import {
  ExitError, OPEN, REASONS, INTERVIEW_RATINGS, noticeDaysFor, defaultLastDay,
  submitResignation, withdrawResignation, submitInterview,
} from "@/lib/hcm/exit";

const SELF_FIELDS = [
  "id", "type", "status", "manager_id", "reason_category", "reason", "submitted_at", "requested_last_day", "notice_days",
  "last_working_date", "accepted_at", "interview_submitted_at", "settlement_status", "completed_at", "cancel_reason",
];

async function load(user) {
  const employee = await getEmployeeForUser(user.id);
  if (!employee) return { error: jsonError("You don't have an employee record yet.") };
  const db = createHcmAdminClient();
  const { data: recent } = await db.from("exit_cases").select("*").eq("employee_id", user.id).order("created_at", { ascending: false }).limit(10);
  // HR-initiated separations stay private until the CHRO approves them.
  const hidden = (c) => c.initiated_by && !c.accepted_at;
  const latest = (recent || []).find((c) => !hidden(c)) || null;
  const pendingPrivate = (recent || []).some((c) => hidden(c) && OPEN.includes(c.status));
  return { employee, latest, pendingPrivate };
}

// GET: my latest exit case (if any), notice-period defaults, clearance progress and letters.
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { employee, latest, pendingPrivate, error } = await load(user);
    if (error) return error;
    const db = createHcmAdminClient();
    const [{ data: tasks }, { data: steps }, { data: letters }] = latest
      ? await Promise.all([
          db.from("tasks").select("id, title, team, status, due_date").eq("context_type", "exit").eq("context_id", latest.id).order("due_date"),
          db.from("approvals").select("step, step_key, status, decided_at").eq("entity_type", "exit_case").eq("entity_id", latest.id).order("step"),
          db.from("letters").select("id, type, title, issued_at").eq("exit_case_id", latest.id).order("issued_at"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];
    const open = latest && OPEN.includes(latest.status);
    return NextResponse.json({
      success: true,
      exitCase: latest ? { ...Object.fromEntries(SELF_FIELDS.map((k) => [k, latest[k] ?? null])), interview: latest.interview_submitted_at ? latest.interview : null } : null,
      tasks: tasks || [],
      steps: steps || [],
      letters: letters || [],
      canSubmit: !open && !pendingPrivate && employee.status === "Active",
      hasManager: Boolean(employee.manager_id && employee.manager_id !== employee.id),
      noticeDays: noticeDaysFor(employee),
      defaultLastDay: defaultLastDay(employee),
      stage: employee.stage,
      reasons: REASONS,
      interviewQuestions: INTERVIEW_RATINGS,
    });
  } catch (err) {
    return serverError("Exit me GET", err);
  }
}

// POST { action: "submit", reason_category, reason, requested_last_day } | { action: "withdraw" } | { action: "interview", ...answers }
export async function POST(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { employee, latest, pendingPrivate, error } = await load(user);
    if (error) return error;
    const body = await request.json();
    if (pendingPrivate && body.action === "submit") return jsonError("You can't resign right now. Please talk to HR.", 409);
    if (body.action === "submit") {
      const created = await submitResignation(employee, body, user, request);
      return NextResponse.json({ success: true, exitCase: created }, { status: 201 });
    }
    if (!latest || !OPEN.includes(latest.status)) return jsonError("You don't have an open exit.");
    if (body.action === "withdraw") {
      await withdrawResignation(latest, employee, user, request);
      return NextResponse.json({ success: true });
    }
    if (body.action === "interview") {
      await submitInterview(latest, employee, body, user, request);
      return NextResponse.json({ success: true });
    }
    return jsonError("Unknown action.");
  } catch (err) {
    if (err instanceof ExitError) return jsonError(err.message, err.status);
    return serverError("Exit me POST", err);
  }
}
