"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Contact, Lock, Search, UserPlus } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Input, Select, Spinner, EmptyState, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";
import { StatusChip, useOrgLists, JOIN_STAGES } from "@/components/hcm/onboarding";

const STATUSES = ["Active", "Notice", "Exited"];

export default function EmployeesPage() {
  const { user, can, scopeOf } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("employee.view") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask HR for the employee.view permission." />
      ) : (
        <Directory teamOnly={scopeOf("employee.view") === "team"} canManage={can("employee.manage")} />
      )}
    </div>
  );
}

function Directory({ teamOnly, canManage }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ department: "", stage: "", status: "Active", location: "" });
  const [adding, setAdding] = useState(false);
  const org = useOrgLists({ users: canManage });

  const load = useCallback(async () => {
    try {
      setData(await hcmJson("/api/hcm/employees"));
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
    return data.employees.filter((e) => {
      if (filters.department && e.department_id !== filters.department) return false;
      if (filters.location && e.location_id !== filters.location) return false;
      if (filters.stage && e.stage !== filters.stage) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (!q) return true;
      return [e.full_name, e.official_email, e.employee_code, e.designation].some((v) => v?.toLowerCase().includes(q));
    });
  }, [data, search, filters]);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <PageHeader
        title={teamOnly ? "My Team" : "Employees"}
        description={teamOnly ? "People who report to you." : "Everyone who has joined, with their stage and reporting line."}
        actions={
          canManage &&
          data?.staffWithoutRecord?.length > 0 && (
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <UserPlus className="w-4 h-4" aria-hidden="true" /> Add existing staff
            </Button>
          )
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      {!data ? (
        <Spinner />
      ) : (
        <Card>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <Input type="search" aria-label="Search employees" placeholder="Search name, email, ID or designation" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {!teamOnly && (
              <Select aria-label="Department" className="w-auto min-w-[160px]" placeholder="All departments" options={org.departments.map((d) => ({ value: d.id, label: d.name }))} value={filters.department} onChange={setFilter("department")} />
            )}
            <Select aria-label="Location" className="w-auto min-w-[140px]" placeholder="All locations" options={org.locations.map((l) => ({ value: l.id, label: l.name }))} value={filters.location} onChange={setFilter("location")} />
            <Select aria-label="Stage" className="w-auto min-w-[130px]" placeholder="All stages" options={JOIN_STAGES} value={filters.stage} onChange={setFilter("stage")} />
            <Select aria-label="Status" className="w-auto min-w-[130px]" placeholder="All statuses" options={STATUSES} value={filters.status} onChange={setFilter("status")} />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={Contact}
              title={data.employees.length ? "No employees match your filters" : teamOnly ? "No one reports to you yet" : "No employees yet"}
              description={data.employees.length ? undefined : "Employees appear here when HR converts a joiner on Day 1."}
            />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-2">Employee</th>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Manager</th>
                    <th className="px-3 py-2">Stage</th>
                    <th className="px-3 py-2">Joined</th>
                    <th className="px-5 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/dashboard/employees/${e.id}`} className="font-semibold text-slate-800 hover:text-brand-teal-700">
                          {e.full_name}
                        </Link>
                        <div className="text-xs text-slate-500">{e.designation || e.official_email}</div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">{e.employee_code}</td>
                      <td className="px-3 py-3 text-slate-600">{e.departments?.name || "—"}</td>
                      <td className="px-3 py-3 text-slate-600">{e.manager?.full_name || "—"}</td>
                      <td className="px-3 py-3">
                        <StatusChip status={e.stage} />
                        {e.stage_end_date && <div className="text-[11px] text-slate-400 mt-0.5">until {formatDate(e.stage_end_date)}</div>}
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{formatDate(e.joining_date)}</td>
                      <td className="px-5 py-3">
                        <StatusChip status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {adding && (
        <AddStaffDialog
          staff={data.staffWithoutRecord}
          org={org}
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await load();
          }}
        />
      )}
    </>
  );
}

function AddStaffDialog({ staff, org, onClose, onSaved }) {
  const [form, setForm] = useState({
    user_id: "", joining_date: "", designation: "", department_id: "", location_id: "", grade_id: "", manager_id: "", stage: "Full-time", stage_end_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickUser = (e) => {
    const u = staff.find((s) => s.id === e.target.value);
    setForm((f) => ({ ...f, user_id: e.target.value, designation: u?.designation || "", department_id: u?.department_id || "" }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await hcmJson("/api/hcm/employees", { method: "POST", body: form });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add existing staff"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.user_id || !form.joining_date}>
            Add employee record
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <p className="text-sm text-slate-600 mb-4">For people who already have an HCM login (HR, managers) but no employee record.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Person" required className="sm:col-span-2">
          <Select placeholder="Choose…" options={staff.map((s) => ({ value: s.id, label: `${s.full_name} · ${s.email}` }))} value={form.user_id} onChange={pickUser} />
        </Field>
        <Field label="Joining date" required>
          <Input type="date" value={form.joining_date} onChange={set("joining_date")} />
        </Field>
        <Field label="Designation">
          <Input value={form.designation} onChange={set("designation")} />
        </Field>
        <Field label="Department">
          <Select placeholder="—" options={org.departments.map((d) => ({ value: d.id, label: d.name }))} value={form.department_id} onChange={set("department_id")} />
        </Field>
        <Field label="Location">
          <Select placeholder="—" options={org.locations.map((l) => ({ value: l.id, label: l.name }))} value={form.location_id} onChange={set("location_id")} />
        </Field>
        <Field label="Grade">
          <Select placeholder="—" options={org.grades.map((g) => ({ value: g.id, label: `${g.code} · ${g.name}` }))} value={form.grade_id} onChange={set("grade_id")} />
        </Field>
        <Field label="Reporting manager">
          <Select placeholder="—" options={org.users.filter((u) => u.id !== form.user_id).map((u) => ({ value: u.id, label: u.full_name }))} value={form.manager_id} onChange={set("manager_id")} />
        </Field>
        <Field label="Stage">
          <Select options={JOIN_STAGES} value={form.stage} onChange={set("stage")} />
        </Field>
        {form.stage !== "Full-time" && (
          <Field label="Stage end date">
            <Input type="date" value={form.stage_end_date} onChange={set("stage_end_date")} />
          </Field>
        )}
      </div>
    </Modal>
  );
}
