import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { getEmployeeForUser } from "@/lib/hcm/employees";
import { balanceSummary, applicableTypes, todayIso, LeaveError } from "@/lib/hcm/leave";

// GET ?year=YYYY: my balances, requests, applicable types and upcoming holidays.
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const employee = await getEmployeeForUser(user.id);
    if (!employee) return jsonError("You don't have an employee record yet. Ask HR to add you.", 400);
    const today = todayIso(employee.locations?.timezone || "Asia/Kolkata");
    const year = Number(new URL(request.url).searchParams.get("year")) || Number(today.slice(0, 4));
    const db = createHcmAdminClient();
    const horizon = `${Number(today.slice(0, 4)) + 1}-12-31`;
    let holidayQ = db.from("holidays").select("id, date, name, optional, location_id").gte("date", today).lte("date", horizon).order("date").limit(20);
    holidayQ = employee.location_id ? holidayQ.or(`location_id.is.null,location_id.eq.${employee.location_id}`) : holidayQ.is("location_id", null);
    const [balances, types, { data: requests }, { data: holidays }] = await Promise.all([
      balanceSummary(employee, year),
      applicableTypes(employee),
      db.from("leave_requests").select("*, leave_types(name, color)").eq("employee_id", employee.id)
        .gte("start_date", `${year}-01-01`).lte("start_date", `${year}-12-31`).order("start_date", { ascending: false }),
      holidayQ,
    ]);
    return NextResponse.json({
      success: true,
      year,
      today,
      balances,
      types: types.map((t) => ({ code: t.code, name: t.name, allow_half_day: t.allow_half_day, paid: t.paid, unlimited: t.quota === null || t.quota === undefined })),
      requests: requests || [],
      holidays: holidays || [],
      hasManager: Boolean(employee.manager_id && employee.manager_id !== employee.id),
    });
  } catch (err) {
    if (err instanceof LeaveError) return jsonError(err.message, err.status);
    return serverError("My leave GET", err);
  }
}
