import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { logAudit } from "@/lib/hcm/audit";

// Called by /admin/set-password after an invited user sets their password.
// Moves Invited -> Active; Suspended/Deactivated accounts stay blocked.
export async function POST(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createHcmAdminClient();
  const { data: authData, error } = await supabase.auth.getUser(token);
  if (error || !authData?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase
    .from("internal_users")
    .select("id, email, status")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "This account is not an internal user." }, { status: 403 });
  if (profile.status === "Suspended" || profile.status === "Deactivated") {
    return NextResponse.json({ error: `This account is ${profile.status.toLowerCase()}.` }, { status: 403 });
  }

  if (profile.status === "Invited") {
    await supabase
      .from("internal_users")
      .update({ status: "Active", last_login_at: new Date().toISOString() })
      .eq("id", profile.id);
    await logAudit({
      actor: { id: profile.id, email: profile.email },
      action: "user.activate",
      entityType: "internal_user",
      entityId: profile.id,
      before: { status: "Invited" },
      after: { status: "Active" },
      request,
    });
  }
  return NextResponse.json({ success: true });
}
