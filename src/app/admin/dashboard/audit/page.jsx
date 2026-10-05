"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Lock, ScrollText } from "lucide-react";
import { hcmJson, hcmFetch } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Badge,
  Spinner,
  EmptyState,
  ErrorBanner,
  Modal,
  formatDate,
} from "@/components/hcm/ui";

const ENTITY_TYPES = ["internal_user", "role", "departments", "locations", "grades", "email_template"];
const EMPTY_FILTERS = { entity_type: "", action: "", actor: "", from: "", to: "" };

function buildQuery(filters, extra = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filters, ...extra })) if (v !== "" && v !== null && v !== undefined) params.set(k, String(v));
  return params.toString();
}

export default function AuditPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("audit.view") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask a Super Admin for the audit.view permission." />
      ) : (
        <AuditLog />
      )}
    </div>
  );
}

function AuditLog() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ logs: [], total: 0, pageSize: 50 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await hcmJson(`/api/hcm/audit?${buildQuery(filters, { page })}`);
      setResult({ logs: data.logs || [], total: data.total || 0, pageSize: data.pageSize || 50 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const apply = (e) => {
    e.preventDefault();
    setFilters({ ...draft, actor: draft.actor.trim(), action: draft.action.trim(), entity_type: draft.entity_type.trim() });
    setPage(1);
  };

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await hcmFetch(`/api/hcm/audit?${buildQuery(filters, { format: "csv" })}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const match = /filename="?([^"]+)"?/.exec(res.headers.get("Content-Disposition") || "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match?.[1] || `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const { logs, total, pageSize } = result;
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Every administrative change, who made it and when."
        actions={
          <Button variant="secondary" onClick={exportCsv} loading={exporting}>
            <Download className="w-4 h-4" aria-hidden="true" /> Export CSV
          </Button>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <Card className="mb-4">
        <form onSubmit={apply} className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <Field label="Entity type">
            <Input list="audit-entity-types" value={draft.entity_type} onChange={set("entity_type")} placeholder="Any" />
            <datalist id="audit-entity-types">
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Action">
            <Input value={draft.action} onChange={set("action")} placeholder="e.g. user.invite" />
          </Field>
          <Field label="Actor email">
            <Input value={draft.actor} onChange={set("actor")} placeholder="name@company.com" />
          </Field>
          <Field label="From">
            <Input type="date" value={draft.from} max={draft.to || undefined} onChange={set("from")} />
          </Field>
          <Field label="To">
            <Input type="date" value={draft.to} min={draft.from || undefined} onChange={set("to")} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Apply
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title={hasFilters ? "No entries match these filters" : "No audit entries yet"} />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2">Time</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-5 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    tabIndex={0}
                    onClick={() => setSelected(log)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(log);
                      }
                    }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer focus:outline-none focus:bg-brand-teal-50"
                  >
                    <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(log.created_at, true)}</td>
                    <td className="px-3 py-2.5 text-slate-700">{log.actor_email || "system"}</td>
                    <td className="px-3 py-2.5">
                      <Badge className="bg-brand-teal-50 text-brand-teal-700 border-brand-teal-100 font-mono">{log.action}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      <span className="font-medium">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="block font-mono text-[11px] text-slate-400 truncate max-w-[220px]" title={log.entity_id}>
                          {log.entity_id}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{log.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500" aria-live="polite">
            {first}–{last} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || last >= total}
              aria-label="Next page"
            >
              Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      {selected && <AuditDetailModal log={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function JsonBlock({ label, value }) {
  return (
    <div className="min-w-0">
      <h3 className="text-xs font-semibold text-slate-600 mb-1.5">{label}</h3>
      <pre className="text-[11px] leading-relaxed font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-auto max-h-[50vh] whitespace-pre-wrap break-words text-slate-700">
        {value === null || value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function AuditDetailModal({ log, onClose }) {
  return (
    <Modal wide title={log.action} onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <div>
          <dt className="text-xs text-slate-500">Time</dt>
          <dd className="text-slate-800">{formatDate(log.created_at, true)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Actor</dt>
          <dd className="text-slate-800">{log.actor_email || "system"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Entity</dt>
          <dd className="text-slate-800">
            {log.entity_type}
            {log.entity_id && <span className="block font-mono text-[11px] text-slate-500 break-all">{log.entity_id}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">IP address</dt>
          <dd className="font-mono text-xs text-slate-800">{log.ip || "—"}</dd>
        </div>
      </dl>
      <div className="grid md:grid-cols-2 gap-4">
        <JsonBlock label="Before" value={log.before} />
        <JsonBlock label="After" value={log.after} />
      </div>
    </Modal>
  );
}
