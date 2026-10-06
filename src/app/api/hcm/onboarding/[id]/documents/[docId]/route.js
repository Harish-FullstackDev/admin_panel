import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, appUrl } from "@/lib/hcm/notify";
import { documentUrl, syncJoinerStatus } from "@/lib/hcm/onboarding";

async function loadDocument(id, docId) {
  const { data } = await createHcmAdminClient()
    .from("joiner_documents")
    .select("*, joiners!inner(id, full_name, personal_email, status)")
    .eq("id", docId)
    .eq("joiner_id", id)
    .maybeSingle();
  return data;
}

// GET: short-lived signed URL to view the uploaded file.
export async function GET(request, { params }) {
  const auth = await requirePermission(request, ["onboarding.manage", "employee.manage"]);
  if (auth.error) return auth.error;
  const { id, docId } = await params;
  try {
    const doc = await loadDocument(id, docId);
    if (!doc) return jsonError("Document not found.", 404);
    if (!doc.file_path) return jsonError("Nothing has been uploaded yet.", 404);
    return NextResponse.json({ success: true, url: await documentUrl(doc.file_path) });
  } catch (err) {
    return serverError("Joiner document GET", err);
  }
}

// PATCH { status: "Verified" | "Rejected", reason? }
export async function PATCH(request, { params }) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  const { id, docId } = await params;
  try {
    const { status, reason } = await request.json();
    const doc = await loadDocument(id, docId);
    if (!doc) return jsonError("Document not found.", 404);
    if (["Joined", "Cancelled"].includes(doc.joiners.status)) return jsonError("This joiner can no longer be changed.");
    if (!["Verified", "Rejected"].includes(status)) return jsonError("Status must be Verified or Rejected.");
    if (!doc.file_path) return jsonError("Nothing has been uploaded yet.");
    const text = String(reason || "").trim();
    if (status === "Rejected" && !text) return jsonError("Tell the joiner why the document was rejected.");

    const now = new Date().toISOString();
    const update =
      status === "Verified"
        ? { status, rejection_reason: null, verified_by: auth.user.id, verified_at: now }
        : { status, rejection_reason: text, verified_by: null, verified_at: null };
    const { data: updated, error } = await createHcmAdminClient()
      .from("joiner_documents")
      .update(update)
      .eq("id", docId)
      .eq("status", doc.status)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!updated) return jsonError("This document was just changed. Refresh and try again.", 409);

    await logAudit({
      actor: auth.user,
      action: status === "Verified" ? "onboarding.document_verify" : "onboarding.document_reject",
      entityType: "joiner",
      entityId: id,
      before: { document: doc.type_code, status: doc.status },
      after: { document: doc.type_code, status, reason: text || null },
      request,
    });
    if (status === "Rejected") {
      await queueEmail(
        "document_rejected",
        doc.joiners.personal_email,
        { candidate_name: doc.joiners.full_name, document_name: doc.name, reason: text, link: appUrl("/candidate/joining") },
        { entity: "joiner", id }
      );
    }
    await syncJoinerStatus(id);
    return NextResponse.json({ success: true, document: updated });
  } catch (err) {
    return serverError("Joiner document PATCH", err);
  }
}
