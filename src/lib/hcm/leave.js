import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { hasPermission } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers, usersWithPermission, appUrl } from "@/lib/hcm/notify";
import { getWorkflowSteps, openApproval, pendingApproval, closeApproval, cancelPendingApprovals } from "@/lib/hcm/workflow";

// Work week is Sunday-Thursday; Friday (5) and Saturday (6) are off.
export const WEEKEND = [5, 6];
export const PENDING = ["Pending manager", "Pending HR"];
const FALLBACK_STEPS = [
  { key: "manager_approval", permission: "leave.approve", sla_days: 2 },
  { key: "hr_approval", permission: "leave.manage", sla_days: 2 },
];

export class LeaveError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(`${String(s).slice(0, 10)}T00:00:00Z`);

export function todayIso(tz = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function isWeekend(date) {
  return WEEKEND.includes(parse(date).getUTCDay());
}

export function eachDay(start, end) {
  const out = [];
  for (let d = parse(start); d <= parse(end); d.setUTCDate(d.getUTCDate() + 1)) out.push(iso(d));
  return out;
}

/** Non-optional holidays for all locations plus the given one, keyed by date. */
export async function holidayMap(from, to, locationId) {
  let query = createHcmAdminClient().from("holidays").select("date, name, location_id, optional").gte("date", from).lte("date", to).eq("optional", false);
  query = locationId ? query.or(`location_id.is.null,location_id.eq.${locationId}`) : query.is("location_id", null);
  const { data } = await query;
  return Object.fromEntries((data || []).map((h) => [h.date, h.name]));
}

/** Working days in the range, minus half days. */
export function countLeaveDays({ start, end, startHalf, endHalf }, holidays = {}) {
  const working = eachDay(start, end).filter((d) => !isWeekend(d) && !holidays[d]);
  let days = working.length;
  if (!days) return 0;
  if (startHalf && working.includes(start)) days -= 0.5;
  if (endHalf && working.includes(end) && end !== start) days -= 0.5;
  return days;
}

function quotaFor(type, employee) {
  if (employee.stage === "Intern") {
    if (!type.interns_allowed) return { applicable: false };
    return { applicable: true, quota: type.intern_quota ?? type.annual_quota };
  }
  return { applicable: true, quota: type.annual_quota };
}

function roundHalf(n) {
  return Math.round(n * 2) / 2;
}

export async function leaveTypes() {
  const { data } = await createHcmAdminClient().from("leave_types").select("*").eq("archived", false).order("sort");
  return data || [];
}

/** Types this employee may apply for, with their quota. */
export async function applicableTypes(employee) {
  return (await leaveTypes())
    .map((t) => ({ ...t, ...quotaFor(t, employee) }))
    .filter((t) => t.applicable);
}

async function usedAndPending(employeeId, year) {
  const { data } = await createHcmAdminClient()
    .from("leave_requests")
    .select("leave_type, days, status")
    .eq("employee_id", employeeId)
    .in("status", ["Approved", ...PENDING])
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`);
  const out = {};
  for (const r of data || []) {
    out[r.leave_type] ??= { used: 0, pending: 0 };
    if (r.status === "Approved") out[r.leave_type].used += Number(r.days);
    else out[r.leave_type].pending += Number(r.days);
  }
  return out;
}

/** Creates missing balance rows for the year (pro-rated, with carry-forward). */
export async function ensureBalances(employee, year) {
  const db = createHcmAdminClient();
  const types = (await applicableTypes(employee)).filter((t) => t.quota !== null && t.quota !== undefined);
  if (!types.length) return;
  const { data: existing } = await db.from("leave_balances").select("leave_type").eq("employee_id", employee.id).eq("year", year);
  const have = new Set((existing || []).map((b) => b.leave_type));
  const missing = types.filter((t) => !have.has(t.code));
  if (!missing.length) return;

  const joined = parse(employee.joining_date);
  let months = 12;
  if (joined.getUTCFullYear() > year) months = 0;
  else if (joined.getUTCFullYear() === year) months = 12 - joined.getUTCMonth();

  let previous = null;
  if (missing.some((t) => Number(t.carry_forward_max) > 0)) previous = await balanceSummary(employee, year - 1, { ensure: false });

  const rows = missing.map((t) => {
    const prev = previous?.find((b) => b.code === t.code);
    const carried = prev && prev.available !== null ? Math.max(0, Math.min(Number(t.carry_forward_max), prev.available)) : 0;
    return {
      employee_id: employee.id,
      leave_type: t.code,
      year,
      allocated: roundHalf((Number(t.quota) * months) / 12),
      carried: Number(t.carry_forward_max) > 0 ? carried : 0,
    };
  });
  const { error } = await db.from("leave_balances").upsert(rows, { onConflict: "employee_id,leave_type,year", ignoreDuplicates: true });
  if (error) throw error;
}

/** Per-type balance: allocated + carried + adjusted - used - pending. */
export async function balanceSummary(employee, year, { ensure = true } = {}) {
  if (ensure) await ensureBalances(employee, year);
  const db = createHcmAdminClient();
  const [types, { data: rows }, usage] = await Promise.all([
    applicableTypes(employee),
    db.from("leave_balances").select("*").eq("employee_id", employee.id).eq("year", year),
    usedAndPending(employee.id, year),
  ]);
  const byType = Object.fromEntries((rows || []).map((r) => [r.leave_type, r]));
  return types.map((t) => {
    const b = byType[t.code];
    const u = usage[t.code] || { used: 0, pending: 0 };
    const unlimited = t.quota === null || t.quota === undefined;
    const total = b ? Number(b.allocated) + Number(b.carried) + Number(b.adjusted) : 0;
    return {
      code: t.code,
      name: t.name,
      color: t.color,
      paid: t.paid,
      allow_half_day: t.allow_half_day,
      unlimited,
      allocated: b ? Number(b.allocated) : 0,
      carried: b ? Number(b.carried) : 0,
      adjusted: b ? Number(b.adjusted) : 0,
      total: unlimited ? null : total,
      used: u.used,
      pending: u.pending,
      available: unlimited ? null : total - u.used - u.pending,
    };
  });
}

/** Validates a request and returns { days, type, holidays }. Throws LeaveError. */
export async function validateLeave(employee, input, { excludeId = null } = {}) {
  const start = String(input.start_date || "").slice(0, 10);
  const end = String(input.end_date || input.start_date || "").slice(0, 10);
  const startHalf = Boolean(input.start_half);
  const endHalf = Boolean(input.end_half);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) throw new LeaveError("Choose the leave dates.");
  if (end < start) throw new LeaveError("End date must be on or after the start date.");
  if (start.slice(0, 4) !== end.slice(0, 4)) throw new LeaveError("Leave can't cross into the next year. Split it into two requests.");
  const today = todayIso(employee.locations?.timezone || "Asia/Kolkata");
  if (start < iso(new Date(parse(today).getTime() - 30 * 86400000))) throw new LeaveError("Leave can only be backdated up to 30 days.");
  if (start === end && startHalf && endHalf) throw new LeaveError("Pick either first or second half for a single day.");
  if (employee.status !== "Active" && employee.status !== "Notice") throw new LeaveError("Only active employees can apply for leave.");

  const types = await applicableTypes(employee);
  const type = types.find((t) => t.code === input.leave_type);
  if (!type) throw new LeaveError("This leave type isn't available to you.");
  if ((startHalf || endHalf) && !type.allow_half_day) throw new LeaveError(`${type.name} can't be taken as a half day.`);

  const holidays = await holidayMap(start, end, employee.location_id);
  const days = countLeaveDays({ start, end, startHalf, endHalf }, holidays);
  if (days <= 0) throw new LeaveError("Those dates are all weekends or holidays.");

  let overlapQ = createHcmAdminClient()
    .from("leave_requests")
    .select("id, start_date, end_date")
    .eq("employee_id", employee.id)
    .in("status", ["Approved", ...PENDING])
    .lte("start_date", end)
    .gte("end_date", start);
  if (excludeId) overlapQ = overlapQ.neq("id", excludeId);
  const { data: overlap } = await overlapQ;
  if (overlap?.length) throw new LeaveError(`You already have leave from ${overlap[0].start_date} to ${overlap[0].end_date}.`, 409);

  const balance = (await balanceSummary(employee, Number(start.slice(0, 4)))).find((b) => b.code === type.code);
  if (balance && !balance.unlimited && days > balance.available) {
    throw new LeaveError(`Not enough ${type.name}: ${balance.available} day(s) available, ${days} requested.`);
  }
  return { start, end, startHalf, endHalf, days, type, holidays, balance };
}

function datesLabel(r) {
  const half = (flag, label) => (flag ? ` (${label})` : "");
  if (r.start_date === r.end_date) return `${r.start_date}${half(r.start_half, "second half")}${half(r.end_half, "first half")}`;
  return `${r.start_date}${half(r.start_half, "from second half")} to ${r.end_date}${half(r.end_half, "until first half")}`;
}

async function steps() {
  const s = await getWorkflowSteps("leave");
  return s.length >= 2 ? s : FALLBACK_STEPS;
}

export async function applyLeave(employee, input, actor, request) {
  const v = await validateLeave(employee, input);
  const managerId = employee.manager_id && employee.manager_id !== employee.id ? employee.manager_id : null;
  const db = createHcmAdminClient();
  const { data: created, error } = await db
    .from("leave_requests")
    .insert({
      employee_id: employee.id,
      leave_type: v.type.code,
      start_date: v.start,
      end_date: v.end,
      start_half: v.startHalf,
      end_half: v.endHalf,
      days: v.days,
      reason: String(input.reason || "").trim() || null,
      status: managerId ? "Pending manager" : "Pending HR",
      manager_id: managerId,
    })
    .select()
    .single();
  if (error) throw error;

  const s = await steps();
  await openApproval("leave_request", created.id, managerId ? 0 : 1, s);
  await logAudit({ actor, action: "leave.apply", entityType: "leave_request", entityId: created.id, after: created, request });

  const vars = {
    employee_name: employee.full_name,
    leave_type: v.type.name,
    dates: datesLabel(created),
    days: v.days,
    reason: created.reason || "—",
    link: appUrl("/admin/dashboard/approvals"),
  };
  if (managerId) {
    await notifyUsers([managerId], { title: `Leave request: ${employee.full_name}`, body: `${v.type.name} · ${vars.dates}`, link: "/admin/dashboard/approvals" });
    if (employee.manager?.email) await queueEmail("leave_requested", employee.manager.email, { ...vars, name: employee.manager.full_name }, { entity: "leave_request", id: created.id });
  } else {
    await notifyHr(employee, created, v.type.name, "—");
  }
  return created;
}

async function notifyHr(employee, req, typeName, managerName) {
  const hr = (await usersWithPermission("leave.manage")).filter((u) => u.id !== employee.id);
  await notifyUsers(hr.map((u) => u.id), { title: `Leave awaiting HR: ${employee.full_name}`, body: `${typeName} · ${datesLabel(req)}`, link: "/admin/dashboard/approvals" });
  await queueEmail(
    "leave_pending_hr",
    hr.map((u) => u.email),
    { employee_name: employee.full_name, leave_type: typeName, dates: datesLabel(req), days: req.days, manager_name: managerName, link: appUrl("/admin/dashboard/approvals") },
    { entity: "leave_request", id: req.id }
  );
}

export async function loadLeaveRequest(id) {
  const db = createHcmAdminClient();
  const { data: req } = await db
    .from("leave_requests")
    .select("*, leave_types(name, paid)")
    .eq("id", id)
    .maybeSingle();
  if (!req) throw new LeaveError("Leave request not found.", 404);
  const { data: employee } = await db
    .from("employees")
    .select("id, full_name, official_email, employee_code, designation, manager_id, location_id, status, stage, joining_date, manager:internal_users!employees_manager_id_fkey(id, full_name, email)")
    .eq("id", req.employee_id)
    .single();
  return { req, employee };
}

export function leaveAccess(user, req, employee) {
  const hr = hasPermission(user, "leave.manage");
  const scope = user.permissions["leave.approve"];
  return {
    self: employee.id === user.id,
    hr,
    manager: req.manager_id === user.id || employee.manager_id === user.id,
    view: employee.id === user.id || hr || scope === "all" || req.manager_id === user.id || employee.manager_id === user.id,
  };
}

async function finalise(req, employee, status, actor, comment, request) {
  const db = createHcmAdminClient();
  const { data: updated, error } = await db
    .from("leave_requests")
    .update({ status, decided_by: actor.id, decided_at: new Date().toISOString(), decision_comment: comment || null })
    .eq("id", req.id)
    .eq("status", req.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new LeaveError("This request was changed by someone else. Refresh and try again.", 409);
  await logAudit({ actor, action: status === "Approved" ? "leave.approve" : "leave.reject", entityType: "leave_request", entityId: req.id, before: { status: req.status }, after: { status, comment: comment || null }, request });
  const decision = status.toLowerCase();
  await notifyUsers([employee.id], { title: `Leave ${decision}`, body: `${req.leave_types?.name} · ${datesLabel(req)}${comment ? ` — ${comment}` : ""}`, link: "/admin/dashboard/leave" });
  await queueEmail(
    "leave_decided",
    employee.official_email,
    { name: employee.full_name, leave_type: req.leave_types?.name, dates: datesLabel(req), days: req.days, decision, comment: comment ? `Comment: ${comment}` : "", link: appUrl("/admin/dashboard/leave") },
    { entity: "leave_request", id: req.id }
  );
  return updated;
}

/** Manager step then HR step. HR may act at the manager step "on behalf", which finalises. */
export async function decideLeave(req, employee, { decision, comment }, actor, request) {
  const access = leaveAccess(actor, req, employee);
  if (access.self) throw new LeaveError("You can't approve your own leave.", 403);
  if (!PENDING.includes(req.status)) throw new LeaveError(`This request is already ${req.status.toLowerCase()}.`);
  if (!["approve", "reject"].includes(decision)) throw new LeaveError("Unknown decision.");
  const text = String(comment || "").trim();
  if (decision === "reject" && !text) throw new LeaveError("Add a reason for rejecting.");

  const atManager = req.status === "Pending manager";
  if (atManager && !access.manager && !access.hr) throw new LeaveError("Only the reporting manager or HR can decide this.", 403);
  if (!atManager && !access.hr) throw new LeaveError("Waiting for HR approval.", 403);

  const approval = await pendingApproval("leave_request", req.id);
  if (decision === "reject") {
    if (approval) await closeApproval(approval, { status: "Rejected", actor, comment: text });
    return finalise(req, employee, "Rejected", actor, text, request);
  }

  if (atManager && !access.hr) {
    if (approval) await closeApproval(approval, { status: "Approved", actor, comment: text });
    const db = createHcmAdminClient();
    const { data: updated, error } = await db.from("leave_requests").update({ status: "Pending HR" }).eq("id", req.id).eq("status", req.status).select().maybeSingle();
    if (error) throw error;
    if (!updated) throw new LeaveError("This request was changed by someone else. Refresh and try again.", 409);
    await openApproval("leave_request", req.id, 1, await steps());
    await logAudit({ actor, action: "leave.manager_approve", entityType: "leave_request", entityId: req.id, before: { status: req.status }, after: { status: "Pending HR", comment: text || null }, request });
    await notifyHr(employee, req, req.leave_types?.name, actor.fullName || actor.email);
    return updated;
  }

  // HR step, or HR approving on the manager's behalf: close every open step.
  if (approval) await closeApproval(approval, { status: "Approved", actor, comment: atManager ? `${text ? `${text} · ` : ""}Approved by HR on behalf of the manager` : text });
  return finalise(req, employee, "Approved", actor, text, request);
}

export async function cancelLeave(req, employee, reason, actor, request) {
  const access = leaveAccess(actor, req, employee);
  const text = String(reason || "").trim();
  if (!access.self && !access.hr) throw new LeaveError("You can't cancel this request.", 403);
  if (!["Approved", ...PENDING].includes(req.status)) throw new LeaveError(`This request is already ${req.status.toLowerCase()}.`);
  const today = todayIso();
  if (req.status === "Approved" && req.start_date <= today && !access.hr) throw new LeaveError("Leave that has started can only be cancelled by HR.");
  if (access.hr && !access.self && !text) throw new LeaveError("Add a reason for cancelling.");

  const db = createHcmAdminClient();
  const { data: updated, error } = await db
    .from("leave_requests")
    .update({ status: "Cancelled", cancel_reason: text || null, cancelled_by: actor.id })
    .eq("id", req.id)
    .eq("status", req.status)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new LeaveError("This request was changed by someone else. Refresh and try again.", 409);
  await cancelPendingApprovals("leave_request", req.id);
  await logAudit({ actor, action: "leave.cancel", entityType: "leave_request", entityId: req.id, before: { status: req.status }, after: { status: "Cancelled", reason: text || null }, request });

  if (access.self && req.status !== "Pending manager" && employee.manager?.email) {
    await notifyUsers([employee.manager.id], { title: `${employee.full_name} cancelled leave`, body: datesLabel(req), link: "/admin/dashboard/leave/team" });
    await queueEmail("leave_cancelled", employee.manager.email, { name: employee.manager.full_name, employee_name: employee.full_name, leave_type: req.leave_types?.name, dates: datesLabel(req), reason: text || "—" }, { entity: "leave_request", id: req.id });
  }
  if (!access.self) {
    await notifyUsers([employee.id], { title: "Your leave was cancelled by HR", body: `${datesLabel(req)} — ${text}`, link: "/admin/dashboard/leave" });
  }
  return updated;
}

/** Approved leave on a date, as { full | half } or null. */
export async function leaveOnDate(employeeId, date) {
  const { data } = await createHcmAdminClient()
    .from("leave_requests")
    .select("start_date, end_date, start_half, end_half, leave_type")
    .eq("employee_id", employeeId)
    .eq("status", "Approved")
    .lte("start_date", date)
    .gte("end_date", date)
    .maybeSingle();
  if (!data) return null;
  const half = (data.start_date === date && data.start_half) || (data.end_date === date && data.end_half);
  return { type: data.leave_type, half };
}

export { datesLabel };
