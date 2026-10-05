"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Lock, Plus } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
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
  formatMoney,
} from "@/components/hcm/ui";

function formatBand(item) {
  const hasMin = item.band_min !== null && item.band_min !== undefined;
  const hasMax = item.band_max !== null && item.band_max !== undefined;
  const currency = item.currency || "INR";
  if (!hasMin && !hasMax) return "—";
  if (hasMin && hasMax) return `${formatMoney(item.band_min, currency)} – ${formatMoney(item.band_max, currency)}`;
  return hasMin ? `From ${formatMoney(item.band_min, currency)}` : `Up to ${formatMoney(item.band_max, currency)}`;
}

const KINDS = {
  departments: {
    label: "Departments",
    singular: "department",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "code", label: "Code" },
    ],
    columns: [
      { label: "Name", render: (i) => <span className="font-semibold text-slate-800">{i.name}</span> },
      { label: "Code", render: (i) => <span className="font-mono text-xs">{i.code || "—"}</span> },
    ],
  },
  locations: {
    label: "Locations",
    singular: "location",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "timezone", label: "Timezone", placeholder: "e.g. Asia/Kolkata" },
    ],
    columns: [
      { label: "Name", render: (i) => <span className="font-semibold text-slate-800">{i.name}</span> },
      { label: "City", render: (i) => i.city || "—" },
      { label: "Country", render: (i) => i.country || "—" },
      { label: "Timezone", render: (i) => i.timezone || "—" },
    ],
  },
  grades: {
    label: "Grades",
    singular: "grade",
    fields: [
      { key: "code", label: "Code", required: true },
      { key: "name", label: "Name", required: true },
      { key: "band_min", label: "Band minimum", type: "number" },
      { key: "band_max", label: "Band maximum", type: "number" },
      { key: "currency", label: "Currency", placeholder: "INR", maxLength: 3 },
    ],
    columns: [
      { label: "Code", render: (i) => <span className="font-mono text-xs font-semibold">{i.code}</span> },
      { label: "Name", render: (i) => <span className="font-semibold text-slate-800">{i.name}</span> },
      { label: "Salary band", render: formatBand },
    ],
  },
};

const KIND_KEYS = Object.keys(KINDS);

export default function OrgPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("org.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask a Super Admin for the org.manage permission." />
      ) : (
        <OrgManager />
      )}
    </div>
  );
}

function OrgManager() {
  const [tab, setTab] = useState("departments");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async (kind) => {
    const res = await hcmJson(`/api/hcm/org/${kind}?all=1`);
    setData((d) => ({ ...d, [kind]: res.items || [] }));
  }, []);

  useEffect(() => {
    if (data[tab]) return;
    setLoading(true);
    load(tab)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab, data, load]);

  const config = KINDS[tab];
  const items = data[tab] || [];

  const toggleArchive = async (item) => {
    setError("");
    setToggling(item.id);
    try {
      const res = await hcmJson(`/api/hcm/org/${tab}`, { method: "PATCH", body: { id: item.id, archived: !item.archived } });
      setData((d) => ({ ...d, [tab]: d[tab].map((i) => (i.id === item.id ? res.item : i)) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const onKeyDownTabs = (e) => {
    const idx = KIND_KEYS.indexOf(tab);
    let next = null;
    if (e.key === "ArrowRight") next = KIND_KEYS[(idx + 1) % KIND_KEYS.length];
    if (e.key === "ArrowLeft") next = KIND_KEYS[(idx - 1 + KIND_KEYS.length) % KIND_KEYS.length];
    if (next) {
      e.preventDefault();
      setTab(next);
      document.getElementById(`org-tab-${next}`)?.focus();
    }
  };

  return (
    <>
      <PageHeader
        title="Organization"
        description="Departments, locations and grades used across requisitions, jobs and users."
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add {config.singular}
          </Button>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <div role="tablist" aria-label="Organization lists" className="inline-flex gap-1 p-1 mb-4 bg-slate-100 rounded-xl" onKeyDown={onKeyDownTabs}>
        {KIND_KEYS.map((k) => (
          <button
            key={k}
            id={`org-tab-${k}`}
            role="tab"
            aria-selected={tab === k}
            aria-controls="org-tabpanel"
            tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
            className={`px-4 h-9 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              tab === k ? "bg-white text-brand-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {KINDS[k].label}
          </button>
        ))}
      </div>

      <div id="org-tabpanel" role="tabpanel" aria-labelledby={`org-tab-${tab}`}>
        <Card>
          {loading && !data[tab] ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={`No ${config.label.toLowerCase()} yet`}
              action={
                <Button size="sm" onClick={() => setEditing({})}>
                  Add {config.singular}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                    {config.columns.map((c, idx) => (
                      <th key={c.label} className={`${idx === 0 ? "px-5" : "px-3"} py-2`}>
                        {c.label}
                      </th>
                    ))}
                    <th className="px-3 py-2">Status</th>
                    <th className="px-5 py-2 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={`border-b border-slate-50 last:border-0 ${item.archived ? "opacity-55" : ""}`}>
                      {config.columns.map((c, idx) => (
                        <td key={c.label} className={`${idx === 0 ? "px-5" : "px-3"} py-3 text-slate-600`}>
                          {c.render(item)}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        {item.archived ? (
                          <Badge>Archived</Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}>
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={toggling === item.id}
                            onClick={() => toggleArchive(item)}
                            aria-label={`${item.archived ? "Restore" : "Archive"} ${item.name}`}
                          >
                            {item.archived ? "Restore" : "Archive"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {editing && (
        <OrgItemModal
          kind={tab}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setData((d) => ({
              ...d,
              [tab]: isNew ? [...(d[tab] || []), saved] : (d[tab] || []).map((i) => (i.id === saved.id ? saved : i)),
            }));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function OrgItemModal({ kind, item, onClose, onSaved }) {
  const config = KINDS[kind];
  const isNew = !item.id;
  const [form, setForm] = useState(() =>
    Object.fromEntries(config.fields.map((f) => [f.key, item[f.key] === null || item[f.key] === undefined ? "" : String(item[f.key])]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (kind === "grades" && form.band_min !== "" && form.band_max !== "" && Number(form.band_min) > Number(form.band_max)) {
      setError("Band minimum must not exceed band maximum.");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form };
      if (kind === "grades" && body.currency) body.currency = body.currency.toUpperCase();
      const res = await hcmJson(`/api/hcm/org/${kind}`, {
        method: isNew ? "POST" : "PATCH",
        body: isNew ? body : { id: item.id, ...body },
      });
      onSaved(res.item, isNew);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${isNew ? "Add" : "Edit"} ${config.singular}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="org-item-form" loading={saving}>
            {isNew ? "Create" : "Save"}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <form id="org-item-form" onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        {config.fields.map((f, idx) => (
          <Field key={f.key} label={f.label} required={f.required}>
            <Input
              type={f.type || "text"}
              min={f.type === "number" ? 0 : undefined}
              step={f.type === "number" ? "any" : undefined}
              value={form[f.key]}
              placeholder={f.placeholder}
              maxLength={f.maxLength}
              required={f.required}
              autoFocus={idx === 0}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </Field>
        ))}
      </form>
    </Modal>
  );
}
