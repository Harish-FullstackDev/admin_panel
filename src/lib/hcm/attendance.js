import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { hasPermission } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers, appUrl } from "@/lib/hcm/notify";
import { holidayMap, isWeekend, eachDay, todayIso, leaveOnDate } from "@/lib/hcm/leave";

export class AttendanceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function employeeTimezone(employee) {
  return employee?.locations?.timezone || "Asia/Kolkata";
}

/** ISO instant for a local wall-clock time (yyyy-mm-dd + HH:MM) in tz. */
export function zonedInstant(date, time, tz) {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(guess);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const asLocal = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess.getTime() - (asLocal - guess.getTime())).toISOString();
}

export async function todayRecord(employee) {
  const today = todayIso(employeeTimezone(employee));
  const { data } = await createHcmAdminClient().from("attendance").select("*").eq("employee_id", employee.id).eq("work_date", today).maybeSingle();
  return { today, record: data || null };
}

export async function punch(employee, action, actor, request) {
  if (!["check_in", "check_out"].includes(action)) throw new AttendanceError("Unknown action.");
  if (!["Active", "Notice"].includes(employee.status)) throw new AttendanceError("Only active employees can check in.");
  const db = createHcmAdminClient();
  const { today, record } = await todayRecord(employee);
  const leave = await leaveOnDate(employee.id, today);
  if (leave && !leave.half) throw new AttendanceError("You're on approved leave today.");
  const now = new Date().toISOString();

  let saved;
  if (action === "check_in") {
    if (record?.check_in) throw new AttendanceError("You've already checked in today.");
    const { data, error } = await db
      .from("attendance")
      .upsert({ employee_id: employee.id, work_date: today, check_in: now, source: "portal" }, { onConflict: "employee_id,work_date" })
      .select()
      .single();
    if (error) throw error;
    saved = data;
  } else {
    if (!record?.check_in) throw new AttendanceError("Check in first.");
    const { data, error } = await db.from("attendance").update({ check_out: now }).eq("id", record.id).select().single();
    if (error) throw error;
    saved = data;
  }
  await logAudit({ actor, action: `attendance.${action}`, entityType: "attendance", entityId: saved.id, after: { work_date: today, [action === "check_in" ? "check_in" : "check_out"]: now }, request });
  return saved;
}

function hours(r) {
  if (!r?.check_in || !r?.check_out) return null;
  return Math.round(((new Date(r.check_out) - new Date(r.check_in)) / 3600000) * 10) / 10;
}

/** One row per day of the month with a computed status. */
export async function monthView(employee, year, month) {
  const db = createHcmAdminClient();
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const today = todayIso(employeeTimezone(employee));
  const [{ data: rows }, { data: leaves }, { data: corrections }, holidays] = await Promise.all([
    db.from("attendance").select("*").eq("employee_id", employee.id).gte("work_date", first).lte("work_date", last),
    db.from("leave_requests").select("start_date, end_date, start_half, end_half, leave_type, status")
      .eq("employee_id", employee.id).eq("status", "Approved").lte("start_date", last).gte("end_date", first),
    db.from("attendance_corrections").select("id, work_date, status").eq("employee_id", employee.id).gte("work_date", first).lte("work_date", last),
    holidayMap(first, last, employee.location_id),
  ]);
  const byDate = Object.fromEntries((rows || []).map((r) => [r.work_date, r]));

  return eachDay(first, last).map((date) => {
    const rec = byDate[date] || null;
    const leave = (leaves || []).find((l) => l.start_date <= date && l.end_date >= date);
    const halfLeave = leave && ((leave.start_date === date && leave.start_half) || (leave.end_date === date && leave.end_half));
    const correction = (corrections || []).filter((c) => c.work_date === date).sort((a, b) => (a.status === "Pending" ? -1 : 1))[0] || null;
    let status;
    if (date < employee.joining_date) status = "Not joined";
    else if (holidays[date]) status = "Holiday";
    else if (isWeekend(date)) status = rec?.check_in ? "Present" : "Weekend";
    else if (leave && !halfLeave) status = "On leave";
    else if (rec?.check_in && rec?.check_out) status = halfLeave ? "Half day" : "Present";
    else if (rec?.check_in) status = date === today ? "Checked in" : "Missing check-out";
    else if (date > today) status = "Upcoming";
    else if (date === today) status = halfLeave ? "Half day" : "Not checked in";
    else status = halfLeave ? "Half day" : "Absent";
    return {
      date,
      status,
      holiday: holidays[date] || null,
      leave: leave ? { type: leave.leave_type, half: Boolean(halfLeave) } : null,
      check_in: rec?.check_in || null,
      check_out: rec?.check_out || null,
      source: rec?.source || null,
      hours: hours(rec),
      correction,
    };
  });
}

export function summarise(days) {
  const count = (s) => days.filter((d) => d.status === s).length;
  return {
    present: count("Present") + count("Checked in"),
    halfDays: count("Half day"),
    absent: count("Absent"),
    onLeave: count("On leave"),
    missingCheckout: count("Missing check-out"),
    holidays: count("Holiday"),
    hours: Math.round(days.reduce((s, d) => s + (d.hours || 0), 0) * 10) / 10,
  };
}

export async function requestCorrection(employee, input, actor, request) {
  const tz = employeeTimezone(employee);
  const today = todayIso(tz);
  const date = String(input.work_date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new AttendanceError("Choose the date.");
  if (date >= today) throw new AttendanceError("Corrections are for past days only.");
  const limit = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  if (date < limit) throw new AttendanceError("Corrections can only go back 30 days.");
  if (date < employee.joining_date) throw new AttendanceError("That's before your joining date.");
  if (!/^\d{2}:\d{2}$/.test(input.check_in || "") || !/^\d{2}:\d{2}$/.test(input.check_out || "")) throw new AttendanceError("Enter check-in and check-out times.");
  if (input.check_out <= input.check_in) throw new AttendanceError("Check-out must be after check-in.");
  const reason = String(input.reason || "").trim();
  if (!reason) throw new AttendanceError("Explain why the correction is needed.");

  const db = createHcmAdminClient();
  const { data: pending } = await db.from("attendance_corrections").select("id").eq("employee_id", employee.id).eq("work_date", date).eq("status", "Pending").maybeSingle();
  if (pending) throw new AttendanceError("You already have a pending correction for that day.", 409);

  const { data: created, error } = await db
    .from("attendance_corrections")
    .insert({ employee_id: employee.id, work_date: date, check_in: zonedInstant(date, input.check_in, tz), check_out: zonedInstant(date, input.check_out, tz), reason })
    .select()
    .single();
  if (error) throw error;
  await logAudit({ actor, action: "attendance.correction_request", entityType: "attendance_correction", entityId: created.id, after: created, request });

  if (employee.manager?.id && employee.manager.id !== employee.id) {
    await notifyUsers([employee.manager.id], { title: `Attendance correction: ${employee.full_name}`, body: `${date} · ${input.check_in}–${input.check_out}`, link: "/admin/dashboard/attendance/team" });
    await queueEmail(
      "attendance_correction_requested",
      employee.manager.email,
      { name: employee.manager.full_name, employee_name: employee.full_name, work_date: date, times: `${input.check_in}–${input.check_out}`, reason, link: appUrl("/admin/dashboard/attendance/team") },
      { entity: "attendance_correction", id: created.id }
    );
  }
  return created;
}

export async function decideCorrection(id, { decision, comment }, actor, request) {
  const db = createHcmAdminClient();
  const { data: c } = await db
    .from("attendance_corrections")
    .select("*, employees!inner(id, full_name, official_email, manager_id)")
    .eq("id", id)
    .maybeSingle();
  if (!c) throw new AttendanceError("Correction not found.", 404);
  const isManager = c.employees.manager_id === actor.id;
  if (c.employee_id === actor.id) throw new AttendanceError("You can't approve your own correction.", 403);
  if (!isManager && !hasPermission(actor, "attendance.manage")) throw new AttendanceError("Only the reporting manager or HR can decide this.", 403);
  if (c.status !== "Pending") throw new AttendanceError(`This correction is already ${c.status.toLowerCase()}.`);
  if (!["approve", "reject"].includes(decision)) throw new AttendanceError("Unknown decision.");
  const text = String(comment || "").trim();
  if (decision === "reject" && !text) throw new AttendanceError("Add a reason for rejecting.");

  const status = decision === "approve" ? "Approved" : "Rejected";
  const { data: updated, error } = await db
    .from("attendance_corrections")
    .update({ status, decided_by: actor.id, decided_at: new Date().toISOString(), comment: text || null })
    .eq("id", id)
    .eq("status", "Pending")
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new AttendanceError("This correction was changed by someone else.", 409);

  if (status === "Approved") {
    const { error: upErr } = await db
      .from("attendance")
      .upsert(
        { employee_id: c.employee_id, work_date: c.work_date, check_in: c.check_in, check_out: c.check_out, source: "correction", note: c.reason },
        { onConflict: "employee_id,work_date" }
      );
    if (upErr) throw upErr;
  }
  await logAudit({ actor, action: `attendance.correction_${decision}`, entityType: "attendance_correction", entityId: id, before: { status: "Pending" }, after: { status, comment: text || null }, request });
  await notifyUsers([c.employee_id], { title: `Attendance correction ${status.toLowerCase()}`, body: `${c.work_date}${text ? ` — ${text}` : ""}`, link: "/admin/dashboard/attendance" });
  await queueEmail(
    "attendance_correction_decided",
    c.employees.official_email,
    { name: c.employees.full_name, work_date: c.work_date, decision: status.toLowerCase(), comment: text ? `Comment: ${text}` : "" },
    { entity: "attendance_correction", id }
  );
  return updated;
}
