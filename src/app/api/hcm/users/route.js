import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail } from "@/lib/hcm/notify";
import { inviteInternalUser, InviteError } from "@/lib/hcm/users";

const USER_SELECT =
  "id, full_name, email, designation, status, last_login_at, created_at, department_id, departments(name), user_roles(role_code, expires_at)";

// GET: list internal users. `?lite=1` returns active users only (for pickers),
// which anyone who schedules interviews or manages jobs may read.
export async function GET(request) {
  const lite = new URL(request.url).searchParams.get("lite") === "1";
  const auth = await requirePermission(
    request,
    lite
      ? ["user.manage", "interview.schedule", "job.manage", "requisition.review", "onboarding.manage", "employee.manage"]
      : "user.manage"
  );
  if (auth.error) return auth.error;

  try {
    let query = createHcmAdminClient()
      .from("internal_users")
      .select(lite ? "id, full_name, email, designation, user_roles(role_code)" : USER_SELECT)
      .order("full_name");
    if (lite) query = query.eq("status", "Active");
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, users: data });
  } catch (err) {
    return serverError("Users GET", err);
  }
}

// POST: invite a new internal user. Email is a placeholder, so the one-time
// invite link is returned for the admin to share.
export async function POST(request) {
  const auth = await requirePermission(request, "user.manage");
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const roleCodes = Array.isArray(body.roles) ? body.roles : [];
    const expiresAt = body.expires_at || null;

    const { userId, inviteLink, roles } = await inviteInternalUser({
      fullName,
      email,
      roles: roleCodes,
      departmentId: body.department_id,
      designation: body.designation,
      expiresAt,
      actor: auth.user,
    });

    await queueEmail(
      "user_invited",
      email,
      { name: fullName, inviter_name: auth.user.fullName, roles: roles.map((r) => r.name).join(", "), invite_link: inviteLink },
      { entity: "internal_user", id: userId }
    );
    await logAudit({
      actor: auth.user,
      action: "user.invite",
      entityType: "internal_user",
      entityId: userId,
      after: { email, full_name: fullName, roles: [...new Set(roleCodes)], expires_at: expiresAt },
      request,
    });

    return NextResponse.json({ success: true, userId, inviteLink }, { status: 201 });
  } catch (err) {
    if (err instanceof InviteError) return jsonError(err.message, err.status);
    return serverError("Users POST", err);
  }
}
