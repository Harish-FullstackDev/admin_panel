import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";

// GET: one letter. The employee themselves, or HR with employee.manage /
// probation.manage.
export async function GET(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const { data: letter } = await createHcmAdminClient()
      .from("letters")
      .select("*, employees(full_name, employee_code)")
      .eq("id", id)
      .maybeSingle();
    const allowed = letter && (letter.employee_id === user.id || hasPermission(user, "employee.manage") || hasPermission(user, "probation.manage"));
    if (!allowed) return jsonError("Letter not found.", 404);
    return NextResponse.json({ success: true, letter });
  } catch (err) {
    return serverError("Letter GET", err);
  }
}
