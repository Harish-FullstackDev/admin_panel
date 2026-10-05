import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "hcm_session";

// Verifies the token with the HCM Supabase project (signature checked by
// Supabase) and requires app_metadata.account_type = "internal", which only
// the service role can set. Role/permission checks happen in each API route.
async function isInternalToken(token: string) {
  const url = process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !apiKey) return false;

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return false;
  const user = await res.json();
  return user?.app_metadata?.account_type === "internal";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login" || pathname === "/admin/set-password") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(loginUrl);

  let valid = false;
  try {
    valid = await isInternalToken(token);
  } catch (e) {
    console.warn("Middleware token verification failed:", e);
  }
  if (!valid) {
    loginUrl.searchParams.set("reason", "session_expired");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
