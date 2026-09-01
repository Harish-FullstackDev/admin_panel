import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We protect all routing pathways under '/admin/*' except for the login page
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get("sst_admin_session")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Decode the raw JWT session token payload
      const parts = sessionCookie.split(".");
      if (parts.length < 2) {
        throw new Error("Malformed JWT token format.");
      }

      const payloadPart = parts[1];
      // URL-safe base64 decoding matching Edge environment capabilities
      let base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      
      const decodedPayload = JSON.parse(atob(base64));

      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && decodedPayload.exp < now) {
        throw new Error("Expired session token.");
      }

      // Check if user is authenticated
      if (decodedPayload.role !== "authenticated") {
        throw new Error("Invalid session claim role.");
      }
    } catch (e) {
      console.warn("Middleware caught invalid token, redirecting:", e);
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("reason", "session_expired");
      const response = NextResponse.redirect(loginUrl);
      // Clean up invalid session cookie
      response.cookies.delete("sst_admin_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
