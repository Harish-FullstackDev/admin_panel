import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { OFFER_SELECT, salaryBand, expireOffers, offerFields } from "@/lib/hcm/offers";

// GET ?status=&application_id=
export async function GET(request) {
  const auth = await requirePermission(request, ["offer.create", "offer.approve"]);
  if (auth.error) return auth.error;
  try {
    await expireOffers();
    const params = new URL(request.url).searchParams;
    let query = createHcmAdminClient().from("offers").select(OFFER_SELECT).order("created_at", { ascending: false });
    if (params.get("status")) query = query.eq("status", params.get("status"));
    if (params.get("application_id")) query = query.eq("application_id", params.get("application_id"));
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, offers: data });
  } catch (err) {
    return serverError("Offers GET", err);
  }
}

// POST { application_id, salary, currency, breakdown, joining_date, expires_at, letter_body }
export async function POST(request) {
  const auth = await requirePermission(request, "offer.create");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const fields = offerFields(body);
    if (fields.error) return jsonError(fields.error);

    const supabase = createHcmAdminClient();
    const { data: app } = await supabase.from("applications").select("id, stage, job_id").eq("id", body.application_id).maybeSingle();
    if (!app) return jsonError("Application not found.", 404);
    if (app.stage !== "Selected") return jsonError("Offers can only be drafted for selected candidates.");

    const band = await salaryBand(app.job_id);
    const requiresApproval = Boolean(band?.max !== null && band?.max !== undefined && fields.value.salary > Number(band.max));

    const { data: offer, error } = await supabase
      .from("offers")
      .insert({ ...fields.value, application_id: app.id, status: "Draft", requires_approval: requiresApproval, created_by: auth.user.id })
      .select(OFFER_SELECT)
      .single();
    if (error) {
      if (error.code === "23505") return jsonError("This candidate already has an active offer.", 409);
      throw error;
    }
    await logAudit({ actor: auth.user, action: "offer.create", entityType: "offer", entityId: offer.id, after: { ...fields.value, requires_approval: requiresApproval }, request });
    return NextResponse.json({ success: true, offer, band }, { status: 201 });
  } catch (err) {
    return serverError("Offers POST", err);
  }
}
