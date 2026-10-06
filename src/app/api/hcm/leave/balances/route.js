import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { notifyUsers } from "@/lib/hcm/notify";
import { balanceSummary, ensureBalances, applicableTypes } from "@/lib/hcm/leave";

const EMP_COLS = "id, full_name, employee_code, designation, stage, status, joining_date, location_id, manager_id";

// GET ?year&employee: one employee's balances + adjustment history,
// or (no employee) every active employee's balances for the year.
export async function GET(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const p = new URL(request.url).searchParams;
    const year = Number(p.get("year")) || new Date().getFullYear();
    const db = createHcmAdminClient();
    if (p.get("employee")) {
      const { data: employee } = await db.from("employees").select(EMP_COLS).eq("id", p.get("employee")).maybeSingle();
      if (!employee) return jsonError("Employee not found.", 404);
      const [balances, { data: history }] = await Promise.all([
        balanceSummary(employee, year),
        db.from("leave_adjustments").select("*").eq("employee_id", employee.id).eq("year", year).order("created_at", { ascending: false }),
      ]);
      return NextResponse.json({ success: true, year, employee, balances, history: history || [] });
    }
    const { data: employees } = await db.from("employees").select(EMP_COLS).in("status", ["Active", "Notice"]).order("full_name");
    const rows = [];
    for (const e of employees || []) rows.push({ employee: e, balances: await balanceSummary(e, year) });
    return NextResponse.json({ success: true, year, rows });
  } catch (err) {
    return serverError("Leave balances GET", err);
  }
}

// POST { employee_id, leave_type, year, days (+/-), reason }
export async function POST(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const days = Number(body.days);
    const year = Number(body.year) || new Date().getFullYear();
    const reason = String(body.reason || "").trim();
    if (!Number.isFinite(days) || days === 0 || Math.round(days * 2) !== days * 2) return jsonError("Days must be a non-zero multiple of 0.5.");
    if (!reason) return jsonError("A reason is required.");
    const db = createHcmAdminClient();
    const { data: employee } = await db.from("employees").select(EMP_COLS).eq("id", body.employee_id).maybeSingle();
    if (!employee) return jsonError("Employee not found.", 404);
    if (employee.id === auth.user.id) return jsonError("You can't adjust your own balance.", 403);
    const type = (await applicableTypes(employee)).find((t) => t.code === body.leave_type);
    if (!type) return jsonError("That leave type doesn't apply to this employee.");
    if (type.quota === null || type.quota === undefined) return jsonError(`${type.name} has no limit; nothing to adjust.`);

    await ensureBalances(employee, year);
    const { data: row } = await db.from("leave_balances").select("*").eq("employee_id", employee.id).eq("leave_type", type.code).eq("year", year).single();
    const { error } = await db.from("leave_balances").update({ adjusted: Number(row.adjusted) + days }).eq("id", row.id);
    if (error) throw error;
    await db.from("leave_adjustments").insert({ employee_id: employee.id, leave_type: type.code, year, days, reason, actor_id: auth.user.id });
    await logAudit({
      actor: auth.user,
      action: "leave.adjust",
      entityType: "employee",
      entityId: employee.id,
      before: { leave_type: type.code, year, adjusted: Number(row.adjusted) },
      after: { leave_type: type.code, year, adjusted: Number(row.adjusted) + days, days, reason },
      request,
    });
    await notifyUsers([employee.id], { title: `${type.name} balance ${days > 0 ? "increased" : "reduced"} by ${Math.abs(days)}`, body: reason, link: "/admin/dashboard/leave" });
    return NextResponse.json({ success: true, balances: await balanceSummary(employee, year) });
  } catch (err) {
    return serverError("Leave balances POST", err);
  }
}
