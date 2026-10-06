import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { hasPermission } from "@/lib/hcm/auth";

/** The signed-in user's employee record (with manager + location), or null. */
export async function getEmployeeForUser(userId) {
  const { data } = await createHcmAdminClient()
    .from("employees")
    .select("*, locations(name, timezone), manager:internal_users!employees_manager_id_fkey(id, full_name, email)")
    .eq("id", userId)
    .maybeSingle();
  return data || null;
}

export const EMPLOYEE_SELECT =
  "*, departments(name), locations(name), grades(code, name), manager:internal_users!employees_manager_id_fkey(id, full_name, email)";

export const EMPLOYEE_EDITABLE = [
  "designation", "department_id", "location_id", "grade_id", "manager_id",
  "employment_type", "stage", "stage_end_date", "phone", "personal_email",
];

/** Applies the caller's employee.view scope to a query on `employees`. */
export function scopeEmployees(query, user) {
  const scope = user.permissions["employee.view"];
  if (scope === "all") return query;
  if (scope === "department") return query.eq("department_id", user.departmentId ?? "00000000-0000-0000-0000-000000000000");
  if (scope === "team") return query.eq("manager_id", user.id);
  return query.eq("id", user.id);
}

/** True if the user may read this employee record (scope, or it is their own). */
export function canViewEmployee(user, employee) {
  if (employee.id === user.id) return true;
  if (!hasPermission(user, "employee.view")) return false;
  const scope = user.permissions["employee.view"];
  if (scope === "all") return true;
  if (scope === "department") return Boolean(user.departmentId) && employee.department_id === user.departmentId;
  if (scope === "team") return employee.manager_id === user.id;
  return false;
}
