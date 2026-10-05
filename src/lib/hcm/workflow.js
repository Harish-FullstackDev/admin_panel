import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { logAudit } from "@/lib/hcm/audit";

// Allowed moves. Anything not listed is rejected (e.g. Applied -> Hired).
export const APPLICATION_TRANSITIONS = {
  Applied: ["Screening", "Shortlisted", "Hold", "Rejected", "Withdrawn"],
  Screening: ["Shortlisted", "Hold", "Rejected", "Withdrawn"],
  Hold: ["Screening", "Shortlisted", "Rejected", "Withdrawn"],
  Shortlisted: ["Interview", "Hold", "Rejected", "Withdrawn"],
  Interview: ["Interview", "Selected", "Hold", "Rejected", "Withdrawn"],
  Selected: ["Offer", "Rejected", "Withdrawn"],
  Offer: ["Hired", "Selected", "Rejected", "Withdrawn"],
  Rejected: ["Screening"],
  Hired: [],
  Withdrawn: [],
};

export const APPLICATION_STAGES = Object.keys(APPLICATION_TRANSITIONS);
export const PIPELINE_COLUMNS = ["Applied", "Screening", "Hold", "Shortlisted", "Interview", "Selected", "Offer", "Hired", "Rejected"];
const REASON_REQUIRED = new Set(["Rejected", "Withdrawn"]);

export const REQUISITION_TRANSITIONS = {
  Draft: ["Pending HR", "Withdrawn"],
  "Sent back": ["Pending HR", "Withdrawn"],
  "Pending HR": ["Pending CHRO", "Sent back", "Rejected", "Withdrawn"],
  "Pending CHRO": ["Approved", "Sent back", "Rejected", "Withdrawn"],
  Approved: ["Posted", "Closed"],
  Posted: ["Filled", "Closed"],
  Filled: ["Closed"],
  Rejected: [],
  Closed: [],
  Withdrawn: [],
};

export class WorkflowError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function canMoveApplication(from, to) {
  return (APPLICATION_TRANSITIONS[from] || []).includes(to);
}

/**
 * Moves an application to a new stage, recording who, when and why.
 * Side effects (emails etc.) are left to the caller, which knows the context.
 */
export async function moveApplication(id, to, { actor, reason = null, request, patch = {} }) {
  const supabase = createHcmAdminClient();
  const { data: app, error } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!app) throw new WorkflowError("Application not found.", 404);
  if (!canMoveApplication(app.stage, to)) {
    throw new WorkflowError(`Cannot move an application from ${app.stage} to ${to}.`);
  }
  if (REASON_REQUIRED.has(to) && !reason?.trim()) {
    throw new WorkflowError(`A reason is required to move to ${to}.`);
  }

  const update = { stage: to, stage_changed_at: new Date().toISOString(), ...patch };
  if (to === "Rejected") update.rejection_reason = reason.trim();
  if (to === "Withdrawn") update.withdrawn_at = new Date().toISOString();
  if (app.stage === "Rejected" && to !== "Rejected") update.rejection_reason = null;

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update(update)
    .eq("id", id)
    .eq("stage", app.stage)
    .select()
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) throw new WorkflowError("This application was changed by someone else. Refresh and try again.", 409);

  await supabase.from("application_events").insert({
    application_id: id,
    from_stage: app.stage,
    to_stage: to,
    actor_id: actor?.id ?? null,
    reason: reason?.trim() || null,
  });
  await logAudit({
    actor,
    action: "application.move",
    entityType: "application",
    entityId: id,
    before: { stage: app.stage },
    after: { stage: to, reason: reason?.trim() || null },
    request,
  });
  return { before: app, after: updated };
}

export async function getWorkflowSteps(type) {
  const { data } = await createHcmAdminClient()
    .from("workflow_definitions")
    .select("steps")
    .eq("type", type)
    .maybeSingle();
  return data?.steps || [];
}

/** Opens the pending approval row for step index `step` of a workflow. */
export async function openApproval(entityType, entityId, stepIndex, steps) {
  const step = steps[stepIndex];
  if (!step) return null;
  const due = new Date();
  due.setDate(due.getDate() + (step.sla_days || 3));
  const { data, error } = await createHcmAdminClient()
    .from("approvals")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      step: stepIndex,
      step_key: step.key,
      approver_permission: step.permission,
      due_at: due.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function pendingApproval(entityType, entityId) {
  const { data } = await createHcmAdminClient()
    .from("approvals")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("status", "Pending")
    .order("step", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Closes the current pending approval with a decision. */
export async function closeApproval(approval, { status, actor, comment }) {
  const { error } = await createHcmAdminClient()
    .from("approvals")
    .update({ status, decided_by: actor.id, comment: comment || null, decided_at: new Date().toISOString() })
    .eq("id", approval.id)
    .eq("status", "Pending");
  if (error) throw error;
}

export async function cancelPendingApprovals(entityType, entityId) {
  await createHcmAdminClient()
    .from("approvals")
    .update({ status: "Cancelled", decided_at: new Date().toISOString() })
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("status", "Pending");
}
