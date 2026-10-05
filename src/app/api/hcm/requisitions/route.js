import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { WorkflowError } from "@/lib/hcm/workflow";
import { REQUISITION_SELECT, requisitionFields, validateRequisition, submitRequisition } from "@/lib/hcm/requisitions";

export async function GET(request) {
  const auth = await requirePermission(request, "requisition.view");
  if (auth.error) return auth.error;
  try {
    const status = new URL(request.url).searchParams.get("status");
    let query = createHcmAdminClient().from("requisitions").select(REQUISITION_SELECT).order("created_at", { ascending: false });
    if (auth.scope === "own") query = query.eq("raised_by", auth.user.id);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, requisitions: data });
  } catch (err) {
    return serverError("Requisitions GET", err);
  }
}

// POST { ...fields, submit?: boolean }
export async function POST(request) {
  const auth = await requirePermission(request, "requisition.create");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const fields = requisitionFields(body);
    const problem = validateRequisition(fields, { submitting: Boolean(body.submit) });
    if (problem) return jsonError(problem);

    const { data: created, error } = await createHcmAdminClient()
      .from("requisitions")
      .insert({ ...fields, raised_by: auth.user.id, status: "Draft" })
      .select(REQUISITION_SELECT)
      .single();
    if (error) throw error;
    await logAudit({ actor: auth.user, action: "requisition.create", entityType: "requisition", entityId: created.id, after: created, request });

    const requisition = body.submit ? await submitRequisition(created, auth.user, request) : created;
    return NextResponse.json({ success: true, requisition }, { status: 201 });
  } catch (err) {
    if (err instanceof WorkflowError) return jsonError(err.message, err.status);
    return serverError("Requisitions POST", err);
  }
}
