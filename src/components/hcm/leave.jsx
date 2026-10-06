"use client";

import { useEffect, useState } from "react";
import { hcmJson } from "@/lib/hcm/session";
import { Button, Field, Input, Textarea, Select, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";
import { StatusChip } from "@/components/hcm/onboarding";

const ACCENTS = {
  teal: "border-t-brand-teal-500",
  sky: "border-t-sky-500",
  violet: "border-t-violet-500",
  amber: "border-t-amber-500",
  rose: "border-t-rose-500",
  slate: "border-t-slate-400",
};

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function BalanceCards({ balances }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {balances.map((b) => (
        <div key={b.code} className={`p-4 bg-white border border-slate-200 border-t-4 ${ACCENTS[b.color] || ACCENTS.teal} rounded-2xl`}>
          <p className="text-xs font-semibold text-slate-500">{b.name}</p>
          {b.unlimited ? (
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {fmt(b.used)} <span className="text-xs font-semibold text-slate-400">used</span>
            </p>
          ) : (
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {fmt(b.available)}
              <span className="text-sm font-semibold text-slate-400"> / {fmt(b.total)}</span>
            </p>
          )}
          <p className="text-[11px] text-slate-500 mt-1">
            {b.unlimited ? (b.paid ? "No limit" : "Unpaid · no limit") : `${fmt(b.used)} used${b.pending ? ` · ${fmt(b.pending)} pending` : ""}${b.carried ? ` · ${fmt(b.carried)} carried` : ""}${b.adjusted ? ` · ${b.adjusted > 0 ? "+" : ""}${fmt(b.adjusted)} adj.` : ""}`}
          </p>
        </div>
      ))}
    </div>
  );
}

export function leaveDates(r) {
  if (r.start_date === r.end_date) return `${formatDate(r.start_date)}${r.start_half ? " (2nd half)" : r.end_half ? " (1st half)" : ""}`;
  return `${formatDate(r.start_date)}${r.start_half ? " ½" : ""} – ${formatDate(r.end_date)}${r.end_half ? " ½" : ""}`;
}

export function ApplyLeaveModal({ types, balances, hasManager, onClose, onApplied }) {
  const [form, setForm] = useState({ leave_type: types[0]?.code || "", start_date: "", end_date: "", start_half: false, end_half: false, reason: "" });
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const type = types.find((t) => t.code === form.leave_type);
  const balance = balances.find((b) => b.code === form.leave_type);
  const single = form.start_date && (!form.end_date || form.end_date === form.start_date);

  useEffect(() => {
    if (!form.start_date || !form.leave_type) return setPreview(null);
    let active = true;
    const t = setTimeout(() => {
      hcmJson("/api/hcm/leave/requests?preview=1", { method: "POST", body: { ...form, end_date: form.end_date || form.start_date } })
        .then((r) => active && setPreview({ days: r.days, holidays: r.holidays }))
        .catch((err) => active && setPreview({ error: err.message }));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [form]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await hcmJson("/api/hcm/leave/requests", { method: "POST", body: { ...form, end_date: form.end_date || form.start_date } });
      onApplied();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const holidayNames = preview?.holidays ? Object.entries(preview.holidays) : [];
  return (
    <Modal
      title="Apply for leave"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!preview?.days || Boolean(preview?.error)}>
            Submit request
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="space-y-4">
        <Field label="Leave type" required hint={balance && !balance.unlimited ? `${fmt(balance.available)} day(s) available` : balance?.unlimited ? "No limit" : undefined}>
          <Select options={types.map((t) => ({ value: t.code, label: t.name }))} value={form.leave_type} onChange={set("leave_type")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="From" required>
            <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value, end_date: f.end_date && f.end_date < e.target.value ? e.target.value : f.end_date }))} />
          </Field>
          <Field label="To">
            <Input type="date" min={form.start_date || undefined} value={form.end_date} onChange={set("end_date")} />
          </Field>
        </div>
        {type?.allow_half_day && form.start_date && (
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.start_half} onChange={(e) => setForm((f) => ({ ...f, start_half: e.target.checked, end_half: single && e.target.checked ? false : f.end_half }))} className="w-4 h-4 accent-brand-teal-600" />
              {single ? "Second half only" : "Start from second half"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.end_half} onChange={(e) => setForm((f) => ({ ...f, end_half: e.target.checked, start_half: single && e.target.checked ? false : f.start_half }))} className="w-4 h-4 accent-brand-teal-600" />
              {single ? "First half only" : "End after first half"}
            </label>
          </div>
        )}
        <Field label="Reason">
          <Textarea value={form.reason} onChange={set("reason")} placeholder="Optional for casual leave" />
        </Field>
        {preview && (
          <div className={`p-3 rounded-xl text-sm ${preview.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-brand-teal-50 text-brand-teal-800 border border-brand-teal-100"}`}>
            {preview.error ? (
              preview.error
            ) : (
              <>
                <span className="font-bold">{fmt(preview.days)} working day{preview.days === 1 ? "" : "s"}</span> (Friday and Saturday excluded)
                {holidayNames.length > 0 && <span> · holidays skipped: {holidayNames.map(([d, n]) => `${n} (${formatDate(d)})`).join(", ")}</span>}
              </>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500">{hasManager ? "Goes to your manager, then HR." : "You have no reporting manager, so this goes straight to HR."}</p>
      </div>
    </Modal>
  );
}

export function ApprovalSteps({ status }) {
  const steps = [
    { label: "Manager", state: status === "Pending manager" ? "current" : status === "Rejected" || status === "Cancelled" ? "stopped" : "done" },
    { label: "HR", state: status === "Pending HR" ? "current" : status === "Approved" ? "done" : status === "Pending manager" ? "todo" : "stopped" },
  ];
  const tone = { done: "bg-emerald-500", current: "bg-amber-400 animate-pulse", todo: "bg-slate-200", stopped: "bg-slate-300" };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500" aria-label={`Approval: ${status}`}>
      {steps.map((s, i) => (
        <span key={s.label} className="inline-flex items-center gap-1">
          {i > 0 && <span className="w-3 h-px bg-slate-300" aria-hidden="true" />}
          <span className={`w-2 h-2 rounded-full ${tone[s.state]}`} aria-hidden="true" />
          {s.label}
        </span>
      ))}
    </span>
  );
}

/** Approve / reject / cancel a leave request. */
export function LeaveActionModal({ request, action, onClose, onDone }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const cfg = {
    approve: { title: "Approve leave", button: "Approve", variant: "primary", label: "Comment (optional)", required: false },
    reject: { title: "Reject leave", button: "Reject", variant: "danger", label: "Reason (sent to the employee)", required: true },
    cancel: { title: "Cancel leave", button: "Cancel leave", variant: "danger", label: "Reason", required: action === "cancel" && request.forOther },
  }[action];
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const body = action === "cancel" ? { action, reason: text } : { action, comment: text };
      await hcmJson(`/api/hcm/leave/requests/${request.id}`, { method: "POST", body });
      onDone(action);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return (
    <Modal
      title={cfg.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button variant={cfg.variant} onClick={submit} loading={saving} disabled={cfg.required && !text.trim()}>
            {cfg.button}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="text-sm text-slate-600 mb-3">
        {request.employees?.full_name ? `${request.employees.full_name} · ` : ""}
        {request.leave_types?.name} · {leaveDates(request)} · {request.days} day(s)
      </p>
      {request.reason && <p className="text-sm text-slate-500 mb-3 italic">“{request.reason}”</p>}
      <Field label={cfg.label} required={cfg.required}>
        <Textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
    </Modal>
  );
}

export { StatusChip };
