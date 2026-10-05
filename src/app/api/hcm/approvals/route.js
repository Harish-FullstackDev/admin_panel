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
    const [reqs, offers] = await Promise.all([
      reqIds.length ? supabase.from("requisitions").select(REQUISITION_SELECT).in("id", reqIds) : { data: [] },
      offerIds.length ? supabase.from("offers").select(OFFER_SELECT).in("id", offerIds) : { data: [] },
    ]);

    const reqMap = Object.fromEntries((reqs.data || []).map((r) => [r.id, r]));
    const offerMap = Object.fromEntries((offers.data || []).map((o) => [o.id, o]));
    const items = [];
    for (const a of pending) {
      const entity = a.entity_type === "requisition" ? reqMap[a.entity_id] : offerMap[a.entity_id];
      if (!entity) continue;
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
