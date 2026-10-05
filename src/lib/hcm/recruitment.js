import { createHcmAdminClient, CANDIDATE_RESUME_BUCKET } from "@/lib/candidateSupabase";
import { hasPermission } from "@/lib/hcm/auth";
import { queueEmail, notifyUsers, appUrl, usersWithPermission } from "@/lib/hcm/notify";

export const SALARY_FIELDS = ["current_salary", "expected_salary"];

export function stripSalary(user, row) {
  if (!row || hasPermission(user, "offer.view_salary")) return row;
  const copy = { ...row };
  for (const f of SALARY_FIELDS) delete copy[f];
  return copy;
}

export function candidateName(app) {
  return `${app.first_name || ""} ${app.last_name || ""}`.trim() || app.email;
}

/** Job ids a hiring manager (scope "own") is responsible for. */
export async function managedJobIds(userId) {
  const { data } = await createHcmAdminClient().from("jobs").select("id").eq("hiring_manager_id", userId);
  return (data || []).map((j) => j.id);
}

/**
 * Decides how much of an application `user` may see.
 * Returns "full" (application.view in scope), "interviewer" (on a panel for
 * it: limited, no salary), or null.
 */
export async function applicationAccess(user, app) {
  const scope = user.permissions["application.view"];
  if (scope === "all" || scope === "department") return "full";
  if (scope && app.job_id) {
    const { data } = await createHcmAdminClient()
      .from("jobs")
      .select("id")
      .eq("id", app.job_id)
      .eq("hiring_manager_id", user.id)
      .maybeSingle();
    if (data) return "full";
  }
  const { data: panel } = await createHcmAdminClient()
    .from("interview_panel")
    .select("interview_id, interviews!inner(application_id)")
    .eq("interviewer_id", user.id)
    .eq("interviews.application_id", app.id)
    .limit(1);
  return panel?.length ? "interviewer" : null;
}

export async function signedResumeUrl(path, ttl = 3600) {
  if (!path) return null;
  const { data } = await createHcmAdminClient().storage.from(CANDIDATE_RESUME_BUCKET).createSignedUrl(path, ttl);
  return data?.signedUrl || null;
}

/** Emails / notifications that follow a pipeline stage change. */
export async function afterStageChange(app, to, { job } = {}) {
  const vars = {
    candidate_name: candidateName(app),
    job_title: job?.title || app.position,
    link: appUrl("/candidate/dashboard"),
  };
  const related = { entity: "application", id: app.id };
  if (to === "Shortlisted") await queueEmail("application_shortlisted", app.email, vars, related);
  // Plan §8.1 wants a configurable delay for rejections; with delivery stubbed
  // the row is recorded immediately.
  if (to === "Rejected") await queueEmail("application_rejected", app.email, vars, related);
  if (to === "Selected") {
    await notifyUsers(
      { permission: "offer.create" },
      {
        title: `${vars.candidate_name} selected for ${vars.job_title}`,
        body: "Draft and send the offer.",
        link: `/admin/dashboard/offers?application=${app.id}`,
      }
    );
  }
}

export async function emailsFor(permission) {
  return (await usersWithPermission(permission)).map((u) => u.email);
}
