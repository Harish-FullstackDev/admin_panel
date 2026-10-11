import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { appUrl, queueEmail } from "@/lib/hcm/notify";

const BAN_FOREVER = "876000h";

async function loadUser(supabase, id) {
  const { data } = await supabase
    .from("internal_users")
    .select("id, full_name, email, designation, status, department_id, last_login_at, created_at, user_roles(role_code, expires_at, granted_at)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function activeSuperAdminCount(supabase, excludingId) {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id, internal_users!inner(status)")
    .eq("role_code", "super_admin")
    .neq("user_id", excludingId);
  return (data || []).filter((r) => r.internal_users?.status === "Active").length;
}

export async function GET(request, { params }) {
  const auth = await requirePermission(request, "user.manage");
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const supabase = createHcmAdminClient();
    const user = await loadUser(supabase, id);
    if (!user) return jsonError("User not found.", 404);
    const { data: history } = await supabase
      .from("audit_logs")
      .select("id, action, actor_email, before, after, created_at")
      .eq("entity_type", "internal_user")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ success: true, user, history: history || [] });
  } catch (err) {
    return serverError("User GET", err);
  }
}

// PATCH: { full_name?, designation?, department_id?, roles?: [{code, expires_at}],
//          action?: "suspend" | "reactivate" | "deactivate" | "resend_invite" }
//        | { action: "reset_link", delivery: "email" | "copy" }
export async function PATCH(request, { params }) {
  const auth = await requirePermission(request, "user.manage");
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const body = await request.json();
    const supabase = createHcmAdminClient();
    const before = await loadUser(supabase, id);
    if (!before) return jsonError("User not found.", 404);
    const isSelf = id === auth.user.id;
    const isSuperAdmin = before.user_roles.some((r) => r.role_code === "super_admin");

    if (body.action === "reset_link") {
      const delivery = body.delivery === "email" ? "email" : "copy";
      if (!["Active", "Invited"].includes(before.status)) {
        return jsonError(`This account is ${before.status.toLowerCase()}. Reactivate it first.`);
      }
      const { data: link, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: before.email,
        options: { redirectTo: appUrl("/admin/set-password") },
      });
      if (error) throw error;
      const resetLink = link.properties?.action_link;
      if (delivery === "email") {
        await queueEmail(
          before.status === "Invited" ? "user_invited" : "password_reset_link",
          before.email,
          { name: before.full_name, inviter_name: auth.user.fullName, roles: "", invite_link: resetLink, reset_link: resetLink, admin_name: auth.user.fullName || auth.user.email },
          { entity: "internal_user", id }
        );
      }
      await logAudit({
        actor: auth.user,
        action: "user.reset_link",
        entityType: "internal_user",
        entityId: id,
        after: { delivery },
        request,
      });
      // The link itself is only returned for "copy"; emailed links never reach the browser.
      return NextResponse.json({ success: true, delivery, ...(delivery === "copy" ? { resetLink } : {}) });
    }

    if (body.action) {
      if (isSelf && body.action !== "resend_invite") return jsonError("You cannot change your own account status.");
      if (before.status === "Deactivated" && body.action !== "reactivate") {
        return jsonError("This account is deactivated.");
      }
      if (["suspend", "deactivate"].includes(body.action) && isSuperAdmin && (await activeSuperAdminCount(supabase, id)) === 0) {
        return jsonError("At least one active Super Admin must remain.");
      }

      if (body.action === "resend_invite") {
        if (before.status !== "Invited") return jsonError("Only invited users can get a new invite link.");
        const { data: link, error } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: before.email,
          options: { redirectTo: appUrl("/admin/set-password") },
        });
        if (error) throw error;
        await logAudit({ actor: auth.user, action: "user.resend_invite", entityType: "internal_user", entityId: id, request });
        return NextResponse.json({ success: true, inviteLink: link.properties?.action_link });
      }

      const nextStatus = { suspend: "Suspended", deactivate: "Deactivated", reactivate: "Active" }[body.action];
      if (!nextStatus) return jsonError("Unknown action.");
      if (body.action === "reactivate" && before.status === "Active") return jsonError("User is already active.");

      const { error: banError } = await supabase.auth.admin.updateUserById(id, {
        ban_duration: nextStatus === "Active" ? "none" : BAN_FOREVER,
      });
      if (banError) throw banError;
      const { error } = await supabase.from("internal_users").update({ status: nextStatus }).eq("id", id);
      if (error) throw error;

      await logAudit({
        actor: auth.user,
        action: `user.${body.action}`,
        entityType: "internal_user",
        entityId: id,
        before: { status: before.status },
        after: { status: nextStatus },
        request,
      });
      return NextResponse.json({ success: true, user: await loadUser(supabase, id) });
    }

    const updates = {};
    if ("full_name" in body) {
      if (!String(body.full_name).trim()) return jsonError("Name cannot be empty.");
      updates.full_name = String(body.full_name).trim();
    }
    if ("designation" in body) updates.designation = String(body.designation || "").trim() || null;
    if ("department_id" in body) updates.department_id = body.department_id || null;
    if (Object.keys(updates).length) {
      const { error } = await supabase.from("internal_users").update(updates).eq("id", id);
      if (error) throw error;
    }

    if (Array.isArray(body.roles)) {
      const next = body.roles.filter((r) => r?.code);
      if (!next.length) return jsonError("A user needs at least one role. Deactivate the account instead.");
      const nextCodes = next.map((r) => r.code);
      if (isSuperAdmin && !nextCodes.includes("super_admin")) {
        if (isSelf) return jsonError("You cannot remove your own Super Admin role.");
        if ((await activeSuperAdminCount(supabase, id)) === 0) return jsonError("At least one active Super Admin must remain.");
      }
      const { data: validRoles } = await supabase.from("roles").select("code").in("code", nextCodes);
      if ((validRoles || []).length !== new Set(nextCodes).size) return jsonError("One or more roles are invalid.");

      await supabase.from("user_roles").delete().eq("user_id", id).not("role_code", "in", `(${nextCodes.join(",")})`);
      const { error } = await supabase.from("user_roles").upsert(
        next.map((r) => ({ user_id: id, role_code: r.code, expires_at: r.expires_at || null, granted_by: auth.user.id })),
        { onConflict: "user_id,role_code" }
      );
      if (error) throw error;
    }

    const after = await loadUser(supabase, id);
    await logAudit({
      actor: auth.user,
      action: "user.update",
      entityType: "internal_user",
      entityId: id,
      before: { full_name: before.full_name, designation: before.designation, department_id: before.department_id, roles: before.user_roles },
      after: { full_name: after.full_name, designation: after.designation, department_id: after.department_id, roles: after.user_roles },
      request,
    });
    return NextResponse.json({ success: true, user: after });
  } catch (err) {
    return serverError("User PATCH", err);
  }
}
