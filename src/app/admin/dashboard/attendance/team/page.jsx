"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Textarea, Spinner, EmptyState, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";
import { StatusChip } from "@/components/hcm/onboarding";

const timeOf = (v) => (v ? new Date(v).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—");

function shiftMonth(m, delta) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + delta, 1)).toISOString().slice(0, 7);
}

export default function TeamAttendancePage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? <Spinner /> : !can("attendance.view") && !can("attendance.manage") ? <EmptyState icon={Lock} title="You don't have access to this page" /> : <TeamAttendance />}
    </div>
  );
}

function TeamAttendance() {
  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/attendance/team${month ? `?month=${month}` : ""}`));
    } catch (err) {
      setError(err.message);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const counts = data.board.reduce((acc, b) => ({ ...acc, [b.state]: (acc[b.state] || 0) + 1 }), {});
  const label = new Date(`${data.month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <PageHeader title="Team Attendance" description={data.scope === "team" ? "Your direct reports." : "Everyone."} />
      <ErrorBanner message={error} onClose={() => setError("")} />

      {data.corrections.length > 0 && (
        <Card title={`Correction requests (${data.corrections.length})`} className="mb-6">
          <ul className="divide-y divide-slate-100 -my-2">
            {data.corrections.map((c) => (
              <li key={c.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm font-semibold text-slate-800">
                    {c.employees.full_name} · {formatDate(c.work_date)}
                  </p>
                  <p className="text-xs text-slate-600">
                    {timeOf(c.check_in)} – {timeOf(c.check_out)} · {c.reason}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setDeciding({ c, decision: "reject" })}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => setDeciding({ c, decision: "approve" })}>
                    Approve
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={`Today · ${formatDate(data.today)}${data.offDay ? " (off day)" : ""}`} className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(counts).map(([state, n]) => (
            <span key={state} className="inline-flex items-center gap-1.5">
              <StatusChip status={state} /> <span className="text-sm font-bold text-slate-700">{n}</span>
            </span>
          ))}
        </div>
        {data.board.length === 0 ? (
          <p className="text-sm text-slate-500">No one in scope.</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2">Employee</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">In</th>
                  <th className="px-5 py-2">Out</th>
                </tr>
              </thead>
              <tbody>
                {data.board.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5">
                      <p className="font-semibold text-slate-800">{b.full_name}</p>
                      <p className="text-xs text-slate-500">{b.designation || "—"}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusChip status={b.state} />
                      {b.leave && <span className="ml-1.5 text-xs text-slate-500">{b.leave}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{timeOf(b.check_in)}</td>
                    <td className="px-5 py-2.5 text-slate-600">{timeOf(b.check_out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={`Monthly summary · ${label}`}
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
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-5 py-2">Employee</th>
                <th className="px-3 py-2 text-right">Present</th>
                <th className="px-3 py-2 text-right">Half days</th>
                <th className="px-3 py-2 text-right">On leave</th>
                <th className="px-3 py-2 text-right">Absent</th>
                <th className="px-3 py-2 text-right">No check-out</th>
                <th className="px-5 py-2 text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.summary.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0 tabular-nums">
                  <td className="px-5 py-2.5 font-semibold text-slate-800">{s.full_name}</td>
                  <td className="px-3 py-2.5 text-right">{s.present}</td>
                  <td className="px-3 py-2.5 text-right">{s.halfDays}</td>
                  <td className="px-3 py-2.5 text-right">{s.onLeave}</td>
                  <td className={`px-3 py-2.5 text-right ${s.absent ? "font-bold text-red-600" : ""}`}>{s.absent}</td>
                  <td className={`px-3 py-2.5 text-right ${s.missingCheckout ? "font-semibold text-orange-600" : ""}`}>{s.missingCheckout}</td>
                  <td className="px-5 py-2.5 text-right">{s.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {deciding && (
        <DecideDialog
          item={deciding}
          onClose={() => setDeciding(null)}
          onDone={async () => {
            setDeciding(null);
            await load();
          }}
        />
      )}
    </>
  );
}

function DecideDialog({ item, onClose, onDone }) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const reject = item.decision === "reject";
  return (
    <Modal
      title={`${reject ? "Reject" : "Approve"} correction`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
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
                await hcmJson(`/api/hcm/attendance/corrections/${item.c.id}`, { method: "POST", body: { decision: item.decision, comment } });
                await onDone();
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
      <ErrorBanner message={error} />
      <p className="text-sm text-slate-600 mb-3">
        {item.c.employees.full_name} · {formatDate(item.c.work_date)} · {timeOf(item.c.check_in)} – {timeOf(item.c.check_out)}
      </p>
      <Field label={reject ? "Reason" : "Comment (optional)"} required={reject}>
        <Textarea autoFocus value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
    </Modal>
  );
}
