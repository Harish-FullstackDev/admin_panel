import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { JOIN_STAGES } from "@/lib/hcm/onboarding";
import { EMPLOYEE_SELECT, scopeEmployees } from "@/lib/hcm/employees";

// GET: directory, scoped by employee.view. Filters: department, location,
// manager, stage, status, q. With employee.manage, also returns internal
// users who have no employee record yet (for "Add existing staff").
export async function GET(request) {
  const auth = await requirePermission(request, "employee.view");
  if (auth.error) return auth.error;
  try {
    const p = new URL(request.url).searchParams;
    const db = createHcmAdminClient();
    let query = scopeEmployees(db.from("employees").select(EMPLOYEE_SELECT), auth.user).order("full_name");
    for (const [param, column] of [["department", "department_id"], ["location", "location_id"], ["manager", "manager_id"], ["stage", "stage"], ["status", "status"]]) {
      if (p.get(param)) query = query.eq(column, p.get(param));
    }
    const q = p.get("q")?.trim().replace(/[%,()]/g, "");
    if (q) query = query.or(`full_name.ilike.%${q}%,official_email.ilike.%${q}%,employee_code.ilike.%${q}%,designation.ilike.%${q}%`);
    const { data: employees, error } = await query;
    if (error) throw error;

    let staffWithoutRecord;
    if (hasPermission(auth.user, "employee.manage")) {
      const [{ data: users }, { data: all }] = await Promise.all([
        db.from("internal_users").select("id, full_name, email, designation, department_id").in("status", ["Active", "Invited"]).order("full_name"),
        db.from("employees").select("id"),
      ]);
      const have = new Set((all || []).map((e) => e.id));
      staffWithoutRecord = (users || []).filter((u) => !have.has(u.id));
    }
    return NextResponse.json({ success: true, employees, staffWithoutRecord });
  } catch (err) {
    return serverError("Employees GET", err);
  }
}

// POST: add an employee record for an existing internal user (staff who were
// set up before onboarding existed, e.g. HR and managers).
export async function POST(request) {
  const auth = await requirePermission(request, "employee.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const db = createHcmAdminClient();
    const { data: user } = await db.from("internal_users").select("id, full_name, email, designation, department_id").eq("id", body.user_id).maybeSingle();
    if (!user) return jsonError("Internal user not found.", 404);
    if (!body.joining_date) return jsonError("Joining date is required.");
    const stage = body.stage || "Full-time";
    if (!JOIN_STAGES.includes(stage)) return jsonError("Invalid stage.");
    if (body.manager_id && body.manager_id === user.id) return jsonError("An employee cannot be their own manager.");

    const row = {
      id: user.id,
      full_name: user.full_name,
      official_email: user.email,
      designation: body.designation?.trim() || user.designation,
      department_id: body.department_id || user.department_id,
      location_id: body.location_id || null,
      grade_id: body.grade_id || null,
      manager_id: body.manager_id || null,
      employment_type: body.employment_type || "Full-time",
      stage,
      stage_end_date: stage === "Full-time" ? null : body.stage_end_date || null,
      joining_date: body.joining_date,
      phone: body.phone?.trim() || null,
    };
    const { data: created, error } = await db.from("employees").insert(row).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("This person already has an employee record.", 409);
      throw error;
    }
    await db.from("employee_events").insert({
      employee_id: user.id, type: "join", effective_date: row.joining_date, after: row, note: "Added existing staff", actor_id: auth.user.id,
    });
    await logAudit({ actor: auth.user, action: "employee.create", entityType: "employee", entityId: user.id, after: created, request });
    return NextResponse.json({ success: true, employee: created }, { status: 201 });
  } catch (err) {
    return serverError("Employees POST", err);
  }
}
