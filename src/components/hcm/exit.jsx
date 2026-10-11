"use client";

import { useState } from "react";
import { hcmJson } from "@/lib/hcm/session";
import { Button, Field, Input, Textarea, Select, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";
import { daysFromToday } from "@/components/hcm/onboarding";

export function addDaysIso(date, days) {
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

/** "12 days left", "Today", "3 days ago". */
export function daysLeft(date) {
  const d = daysFromToday(date);
  if (d === null) return "";
  if (d === 0) return "Last day today";
  if (d === 1) return "1 day left";
  return d > 0 ? `${d} days left` : `${-d} day${d === -1 ? "" : "s"} ago`;
}

function flow(c) {
  if (c.type === "Resignation") {
    return [
      ...(c.manager_id ? [{ key: "Pending manager", label: "Manager" }] : []),
      { key: "Pending HR", label: "HR" },
      { key: "In notice", label: "Notice period" },
      { key: "Completed", label: "Exited" },
    ];
  }
  if (c.type === "Release") return [{ key: "In notice", label: "Notice period" }, { key: "Completed", label: "Exited" }];
  return [{ key: "Pending approval", label: "CHRO" }, { key: "In notice", label: "Notice period" }, { key: "Completed", label: "Exited" }];
}

export function ExitSteps({ exitCase }) {
  const steps = flow(exitCase);
  const stopped = ["Withdrawn", "Cancelled"].includes(exitCase.status);
  const current = steps.findIndex((s) => s.key === exitCase.status);
  const tone = { done: "bg-emerald-500", current: "bg-amber-400 animate-pulse", todo: "bg-slate-200", stopped: "bg-slate-300" };
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500" aria-label={`Exit progress: ${exitCase.status}`}>
      {steps.map((s, i) => {
        const state = stopped ? "stopped" : i < current || exitCase.status === "Completed" ? "done" : i === current ? "current" : "todo";
        return (
          <span key={s.key} className="inline-flex items-center gap-1">
            {i > 0 && <span className="w-3 h-px bg-slate-300" aria-hidden="true" />}
            <span className={`w-2 h-2 rounded-full ${tone[state]}`} aria-hidden="true" />
            {s.label}
          </span>
        );
      })}
    </span>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <fieldset>
      <legend className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </legend>
      <div className="inline-flex p-1 rounded-xl bg-slate-100">
        {[
          [true, "Yes"],
          [false, "No"],
        ].map(([v, text]) => (
          <button
            key={text}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`px-4 h-8 rounded-lg text-sm font-semibold cursor-pointer ${value === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ExitInterviewForm({ questions, reasons, initialReason, onSubmit, submitLabel = "Submit exit interview" }) {
  const [form, setForm] = useState({ ratings: {}, primary_reason: initialReason || "", would_recommend: null, would_rejoin: null, liked: "", improve: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const complete =
    questions.every((q) => form.ratings[q.key]) && form.primary_reason && form.would_recommend !== null && form.would_rejoin !== null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-600">How would you rate… (1 = poor, 5 = excellent)</p>
        {questions.map((q) => (
          <div key={q.key} className="flex flex-wrap items-center justify-between gap-2" role="radiogroup" aria-label={q.label}>
            <span className="text-sm text-slate-700">{q.label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={form.ratings[q.key] === n}
                  aria-label={`${n}`}
                  onClick={() => setForm((f) => ({ ...f, ratings: { ...f.ratings, [q.key]: n } }))}
                  className={`w-8 h-8 rounded-lg border text-sm font-semibold cursor-pointer ${
                    form.ratings[q.key] === n ? "bg-brand-teal-500 border-brand-teal-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-brand-teal-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Field label="Main reason for leaving" required>
        <Select placeholder="Choose…" options={reasons} value={form.primary_reason} onChange={(e) => setForm((f) => ({ ...f, primary_reason: e.target.value }))} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <YesNo label="Would you recommend Ascendus as a place to work?" value={form.would_recommend} onChange={(v) => setForm((f) => ({ ...f, would_recommend: v }))} />
        <YesNo label="Would you consider rejoining in future?" value={form.would_rejoin} onChange={(v) => setForm((f) => ({ ...f, would_rejoin: v }))} />
      </div>
      <Field label="What did you like most?">
        <Textarea value={form.liked} onChange={(e) => setForm((f) => ({ ...f, liked: e.target.value }))} />
      </Field>
      <Field label="What could we do better?">
        <Textarea value={form.improve} onChange={(e) => setForm((f) => ({ ...f, improve: e.target.value }))} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={saving} disabled={!complete}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function InterviewSummary({ interview, questions }) {
  if (!interview) return null;
  return (
    <div className="space-y-4">
      {interview.recorded_by_hr && <p className="text-xs text-slate-500">Recorded by HR on the employee&apos;s behalf.</p>}
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        {questions.map((q) => (
          <div key={q.key} className="flex items-center justify-between gap-3 py-1 border-b border-slate-50">
            <dt className="text-sm text-slate-600">{q.label}</dt>
            <dd className="text-sm font-bold text-slate-900 tabular-nums">{interview.ratings?.[q.key] ?? "—"} / 5</dd>
          </div>
        ))}
      </dl>
      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Main reason</dt>
          <dd className="font-semibold text-slate-800">{interview.primary_reason}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Would recommend</dt>
          <dd className="font-semibold text-slate-800">{interview.would_recommend ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Would rejoin</dt>
          <dd className="font-semibold text-slate-800">{interview.would_rejoin ? "Yes" : "No"}</dd>
        </div>
      </dl>
      {interview.liked && (
        <div>
          <p className="text-xs text-slate-500">Liked most</p>
          <p className="text-sm text-slate-700 whitespace-pre-line">{interview.liked}</p>
        </div>
      )}
      {interview.improve && (
        <div>
          <p className="text-xs text-slate-500">Could do better</p>
          <p className="text-sm text-slate-700 whitespace-pre-line">{interview.improve}</p>
        </div>
      )}
    </div>
  );
}

/** Manager or HR acceptance of a resignation. HR sets the final last working day. */
export function AcceptExitModal({ exitCase, employeeName, hrStep, onClose, onDone }) {
  const fullNotice = addDaysIso(String(exitCase.submitted_at).slice(0, 10), exitCase.notice_days);
  const [form, setForm] = useState({ comment: "", last_working_date: exitCase.requested_last_day || fullNotice, shortfall_reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const short = hrStep && form.last_working_date && form.last_working_date < fullNotice;

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { action: "accept", comment: form.comment };
      if (hrStep) Object.assign(body, { last_working_date: form.last_working_date, shortfall_reason: form.shortfall_reason });
      await hcmJson(`/api/hcm/exits/${exitCase.id}`, { method: "POST", body });
      await onDone(hrStep ? "Resignation accepted. Clearance has started." : "Resignation accepted and sent to HR.");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Accept resignation · ${employeeName}`}
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Back
          </Button>
          <Button onClick={submit} loading={saving} disabled={short && !form.shortfall_reason.trim()}>
            Accept
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Requested last day <strong>{formatDate(exitCase.requested_last_day)}</strong> · notice period {exitCase.notice_days} days (full notice ends {formatDate(fullNotice)}).
        </p>
        {hrStep && exitCase.status === "Pending manager" && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">The manager hasn&apos;t accepted yet. Accepting now completes both steps.</p>
        )}
        {hrStep && (
          <Field label="Last working day" required>
            <Input type="date" value={form.last_working_date} onChange={(e) => setForm((f) => ({ ...f, last_working_date: e.target.value }))} />
          </Field>
        )}
        {short && (
          <Field label="Reason for the shorter notice" required hint="Notice waived or bought out, mutual agreement, etc.">
            <Textarea value={form.shortfall_reason} onChange={(e) => setForm((f) => ({ ...f, shortfall_reason: e.target.value }))} />
          </Field>
        )}
        <Field label={hrStep ? "Comment (optional)" : "Comment for HR (optional)"} hint={hrStep ? undefined : "e.g. a different last day you'd suggest, or handover notes."}>
          <Textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  );
}

/** CHRO decision on an HR-initiated separation. */
export function SeparationDecisionModal({ exitCase, employeeName, decision, onClose, onDone }) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const reject = decision === "reject";
  return (
    <Modal
      title={`${reject ? "Reject" : "Approve"} ${exitCase.type.toLowerCase()} · ${employeeName}`}
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Back
          </Button>
          <Button
            variant={reject ? "danger" : "primary"}
            loading={saving}
            disabled={reject && !comment.trim()}
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                await hcmJson(`/api/hcm/exits/${exitCase.id}`, { method: "POST", body: { action: decision, comment } });
                await onDone(reject ? "Separation rejected." : "Separation approved. The employee has been notified.");
              } catch (err) {
                setError(err.message);
                setSaving(false);
              }
            }}
          >
            {reject ? "Reject" : "Approve"}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <p className="text-sm text-slate-600 mb-3">
        Last working day <strong>{formatDate(exitCase.requested_last_day)}</strong>
      </p>
      <Field label={reject ? "Reason" : "Comment (optional)"} required={reject}>
        <Textarea autoFocus value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
    </Modal>
  );
}
