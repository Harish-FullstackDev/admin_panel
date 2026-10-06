"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Search, UserPlus, PlayCircle } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Input, Select, Spinner, EmptyState, ErrorBanner, formatDate } from "@/components/hcm/ui";
import { StatusChip, ProgressBar, relativeDays, daysFromToday } from "@/components/hcm/onboarding";

const STATUSES = ["Pre-joining", "Ready", "Joined", "Cancelled"];

export default function OnboardingPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("onboarding.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Onboarding is managed by HR." />
      ) : (
        <JoinerList />
      )}
    </div>
  );
}

function JoinerList() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // Rendered only after the user loads (client side), so reading the URL here is safe.
  const [status, setStatus] = useState(() => new URLSearchParams(window.location.search).get("status") || "active");
  const [starting, setStarting] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson("/api/hcm/onboarding"));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.joiners.filter((j) => {
      if (status === "active" && !["Pre-joining", "Ready"].includes(j.status)) return false;
      if (status !== "active" && status && j.status !== status) return false;
      if (!q) return true;
      return [j.full_name, j.personal_email, j.position].some((v) => v?.toLowerCase().includes(q));
    });
  }, [data, search, status]);

  const start = async (applicationId) => {
    setStarting(applicationId);
    setError("");
    try {
      const res = await hcmJson("/api/hcm/onboarding", { method: "POST", body: { application_id: applicationId } });
      router.push(`/admin/dashboard/onboarding/${res.joiner.id}`);
    } catch (err) {
      setError(err.message);
      setStarting(null);
    }
  };

  return (
    <>
      <PageHeader title="Pre-joining" description="Accepted offers on their way to Day 1: documents, background checks and onboarding tasks." />
      <ErrorBanner message={error} onClose={() => setError("")} />

      {!data ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {data.hiredWithoutJoiner.length > 0 && (
            <Card title={`Hired, onboarding not started (${data.hiredWithoutJoiner.length})`}>
              <ul className="divide-y divide-slate-100 -my-2">
                {data.hiredWithoutJoiner.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {a.first_name} {a.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.position} · hired {formatDate(a.stage_changed_at)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => start(a.id)} loading={starting === a.id} disabled={Boolean(starting)}>
                      <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" /> Start onboarding
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <Input type="search" aria-label="Search joiners" placeholder="Search name, email or role" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select
                aria-label="Filter by status"
                className="w-auto min-w-[170px]"
                options={[{ value: "active", label: "In progress" }, ...STATUSES, { value: "", label: "All" }]}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title={data.joiners.length ? "No joiners match your filters" : "No joiners yet"}
                description="A joiner is created automatically when a candidate accepts an offer."
              />
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                      <th className="px-5 py-2">Joiner</th>
                      <th className="px-3 py-2">Joining</th>
                      <th className="px-3 py-2">Documents</th>
                      <th className="px-3 py-2">BGV</th>
                      <th className="px-3 py-2">Tasks</th>
                      <th className="px-5 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((j) => {
                      const r = j.readiness;
                      const days = daysFromToday(j.joining_date);
                      const soon = ["Pre-joining", "Ready"].includes(j.status) && days !== null && days <= 3;
                      return (
                        <tr key={j.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <Link href={`/admin/dashboard/onboarding/${j.id}`} className="font-semibold text-slate-800 hover:text-brand-teal-700">
                              {j.full_name}
                            </Link>
                            <div className="text-xs text-slate-500">
                              {j.position}
                              {j.departments?.name ? ` · ${j.departments.name}` : ""}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-slate-700">{formatDate(j.joining_date)}</div>
                            {["Pre-joining", "Ready"].includes(j.status) && (
                              <div className={`text-xs ${soon && !r.ready ? "font-semibold text-red-600" : "text-slate-400"}`}>{relativeDays(j.joining_date)}</div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <ProgressBar value={r.docsVerified} total={r.docsRequired} label="Required documents verified" />
                            {r.docsAwaiting > 0 && <div className="text-[11px] font-semibold text-indigo-600 mt-1">{r.docsAwaiting} to verify</div>}
                          </td>
                          <td className="px-3 py-3">
                            <StatusChip status={j.bgv_status} />
                          </td>
                          <td className="px-3 py-3">
                            <ProgressBar value={r.tasksTotal - r.tasksOpen} total={r.tasksTotal} label="Onboarding tasks done" />
                          </td>
                          <td className="px-5 py-3">
                            <StatusChip status={j.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
