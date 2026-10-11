"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen, Lock, Plus } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Input, Textarea, Select, Spinner, EmptyState, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";
import { StatusChip, ProgressBar } from "@/components/hcm/onboarding";
import { ExitSteps, daysLeft } from "@/components/hcm/exit";

const TABS = [
  { key: "action", label: "Awaiting acceptance" },
  { key: "notice", label: "In notice" },
  { key: "completed", label: "Exited" },
  { key: "closed", label: "Withdrawn / cancelled" },
  { key: "all", label: "All" },
];
const HR_TYPES = ["Termination", "Contract end", "Retirement", "Other"];

export default function ExitsPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? <Spinner /> : !can("exit.review") && !can("exit.manage") && !can("exit.approve") ? <EmptyState icon={Lock} title="You don't have access to this page" /> : <Exits />}
    </div>
  );
}

function Exits() {
  const [tab, setTab] = useState("action");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/exits?group=${tab}`));
    } catch (err) {
      setError(err.message);
    }
  }, [tab]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Exits"
        description="Resignations, separations, notice periods and clearance."
        actions={
          data?.canManage && (
            <Button onClick={() => setStarting(true)}>
              <Plus className="w-4 h-4" aria-hidden="true" /> Start separation
            </Button>
          )
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

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
      ) : data.exits.length === 0 ? (
        <EmptyState icon={DoorOpen} title="No exits here" />
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2">Employee</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last working day</th>
                  <th className="px-5 py-2">Clearance</th>
                </tr>
              </thead>
              <tbody>
                {data.exits.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/dashboard/exits/${c.id}`} className="font-semibold text-slate-800 hover:text-brand-teal-700 hover:underline">
                        {c.employees?.full_name}
                      </Link>
                      <p className="text-xs text-slate-500">{[c.employees?.designation, c.employees?.departments?.name].filter(Boolean).join(" · ") || c.employees?.employee_code}</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={c.type} />
                      {c.reason_category && <p className="text-[11px] text-slate-500 mt-1">{c.reason_category}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <StatusChip status={c.status} />
                          {c.myAction && <span className="text-[11px] font-semibold text-amber-700">Needs you</span>}
                        </span>
                        <ExitSteps exitCase={c} />
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatDate(c.last_working_date || c.requested_last_day)}
                      {!c.last_working_date && c.requested_last_day && <span className="block text-[11px] text-slate-400">requested</span>}
                      {c.status === "In notice" && <span className="block text-[11px] font-semibold text-orange-600">{daysLeft(c.last_working_date)}</span>}
                    </td>
                    <td className="px-5 py-3">{c.clearance.total ? <ProgressBar value={c.clearance.done} total={c.clearance.total} label="Clearance" /> : <span className="text-xs text-slate-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {starting && (
        <StartSeparationModal
          onClose={() => setStarting(false)}
          onDone={async () => {
            setStarting(false);
            setTab("action");
            await load();
          }}
        />
      )}
    </>
  );
}

function StartSeparationModal({ onClose, onDone }) {
  const [employees, setEmployees] = useState(null);
  const [form, setForm] = useState({ employee_id: "", type: "Termination", last_working_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    hcmJson("/api/hcm/employees?status=Active")
      .then((d) => setEmployees(d.employees || []))
      .catch((err) => setError(err.message));
  }, []);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await hcmJson("/api/hcm/exits", { method: "POST", body: form });
      await onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Start separation"
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!form.employee_id || !form.last_working_date || !form.reason.trim()}>
            Send for CHRO approval
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <p className="text-xs text-slate-500 mb-4">
        For terminations, contract ends and retirements. The CHRO approves before the employee is told. Resignations come from the employee; probation releases come from the probation tracker.
      </p>
      <div className="space-y-4">
        <Field label="Employee" required>
          {employees ? (
            <Select
              placeholder="Choose…"
              options={employees.map((e) => ({ value: e.id, label: `${e.full_name} · ${e.employee_code}${e.designation ? ` · ${e.designation}` : ""}` }))}
              value={form.employee_id}
              onChange={set("employee_id")}
            />
          ) : (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Type" required>
            <Select options={HR_TYPES} value={form.type} onChange={set("type")} />
          </Field>
          <Field label="Last working day" required>
            <Input type="date" value={form.last_working_date} onChange={set("last_working_date")} />
          </Field>
        </div>
        <Field label="Reason" required hint="Shared with the CHRO. The employee sees it once approved.">
          <Textarea value={form.reason} onChange={set("reason")} />
        </Field>
      </div>
    </Modal>
  );
}
