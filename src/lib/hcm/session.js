"use client";

import { internalSupabase, INTERNAL_SESSION_COOKIE } from "@/lib/candidateSupabase";

export function writeSessionCookie(session) {
  if (!session?.access_token) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${INTERNAL_SESSION_COOKIE}=${session.access_token}; path=/; max-age=${session.expires_in || 3600}; SameSite=Lax${secure}`;
}

export function clearSessionCookie() {
  document.cookie = `${INTERNAL_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function signOutInternal() {
  clearSessionCookie();
  await internalSupabase.auth.signOut();
  window.location.href = "/admin/login";
}

// Keeps the middleware cookie in step with supabase-js token refreshes.
export function syncSessionCookie() {
  const { data } = internalSupabase.auth.onAuthStateChange((event, session) => {
    if (session && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
      writeSessionCookie(session);
    }
    if (event === "SIGNED_OUT") clearSessionCookie();
  });
  return () => data.subscription.unsubscribe();
}

/** fetch() with the internal bearer token (the cookie also works server-side). */
export async function hcmFetch(url, options = {}) {
  const { data } = await internalSupabase.auth.getSession();
  const headers = { ...(options.headers || {}) };
  if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearSessionCookie();
    window.location.href = `/admin/login?reason=session_expired&redirect=${encodeURIComponent(window.location.pathname)}`;
  }
  return res;
}

export async function hcmJson(url, options = {}) {
  const init = { ...options };
  if (init.body && typeof init.body !== "string" && !(init.body instanceof FormData)) {
    init.body = JSON.stringify(init.body);
    init.headers = { "Content-Type": "application/json", ...(init.headers || {}) };
  }
  const res = await hcmFetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
