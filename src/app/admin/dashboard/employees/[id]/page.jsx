"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, Pencil } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { Card, Button, Field, Input, Textarea, Select, Spinner, ErrorBanner, Modal, Badge, formatDate } from "@/components/hcm/ui";
import { StatusChip, useOrgLists, JOIN_STAGES } from "@/components/hcm/onboarding";

const TABS = ["Job", "Personal", "Documents", "Timeline"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelancer", "Internship"];

const FIELD_LABELS = {
  designation: "Designation",
  department_id: "Department",
  location_id: "Location",
  grade_id: "Grade",
  manager_id: "Manager",
  employment_type: "Employment type",
  stage: "Stage",
  stage_end_date: "Stage end date",
  phone: "Phone",
  personal_email: "Personal email",
};

export default function EmployeePage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">{!user ? <Spinner /> : <Profile />}</div>;
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-800">{children || "—"}</dd>
    </div>
  );
}

function Profile() {
  const { id } = useParams();
  const { can } = useInternalUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Job");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/employees/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const { employee: e, events, documents, directReports, canEdit } = data;

  const viewDoc = async (doc) => {
    setError("");
    try {
      const { url } = await hcmJson(`/api/hcm/onboarding/${doc.joiner_id}/documents/${doc.id}`);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {can("employee.view") && (
        <Link href="/admin/dashboard/employees" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Employees
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-teal-50 text-brand-teal-700 flex items-center justify-center text-lg font-extrabold" aria-hidden="true">
            {e.full_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{e.full_name}</h1>
              <Badge className="font-mono">{e.employee_code}</Badge>
              <StatusChip status={e.stage} />
              {e.status !== "Active" && <StatusChip status={e.status} />}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {e.designation || "—"}
              {e.departments?.name ? ` · ${e.departments.name}` : ""} · {e.official_email}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" aria-hidden="true" /> Edit job details
          </Button>
        )}
      </div>
      <ErrorBanner message={error} onClose={() => setError("")} />

      <div role="tablist" aria-label="Employee sections" className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
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
          </button>
        ))}
      </div>

      {tab === "Job" && (
        <div className="grid md:grid-cols-3 gap-5">
          <Card title="Job" className="md:col-span-2">
            <dl>
              <Row label="Designation">{e.designation}</Row>
              <Row label="Department">{e.departments?.name}</Row>
              <Row label="Location">{e.locations?.name}</Row>
              <Row label="Grade">{e.grades ? `${e.grades.code} · ${e.grades.name}` : null}</Row>
              <Row label="Reporting manager">
                {e.manager ? (
                  <Link href={`/admin/dashboard/employees/${e.manager.id}`} className="text-brand-teal-700 hover:underline">
                    {e.manager.full_name}
                  </Link>
                ) : null}
              </Row>
              <Row label="Employment type">{e.employment_type}</Row>
              <Row label="Stage">
                {e.stage}
                {e.stage_end_date ? ` until ${formatDate(e.stage_end_date)}` : ""}
              </Row>
              <Row label="Joining date">{formatDate(e.joining_date)}</Row>
            </dl>
          </Card>
          <Card title={`Direct reports (${directReports.length})`}>
            {directReports.length === 0 ? (
              <p className="text-sm text-slate-500">None.</p>
            ) : (
              <ul className="space-y-2">
                {directReports.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/dashboard/employees/${r.id}`} className="text-sm font-semibold text-slate-800 hover:text-brand-teal-700">
                      {r.full_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {r.designation || "—"} · {r.stage}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "Personal" && (
        <Card title="Contact">
          <dl>
            <Row label="Official email">{e.official_email}</Row>
            <Row label="Personal email">{e.personal_email}</Row>
            <Row label="Phone">{e.phone}</Row>
          </dl>
        </Card>
      )}

      {tab === "Documents" && (
        <Card title="Joining documents">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents on file.</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {documents.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.file_name || "Not uploaded"}</p>
                  </div>
                  <StatusChip status={d.status} />
                  {d.file_name && (can("employee.manage") || can("onboarding.manage")) && (
                    <Button size="sm" variant="secondary" onClick={() => viewDoc(d)}>
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" /> View
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Timeline" && (
        <Card>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No lifecycle events yet.</p>
          ) : (
            <ol className="space-y-4">
              {events.map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-teal-400 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {ev.type === "join" ? "Joined" : ev.type === "update" ? "Job details changed" : ev.type}
                      <span className="font-normal text-slate-500"> · effective {formatDate(ev.effective_date)}</span>
                    </p>
                    {ev.type === "update" && ev.after && (
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        {Object.keys(ev.after).map((k) => (
                          <li key={k}>
                            {FIELD_LABELS[k] || k}: <span className="text-slate-400">{String(ev.before?.[k] ?? "—")}</span> → {String(ev.after[k] ?? "—")}
                          </li>
                        ))}
                      </ul>
                    )}
                    {ev.note && <p className="text-xs text-slate-500 mt-1">{ev.note}</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ev.actor_name || "System"} · {formatDate(ev.created_at, true)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {editing && (
        <EditJobDialog
          employee={e}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await load();
          }}
        />
      )}
    </>
  );
}

function EditJobDialog({ employee, onClose, onSaved }) {
  const org = useOrgLists();
  const [form, setForm] = useState({
    designation: employee.designation || "",
    department_id: employee.department_id || "",
    location_id: employee.location_id || "",
    grade_id: employee.grade_id || "",
    manager_id: employee.manager_id || "",
    employment_type: employee.employment_type,
    stage: employee.stage,
    stage_end_date: employee.stage_end_date || "",
    phone: employee.phone || "",
    personal_email: employee.personal_email || "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await hcmJson(`/api/hcm/employees/${employee.id}`, { method: "PATCH", body: form });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit job details"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Designation">
          <Input value={form.designation} onChange={set("designation")} />
        </Field>
        <Field label="Employment type">
          <Select options={EMPLOYMENT_TYPES} value={form.employment_type} onChange={set("employment_type")} />
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
          <Select placeholder="—" options={org.users.filter((u) => u.id !== employee.id).map((u) => ({ value: u.id, label: u.full_name }))} value={form.manager_id} onChange={set("manager_id")} />
        </Field>
        <Field label="Stage">
          <Select options={JOIN_STAGES} value={form.stage} onChange={set("stage")} />
        </Field>
        {form.stage !== "Full-time" && (
          <Field label="Stage end date">
            <Input type="date" value={form.stage_end_date} onChange={set("stage_end_date")} />
          </Field>
        )}
        <Field label="Phone">
          <Input value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Personal email">
          <Input type="email" value={form.personal_email} onChange={set("personal_email")} />
        </Field>
        <Field label="Note for the timeline" className="sm:col-span-2">
          <Textarea rows={2} value={form.note} onChange={set("note")} placeholder="Why this changed (optional)" />
        </Field>
      </div>
    </Modal>
  );
}
