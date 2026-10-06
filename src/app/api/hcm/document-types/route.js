import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";

const APPLIES_TO = ["all", "Internship", "Experienced"];

function clean(body) {
  const name = String(body.name || "").trim();
  if (!name) return { error: "Document name is required." };
  const appliesTo = body.applies_to || "all";
  if (!APPLIES_TO.includes(appliesTo)) return { error: "Invalid 'applies to' value." };
  return {
    value: {
      name,
      description: body.description?.trim() || null,
      required: body.required !== false,
      applies_to: appliesTo,
      sort: Number.isFinite(Number(body.sort)) ? Number(body.sort) : 100,
    },
  };
}

export async function GET(request) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  try {
    const { data, error } = await createHcmAdminClient().from("document_types").select("*").order("archived").order("sort");
    if (error) throw error;
    return NextResponse.json({ success: true, documentTypes: data });
  } catch (err) {
    return serverError("Document types GET", err);
  }
}

export async function POST(request) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { value, error: invalid } = clean(body);
    if (invalid) return jsonError(invalid);
    const code = value.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
    if (!code) return jsonError("Document name must contain letters or numbers.");
    const { data, error } = await createHcmAdminClient().from("document_types").insert({ code, ...value }).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("A document type with this name already exists.", 409);
      throw error;
    }
    await logAudit({ actor: auth.user, action: "document_type.create", entityType: "document_type", entityId: code, after: data, request });
    return NextResponse.json({ success: true, documentType: data }, { status: 201 });
  } catch (err) {
    return serverError("Document types POST", err);
  }
}

// PATCH { code, ...fields } or { code, archived }
export async function PATCH(request) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const db = createHcmAdminClient();
    const { data: before } = await db.from("document_types").select("*").eq("code", body.code).maybeSingle();
    if (!before) return jsonError("Document type not found.", 404);
    let update;
    if (Object.keys(body).every((k) => k === "code" || k === "archived")) {
      update = { archived: Boolean(body.archived) };
    } else {
      const { value, error: invalid } = clean(body);
      if (invalid) return jsonError(invalid);
      update = value;
    }
    const { data, error } = await db.from("document_types").update(update).eq("code", body.code).select().single();
    if (error) throw error;
    await logAudit({ actor: auth.user, action: "document_type.update", entityType: "document_type", entityId: body.code, before, after: data, request });
    return NextResponse.json({ success: true, documentType: data });
  } catch (err) {
    return serverError("Document types PATCH", err);
  }
}
