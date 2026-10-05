"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Briefcase,
  Copy,
  KanbanSquare,
  Lock,
  Pause,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { ActionMenu } from "@/components/hcm/CandidateDrawer";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Badge,
  Spinner,
  EmptyState,
  ErrorBanner,
  Modal,
  formatDate,
  formatMoney,
} from "@/components/hcm/ui";

const AREA_OF_INTEREST = [
  "SAP Consulting & Delivery",
  "Sales & Business Development",
  "Marketing",
  "Engineering & Technology",
  "Design",
  "Human Resources",
  "Finance & Operations",
];
const MODES_OF_WORK = ["On-site", "Hybrid", "Remote"];
const TYPES_OF_WORK = ["Full-time", "Part-time", "Contract", "Freelancer", "Internship"];
const STATUSES = ["Draft", "Open", "Paused", "Closed"];
const VISIBILITY = [
  { value: "external", label: "External (careers site)" },
  { value: "internal", label: "Internal only" },
  { value: "both", label: "Internal and external" },
];
const VISIBILITY_LABELS = { external: "External", internal: "Internal", both: "Both" };
const ROUND_TYPES = [
  { value: "hr", label: "HR" },
  { value: "technical", label: "Technical" },
  { value: "managerial", label: "Managerial" },
  { value: "culture", label: "Culture fit" },
  { value: "other", label: "Other" },
];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

const STATUS_STYLES = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Paused: "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-red-50 text-red-600 border-red-200",
};

const DEFAULT_ROUNDS = [
  { name: "HR screening", type: "hr" },
  { name: "Technical interview", type: "technical" },
  { name: "Hiring manager", type: "managerial" },
];

function StatusBadge({ status }) {
  return <Badge className={STATUS_STYLES[status] || undefined}>{status}</Badge>;
}

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

function formFromJob(job) {
  return {
    title: job?.title || "",
    company: job?.company || "",
    location: job?.location || "",
    location_id: job?.location_id || "",
    department_id: job?.department_id || "",
    hiring_manager_id: job?.hiring_manager_id || "",
    mode_of_work: job?.mode_of_work || "On-site",
    type_of_work: job?.type_of_work || "Full-time",
    experience_level: job?.experience_level || "",
    categories: job?.categories || [],
    skills: (job?.skills || []).join(", "),
    about_job: job?.about_job || "",
    responsibilities: job?.responsibilities?.length ? job.responsibilities : [""],
    qualifications: job?.qualifications?.length ? job.qualifications : [""],
    openings: job?.openings || 1,
    visibility: job?.visibility || "external",
    closing_date: toDateInput(job?.closing_date),
    salary_min: job?.salary_min ?? "",
    salary_max: job?.salary_max ?? "",
    currency: job?.currency || "INR",
    show_salary: Boolean(job?.show_salary),
    status: job?.status || "Draft",
    interview_rounds: job ? job.interview_rounds || [] : DEFAULT_ROUNDS,
    requisition_id: job?.requisition_id || null,
  };
}

export default function CareersPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("job.view") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask an administrator for the job.view permission." />
      ) : (
        <Suspense fallback={<Spinner />}>
          <JobsManager />
        </Suspense>
      )}
    </div>
  );
}

function JobsManager() {
  const { can, scopeOf } = useInternalUser();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canManage = can("job.manage");
  const ownOnly = scopeOf("job.view") === "own";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState("");
  const [lookups, setLookups] = useState({ departments: [], locations: [], managers: [] });
  const handledEdit = useRef(null);

  const loadJobs = useCallback(async () => {
    const data = await hcmJson(`/api/hcm/jobs${showArchived ? "?archived=1" : ""}`);
    setJobs(data.jobs || []);
  }, [showArchived]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadJobs()
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loadJobs]);

  useEffect(() => {
    if (!canManage) return;
    Promise.all([
      hcmJson("/api/hcm/org/departments").catch(() => ({ items: [] })),
      hcmJson("/api/hcm/org/locations").catch(() => ({ items: [] })),
      hcmJson("/api/hcm/users?lite=1").catch(() => ({ users: [] })),
    ]).then(([d, l, u]) => setLookups({ departments: d.items || [], locations: l.items || [], managers: u.users || [] }));
  }, [canManage]);

  const editParam = params.get("edit");
  useEffect(() => {
    if (!editParam || !canManage || loading || handledEdit.current === editParam) return;
    handledEdit.current = editParam;
    const found = jobs.find((j) => j.id === editParam);
    if (found) {
      setEditing({ job: found });
      return;
    }
    hcmJson(`/api/hcm/jobs?id=${encodeURIComponent(editParam)}&archived=1`)
      .then((d) => (d.jobs?.[0] ? setEditing({ job: d.jobs[0] }) : setError("Job not found.")))
      .catch((e) => setError(e.message));
  }, [editParam, canManage, loading, jobs]);

  const refresh = () => loadJobs().catch((e) => setError(e.message));

  const closeEditor = () => {
    setEditing(null);
    if (editParam) router.replace(pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (statusFilter && j.status !== statusFilter) return false;
      if (!q) return true;
      return [j.title, j.departments?.name, j.locations?.name, j.location, j.hiring_manager?.full_name].some(
        (v) => v && v.toLowerCase().includes(q)
      );
    });
  }, [jobs, search, statusFilter]);

  const quickStatus = async (job, status) => {
    setBusy(job.id);
    setError("");
    setNotice("");
    try {
      await hcmJson("/api/hcm/jobs", { method: "PUT", body: { id: job.id, status } });
      setNotice(`"${job.title}" is now ${status}.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const duplicate = async (job) => {
    setBusy(job.id);
    setError("");
    setNotice("");
    try {
      const data = await hcmJson("/api/hcm/jobs", { method: "POST", body: { duplicate_of: job.id } });
      await refresh();
      setNotice(`Created a draft copy of "${job.title}".`);
      setEditing({ job: data.job });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    const job = confirmDelete;
    setBusy(job.id);
    setError("");
    try {
      const data = await hcmJson(`/api/hcm/jobs?id=${encodeURIComponent(job.id)}`, { method: "DELETE" });
      setNotice(data.message || "Done.");
      setConfirmDelete(null);
      await refresh();
    } catch (e) {
      setError(e.message);
      setConfirmDelete(null);
    } finally {
      setBusy("");
    }
  };

  if (editing) {
    return (
      <JobEditor
        job={editing.job}
        lookups={lookups}
        onCancel={closeEditor}
        onSaved={(job, message) => {
          closeEditor();
          setNotice(message);
          refresh();
        }}
      />
    );
  }

  const statusItems = (job) => {
    if (job.archived) return [];
    const items = [];
    if (job.status === "Draft") items.push({ label: "Publish", icon: Send, onSelect: () => quickStatus(job, "Open") });
    if (job.status === "Paused") items.push({ label: "Resume", icon: Send, onSelect: () => quickStatus(job, "Open") });
    if (job.status === "Closed") items.push({ label: "Reopen", icon: Send, onSelect: () => quickStatus(job, "Open") });
    if (job.status === "Open") items.push({ label: "Pause", icon: Pause, onSelect: () => quickStatus(job, "Paused") });
    if (job.status === "Open" || job.status === "Paused") items.push({ label: "Close", icon: XCircle, onSelect: () => quickStatus(job, "Closed") });
    return items;
  };

  return (
    <>
      <PageHeader
        title={ownOnly ? "My Openings" : "Job openings"}
        description={ownOnly ? "Jobs where you are the hiring manager." : "Create, publish and track job postings and their pipelines."}
        actions={
          canManage && (
            <Button onClick={() => setEditing({ job: null })}>
              <Plus className="w-4 h-4" aria-hidden="true" /> New job
            </Button>
          )
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 flex items-start gap-2">
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search jobs"
              placeholder="Search title, department, location or manager"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            aria-label="Filter by status"
            className="w-auto min-w-[150px]"
            placeholder="All statuses"
            options={STATUSES}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              className="size-4 accent-brand-teal-500"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={jobs.length ? "No jobs match your filters" : ownOnly ? "No openings assigned to you" : "No job postings yet"}
            action={
              canManage &&
              !jobs.length && (
                <Button onClick={() => setEditing({ job: null })}>
                  <Plus className="w-4 h-4" aria-hidden="true" /> New job
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2">Job</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2 text-right">Openings</th>
                  <th className="px-3 py-2 text-right">Applicants</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Visibility</th>
                  <th className="px-3 py-2">Posted</th>
                  <th className="px-3 py-2">Closes</th>
                  <th className="px-3 py-2">Hiring manager</th>
                  <th className="px-5 py-2 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/dashboard/careers/${job.id}`} className="font-semibold text-slate-800 hover:text-brand-teal-700 hover:underline">
                        {job.title}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {job.departments?.name || "No department"} · {job.type_of_work}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {job.locations?.name || job.location}
                      <div className="text-xs text-slate-400">{job.mode_of_work}</div>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">{job.openings}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{job.active_count}</span>
                      <span className="text-slate-400"> / {job.applicant_count}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <StatusBadge status={job.status} />
                        {job.archived && <Badge>Archived</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{VISIBILITY_LABELS[job.visibility] || job.visibility}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{formatDate(job.posted_at)}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{formatDate(job.closing_date)}</td>
                    <td className="px-3 py-3 text-slate-600">{job.hiring_manager?.full_name || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/dashboard/careers/${job.id}`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                          aria-label={`View pipeline for ${job.title}`}
                        >
                          <KanbanSquare className="w-3.5 h-3.5" aria-hidden="true" /> Pipeline
                        </Link>
                        {canManage && (
                          <ActionMenu
                            ariaLabel={`More actions for ${job.title}`}
                            disabled={busy === job.id}
                            items={[
                              !job.archived && { label: "Edit", icon: Pencil, onSelect: () => setEditing({ job }) },
                              ...statusItems(job),
                              { label: "Duplicate", icon: Copy, onSelect: () => duplicate(job) },
                              !job.archived && {
                                label: job.status === "Draft" && !job.applicant_count ? "Delete" : "Archive",
                                icon: Trash2,
                                danger: true,
                                onSelect: () => setConfirmDelete(job),
                              },
                            ]}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {confirmDelete && (
        <Modal
          title={confirmDelete.status === "Draft" && !confirmDelete.applicant_count ? "Delete job" : "Archive job"}
          onClose={() => busy !== confirmDelete.id && setConfirmDelete(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} disabled={busy === confirmDelete.id}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} loading={busy === confirmDelete.id}>
                {confirmDelete.status === "Draft" && !confirmDelete.applicant_count ? "Delete" : "Archive"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {confirmDelete.status === "Draft" && !confirmDelete.applicant_count
              ? "This draft has no applicants and will be permanently deleted."
              : "Jobs that are published or have applicants are closed and archived instead of deleted. Applications are kept."}{" "}
            Continue for <strong>{confirmDelete.title}</strong>?
          </p>
        </Modal>
      )}
    </>
  );
}

function ListEditor({ label, items, onChange, placeholder }) {
  const update = (i, value) => onChange(items.map((v, idx) => (idx === i ? value : v)));
  const remove = (i) => onChange(items.length === 1 ? [""] : items.filter((_, idx) => idx !== i));
  return (
    <fieldset>
      <legend className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</legend>
      <div className="space-y-2">
        {items.map((value, i) => (
          <div key={i} className="flex gap-2">
            <Input value={value} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} aria-label={`${label} ${i + 1}`} />
            <Button type="button" variant="ghost" onClick={() => remove(i)} aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...items, ""])}>
        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add
      </Button>
    </fieldset>
  );
}

function RoundsEditor({ rounds, onChange }) {
  const update = (i, patch) => onChange(rounds.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rounds.length) return;
    const next = [...rounds];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <fieldset>
      <legend className="block text-xs font-semibold text-slate-600 mb-1.5">Interview rounds</legend>
      {rounds.length === 0 && <p className="text-xs text-slate-400 mb-2">No rounds defined. Rounds can still be named when scheduling.</p>}
      <ol className="space-y-2">
        {rounds.map((r, i) => (
          <li key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <span className="w-7 shrink-0 text-xs font-bold text-slate-400">R{i + 1}</span>
            <Input
              value={r.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Round name"
              aria-label={`Round ${i + 1} name`}
              className="flex-1 min-w-[160px]"
            />
            <Select
              value={r.type}
              onChange={(e) => update(i, { type: e.target.value })}
              options={ROUND_TYPES}
              aria-label={`Round ${i + 1} type`}
              className="w-auto min-w-[140px]"
            />
            <div className="flex">
              <Button type="button" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move round ${i + 1} up`}>
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" onClick={() => move(i, 1)} disabled={i === rounds.length - 1} aria-label={`Move round ${i + 1} down`}>
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" onClick={() => onChange(rounds.filter((_, idx) => idx !== i))} aria-label={`Remove round ${i + 1}`}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...rounds, { name: "", type: "technical" }])}>
        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add round
      </Button>
    </fieldset>
  );
}

function JobEditor({ job, lookups, onCancel, onSaved }) {
  const { can } = useInternalUser();
  const [form, setForm] = useState(() => formFromJob(job));
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [requisitionCode, setRequisitionCode] = useState("");
  const editing = Boolean(job?.id);
  const showSalary = can("offer.view_salary");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (!form.requisition_id || !can("requisition.view")) return;
    hcmJson(`/api/hcm/requisitions/${form.requisition_id}`)
      .then((d) => setRequisitionCode(d.requisition?.code || ""))
      .catch(() => {});
  }, [form.requisition_id, can]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setValue = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCategory = (cat) =>
    setForm((f) => ({ ...f, categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat] }));

  const pickLocation = (e) => {
    const loc = lookups.locations.find((l) => l.id === e.target.value);
    setForm((f) => ({ ...f, location_id: e.target.value, location: loc ? loc.name : f.location }));
  };

  const managerOptions = useMemo(() => {
    const opts = lookups.managers.map((u) => ({ value: u.id, label: `${u.full_name}${u.designation ? ` — ${u.designation}` : ""}` }));
    if (job?.hiring_manager && !opts.some((o) => o.value === job.hiring_manager.id)) {
      opts.unshift({ value: job.hiring_manager.id, label: job.hiring_manager.full_name });
    }
    return opts;
  }, [lookups.managers, job]);

  const locationOptions = useMemo(() => {
    const opts = lookups.locations.map((l) => ({ value: l.id, label: l.name }));
    if (job?.locations?.name && job.location_id && !opts.some((o) => o.value === job.location_id)) {
      opts.unshift({ value: job.location_id, label: job.locations.name });
    }
    return opts;
  }, [lookups.locations, job]);

  const departmentOptions = useMemo(() => {
    const opts = lookups.departments.map((d) => ({ value: d.id, label: d.name }));
    if (job?.departments?.name && job.department_id && !opts.some((o) => o.value === job.department_id)) {
      opts.unshift({ value: job.department_id, label: job.departments.name });
    }
    return opts;
  }, [lookups.departments, job]);

  const save = async (status) => {
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.location.trim()) return setError("Location is required.");
    if (!form.experience_level.trim()) return setError("Experience level is required.");
    if (status === "Open" && !form.about_job.trim()) return setError("Add a job description before publishing.");
    if (form.salary_min !== "" && form.salary_max !== "" && Number(form.salary_min) > Number(form.salary_max)) {
      return setError("Salary minimum must not exceed maximum.");
    }
    const payload = {
      ...form,
      status,
      openings: Number(form.openings) || 1,
      responsibilities: form.responsibilities.map((s) => s.trim()).filter(Boolean),
      qualifications: form.qualifications.map((s) => s.trim()).filter(Boolean),
      interview_rounds: form.interview_rounds.map((r) => ({ ...r, name: r.name.trim() })).filter((r) => r.name),
      closing_date: form.closing_date || null,
    };
    setSaving(status);
    try {
      if (editing) await hcmJson("/api/hcm/jobs", { method: "PUT", body: { id: job.id, ...payload } });
      else await hcmJson("/api/hcm/jobs", { method: "POST", body: payload });
      onSaved(null, status === "Open" && form.status !== "Open" ? `"${form.title}" is published.` : `"${form.title}" saved.`);
    } catch (e) {
      setError(e.message);
      setSaving("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isDraft = !editing || form.status === "Draft";
  const busy = Boolean(saving);

  return (
    <>
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to jobs
      </button>
      <PageHeader
        title={editing ? `Edit: ${job.title}` : "New job"}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {editing && <StatusBadge status={form.status} />}
            {form.requisition_id && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                {requisitionCode ? `Requisition ${requisitionCode}` : "Linked to a requisition"}
              </Badge>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            {isDraft ? (
              <Button variant="secondary" onClick={() => save("Draft")} loading={saving === "Draft"} disabled={busy}>
                Save draft
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => save(form.status)} loading={saving === form.status} disabled={busy}>
                Save changes
              </Button>
            )}
            {form.status !== "Open" && (
              <Button onClick={() => save("Open")} loading={saving === "Open"} disabled={busy}>
                <Send className="w-4 h-4" aria-hidden="true" /> Publish
              </Button>
            )}
          </>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(isDraft ? "Draft" : form.status);
        }}
        className="space-y-6"
      >
        <Card title="Basics">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Job title" required className="sm:col-span-2">
              <Input value={form.title} onChange={set("title")} required autoFocus={!editing} />
            </Field>
            <Field label="Company" hint="Optional, shown on the careers page.">
              <Input value={form.company} onChange={set("company")} />
            </Field>
            <Field label="Department">
              <Select placeholder="No department" options={departmentOptions} value={form.department_id} onChange={set("department_id")} />
            </Field>
            <Field label="Office location">
              <Select placeholder="Select a location" options={locationOptions} value={form.location_id} onChange={pickLocation} />
            </Field>
            <Field label="Location (shown to candidates)" required>
              <Input value={form.location} onChange={set("location")} required placeholder="e.g. Puducherry, India" />
            </Field>
            <Field label="Mode of work">
              <Select options={MODES_OF_WORK} value={form.mode_of_work} onChange={set("mode_of_work")} />
            </Field>
            <Field label="Type of work">
              <Select options={TYPES_OF_WORK} value={form.type_of_work} onChange={set("type_of_work")} />
            </Field>
            <Field label="Experience level" required>
              <Input value={form.experience_level} onChange={set("experience_level")} required placeholder="e.g. 2–4 years, Fresher" />
            </Field>
            <Field label="Openings">
              <Input type="number" min={1} value={form.openings} onChange={set("openings")} />
            </Field>
            <Field label="Hiring manager">
              <Select placeholder="Not assigned" options={managerOptions} value={form.hiring_manager_id} onChange={set("hiring_manager_id")} />
            </Field>
            <Field label="Visibility">
              <Select options={VISIBILITY} value={form.visibility} onChange={set("visibility")} />
            </Field>
            <Field label="Closing date" hint="Optional. Leave empty to keep open until closed.">
              <Input type="date" value={form.closing_date} onChange={set("closing_date")} />
            </Field>
          </div>
        </Card>

        <Card title="Categories and skills">
          <fieldset>
            <legend className="block text-xs font-semibold text-slate-600 mb-1.5">Area of interest</legend>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {AREA_OF_INTEREST.map((cat) => (
                <label key={cat} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-teal-500"
                    checked={form.categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Skills" hint="Comma separated, e.g. SAP FICO, S/4HANA, Excel" className="mt-4">
            <Input value={form.skills} onChange={set("skills")} />
          </Field>
        </Card>

        <Card title="Description">
          <Field label="About the job" hint="Required before publishing.">
            <Textarea rows={6} value={form.about_job} onChange={set("about_job")} />
          </Field>
          <div className="grid lg:grid-cols-2 gap-6 mt-5">
            <ListEditor
              label="Responsibilities"
              items={form.responsibilities}
              onChange={(v) => setValue("responsibilities", v)}
              placeholder="A key responsibility"
            />
            <ListEditor
              label="Qualifications"
              items={form.qualifications}
              onChange={(v) => setValue("qualifications", v)}
              placeholder="A required qualification"
            />
          </div>
        </Card>

        {showSalary && (
          <Card title="Compensation">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Salary minimum">
                <Input type="number" min={0} value={form.salary_min} onChange={set("salary_min")} />
              </Field>
              <Field label="Salary maximum">
                <Input type="number" min={0} value={form.salary_max} onChange={set("salary_max")} />
              </Field>
              <Field label="Currency">
                <Select options={CURRENCIES} value={form.currency} onChange={set("currency")} />
              </Field>
            </div>
            <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="size-4 accent-brand-teal-500"
                checked={form.show_salary}
                onChange={(e) => setValue("show_salary", e.target.checked)}
              />
              Show salary on careers page
            </label>
            {form.show_salary && (form.salary_min !== "" || form.salary_max !== "") && (
              <p className="mt-2 text-xs text-slate-500">
                Candidates see:{" "}
                {[form.salary_min, form.salary_max]
                  .filter((v) => v !== "")
                  .map((v) => formatMoney(Number(v), form.currency))
                  .join(" – ")}
              </p>
            )}
          </Card>
        )}

        <Card title="Interview process">
          <RoundsEditor rounds={form.interview_rounds} onChange={(v) => setValue("interview_rounds", v)} />
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          {isDraft ? (
            <Button type="button" variant="secondary" onClick={() => save("Draft")} loading={saving === "Draft"} disabled={busy}>
              Save draft
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => save(form.status)} loading={saving === form.status} disabled={busy}>
              Save changes
            </Button>
          )}
          {form.status !== "Open" && (
            <Button type="button" onClick={() => save("Open")} loading={saving === "Open"} disabled={busy}>
              <Send className="w-4 h-4" aria-hidden="true" /> Publish
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
