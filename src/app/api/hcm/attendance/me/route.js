import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { getEmployeeForUser } from "@/lib/hcm/employees";
import { monthView, summarise, punch, todayRecord, employeeTimezone, AttendanceError } from "@/lib/hcm/attendance";
import { leaveOnDate, holidayMap, isWeekend } from "@/lib/hcm/leave";

const NO_RECORD = "You don't have an employee record yet. Ask HR to add you.";

// GET ?month=YYYY-MM: my month view, today's punch and my corrections.
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const employee = await getEmployeeForUser(user.id);
    if (!employee) return jsonError(NO_RECORD, 400);
    const { today, record } = await todayRecord(employee);
    const m = new URL(request.url).searchParams.get("month") || today.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(m)) return jsonError("Month must be YYYY-MM.");
    const [year, month] = m.split("-").map(Number);
    const [days, { data: corrections }, leave, holidays] = await Promise.all([
      monthView(employee, year, month),
      createHcmAdminClient().from("attendance_corrections").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false }).limit(20),
      leaveOnDate(employee.id, today),
      holidayMap(today, today, employee.location_id),
    ]);
    return NextResponse.json({
      success: true,
      month: m,
      timezone: employeeTimezone(employee),
      today: { date: today, record, leave, holiday: holidays[today] || null, weekend: isWeekend(today) },
      days,
      summary: summarise(days),
      corrections: corrections || [],
    });
  } catch (err) {
    return serverError("My attendance GET", err);
  }
}

// POST { action: check_in | check_out }
export async function POST(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const employee = await getEmployeeForUser(user.id);
    if (!employee) return jsonError(NO_RECORD, 400);
    const { action } = await request.json();
    const record = await punch(employee, action, user, request);
    return NextResponse.json({ success: true, record });
  } catch (err) {
    if (err instanceof AttendanceError) return jsonError(err.message, err.status);
    return serverError("Attendance punch", err);
  }
}
