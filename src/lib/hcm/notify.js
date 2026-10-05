import { createHcmAdminClient } from "@/lib/candidateSupabase";

export function renderTemplate(text, vars) {
  return String(text)
    .replace(/\\n/g, "\n")
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (vars[key] ?? "").toString());
}

export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${base}${path}`;
}

/**
 * EMAIL PLACEHOLDER. No provider is connected yet: every message is recorded
 * in email_outbox and marked "skipped". To go live, send `row` here with
 * nodemailer / Resend / SES and set status "sent" (or "failed" + error).
 */
async function deliverEmail(supabase, row) {
  console.info(`[email:skipped] to=${row.to_email} subject="${row.subject}"`);
  await supabase
    .from("email_outbox")
    .update({ status: "skipped", processed_at: new Date().toISOString() })
    .eq("id", row.id);
}

/**
 * Renders a template and queues it. Never throws, so a mail problem cannot
 * roll back the business action that triggered it.
 * @param {string} code  email_templates.code
 * @param {string|string[]} to
 * @param {Record<string, any>} vars
 * @param {{ entity?: string, id?: string }} related
 */
export async function queueEmail(code, to, vars = {}, related = {}) {
  try {
    const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
    if (!recipients.length) return;
    const supabase = createHcmAdminClient();
    const { data: template } = await supabase
      .from("email_templates")
      .select("code, subject, body, enabled")
      .eq("code", code)
      .maybeSingle();
    if (!template || !template.enabled) return;

    const rows = recipients.map((email) => ({
      template_code: code,
      to_email: email,
      subject: renderTemplate(template.subject, vars),
      body: renderTemplate(template.body, vars),
      related_entity: related.entity ?? null,
      related_id: related.id ?? null,
    }));
    const { data: inserted, error } = await supabase.from("email_outbox").insert(rows).select();
    if (error) throw error;
    for (const row of inserted) await deliverEmail(supabase, row);
  } catch (err) {
    console.error(`queueEmail(${code}) failed:`, err);
  }
}

/** In-app notifications. `target` is user ids or { permission: "requisition.review" }. */
export async function notifyUsers(target, { title, body = null, link = null }) {
  try {
    const supabase = createHcmAdminClient();
    let userIds = Array.isArray(target) ? target : [];
    if (!Array.isArray(target) && target?.permission) {
      userIds = (await usersWithPermission(target.permission)).map((u) => u.id);
    }
    userIds = [...new Set(userIds.filter(Boolean))];
    if (!userIds.length) return;
    const { error } = await supabase
      .from("notifications")
      .insert(userIds.map((user_id) => ({ user_id, title, body, link })));
    if (error) throw error;
  } catch (err) {
    console.error("notifyUsers failed:", err);
  }
}

/** Active internal users holding a permission through any unexpired role. */
export async function usersWithPermission(permission) {
  const supabase = createHcmAdminClient();
  const { data: grants } = await supabase
    .from("role_permissions")
    .select("role_code")
    .eq("permission_code", permission);
  const roleCodes = (grants || []).map((g) => g.role_code);
  if (!roleCodes.length) return [];

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("user_roles")
    .select("internal_users!inner(id, email, full_name, status)")
    .in("role_code", roleCodes)
    .or(`expires_at.is.null,expires_at.gt.${now}`);
  const seen = new Map();
  for (const row of data || []) {
    const u = row.internal_users;
    if (u?.status === "Active") seen.set(u.id, u);
  }
  return [...seen.values()];
}
