"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { candidateSupabase } from "@/lib/candidateSupabase";

// Only same-origin relative paths, so ?redirect= can't bounce users off-site.
export function safeRedirect(value, fallback = "/candidate/dashboard") {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}

/**
 * @param {{ required?: boolean }} options  required: redirect to login when signed out
 */
export function useCandidateSession({ required = false } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    candidateSupabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = candidateSupabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (required && !loading && !session) {
      router.replace(`/candidate/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [required, loading, session, router, pathname]);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const { data } = await candidateSupabase.auth.getSession();
      const token = data.session?.access_token;
      return fetch(url, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
      });
    },
    []
  );

  const signOut = useCallback(async () => {
    await candidateSupabase.auth.signOut();
    router.push("/careers");
  }, [router]);

  return { session, user: session?.user ?? null, loading, authFetch, signOut };
}
