import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, hasPermission, serverError } from "@/lib/hcm/auth";
import { monthView, summarise } from "@/lib/hcm/attendance";
import { todayIso, holidayMap, isWeekend } from "@/lib/hcm/leave";

// GET ?month=YYYY-MM: today's board, monthly summary per employee and pending
// corrections, scoped to direct reports unless the caller has scope 'all'.
export async function GET(request) {
  const auth = await requirePermission(request, ["attendance.view", "attendance.manage"]);
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    const db = createHcmAdminClient();
    const all = hasPermission(user, "attendance.manage") || user.permissions["attendance.view"] === "all";
    const today = todayIso();
    const m = new URL(request.url).searchParams.get("month") || today.slice(0, 7);
    const [year, month] = m.split("-").map(Number);

    let empQ = db
      .from("employees")
      .select("id, full_name, employee_code, designation, joining_date, location_id, manager_id, status, locations(timezone)")
      .in("status", ["Active", "Notice"])
      .order("full_name");
    if (!all) empQ = empQ.eq("manager_id", user.id);
    const { data: employees } = await empQ;
    const ids = (employees || []).map((e) => e.id);
    const none = ["00000000-0000-0000-0000-000000000000"];

    const [{ data: punches }, { data: leaves }, { data: corrections }, holidays] = await Promise.all([
      db.from("attendance").select("employee_id, check_in, check_out").eq("work_date", today).in("employee_id", ids.length ? ids : none),
      db.from("leave_requests").select("employee_id, leave_type, start_half, end_half, start_date, end_date")
        .eq("status", "Approved").lte("start_date", today).gte("end_date", today).in("employee_id", ids.length ? ids : none),
      db.from("attendance_corrections").select("*, employees!inner(full_name, manager_id)")
        .eq("status", "Pending").in("employee_id", ids.length ? ids : none).order("created_at"),
      holidayMap(today, today, null),
    ]);

    const offDay = Boolean(holidays[today]) || isWeekend(today);
    const board = (employees || []).map((e) => {
      const p = (punches || []).find((x) => x.employee_id === e.id);
      const l = (leaves || []).find((x) => x.employee_id === e.id);
      let state = offDay ? "Off today" : "Not checked in";
      if (l) state = "On leave";
      if (p?.check_in) state = p.check_out ? "Checked out" : "Checked in";
      return { id: e.id, full_name: e.full_name, designation: e.designation, state, check_in: p?.check_in || null, check_out: p?.check_out || null, leave: l?.leave_type || null };
    });

    const summary = [];
    for (const e of employees || []) summary.push({ id: e.id, full_name: e.full_name, employee_code: e.employee_code, ...summarise(await monthView(e, year, month)) });

    return NextResponse.json({
      success: true,
      scope: all ? "all" : "team",
      today,
      offDay,
      month: m,
      board,
      summary,
      corrections: (corrections || []).filter((c) => c.employee_id !== user.id),
    });
  } catch (err) {
    return serverError("Team attendance GET", err);
  }
}
