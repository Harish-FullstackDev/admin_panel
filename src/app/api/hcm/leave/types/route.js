import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";

const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

function clean(body) {
  const name = String(body.name || "").trim();
  if (!name) return { error: "Name is required." };
  const value = {
    name,
    annual_quota: num(body.annual_quota),
    intern_quota: num(body.intern_quota),
    interns_allowed: body.interns_allowed !== false,
    paid: body.paid !== false,
    carry_forward_max: num(body.carry_forward_max) ?? 0,
    allow_half_day: body.allow_half_day !== false,
    color: body.color || "teal",
    sort: num(body.sort) ?? 100,
  };
  for (const k of ["annual_quota", "intern_quota", "carry_forward_max", "sort"]) {
    if (value[k] !== null && (!Number.isFinite(value[k]) || value[k] < 0)) return { error: `Invalid ${k.replace(/_/g, " ")}.` };
  }
  return { value };
}

export async function GET(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const { data, error } = await createHcmAdminClient().from("leave_types").select("*").order("archived").order("sort");
    if (error) throw error;
    return NextResponse.json({ success: true, types: data });
  } catch (err) {
    return serverError("Leave types GET", err);
  }
}

export async function POST(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (!code) return jsonError("Short code is required (e.g. ML).");
    const { value, error: invalid } = clean(body);
    if (invalid) return jsonError(invalid);
    const { data, error } = await createHcmAdminClient().from("leave_types").insert({ code, ...value }).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("A leave type with this code already exists.", 409);
      throw error;
    }
    await logAudit({ actor: auth.user, action: "leave_type.create", entityType: "leave_type", entityId: code, after: data, request });
    return NextResponse.json({ success: true, type: data }, { status: 201 });
  } catch (err) {
    return serverError("Leave types POST", err);
  }
}

// PATCH { code, ...fields } or { code, archived }
export async function PATCH(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const db = createHcmAdminClient();
    const { data: before } = await db.from("leave_types").select("*").eq("code", body.code).maybeSingle();
    if (!before) return jsonError("Leave type not found.", 404);
    let update;
    if (Object.keys(body).every((k) => k === "code" || k === "archived")) update = { archived: Boolean(body.archived) };
    else {
      const { value, error: invalid } = clean({ ...before, ...body });
      if (invalid) return jsonError(invalid);
      update = value;
    }
    const { data, error } = await db.from("leave_types").update(update).eq("code", body.code).select().single();
    if (error) throw error;
    await logAudit({ actor: auth.user, action: "leave_type.update", entityType: "leave_type", entityId: body.code, before, after: data, request });
    return NextResponse.json({ success: true, type: data });
  } catch (err) {
    return serverError("Leave types PATCH", err);
  }
}
