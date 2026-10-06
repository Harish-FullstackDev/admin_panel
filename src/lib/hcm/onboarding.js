import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers, usersWithPermission, appUrl } from "@/lib/hcm/notify";

export const DOCUMENTS_BUCKET = "documents";
export const TASK_TEAMS = ["HR", "IT", "Admin", "Manager", "Buddy"];
export const JOIN_STAGES = ["Intern", "Probation", "Full-time"];
export const BGV_STATUSES = ["Not started", "In progress", "Cleared", "Failed"];

export const JOINER_SELECT =
  "*, departments(name), locations(name), grades(code, name), manager:internal_users!joiners_manager_id_fkey(id, full_name, email), buddy:internal_users!joiners_buddy_id_fkey(id, full_name, email)";

export class OnboardingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function addDays(date, days) {
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Readiness for Day 1: every required document verified and BGV cleared. */
export function joinerReadiness(joiner, documents = [], tasks = []) {
  const required = documents.filter((d) => d.required);
  const docsVerified = required.filter((d) => d.status === "Verified").length;
  const blockers = [];
  if (docsVerified < required.length) blockers.push(`${required.length - docsVerified} required document(s) not verified`);
  if (joiner.bgv_status !== "Cleared") blockers.push(`Background check is ${joiner.bgv_status.toLowerCase()}`);
  return {
    docsRequired: required.length,
    docsVerified,
    docsAwaiting: documents.filter((d) => d.status === "Uploaded").length,
    bgv: joiner.bgv_status,
    tasksOpen: tasks.filter((t) => t.status === "Open").length,
    tasksTotal: tasks.length,
    blockers,
    ready: blockers.length === 0,
  };
}

/** Keeps joiners.status in step with readiness (Pre-joining <-> Ready). */
export async function syncJoinerStatus(joinerId) {
  const db = createHcmAdminClient();
  const [{ data: joiner }, { data: docs }] = await Promise.all([
    db.from("joiners").select("id, status, bgv_status").eq("id", joinerId).maybeSingle(),
    db.from("joiner_documents").select("required, status").eq("joiner_id", joinerId),
  ]);
  if (!joiner || !["Pre-joining", "Ready"].includes(joiner.status)) return joiner?.status;
  const next = joinerReadiness(joiner, docs || []).ready ? "Ready" : "Pre-joining";
  if (next !== joiner.status) await db.from("joiners").update({ status: next }).eq("id", joinerId);
  return next;
}

async function emailTaskAssignees(tasks, joiner) {
  const ids = [...new Set(tasks.map((t) => t.assignee_id).filter(Boolean))];
  if (!ids.length) return;
  const { data: users } = await createHcmAdminClient().from("internal_users").select("id, full_name, email").in("id", ids);
  const byId = Object.fromEntries((users || []).map((u) => [u.id, u]));
  for (const task of tasks) {
    const user = byId[task.assignee_id];
    if (!user) continue;
    await notifyUsers([user.id], {
      title: `Onboarding task: ${task.title}`,
      body: `${joiner.full_name} joins on ${joiner.joining_date}. Due ${task.due_date || "—"}.`,
      link: "/admin/dashboard/tasks",
    });
    await queueEmail(
      "onboarding_task_assigned",
      user.email,
      {
        name: user.full_name,
        joiner_name: joiner.full_name,
        joining_date: joiner.joining_date,
        task_title: task.title,
        due_date: task.due_date || "—",
        link: appUrl("/admin/dashboard/tasks"),
      },
      { entity: "task", id: task.id }
    );
  }
}

/** Notifies the assignee of a single task (used for add / reassign). */
export async function announceTask(task, joiner) {
  await emailTaskAssignees([task], joiner);
}

function resolveAssignee(item, joiner) {
  if (item.assignee_id) return item.assignee_id;
  if (item.team === "Manager") return joiner.manager_id || null;
  if (item.team === "Buddy") return joiner.buddy_id || null;
  return null;
}

/**
 * Creates onboarding tasks from a checklist template. With no templateId the
 * default template for the joiner's employment type is used.
 */
export async function applyTemplate(joiner, templateId, actor) {
  const db = createHcmAdminClient();
  let template = null;
  if (templateId) {
    ({ data: template } = await db.from("checklist_templates").select("*").eq("id", templateId).eq("archived", false).maybeSingle());
    if (!template) throw new OnboardingError("Checklist template not found.", 404);
  } else {
    const { data: candidates } = await db.from("checklist_templates").select("*").eq("archived", false);
    template =
      (candidates || []).find((t) => t.employment_type === joiner.employment_type) ||
      (candidates || []).find((t) => t.is_default) ||
      null;
    if (!template) return [];
  }

  const rows = (template.items || [])
    .filter((item) => item?.title)
    .map((item) => ({
      context_type: "onboarding",
      context_id: joiner.id,
      title: item.title,
      description: item.description || null,
      team: TASK_TEAMS.includes(item.team) ? item.team : "HR",
      assignee_id: resolveAssignee(item, joiner),
      due_date: addDays(joiner.joining_date, item.due_offset_days),
      created_by: actor?.id ?? null,
    }));
  if (!rows.length) return [];
  const { data: tasks, error } = await db.from("tasks").insert(rows).select();
  if (error) throw error;
  await emailTaskAssignees(tasks, joiner);
  return tasks;
}

/**
 * Starts onboarding for a hired application. Idempotent: returns the existing
 * joiner if one is already there.
 */
export async function createJoiner(applicationId, actor, request) {
  const db = createHcmAdminClient();
  const { data: existing } = await db.from("joiners").select("*").eq("application_id", applicationId).maybeSingle();
  if (existing) return { joiner: existing, created: false };

  const { data: app } = await db
    .from("applications")
    .select("id, candidate_id, job_id, first_name, last_name, email, phone, position, stage")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) throw new OnboardingError("Application not found.", 404);
  if (app.stage !== "Hired") throw new OnboardingError("Only hired candidates can start onboarding.");

  const [{ data: offer }, { data: job }] = await Promise.all([
    db.from("offers").select("id, joining_date").eq("application_id", app.id).eq("status", "Accepted")
      .order("responded_at", { ascending: false }).limit(1).maybeSingle(),
    app.job_id
      ? db.from("jobs").select("department_id, location_id, hiring_manager_id, type_of_work, location, requisitions(grade_id)")
          .eq("id", app.job_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const employmentType = job?.type_of_work || "Full-time";
  const internship = employmentType === "Internship";
  const { data: joiner, error } = await db
    .from("joiners")
    .insert({
      application_id: app.id,
      offer_id: offer?.id ?? null,
      candidate_id: app.candidate_id,
      job_id: app.job_id,
      full_name: `${app.first_name} ${app.last_name}`.trim(),
      personal_email: app.email,
      phone: app.phone,
      position: app.position,
      department_id: job?.department_id ?? null,
      location_id: job?.location_id ?? null,
      grade_id: job?.requisitions?.grade_id ?? null,
      manager_id: job?.hiring_manager_id ?? null,
      employment_type: employmentType,
      join_stage: internship ? "Intern" : "Probation",
      joining_date: offer?.joining_date || addDays(today(), 14),
      reporting_time: "09:30",
      reporting_location: job?.location || null,
      created_by: actor?.id ?? null,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: raced } = await db.from("joiners").select("*").eq("application_id", applicationId).single();
      return { joiner: raced, created: false };
    }
    throw error;
  }

  const { data: types } = await db.from("document_types").select("*").eq("archived", false).order("sort");
  const applicable = (types || []).filter((t) => t.applies_to === "all" || (t.applies_to === "Internship") === internship);
  if (applicable.length) {
    const { error: docError } = await db.from("joiner_documents").insert(
      applicable.map((t) => ({ joiner_id: joiner.id, type_code: t.code, name: t.name, required: t.required }))
    );
    if (docError) throw docError;
  }

  await applyTemplate(joiner, null, actor);

  await logAudit({
    actor,
    action: "onboarding.start",
    entityType: "joiner",
    entityId: joiner.id,
    after: { application_id: app.id, joining_date: joiner.joining_date, join_stage: joiner.join_stage },
    request,
  });
  await notifyUsers(
    { permission: "onboarding.manage" },
    { title: `New joiner: ${joiner.full_name}`, body: `${joiner.position}, joining ${joiner.joining_date}`, link: `/admin/dashboard/onboarding/${joiner.id}` }
  );
  await queueEmail(
    "documents_requested",
    joiner.personal_email,
    {
      candidate_name: joiner.full_name,
      job_title: joiner.position,
      joining_date: joiner.joining_date,
      documents: applicable.filter((t) => t.required).map((t) => `- ${t.name}`).join("\n"),
      link: appUrl("/candidate/joining"),
    },
    { entity: "joiner", id: joiner.id }
  );

  return { joiner, created: true };
}

const MAX_DOC_SIZE = 5 * 1024 * 1024;
const DOC_TYPES = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

/** Returns an error message, or null when the file is acceptable. */
export function validateDocumentFile(file) {
  if (!file || typeof file === "string") return "Choose a file to upload.";
  const ext = (file.name || "").split(".").pop().toLowerCase();
  if (!DOC_TYPES[ext]) return "Upload a PDF, JPG or PNG file.";
  if (file.size > MAX_DOC_SIZE) return "File exceeds the 5MB limit.";
  return null;
}

export async function uploadDocument(joinerId, typeCode, file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `${joinerId}/${typeCode}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await createHcmAdminClient()
    .storage.from(DOCUMENTS_BUCKET)
    .upload(path, buffer, { contentType: DOC_TYPES[ext], upsert: false });
  if (error) throw new Error(`Failed to upload document: ${error.message}`);
  return path;
}

export async function documentUrl(path, ttl = 600) {
  if (!path) return null;
  const { data } = await createHcmAdminClient().storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, ttl);
  return data?.signedUrl || null;
}

export async function onboardingManagers() {
  return usersWithPermission("onboarding.manage");
}
