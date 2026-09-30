import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Asks the admin Supabase project to validate the token, so the signature is
// checked. Decoding the payload alone would accept any "authenticated" JWT,
// including candidate tokens from the separate candidate project.
async function isValidAdminToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !apiKey) return false;

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return false;

  const allowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!allowlist.length) return true;

  const user = await res.json();
  return allowlist.includes(String(user?.email || "").toLowerCase());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get("sst_admin_session")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    let valid = false;
    try {
      valid = await isValidAdminToken(sessionCookie);
    } catch (e) {
      console.warn("Middleware token verification failed:", e);
    }

    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("reason", "session_expired");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("sst_admin_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
