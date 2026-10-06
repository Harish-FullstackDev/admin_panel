import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, hasPermission, serverError } from "@/lib/hcm/auth";
import { todayIso, PENDING } from "@/lib/hcm/leave";

// GET: leave requests within the caller's scope (team = direct reports).
// ?status=pending (default: needs my action) | all | <status>, ?from, ?to, ?employee
export async function GET(request) {
  const auth = await requirePermission(request, ["leave.approve", "leave.manage"]);
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    const db = createHcmAdminClient();
    const p = new URL(request.url).searchParams;
    const hr = hasPermission(user, "leave.manage");
    const all = hr || user.permissions["leave.approve"] === "all";
    const today = todayIso();

    let teamIds = null;
    if (!all) {
      const { data: team } = await db.from("employees").select("id").eq("manager_id", user.id);
      teamIds = (team || []).map((e) => e.id);
    }
    const scoped = (q) => (teamIds ? q.in("employee_id", teamIds.length ? teamIds : ["00000000-0000-0000-0000-000000000000"]) : q);

    const status = p.get("status") || "pending";
    let q = scoped(
      db.from("leave_requests").select("*, leave_types(name, color), employees!inner(id, full_name, employee_code, designation, manager_id)")
    ).order("start_date", { ascending: status === "pending" });
    if (status === "pending") q = q.in("status", PENDING);
    else if (status !== "all") q = q.eq("status", status);
    if (p.get("from")) q = q.gte("end_date", p.get("from"));
    if (p.get("to")) q = q.lte("start_date", p.get("to"));
    if (p.get("employee")) q = q.eq("employee_id", p.get("employee"));
    const { data: requests, error } = await q.limit(300);
    if (error) throw error;

    const horizon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const { data: upcoming } = await scoped(
      db.from("leave_requests").select("id, employee_id, start_date, end_date, start_half, end_half, days, status, leave_type, employees!inner(full_name)")
    )
      .in("status", ["Approved", ...PENDING])
      .lte("start_date", horizon)
      .gte("end_date", today)
      .order("start_date");

    const rows = (requests || [])
      .filter((r) => r.employee_id !== user.id)
      .map((r) => ({
        ...r,
        myAction:
          (r.status === "Pending manager" && (r.manager_id === user.id || r.employees.manager_id === user.id || hr)) ||
          (r.status === "Pending HR" && hr),
      }));
    return NextResponse.json({
      success: true,
      scope: all ? "all" : "team",
      isHr: hr,
      requests: status === "pending" ? rows.filter((r) => r.myAction) : rows,
      onLeaveToday: (upcoming || []).filter((r) => r.status === "Approved" && r.start_date <= today),
      upcoming: upcoming || [],
    });
  } catch (err) {
    return serverError("Team leave GET", err);
  }
}
