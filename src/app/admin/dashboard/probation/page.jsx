"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Hourglass, Lock } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Select, Spinner, EmptyState, ErrorBanner, formatDate } from "@/components/hcm/ui";
import { StatusChip, ProgressBar, daysFromToday, relativeDays } from "@/components/hcm/onboarding";

export default function ProbationPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("probation.review") && !can("probation.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" />
      ) : (
        <Tracker />
      )}
    </div>
  );
}

function Tracker() {
  const [status, setStatus] = useState("open");
  const [type, setType] = useState("");
  const [dueSoon, setDueSoon] = useState(false);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ status, ...(type ? { type } : {}) });
      setRecords((await hcmJson(`/api/hcm/probation?${qs}`)).records);
    } catch (err) {
      setError(err.message);
    }
  }, [status, type]);

  useEffect(() => {
    setRecords(null);
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (!records) return [];
    if (!dueSoon) return records;
    return records.filter((r) => {
      const d = r.nextReview ? daysFromToday(r.nextReview.date) : null;
      return r.status === "Pending approval" || (d !== null && d <= 15) || daysFromToday(r.end_date) <= 15;
    });
  }, [records, dueSoon]);

  return (
    <>
      <PageHeader title="Interns & Probation" description="Trial periods in progress: tasks, weekly updates, reviews and outcomes." />
      <ErrorBanner message={error} onClose={() => setError("")} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select
            aria-label="Status"
            className="w-auto min-w-[150px]"
            options={[{ value: "open", label: "In progress" }, { value: "Pending approval", label: "Pending approval" }, { value: "Completed", label: "Completed" }, { value: "all", label: "All" }]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <Select aria-label="Type" className="w-auto min-w-[140px]" placeholder="Interns & probation" options={["Intern", "Probation"]} value={type} onChange={(e) => setType(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={dueSoon} onChange={(e) => setDueSoon(e.target.checked)} className="w-4 h-4 accent-brand-teal-600" />
            Needs attention (next 15 days)
          </label>
        </div>

        {!records ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={Hourglass} title="No one here" description="Interns and probationers appear when HR converts a joiner or adds staff on probation." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2">Employee</th>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Mentor</th>
                  <th className="px-3 py-2">Tasks</th>
                  <th className="px-3 py-2">Next review</th>
                  <th className="px-5 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const left = daysFromToday(r.end_date);
                  const open = r.status !== "Completed";
                  return (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/dashboard/probation/${r.id}`} className="font-semibold text-slate-800 hover:text-brand-teal-700">
                          {r.employees.full_name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {r.employees.designation || "—"} · {r.employees.manager?.full_name ? `reports to ${r.employees.manager.full_name}` : "no manager"}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusChip status={r.type} />
                        <div className={`text-xs mt-1 ${open && left <= 15 ? "font-semibold text-red-600" : "text-slate-500"}`}>
                          ends {formatDate(r.end_date)}
                          {open && ` (${relativeDays(r.end_date)})`}
                          {r.extension_count > 0 && ` · extended ×${r.extension_count}`}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{r.mentor?.full_name || "—"}</td>
                      <td className="px-3 py-3">
                        <ProgressBar value={r.tasks.done} total={r.tasks.total} label="Tasks done" />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {r.nextReview && open ? (
                          <>
                            <div className="text-slate-700">{r.nextReview.type}</div>
                            <div className={`text-xs ${r.overdueReview ? "font-semibold text-red-600" : "text-slate-500"}`}>
                              {formatDate(r.nextReview.date)} ({relativeDays(r.nextReview.date)})
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">{open ? "All done" : "—"}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusChip status={r.outcome || r.status} />
                        {r.status === "Active" && r.recommendation && <div className="text-[11px] text-brand-teal-700 font-semibold mt-1">Recommends: {r.recommendation}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
