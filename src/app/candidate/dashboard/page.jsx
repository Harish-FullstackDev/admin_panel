"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Briefcase, CalendarDays, CalendarClock, FileSignature, CheckCircle2, BellRing, Upload } from "lucide-react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import StatusBadge from "@/components/CandidatePortal/StatusBadge";
import { useCandidateSession } from "@/components/CandidatePortal/useCandidateSession";
import { CANDIDATE_TRACKER } from "@/lib/hcm/labels";
import { Modal, Button, Field, Textarea, ErrorBanner } from "@/components/hcm/ui";

const ACTION_LABELS = {
  confirm_interview: { text: "Confirm interview", icon: CalendarClock },
  respond_offer: { text: "Respond to offer", icon: FileSignature },
  upload_documents: { text: "Upload documents", icon: Upload },
};

const MODE_LABELS = { online: "Online", onsite: "Onsite", phone: "Phone" };

function Progress({ label }) {
  if (label === "Not selected") {
    return (
      <p className="text-xs text-slate-500">
        Thank you for your interest. After careful consideration we have decided not to move forward with this application. We encourage you to apply for
        future openings.
      </p>
    );
  }
  if (label === "Withdrawn") {
    return <p className="text-xs text-slate-500">You withdrew this application. You are welcome to apply for other openings at any time.</p>;
  }
  const done = label === "Offer made" || label === "Hired";
  const current = done ? CANDIDATE_TRACKER.length - 1 : CANDIDATE_TRACKER.indexOf(label);
  return (
    <div>
      <ol className="grid grid-cols-5 gap-1.5" aria-label={`Progress: ${label}`}>
        {CANDIDATE_TRACKER.map((step, i) => {
          const reached = i <= current;
          return (
            <li key={step} className="min-w-0">
              <div className={`h-1.5 rounded-full ${reached ? "bg-brand-teal-500" : "bg-slate-200"}`} aria-hidden="true" />
              <span className={`mt-1.5 block truncate text-[11px] ${i === current && !done ? "font-semibold text-brand-teal-700" : reached ? "text-slate-600" : "text-slate-400"}`}>
                {step}
                <span className="sr-only">{reached ? " (completed)" : " (not yet)"}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {done && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          {label === "Hired" ? "Congratulations and welcome aboard! See the Joining page for your documents and first-day details." : "Congratulations! An offer has been made. Review it on the Offers page."}
        </p>
      )}
    </div>
  );
}

function ActionLink({ action }) {
  const cfg = ACTION_LABELS[action.type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <Link
      href={action.href}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-xs font-bold transition-colors"
    >
      <Icon className="w-4 h-4" aria-hidden="true" /> {cfg.text}
    </Link>
  );
}

function WithdrawDialog({ app, authFetch, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason.trim()) return setError("Please tell us why you are withdrawing.");
    setSaving(true);
    setError("");
    try {
      const res = await authFetch(`/api/candidate/applications/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw", reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to withdraw.");
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Withdraw application"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Keep application</Button>
          <Button variant="danger" onClick={submit} loading={saving}>Withdraw</Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="text-sm text-slate-600 mb-4">
        You are withdrawing your application for <strong className="text-slate-900">{app.position}</strong>. Any upcoming interviews will be cancelled. This
        cannot be undone.
      </p>
      <Field label="Reason" required>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="For example, I accepted another offer." required />
      </Field>
    </Modal>
  );
}

function DashboardContent() {
  const { user, loading, authFetch } = useCandidateSession({ required: true });
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState("");
  const [withdrawing, setWithdrawing] = useState(null);

  const load = useCallback(() => {
    return authFetch("/api/candidate/applications")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setApplications(data.applications);
      })
      .catch((err) => setError(err.message || "Failed to load applications."));
  }, [authFetch]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user || (!applications && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" aria-label="Loading" />
      </div>
    );
  }

  const name = user.user_metadata?.full_name?.split(" ")[0];
  const pending = (applications || []).flatMap((app) => (app.pending_actions || []).map((action) => ({ ...action, app })));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{name ? `Hi, ${name}` : "My applications"}</h1>
        <p className="mt-2 text-slate-500">Track the status of every job you&apos;ve applied for.</p>
      </div>

      {error && <p className="p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</p>}

      {pending.length > 0 && (
        <section aria-labelledby="pending-heading" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 id="pending-heading" className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <BellRing className="w-4 h-4" aria-hidden="true" /> Pending actions ({pending.length})
          </h2>
          <ul className="mt-3 grid gap-2">
            {pending.map((p) => (
              <li key={`${p.app.id}-${p.type}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white border border-amber-100 px-4 py-2.5">
                <span className="text-sm text-slate-700">
                  {p.type === "confirm_interview"
                    ? "Confirm your interview"
                    : p.type === "upload_documents"
                      ? `Upload ${p.count} joining document${p.count > 1 ? "s" : ""}`
                      : "Respond to your offer"}{" "}
                  for{" "}
                  <strong className="font-semibold text-slate-900">{p.app.position}</strong>
                </span>
                <ActionLink action={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

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
                <StatusBadge label={app.label} />
              </div>

              <Progress label={app.label} />

              {app.next_interview && (
                <p className="mt-4 text-sm text-slate-600 inline-flex flex-wrap items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-brand-teal-600" aria-hidden="true" />
                  Next: <strong className="font-semibold text-slate-800">{app.next_interview.round_name}</strong> on{" "}
                  {new Date(app.next_interview.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  {app.next_interview.mode && <span className="text-slate-500">({MODE_LABELS[app.next_interview.mode] || app.next_interview.mode})</span>}
                </p>
              )}

              {((app.pending_actions || []).length > 0 || app.can_withdraw) && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {(app.pending_actions || []).map((action) => (
                    <ActionLink key={action.type} action={action} />
                  ))}
                  {app.can_withdraw && (
                    <button
                      type="button"
                      onClick={() => setWithdrawing(app)}
                      className="ml-auto h-9 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {withdrawing && (
        <WithdrawDialog
          app={withdrawing}
          authFetch={authFetch}
          onClose={() => setWithdrawing(null)}
          onDone={() => {
            setWithdrawing(null);
            load();
          }}
        />
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
