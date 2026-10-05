"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CalendarClock, Clock, MapPin, Video, Phone, CheckCircle2, Users, AlertCircle } from "lucide-react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import { useCandidateSession } from "@/components/CandidatePortal/useCandidateSession";
import { Modal, Button, Field, Textarea, ErrorBanner } from "@/components/hcm/ui";

const MODE = {
  online: { label: "Online", icon: Video },
  onsite: { label: "Onsite", icon: MapPin },
  phone: { label: "Phone", icon: Phone },
};

const STATUS_STYLES = {
  Scheduled: "bg-purple-50 text-purple-700 border-purple-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

function isUpcoming(i) {
  return i.status === "Scheduled" && new Date(i.scheduled_at).getTime() >= Date.now();
}

function RescheduleDialog({ interview, authFetch, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!note.trim()) return setError("Tell us which dates and times work for you.");
    setSaving(true);
    setError("");
    try {
      const res = await authFetch("/api/candidate/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: interview.id, action: "reschedule", note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send request.");
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Request a reschedule"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Send request</Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="text-sm text-slate-600 mb-4">
        {interview.round_name} for <strong className="text-slate-900">{interview.position}</strong>. Our team will review your request and get back to you. You can
        request a reschedule once per interview.
      </p>
      <Field label="Preferred dates and times" required>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="For example, any weekday after 2 pm next week." required />
      </Field>
    </Modal>
  );
}

function InterviewCard({ interview, upcoming, onConfirm, confirming, onReschedule }) {
  const mode = MODE[interview.mode] || { label: interview.mode, icon: CalendarClock };
  const ModeIcon = mode.icon;
  const start = new Date(interview.scheduled_at);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-600">{interview.round_name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-900">{interview.position}</h3>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[interview.status] || STATUS_STYLES.Cancelled}`}>
          {interview.status === "Scheduled" && !upcoming ? "Awaiting outcome" : interview.status}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Date and time</dt>
          <dd>{start.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Duration</dt>
          <dd>{interview.duration_min} minutes</dd>
        </div>
        <div className="flex items-center gap-2">
          <ModeIcon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Mode</dt>
          <dd>{mode.label}</dd>
        </div>
        {interview.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Location</dt>
            <dd>{interview.location}</dd>
          </div>
        )}
        {upcoming && interview.meeting_link && (
          <div className="flex items-center gap-2 sm:col-span-2 min-w-0">
            <Video className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <dt className="sr-only">{interview.mode === "phone" ? "Dial-in" : "Meeting link"}</dt>
            <dd className="min-w-0 truncate">
              {/^https?:\/\//i.test(interview.meeting_link) ? (
                <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-teal-600 hover:underline">
                  Join interview
                </a>
              ) : (
                interview.meeting_link
              )}
            </dd>
          </div>
        )}
        {interview.interviewers?.length > 0 && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <dt className="sr-only">Interviewers</dt>
            <dd>{interview.interviewers.map((p) => (p.designation ? `${p.full_name} (${p.designation})` : p.full_name)).join(", ")}</dd>
          </div>
        )}
      </dl>

      {interview.instructions && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-600 whitespace-pre-line">{interview.instructions}</div>
      )}

      {upcoming && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {interview.candidate_confirmed_at ? (
            <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Confirmed
            </span>
          ) : (
            <Button size="sm" className="h-9" onClick={() => onConfirm(interview)} loading={confirming}>
              Confirm attendance
            </Button>
          )}
          {interview.reschedule_request ? (
            <>
              <Button size="sm" variant="secondary" className="h-9" disabled>
                Request reschedule
              </Button>
              <span className="text-xs text-amber-700 inline-flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> Reschedule already requested. Our team will be in touch.
              </span>
            </>
          ) : (
            <Button size="sm" variant="secondary" className="h-9" onClick={() => onReschedule(interview)}>
              Request reschedule
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function InterviewsContent() {
  const { user, loading, authFetch } = useCandidateSession({ required: true });
  const [interviews, setInterviews] = useState(null);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  const load = useCallback(() => {
    return authFetch("/api/candidate/interviews")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setInterviews(data.interviews);
      })
      .catch((err) => setError(err.message || "Failed to load interviews."));
  }, [authFetch]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const confirm = async (interview) => {
    setConfirmingId(interview.id);
    setError("");
    try {
      const res = await authFetch("/api/candidate/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: interview.id, action: "confirm" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to confirm.");
      setInterviews((list) => list.map((i) => (i.id === interview.id ? { ...i, candidate_confirmed_at: new Date().toISOString() } : i)));
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading || !user || (!interviews && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" aria-label="Loading" />
      </div>
    );
  }

  const list = interviews || [];
  const upcoming = list.filter(isUpcoming).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = list.filter((i) => !isUpcoming(i)).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My interviews</h1>
        <p className="mt-2 text-slate-500">Times are shown in your local time zone.</p>
      </div>

      {error && (
        <p role="alert" className="p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </p>
      )}

      {interviews && list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600 font-medium">No interviews scheduled yet.</p>
          <p className="mt-1 text-sm text-slate-500">We&apos;ll let you know as soon as one is set up.</p>
          <Link href="/candidate/dashboard" className="inline-flex mt-6 h-11 items-center px-6 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold">
            View my applications
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="mb-10">
          <h2 id="upcoming-heading" className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
            Upcoming
          </h2>
          <ul className="grid gap-4">
            {upcoming.map((i) => (
              <InterviewCard key={i.id} interview={i} upcoming onConfirm={confirm} confirming={confirmingId === i.id} onReschedule={setRescheduling} />
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-heading">
          <h2 id="past-heading" className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
            Past
          </h2>
          <ul className="grid gap-4">
            {past.map((i) => (
              <InterviewCard key={i.id} interview={i} upcoming={false} onConfirm={confirm} confirming={false} onReschedule={setRescheduling} />
            ))}
          </ul>
        </section>
      )}

      {rescheduling && (
        <RescheduleDialog
          interview={rescheduling}
          authFetch={authFetch}
          onClose={() => setRescheduling(null)}
          onDone={() => {
            setRescheduling(null);
            load();
          }}
        />
      )}
    </>
  );
}

export default function CandidateInterviewsPage() {
  return (
    <PortalShell>
      <InterviewsContent />
    </PortalShell>
  );
}
