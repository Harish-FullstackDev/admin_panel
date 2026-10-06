"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, LogIn, LogOut, Wrench, Fingerprint } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Input, Textarea, Spinner, EmptyState, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";
import { StatusChip } from "@/components/hcm/onboarding";

const CELL = {
  Present: "bg-emerald-50 border-emerald-200 text-emerald-800",
  "Checked in": "bg-sky-50 border-sky-200 text-sky-800",
  "Half day": "bg-teal-50 border-teal-200 text-teal-800",
  Absent: "bg-red-50 border-red-200 text-red-700",
  "On leave": "bg-violet-50 border-violet-200 text-violet-800",
  Holiday: "bg-pink-50 border-pink-200 text-pink-700",
  Weekend: "bg-slate-50 border-slate-100 text-slate-400",
  "Missing check-out": "bg-orange-50 border-orange-200 text-orange-800",
  "Not checked in": "bg-white border-slate-200 text-slate-500",
  Upcoming: "bg-white border-slate-100 text-slate-300",
  "Not joined": "bg-white border-slate-100 text-slate-200",
};

function timeOf(value, tz) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: tz });
}

function shiftMonth(m, delta) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export default function MyAttendancePage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{!user ? <Spinner /> : <MyAttendance />}</div>;
}

function MyAttendance() {
  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [correcting, setCorrecting] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/attendance/me${month ? `?month=${month}` : ""}`));
    } catch (err) {
      setError(err.message);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!data) return error ? <EmptyState icon={Fingerprint} title="Attendance isn't available" description={error} /> : <Spinner />;
  const tz = data.timezone;
  const rec = data.today.record;
  const worked = rec?.check_in ? ((rec.check_out ? new Date(rec.check_out).getTime() : now) - new Date(rec.check_in).getTime()) / 3600000 : 0;

  const punch = async (action) => {
    setBusy(true);
    setError("");
    try {
      await hcmJson("/api/hcm/attendance/me", { method: "POST", body: { action } });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const firstDow = new Date(`${data.days[0].date}T00:00:00Z`).getUTCDay();
  const label = new Date(`${data.month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  const offToday = data.today.weekend || data.today.holiday || (data.today.leave && !data.today.leave.half);

  return (
    <>
      <PageHeader title="My Attendance" description="Check in when you start and check out when you finish. Friday and Saturday are off." />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <Card className="lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today · {formatDate(data.today.date)}</p>
          {offToday && !rec?.check_in ? (
            <p className="mt-3 text-lg font-bold text-slate-700">
              {data.today.holiday ? `Holiday: ${data.today.holiday}` : data.today.leave ? "You're on leave today" : "Weekend — enjoy!"}
            </p>
          ) : (
            <>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-slate-900">
                  {Math.floor(worked)}h {String(Math.round((worked % 1) * 60)).padStart(2, "0")}m
                </span>
                <span className="text-xs text-slate-500 mb-1.5">worked</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                In {timeOf(rec?.check_in, tz)} · Out {timeOf(rec?.check_out, tz)}
              </p>
              <div className="mt-4">
                {!rec?.check_in ? (
                  <Button className="w-full h-12 text-base" onClick={() => punch("check_in")} loading={busy}>
                    <LogIn className="w-5 h-5" aria-hidden="true" /> Check in
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-base" variant={rec.check_out ? "secondary" : "primary"} onClick={() => punch("check_out")} loading={busy}>
                    <LogOut className="w-5 h-5" aria-hidden="true" /> {rec.check_out ? "Update check-out" : "Check out"}
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>

        <Card title="This month" className="lg:col-span-2">
          <dl className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            {[
              ["Present", data.summary.present],
              ["Half days", data.summary.halfDays],
              ["On leave", data.summary.onLeave],
              ["Absent", data.summary.absent],
              ["No check-out", data.summary.missingCheckout],
              ["Hours", data.summary.hours],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-semibold text-slate-500">{k}</dt>
                <dd className="text-xl font-extrabold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card
        title={label}
        actions={
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" aria-label="Previous month" onClick={() => setMonth(shiftMonth(data.month, -1))}>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Next month" onClick={() => setMonth(shiftMonth(data.month, 1))}>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-400 mb-1.5" aria-hidden="true">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDow }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {data.days.map((d) => {
            const canCorrect = d.date < data.today.date && ["Absent", "Missing check-out", "Present", "Half day"].includes(d.status) && !(d.correction?.status === "Pending");
            return (
              <button
                key={d.date}
                type="button"
                disabled={!canCorrect}
                onClick={() => setCorrecting(d)}
                title={`${d.date} · ${d.status}${d.holiday ? ` (${d.holiday})` : ""}`}
                className={`min-h-[64px] p-1.5 rounded-xl border text-left transition ${CELL[d.status] || CELL.Upcoming} ${canCorrect ? "hover:ring-2 hover:ring-brand-teal-200 cursor-pointer" : "cursor-default"} ${
                  d.date === data.today.date ? "ring-2 ring-brand-teal-400" : ""
                }`}
              >
                <span className="block text-xs font-bold">{Number(d.date.slice(8))}</span>
                <span className="block text-[10px] leading-tight mt-0.5 truncate">{d.holiday || (d.leave ? d.leave.type : d.status === "Upcoming" || d.status === "Weekend" ? "" : d.status)}</span>
                {d.hours != null && <span className="block text-[10px] tabular-nums">{d.hours}h</span>}
                {d.correction?.status === "Pending" && <span className="block text-[10px] font-semibold text-amber-700">fix pending</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
          <Wrench className="w-3 h-3" aria-hidden="true" /> Click a past working day to request a correction (up to 30 days back).
        </p>
      </Card>

      {data.corrections.length > 0 && (
        <Card title="My correction requests" className="mt-6">
          <ul className="divide-y divide-slate-100 -my-2">
            {data.corrections.map((c) => (
              <li key={c.id} className="py-2.5 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(c.work_date)} · {timeOf(c.check_in, tz)}–{timeOf(c.check_out, tz)}
                  </p>
                  <p className="text-xs text-slate-500">{c.reason}</p>
                  {c.comment && <p className="text-xs text-slate-500">Reply: {c.comment}</p>}
                </div>
                <StatusChip status={c.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {correcting && (
        <CorrectionDialog
          day={correcting}
          tz={tz}
          onClose={() => setCorrecting(null)}
          onSaved={async () => {
            setCorrecting(null);
            await load();
          }}
        />
      )}
    </>
  );
}

function hhmm(value, tz) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz });
}

function CorrectionDialog({ day, tz, onClose, onSaved }) {
  const [form, setForm] = useState({ check_in: hhmm(day.check_in, tz) || "09:30", check_out: hhmm(day.check_out, tz) || "18:30", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await hcmJson("/api/hcm/attendance/corrections", { method: "POST", body: { work_date: day.date, ...form } });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return (
    <Modal
      title={`Correct ${formatDate(day.date)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.reason.trim()}>
            Send to manager
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="text-sm text-slate-600 mb-4 flex items-center gap-1.5">
        <Clock className="w-4 h-4" aria-hidden="true" /> Currently: {day.status}
        {day.check_in ? ` · in ${hhmm(day.check_in, tz)}` : ""}
        {day.check_out ? ` · out ${hhmm(day.check_out, tz)}` : ""}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Check-in" required>
          <Input type="time" value={form.check_in} onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))} />
        </Field>
        <Field label="Check-out" required>
          <Input type="time" value={form.check_out} onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))} />
        </Field>
        <Field label="Reason" required className="col-span-2">
          <Textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Forgot to check out after the client call" />
        </Field>
      </div>
    </Modal>
  );
}
