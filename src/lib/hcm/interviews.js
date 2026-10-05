import { queueEmail, notifyUsers } from "@/lib/hcm/notify";
import { candidateName } from "@/lib/hcm/recruitment";

const TYPES = ["hr", "technical", "managerial", "culture", "other"];
const MODES = ["online", "onsite", "phone"];

export function interviewFields(body, { partial = false } = {}) {
  const value = {};
  if (!partial || "round_name" in body) {
    value.round_name = String(body.round_name || "").trim();
    if (!value.round_name) return { error: "Round name is required." };
  }
  if (!partial || "type" in body) value.type = TYPES.includes(body.type) ? body.type : "other";
  if (!partial || "mode" in body) value.mode = MODES.includes(body.mode) ? body.mode : "online";
  if (!partial || "scheduled_at" in body) {
    const when = new Date(body.scheduled_at);
    if (Number.isNaN(when.getTime())) return { error: "A valid date and time is required." };
    if (when.getTime() < Date.now() - 5 * 60 * 1000) return { error: "Interview time must be in the future." };
    value.scheduled_at = when.toISOString();
  }
  if (!partial || "duration_min" in body) value.duration_min = Math.min(480, Math.max(10, parseInt(body.duration_min, 10) || 45));
  if (!partial || "meeting_link" in body) value.meeting_link = String(body.meeting_link || "").trim() || null;
  if (!partial || "location" in body) value.location = String(body.location || "").trim() || null;
  if (!partial || "instructions" in body) value.instructions = String(body.instructions || "").trim() || null;

  const mode = value.mode;
  if (mode === "online" && !partial && !value.meeting_link) return { error: "Add a meeting link for online interviews." };
  if (mode === "onsite" && !partial && !value.location) return { error: "Add a location for onsite interviews." };
  return { value };
}

export function formatWhen(iso) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" }) + " IST";
}

/** Emails the candidate and panel, and notifies the panel in-app. */
export async function sendInterviewEmails(code, interview, app, panelUsers, job) {
  const base = {
    job_title: job?.title || app.position,
    round_name: interview.round_name,
    interview_date: formatWhen(interview.scheduled_at),
    mode: interview.mode,
    where: interview.meeting_link || interview.location || "To be shared",
    candidate_name: candidateName(app),
  };
  const related = { entity: "interview", id: interview.id };
  await queueEmail(code, app.email, { ...base, name: candidateName(app) }, related);
  for (const u of panelUsers || []) {
    await queueEmail(code, u.email, { ...base, name: u.full_name }, related);
  }
  const verb = { interview_scheduled: "scheduled", interview_rescheduled: "rescheduled", interview_cancelled: "cancelled" }[code];
  await notifyUsers(
    (panelUsers || []).map((u) => u.id),
    { title: `Interview ${verb}: ${candidateName(app)}`, body: `${base.round_name} · ${base.interview_date}`, link: `/admin/dashboard/interviews?focus=${interview.id}` }
  );
}
