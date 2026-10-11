import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, serverError } from "@/lib/hcm/auth";
import { REQUISITION_SELECT } from "@/lib/hcm/requisitions";
import { OFFER_SELECT, salaryBand } from "@/lib/hcm/offers";

// GET: approvals the current user can act on (any pending step whose
// permission they hold), enriched with the entity they concern.
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const perms = Object.keys(user.permissions);
    const supabase = createHcmAdminClient();
    const { data: pending, error } = await supabase
      .from("approvals")
      .select("*")
      .eq("status", "Pending")
      .in("approver_permission", perms.length ? perms : ["__none__"])
      .order("created_at");
    if (error) throw error;

    const reqIds = pending.filter((a) => a.entity_type === "requisition").map((a) => a.entity_id);
    const offerIds = pending.filter((a) => a.entity_type === "offer").map((a) => a.entity_id);
    const stageIds = pending.filter((a) => a.entity_type === "stage_record").map((a) => a.entity_id);
    const leaveIds = pending.filter((a) => a.entity_type === "leave_request").map((a) => a.entity_id);
    const exitIds = pending.filter((a) => a.entity_type === "exit_case").map((a) => a.entity_id);
    const [reqs, offers, stages, leaves, exits] = await Promise.all([
      reqIds.length ? supabase.from("requisitions").select(REQUISITION_SELECT).in("id", reqIds) : { data: [] },
      offerIds.length ? supabase.from("offers").select(OFFER_SELECT).in("id", offerIds) : { data: [] },
      stageIds.length
        ? supabase
            .from("stage_records")
            .select("id, type, start_date, end_date, extension_count, recommendation, proposed_outcome, proposed_end_date, proposed_last_day, proposed_note, proposed_by, employees(id, full_name, employee_code, designation)")
            .in("id", stageIds)
        : { data: [] },
      leaveIds.length
        ? supabase
            .from("leave_requests")
            .select("*, leave_types(name, color), employees(id, full_name, employee_code, designation, manager_id)")
            .in("id", leaveIds)
        : { data: [] },
      exitIds.length
        ? supabase
            .from("exit_cases")
            .select("id, employee_id, type, status, reason_category, reason, submitted_at, requested_last_day, notice_days, manager_id, manager_comment, initiated_by, employees(id, full_name, employee_code, designation, stage, manager_id)")
            .in("id", exitIds)
        : { data: [] },
    ]);

    const reqMap = Object.fromEntries((reqs.data || []).map((r) => [r.id, r]));
    const offerMap = Object.fromEntries((offers.data || []).map((o) => [o.id, o]));
    const stageMap = Object.fromEntries((stages.data || []).map((r) => [r.id, r]));
    const leaveMap = Object.fromEntries((leaves.data || []).map((r) => [r.id, r]));
    const exitMap = Object.fromEntries((exits.data || []).map((r) => [r.id, r]));
    const maps = { requisition: reqMap, offer: offerMap, leave_request: leaveMap, exit_case: exitMap, stage_record: stageMap };
    const items = [];
    for (const a of pending) {
      const entity = maps[a.entity_type]?.[a.entity_id];
      if (!entity) continue;
      if (a.entity_type === "exit_case") {
        if (entity.employee_id === user.id || entity.initiated_by === user.id) continue;
        // Manager step goes to the reporting manager only; HR acts there from the exit page.
        if (a.step_key === "manager_acceptance" && entity.manager_id !== user.id && entity.employees?.manager_id !== user.id) continue;
      }
      if (a.entity_type === "leave_request") {
        if (entity.employee_id === user.id) continue;
        // Manager step goes to the reporting manager only; HR acts there from Team Leave.
        if (a.step_key === "manager_approval" && entity.manager_id !== user.id && entity.employees?.manager_id !== user.id) continue;
      }
      if (a.entity_type === "stage_record" && (entity.proposed_by === user.id || entity.employees?.id === user.id)) continue;
      // Requesters don't approve their own items (enforced again on the action route).
      if (a.entity_type === "requisition" && entity.raised_by === user.id) continue;
      if (a.entity_type === "offer" && entity.created_by === user.id) continue;
      const extra = a.entity_type === "offer" ? { band: await salaryBand(entity.applications.job_id) } : {};
      items.push({
        ...a,
        age_days: Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000),
        overdue: a.due_at ? new Date(a.due_at).getTime() < Date.now() : false,
        entity,
        ...extra,
      });
    }
    return NextResponse.json({ success: true, approvals: items });
  } catch (err) {
    return serverError("Approvals GET", err);
  }
}
