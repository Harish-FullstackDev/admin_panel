import { NextResponse } from "next/server";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { getEmployeeForUser } from "@/lib/hcm/employees";
import { applyLeave, validateLeave, LeaveError } from "@/lib/hcm/leave";

// POST: apply for leave. ?preview=1 only validates and returns the day count.
export async function POST(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const employee = await getEmployeeForUser(user.id);
    if (!employee) return jsonError("You don't have an employee record yet. Ask HR to add you.", 400);
    const body = await request.json();
    if (new URL(request.url).searchParams.get("preview") === "1") {
      const v = await validateLeave(employee, body);
      return NextResponse.json({ success: true, days: v.days, available: v.balance?.available ?? null, holidays: v.holidays });
    }
    const created = await applyLeave(employee, body, user, request);
    return NextResponse.json({ success: true, request: created }, { status: 201 });
  } catch (err) {
    if (err instanceof LeaveError) return jsonError(err.message, err.status);
    return serverError("Leave apply", err);
  }
}
