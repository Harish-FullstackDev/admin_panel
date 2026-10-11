import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { TASK_TEAMS } from "@/lib/hcm/onboarding";

const PURPOSES = { onboarding: "onboarding.manage", exit: "exit.manage" };
const ANY = Object.values(PURPOSES);

function cleanTemplate(body) {
  const name = String(body.name || "").trim();
  if (!name) return { error: "Template name is required." };
  if (!Array.isArray(body.items)) return { error: "Add at least one task." };
  const items = body.items
    .map((item) => ({
      title: String(item?.title || "").trim(),
      team: TASK_TEAMS.includes(item?.team) ? item.team : "HR",
      due_offset_days: Number.isFinite(Number(item?.due_offset_days)) ? Math.round(Number(item.due_offset_days)) : 0,
      ...(item?.assignee_id ? { assignee_id: item.assignee_id } : {}),
      ...(item?.description?.trim() ? { description: item.description.trim() } : {}),
    }))
    .filter((item) => item.title);
  if (!items.length) return { error: "Add at least one task." };
  return {
    value: {
      name,
      employment_type: body.employment_type || null,
      is_default: Boolean(body.is_default),
      items,
    },
  };
}

function canManage(user, purpose) {
  return Boolean(PURPOSES[purpose]) && hasPermission(user, PURPOSES[purpose]);
}

// GET ?purpose=onboarding|exit (default onboarding)
export async function GET(request) {
  const auth = await requirePermission(request, ANY);
  if (auth.error) return auth.error;
  try {
    const purpose = new URL(request.url).searchParams.get("purpose") || "onboarding";
    if (!canManage(auth.user, purpose)) return jsonError("You do not have permission to do this.", 403);
    const { data, error } = await createHcmAdminClient()
      .from("checklist_templates")
      .select("*")
      .eq("purpose", purpose)
      .order("archived")
      .order("name");
    if (error) throw error;
    return NextResponse.json({ success: true, templates: data });
  } catch (err) {
    return serverError("Checklist templates GET", err);
  }
}

async function clearOtherDefaults(db, keep) {
  await db.from("checklist_templates").update({ is_default: false }).neq("id", keep.id).eq("purpose", keep.purpose).eq("is_default", true);
}

export async function POST(request) {
  const auth = await requirePermission(request, ANY);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const purpose = body.purpose || "onboarding";
    if (!canManage(auth.user, purpose)) return jsonError("You do not have permission to do this.", 403);
    const { value, error: invalid } = cleanTemplate(body);
    if (invalid) return jsonError(invalid);
    const db = createHcmAdminClient();
    const { data, error } = await db.from("checklist_templates").insert({ ...value, purpose }).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("A template with this name already exists.", 409);
      throw error;
    }
    if (data.is_default) await clearOtherDefaults(db, data);
    await logAudit({ actor: auth.user, action: "checklist_template.create", entityType: "checklist_template", entityId: data.id, after: data, request });
    return NextResponse.json({ success: true, template: data }, { status: 201 });
  } catch (err) {
    return serverError("Checklist templates POST", err);
  }
}

// PATCH { id, ...fields } or { id, archived }
export async function PATCH(request) {
  const auth = await requirePermission(request, ANY);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const db = createHcmAdminClient();
    const { data: before } = await db.from("checklist_templates").select("*").eq("id", body.id).maybeSingle();
    if (!before) return jsonError("Template not found.", 404);
    if (!canManage(auth.user, before.purpose)) return jsonError("You do not have permission to do this.", 403);

    let update;
    if (Object.keys(body).every((k) => k === "id" || k === "archived")) {
      update = { archived: Boolean(body.archived), ...(body.archived ? { is_default: false } : {}) };
    } else {
      const { value, error: invalid } = cleanTemplate(body);
      if (invalid) return jsonError(invalid);
      update = value;
    }
    const { data, error } = await db.from("checklist_templates").update(update).eq("id", body.id).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("A template with this name already exists.", 409);
      throw error;
    }
    if (data.is_default) await clearOtherDefaults(db, data);
    await logAudit({ actor: auth.user, action: "checklist_template.update", entityType: "checklist_template", entityId: data.id, before, after: data, request });
    return NextResponse.json({ success: true, template: data });
  } catch (err) {
    return serverError("Checklist templates PATCH", err);
  }
}
