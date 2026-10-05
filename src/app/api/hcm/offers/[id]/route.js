import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers, appUrl } from "@/lib/hcm/notify";
import { getWorkflowSteps, openApproval, pendingApproval, closeApproval, cancelPendingApprovals, moveApplication, WorkflowError } from "@/lib/hcm/workflow";
import { OFFER_SELECT, salaryBand, offerFields } from "@/lib/hcm/offers";
import { candidateName } from "@/lib/hcm/recruitment";

async function setStatus(offer, status, extra = {}) {
  const { data, error } = await createHcmAdminClient()
    .from("offers")
    .update({ status, ...extra })
    .eq("id", offer.id)
    .eq("status", offer.status)
    .select(OFFER_SELECT)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new WorkflowError("This offer was changed by someone else. Refresh and try again.", 409);
  return data;
}

async function approvalTrail(id) {
  const supabase = createHcmAdminClient();
  const { data } = await supabase.from("approvals").select("*").eq("entity_type", "offer").eq("entity_id", id).order("created_at");
  const ids = [...new Set((data || []).map((a) => a.decided_by).filter(Boolean))];
  const { data: users } = ids.length ? await supabase.from("internal_users").select("id, full_name").in("id", ids) : { data: [] };
  const names = Object.fromEntries((users || []).map((u) => [u.id, u.full_name]));
  return (data || []).map((a) => ({ ...a, decided_by_name: names[a.decided_by] || null }));
}

export async function GET(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!hasPermission(user, "offer.create") && !hasPermission(user, "offer.approve")) return jsonError("You do not have permission to do this.", 403);
  const { id } = await params;
  try {
    const { data: offer } = await createHcmAdminClient().from("offers").select(OFFER_SELECT).eq("id", id).maybeSingle();
    if (!offer) return jsonError("Offer not found.", 404);
    return NextResponse.json({ success: true, offer, band: await salaryBand(offer.applications.job_id), approvals: await approvalTrail(id) });
  } catch (err) {
    return serverError("Offer GET", err);
  }
}

// POST { action: "update" | "submit" | "approve" | "reject" | "send" | "withdraw" | "revise", comment?, ...fields }
export async function POST(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();
    const supabase = createHcmAdminClient();
    const { data: offer } = await supabase.from("offers").select(OFFER_SELECT).eq("id", id).maybeSingle();
    if (!offer) return jsonError("Offer not found.", 404);
    const app = offer.applications;
    const comment = String(body.comment || "").trim();
    const canCreate = hasPermission(user, "offer.create");
    const audit = (action, before, after) => logAudit({ actor: user, action: `offer.${action}`, entityType: "offer", entityId: id, before, after, request });

    if (["update", "submit", "send", "withdraw", "revise"].includes(body.action) && !canCreate) {
      return jsonError("You do not have permission to do this.", 403);
    }

    if (body.action === "update") {
      if (offer.status !== "Draft") return jsonError("Only draft offers can be edited.");
      const fields = offerFields({ ...offer, ...body });
      if (fields.error) return jsonError(fields.error);
      const band = await salaryBand(app.job_id);
      const requiresApproval = Boolean(band?.max !== null && band?.max !== undefined && fields.value.salary > Number(band.max));
      const updated = await setStatus(offer, "Draft", { ...fields.value, requires_approval: requiresApproval });
      await audit("update", { salary: offer.salary }, { ...fields.value, requires_approval: requiresApproval });
      return NextResponse.json({ success: true, offer: updated });
    }

    if (body.action === "submit") {
      if (offer.status !== "Draft") return jsonError("Only draft offers can be submitted.");
      if (!offer.requires_approval) {
        const updated = await setStatus(offer, "Approved");
        await audit("submit", { status: "Draft" }, { status: "Approved", auto: "within band" });
        return NextResponse.json({ success: true, offer: updated });
      }
      const steps = await getWorkflowSteps("offer");
      if (!steps.length) return jsonError("Offer workflow is not configured.", 500);
      const updated = await setStatus(offer, "Pending approval");
      await openApproval("offer", id, 0, steps);
      await audit("submit", { status: "Draft" }, { status: "Pending approval" });
      await notifyUsers(
        { permission: steps[0].permission },
        { title: `Offer above band: ${candidateName(app)}`, body: `${app.position} · ${offer.currency} ${offer.salary}`, link: "/admin/dashboard/approvals" }
      );
      return NextResponse.json({ success: true, offer: updated });
    }

    if (body.action === "approve" || body.action === "reject") {
      const approval = await pendingApproval("offer", id);
      if (!approval || offer.status !== "Pending approval") return jsonError("This offer is not waiting for approval.");
      if (!hasPermission(user, approval.approver_permission)) return jsonError("You are not an approver for this step.", 403);
      if (offer.created_by === user.id) return jsonError("You cannot approve an offer you drafted.", 403);
      if (body.action === "reject" && !comment) return jsonError("A comment is required.");
      await closeApproval(approval, { status: body.action === "approve" ? "Approved" : "Rejected", actor: user, comment });
      const updated = await setStatus(offer, body.action === "approve" ? "Approved" : "Draft");
      await audit(body.action, { status: offer.status }, { status: updated.status, comment: comment || null });
      if (offer.created_by) {
        await notifyUsers([offer.created_by], {
          title: `Offer ${body.action === "approve" ? "approved" : "sent back"}: ${candidateName(app)}`,
          body: comment || null,
          link: "/admin/dashboard/offers",
        });
      }
      return NextResponse.json({ success: true, offer: updated });
    }

    if (body.action === "send") {
      if (offer.status !== "Approved") return jsonError("Only approved offers can be sent.");
      if (app.stage !== "Selected") return jsonError(`The candidate is in ${app.stage}, not Selected.`);
      const updated = await setStatus(offer, "Sent", { sent_at: new Date().toISOString() });
      await moveApplication(app.id, "Offer", { actor: user, request, reason: "Offer sent" });
      await audit("send", { status: "Approved" }, { status: "Sent" });
      const { data: job } = app.job_id ? await supabase.from("jobs").select("title").eq("id", app.job_id).maybeSingle() : { data: null };
      await queueEmail(
        "offer_sent",
        app.email,
        {
          candidate_name: candidateName(app),
          job_title: job?.title || app.position,
          joining_date: offer.joining_date,
          expiry_date: offer.expires_at,
          link: appUrl("/candidate/offers"),
        },
        { entity: "application", id: app.id }
      );
      return NextResponse.json({ success: true, offer: updated });
    }

    if (body.action === "withdraw") {
      if (!["Draft", "Pending approval", "Approved", "Sent", "Discussion requested"].includes(offer.status)) {
        return jsonError(`A ${offer.status} offer cannot be withdrawn.`);
      }
      if (!comment) return jsonError("A reason is required.");
      await cancelPendingApprovals("offer", id);
      const updated = await setStatus(offer, "Withdrawn", { candidate_note: offer.candidate_note });
      if (app.stage === "Offer") await moveApplication(app.id, "Selected", { actor: user, request, reason: `Offer withdrawn: ${comment}` });
      await audit("withdraw", { status: offer.status }, { status: "Withdrawn", reason: comment });
      return NextResponse.json({ success: true, offer: updated });
    }

    // Candidate asked to discuss: HR revises into a fresh draft.
    if (body.action === "revise") {
      if (offer.status !== "Discussion requested") return jsonError("Only offers under discussion can be revised.");
      const updated = await setStatus(offer, "Draft");
      if (app.stage === "Offer") await moveApplication(app.id, "Selected", { actor: user, request, reason: "Offer being revised" });
      await audit("revise", { status: offer.status }, { status: "Draft" });
      return NextResponse.json({ success: true, offer: updated });
    }

    return jsonError("Unknown action.");
  } catch (err) {
    if (err instanceof WorkflowError) return jsonError(err.message, err.status);
    return serverError("Offer action", err);
  }
}
