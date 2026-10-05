"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { hcmJson, syncSessionCookie } from "@/lib/hcm/session";

const Ctx = createContext(null);
const ROLE_KEY = "hcm_active_role";

export function InternalUserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [activeRole, setActiveRoleState] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await hcmJson("/api/hcm/me");
      setUser(data.user);
      setUnread(data.unreadNotifications);
      setActiveRoleState((current) => {
        const codes = data.user.roles.map((r) => r.code);
        let stored = null;
        try {
          stored = localStorage.getItem(ROLE_KEY);
        } catch {}
        if (current && codes.includes(current)) return current;
        if (stored && codes.includes(stored)) return stored;
        return codes[0] || null;
      });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = syncSessionCookie();
    refresh();
    return unsubscribe;
  }, [refresh]);

  const setActiveRole = useCallback((code) => {
    setActiveRoleState(code);
    try {
      localStorage.setItem(ROLE_KEY, code);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      user,
      error,
      unread,
      setUnread,
      activeRole,
      setActiveRole,
      refresh,
      can: (code) => Boolean(user?.permissions?.[code]),
      scopeOf: (code) => user?.permissions?.[code] || null,
    }),
    [user, error, unread, activeRole, setActiveRole, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInternalUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInternalUser must be used inside InternalUserProvider");
  return ctx;
}
