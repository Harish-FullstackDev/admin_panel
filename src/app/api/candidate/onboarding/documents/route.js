import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getCandidateFromRequest } from "@/lib/candidateAuth";
import { logAudit } from "@/lib/hcm/audit";
import { notifyUsers } from "@/lib/hcm/notify";
import { validateDocumentFile, uploadDocument, DOCUMENTS_BUCKET } from "@/lib/hcm/onboarding";

// POST multipart { document_id, file }: upload (or re-upload after rejection).
export async function POST(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const form = await request.formData();
    const documentId = form.get("document_id");
    const file = form.get("file");

    const db = createHcmAdminClient();
    const { data: doc } = await db
      .from("joiner_documents")
      .select("*, joiners!inner(id, candidate_id, full_name, status)")
      .eq("id", documentId)
      .maybeSingle();
    if (!doc || doc.joiners.candidate_id !== candidate.id) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    if (!["Pre-joining", "Ready"].includes(doc.joiners.status)) {
      return NextResponse.json({ error: "Document uploads are closed." }, { status: 400 });
    }
    if (!["Requested", "Rejected"].includes(doc.status)) {
      return NextResponse.json({ error: `${doc.name} is already ${doc.status.toLowerCase()}.` }, { status: 400 });
    }
    const invalid = validateDocumentFile(file);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const path = await uploadDocument(doc.joiner_id, doc.type_code, file);
    const { data: updated, error } = await db
      .from("joiner_documents")
      .update({ status: "Uploaded", file_path: path, file_name: file.name, uploaded_at: new Date().toISOString(), rejection_reason: null })
      .eq("id", doc.id)
      .eq("status", doc.status)
      .select("id, type_code, name, required, status, file_name, rejection_reason, uploaded_at")
      .maybeSingle();
    if (error) throw error;
    if (!updated) {
      await db.storage.from(DOCUMENTS_BUCKET).remove([path]);
      return NextResponse.json({ error: "This document was just updated. Refresh the page." }, { status: 409 });
    }
    if (doc.file_path) await db.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path]);

    await logAudit({
      actor: { id: candidate.id, email: candidate.email },
      action: "onboarding.document_upload",
      entityType: "joiner",
      entityId: doc.joiner_id,
      before: { document: doc.type_code, status: doc.status },
      after: { document: doc.type_code, status: "Uploaded", file_name: file.name },
      request,
    });
    await notifyUsers(
      { permission: "onboarding.manage" },
      { title: `${doc.joiners.full_name} uploaded ${doc.name}`, body: "Ready for verification", link: `/admin/dashboard/onboarding/${doc.joiner_id}` }
    );
    return NextResponse.json({ success: true, document: updated });
  } catch (err) {
    console.error("Candidate document upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed." }, { status: 500 });
  }
}
