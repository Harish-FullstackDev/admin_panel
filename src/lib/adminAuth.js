// Server-side guard for admin-only Route Handlers. Middleware only matches
// "/admin/*", so API routes must call this explicitly.
import { createAdminClient } from "@/lib/supabaseClient";

function adminAllowlist() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifies the `sst_admin_session` token against the admin Supabase project
 * (signature checked server-side), so tokens from the candidate project or
 * forged payloads are rejected.
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<boolean>}
 */
export async function isAdminRequest(request) {
  try {
    const token = request.cookies.get("sst_admin_session")?.value;
    if (!token) return false;

    const { data, error } = await createAdminClient().auth.getUser(token);
    if (error || !data?.user) return false;

    const allowlist = adminAllowlist();
    if (allowlist.length && !allowlist.includes(data.user.email?.toLowerCase())) {
      return false;
    }

    return true;
  } catch (err) {
    console.warn("isAdminRequest: rejected session token:", err);
    return false;
  }
}
