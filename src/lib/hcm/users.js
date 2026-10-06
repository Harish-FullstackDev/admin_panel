import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { appUrl } from "@/lib/hcm/notify";

export class InviteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Creates an internal (official-email) account with an invite link and roles.
 * Email is a placeholder, so the caller gets the one-time link to share.
 * Throws InviteError for validation problems.
 * @returns {Promise<{ userId: string, inviteLink: string, roles: {code: string, name: string}[] }>}
 */
export async function inviteInternalUser({ fullName, email, roles, departmentId = null, designation = null, expiresAt = null, actor }) {
  fullName = String(fullName || "").trim();
  email = String(email || "").trim().toLowerCase();
  const roleCodes = [...new Set(roles || [])];

  if (!fullName || !/\S+@\S+\.\S+/.test(email)) throw new InviteError("Name and a valid email are required.");
  if (!roleCodes.length) throw new InviteError("Assign at least one role.");

  const domain = process.env.COMPANY_EMAIL_DOMAIN?.trim().toLowerCase();
  if (domain && !email.endsWith(`@${domain}`)) {
    throw new InviteError(`Internal users must use an @${domain} email address.`);
  }

  const supabase = createHcmAdminClient();
  const { data: validRoles } = await supabase.from("roles").select("code, name").in("code", roleCodes);
  if ((validRoles || []).length !== roleCodes.length) throw new InviteError("One or more roles are invalid.");

  const { data: existing } = await supabase.from("internal_users").select("id").eq("email", email).maybeSingle();
  if (existing) throw new InviteError("An internal user with this email already exists.", 409);

  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { full_name: fullName }, redirectTo: appUrl("/admin/set-password") },
  });
  if (linkError) {
    if (/already been registered|already registered|exists/i.test(linkError.message)) {
      throw new InviteError("This email already has a candidate account. Use the person's official company email.", 409);
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
    department_id: departmentId || null,
    designation: designation?.trim() || null,
    status: "Invited",
    invited_by: actor?.id ?? null,
  });
  if (insertError) throw insertError;

  const { error: rolesError } = await supabase.from("user_roles").insert(
    roleCodes.map((role_code) => ({ user_id: authUser.id, role_code, expires_at: expiresAt, granted_by: actor?.id ?? null }))
  );
  if (rolesError) throw rolesError;

  return { userId: authUser.id, inviteLink: link.properties?.action_link, roles: validRoles };
}
