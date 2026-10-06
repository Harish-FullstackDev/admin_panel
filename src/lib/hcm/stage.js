import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { hasPermission } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers, usersWithPermission, renderTemplate, appUrl } from "@/lib/hcm/notify";
import { getWorkflowSteps, openApproval, pendingApproval, closeApproval } from "@/lib/hcm/workflow";
import { addDays } from "@/lib/hcm/onboarding";

export const OPEN_STATUSES = ["Active", "Pending approval"];
export const RECOMMENDATIONS = ["Confirm", "Extend", "Convert to probation", "Convert to full-time", "Release"];
export const OUTCOMES = ["Confirmed", "Extended", "Converted", "Released"];

export const REVIEW_CRITERIA = {
  Probation: ["Job knowledge", "Quality of work", "Communication", "Teamwork", "Ownership"],
  Intern: ["Learning ability", "Task delivery", "Communication", "Initiative"],
};

export const STAGE_EMPLOYEE_SELECT =
  "id, full_name, official_email, employee_code, designation, stage, stage_end_date, status, joining_date, manager_id, department_id, departments(name), manager:internal_users!employees_manager_id_fkey(id, full_name, email)";

export class StageError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

/** Mid-point halfway through; final two weeks before the end (never before mid). */
export function reviewDates(start, end) {
  const mid = addDays(start, Math.floor(daysBetween(start, end) / 2));
  const final = addDays(end, -14);
  return { mid_review_date: mid, final_review_date: final < mid ? mid : final };
}

/** Monday of the week containing `date` (ISO yyyy-mm-dd). */
export function weekStart(date = today()) {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Opens a stage record for an intern / probationer if they have none. */
export async function ensureStageRecord(employee, actor, { mentorId = null, startDate = null } = {}) {
  if (!["Intern", "Probation"].includes(employee.stage) || !employee.stage_end_date) return null;
  const db = createHcmAdminClient();
  const { data: open } = await db.from("stage_records").select("*").eq("employee_id", employee.id).in("status", OPEN_STATUSES).maybeSingle();
  if (open) return open;
  const start = startDate || employee.joining_date;
  if (employee.stage_end_date <= start) return null;
  const { data, error } = await db
    .from("stage_records")
    .insert({
      employee_id: employee.id,
      type: employee.stage,
      start_date: start,
      end_date: employee.stage_end_date,
      original_end_date: employee.stage_end_date,
      mentor_id: mentorId,
      created_by: actor?.id ?? null,
      ...reviewDates(start, employee.stage_end_date),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** What the user may do on this record. */
export function stageAccess(user, record, employee) {
  const manage = hasPermission(user, "probation.manage");
  const reviewScope = user.permissions["probation.review"];
  const review =
    manage ||
    reviewScope === "all" ||
    (Boolean(reviewScope) && employee.manager_id === user.id) ||
    record.mentor_id === user.id ||
    employee.manager_id === user.id;
  return {
    manage,
    review,
    approve: hasPermission(user, "probation.approve"),
    self: employee.id === user.id,
  };
}

export async function loadStage(id) {
  const db = createHcmAdminClient();
  const { data: record } = await db
    .from("stage_records")
    .select("*, mentor:internal_users!stage_records_mentor_id_fkey(id, full_name, email)")
    .eq("id", id)
    .maybeSingle();
  if (!record) throw new StageError("Record not found.", 404);
  const { data: employee } = await db.from("employees").select(STAGE_EMPLOYEE_SELECT).eq("id", record.employee_id).single();
  return { record, employee };
}

async function hrUsers() {
  return usersWithPermission("probation.manage");
}

function letterVars(employee, record, extra = {}) {
  return {
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    name: employee.full_name,
    designation: employee.designation || "—",
    employee_code: employee.employee_code,
    stage_type_lower: record.type === "Intern" ? "internship" : "probation",
    start_date: record.start_date,
    end_date: record.end_date,
    signatory: "Human Resources",
    note: "",
    ...extra,
  };
}

/** Renders a letter_* template and stores it against the employee. */
export async function issueLetter(employee, record, type, vars, actor) {
  const db = createHcmAdminClient();
  const { data: template } = await db.from("email_templates").select("subject, body").eq("code", `letter_${type}`).maybeSingle();
  const all = letterVars(employee, record, vars);
  const title = template ? renderTemplate(template.subject, all) : type;
  const body = template ? renderTemplate(template.body, all) : "";
  const { data, error } = await db
    .from("letters")
    .insert({ employee_id: employee.id, type, title, body, stage_record_id: record.id, issued_by: actor?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

const OUTCOME_EVENT = { Confirmed: "confirm", Extended: "extend", Converted: "convert", Released: "release" };

function outcomeDetails(record, p) {
  if (p.outcome === "Extended") return `New end date: ${p.endDate}`;
  if (p.outcome === "Released") return `Last working day: ${p.lastDay}`;
  if (p.outcome === "Converted") return `Joins as ${p.toStage}${p.endDate ? ` (probation until ${p.endDate})` : ""}`;
  return `Confirmed as a permanent employee`;
}

function proposalFromRecord(record) {
  return {
    outcome: record.proposed_outcome,
    endDate: record.proposed_end_date,
    toStage: record.proposed_stage,
    lastDay: record.proposed_last_day,
    note: record.proposed_note,
  };
}

/** The only place outcomes change the employee record. */
export async function applyOutcome(record, employee, p, actor, request) {
  const db = createHcmAdminClient();
  const now = new Date().toISOString();
  const effective = today();
  let recordUpdate;
  let employeeUpdate;
  let letter;

  if (p.outcome === "Confirmed") {
    recordUpdate = { status: "Completed", outcome: "Confirmed", closed_at: now };
    employeeUpdate = { stage: "Full-time", stage_end_date: null };
  } else if (p.outcome === "Extended") {
    recordUpdate = {
      status: "Active",
      outcome: null,
      end_date: p.endDate,
      extension_count: record.extension_count + 1,
      final_review_date: reviewDates(record.start_date, p.endDate).final_review_date,
      final_reminded_at: null,
      recommendation: null,
    };
    employeeUpdate = { stage_end_date: p.endDate };
  } else if (p.outcome === "Converted") {
    recordUpdate = { status: "Completed", outcome: "Converted", closed_at: now };
    employeeUpdate = { stage: p.toStage, stage_end_date: p.toStage === "Probation" ? p.endDate : null };
  } else if (p.outcome === "Released") {
    recordUpdate = { status: "Completed", outcome: "Released", closed_at: now };
    employeeUpdate = { status: "Notice", last_working_date: p.lastDay };
  } else {
    throw new StageError("Unknown outcome.");
  }

  const clearProposal = {
    proposed_outcome: null, proposed_end_date: null, proposed_stage: null, proposed_last_day: null, proposed_note: null, proposed_by: null,
  };
  const { error: recErr } = await db
    .from("stage_records")
    .update({ ...recordUpdate, ...clearProposal, outcome_note: p.note || null, decided_by: actor.id })
    .eq("id", record.id);
  if (recErr) throw recErr;

  const before = Object.fromEntries(Object.keys(employeeUpdate).map((k) => [k, employee[k] ?? null]));
  const { error: empErr } = await db.from("employees").update(employeeUpdate).eq("id", employee.id);
  if (empErr) throw empErr;

  await db.from("employee_events").insert({
    employee_id: employee.id,
    type: OUTCOME_EVENT[p.outcome],
    effective_date: p.outcome === "Released" ? p.lastDay : effective,
    before,
    after: employeeUpdate,
    note: p.note || null,
    actor_id: actor.id,
  });

  if (p.outcome === "Confirmed") {
    letter = await issueLetter(employee, record, "confirmation", { effective_date: effective }, actor);
  } else if (p.outcome === "Extended") {
    letter = await issueLetter(employee, record, "extension", { end_date: p.endDate, note: p.note || "" }, actor);
  } else if (p.outcome === "Converted") {
    await issueLetter(employee, record, "internship_certificate", { end_date: effective }, actor);
    letter = await issueLetter(
      employee,
      record,
      "conversion",
      { new_stage: p.toStage === "Probation" ? "a probationer" : "a full-time employee", effective_date: effective, end_clause: p.toStage === "Probation" ? ` Your probation period runs until ${p.endDate}.` : "" },
      actor
    );
    if (p.toStage === "Probation") {
      await ensureStageRecord({ ...employee, ...employeeUpdate }, actor, { mentorId: record.mentor_id, startDate: effective });
    }
  } else if (p.outcome === "Released") {
    letter = await issueLetter(employee, record, "release", { last_day: p.lastDay, note: p.note || "" }, actor);
  }

  await logAudit({
    actor,
    action: `stage.${OUTCOME_EVENT[p.outcome]}`,
    entityType: "stage_record",
    entityId: record.id,
    before: { status: record.status, end_date: record.end_date, employee: before },
    after: { outcome: p.outcome, ...recordUpdate, employee: employeeUpdate },
    request,
  });

  const details = outcomeDetails(record, p);
  const hr = await hrUsers();
  await notifyUsers([employee.id], { title: `Your ${record.type === "Intern" ? "internship" : "probation"} outcome: ${p.outcome}`, body: details, link: "/admin/dashboard/my-stage" });
  await notifyUsers([employee.manager_id, ...hr.map((u) => u.id)].filter((id) => id && id !== actor.id), {
    title: `${employee.full_name}: ${p.outcome}`,
    body: details,
    link: `/admin/dashboard/probation/${record.id}`,
  });
  await queueEmail(
    "stage_outcome",
    employee.official_email,
    {
      name: employee.full_name,
      stage_type_lower: record.type === "Intern" ? "internship" : "probation",
      outcome: p.outcome,
      details,
      link: appUrl("/admin/dashboard/my-stage"),
    },
    { entity: "stage_record", id: record.id }
  );
  return letter;
}

/** HR proposes an outcome. Confirm/convert apply now; extend/release need CHRO approval. */
export async function proposeOutcome(record, employee, input, actor, request) {
  if (record.status !== "Active") throw new StageError(`This record is ${record.status.toLowerCase()}.`);
  const p = {
    outcome: input.outcome,
    endDate: input.end_date || null,
    toStage: input.to_stage || null,
    lastDay: input.last_day || null,
    note: String(input.note || "").trim() || null,
  };
  if (!OUTCOMES.includes(p.outcome)) throw new StageError("Choose an outcome.");
  if (p.outcome === "Confirmed" && record.type !== "Probation") throw new StageError("Only probationers can be confirmed. Convert the intern instead.");
  if (p.outcome === "Converted") {
    if (record.type !== "Intern") throw new StageError("Only interns can be converted.");
    if (!["Probation", "Full-time"].includes(p.toStage)) throw new StageError("Choose what the intern converts to.");
    if (p.toStage === "Probation" && (!p.endDate || p.endDate <= today())) throw new StageError("Probation end date must be in the future.");
    if (p.toStage === "Full-time") p.endDate = null;
  }
  if (p.outcome === "Extended" && (!p.endDate || p.endDate <= record.end_date)) throw new StageError("The new end date must be after the current end date.");
  if (p.outcome === "Released") {
    if (!p.lastDay) throw new StageError("Last working day is required.");
    if (!p.note) throw new StageError("Add a note explaining the release.");
  }

  if (p.outcome === "Confirmed" || p.outcome === "Converted") {
    const letter = await applyOutcome(record, employee, p, actor, request);
    return { applied: true, letter };
  }

  const db = createHcmAdminClient();
  const { data: updated, error } = await db
    .from("stage_records")
    .update({
      status: "Pending approval",
      proposed_outcome: p.outcome,
      proposed_end_date: p.endDate,
      proposed_stage: p.toStage,
      proposed_last_day: p.lastDay,
      proposed_note: p.note,
      proposed_by: actor.id,
    })
    .eq("id", record.id)
    .eq("status", "Active")
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new StageError("This record was changed by someone else. Refresh and try again.", 409);

  const steps = await getWorkflowSteps("stage_outcome");
  await openApproval("stage_record", record.id, 0, steps.length ? steps : [{ key: "chro_approval", permission: "probation.approve", sla_days: 2 }]);
  await logAudit({ actor, action: "stage.propose", entityType: "stage_record", entityId: record.id, after: { outcome: p.outcome, end_date: p.endDate, last_day: p.lastDay, note: p.note }, request });

  const approvers = await usersWithPermission("probation.approve");
  const details = outcomeDetails(record, p);
  await notifyUsers(approvers.map((u) => u.id).filter((id) => id !== actor.id), {
    title: `Approval needed: ${p.outcome} for ${employee.full_name}`,
    body: details,
    link: `/admin/dashboard/probation/${record.id}`,
  });
  await queueEmail(
    "stage_outcome_pending",
    approvers.map((u) => u.email),
    {
      proposer_name: actor.fullName || actor.email,
      outcome: p.outcome,
      employee_name: employee.full_name,
      stage_type: record.type,
      details,
      note: p.note || "—",
      link: appUrl(`/admin/dashboard/probation/${record.id}`),
    },
    { entity: "stage_record", id: record.id }
  );
  return { applied: false };
}

/** CHRO decision on a pending extend/release. */
export async function decideOutcome(record, employee, { decision, comment }, actor, request) {
  if (record.status !== "Pending approval") throw new StageError("Nothing is waiting for approval.");
  if (!["Approved", "Rejected"].includes(decision)) throw new StageError("Decision must be Approved or Rejected.");
  if (record.proposed_by === actor.id) throw new StageError("You cannot approve your own proposal.", 403);
  const text = String(comment || "").trim();
  if (decision === "Rejected" && !text) throw new StageError("Add a comment explaining the rejection.");

  const approval = await pendingApproval("stage_record", record.id);
  if (approval) await closeApproval(approval, { status: decision, actor, comment: text });

  if (decision === "Approved") {
    const p = proposalFromRecord(record);
    const letter = await applyOutcome(record, employee, p, actor, request);
    return { applied: true, letter };
  }

  const db = createHcmAdminClient();
  await db
    .from("stage_records")
    .update({ status: "Active", proposed_outcome: null, proposed_end_date: null, proposed_stage: null, proposed_last_day: null, proposed_note: null, proposed_by: null })
    .eq("id", record.id);
  await logAudit({ actor, action: "stage.reject_outcome", entityType: "stage_record", entityId: record.id, before: { proposed_outcome: record.proposed_outcome }, after: { comment: text }, request });
  if (record.proposed_by) {
    await notifyUsers([record.proposed_by], {
      title: `${record.proposed_outcome} for ${employee.full_name} was not approved`,
      body: text,
      link: `/admin/dashboard/probation/${record.id}`,
    });
  }
  return { applied: false };
}

/**
 * Lazy reminder pass (no cron yet): reviews due within 15 days notify the
 * manager and HR once per review. Never throws.
 */
export async function remindDueReviews() {
  try {
    const db = createHcmAdminClient();
    const horizon = addDays(today(), 15);
    const { data: records } = await db
      .from("stage_records")
      .select("id, type, employee_id, mid_review_date, final_review_date, mid_reminded_at, final_reminded_at")
      .in("status", OPEN_STATUSES)
      .or(`and(mid_reminded_at.is.null,mid_review_date.lte.${horizon}),and(final_reminded_at.is.null,final_review_date.lte.${horizon})`);
    if (!records?.length) return;

    const { data: employees } = await db
      .from("employees")
      .select("id, full_name, manager:internal_users!employees_manager_id_fkey(id, full_name, email)")
      .in("id", records.map((r) => r.employee_id));
    const byId = Object.fromEntries((employees || []).map((e) => [e.id, e]));
    const hr = await hrUsers();

    for (const r of records) {
      const employee = byId[r.employee_id];
      if (!employee) continue;
      for (const kind of ["mid", "final"]) {
        const date = r[`${kind}_review_date`];
        if (!date || r[`${kind}_reminded_at`] || date > horizon) continue;
        // Claim the reminder first so concurrent requests don't double-send.
        const { data: claimed } = await db
          .from("stage_records")
          .update({ [`${kind}_reminded_at`]: new Date().toISOString() })
          .eq("id", r.id)
          .is(`${kind}_reminded_at`, null)
          .select("id")
          .maybeSingle();
        if (!claimed) continue;
        const label = kind === "mid" ? "Mid-point" : "Final";
        const recipients = [employee.manager, ...hr].filter(Boolean);
        const unique = [...new Map(recipients.map((u) => [u.id, u])).values()];
        await notifyUsers(unique.map((u) => u.id), {
          title: `${label} review due: ${employee.full_name}`,
          body: `${r.type} · due ${date}`,
          link: `/admin/dashboard/probation/${r.id}`,
        });
        for (const u of unique) {
          await queueEmail(
            "stage_review_due",
            u.email,
            { name: u.full_name, review_type: label, employee_name: employee.full_name, stage_type: r.type, review_date: date, link: appUrl(`/admin/dashboard/probation/${r.id}`) },
            { entity: "stage_record", id: r.id }
          );
        }
      }
    }
  } catch (err) {
    console.error("remindDueReviews failed:", err);
  }
}
