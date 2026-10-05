import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser } from "@/lib/hcm/auth";

export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { count } = await createHcmAdminClient()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return NextResponse.json({ success: true, user, unreadNotifications: count || 0 });
}

// Called once after login to stamp last_login_at.
export async function POST(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await createHcmAdminClient()
    .from("internal_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);
  return NextResponse.json({ success: true, user });
}
