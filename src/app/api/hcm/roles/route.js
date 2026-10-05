import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";

const SCOPES = ["own", "team", "department", "all"];
// Removing these from super_admin could lock everyone out of administration.
const LOCKED = { super_admin: ["user.manage", "role.manage"] };

export async function GET(request) {
  const auth = await requirePermission(request, ["role.manage", "user.manage"]);
  if (auth.error) return auth.error;
  try {
    const supabase = createHcmAdminClient();
    const [roles, permissions, grants, members] = await Promise.all([
      supabase.from("roles").select("*").order("rank"),
      supabase.from("permissions").select("*").order("module").order("code"),
      supabase.from("role_permissions").select("*"),
      supabase.from("user_roles").select("role_code"),
    ]);
    for (const r of [roles, permissions, grants, members]) if (r.error) throw r.error;
    const counts = {};
    for (const m of members.data) counts[m.role_code] = (counts[m.role_code] || 0) + 1;
    return NextResponse.json({
      success: true,
      roles: roles.data.map((r) => ({ ...r, member_count: counts[r.code] || 0 })),
      permissions: permissions.data,
      grants: grants.data,
      locked: LOCKED,
    });
  } catch (err) {
    return serverError("Roles GET", err);
  }
}

// POST: create a custom role, optionally cloning another role's grants.
export async function POST(request) {
  const auth = await requirePermission(request, "role.manage");
  if (auth.error) return auth.error;
  try {
    const { name, description, clone_from } = await request.json();
    const label = String(name || "").trim();
    if (!label) return jsonError("Role name is required.");
    const code = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (!code) return jsonError("Role name must contain letters or numbers.");

    const supabase = createHcmAdminClient();
    const { error } = await supabase
      .from("roles")
      .insert({ code, name: label, description: description?.trim() || null, rank: 90, is_system: false });
    if (error) {
      if (error.code === "23505") return jsonError("A role with this name already exists.", 409);
      throw error;
    }
    if (clone_from) {
      const { data: source } = await supabase.from("role_permissions").select("permission_code, scope").eq("role_code", clone_from);
      if (source?.length) {
        await supabase.from("role_permissions").insert(source.map((g) => ({ ...g, role_code: code })));
      }
    }
    await logAudit({ actor: auth.user, action: "role.create", entityType: "role", entityId: code, after: { name: label, clone_from }, request });
    return NextResponse.json({ success: true, code }, { status: 201 });
  } catch (err) {
    return serverError("Roles POST", err);
  }
}

// PUT: { role_code, permission_code, scope } — scope null removes the grant.
export async function PUT(request) {
  const auth = await requirePermission(request, "role.manage");
  if (auth.error) return auth.error;
  try {
    const { role_code, permission_code, scope } = await request.json();
    if (!role_code || !permission_code) return jsonError("Role and permission are required.");
    if (scope && !SCOPES.includes(scope)) return jsonError("Invalid scope.");
    if (!scope && LOCKED[role_code]?.includes(permission_code)) {
      return jsonError("This permission cannot be removed from this role.");
    }

    const supabase = createHcmAdminClient();
    const { data: before } = await supabase
      .from("role_permissions")
      .select("scope")
      .eq("role_code", role_code)
      .eq("permission_code", permission_code)
      .maybeSingle();

    const { error } = scope
      ? await supabase.from("role_permissions").upsert({ role_code, permission_code, scope }, { onConflict: "role_code,permission_code" })
      : await supabase.from("role_permissions").delete().eq("role_code", role_code).eq("permission_code", permission_code);
    if (error) throw error;

    await logAudit({
      actor: auth.user,
      action: scope ? "role.grant" : "role.revoke",
      entityType: "role",
      entityId: role_code,
      before: before ? { [permission_code]: before.scope } : null,
      after: scope ? { [permission_code]: scope } : null,
      request,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Roles PUT", err);
  }
}
