import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers, appUrl, usersWithPermission } from "@/lib/hcm/notify";
import { getWorkflowSteps, openApproval, WorkflowError } from "@/lib/hcm/workflow";

export const REQUISITION_SELECT =
  "*, departments(name), locations(name), grades(code, name, band_min, band_max, currency), raiser:internal_users!requisitions_raised_by_fkey(id, full_name, email)";

export function requisitionFields(body) {
  const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
  return {
    role_title: String(body.role_title || "").trim(),
    department_id: body.department_id || null,
    location_id: body.location_id || null,
    grade_id: body.grade_id || null,
    openings: Math.max(1, parseInt(body.openings, 10) || 1),
    request_type: body.request_type === "Replacement" ? "Replacement" : "New",
    replacing_name: body.request_type === "Replacement" ? String(body.replacing_name || "").trim() || null : null,
    employment_type: body.employment_type || "Full-time",
    budget_min: num(body.budget_min),
    budget_max: num(body.budget_max),
    currency: body.currency || "INR",
    target_date: body.target_date || null,
    skills: Array.isArray(body.skills)
      ? body.skills.map((s) => String(s).trim()).filter(Boolean)
      : String(body.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
    justification: String(body.justification || "").trim() || null,
  };
}

export function validateRequisition(fields, { submitting }) {
  if (!fields.role_title) return "Role title is required.";
  if (fields.budget_min !== null && fields.budget_max !== null && fields.budget_min > fields.budget_max) {
    return "Budget minimum must not exceed maximum.";
  }
  if (submitting) {
    if (!fields.department_id) return "Department is required.";
    if (!fields.justification) return "Justification is required.";
    if (fields.request_type === "Replacement" && !fields.replacing_name) return "Name the person being replaced.";
  }
  return null;
}

export async function loadRequisition(id) {
  const { data, error } = await createHcmAdminClient().from("requisitions").select(REQUISITION_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function setRequisitionStatus(req, status, extra = {}) {
  const { data, error } = await createHcmAdminClient()
    .from("requisitions")
    .update({ status, ...extra })
    .eq("id", req.id)
    .eq("status", req.status)
    .select(REQUISITION_SELECT)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new WorkflowError("This requisition was changed by someone else. Refresh and try again.", 409);
  return data;
}

/** Notifies the approvers of the step now pending. */
export async function notifyApprovers(req, step) {
  const approvers = await usersWithPermission(step.permission);
  const link = `/admin/dashboard/requisitions/${req.id}`;
  await notifyUsers(
    approvers.map((u) => u.id),
    { title: `${step.label}: ${req.code} ${req.role_title}`, body: `Raised by ${req.raiser?.full_name || "a manager"}`, link }
  );
  await queueEmail(
    "requisition_submitted",
    approvers.map((u) => u.email),
    {
      requisition_code: req.code,
      role_title: req.role_title,
      openings: req.openings,
      department: req.departments?.name || "—",
      manager_name: req.raiser?.full_name || "",
      link: appUrl(link),
    },
    { entity: "requisition", id: req.id }
  );
}

export async function submitRequisition(req, actor, request) {
  if (!["Draft", "Sent back"].includes(req.status)) {
    throw new WorkflowError(`A ${req.status} requisition cannot be submitted.`);
  }
  const problem = validateRequisition(req, { submitting: true });
  if (problem) throw new WorkflowError(problem);

  const steps = await getWorkflowSteps("requisition");
  if (!steps.length) throw new WorkflowError("Requisition workflow is not configured.", 500);
  const updated = await setRequisitionStatus(req, steps[0].status, { submitted_at: new Date().toISOString() });
  await openApproval("requisition", req.id, 0, steps);
  await logAudit({
    actor,
    action: "requisition.submit",
    entityType: "requisition",
    entityId: req.id,
    before: { status: req.status },
    after: { status: updated.status },
    request,
  });
  await notifyApprovers(updated, steps[0]);
  return updated;
}
