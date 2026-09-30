"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Briefcase, CalendarDays } from "lucide-react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import StatusBadge from "@/components/CandidatePortal/StatusBadge";
import { useCandidateSession } from "@/components/CandidatePortal/useCandidateSession";

const STEPS = ["New", "Reviewed", "Shortlisted", "Interviewing", "Hired"];

function Progress({ status }) {
  if (status === "Rejected") {
    return <p className="text-xs text-slate-500">Thank you for your interest. We have decided not to move forward with this application.</p>;
  }
  const current = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1.5" aria-label={`Progress: ${status}`}>
      {STEPS.map((step, i) => (
        <div key={step} className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-brand-teal-500" : "bg-slate-200"}`} />
      ))}
    </div>
  );
}

function DashboardContent() {
  const { user, loading, authFetch } = useCandidateSession({ required: true });
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    authFetch("/api/candidate/applications")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setApplications(data.applications);
      })
      .catch((err) => setError(err.message || "Failed to load applications."));
  }, [user, authFetch]);

  if (loading || !user || (!applications && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" aria-label="Loading" />
      </div>
    );
  }

  const name = user.user_metadata?.full_name?.split(" ")[0];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {name ? `Hi, ${name}` : "My applications"}
        </h1>
        <p className="mt-2 text-slate-500">Track the status of every job you&apos;ve applied for.</p>
      </div>

      {error && <p className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</p>}

      {applications?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600 font-medium">You haven&apos;t applied to any jobs yet.</p>
          <Link href="/careers" className="inline-flex mt-6 h-11 items-center px-6 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold">
            Browse open positions
          </Link>
        </div>
      )}

      {applications?.length > 0 && (
        <ul className="grid gap-4">
          {applications.map((app) => (
            <li key={app.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  {app.job_slug ? (
                    <Link href={`/careers/${app.job_slug}`} className="text-base font-semibold text-slate-900 hover:text-brand-teal-600">
                      {app.position}
                    </Link>
                  ) : (
                    <span className="text-base font-semibold text-slate-900">{app.position}</span>
                  )}
                  <p className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                    Applied {new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
                <StatusBadge status={app.status} candidateView />
              </div>
              <Progress status={app.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function CandidateDashboardPage() {
  return (
    <PortalShell>
      <DashboardContent />
    </PortalShell>
  );
}
