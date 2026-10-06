import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";

function clean(body) {
  const date = String(body.date || "").slice(0, 10);
  const name = String(body.name || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a date." };
  if (!name) return { error: "Holiday name is required." };
  return { value: { date, name, location_id: body.location_id || null, optional: Boolean(body.optional) } };
}

// GET ?year=YYYY — any internal user (holiday calendar).
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const year = Number(new URL(request.url).searchParams.get("year")) || new Date().getFullYear();
    const { data, error } = await createHcmAdminClient()
      .from("holidays")
      .select("*, locations(name)")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date");
    if (error) throw error;
    return NextResponse.json({ success: true, year, holidays: data });
  } catch (err) {
    return serverError("Holidays GET", err);
  }
}

export async function POST(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const { value, error: invalid } = clean(await request.json());
    if (invalid) return jsonError(invalid);
    const { data, error } = await createHcmAdminClient().from("holidays").insert(value).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("There's already a holiday on that date for this location.", 409);
      throw error;
    }
    await logAudit({ actor: auth.user, action: "holiday.create", entityType: "holiday", entityId: data.id, after: data, request });
    return NextResponse.json({ success: true, holiday: data }, { status: 201 });
  } catch (err) {
    return serverError("Holidays POST", err);
  }
}

export async function PATCH(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { value, error: invalid } = clean(body);
    if (invalid) return jsonError(invalid);
    const db = createHcmAdminClient();
    const { data: before } = await db.from("holidays").select("*").eq("id", body.id).maybeSingle();
    if (!before) return jsonError("Holiday not found.", 404);
    const { data, error } = await db.from("holidays").update(value).eq("id", body.id).select().single();
    if (error) {
      if (error.code === "23505") return jsonError("There's already a holiday on that date for this location.", 409);
      throw error;
    }
    await logAudit({ actor: auth.user, action: "holiday.update", entityType: "holiday", entityId: body.id, before, after: data, request });
    return NextResponse.json({ success: true, holiday: data });
  } catch (err) {
    return serverError("Holidays PATCH", err);
  }
}

export async function DELETE(request) {
  const auth = await requirePermission(request, "leave.manage");
  if (auth.error) return auth.error;
  try {
    const id = new URL(request.url).searchParams.get("id");
    const db = createHcmAdminClient();
    const { data: before } = await db.from("holidays").select("*").eq("id", id).maybeSingle();
    if (!before) return jsonError("Holiday not found.", 404);
    const { error } = await db.from("holidays").delete().eq("id", id);
    if (error) throw error;
    await logAudit({ actor: auth.user, action: "holiday.delete", entityType: "holiday", entityId: id, before, request });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Holidays DELETE", err);
  }
}
