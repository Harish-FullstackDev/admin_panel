"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, ArchiveRestore, Lock, Pencil, Plus, Trash2, SlidersHorizontal } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Input, Select, Spinner, EmptyState, ErrorBanner, Modal, Badge, formatDate } from "@/components/hcm/ui";
import { useOrgLists } from "@/components/hcm/onboarding";

const TABS = ["Leave types", "Holidays", "Balances"];
const COLORS = ["teal", "sky", "violet", "amber", "rose", "slate"];

export default function LeaveSettingsPage() {
  const { user, can } = useInternalUser();
  const [tab, setTab] = useState("Leave types");
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("leave.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" />
      ) : (
        <>
          <PageHeader title="Leave Settings" description="Leave policy, holiday calendar and employee balances. Work week: Sunday–Thursday." />
          <div role="tablist" className="flex gap-1 border-b border-slate-200 mb-5">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${tab === t ? "border-brand-teal-500 text-brand-teal-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Leave types" && <TypesTab />}
          {tab === "Holidays" && <HolidaysTab />}
          {tab === "Balances" && <BalancesTab currentUserId={user.id} />}
        </>
      )}
    </div>
  );
}

const showQuota = (v) => (v === null || v === undefined ? "No limit" : `${Number(v)} days`);

function TypesTab() {
  const [types, setTypes] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const load = useCallback(async () => {
    try {
      setTypes((await hcmJson("/api/hcm/leave/types")).types);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!types) return error ? <ErrorBanner message={error} /> : <Spinner />;
  return (
    <Card
      title="Leave types"
      actions={
        <Button size="sm" onClick={() => setEditing({ code: "", name: "", annual_quota: "", intern_quota: "", interns_allowed: true, paid: true, carry_forward_max: 0, allow_half_day: true, color: "teal", sort: 100, isNew: true })}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add type
        </Button>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <p className="text-xs text-slate-500 mb-3">Quota changes apply to balances created after the change (new years, new joiners). Use Balances to adjust existing ones.</p>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
              <th className="px-5 py-2">Type</th>
              <th className="px-3 py-2">Yearly quota</th>
              <th className="px-3 py-2">Interns</th>
              <th className="px-3 py-2">Carry forward</th>
              <th className="px-3 py-2">Half day</th>
              <th className="px-5 py-2" />
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.code} className={`border-b border-slate-50 last:border-0 ${t.archived ? "opacity-50" : ""}`}>
                <td className="px-5 py-2.5">
                  <span className="font-semibold text-slate-800">{t.name}</span> <span className="text-xs font-mono text-slate-400">{t.code}</span>
                  {!t.paid && <Badge className="ml-1.5">Unpaid</Badge>}
                </td>
                <td className="px-3 py-2.5">{showQuota(t.annual_quota)}</td>
                <td className="px-3 py-2.5">{t.interns_allowed ? showQuota(t.intern_quota ?? t.annual_quota) : "Not available"}</td>
                <td className="px-3 py-2.5">{Number(t.carry_forward_max) ? `Up to ${Number(t.carry_forward_max)}` : "—"}</td>
                <td className="px-3 py-2.5">{t.allow_half_day ? "Yes" : "No"}</td>
                <td className="px-5 py-2.5 text-right whitespace-nowrap">
                  {!t.archived && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t)} aria-label={`Edit ${t.name}`}>
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t.archived ? "Restore" : "Archive"}
                    onClick={async () => {
                      try {
                        await hcmJson("/api/hcm/leave/types", { method: "PATCH", body: { code: t.code, archived: !t.archived } });
                        await load();
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                  >
                    {t.archived ? <ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" /> : <Archive className="w-3.5 h-3.5" aria-hidden="true" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <TypeEditor type={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />}
    </Card>
  );
}

function TypeEditor({ type, onClose, onSaved }) {
  const [form, setForm] = useState({
    ...type,
    annual_quota: type.annual_quota ?? "",
    intern_quota: type.intern_quota ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { isNew, archived, created_at, updated_at, ...body } = form;
      void archived;
      void created_at;
      void updated_at;
      await hcmJson("/api/hcm/leave/types", { method: isNew ? "POST" : "PATCH", body });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return (
    <Modal
      title={type.isNew ? "Add leave type" : `Edit ${type.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.name.trim() || (type.isNew && !form.code.trim())}>
            Save
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" required>
          <Input value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Code" required={type.isNew}>
          <Input value={form.code} onChange={set("code")} disabled={!type.isNew} placeholder="e.g. ML" />
        </Field>
        <Field label="Yearly quota (days)" hint="Leave blank for no limit.">
          <Input type="number" step="0.5" min="0" value={form.annual_quota} onChange={set("annual_quota")} />
        </Field>
        <Field label="Intern quota (days)" hint="Blank = same as yearly quota.">
          <Input type="number" step="0.5" min="0" value={form.intern_quota} onChange={set("intern_quota")} disabled={!form.interns_allowed} />
        </Field>
        <Field label="Max carry forward (days)">
          <Input type="number" step="0.5" min="0" value={form.carry_forward_max} onChange={set("carry_forward_max")} />
        </Field>
        <Field label="Colour">
          <Select options={COLORS} value={form.color} onChange={set("color")} />
        </Field>
        <div className="sm:col-span-2 flex flex-wrap gap-5 text-sm text-slate-700">
          {[
            ["paid", "Paid leave"],
            ["allow_half_day", "Half days allowed"],
            ["interns_allowed", "Available to interns"],
          ].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={Boolean(form[k])} onChange={set(k)} className="w-4 h-4 accent-brand-teal-600" /> {l}
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function HolidaysTab() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const org = useOrgLists({ users: false });
  const load = useCallback(async () => {
    try {
      setHolidays((await hcmJson(`/api/hcm/holidays?year=${year}`)).holidays);
    } catch (err) {
      setError(err.message);
    }
  }, [year]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card
      title="Holiday calendar"
      actions={
        <div className="flex gap-2">
          <Select aria-label="Year" className="h-8 text-xs w-auto" options={[year - 1, year, year + 1].map(String)} value={String(year)} onChange={(e) => setYear(Number(e.target.value))} />
          <Button size="sm" onClick={() => setEditing({ date: "", name: "", location_id: "", optional: false })}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add holiday
          </Button>
        </div>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      {!holidays ? (
        <Spinner />
      ) : holidays.length === 0 ? (
        <p className="text-sm text-slate-500">No holidays for {year}.</p>
      ) : (
        <ul className="divide-y divide-slate-100 -my-2">
          {holidays.map((h) => (
            <li key={h.id} className="py-2.5 flex flex-wrap items-center gap-3">
              <span className="w-36 text-sm text-slate-600">
                {new Date(`${h.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <span className="flex-1 text-sm font-semibold text-slate-800">{h.name}</span>
              {h.locations?.name && <Badge>{h.locations.name} only</Badge>}
              {h.optional && <Badge>Optional</Badge>}
              <Button size="sm" variant="ghost" onClick={() => setEditing({ ...h, location_id: h.location_id || "" })} aria-label={`Edit ${h.name}`}>
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Delete ${h.name}`}
                onClick={async () => {
                  if (!window.confirm(`Delete ${h.name} (${formatDate(h.date)})?`)) return;
                  try {
                    await hcmJson(`/api/hcm/holidays?id=${h.id}`, { method: "DELETE" });
                    await load();
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <HolidayEditor
          holiday={editing}
          locations={org.locations}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </Card>
  );
}

function HolidayEditor({ holiday, locations, onClose, onSaved }) {
  const [form, setForm] = useState({ date: holiday.date, name: holiday.name, location_id: holiday.location_id, optional: holiday.optional });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { ...form, location_id: form.location_id || null };
      await hcmJson("/api/hcm/holidays", { method: holiday.id ? "PATCH" : "POST", body: holiday.id ? { id: holiday.id, ...body } : body });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return (
    <Modal
      title={holiday.id ? "Edit holiday" : "Add holiday"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.date || !form.name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Location" className="sm:col-span-2">
          <Select placeholder="All locations" options={locations.map((l) => ({ value: l.id, label: l.name }))} value={form.location_id} onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))} />
        </Field>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.optional} onChange={(e) => setForm((f) => ({ ...f, optional: e.target.checked }))} className="w-4 h-4 accent-brand-teal-600" />
          Optional holiday (shown on the calendar; anyone taking it applies for leave)
        </label>
      </div>
    </Modal>
  );
}

function BalancesTab({ currentUserId }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState(null);
  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/leave/balances?year=${year}`));
    } catch (err) {
      setError(err.message);
    }
  }, [year]);
  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const codes = data ? [...new Map(data.rows.flatMap((r) => r.balances).map((b) => [b.code, b])).values()].filter((b) => !b.unlimited) : [];
  return (
    <Card
      title={`Balances ${year}`}
      actions={<Select aria-label="Year" className="h-8 text-xs w-auto" options={[year - 1, year, year + 1].map(String)} value={String(year)} onChange={(e) => setYear(Number(e.target.value))} />}
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      {!data ? (
        <Spinner />
      ) : data.rows.length === 0 ? (
        <p className="text-sm text-slate-500">No active employees.</p>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-5 py-2">Employee</th>
                {codes.map((c) => (
                  <th key={c.code} className="px-3 py-2 text-right">
                    {c.name}
                  </th>
                ))}
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map(({ employee, balances }) => (
                <tr key={employee.id} className="border-b border-slate-50 last:border-0 tabular-nums">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold text-slate-800">{employee.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {employee.employee_code} · {employee.stage}
                    </p>
                  </td>
                  {codes.map((c) => {
                    const b = balances.find((x) => x.code === c.code);
                    return (
                      <td key={c.code} className="px-3 py-2.5 text-right">
                        {b ? (
                          <>
                            <span className="font-semibold text-slate-800">{b.available}</span>
                            <span className="text-xs text-slate-400"> / {b.total}</span>
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-5 py-2.5 text-right">
                    {employee.id !== currentUserId && (
                      <Button size="sm" variant="ghost" onClick={() => setAdjusting(employee)}>
                        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" /> Adjust
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {adjusting && (
        <AdjustDialog
          employee={adjusting}
          year={year}
          onClose={() => setAdjusting(null)}
          onSaved={async () => {
            setAdjusting(null);
            await load();
          }}
        />
      )}
    </Card>
  );
}

function AdjustDialog({ employee, year, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ leave_type: "", days: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    hcmJson(`/api/hcm/leave/balances?year=${year}&employee=${employee.id}`)
      .then((d) => {
        setDetail(d);
        setForm((f) => ({ ...f, leave_type: d.balances.find((b) => !b.unlimited)?.code || "" }));
      })
      .catch((err) => setError(err.message));
  }, [employee.id, year]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await hcmJson("/api/hcm/leave/balances", { method: "POST", body: { employee_id: employee.id, year, ...form } });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return (
    <Modal
      title={`Adjust balance · ${employee.full_name} (${year})`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.leave_type || !Number(form.days) || !form.reason.trim()}>
            Save adjustment
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      {!detail ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Leave type" required>
              <Select options={detail.balances.filter((b) => !b.unlimited).map((b) => ({ value: b.code, label: `${b.name} (${b.available} left)` }))} value={form.leave_type} onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))} />
            </Field>
            <Field label="Days (+ add / − deduct)" required>
              <Input type="number" step="0.5" value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))} placeholder="e.g. 2 or -1" />
            </Field>
          </div>
          <Field label="Reason" required>
            <Input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Comp-off for weekend release" />
          </Field>
          {detail.history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">History</p>
              <ul className="space-y-1 text-xs text-slate-600">
                {detail.history.map((h) => (
                  <li key={h.id}>
                    {formatDate(h.created_at)} · {h.leave_type} {h.days > 0 ? "+" : ""}
                    {h.days} · {h.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
