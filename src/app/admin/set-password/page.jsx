"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { internalSupabase } from "@/lib/candidateSupabase";
import { writeSessionCookie } from "@/lib/hcm/session";

// Landing page for invite / reset links. supabase-js reads the tokens from
// the URL hash and establishes the session automatically.
export default function SetPasswordPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data } = internalSupabase.auth.onAuthStateChange((_event, next) => {
      if (next) setSession(next);
    });
    internalSupabase.auth.getSession().then(({ data: current }) => {
      if (current.session) setSession(current.session);
      setChecking(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSaving(true);
    try {
      const { error: updateError } = await internalSupabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { data } = await internalSupabase.auth.getSession();
      const res = await fetch("/api/hcm/activate", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      writeSessionCookie(data.session);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Could not set your password.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal-200";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center">Set your password</h1>
        <p className="text-sm text-slate-500 text-center mt-2 mb-8">Welcome to Ascendus HCM.</p>

        {checking ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" aria-label="Loading" />
          </div>
        ) : !session ? (
          <p className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
            This link is invalid or has expired. Ask your administrator for a new invite link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <p className="text-xs text-slate-500">
              Signing in as <strong>{session.user.email}</strong>
            </p>
            {error && (
              <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </p>
            )}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" aria-label="New password" autoComplete="new-password" className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" aria-label="Confirm password" autoComplete="new-password" className={inputClass} />
            </div>
            <button type="submit" disabled={saving} className="w-full py-3 bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Set password and continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
