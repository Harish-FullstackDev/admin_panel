"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Lock, Plus, Search } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Input, Spinner, EmptyState, ErrorBanner, formatDate } from "@/components/hcm/ui";
import { RequisitionStatusBadge } from "@/components/hcm/RequisitionForm";

const TABS = [
  { key: "all", label: "All" },
  { key: "action", label: "Needs my action" },
  { key: "approval", label: "In approval" },
  { key: "approved", label: "Approved" },
  { key: "closed", label: "Closed" },
];

const GROUPS = {
  approval: ["Pending HR", "Pending CHRO", "Sent back"],
  approved: ["Approved", "Posted"],
  closed: ["Filled", "Closed", "Rejected", "Withdrawn"],
};

export default function RequisitionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <Suspense fallback={<Spinner />}>
        <RequisitionsGate />
      </Suspense>
    </div>
  );
}

function RequisitionsGate() {
  const { user, can } = useInternalUser();
  if (!user) return <Spinner />;
  if (!can("requisition.view")) {
    return <EmptyState icon={Lock} title="You don't have access to this page" description="Ask an admin for the requisition.view permission." />;
  }
  return <RequisitionsList />;
}

function RequisitionsList() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, can, scopeOf } = useInternalUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const statusParam = params.get("status");
  const tabParam = params.get("tab");
  const initialTab = TABS.some((t) => t.key === tabParam)
    ? tabParam
    : statusParam
      ? Object.keys(GROUPS).find((k) => GROUPS[k].includes(statusParam)) || "all"
      : "all";
  const [tab, setTabState] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState(statusParam || "");
  const setTab = (key) => {
    setTabState(key);
    setStatusFilter("");
  };

  useEffect(() => {
    let active = true;
    hcmJson("/api/hcm/requisitions")
      .then((data) => active && setItems(data.requisitions || []))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const own = scopeOf("requisition.view") === "own";
  const canReview = can("requisition.review");
  const canApprove = can("requisition.approve");

  const needsMyAction = (r) => {
    const mine = r.raised_by === user.id;
    if (mine) return r.status === "Draft" || r.status === "Sent back";
    if (r.status === "Pending HR") return canReview;
    if (r.status === "Pending CHRO") return canApprove;
    return false;
  };

  const counts = useMemo(() => {
    const out = { all: items.length, action: 0, approval: 0, approved: 0, closed: 0 };
    for (const r of items) {
      if (needsMyAction(r)) out.action += 1;
      for (const k of Object.keys(GROUPS)) if (GROUPS[k].includes(r.status)) out[k] += 1;
    }
    return out;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (tab === "action" && !needsMyAction(r)) return false;
      if (GROUPS[tab] && !GROUPS[tab].includes(r.status)) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.code, r.role_title, r.departments?.name, r.raiser?.full_name].some((v) => v && v.toLowerCase().includes(q));
    });
  }, [items, tab, search, statusFilter]);

  const open = (id) => router.push(`/admin/dashboard/requisitions/${id}`);

  return (
    <>
      <PageHeader
        title={own ? "My Requisitions" : "Requisitions"}
        description={own ? "Hiring requests you have raised and where they are in approval." : "Hiring requests across the organisation and their approval status."}
        actions={
          can("requisition.create") && (
            <Button onClick={() => router.push("/admin/dashboard/requisitions/new")}>
              <Plus className="w-4 h-4" aria-hidden="true" /> Raise requisition
            </Button>
          )
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <div role="tablist" aria-label="Filter requisitions" className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map((t) => {
          const selected = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                selected ? "bg-brand-teal-500 border-transparent text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
              {!loading && (
                <span className={`text-[11px] rounded-full px-1.5 ${selected ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{counts[t.key]}</span>
              )}
            </button>
          );
        })}
      </div>
      {statusFilter && (
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
          Showing only <RequisitionStatusBadge status={statusFilter} />
          <button type="button" onClick={() => setStatusFilter("")} className="font-semibold text-brand-teal-600 hover:underline cursor-pointer">
            Clear filter
          </button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="relative mb-4 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search requisitions"
              placeholder="Search code, role, department or requester"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={items.length ? "No requisitions match this view" : "No requisitions yet"}
              description={!items.length && can("requisition.create") ? "Raise a requisition to start the hiring approval process." : undefined}
            />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-2">Code</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2 text-right">Openings</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Raised by</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Submitted</th>
                    <th className="px-5 py-2">Target date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      tabIndex={0}
                      aria-label={`Open requisition ${r.code || r.role_title}`}
                      onClick={() => open(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          open(r.id);
                        }
                      }}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer focus:outline-none focus:bg-brand-teal-50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{r.code || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800">{r.role_title}</div>
                        {r.locations?.name && <div className="text-xs text-slate-500">{r.locations.name}</div>}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{r.departments?.name || "—"}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{r.openings}</td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {r.request_type}
                        <div className="text-xs text-slate-400">{r.employment_type}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {r.raiser?.full_name || "—"}
                        {r.raised_by === user.id && <span className="ml-1 text-[11px] text-slate-400">(you)</span>}
                      </td>
                      <td className="px-3 py-3">
                        <RequisitionStatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.submitted_at)}</td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.target_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
