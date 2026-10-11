"use client";

import { useCallback, useEffect, useState } from "react";
import { DoorOpen, FileText, Info } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Input, Textarea, Select, Spinner, EmptyState, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";
import { StatusChip, ProgressBar } from "@/components/hcm/onboarding";
import { LetterModal } from "@/components/hcm/stage";
import { ExitSteps, ExitInterviewForm, InterviewSummary, daysLeft } from "@/components/hcm/exit";

export default function ResignationPage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">{!user ? <Spinner /> : <Resignation />}</div>;
}

function Resignation() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [letterId, setLetterId] = useState(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson("/api/hcm/exits/me"));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const c = data.exitCase;
  const open = c && ["Pending manager", "Pending HR", "Pending approval", "In notice"].includes(c.status);

  return (
    <>
      <PageHeader title="Resignation" description="Resign, track your notice period and complete your exit steps." />
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {c && (open || c.status === "Completed") ? (
        <CaseView
          data={data}
          onWithdraw={() => setConfirmWithdraw(true)}
          onOpenLetter={setLetterId}
          onInterview={async (answers) => {
            await hcmJson("/api/hcm/exits/me", { method: "POST", body: { action: "interview", ...answers } });
            setNotice("Thank you. Your exit interview was submitted.");
            await load();
          }}
        />
      ) : data.canSubmit ? (
        <>
          {c && (
            <p className="mb-4 text-xs text-slate-500">
              Your previous resignation was {c.status.toLowerCase()}
              {c.status === "Cancelled" && c.cancel_reason ? ` (${c.cancel_reason})` : ""}.
            </p>
          )}
          <ResignForm
            data={data}
            onDone={async () => {
              setNotice(data.hasManager ? "Resignation submitted. Your manager will review it first, then HR." : "Resignation submitted. HR will review it.");
              await load();
            }}
          />
        </>
      ) : (
        <EmptyState icon={DoorOpen} title="Resignation isn't available" description="Please talk to HR." />
      )}

      {confirmWithdraw && (
        <Modal
          title="Withdraw resignation?"
          onClose={() => setConfirmWithdraw(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmWithdraw(false)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await hcmJson("/api/hcm/exits/me", { method: "POST", body: { action: "withdraw" } });
                    setConfirmWithdraw(false);
                    setNotice("Your resignation was withdrawn.");
                    await load();
                  } catch (err) {
                    setConfirmWithdraw(false);
                    setError(err.message);
                  }
                }}
              >
                Withdraw
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">Your manager and HR will be told that you&apos;re staying.</p>
        </Modal>
      )}
      {letterId && <LetterModal letterId={letterId} onClose={() => setLetterId(null)} />}
    </>
  );
}

function ResignForm({ data, onDone }) {
  const [form, setForm] = useState({ reason_category: "", reason: "", requested_last_day: data.defaultLastDay, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const early = form.requested_last_day && form.requested_last_day < data.defaultLastDay;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await hcmJson("/api/hcm/exits/me", { method: "POST", body: { action: "submit", ...form } });
      await onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5 p-4 rounded-2xl border border-sky-200 bg-sky-50 flex gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-sky-900">
          <p>
            As {data.stage === "Intern" ? "an intern" : data.stage === "Probation" ? "a probationer" : "a full-time employee"} your notice period is{" "}
            <strong>{data.noticeDays} days</strong>. If you resign today, your last working day would be <strong>{formatDate(data.defaultLastDay)}</strong>.
          </p>
          <p className="text-xs mt-1 text-sky-800">
            {data.hasManager ? "Your manager accepts first, then HR confirms your last working day." : "HR will review and confirm your last working day."} You can withdraw until it&apos;s accepted.
          </p>
        </div>
      </div>
      <Card title="Submit resignation">
        <form onSubmit={submit} className="space-y-4">
          <ErrorBanner message={error} onClose={() => setError("")} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Reason for leaving" required>
              <Select placeholder="Choose…" options={data.reasons} value={form.reason_category} onChange={set("reason_category")} />
            </Field>
            <Field label="Preferred last working day" required hint={early ? "Earlier than your full notice. HR decides whether to release you early." : undefined}>
              <Input type="date" value={form.requested_last_day} onChange={set("requested_last_day")} />
            </Field>
          </div>
          <Field label="Anything you'd like to add" hint="Visible to your manager and HR.">
            <Textarea value={form.reason} onChange={set("reason")} />
          </Field>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.checked }))} />
            I want to resign from my position at Ascendus.
          </label>
          <div className="flex justify-end">
            <Button type="submit" variant="danger" loading={saving} disabled={!form.reason_category || !form.requested_last_day || !form.confirm}>
              Submit resignation
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

function CaseView({ data, onWithdraw, onOpenLetter, onInterview }) {
  const c = data.exitCase;
  const pending = ["Pending manager", "Pending HR"].includes(c.status);
  const done = data.tasks.filter((t) => t.status !== "Open").length;
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusChip status={c.status} />
              {c.type !== "Resignation" && <StatusChip status={c.type} />}
            </div>
            <p className="text-sm text-slate-600">
              {c.type === "Resignation" ? `Submitted ${formatDate(c.submitted_at)}` : c.reason ? c.reason : null}
              {c.reason_category ? ` · ${c.reason_category}` : ""}
            </p>
            <div className="mt-3">
              <ExitSteps exitCase={c} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{c.last_working_date ? "Last working day" : "Requested last day"}</p>
            <p className="text-2xl font-extrabold text-slate-900">{formatDate(c.last_working_date || c.requested_last_day)}</p>
            {c.status === "In notice" && <p className="text-xs font-semibold text-orange-600">{daysLeft(c.last_working_date)}</p>}
          </div>
        </div>
        {pending && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{c.status === "Pending manager" ? "Waiting for your manager." : "Waiting for HR."} You can still change your mind.</p>
            <Button variant="secondary" onClick={onWithdraw}>
              Withdraw resignation
            </Button>
          </div>
        )}
      </Card>

      {c.status === "In notice" && (
        <Card title="Exit interview">
          {c.interview_submitted_at ? (
            <>
              <p className="text-sm text-emerald-700 mb-4">Submitted {formatDate(c.interview_submitted_at)}. Thank you for your feedback.</p>
              <InterviewSummary interview={c.interview} questions={data.interviewQuestions} />
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">Your answers go to HR only; your manager doesn&apos;t see them.</p>
              <ExitInterviewForm questions={data.interviewQuestions} reasons={data.reasons} initialReason={c.reason_category} onSubmit={onInterview} />
            </>
          )}
        </Card>
      )}

      {data.tasks.length > 0 && c.status !== "Completed" && (
        <Card title="Clearance" actions={<ProgressBar value={done} total={data.tasks.length} label="Clearance progress" />}>
          <p className="text-xs text-slate-500 mb-3">These are handled by your manager, IT, Admin, Finance and HR before your last day.</p>
          <ul className="divide-y divide-slate-100 -my-2">
            {data.tasks.map((t) => (
              <li key={t.id} className="py-2.5 flex flex-wrap items-center gap-3">
                <span className="flex-1 min-w-[200px] text-sm text-slate-800">{t.title}</span>
                <span className="text-xs text-slate-500">{t.team}</span>
                <span className="text-xs text-slate-500 w-24">{t.due_date ? formatDate(t.due_date) : "—"}</span>
                <StatusChip status={t.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {c.status === "Completed" && (
        <Card title="Your letters">
          {data.letters.length === 0 ? (
            <p className="text-sm text-slate-500">No letters issued.</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {data.letters.map((l) => (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{l.title}</p>
                    <p className="text-xs text-slate-500">Issued {formatDate(l.issued_at)}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onOpenLetter(l.id)}>
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
