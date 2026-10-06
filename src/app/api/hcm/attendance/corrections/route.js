import { NextResponse } from "next/server";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { getEmployeeForUser } from "@/lib/hcm/employees";
import { requestCorrection, AttendanceError } from "@/lib/hcm/attendance";

// POST { work_date, check_in: "HH:MM", check_out: "HH:MM", reason }
export async function POST(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const employee = await getEmployeeForUser(user.id);
    if (!employee) return jsonError("You don't have an employee record yet. Ask HR to add you.", 400);
    const created = await requestCorrection(employee, await request.json(), user, request);
    return NextResponse.json({ success: true, correction: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AttendanceError) return jsonError(err.message, err.status);
    return serverError("Attendance correction POST", err);
  }
}
