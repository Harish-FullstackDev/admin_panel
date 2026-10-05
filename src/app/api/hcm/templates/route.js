import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail } from "@/lib/hcm/notify";

export async function GET(request) {
  const auth = await requirePermission(request, "template.manage");
  if (auth.error) return auth.error;
  try {
    const supabase = createHcmAdminClient();
    const [templates, outbox] = await Promise.all([
      supabase.from("email_templates").select("*").order("stage").order("name"),
      supabase.from("email_outbox").select("id, template_code, to_email, subject, status, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    if (templates.error) throw templates.error;
    return NextResponse.json({ success: true, templates: templates.data, outbox: outbox.data || [] });
  } catch (err) {
    return serverError("Templates GET", err);
  }
}

// PUT { code, subject?, body?, enabled? }
export async function PUT(request) {
  const auth = await requirePermission(request, "template.manage");
  if (auth.error) return auth.error;
  try {
    const { code, subject, body, enabled } = await request.json();
    if (!code) return jsonError("Template code is required.");
    const updates = { updated_by: auth.user.id, updated_at: new Date().toISOString() };
    if (subject !== undefined) {
      if (!String(subject).trim()) return jsonError("Subject cannot be empty.");
      updates.subject = String(subject);
    }
    if (body !== undefined) {
      if (!String(body).trim()) return jsonError("Body cannot be empty.");
      updates.body = String(body);
    }
    if (enabled !== undefined) updates.enabled = Boolean(enabled);

    const supabase = createHcmAdminClient();
    const { data: before } = await supabase.from("email_templates").select("subject, body, enabled").eq("code", code).maybeSingle();
    if (!before) return jsonError("Template not found.", 404);
    const { data, error } = await supabase.from("email_templates").update(updates).eq("code", code).select().single();
    if (error) throw error;
    await logAudit({
      actor: auth.user,
      action: "template.update",
      entityType: "email_template",
      entityId: code,
      before,
      after: { subject: data.subject, body: data.body, enabled: data.enabled },
      request,
    });
    return NextResponse.json({ success: true, template: data });
  } catch (err) {
    return serverError("Templates PUT", err);
  }
}

// POST { code, vars } — queues a test email to the current user.
export async function POST(request) {
  const auth = await requirePermission(request, "template.manage");
  if (auth.error) return auth.error;
  try {
    const { code, vars } = await request.json();
    if (!code) return jsonError("Template code is required.");
    await queueEmail(code, auth.user.email, vars || {}, { entity: "template_test" });
    return NextResponse.json({ success: true, message: `Test queued to ${auth.user.email} (email delivery is not connected yet).` });
  } catch (err) {
    return serverError("Templates POST", err);
  }
}
