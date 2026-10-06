"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, CircleAlert, Eye, FilePlus2, Lock, Mail, Plus, Send, UserCheck, XCircle, ListPlus,
} from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { Card, Button, Field, Input, Textarea, Select, Spinner, EmptyState, ErrorBanner, Modal, Badge, formatDate } from "@/components/hcm/ui";
import {
  StatusChip, CopyField, ProgressBar, relativeDays, useOrgLists, TASK_TEAMS, JOIN_STAGES, BGV_STATUSES,
} from "@/components/hcm/onboarding";

const TABS = ["Details", "Documents", "Checklist", "Activity"];

export default function JoinerPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("onboarding.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Onboarding is managed by HR." />
      ) : (
        <JoinerDetail />
      )}
    </div>
  );
}

function JoinerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("Details");
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const org = useOrgLists();

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/onboarding/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (body, message) => {
    setBusy(true);
    setError("");
    try {
      setData(await hcmJson(`/api/hcm/onboarding/${id}`, { method: "POST", body }));
      if (message) setNotice(message);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const patch = async (body, message = "Saved.") => {
    setError("");
    try {
      setData(await hcmJson(`/api/hcm/onboarding/${id}`, { method: "PATCH", body }));
      setNotice(message);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;

  const { joiner, readiness } = data;
  const locked = ["Joined", "Cancelled"].includes(joiner.status);

  return (
    <>
      <Link href="/admin/dashboard/onboarding" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Pre-joining
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{joiner.full_name}</h1>
            <StatusChip status={joiner.status} />
            <StatusChip status={joiner.join_stage} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {joiner.position} · joins {formatDate(joiner.joining_date)}
            {!locked && ` (${relativeDays(joiner.joining_date)})`} · {joiner.personal_email}
          </p>
        </div>
        {!locked && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => act({ action: "send_joining_details" }, "Joining details queued to the joiner, manager and buddy.")} loading={busy}>
              <Mail className="w-4 h-4" aria-hidden="true" /> Send joining details
            </Button>
            <Button variant="ghost" onClick={() => setDialog({ type: "cancel" })}>
              <XCircle className="w-4 h-4" aria-hidden="true" /> Cancel
            </Button>
            <Button onClick={() => setDialog({ type: "convert" })} disabled={!readiness.ready} title={readiness.ready ? "" : readiness.blockers.join("; ")}>
              <UserCheck className="w-4 h-4" aria-hidden="true" /> Convert to employee
            </Button>
          </div>
        )}
        {joiner.status === "Joined" && joiner.employee_id && (
          <Link href={`/admin/dashboard/employees/${joiner.employee_id}`} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-semibold">
            <UserCheck className="w-4 h-4" aria-hidden="true" /> View employee
          </Link>
        )}
      </div>

      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 flex justify-between gap-2">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-xs font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
      {joiner.status === "Cancelled" && (
        <div className="mb-4 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
          Onboarding cancelled: {joiner.cancel_reason}
        </div>
      )}

      {!locked && <ReadinessPanel readiness={readiness} />}

      <div role="tablist" aria-label="Joiner sections" className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              tab === t ? "border-brand-teal-500 text-brand-teal-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
            {t === "Documents" && readiness.docsAwaiting > 0 && (
              <span className="ml-1.5 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px]">{readiness.docsAwaiting}</span>
            )}
            {t === "Checklist" && readiness.tasksOpen > 0 && <span className="ml-1.5 text-xs text-slate-400">{readiness.tasksOpen} open</span>}
          </button>
        ))}
      </div>

      {tab === "Details" && <DetailsTab joiner={joiner} org={org} locked={locked} onSave={patch} />}
      {tab === "Documents" && <DocumentsTab data={data} locked={locked} onChanged={load} onRequest={act} setError={setError} />}
      {tab === "Checklist" && <ChecklistTab data={data} org={org} locked={locked} onChanged={load} onAct={act} setError={setError} />}
      {tab === "Activity" && <ActivityTab activity={data.activity} />}

      {dialog?.type === "cancel" && (
        <CancelDialog
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            if (await act({ action: "cancel", reason }, "Onboarding cancelled.")) setDialog(null);
          }}
          busy={busy}
        />
      )}
      {dialog?.type === "convert" && <ConvertDialog joiner={joiner} org={org} onClose={() => setDialog(null)} onDone={load} />}
    </>
  );
}

function ReadinessPanel({ readiness }) {
  const items = [
    { label: "Required documents verified", ok: readiness.docsVerified === readiness.docsRequired, detail: `${readiness.docsVerified}/${readiness.docsRequired}` },
    { label: "Background check cleared", ok: readiness.bgv === "Cleared", detail: readiness.bgv },
  ];
  return (
    <div className={`mb-5 p-4 rounded-2xl border ${readiness.ready ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ready for Day 1?</p>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-1.5 text-sm">
            {i.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <CircleAlert className="w-4 h-4 text-amber-500" aria-hidden="true" />}
            <span className={i.ok ? "text-slate-700" : "text-slate-800 font-semibold"}>{i.label}</span>
            <span className="text-xs text-slate-500">({i.detail})</span>
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-sm text-slate-500">
          Onboarding tasks <ProgressBar value={readiness.tasksTotal - readiness.tasksOpen} total={readiness.tasksTotal} label="Tasks done" />
        </li>
      </ul>
    </div>
  );
}

function userOptions(users) {
  return users.map((u) => ({ value: u.id, label: u.designation ? `${u.full_name} (${u.designation})` : u.full_name }));
}

function DetailsTab({ joiner, org, locked, onSave }) {
  const initial = useMemo(
    () => ({
      joining_date: joiner.joining_date || "",
      reporting_time: joiner.reporting_time || "",
      reporting_location: joiner.reporting_location || "",
      department_id: joiner.department_id || "",
      location_id: joiner.location_id || "",
      grade_id: joiner.grade_id || "",
      manager_id: joiner.manager_id || "",
      buddy_id: joiner.buddy_id || "",
      join_stage: joiner.join_stage,
      day1_notes: joiner.day1_notes || "",
    }),
    [joiner]
  );
  const [form, setForm] = useState(initial);
  const [bgv, setBgv] = useState({ bgv_status: joiner.bgv_status, bgv_note: joiner.bgv_note || "" });
  const [saving, setSaving] = useState("");

  useEffect(() => setForm(initial), [initial]);
  useEffect(() => setBgv({ bgv_status: joiner.bgv_status, bgv_note: joiner.bgv_note || "" }), [joiner]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const bgvDirty = bgv.bgv_status !== joiner.bgv_status || bgv.bgv_note !== (joiner.bgv_note || "");

  const save = async (which, body, message) => {
    setSaving(which);
    await onSave(body, message);
    setSaving("");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card title="Joining details" className="lg:col-span-2">
        <fieldset disabled={locked} className="grid sm:grid-cols-2 gap-4">
          <Field label="Joining date" required>
            <Input type="date" value={form.joining_date} onChange={set("joining_date")} />
          </Field>
          <Field label="Joins as" required>
            <Select options={JOIN_STAGES} value={form.join_stage} onChange={set("join_stage")} />
          </Field>
          <Field label="Reporting time">
            <Input type="time" value={form.reporting_time} onChange={set("reporting_time")} />
          </Field>
          <Field label="Reporting location">
            <Input value={form.reporting_location} onChange={set("reporting_location")} placeholder="Office address" />
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
          <Field label="Reporting manager" hint="Gets the Manager checklist tasks.">
            <Select placeholder="—" options={userOptions(org.users)} value={form.manager_id} onChange={set("manager_id")} />
          </Field>
          <Field label="Buddy" hint="Gets the Buddy checklist tasks.">
            <Select placeholder="—" options={userOptions(org.users)} value={form.buddy_id} onChange={set("buddy_id")} />
          </Field>
          <Field label="Day-1 notes" hint="What to bring, first-day schedule. Shared with the joiner." className="sm:col-span-2">
            <Textarea rows={4} value={form.day1_notes} onChange={set("day1_notes")} />
          </Field>
        </fieldset>
        {!locked && (
          <div className="flex justify-end gap-2 mt-4">
            {dirty && (
              <Button variant="ghost" onClick={() => setForm(initial)}>
                Reset
              </Button>
            )}
            <Button onClick={() => save("details", form, "Joining details saved.")} disabled={!dirty} loading={saving === "details"}>
              Save details
            </Button>
          </div>
        )}
      </Card>

      <Card title="Background check">
        <fieldset disabled={locked} className="space-y-4">
          <Field label="Status">
            <Select options={BGV_STATUSES} value={bgv.bgv_status} onChange={(e) => setBgv((b) => ({ ...b, bgv_status: e.target.value }))} />
          </Field>
          <Field label="Note" hint={bgv.bgv_status === "Failed" ? "Required when the check fails." : "Agency, reference number, findings."}>
            <Textarea rows={4} value={bgv.bgv_note} onChange={(e) => setBgv((b) => ({ ...b, bgv_note: e.target.value }))} />
          </Field>
        </fieldset>
        {!locked && (
          <div className="flex justify-end mt-4">
            <Button onClick={() => save("bgv", bgv, "Background check updated.")} disabled={!bgvDirty} loading={saving === "bgv"}>
              Update BGV
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function DocumentsTab({ data, locked, onChanged, onRequest, setError }) {
  const { joiner, documents, documentTypes } = data;
  const [rejecting, setRejecting] = useState(null);
  const [busy, setBusy] = useState(null);
  const [requestCode, setRequestCode] = useState("");
  const missing = documentTypes.filter((t) => !documents.some((d) => d.type_code === t.code));

  const view = async (doc) => {
    setError("");
    try {
      const { url } = await hcmJson(`/api/hcm/onboarding/${joiner.id}/documents/${doc.id}`);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err.message);
    }
  };

  const decide = async (doc, status, reason) => {
    setBusy(doc.id);
    setError("");
    try {
      await hcmJson(`/api/hcm/onboarding/${joiner.id}/documents/${doc.id}`, { method: "PATCH", body: { status, reason } });
      await onChanged();
      setRejecting(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      title="Joining documents"
      actions={
        !locked &&
        missing.length > 0 && (
          <div className="flex gap-2">
            <Select
              aria-label="Document to request"
              className="h-8 text-xs w-auto"
              placeholder="Request another document…"
              options={missing.map((t) => ({ value: t.code, label: t.name }))}
              value={requestCode}
              onChange={(e) => setRequestCode(e.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!requestCode}
              onClick={async () => {
                if (await onRequest({ action: "request_document", type_code: requestCode }, "Document requested from the joiner.")) setRequestCode("");
              }}
            >
              <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" /> Request
            </Button>
          </div>
        )
      }
    >
      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents requested.</p>
      ) : (
        <ul className="divide-y divide-slate-100 -my-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold text-slate-800">
                  {doc.name} {!doc.required && <span className="text-xs font-normal text-slate-400">(optional)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {doc.file_name ? `${doc.file_name} · uploaded ${formatDate(doc.uploaded_at, true)}` : doc.document_types?.description || "Not uploaded yet"}
                </p>
                {doc.status === "Rejected" && doc.rejection_reason && <p className="text-xs text-red-600 mt-0.5">Rejected: {doc.rejection_reason}</p>}
              </div>
              <StatusChip status={doc.status} />
              <div className="flex gap-1.5">
                {doc.file_name && (
                  <Button size="sm" variant="secondary" onClick={() => view(doc)}>
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" /> View
                  </Button>
                )}
                {!locked && doc.file_name && doc.status !== "Verified" && (
                  <Button size="sm" onClick={() => decide(doc, "Verified")} loading={busy === doc.id}>
                    Verify
                  </Button>
                )}
                {!locked && doc.file_name && doc.status !== "Rejected" && (
                  <Button size="sm" variant="ghost" onClick={() => setRejecting(doc)} disabled={busy === doc.id}>
                    Reject
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {rejecting && <RejectDialog doc={rejecting} busy={busy === rejecting.id} onClose={() => setRejecting(null)} onConfirm={(reason) => decide(rejecting, "Rejected", reason)} />}
    </Card>
  );
}

function RejectDialog({ doc, busy, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      title={`Reject ${doc.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button variant="danger" onClick={() => onConfirm(reason)} disabled={!reason.trim()} loading={busy}>
            Reject document
          </Button>
        </>
      }
    >
      <Field label="Reason (sent to the joiner)" required>
        <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The scan is blurry; please upload a clearer copy." />
      </Field>
    </Modal>
  );
}

function ChecklistTab({ data, org, locked, onChanged, onAct, setError }) {
  const { joiner, tasks, templates } = data;
  const [templateId, setTemplateId] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(null);

  const update = async (task, body) => {
    setBusy(task.id);
    setError("");
    try {
      await hcmJson(`/api/hcm/tasks/${task.id}`, { method: "PATCH", body });
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const groups = TASK_TEAMS.map((team) => ({ team, items: tasks.filter((t) => t.team === team) })).filter((g) => g.items.length);

  return (
    <Card
      title="Onboarding checklist"
      actions={
        !locked && (
          <div className="flex flex-wrap gap-2">
            {templates.length > 0 && (
              <>
                <Select
                  aria-label="Checklist template"
                  className="h-8 text-xs w-auto"
                  placeholder="Add tasks from template…"
                  options={templates.map((t) => ({ value: t.id, label: t.name }))}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!templateId}
                  onClick={async () => {
                    if (await onAct({ action: "apply_template", template_id: templateId }, "Template tasks added.")) setTemplateId("");
                  }}
                >
                  <ListPlus className="w-3.5 h-3.5" aria-hidden="true" /> Apply
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add task
            </Button>
          </div>
        )
      }
    >
      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">No onboarding tasks yet.</p>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.team}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{g.team}</p>
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {g.items.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Mark "${task.title}" done`}
                      checked={task.status === "Done"}
                      disabled={locked || busy === task.id || task.status === "Skipped"}
                      onChange={(e) => update(task, { status: e.target.checked ? "Done" : "Open" })}
                      className="w-4 h-4 accent-brand-teal-600 cursor-pointer"
                    />
                    <div className="flex-1 min-w-[180px]">
                      <p className={`text-sm ${task.status === "Open" ? "text-slate-800 font-medium" : "text-slate-400 line-through"}`}>{task.title}</p>
                      {task.completed_at && <p className="text-[11px] text-slate-400">{task.status} {formatDate(task.completed_at)}</p>}
                    </div>
                    <Select
                      aria-label="Assignee"
                      className="h-8 text-xs w-44"
                      placeholder="Unassigned"
                      disabled={locked || task.status !== "Open" || busy === task.id}
                      options={userOptions(org.users)}
                      value={task.assignee_id || ""}
                      onChange={(e) => update(task, { assignee_id: e.target.value || null })}
                    />
                    <Input
                      type="date"
                      aria-label="Due date"
                      className="h-8 text-xs w-36"
                      disabled={locked || task.status !== "Open" || busy === task.id}
                      value={task.due_date || ""}
                      onChange={(e) => update(task, { due_date: e.target.value || null })}
                    />
                    {!locked && task.status === "Open" && (
                      <Button size="sm" variant="ghost" onClick={() => update(task, { status: "Skipped" })} disabled={busy === task.id}>
                        Skip
                      </Button>
                    )}
                    {!locked && task.status === "Skipped" && (
                      <Button size="sm" variant="ghost" onClick={() => update(task, { status: "Open" })} disabled={busy === task.id}>
                        Reopen
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <AddTaskDialog
          users={org.users}
          defaultDue={joiner.joining_date}
          onClose={() => setAdding(false)}
          onSave={async (task) => {
            if (await onAct({ action: "add_task", ...task }, "Task added.")) setAdding(false);
          }}
        />
      )}
    </Card>
  );
}

function AddTaskDialog({ users, defaultDue, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", team: "HR", assignee_id: "", due_date: defaultDue || "", description: "" });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <Modal
      title="Add onboarding task"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.title.trim()}
            loading={saving}
            onClick={async () => {
              setSaving(true);
              await onSave({ ...form, assignee_id: form.assignee_id || null });
              setSaving(false);
            }}
          >
            Add task
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Task" required className="sm:col-span-2">
          <Input autoFocus value={form.title} onChange={set("title")} placeholder="e.g. Issue access card" />
        </Field>
        <Field label="Team">
          <Select options={TASK_TEAMS} value={form.team} onChange={set("team")} />
        </Field>
        <Field label="Due date">
          <Input type="date" value={form.due_date} onChange={set("due_date")} />
        </Field>
        <Field label="Assignee" className="sm:col-span-2">
          <Select placeholder="Unassigned" options={userOptions(users)} value={form.assignee_id} onChange={set("assignee_id")} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={form.description} onChange={set("description")} />
        </Field>
      </div>
    </Modal>
  );
}

const ACTION_LABELS = {
  "onboarding.start": "Onboarding started",
  "onboarding.update": "Details updated",
  "onboarding.bgv": "Background check updated",
  "onboarding.cancel": "Onboarding cancelled",
  "onboarding.send_joining_details": "Joining details sent",
  "onboarding.apply_template": "Checklist template applied",
  "onboarding.add_task": "Task added",
  "onboarding.request_document": "Document requested",
  "onboarding.document_upload": "Document uploaded",
  "onboarding.document_verify": "Document verified",
  "onboarding.document_reject": "Document rejected",
  "onboarding.convert": "Converted to employee",
  "task.status": "Task status changed",
  "task.update": "Task updated",
};

function summarise(entry) {
  const a = entry.after || {};
  if (a.document) return `${a.document.replace(/_/g, " ")}${a.reason ? ` — ${a.reason}` : ""}`;
  if (a.title) return `${a.title}${a.status ? ` → ${a.status}` : ""}`;
  if (entry.action === "onboarding.bgv") return `${a.bgv_status || ""}${a.bgv_note ? ` — ${a.bgv_note}` : ""}`;
  if (entry.action === "onboarding.cancel") return a.reason;
  if (entry.action === "onboarding.convert") return `${a.employee_code} · ${a.official_email}`;
  if (entry.action === "onboarding.update") return Object.keys(a).map((k) => k.replace(/_id$|_/g, " ").trim()).join(", ");
  return "";
}

function ActivityTab({ activity }) {
  if (!activity.length) return <Card><p className="text-sm text-slate-500">No activity yet.</p></Card>;
  return (
    <Card>
      <ol className="space-y-3">
        {activity.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-teal-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm text-slate-800">
                <span className="font-semibold">{ACTION_LABELS[e.action] || e.action}</span>
                {summarise(e) && <span className="text-slate-500"> · {summarise(e)}</span>}
              </p>
              <p className="text-[11px] text-slate-400">
                {e.actor_email || "System"} · {formatDate(e.created_at, true)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function CancelDialog({ onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      title="Cancel onboarding"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button variant="danger" disabled={!reason.trim()} loading={busy} onClick={() => onConfirm(reason)}>
            Cancel onboarding
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 mb-3">Open tasks will be skipped and the joiner can no longer upload documents. This can&apos;t be undone.</p>
      <Field label="Reason" required>
        <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Candidate did not join" />
      </Field>
    </Modal>
  );
}

function addMonths(date, months) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function ConvertDialog({ joiner, org, onClose, onDone }) {
  const [form, setForm] = useState({
    official_email: "",
    designation: joiner.position || "",
    joining_date: joiner.joining_date,
    stage: joiner.join_stage,
    stage_end_date: joiner.join_stage === "Probation" ? addMonths(joiner.joining_date, 6) : joiner.join_stage === "Intern" ? addMonths(joiner.joining_date, 6) : "",
    department_id: joiner.department_id || "",
    location_id: joiner.location_id || "",
    grade_id: joiner.grade_id || "",
    manager_id: joiner.manager_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { ...form };
      for (const k of ["department_id", "location_id", "grade_id", "manager_id", "stage_end_date"]) if (!body[k]) body[k] = null;
      setResult(await hcmJson(`/api/hcm/onboarding/${joiner.id}/convert`, { method: "POST", body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Modal
        title="Employee created"
        onClose={() => {
          onClose();
          onDone();
        }}
        footer={
          <Link href={`/admin/dashboard/employees/${result.employee.id}`} className="inline-flex items-center h-10 px-4 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-semibold">
            Open employee profile
          </Link>
        }
      >
        <p className="text-sm text-slate-700 mb-1">
          <span className="font-semibold">{joiner.full_name}</span> is now employee <Badge>{result.employee.employee_code}</Badge>
        </p>
        <p className="text-sm text-slate-600 mb-3">
          Email delivery isn&apos;t connected yet — share this one-time link (valid 48 hours) so they can set a password for{" "}
          <span className="font-semibold">{result.employee.official_email}</span>.
        </p>
        <CopyField value={result.inviteLink || ""} label="Invite link" />
      </Modal>
    );
  }

  return (
    <Modal
      title={`Convert ${joiner.full_name} to employee`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!form.official_email.trim()}>
            <Send className="w-4 h-4" aria-hidden="true" /> Create employee
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <p className="text-sm text-slate-600 mb-4">
        Creates the employee record and an official login. The joiner signs in at the HCM portal with the official email.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Official email" required className="sm:col-span-2">
          <Input type="email" autoFocus value={form.official_email} onChange={set("official_email")} placeholder="firstname.lastname@company.com" />
        </Field>
        <Field label="Designation" required>
          <Input value={form.designation} onChange={set("designation")} />
        </Field>
        <Field label="Joining date" required>
          <Input type="date" value={form.joining_date} onChange={set("joining_date")} />
        </Field>
        <Field label="Stage" required>
          <Select options={JOIN_STAGES} value={form.stage} onChange={set("stage")} />
        </Field>
        {form.stage !== "Full-time" && (
          <Field label={form.stage === "Intern" ? "Internship end date" : "Probation end date"} required={form.stage === "Intern"}>
            <Input type="date" value={form.stage_end_date} onChange={set("stage_end_date")} />
          </Field>
        )}
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
          <Select placeholder="—" options={userOptions(org.users)} value={form.manager_id} onChange={set("manager_id")} />
        </Field>
      </div>
    </Modal>
  );
}
