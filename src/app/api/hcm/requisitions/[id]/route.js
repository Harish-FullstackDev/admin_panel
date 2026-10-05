import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers } from "@/lib/hcm/notify";
import {
  WorkflowError, getWorkflowSteps, openApproval, pendingApproval, closeApproval, cancelPendingApprovals, REQUISITION_TRANSITIONS,
} from "@/lib/hcm/workflow";
import {
  loadRequisition, setRequisitionStatus, requisitionFields, validateRequisition, submitRequisition, notifyApprovers,
} from "@/lib/hcm/requisitions";

function canSee(user, req) {
  const scope = user.permissions["requisition.view"];
  if (!scope) return false;
  return scope !== "own" || req.raised_by === user.id;
}

async function approvalTrail(id) {
  const supabase = createHcmAdminClient();
  const { data } = await supabase
    .from("approvals")
    .select("*")
    .eq("entity_type", "requisition")
    .eq("entity_id", id)
    .order("created_at");
  const deciderIds = [...new Set((data || []).map((a) => a.decided_by).filter(Boolean))];
  let names = {};
  if (deciderIds.length) {
    const { data: users } = await supabase.from("internal_users").select("id, full_name").in("id", deciderIds);
    names = Object.fromEntries((users || []).map((u) => [u.id, u.full_name]));
  }
  return (data || []).map((a) => ({ ...a, decided_by_name: names[a.decided_by] || null }));
}

export async function GET(request, { params }) {
  const auth = await requirePermission(request, "requisition.view");
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const req = await loadRequisition(id);
    if (!req || !canSee(auth.user, req)) return jsonError("Requisition not found.", 404);
    const { data: jobs } = await createHcmAdminClient().from("jobs").select("id, title, slug, status").eq("requisition_id", id);
    return NextResponse.json({ success: true, requisition: req, approvals: await approvalTrail(id), jobs: jobs || [] });
  } catch (err) {
    return serverError("Requisition GET", err);
  }
}

// PATCH: edit fields while Draft / Sent back (raiser or HR reviewer).
export async function PATCH(request, { params }) {
  const auth = await requirePermission(request, ["requisition.create", "requisition.review"]);
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const req = await loadRequisition(id);
    if (!req || !canSee(auth.user, req)) return jsonError("Requisition not found.", 404);
    if (!["Draft", "Sent back"].includes(req.status)) return jsonError(`A ${req.status} requisition cannot be edited.`);
    const isRaiser = req.raised_by === auth.user.id;
    if (!isRaiser && !hasPermission(auth.user, "requisition.review", "all")) return jsonError("Only the requester can edit this.", 403);

    const fields = requisitionFields(await request.json());
    const problem = validateRequisition(fields, { submitting: false });
    if (problem) return jsonError(problem);

    const { data, error } = await createHcmAdminClient().from("requisitions").update(fields).eq("id", id).select().single();
    if (error) throw error;
    await logAudit({ actor: auth.user, action: "requisition.update", entityType: "requisition", entityId: id, before: req, after: data, request });
    return NextResponse.json({ success: true, requisition: await loadRequisition(id) });
  } catch (err) {
    return serverError("Requisition PATCH", err);
  }
}

// POST { action, comment?, changes?: { openings, budget_min, budget_max, grade_id } }
// actions: submit | withdraw | forward | approve | send_back | reject | close
export async function POST(request, { params }) {
  const auth = await requirePermission(request, ["requisition.create", "requisition.review", "requisition.approve", "job.manage"]);
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const { action, comment, changes } = await request.json();
    let req = await loadRequisition(id);
    if (!req || !canSee(auth.user, req)) return jsonError("Requisition not found.", 404);
    const isRaiser = req.raised_by === auth.user.id;
    const note = String(comment || "").trim();

    if (action === "submit") {
      if (!isRaiser) return jsonError("Only the requester can submit this.", 403);
      req = await submitRequisition(req, auth.user, request);
      return NextResponse.json({ success: true, requisition: req });
    }

    if (action === "withdraw") {
      if (!isRaiser) return jsonError("Only the requester can withdraw this.", 403);
      if (!REQUISITION_TRANSITIONS[req.status]?.includes("Withdrawn")) return jsonError(`A ${req.status} requisition cannot be withdrawn.`);
      await cancelPendingApprovals("requisition", id);
      const updated = await setRequisitionStatus(req, "Withdrawn");
      await logAudit({ actor: auth.user, action: "requisition.withdraw", entityType: "requisition", entityId: id, before: { status: req.status }, after: { status: "Withdrawn" }, request });
      return NextResponse.json({ success: true, requisition: updated });
    }

    if (action === "close") {
      if (!hasPermission(auth.user, "job.manage")) return jsonError("You do not have permission to do this.", 403);
      if (!REQUISITION_TRANSITIONS[req.status]?.includes("Closed")) return jsonError(`A ${req.status} requisition cannot be closed.`);
      const updated = await setRequisitionStatus(req, "Closed");
      await logAudit({ actor: auth.user, action: "requisition.close", entityType: "requisition", entityId: id, before: { status: req.status }, after: { status: "Closed" }, request });
      return NextResponse.json({ success: true, requisition: updated });
    }

    if (!["forward", "approve", "send_back", "reject"].includes(action)) return jsonError("Unknown action.");

    const approval = await pendingApproval("requisition", id);
    if (!approval) return jsonError("Nothing is waiting for approval on this requisition.");
    if (!hasPermission(auth.user, approval.approver_permission)) return jsonError("You are not an approver for this step.", 403);
    if (isRaiser && action !== "send_back" && !hasPermission(auth.user, "user.manage")) {
      return jsonError("You cannot approve your own requisition.", 403);
    }
    if (["send_back", "reject"].includes(action) && !note) return jsonError("A comment is required.");

    const steps = await getWorkflowSteps("requisition");
    const isLast = approval.step >= steps.length - 1;
    if (action === "forward" && isLast) return jsonError("This is the final step. Approve or reject instead.");
    if (action === "approve" && !isLast) return jsonError("Forward this to the next approver instead.");

    const before = { status: req.status, openings: req.openings, budget_min: req.budget_min, budget_max: req.budget_max, grade_id: req.grade_id };
    const extra = {};
    if (action === "approve" && changes) {
      if (changes.openings) extra.openings = Math.max(1, parseInt(changes.openings, 10) || req.openings);
      if ("budget_min" in changes) extra.budget_min = changes.budget_min === "" ? null : Number(changes.budget_min);
      if ("budget_max" in changes) extra.budget_max = changes.budget_max === "" ? null : Number(changes.budget_max);
      if ("grade_id" in changes) extra.grade_id = changes.grade_id || null;
    }

    const decision = { forward: "Approved", approve: "Approved", send_back: "Sent back", reject: "Rejected" }[action];
    await closeApproval(approval, { status: decision, actor: auth.user, comment: note });

    let nextStatus;
    if (action === "forward") nextStatus = steps[approval.step + 1].status;
    else if (action === "approve") nextStatus = "Approved";
    else nextStatus = decision;

    const updated = await setRequisitionStatus(req, nextStatus, {
      ...extra,
      ...(["approve", "reject"].includes(action) ? { decided_at: new Date().toISOString() } : {}),
    });
    if (action === "forward") {
      await openApproval("requisition", id, approval.step + 1, steps);
      await notifyApprovers(updated, steps[approval.step + 1]);
    }

    await logAudit({
      actor: auth.user,
      action: `requisition.${action}`,
      entityType: "requisition",
      entityId: id,
      before,
      after: { status: nextStatus, ...extra, comment: note || null },
      request,
    });

    if (action !== "forward") {
      const verb = { approve: "approved", send_back: "sent back", reject: "rejected" }[action];
      const link = `/admin/dashboard/requisitions/${id}`;
      await notifyUsers([req.raised_by], { title: `${req.code} ${verb}`, body: note || null, link });
      await queueEmail(
        "requisition_decided",
        req.raiser?.email,
        { requisition_code: req.code, role_title: req.role_title, decision: verb, approver_name: auth.user.fullName, comment: note || "—" },
        { entity: "requisition", id }
      );
      if (action === "approve") {
        await notifyUsers(
          { permission: "job.manage" },
          { title: `Create job posting for ${req.code}`, body: `${updated.openings} x ${req.role_title} was approved.`, link }
        );
      }
    }

    return NextResponse.json({ success: true, requisition: updated });
  } catch (err) {
    if (err instanceof WorkflowError) return jsonError(err.message, err.status);
    return serverError("Requisition action", err);
  }
}
