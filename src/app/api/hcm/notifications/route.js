import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, serverError } from "@/lib/hcm/auth";

export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { data, error } = await createHcmAdminClient()
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return NextResponse.json({ success: true, notifications: data });
  } catch (err) {
    return serverError("Notifications GET", err);
  }
}

// PATCH { ids?: string[] } marks given (or all) notifications read.
export async function PATCH(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { ids } = await request.json().catch(() => ({}));
    let query = createHcmAdminClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (Array.isArray(ids) && ids.length) query = query.in("id", ids);
    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Notifications PATCH", err);
  }
}
