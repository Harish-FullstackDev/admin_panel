"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Archive, ArchiveRestore, ListChecks, Lock, Pencil, Plus, Trash2, FileText } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Input, Select, Spinner, EmptyState, ErrorBanner, Modal, Badge } from "@/components/hcm/ui";
import { useOrgLists, TASK_TEAMS } from "@/components/hcm/onboarding";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelancer", "Internship"];

export default function TemplatesPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("onboarding.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Onboarding is managed by HR." />
      ) : (
        <Manager />
      )}
    </div>
  );
}

function offsetLabel(days) {
  const n = Number(days) || 0;
  if (n === 0) return "Day 1";
  return n < 0 ? `${-n}d before` : `${n}d after`;
}

function Manager() {
  const [templates, setTemplates] = useState(null);
  const [docTypes, setDocTypes] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const org = useOrgLists();
  const userNames = Object.fromEntries(org.users.map((u) => [u.id, u.full_name]));

  const load = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([hcmJson("/api/hcm/checklist-templates"), hcmJson("/api/hcm/document-types")]);
      setTemplates(t.templates);
      setDocTypes(d.documentTypes);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const archive = async (url, key, row) => {
    setError("");
    try {
      await hcmJson(url, { method: "PATCH", body: { [key]: row[key], archived: !row.archived } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Onboarding checklists"
        description="Task templates applied to every new joiner, and the documents joiners are asked to upload."
        actions={
          <Button onClick={() => setEditing({ name: "", employment_type: "", is_default: false, items: [{ title: "", team: "HR", due_offset_days: 0 }] })}>
            <Plus className="w-4 h-4" aria-hidden="true" /> New template
          </Button>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      {!templates ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {templates.length === 0 ? (
            <EmptyState icon={ListChecks} title="No checklist templates" />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((t) => (
                <Card
                  key={t.id}
                  className={t.archived ? "opacity-60" : ""}
                  title={
                    <span className="flex items-center gap-2 flex-wrap">
                      {t.name}
                      {t.is_default && <Badge className="bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200">Default</Badge>}
                      {t.employment_type && <Badge>{t.employment_type}</Badge>}
                      {t.archived && <Badge>Archived</Badge>}
                    </span>
                  }
                  actions={
                    <div className="flex gap-1">
                      {!t.archived && (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(t)} aria-label={`Edit ${t.name}`}>
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => archive("/api/hcm/checklist-templates", "id", t)} aria-label={t.archived ? "Restore" : "Archive"}>
                        {t.archived ? <ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" /> : <Archive className="w-3.5 h-3.5" aria-hidden="true" />}
                      </Button>
                    </div>
                  }
                >
                  <ol className="space-y-1.5">
                    {(t.items || []).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-14 shrink-0 text-[11px] font-bold text-slate-400 uppercase">{item.team}</span>
                        <span className="flex-1 text-slate-700">{item.title}</span>
                        {item.assignee_id && <span className="text-[11px] text-slate-400">{userNames[item.assignee_id] || "assigned"}</span>}
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">{offsetLabel(item.due_offset_days)}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>
          )}

          <Card
            title="Joining documents"
            actions={
              <Button size="sm" variant="secondary" onClick={() => setEditingDoc({ name: "", description: "", required: true, applies_to: "all", sort: 100 })}>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add document
              </Button>
            }
          >
            <p className="text-xs text-slate-500 mb-3">Requested automatically from every new joiner. Changes apply to joiners created after the change.</p>
            <ul className="divide-y divide-slate-100 -my-2">
              {(docTypes || []).map((d) => (
                <li key={d.code} className={`flex flex-wrap items-center gap-3 py-2.5 ${d.archived ? "opacity-50" : ""}`}>
                  <FileText className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                    {d.description && <p className="text-xs text-slate-500">{d.description}</p>}
                  </div>
                  <Badge>{d.required ? "Required" : "Optional"}</Badge>
                  {d.applies_to !== "all" && <Badge>{d.applies_to} only</Badge>}
                  {d.archived && <Badge>Archived</Badge>}
                  {!d.archived && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingDoc(d)} aria-label={`Edit ${d.name}`}>
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => archive("/api/hcm/document-types", "code", d)} aria-label={d.archived ? "Restore" : "Archive"}>
                    {d.archived ? <ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" /> : <Archive className="w-3.5 h-3.5" aria-hidden="true" />}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {editing && (
        <TemplateEditor
          template={editing}
          users={org.users}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
      {editingDoc && (
        <DocTypeEditor
          docType={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSaved={async () => {
            setEditingDoc(null);
            await load();
          }}
        />
      )}
    </>
  );
}

function TemplateEditor({ template, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: template.name,
    employment_type: template.employment_type || "",
    is_default: template.is_default,
    items: (template.items || []).map((i) => ({ ...i, assignee_id: i.assignee_id || "" })),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setItem = (index, key, value) =>
    setForm((f) => ({ ...f, items: f.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)) }));
  const move = (index, dir) =>
    setForm((f) => {
      const items = [...f.items];
      const target = index + dir;
      if (target < 0 || target >= items.length) return f;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...f, items };
    });

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        employment_type: form.employment_type || null,
        items: form.items.map((i) => ({ ...i, assignee_id: i.assignee_id || undefined, due_offset_days: Number(i.due_offset_days) || 0 })),
      };
      if (template.id) await hcmJson("/api/hcm/checklist-templates", { method: "PATCH", body: { id: template.id, ...body } });
      else await hcmJson("/api/hcm/checklist-templates", { method: "POST", body });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={template.id ? "Edit checklist template" : "New checklist template"}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.name.trim()}>
            Save template
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Use for employment type" hint="Joiners of this type get this template instead of the default.">
          <Select placeholder="Any" options={EMPLOYMENT_TYPES} value={form.employment_type} onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))} />
        </Field>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} className="w-4 h-4 accent-brand-teal-600" />
          Default template (used when no type-specific template matches)
        </label>
      </div>

      <p className="text-xs font-semibold text-slate-600 mb-2">Tasks · due date is relative to the joining date (negative = before Day 1)</p>
      <div className="space-y-2">
        {form.items.map((item, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/60">
            <Input aria-label="Task title" className="flex-1 min-w-[200px] h-9" placeholder="Task" value={item.title} onChange={(e) => setItem(i, "title", e.target.value)} />
            <Select aria-label="Team" className="w-28 h-9" options={TASK_TEAMS} value={item.team} onChange={(e) => setItem(i, "team", e.target.value)} />
            <Input aria-label="Days from joining" type="number" className="w-20 h-9" value={item.due_offset_days} onChange={(e) => setItem(i, "due_offset_days", e.target.value)} />
            <Select
              aria-label="Default assignee"
              className="w-40 h-9"
              placeholder={item.team === "Manager" ? "Joiner's manager" : item.team === "Buddy" ? "Joiner's buddy" : "Unassigned"}
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              value={item.assignee_id}
              onChange={(e) => setItem(i, "assignee_id", e.target.value)}
            />
            <div className="flex">
              <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === form.items.length - 1} aria-label="Move down">
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} aria-label="Remove task">
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" variant="secondary" className="mt-3" onClick={() => setForm((f) => ({ ...f, items: [...f.items, { title: "", team: "HR", due_offset_days: 0, assignee_id: "" }] }))}>
        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add task
      </Button>
    </Modal>
  );
}

function DocTypeEditor({ docType, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: docType.name,
    description: docType.description || "",
    required: docType.required,
    applies_to: docType.applies_to,
    sort: docType.sort,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (docType.code) await hcmJson("/api/hcm/document-types", { method: "PATCH", body: { code: docType.code, ...form } });
      else await hcmJson("/api/hcm/document-types", { method: "POST", body: form });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return (
    <Modal
      title={docType.code ? "Edit document" : "Add document"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" required className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Help text for the joiner" className="sm:col-span-2">
          <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="Applies to">
          <Select
            options={[{ value: "all", label: "Everyone" }, { value: "Internship", label: "Interns only" }, { value: "Experienced", label: "Non-interns only" }]}
            value={form.applies_to}
            onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value }))}
          />
        </Field>
        <Field label="Order">
          <Input type="number" value={form.sort} onChange={(e) => setForm((f) => ({ ...f, sort: e.target.value }))} />
        </Field>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.required} onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))} className="w-4 h-4 accent-brand-teal-600" />
          Required before Day 1
        </label>
      </div>
    </Modal>
  );
}
