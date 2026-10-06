"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, PartyPopper, Plane } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Spinner, EmptyState, ErrorBanner, Select } from "@/components/hcm/ui";
import { BalanceCards, ApplyLeaveModal, LeaveActionModal, ApprovalSteps, leaveDates, StatusChip } from "@/components/hcm/leave";

export default function MyLeavePage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{!user ? <Spinner /> : <MyLeave />}</div>;
}

function MyLeave() {
  const [year, setYear] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [applying, setApplying] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/leave/me${year ? `?year=${year}` : ""}`));
    } catch (err) {
      setError(err.message);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return error ? <EmptyState icon={Plane} title="Leave isn't available" description={error} /> : <Spinner />;
  const thisYear = Number(data.today.slice(0, 4));

  return (
    <>
      <PageHeader
        title="My Leave"
        description="Balances, requests and the holiday calendar. The work week is Sunday to Thursday."
        actions={
          <>
            <Select
              aria-label="Year"
              className="w-auto"
              options={[thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))}
              value={String(data.year)}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <Button onClick={() => setApplying(true)}>
              <CalendarPlus className="w-4 h-4" aria-hidden="true" /> Apply leave
            </Button>
          </>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 flex justify-between gap-2">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-xs font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <BalanceCards balances={data.balances} />

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <Card title={`My requests (${data.year})`} className="lg:col-span-2">
          {data.requests.length === 0 ? (
            <p className="text-sm text-slate-500">No leave requests this year.</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {data.requests.map((r) => {
                const cancellable = ["Pending manager", "Pending HR"].includes(r.status) || (r.status === "Approved" && r.start_date > data.today);
                return (
                  <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-semibold text-slate-800">
                        {r.leave_types?.name} · {r.days} day{Number(r.days) === 1 ? "" : "s"}
                      </p>
                      <p className="text-xs text-slate-500">{leaveDates(r)}</p>
                      {r.decision_comment && <p className="text-xs text-slate-500 mt-0.5">“{r.decision_comment}”</p>}
                      {r.cancel_reason && <p className="text-xs text-slate-500 mt-0.5">Cancelled: {r.cancel_reason}</p>}
                    </div>
                    {["Pending manager", "Pending HR", "Approved"].includes(r.status) && <ApprovalSteps status={r.status} />}
                    <StatusChip status={r.status} />
                    {cancellable && (
                      <Button size="sm" variant="ghost" onClick={() => setCancelling(r)}>
                        Cancel
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Upcoming holidays">
          {data.holidays.length === 0 ? (
            <p className="text-sm text-slate-500">No holidays scheduled.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.holidays.map((h) => (
                <li key={h.id} className="flex items-start gap-3">
                  <PartyPopper className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(`${h.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      {h.optional ? " · optional" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {applying && (
        <ApplyLeaveModal
          types={data.types}
          balances={data.balances}
          hasManager={data.hasManager}
          onClose={() => setApplying(false)}
          onApplied={async () => {
            setApplying(false);
            setNotice(data.hasManager ? "Leave requested. Your manager has been notified." : "Leave requested. HR has been notified.");
            await load();
          }}
        />
      )}
      {cancelling && (
        <LeaveActionModal
          request={cancelling}
          action="cancel"
          onClose={() => setCancelling(null)}
          onDone={async () => {
            setCancelling(null);
            setNotice("Leave cancelled. Your balance has been restored.");
            await load();
          }}
        />
      )}
    </>
  );
}

