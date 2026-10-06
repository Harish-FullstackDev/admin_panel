"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock, Plane, XCircle } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Select, Spinner, EmptyState, ErrorBanner } from "@/components/hcm/ui";
import { LeaveActionModal, ApprovalSteps, leaveDates, StatusChip } from "@/components/hcm/leave";

const TABS = [
  { key: "pending", label: "Needs my approval" },
  { key: "all", label: "All requests" },
  { key: "calendar", label: "Who's off (30 days)" },
];

export default function TeamLeavePage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? <Spinner /> : !can("leave.approve") && !can("leave.manage") ? <EmptyState icon={Lock} title="You don't have access to this page" /> : <TeamLeave />}
    </div>
  );
}

function TeamLeave() {
  const [tab, setTab] = useState("pending");
  const [statusFilter, setStatusFilter] = useState("all");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState(null);

  const load = useCallback(async () => {
    try {
      const status = tab === "pending" ? "pending" : statusFilter;
      setData(await hcmJson(`/api/hcm/leave/team?status=${encodeURIComponent(status)}`));
    } catch (err) {
      setError(err.message);
    }
  }, [tab, statusFilter]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const calendar = useMemo(() => {
    if (!data) return [];
    const days = [];
    const start = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate() + i));
      const iso = d.toISOString().slice(0, 10);
      days.push({ iso, dow: d.getUTCDay(), people: data.upcoming.filter((r) => r.start_date <= iso && r.end_date >= iso) });
    }
    return days;
  }, [data]);

  return (
    <>
      <PageHeader title="Team Leave" description="Approve leave for your team. Requests go to the reporting manager first, then HR." />
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div role="tablist" className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              tab === t.key ? "border-brand-teal-500 text-brand-teal-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <Spinner />
      ) : tab === "calendar" ? (
        <Card title={`On leave today: ${data.onLeaveToday.length}`}>
          <div className="space-y-1.5">
            {calendar.map((d) => (
              <div key={d.iso} className={`flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0 ${d.dow === 5 || d.dow === 6 ? "opacity-50" : ""}`}>
                <span className="w-28 shrink-0 text-xs font-semibold text-slate-600">
                  {new Date(`${d.iso}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {d.people.length === 0 ? (
                    <span className="text-xs text-slate-300">—</span>
                  ) : (
                    d.people.map((p) => (
                      <span
                        key={p.id}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          p.status === "Approved" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-amber-50 text-amber-700 border-amber-200 border-dashed"
                        }`}
                      >
                        {p.employees.full_name} · {p.leave_type}
                        {p.status !== "Approved" ? " (pending)" : ""}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card
          actions={
            tab === "all" && (
              <Select
                aria-label="Status"
                className="h-8 text-xs w-auto"
                options={[{ value: "all", label: "All statuses" }, "Pending manager", "Pending HR", "Approved", "Rejected", "Cancelled"]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            )
          }
          title={tab === "pending" ? `Waiting for you (${data.requests.length})` : "Requests"}
        >
          {data.requests.length === 0 ? (
            <EmptyState icon={Plane} title={tab === "pending" ? "Nothing waiting for you" : "No requests"} />
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {data.requests.map((r) => (
                <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-sm font-semibold text-slate-800">
                      {r.employees.full_name} <span className="font-normal text-slate-500">· {r.employees.designation || r.employees.employee_code}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      {r.leave_types?.name} · {leaveDates(r)} · {r.days} day{Number(r.days) === 1 ? "" : "s"}
                    </p>
                    {r.reason && <p className="text-xs text-slate-500 italic">“{r.reason}”</p>}
                  </div>
                  <ApprovalSteps status={r.status} />
                  <StatusChip status={r.status} />
                  {r.myAction && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setAction({ request: r, action: "reject" })}>
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => setAction({ request: r, action: "approve" })}>
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Approve
                      </Button>
                    </div>
                  )}
                  {data.isHr && r.status === "Approved" && (
                    <Button size="sm" variant="ghost" onClick={() => setAction({ request: { ...r, forOther: true }, action: "cancel" })}>
                      Cancel
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {tab === "pending" && data.isHr && (
            <p className="text-[11px] text-slate-400 mt-4">As HR you can approve requests still waiting for the manager; that approves them on the manager&apos;s behalf in one step.</p>
          )}
        </Card>
      )}

      {action && (
        <LeaveActionModal
          request={action.request}
          action={action.action}
          onClose={() => setAction(null)}
          onDone={async (a) => {
            setAction(null);
            setNotice(a === "approve" ? "Approved." : a === "reject" ? "Rejected." : "Cancelled.");
            await load();
          }}
        />
      )}
    </>
  );
}
