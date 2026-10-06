import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { loadLeaveRequest, leaveAccess, decideLeave, cancelLeave, LeaveError } from "@/lib/hcm/leave";

export async function GET(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const { req, employee } = await loadLeaveRequest(id);
    const access = leaveAccess(user, req, employee);
    if (!access.view) return jsonError("Leave request not found.", 404);
    const { data: approvals } = await createHcmAdminClient().from("approvals").select("*").eq("entity_type", "leave_request").eq("entity_id", id).order("created_at");
    return NextResponse.json({ success: true, request: req, employee, approvals: approvals || [], access });
  } catch (err) {
    if (err instanceof LeaveError) return jsonError(err.message, err.status);
    return serverError("Leave request GET", err);
  }
}

// POST { action: approve | reject | cancel, comment?, reason? }
export async function POST(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const { req, employee } = await loadLeaveRequest(id);
    const access = leaveAccess(user, req, employee);
    if (!access.view) return jsonError("Leave request not found.", 404);
    const body = await request.json();
    let updated;
    if (body.action === "cancel") updated = await cancelLeave(req, employee, body.reason, user, request);
    else if (body.action === "approve" || body.action === "reject") updated = await decideLeave(req, employee, { decision: body.action, comment: body.comment }, user, request);
    else return jsonError("Unknown action.");
    return NextResponse.json({ success: true, request: updated });
  } catch (err) {
    if (err instanceof LeaveError) return jsonError(err.message, err.status);
    return serverError("Leave request POST", err);
  }
}
