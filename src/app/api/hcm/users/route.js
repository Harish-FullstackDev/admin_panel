import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, appUrl } from "@/lib/hcm/notify";

const USER_SELECT =
  "id, full_name, email, designation, status, last_login_at, created_at, department_id, departments(name), user_roles(role_code, expires_at)";

// GET: list internal users. `?lite=1` returns active users only (for pickers),
// which anyone who schedules interviews or manages jobs may read.
export async function GET(request) {
  const lite = new URL(request.url).searchParams.get("lite") === "1";
  const auth = await requirePermission(
    request,
    lite ? ["user.manage", "interview.schedule", "job.manage", "requisition.review"] : "user.manage"
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
    const roleCodes = Array.isArray(body.roles) ? [...new Set(body.roles)] : [];
    const expiresAt = body.expires_at || null;

    if (!fullName || !/\S+@\S+\.\S+/.test(email)) return jsonError("Name and a valid email are required.");
    if (!roleCodes.length) return jsonError("Assign at least one role.");

    const domain = process.env.COMPANY_EMAIL_DOMAIN?.trim().toLowerCase();
    if (domain && !email.endsWith(`@${domain}`)) {
      return jsonError(`Internal users must use an @${domain} email address.`);
    }

    const supabase = createHcmAdminClient();
    const { data: validRoles } = await supabase.from("roles").select("code, name").in("code", roleCodes);
    if ((validRoles || []).length !== roleCodes.length) return jsonError("One or more roles are invalid.");

    const { data: existing } = await supabase.from("internal_users").select("id").eq("email", email).maybeSingle();
    if (existing) return jsonError("An internal user with this email already exists.", 409);

    const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { full_name: fullName }, redirectTo: appUrl("/admin/set-password") },
    });
    if (linkError) {
      if (/already been registered|already registered|exists/i.test(linkError.message)) {
        return jsonError("This email already has a candidate account. Use the person's official company email.", 409);
      }
      throw linkError;
    }
    const authUser = link.user;
    await supabase.auth.admin.updateUserById(authUser.id, {
      app_metadata: { ...(authUser.app_metadata || {}), account_type: "internal" },
    });
    await supabase.from("candidate_profiles").delete().eq("id", authUser.id);

    const { error: insertError } = await supabase.from("internal_users").insert({
      id: authUser.id,
      full_name: fullName,
      email,
      department_id: body.department_id || null,
      designation: body.designation?.trim() || null,
      status: "Invited",
      invited_by: auth.user.id,
    });
    if (insertError) throw insertError;

    const { error: rolesError } = await supabase.from("user_roles").insert(
      roleCodes.map((role_code) => ({ user_id: authUser.id, role_code, expires_at: expiresAt, granted_by: auth.user.id }))
    );
    if (rolesError) throw rolesError;

    const inviteLink = link.properties?.action_link;
    await queueEmail(
      "user_invited",
      email,
      { name: fullName, inviter_name: auth.user.fullName, roles: validRoles.map((r) => r.name).join(", "), invite_link: inviteLink },
      { entity: "internal_user", id: authUser.id }
    );
    await logAudit({
      actor: auth.user,
      action: "user.invite",
      entityType: "internal_user",
      entityId: authUser.id,
      after: { email, full_name: fullName, roles: roleCodes, expires_at: expiresAt },
      request,
    });

    return NextResponse.json({ success: true, userId: authUser.id, inviteLink }, { status: 201 });
  } catch (err) {
    return serverError("Users POST", err);
  }
}
