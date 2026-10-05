import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";

const KINDS = {
  departments: { fields: ["name", "code", "parent_id"], required: ["name"], order: "name" },
  locations: { fields: ["name", "city", "country", "timezone"], required: ["name"], order: "name" },
  grades: { fields: ["code", "name", "band_min", "band_max", "currency"], required: ["code", "name"], order: "code" },
};

function pick(kind, body) {
  const out = {};
  for (const field of KINDS[kind].fields) {
    if (!(field in body)) continue;
    const value = body[field];
    if (field.startsWith("band_")) out[field] = value === "" || value === null ? null : Number(value);
    else out[field] = typeof value === "string" ? value.trim() || null : value ?? null;
  }
  return out;
}

// GET is open to any internal user: pickers on requisition/job forms need it.
export async function GET(request, { params }) {
  const { kind } = await params;
  if (!KINDS[kind]) return jsonError("Unknown organization list.", 404);
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const includeArchived = new URL(request.url).searchParams.get("all") === "1";
    let query = createHcmAdminClient().from(kind).select("*").order(KINDS[kind].order);
    if (!includeArchived) query = query.eq("archived", false);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, items: data });
  } catch (err) {
    return serverError(`Org ${kind} GET`, err);
  }
}

export async function POST(request, { params }) {
  const { kind } = await params;
  if (!KINDS[kind]) return jsonError("Unknown organization list.", 404);
  const auth = await requirePermission(request, "org.manage");
  if (auth.error) return auth.error;
  try {
    const row = pick(kind, await request.json());
    for (const field of KINDS[kind].required) if (!row[field]) return jsonError(`${field} is required.`);
    const { data, error } = await createHcmAdminClient().from(kind).insert(row).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("An entry with this name or code already exists.", 409);
      if (error.code === "23514") return jsonError("Band minimum must not exceed band maximum.");
      throw error;
    }
    await logAudit({ actor: auth.user, action: `${kind}.create`, entityType: kind, entityId: data.id, after: data, request });
    return NextResponse.json({ success: true, item: data }, { status: 201 });
  } catch (err) {
    return serverError(`Org ${kind} POST`, err);
  }
}

// PATCH { id, ...fields, archived? }
export async function PATCH(request, { params }) {
  const { kind } = await params;
  if (!KINDS[kind]) return jsonError("Unknown organization list.", 404);
  const auth = await requirePermission(request, "org.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    if (!body.id) return jsonError("id is required.");
    const updates = pick(kind, body);
    if ("archived" in body) updates.archived = Boolean(body.archived);
    const supabase = createHcmAdminClient();
    const { data: before } = await supabase.from(kind).select("*").eq("id", body.id).maybeSingle();
    if (!before) return jsonError("Entry not found.", 404);
    const { data, error } = await supabase.from(kind).update(updates).eq("id", body.id).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("An entry with this name or code already exists.", 409);
      if (error.code === "23514") return jsonError("Band minimum must not exceed band maximum.");
      throw error;
    }
    await logAudit({ actor: auth.user, action: `${kind}.update`, entityType: kind, entityId: body.id, before, after: data, request });
    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    return serverError(`Org ${kind} PATCH`, err);
  }
}
