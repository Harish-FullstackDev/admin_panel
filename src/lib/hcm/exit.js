import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { hasPermission } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers, usersWithPermission, appUrl } from "@/lib/hcm/notify";
import { getWorkflowSteps, openApproval, pendingApproval, closeApproval, cancelPendingApprovals } from "@/lib/hcm/workflow";
import { addDays, TASK_TEAMS } from "@/lib/hcm/onboarding";
import { todayIso } from "@/lib/hcm/leave";
import { issueLetterFor } from "@/lib/hcm/letters";

// Calendar days of notice by stage. HR can shorten (with a reason) per case.
export const NOTICE_DAYS = { "Full-time": 60, Probation: 30, Intern: 15 };
export const OPEN = ["Pending manager", "Pending HR", "Pending approval", "In notice"];
export const EXIT_TYPES = ["Resignation", "Termination", "Release", "Contract end", "Retirement", "Other"];
export const HR_TYPES = ["Termination", "Contract end", "Retirement", "Other"];
export const SETTLEMENT_STATUSES = ["Pending", "Processing", "Paid", "Not applicable"];
export const LETTER_TYPES = ["relieving", "experience"];
export const REASONS = [
  "Better opportunity", "Higher studies", "Relocation", "Personal / family", "Health",
  "Compensation", "Work environment", "Career change", "Other",
];
export const INTERVIEW_RATINGS = [
  { key: "role", label: "The work itself" },
  { key: "manager", label: "Support from your manager" },
  { key: "growth", label: "Learning and growth" },
  { key: "compensation", label: "Pay and benefits" },
  { key: "culture", label: "Team and culture" },
  { key: "balance", label: "Work-life balance" },
];
const MAX_NOTICE_AHEAD = 180;
const RESIGNATION_STEPS = [
  { key: "manager_acceptance", permission: "exit.review", sla_days: 3 },
  { key: "hr_acceptance", permission: "exit.manage", sla_days: 3 },
];
const SEPARATION_STEPS = [{ key: "chro_approval", permission: "exit.approve", sla_days: 2 }];

export const EXIT_EMPLOYEE_SELECT =
  "id, full_name, official_email, personal_email, employee_code, designation, stage, status, employment_type, joining_date, last_working_date, manager_id, department_id, location_id, departments(name), manager:internal_users!employees_manager_id_fkey(id, full_name, email)";

export class ExitError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

export function noticeDaysFor(employee) {
  return NOTICE_DAYS[employee.stage] ?? NOTICE_DAYS["Full-time"];
}

export function defaultLastDay(employee, from = todayIso()) {
  return addDays(from, noticeDaysFor(employee));
}

/** Earliest last day that serves the full notice. */
export function fullNoticeEnd(c) {
  return addDays(String(c.submitted_at).slice(0, 10), c.notice_days);
}

async function resignationSteps() {
  const s = await getWorkflowSteps("resignation");
  return s.length >= 2 ? s : RESIGNATION_STEPS;
}

async function separationSteps() {
  const s = await getWorkflowSteps("separation");
  return s.length ? s : SEPARATION_STEPS;
}

export async function loadExit(id) {
  const db = createHcmAdminClient();
  const { data: exitCase } = await db.from("exit_cases").select("*").eq("id", id).maybeSingle();
  if (!exitCase) throw new ExitError("Exit case not found.", 404);
  const { data: employee } = await db.from("employees").select(EXIT_EMPLOYEE_SELECT).eq("id", exitCase.employee_id).single();
  return { exitCase, employee };
}

export async function openCaseFor(employeeId) {
  const { data } = await createHcmAdminClient().from("exit_cases").select("*").eq("employee_id", employeeId).in("status", OPEN).maybeSingle();
  return data || null;
}

export function exitAccess(user, c, employee) {
  const self = employee.id === user.id;
  const hr = hasPermission(user, "exit.manage");
  const chro = hasPermission(user, "exit.approve");
  const manager = c.manager_id === user.id || employee.manager_id === user.id;
  const reviewAll = user.permissions["exit.review"] === "all";
  return {
    self,
    hr: hr && !self,
    chro: chro && !self,
    manager: manager && !self,
    view: self || hr || chro || manager || reviewAll,
    interview: self || hr,
  };
}

function hrRecipients(excludeIds = []) {
  return usersWithPermission("exit.manage").then((list) => list.filter((u) => !excludeIds.includes(u.id)));
}

async function notifyHrPending(employee, c, managerName) {
  const hr = await hrRecipients([employee.id]);
  await notifyUsers(hr.map((u) => u.id), {
    title: `Resignation awaiting HR: ${employee.full_name}`,
    body: `Requested last day ${c.requested_last_day || "—"}`,
    link: "/admin/dashboard/approvals",
  });
  await queueEmail(
    "resignation_pending_hr",
    hr.map((u) => u.email),
    { employee_name: employee.full_name, manager_name: managerName, last_day: c.requested_last_day || "—", link: appUrl(`/admin/dashboard/exits/${c.id}`) },
    { entity: "exit_case", id: c.id }
  );
}

// ---------------------------------------------------------------------------
// Resignation
// ---------------------------------------------------------------------------
export async function submitResignation(employee, input, actor, request) {
  if (employee.status !== "Active") throw new ExitError("Only active employees can resign.");
  if (await openCaseFor(employee.id)) throw new ExitError("You already have an open resignation or exit.", 409);
  const category = String(input.reason_category || "").trim();
  if (!REASONS.includes(category)) throw new ExitError("Choose a reason for leaving.");
  const today = todayIso();
  const lastDay = input.requested_last_day ? String(input.requested_last_day).slice(0, 10) : defaultLastDay(employee, today);
  if (!isDate(lastDay)) throw new ExitError("Choose your preferred last working day.");
  if (lastDay < today) throw new ExitError("Your last working day can't be in the past.");
  if (daysBetween(today, lastDay) > MAX_NOTICE_AHEAD) throw new ExitError(`Your last working day must be within ${MAX_NOTICE_AHEAD} days.`);

  const managerId = employee.manager_id && employee.manager_id !== employee.id ? employee.manager_id : null;
  const db = createHcmAdminClient();
  const { data: created, error } = await db
    .from("exit_cases")
    .insert({
      employee_id: employee.id,
      type: "Resignation",
      status: managerId ? "Pending manager" : "Pending HR",
      reason_category: category,
      reason: String(input.reason || "").trim() || null,
      requested_last_day: lastDay,
      notice_days: noticeDaysFor(employee),
      manager_id: managerId,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new ExitError("You already have an open resignation or exit.", 409);
    throw error;
  }

  await openApproval("exit_case", created.id, managerId ? 0 : 1, await resignationSteps());
  await logAudit({ actor, action: "exit.resign", entityType: "exit_case", entityId: created.id, after: created, request });

  if (managerId) {
    await notifyUsers([managerId], { title: `${employee.full_name} has resigned`, body: `Requested last day ${lastDay}`, link: "/admin/dashboard/approvals" });
    if (employee.manager?.email) {
      await queueEmail(
        "resignation_submitted",
        employee.manager.email,
        { name: employee.manager.full_name, employee_name: employee.full_name, reason: [category, created.reason].filter(Boolean).join(": "), last_day: lastDay, link: appUrl("/admin/dashboard/approvals") },
        { entity: "exit_case", id: created.id }
      );
    }
  } else {
    await notifyHrPending(employee, created, "—");
  }
  return created;
}

/** Manager step then HR step. HR accepting at the manager step finalises on the manager's behalf. */
export async function decideResignation(c, employee, input, actor, request) {
  const access = exitAccess(actor, c, employee);
  if (access.self) throw new ExitError("You can't accept your own resignation.", 403);
  if (c.type !== "Resignation" || !["Pending manager", "Pending HR"].includes(c.status)) {
    throw new ExitError(`This exit is ${c.status.toLowerCase()}; nothing to accept.`);
  }
  const atManager = c.status === "Pending manager";
  if (atManager && !access.manager && !access.hr) throw new ExitError("Only the reporting manager or HR can accept this.", 403);
  if (!atManager && !access.hr) throw new ExitError("Waiting for HR acceptance.", 403);
  const comment = String(input.comment || "").trim();
  const approval = await pendingApproval("exit_case", c.id);
  const db = createHcmAdminClient();

  if (atManager && !access.hr) {
    if (approval) await closeApproval(approval, { status: "Approved", actor, comment });
    const { data: updated, error } = await db
      .from("exit_cases")
      .update({ status: "Pending HR", manager_comment: comment || null })
      .eq("id", c.id)
      .eq("status", c.status)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!updated) throw new ExitError("This exit was changed by someone else. Refresh and try again.", 409);
    await openApproval("exit_case", c.id, 1, await resignationSteps());
    await logAudit({ actor, action: "exit.manager_accept", entityType: "exit_case", entityId: c.id, before: { status: c.status }, after: { status: "Pending HR", comment: comment || null }, request });
    await notifyHrPending(employee, updated, actor.fullName || actor.email);
    return updated;
  }

  const lastDay = input.last_working_date ? String(input.last_working_date).slice(0, 10) : c.requested_last_day || defaultLastDay(employee, String(c.submitted_at).slice(0, 10));
  if (!isDate(lastDay)) throw new ExitError("Choose the last working day.");
  if (lastDay < todayIso()) throw new ExitError("The last working day can't be in the past.");
  const shortfall = String(input.shortfall_reason || "").trim();
  if (lastDay < fullNoticeEnd(c) && !shortfall) {
    throw new ExitError(`This is shorter than the ${c.notice_days}-day notice period (full notice ends ${fullNoticeEnd(c)}). Add a reason for the shortfall.`);
  }
  if (approval) {
    await closeApproval(approval, { status: "Approved", actor, comment: atManager ? `${comment ? `${comment} · ` : ""}Accepted by HR on behalf of the manager` : comment });
  }
  return activate(c, employee, lastDay, { hr_comment: comment || null, shortfall_reason: lastDay < fullNoticeEnd(c) ? shortfall : null }, actor, request, "resignation_accepted");
}

/** Moves an accepted case into the notice period and starts clearance. */
async function activate(c, employee, lastDay, fields, actor, request, emailCode) {
  const db = createHcmAdminClient();
  const { data: updated, error } = await db
    .from("exit_cases")
    .update({ status: "In notice", last_working_date: lastDay, accepted_by: actor.id, accepted_at: new Date().toISOString(), ...fields })
    .eq("id", c.id)
    .eq("status", c.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ExitError("This exit was changed by someone else. Refresh and try again.", 409);

  const before = { status: employee.status, last_working_date: employee.last_working_date ?? null };
  const after = { status: "Notice", last_working_date: lastDay };
  const { error: empErr } = await db.from("employees").update(after).eq("id", employee.id);
  if (empErr) throw empErr;
  await db.from("employee_events").insert({
    employee_id: employee.id,
    type: "resign",
    before,
    after: { ...after, exit_type: c.type },
    note: c.type === "Resignation" ? `Resignation accepted. Last working day ${lastDay}.` : `${c.type}. Last working day ${lastDay}.`,
    actor_id: actor.id,
  });
  await logAudit({ actor, action: "exit.accept", entityType: "exit_case", entityId: c.id, before: { status: c.status }, after: { status: "In notice", last_working_date: lastDay, ...fields }, request });

  try {
    await applyExitChecklist(updated, { ...employee, ...after }, null, actor);
  } catch (err) {
    console.error("Applying the exit checklist failed:", err);
  }

  const link = appUrl("/admin/dashboard/resignation");
  await notifyUsers([employee.id], {
    title: c.type === "Resignation" ? "Your resignation was accepted" : "Notice of separation",
    body: `Last working day ${lastDay}`,
    link: "/admin/dashboard/resignation",
  });
  await queueEmail(emailCode, employee.official_email, { name: employee.full_name, last_day: lastDay, link }, { entity: "exit_case", id: c.id });
  if (c.type === "Resignation") {
    await queueEmail("exit_interview_request", employee.official_email, { name: employee.full_name, last_day: lastDay, link }, { entity: "exit_case", id: c.id });
  }
  return updated;
}

export async function withdrawResignation(c, employee, actor, request) {
  if (employee.id !== actor.id) throw new ExitError("Only the employee can withdraw their resignation.", 403);
  if (c.type !== "Resignation" || !["Pending manager", "Pending HR"].includes(c.status)) {
    throw new ExitError("Your resignation has already been accepted. Talk to HR to cancel it.");
  }
  const { data: updated, error } = await createHcmAdminClient()
    .from("exit_cases")
    .update({ status: "Withdrawn" })
    .eq("id", c.id)
    .eq("status", c.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ExitError("This exit was changed by someone else. Refresh and try again.", 409);
  await cancelPendingApprovals("exit_case", c.id);
  await logAudit({ actor, action: "exit.withdraw", entityType: "exit_case", entityId: c.id, before: { status: c.status }, after: { status: "Withdrawn" }, request });

  const recipients = [];
  if (employee.manager) recipients.push(employee.manager);
  if (c.status === "Pending HR") recipients.push(...(await hrRecipients([employee.id])));
  const unique = [...new Map(recipients.map((u) => [u.id, u])).values()];
  await notifyUsers(unique.map((u) => u.id), { title: `${employee.full_name} withdrew their resignation`, link: "/admin/dashboard/exits" });
  for (const u of unique) {
    await queueEmail("resignation_withdrawn", u.email, { name: u.full_name, employee_name: employee.full_name }, { entity: "exit_case", id: c.id });
  }
  return updated;
}

// ---------------------------------------------------------------------------
// HR-initiated separation (CHRO approval) and probation release
// ---------------------------------------------------------------------------
export async function initiateSeparation(employee, input, actor, request) {
  if (employee.id === actor.id) throw new ExitError("You can't start a separation for yourself.", 403);
  if (employee.status !== "Active") throw new ExitError(`This employee is ${employee.status.toLowerCase()}.`);
  if (await openCaseFor(employee.id)) throw new ExitError("This employee already has an open exit.", 409);
  const type = input.type;
  if (!HR_TYPES.includes(type)) throw new ExitError("Choose the type of separation.");
  const lastDay = String(input.last_working_date || "").slice(0, 10);
  if (!isDate(lastDay)) throw new ExitError("Choose the last working day.");
  if (lastDay < todayIso()) throw new ExitError("The last working day can't be in the past.");
  const reason = String(input.reason || "").trim();
  if (!reason) throw new ExitError("Add the reason for the separation.");

  const db = createHcmAdminClient();
  const { data: created, error } = await db
    .from("exit_cases")
    .insert({
      employee_id: employee.id,
      type,
      status: "Pending approval",
      reason,
      requested_last_day: lastDay,
      notice_days: noticeDaysFor(employee),
      manager_id: employee.manager_id || null,
      initiated_by: actor.id,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new ExitError("This employee already has an open exit.", 409);
    throw error;
  }
  await openApproval("exit_case", created.id, 0, await separationSteps());
  await logAudit({ actor, action: "exit.initiate", entityType: "exit_case", entityId: created.id, after: created, request });

  const approvers = (await usersWithPermission("exit.approve")).filter((u) => u.id !== actor.id && u.id !== employee.id);
  await notifyUsers(approvers.map((u) => u.id), { title: `Approval needed: ${type} for ${employee.full_name}`, body: `Last working day ${lastDay}`, link: "/admin/dashboard/approvals" });
  await queueEmail(
    "separation_pending",
    approvers.map((u) => u.email),
    { initiator_name: actor.fullName || actor.email, type, employee_name: employee.full_name, last_day: lastDay, reason, link: appUrl(`/admin/dashboard/exits/${created.id}`) },
    { entity: "exit_case", id: created.id }
  );
  return created;
}

export async function decideSeparation(c, employee, { decision, comment }, actor, request) {
  const access = exitAccess(actor, c, employee);
  if (c.status !== "Pending approval") throw new ExitError("Nothing is waiting for approval.");
  if (!access.chro) throw new ExitError("Only the CHRO can approve a separation.", 403);
  if (c.initiated_by === actor.id) throw new ExitError("You can't approve a separation you started.", 403);
  if (!["approve", "reject"].includes(decision)) throw new ExitError("Unknown decision.");
  const text = String(comment || "").trim();
  if (decision === "reject" && !text) throw new ExitError("Add a reason for rejecting.");

  const approval = await pendingApproval("exit_case", c.id);
  if (approval) await closeApproval(approval, { status: decision === "approve" ? "Approved" : "Rejected", actor, comment: text });

  if (decision === "approve") {
    const lastDay = c.requested_last_day < todayIso() ? todayIso() : c.requested_last_day;
    return activate(c, employee, lastDay, { hr_comment: text || null }, actor, request, "separation_notice");
  }

  const { data: updated, error } = await createHcmAdminClient()
    .from("exit_cases")
    .update({ status: "Cancelled", cancel_reason: `Not approved: ${text}` })
    .eq("id", c.id)
    .eq("status", c.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ExitError("This exit was changed by someone else. Refresh and try again.", 409);
  await logAudit({ actor, action: "exit.reject", entityType: "exit_case", entityId: c.id, before: { status: c.status }, after: { status: "Cancelled", comment: text }, request });
  if (c.initiated_by) {
    await notifyUsers([c.initiated_by], { title: `${c.type} for ${employee.full_name} was not approved`, body: text, link: `/admin/dashboard/exits/${c.id}` });
  }
  return updated;
}

/** Probation/internship release (already CHRO-approved): open the case straight into notice. */
export async function openReleaseCase(employee, record, lastDay, note, actor) {
  if (await openCaseFor(employee.id)) return null;
  const { data: created, error } = await createHcmAdminClient()
    .from("exit_cases")
    .insert({
      employee_id: employee.id,
      type: "Release",
      status: "In notice",
      reason: note || null,
      requested_last_day: lastDay,
      last_working_date: lastDay,
      notice_days: 0,
      manager_id: employee.manager_id || null,
      stage_record_id: record.id,
      accepted_by: actor.id,
      accepted_at: new Date().toISOString(),
      initiated_by: actor.id,
    })
    .select()
    .single();
  if (error) throw error;
  await logAudit({ actor, action: "exit.release", entityType: "exit_case", entityId: created.id, after: created });
  await applyExitChecklist(created, employee, null, actor);
  return created;
}

// ---------------------------------------------------------------------------
// Notice-period changes
// ---------------------------------------------------------------------------
function requireHr(access) {
  if (!access.hr) throw new ExitError("Only HR can do this.", 403);
}

export async function changeLastDay(c, employee, { last_working_date, reason }, actor, request) {
  requireHr(exitAccess(actor, c, employee));
  if (c.status !== "In notice") throw new ExitError("The last working day can only change during the notice period.");
  const lastDay = String(last_working_date || "").slice(0, 10);
  if (!isDate(lastDay)) throw new ExitError("Choose the last working day.");
  if (lastDay < todayIso()) throw new ExitError("The last working day can't be in the past.");
  if (lastDay === c.last_working_date) throw new ExitError("That is already the last working day.");
  const text = String(reason || "").trim();
  if (!text) throw new ExitError("Add a reason for the change.");
  const shortfall = c.type === "Resignation" && lastDay < fullNoticeEnd(c);

  const db = createHcmAdminClient();
  const { data: updated, error } = await db
    .from("exit_cases")
    .update({ last_working_date: lastDay, reminded_at: null, ...(shortfall ? { shortfall_reason: text } : {}) })
    .eq("id", c.id)
    .eq("status", c.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ExitError("This exit was changed by someone else. Refresh and try again.", 409);
  await db.from("employees").update({ last_working_date: lastDay }).eq("id", employee.id);

  const delta = daysBetween(c.last_working_date, lastDay);
  const { data: open } = await db.from("tasks").select("id, due_date").eq("context_type", "exit").eq("context_id", c.id).eq("status", "Open");
  for (const t of open || []) {
    if (t.due_date) await db.from("tasks").update({ due_date: addDays(t.due_date, delta) }).eq("id", t.id);
  }
  await logAudit({ actor, action: "exit.change_lwd", entityType: "exit_case", entityId: c.id, before: { last_working_date: c.last_working_date }, after: { last_working_date: lastDay, reason: text }, request });
  await notifyUsers([employee.id], { title: "Your last working day changed", body: `New last working day: ${lastDay}`, link: "/admin/dashboard/resignation" });
  return updated;
}

export async function cancelExit(c, employee, reason, actor, request) {
  requireHr(exitAccess(actor, c, employee));
  if (!OPEN.includes(c.status)) throw new ExitError(`This exit is already ${c.status.toLowerCase()}.`);
  const text = String(reason || "").trim();
  if (!text) throw new ExitError("Add a reason for cancelling.");
  const db = createHcmAdminClient();
  const { data: updated, error } = await db
    .from("exit_cases")
    .update({ status: "Cancelled", cancel_reason: text })
    .eq("id", c.id)
    .eq("status", c.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ExitError("This exit was changed by someone else. Refresh and try again.", 409);
  await cancelPendingApprovals("exit_case", c.id);
  await db.from("tasks").update({ status: "Skipped", completed_by: actor.id, completed_at: new Date().toISOString() }).eq("context_type", "exit").eq("context_id", c.id).eq("status", "Open");

  if (c.status === "In notice") {
    await db.from("employees").update({ status: "Active", last_working_date: null }).eq("id", employee.id);
    await db.from("employee_events").insert({
      employee_id: employee.id,
      type: "exit_cancel",
      before: { status: employee.status, last_working_date: employee.last_working_date ?? null },
      after: { status: "Active", last_working_date: null },
      note: text,
      actor_id: actor.id,
    });
    await queueEmail("exit_cancelled", employee.official_email, { name: employee.full_name, reason: text }, { entity: "exit_case", id: c.id });
  }
  await logAudit({ actor, action: "exit.cancel", entityType: "exit_case", entityId: c.id, before: { status: c.status }, after: { status: "Cancelled", reason: text }, request });
  if (c.type === "Resignation" || c.status === "In notice") {
    await notifyUsers([employee.id], { title: "Your exit was cancelled", body: text, link: "/admin/dashboard/resignation" });
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Clearance checklist
// ---------------------------------------------------------------------------
async function emailExitTasks(tasks, c, employee) {
  const ids = [...new Set(tasks.map((t) => t.assignee_id).filter(Boolean))];
  if (!ids.length) return;
  const { data: users } = await createHcmAdminClient().from("internal_users").select("id, full_name, email").in("id", ids);
  const byId = Object.fromEntries((users || []).map((u) => [u.id, u]));
  for (const task of tasks) {
    const user = byId[task.assignee_id];
    if (!user) continue;
    await notifyUsers([user.id], {
      title: `Exit clearance: ${task.title}`,
      body: `${employee.full_name} leaves on ${c.last_working_date}. Due ${task.due_date || "—"}.`,
      link: "/admin/dashboard/tasks",
    });
    await queueEmail(
      "exit_task_assigned",
      user.email,
      { name: user.full_name, employee_name: employee.full_name, last_day: c.last_working_date, task_title: task.title, due_date: task.due_date || "—", link: appUrl("/admin/dashboard/tasks") },
      { entity: "task", id: task.id }
    );
  }
}

export async function announceExitTask(task, c, employee) {
  await emailExitTasks([task], c, employee);
}

/** Creates clearance tasks from an exit checklist (due dates relative to the last day). */
export async function applyExitChecklist(c, employee, templateId, actor) {
  if (!c.last_working_date) throw new ExitError("Set the last working day first.");
  const db = createHcmAdminClient();
  let template = null;
  if (templateId) {
    ({ data: template } = await db.from("checklist_templates").select("*").eq("id", templateId).eq("purpose", "exit").eq("archived", false).maybeSingle());
    if (!template) throw new ExitError("Checklist template not found.", 404);
  } else {
    const { data: list } = await db.from("checklist_templates").select("*").eq("purpose", "exit").eq("archived", false);
    template = (list || []).find((t) => t.is_default) || (list || [])[0] || null;
    if (!template) return [];
  }
  const rows = (template.items || [])
    .filter((item) => item?.title)
    .map((item) => {
      const team = TASK_TEAMS.includes(item.team) ? item.team : "HR";
      return {
        context_type: "exit",
        context_id: c.id,
        title: item.title,
        description: item.description || null,
        team,
        assignee_id: item.assignee_id || (team === "Manager" ? employee.manager_id || null : null),
        due_date: addDays(c.last_working_date, item.due_offset_days),
        created_by: actor?.id ?? null,
      };
    });
  if (!rows.length) return [];
  const { data: tasks, error } = await db.from("tasks").insert(rows).select();
  if (error) throw error;
  await emailExitTasks(tasks, c, employee);
  return tasks;
}

// ---------------------------------------------------------------------------
// Exit interview and settlement
// ---------------------------------------------------------------------------
export async function submitInterview(c, employee, answers, actor, request) {
  const access = exitAccess(actor, c, employee);
  if (!access.self && !access.hr) throw new ExitError("Only the employee or HR can record the exit interview.", 403);
  if (c.status !== "In notice") throw new ExitError("The exit interview opens once the exit is accepted.");
  if (c.interview_submitted_at && access.self) throw new ExitError("You've already submitted your exit interview.");

  const ratings = {};
  for (const q of INTERVIEW_RATINGS) {
    const n = Number(answers?.ratings?.[q.key]);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new ExitError(`Rate "${q.label}" from 1 to 5.`);
    ratings[q.key] = n;
  }
  for (const key of ["would_recommend", "would_rejoin"]) {
    if (typeof answers?.[key] !== "boolean") throw new ExitError("Answer every yes / no question.");
  }
  const primary = String(answers.primary_reason || "").trim();
  if (!REASONS.includes(primary)) throw new ExitError("Choose the main reason for leaving.");
  const interview = {
    ratings,
    primary_reason: primary,
    would_recommend: answers.would_recommend,
    would_rejoin: answers.would_rejoin,
    liked: String(answers.liked || "").trim() || null,
    improve: String(answers.improve || "").trim() || null,
    recorded_by_hr: !access.self,
  };

  const db = createHcmAdminClient();
  const { data: updated, error } = await db
    .from("exit_cases")
    .update({ interview, interview_submitted_at: new Date().toISOString(), interview_by: actor.id })
    .eq("id", c.id)
    .select()
    .single();
  if (error) throw error;
  await db
    .from("tasks")
    .update({ status: "Done", completed_by: actor.id, completed_at: new Date().toISOString() })
    .eq("context_type", "exit")
    .eq("context_id", c.id)
    .eq("status", "Open")
    .ilike("title", "exit interview");
  // Answers are confidential: the audit row records only that it happened.
  await logAudit({ actor, action: "exit.interview", entityType: "exit_case", entityId: c.id, after: { recorded_by_hr: interview.recorded_by_hr }, request });
  return updated;
}

export async function updateSettlement(c, employee, input, actor, request) {
  requireHr(exitAccess(actor, c, employee));
  if (["Withdrawn", "Cancelled"].includes(c.status)) throw new ExitError(`This exit is ${c.status.toLowerCase()}.`);
  const update = {};
  if ("settlement_status" in input) {
    if (!SETTLEMENT_STATUSES.includes(input.settlement_status)) throw new ExitError("Invalid settlement status.");
    update.settlement_status = input.settlement_status;
  }
  if ("settlement_amount" in input) {
    const raw = input.settlement_amount;
    if (raw === null || raw === "") update.settlement_amount = null;
    else {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new ExitError("Enter the settlement amount as a number.");
      update.settlement_amount = Math.round(n * 100) / 100;
    }
  }
  if ("settlement_paid_on" in input) {
    const d = input.settlement_paid_on ? String(input.settlement_paid_on).slice(0, 10) : null;
    if (d && !isDate(d)) throw new ExitError("Invalid paid-on date.");
    update.settlement_paid_on = d;
  }
  if ("settlement_note" in input) update.settlement_note = String(input.settlement_note || "").trim() || null;
  const status = update.settlement_status ?? c.settlement_status;
  if (status === "Paid" && !(update.settlement_paid_on ?? c.settlement_paid_on)) throw new ExitError("Add the date the settlement was paid.");
  if (!Object.keys(update).length) throw new ExitError("Nothing to update.");

  const { data: updated, error } = await createHcmAdminClient().from("exit_cases").update(update).eq("id", c.id).select().single();
  if (error) throw error;
  const before = Object.fromEntries(Object.keys(update).map((k) => [k, c[k] ?? null]));
  await logAudit({ actor, action: "exit.settlement", entityType: "exit_case", entityId: c.id, before, after: update, request });
  return updated;
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------
export function exitReadiness(c, tasks = []) {
  const today = todayIso();
  const lwdReached = Boolean(c.last_working_date) && c.last_working_date <= today;
  const tasksOpen = tasks.filter((t) => t.status === "Open").length;
  const blockers = [];
  if (c.status !== "In notice") blockers.push(`The exit is ${c.status.toLowerCase()}`);
  if (!lwdReached) blockers.push(c.last_working_date ? `Last working day is ${c.last_working_date}` : "No last working day set");
  if (tasksOpen) blockers.push(`${tasksOpen} clearance task(s) still open`);
  return { lwdReached, tasksOpen, tasksTotal: tasks.length, blockers, ready: blockers.length === 0 };
}

export function defaultLetters(c) {
  return ["Termination", "Release"].includes(c.type) ? ["relieving"] : ["relieving", "experience"];
}

export async function completeExit(c, employee, input, actor, request) {
  requireHr(exitAccess(actor, c, employee));
  const db = createHcmAdminClient();
  const { data: tasks } = await db.from("tasks").select("id, status").eq("context_type", "exit").eq("context_id", c.id);
  const readiness = exitReadiness(c, tasks || []);
  if (!readiness.ready) throw new ExitError(`Can't complete yet: ${readiness.blockers.join("; ")}.`);
  const letters = Array.isArray(input.letters) ? input.letters.filter((l) => LETTER_TYPES.includes(l)) : defaultLetters(c);
  const deactivate = input.deactivate !== false;
  const now = new Date().toISOString();

  const { data: updated, error } = await db
    .from("exit_cases")
    .update({ status: "Completed", completed_at: now, completed_by: actor.id })
    .eq("id", c.id)
    .eq("status", c.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ExitError("This exit was changed by someone else. Refresh and try again.", 409);

  const { error: empErr } = await db.from("employees").update({ status: "Exited" }).eq("id", employee.id);
  if (empErr) throw empErr;
  await db.from("employee_events").insert({
    employee_id: employee.id,
    type: "exit",
    effective_date: c.last_working_date,
    before: { status: employee.status },
    after: { status: "Exited", exit_type: c.type },
    note: `${c.type}. Last working day ${c.last_working_date}.`,
    actor_id: actor.id,
  });

  const issued = [];
  const vars = {
    last_day: c.last_working_date,
    joining_date: employee.joining_date,
    department_clause: employee.departments?.name ? ` in the ${employee.departments.name} department` : "",
    tenure_type: employee.stage === "Intern" ? "internship" : "employment",
  };
  for (const type of letters) issued.push(await issueLetterFor(employee, type, vars, { exitCaseId: c.id }, actor));

  // Leave that would fall after the last day no longer applies.
  const { data: stale } = await db
    .from("leave_requests")
    .select("id")
    .eq("employee_id", employee.id)
    .in("status", ["Pending manager", "Pending HR", "Approved"])
    .gt("end_date", c.last_working_date);
  for (const r of stale || []) {
    await db.from("leave_requests").update({ status: "Cancelled", cancel_reason: "Employee exited", cancelled_by: actor.id }).eq("id", r.id);
    await cancelPendingApprovals("leave_request", r.id);
  }

  const warnings = [];
  if (deactivate) {
    const { data: superAdmin } = await db.from("user_roles").select("role_code").eq("user_id", employee.id).eq("role_code", "super_admin").maybeSingle();
    if (superAdmin) {
      warnings.push("Portal access was kept because this person is a Super Admin. Deactivate them from Users.");
    } else {
      const { error: banErr } = await db.auth.admin.updateUserById(employee.id, { ban_duration: "876000h" });
      if (banErr) warnings.push(`Could not block sign-in: ${banErr.message}`);
      else await db.from("internal_users").update({ status: "Deactivated" }).eq("id", employee.id);
    }
  }
  const { data: reports } = await db.from("employees").select("id, full_name").eq("manager_id", employee.id).neq("status", "Exited");
  if (reports?.length) warnings.push(`${reports.length} employee(s) still report to ${employee.full_name}: ${reports.map((r) => r.full_name).join(", ")}. Assign a new manager.`);

  await logAudit({
    actor,
    action: "exit.complete",
    entityType: "exit_case",
    entityId: c.id,
    before: { status: c.status, employee_status: employee.status },
    after: { status: "Completed", employee_status: "Exited", letters, deactivated: deactivate && !warnings.some((w) => w.startsWith("Portal access") || w.startsWith("Could not")) },
    request,
  });
  await queueEmail(
    "exit_completed",
    [employee.personal_email, employee.official_email],
    { name: employee.full_name, last_day: c.last_working_date, letters: issued.map((l) => `--- ${l.title} ---\n\n${l.body}`).join("\n\n") },
    { entity: "exit_case", id: c.id }
  );
  return { exitCase: updated, letters: issued, warnings };
}

/** Lazy reminder: HR hears once when an exit is a week out with clearance still open. */
export async function remindExits() {
  try {
    const db = createHcmAdminClient();
    const horizon = addDays(todayIso(), 7);
    const { data: due } = await db
      .from("exit_cases")
      .select("id, last_working_date, employees(full_name)")
      .eq("status", "In notice")
      .is("reminded_at", null)
      .lte("last_working_date", horizon);
    if (!due?.length) return;
    const { data: open } = await db.from("tasks").select("context_id").eq("context_type", "exit").eq("status", "Open").in("context_id", due.map((c) => c.id));
    const counts = {};
    for (const t of open || []) counts[t.context_id] = (counts[t.context_id] || 0) + 1;
    const hr = await usersWithPermission("exit.manage");
    for (const c of due) {
      await db.from("exit_cases").update({ reminded_at: new Date().toISOString() }).eq("id", c.id);
      if (!counts[c.id]) continue;
      await notifyUsers(hr.map((u) => u.id), {
        title: `${c.employees?.full_name} leaves on ${c.last_working_date}`,
        body: `${counts[c.id]} clearance task(s) still open.`,
        link: `/admin/dashboard/exits/${c.id}`,
      });
    }
  } catch (err) {
    console.error("remindExits failed:", err);
  }
}
