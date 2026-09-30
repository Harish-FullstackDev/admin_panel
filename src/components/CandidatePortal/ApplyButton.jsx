"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useCandidateSession } from "./useCandidateSession";

export default function ApplyButton({ slug }) {
  const { user, loading, authFetch } = useCandidateSession();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch("/api/candidate/applications")
      .then((res) => (res.ok ? res.json() : { applications: [] }))
      .then((data) => setApplied(data.applications.some((a) => a.job_slug === slug)))
      .catch(() => {});
  }, [user, slug, authFetch]);

  if (loading) return <div className="h-12 w-40 rounded-xl bg-slate-100 animate-pulse" />;

  if (applied) {
    return (
      <Link
        href="/candidate/dashboard"
        className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold"
      >
        <CheckCircle className="w-4 h-4" aria-hidden="true" /> Applied — view status
      </Link>
    );
  }

  const applyPath = `/careers/${slug}/apply`;
  const href = user ? applyPath : `/candidate/login?redirect=${encodeURIComponent(applyPath)}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold shadow-lg transition-colors"
    >
      {user ? "Apply now" : "Sign in to apply"}
    </Link>
  );
}
