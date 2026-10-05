import { NextResponse } from "next/server";
import { createHcmAdminClient, INTERNAL_SESSION_COOKIE } from "@/lib/candidateSupabase";

const SCOPE_RANK = { own: 1, team: 2, department: 3, all: 4 };

function readToken(request) {
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return request.cookies?.get(INTERNAL_SESSION_COOKIE)?.value || null;
}

/**
 * Loads the signed-in internal user with roles and effective permissions.
 * Returns null for missing/invalid tokens, candidates, and inactive accounts.
 * @returns {Promise<null | {
 *   id: string, email: string, fullName: string, status: string, departmentId: string | null,
 *   roles: {code: string, name: string, rank: number}[],
 *   permissions: Record<string, 'own'|'team'|'department'|'all'>
 * }>}
 */
export async function getInternalUser(request) {
  const token = readToken(request);
  if (!token) return null;

  const supabase = createHcmAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return null;

  const { data: profile } = await supabase
    .from("internal_users")
    .select("id, email, full_name, status, department_id")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!profile || profile.status !== "Active") return null;

  const now = new Date().toISOString();
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_code, expires_at, roles(code, name, rank)")
    .eq("user_id", profile.id)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  const roles = (userRoles || []).map((r) => r.roles).filter(Boolean).sort((a, b) => a.rank - b.rank);
  const permissions = {};
  if (roles.length) {
    const { data: grants } = await supabase
      .from("role_permissions")
      .select("permission_code, scope")
      .in("role_code", roles.map((r) => r.code));
    for (const { permission_code, scope } of grants || []) {
      if (!permissions[permission_code] || SCOPE_RANK[scope] > SCOPE_RANK[permissions[permission_code]]) {
        permissions[permission_code] = scope;
      }
    }
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    status: profile.status,
    departmentId: profile.department_id,
    roles,
    permissions,
  };
}

export function hasPermission(user, code, minScope = "own") {
  const scope = user?.permissions?.[code];
  return Boolean(scope) && SCOPE_RANK[scope] >= SCOPE_RANK[minScope];
}

/**
 * Route guard. Usage:
 *   const auth = await requirePermission(request, "job.manage");
 *   if (auth.error) return auth.error;
 *   auth.user, auth.scope
 * Pass an array to accept any one of several permissions.
 */
export async function requirePermission(request, codes) {
  const user = await getInternalUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  const list = Array.isArray(codes) ? codes : [codes];
  const granted = list.filter((code) => user.permissions[code]);
  if (!granted.length) {
    return { error: NextResponse.json({ error: "You do not have permission to do this." }, { status: 403 }) };
  }
  const scope = granted
    .map((code) => user.permissions[code])
    .sort((a, b) => SCOPE_RANK[b] - SCOPE_RANK[a])[0];
  return { user, scope };
}

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serverError(label, err) {
  console.error(`${label}:`, err);
  return NextResponse.json({ error: err?.message || "Unexpected server error." }, { status: 500 });
}
