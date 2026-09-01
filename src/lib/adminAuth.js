// Shared server-side guard for Route Handlers that must only be callable by a
// logged-in admin. Mirrors the session check already performed in
// `src/middleware.ts` for page routes: it trusts the same `sst_admin_session`
// cookie (a raw Supabase access token) and validates its expiry + role claim
// without a network round trip.
//
// NOTE: middleware only protects paths under "/admin/*". API routes such as
// "/api/jobs" and "/api/job-applications" live outside that matcher, so
// mutating/PII-bearing endpoints must call this guard explicitly.

function decodeSessionCookie(rawToken) {
  const parts = rawToken.split(".");
  if (parts.length < 2) {
    throw new Error("Malformed session token.");
  }

  let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }

  return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
}

/**
 * @param {import('next/server').NextRequest} request
 * @returns {boolean} true if the request carries a valid, unexpired admin session
 */
export function isAdminRequest(request) {
  try {
    const sessionCookie = request.cookies.get("sst_admin_session")?.value;
    if (!sessionCookie) return false;

    const payload = decodeSessionCookie(sessionCookie);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) return false;
    if (payload.role !== "authenticated") return false;

    return true;
  } catch (err) {
    console.warn("isAdminRequest: rejected session token:", err);
    return false;
  }
}
