import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser } from "@/lib/hcm/auth";

export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = createHcmAdminClient();
  const [{ count }, { data: stageRecord }, { data: employee }] = await Promise.all([
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    db.from("stage_records").select("id, type, end_date, status").eq("employee_id", user.id).in("status", ["Active", "Pending approval"]).maybeSingle(),
    db.from("employees").select("id, status").eq("id", user.id).maybeSingle(),
  ]);

  return NextResponse.json({
    success: true,
    user: { ...user, stageRecord: stageRecord || null, isEmployee: Boolean(employee && employee.status !== "Exited") },
    unreadNotifications: count || 0,
  });
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
