"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  X,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  CalendarPlus,
  ThumbsUp,
  ThumbsDown,
  Ban,
  Send,
  ArrowRightLeft,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import ScheduleInterviewModal from "@/components/hcm/ScheduleInterviewModal";
import StageBadge from "@/components/hcm/StageBadge";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Badge,
  Spinner,
  EmptyState,
  ErrorBanner,
  Modal,
  formatDate,
} from "@/components/hcm/ui";

export const APPLICATION_TRANSITIONS = {
  Applied: ["Screening", "Shortlisted", "Hold", "Rejected", "Withdrawn"],
  Screening: ["Shortlisted", "Hold", "Rejected", "Withdrawn"],
  Hold: ["Screening", "Shortlisted", "Rejected", "Withdrawn"],
  Shortlisted: ["Interview", "Hold", "Rejected", "Withdrawn"],
  Interview: ["Interview", "Selected", "Hold", "Rejected", "Withdrawn"],
  Selected: ["Offer", "Rejected", "Withdrawn"],
  Offer: ["Hired", "Selected", "Rejected", "Withdrawn"],
  Rejected: ["Screening"],
  Hired: [],
  Withdrawn: [],
};

export const APPLICATION_STAGES = Object.keys(APPLICATION_TRANSITIONS);
export const PIPELINE_COLUMNS = ["Applied", "Screening", "Hold", "Shortlisted", "Interview", "Selected", "Offer", "Hired", "Rejected"];
export const REASON_STAGES = ["Rejected", "Withdrawn"];

export function fullName(app) {
  if (!app) return "";
  return `${app.first_name || ""} ${app.last_name || ""}`.trim() || app.email || "Candidate";
}

export function daysInStage(app) {
  if (!app?.stage_changed_at) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(app.stage_changed_at).getTime()) / 86400000));
}

export function moveTargets(stage, can) {
  const base = (APPLICATION_TRANSITIONS[stage] || []).filter((s) => s !== "Offer" && s !== "Hired");
  if (can("application.move")) return base.filter((s) => s !== "Interview" || can("interview.schedule"));
  if (can("application.decide") && stage === "Interview") return base.filter((s) => s === "Selected" || s === "Rejected");
  return [];
}

export function ReasonModal({ title, description, onClose, onSubmit, confirmLabel = "Confirm" }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason.trim()) return setError("A reason is required.");
    setSaving(true);
    setError("");
    try {
      await onSubmit(reason.trim());
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={saving}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      {description && <p className="text-sm text-slate-600 mb-3">{description}</p>}
      <Field label="Reason" required>
        <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Recorded in the timeline" />
      </Field>
    </Modal>
  );
}

export function ActionMenu({ label, ariaLabel, icon: Icon = MoreHorizontal, items, variant = "secondary", disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const visible = items.filter(Boolean);

  const close = useCallback((focus = true) => {
    setOpen(false);
    if (focus) btnRef.current?.focus();
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (open) return close();
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom > 280;
    setPos({
      top: below ? r.bottom + 4 : undefined,
      bottom: below ? undefined : window.innerHeight - r.top + 4,
      right: Math.max(8, window.innerWidth - r.right),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    const onScroll = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const onKeyDown = (e) => {
    const nodes = [...menuRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')];
    const i = nodes.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nodes[(i + 1) % nodes.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  if (!visible.length) return null;

  return (
    <span
      className="inline-flex"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Button
        ref={btnRef}
        type="button"
        size="sm"
        variant={variant}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel || label}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {label}
      </Button>
      {open && pos && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label={ariaLabel || label}
          onKeyDown={onKeyDown}
          style={{ position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right }}
          className="z-[60] min-w-[180px] max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1"
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                close(false);
                item.onSelect();
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 cursor-pointer focus:outline-none focus:bg-slate-100 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger ? "text-red-600" : "text-slate-700"
              }`}
            >
              {item.icon && <item.icon className="w-4 h-4" aria-hidden="true" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

const BULK_ACTIONS = [
  { to: "Screening", label: "Screening" },
  { to: "Shortlisted", label: "Shortlist" },
  { to: "Hold", label: "Hold" },
];

export function ApplicationsTable({ applications, showJob = false, canBulk = false, onOpen, onChanged, toolbar = null }) {
  const [selected, setSelected] = useState(() => new Set());
  const [stageFilter, setStageFilter] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    return applications.filter((a) => {
      if (stageFilter && a.stage !== stageFilter) return false;
      if (!q) return true;
      return [a.key_skills, a.experience, a.job_title, a.employer, fullName(a), a.email, a.position].some(
        (v) => v && String(v).toLowerCase().includes(q)
      );
    });
  }, [applications, stageFilter, text]);

  useEffect(() => {
    const ids = new Set(applications.map((a) => a.id));
    setSelected((s) => {
      const next = new Set([...s].filter((id) => ids.has(id)));
      return next.size === s.size ? s : next;
    });
  }, [applications]);

  const allChecked = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s);
      if (allChecked) filtered.forEach((a) => next.delete(a.id));
      else filtered.forEach((a) => next.add(a.id));
      return next;
    });
  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runBulk = async (to, reason) => {
    const ids = [...selected];
    setBusy(to);
    setError("");
    setNotice(null);
    try {
      const data = await hcmJson("/api/hcm/applications", { method: "POST", body: { ids, to, reason } });
      const byId = Object.fromEntries(applications.map((a) => [a.id, a]));
      const failures = (data.results || []).filter((r) => !r.ok).map((r) => `${fullName(byId[r.id])}: ${r.error}`);
      setNotice({ text: `Moved ${data.moved} of ${ids.length} to ${to}.`, failures });
      setSelected(new Set());
      onChanged?.();
    } catch (e) {
      setError(e.message);
      if (to === "Rejected") throw e;
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
          <div className="flex items-start justify-between gap-2">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          {notice.failures.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-red-700 space-y-0.5">
              {notice.failures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        {toolbar}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Filter by skills or experience"
            placeholder="Filter by skills, experience, title"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Filter by stage"
          className="w-auto min-w-[160px]"
          placeholder="All stages"
          options={APPLICATION_STAGES}
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        />
      </div>

      {canBulk && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-brand-teal-50 border border-brand-teal-100" role="toolbar" aria-label="Bulk actions">
          <span className="text-xs font-semibold text-slate-700 mr-1">{selected.size} selected</span>
          {BULK_ACTIONS.map((b) => (
            <Button key={b.to} size="sm" variant="secondary" loading={busy === b.to} disabled={Boolean(busy)} onClick={() => runBulk(b.to)}>
              {b.label}
            </Button>
          ))}
          <Button size="sm" variant="danger" disabled={Boolean(busy)} onClick={() => setRejecting(true)}>
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={applications.length ? "No applications match your filters" : "No applications yet"} />
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                {canBulk && (
                  <th className="pl-5 pr-2 py-2 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all visible applications"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="size-4 accent-brand-teal-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className={`${canBulk ? "px-3" : "px-5"} py-2`}>Candidate</th>
                {showJob && <th className="px-3 py-2">Job</th>}
                <th className="px-3 py-2">Current role</th>
                <th className="px-3 py-2">Experience</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">In stage</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-5 py-2">Applied</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const days = daysInStage(a);
                return (
                  <tr
                    key={a.id}
                    tabIndex={0}
                    aria-label={`Open ${fullName(a)}`}
                    onClick={() => onOpen(a.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpen(a.id);
                      }
                    }}
                    className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer focus:outline-none focus:bg-brand-teal-50 ${
                      selected.has(a.id) ? "bg-brand-teal-50/50" : ""
                    }`}
                  >
                    {canBulk && (
                      <td className="pl-5 pr-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${fullName(a)}`}
                          checked={selected.has(a.id)}
                          onChange={() => toggle(a.id)}
                          className="size-4 accent-brand-teal-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className={`${canBulk ? "px-3" : "px-5"} py-3`}>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {fullName(a)}
                        <InterestIcon value={a.manager_interest} />
                      </div>
                      <div className="text-xs text-slate-500">{a.email}</div>
                    </td>
                    {showJob && <td className="px-3 py-3 text-slate-600">{a.position || "—"}</td>}
                    <td className="px-3 py-3 text-slate-600">
                      {a.job_title || "—"}
                      {a.employer && <div className="text-xs text-slate-400">{a.employer}</div>}
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{a.experience || "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <StageBadge stage={a.stage} />
                        {a.stage === "Interview" && a.current_round > 0 && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">R{a.current_round}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{days === null ? "—" : `${days}d`}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{a.source || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDate(a.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <ReasonModal
          title={`Reject ${selected.size} application${selected.size === 1 ? "" : "s"}`}
          description="Candidates are notified that they were not selected."
          confirmLabel="Reject"
          onClose={() => setRejecting(false)}
          onSubmit={async (reason) => {
            await runBulk("Rejected", reason);
            setRejecting(false);
          }}
        />
      )}
    </div>
  );
}

export function InterestIcon({ value }) {
  if (value === "Interested")
    return (
      <span title="Hiring manager: interested" className="text-emerald-600">
        <ThumbsUp className="w-3.5 h-3.5" aria-label="Hiring manager interested" />
      </span>
    );
  if (value === "Not interested")
    return (
      <span title="Hiring manager: not interested" className="text-red-500">
        <ThumbsDown className="w-3.5 h-3.5" aria-label="Hiring manager not interested" />
      </span>
    );
  return null;
}

const RECOMMENDATION_STYLES = {
  "Strong hire": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Hire: "bg-teal-50 text-teal-700 border-teal-200",
  "No hire": "bg-orange-50 text-orange-700 border-orange-200",
  "Strong no hire": "bg-red-50 text-red-700 border-red-200",
};

const INTERVIEW_STATUS_STYLES = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const EMAIL_STATUS = {
  skipped: { label: "Not sent – email not connected", className: "bg-slate-100 text-slate-600 border-slate-200" },
  sent: { label: "Sent", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  queued: { label: "Queued", className: "bg-blue-50 text-blue-700 border-blue-200" },
  pending: { label: "Queued", className: "bg-blue-50 text-blue-700 border-blue-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
};

function Dots({ value }) {
  const v = Math.round(Number(value) || 0);
  return (
    <span role="img" aria-label={`${Number(value).toFixed(1).replace(/\.0$/, "")} out of 5`} className="inline-flex gap-0.5 align-middle">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`size-2 rounded-full ${i <= v ? "bg-brand-teal-500" : "bg-slate-200"}`} />
      ))}
    </span>
  );
}

function Info({ label, children }) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800 mt-0.5 break-words">{empty ? "—" : children}</dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h3 className="text-xs font-bold text-slate-900 mb-2">{title}</h3>
      {children}
    </section>
  );
}

function externalHref(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function downloadHref(url, filename) {
  if (!url) return null;
  return `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(filename || "resume")}`;
}

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "timeline", label: "Timeline" },
  { key: "interviews", label: "Interviews" },
  { key: "notes", label: "Notes", full: true },
  { key: "emails", label: "Emails", full: true },
];

export default function CandidateDrawer({ applicationId, onClose, onChanged }) {
  const { can } = useInternalUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("profile");
  const [busy, setBusy] = useState("");
  const [reasonFor, setReasonFor] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [cancelFor, setCancelFor] = useState(null);
  const closeRef = useRef(null);
  const childOpenRef = useRef(false);
  const tabsId = useId();
  childOpenRef.current = Boolean(reasonFor || schedule || cancelFor);

  const load = useCallback(async () => {
    const res = await hcmJson(`/api/hcm/applications/${applicationId}`);
    setData(res);
  }, [applicationId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setData(null);
    setTab("profile");
    load()
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && !childOpenRef.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const afterMutation = async () => {
    await load();
    onChanged?.();
  };

  const act = async (key, body) => {
    setBusy(key);
    setError("");
    try {
      await hcmJson(`/api/hcm/applications/${applicationId}`, { method: "POST", body });
      await afterMutation();
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setBusy("");
    }
  };

  const safeAct = (key, body) => act(key, body).catch(() => {});

  const app = data?.application;
  const job = data?.job;
  const full = data?.access === "full";
  const stage = app?.stage;
  const targets = app && full ? moveTargets(stage, can) : [];
  const moveItems = targets
    .filter((s) => !(s === "Interview" && stage === "Interview"))
    .map((s) => ({
      label: s === "Interview" ? "Interview (schedule)" : s,
      danger: REASON_STAGES.includes(s),
      onSelect: () => {
        if (s === "Interview") setSchedule({});
        else if (REASON_STAGES.includes(s)) setReasonFor(s);
        else safeAct(`move:${s}`, { action: "move", to: s });
      },
    }));
  const canSchedule = full && can("interview.schedule") && (stage === "Shortlisted" || stage === "Interview");
  const canReject = targets.includes("Rejected");
  const canInterest = full && can("application.decide") && stage === "Shortlisted";
  const name = fullName(app);
  const visibleTabs = TABS.filter((t) => !t.full || full);

  const interviews = data?.interviews || [];
  const nextRound = Math.max(app?.current_round || 0, ...interviews.map((i) => i.round || 0)) + 1;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onMouseDown={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={app ? `Application: ${name}` : "Application"}
        className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-slate-900 truncate flex items-center gap-2">
                {app ? name : "Application"}
                {app && <InterestIcon value={app.manager_interest} />}
              </h2>
              {app && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{app.position}</span>
                  <StageBadge stage={stage} />
                  {stage === "Interview" && app.current_round > 0 && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">R{app.current_round}</Badge>
                  )}
                  {app.source && <span>· {app.source}</span>}
                  <span>· Applied {formatDate(app.created_at)}</span>
                </div>
              )}
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close application"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-teal-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {app && full && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {moveItems.length > 0 && (
                <ActionMenu label="Move to…" ariaLabel="Move application to stage" icon={ArrowRightLeft} items={moveItems} disabled={Boolean(busy)} />
              )}
              {canSchedule && (
                <Button size="sm" variant="secondary" onClick={() => setSchedule({})}>
                  <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" /> Schedule interview
                </Button>
              )}
              {canInterest && (
                <>
                  <Button
                    size="sm"
                    variant={app.manager_interest === "Interested" ? "primary" : "secondary"}
                    aria-pressed={app.manager_interest === "Interested"}
                    loading={busy === "interest:Interested"}
                    onClick={() =>
                      safeAct("interest:Interested", { action: "interest", value: app.manager_interest === "Interested" ? null : "Interested" })
                    }
                  >
                    <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" /> Interested
                  </Button>
                  <Button
                    size="sm"
                    variant={app.manager_interest === "Not interested" ? "danger" : "secondary"}
                    aria-pressed={app.manager_interest === "Not interested"}
                    loading={busy === "interest:Not interested"}
                    onClick={() =>
                      safeAct("interest:Not interested", {
                        action: "interest",
                        value: app.manager_interest === "Not interested" ? null : "Not interested",
                      })
                    }
                  >
                    <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" /> Not interested
                  </Button>
                </>
              )}
              {canReject && (
                <Button size="sm" variant="danger" onClick={() => setReasonFor("Rejected")} disabled={Boolean(busy)}>
                  <Ban className="w-3.5 h-3.5" aria-hidden="true" /> Reject
                </Button>
              )}
              {stage === "Selected" &&
                (can("offer.create") ? (
                  <Link
                    href={`/admin/dashboard/offers?application=${app.id}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-brand-teal-500 hover:bg-brand-teal-600 text-white"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" /> Create offer
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">An offer is created from the Offers page.</span>
                ))}
            </div>
          )}

          {app && (
            <div role="tablist" aria-label="Application sections" className="mt-4 -mb-4 flex gap-1 overflow-x-auto">
              {visibleTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${t.key}`}
                  aria-selected={tab === t.key}
                  aria-controls={`${tabsId}-${t.key}-panel`}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer focus:outline-none focus:bg-slate-50 ${
                    tab === t.key ? "border-brand-teal-500 text-brand-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                  {t.key === "interviews" && interviews.length > 0 && <span className="ml-1 text-[11px] text-slate-400">{interviews.length}</span>}
                  {t.key === "notes" && data.notes.length > 0 && <span className="ml-1 text-[11px] text-slate-400">{data.notes.length}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ErrorBanner message={error} onClose={() => setError("")} />
          {loading ? (
            <Spinner />
          ) : !app ? null : (
            <div role="tabpanel" id={`${tabsId}-${tab}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
              {tab === "profile" && <ProfileTab app={app} data={data} full={full} canTag={full && can("application.move")} onTags={(tags) => act("tags", { action: "tags", tags })} />}
              {tab === "timeline" && <TimelineTab app={app} events={data.events} />}
              {tab === "interviews" && (
                <InterviewsTab
                  interviews={interviews}
                  canManage={full && can("interview.schedule")}
                  onReschedule={(interview) => setSchedule({ interview })}
                  onCancel={setCancelFor}
                />
              )}
              {tab === "notes" && <NotesTab notes={data.notes} onAdd={(body) => act("note", { action: "note", body })} />}
              {tab === "emails" && <EmailsTab emails={data.emails} />}
            </div>
          )}
        </div>
      </aside>

      {reasonFor && (
        <ReasonModal
          title={`${reasonFor === "Rejected" ? "Reject" : "Withdraw"} ${name}`}
          description={reasonFor === "Rejected" ? "The candidate is notified that they were not selected." : "Record why this application is withdrawn."}
          confirmLabel={reasonFor === "Rejected" ? "Reject" : "Withdraw"}
          onClose={() => setReasonFor(null)}
          onSubmit={async (reason) => {
            await act(`move:${reasonFor}`, { action: "move", to: reasonFor, reason });
            setReasonFor(null);
          }}
        />
      )}

      {cancelFor && (
        <ReasonModal
          title={`Cancel ${cancelFor.round_name}`}
          description="The candidate and panel are notified."
          confirmLabel="Cancel interview"
          onClose={() => setCancelFor(null)}
          onSubmit={async (reason) => {
            await hcmJson(`/api/hcm/interviews/${cancelFor.id}`, { method: "PATCH", body: { action: "cancel", reason } });
            setCancelFor(null);
            await afterMutation().catch((e) => setError(e.message));
          }}
        />
      )}

      {schedule && app && (
        <ScheduleInterviewModal
          application={{ id: app.id, name, position: app.position }}
          rounds={job?.interview_rounds || []}
          nextRound={schedule.interview ? schedule.interview.round : nextRound}
          interview={schedule.interview}
          onClose={() => setSchedule(null)}
          onSaved={() => {
            setSchedule(null);
            afterMutation().catch((e) => setError(e.message));
          }}
        />
      )}
    </div>
  );
}

function ProfileTab({ app, data, full, canTag, onTags }) {
  const skills = String(app.key_skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const address = [app.address_line1, app.address_line2, app.city, app.state, app.zip, app.country].filter(Boolean).join(", ");
  const hasSalary = "current_salary" in app || "expected_salary" in app;
  const hasRefs = full && (app.ref_name || app.ref_email || app.ref_phone);
  const job = data.job;

  return (
    <div>
      <Section title="Resume">
        {app.resume_signed_url ? (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={app.resume_signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Open resume
            </a>
            <a
              href={downloadHref(app.resume_signed_url, app.resume_filename)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download
            </a>
            {app.resume_filename && <span className="text-xs text-slate-400 truncate">{app.resume_filename}</span>}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No resume available.</p>
        )}
      </Section>

      <Section title="Contact">
        <dl className="grid sm:grid-cols-2 gap-4">
          <Info label="Email">
            {app.email && (
              <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1 text-brand-teal-700 hover:underline">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" /> {app.email}
              </a>
            )}
          </Info>
          <Info label="Phone">
            {app.phone && (
              <a href={`tel:${app.phone}`} className="inline-flex items-center gap-1 text-brand-teal-700 hover:underline">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" /> {app.phone}
              </a>
            )}
          </Info>
          <Info label="Address">
            {address && (
              <span className="inline-flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" /> {address}
              </span>
            )}
          </Info>
          <Info label="Heard about us">{app.hear_about}</Info>
        </dl>
      </Section>

      <Section title="Experience">
        <dl className="grid sm:grid-cols-2 gap-4">
          <Info label="Experience">{app.experience}</Info>
          <Info label="Current title">{app.job_title}</Info>
          <Info label="Current employer">{app.employer}</Info>
          <Info label="Available from">{app.start_date}</Info>
        </dl>
        {skills.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Key skills</p>
            <div className="flex flex-wrap gap-1">
              {skills.map((s) => (
                <Badge key={s} className="bg-slate-50 text-slate-700 border-slate-200">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Section>

      {hasSalary && (
        <Section title="Compensation">
          <dl className="grid sm:grid-cols-2 gap-4">
            <Info label="Current salary">{app.current_salary}</Info>
            <Info label="Expected salary">{app.expected_salary}</Info>
            {job && (job.salary_min || job.salary_max) && (
              <Info label="Job budget">
                {[job.salary_min, job.salary_max].filter((v) => v !== null && v !== undefined).join(" – ")} {job.currency}
              </Info>
            )}
          </dl>
        </Section>
      )}

      {(app.linkedin || app.portfolio) && (
        <Section title="Links">
          <div className="flex flex-col gap-1.5 text-sm">
            {app.linkedin && (
              <a href={externalHref(app.linkedin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-teal-700 hover:underline break-all">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> LinkedIn: {app.linkedin}
              </a>
            )}
            {app.portfolio && (
              <a href={externalHref(app.portfolio)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-teal-700 hover:underline break-all">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Portfolio: {app.portfolio}
              </a>
            )}
          </div>
        </Section>
      )}

      {hasRefs && (
        <Section title="Reference">
          <dl className="grid sm:grid-cols-2 gap-4">
            <Info label="Name">{app.ref_name}</Info>
            <Info label="Relationship">{app.ref_relationship}</Info>
            <Info label="Email">{app.ref_email}</Info>
            <Info label="Phone">{app.ref_phone}</Info>
          </dl>
        </Section>
      )}

      {app.cover_letter && (
        <Section title="Cover letter">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{app.cover_letter}</p>
        </Section>
      )}

      {app.rejection_reason && app.stage === "Rejected" && (
        <Section title="Rejection reason">
          <p className="text-sm text-slate-700">{app.rejection_reason}</p>
        </Section>
      )}

      {full && <TagsEditor tags={app.tags || []} editable={canTag} onSave={onTags} />}
    </div>
  );
}

function TagsEditor({ tags, editable, onSave }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (next) => {
    setSaving(true);
    try {
      await onSave(next);
      setValue("");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (!editable && !tags.length) return null;
  return (
    <Section title="Tags">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand-teal-100 bg-brand-teal-50 px-2 py-0.5 text-[11px] font-semibold text-brand-teal-700">
            {t}
            {editable && (
              <button type="button" disabled={saving} onClick={() => save(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {!tags.length && <span className="text-xs text-slate-400">No tags.</span>}
      </div>
      {editable && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) save([...tags, value.trim()]);
          }}
        >
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add a tag" aria-label="New tag" className="h-8 text-xs" />
          <Button type="submit" size="sm" variant="secondary" loading={saving} disabled={!value.trim()}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add
          </Button>
        </form>
      )}
    </Section>
  );
}

function TimelineTab({ app, events }) {
  const items = [...(events || [])].reverse();
  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-5">
      {items.map((e, i) => (
        <li key={e.id || i} className="ml-4">
          <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white bg-brand-teal-500" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {e.from_stage && (
              <>
                <StageBadge stage={e.from_stage} />
                <span className="text-slate-400" aria-label="to">→</span>
              </>
            )}
            <StageBadge stage={e.to_stage} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {formatDate(e.created_at, true)}
            {e.actor_name && <> · {e.actor_name}</>}
          </p>
          {e.reason && <p className="text-sm text-slate-700 mt-1">{e.reason}</p>}
        </li>
      ))}
      {!items.length && (
        <li className="ml-4">
          <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white bg-brand-teal-500" aria-hidden="true" />
          <StageBadge stage="Applied" />
          <p className="text-xs text-slate-500 mt-1">{formatDate(app.created_at, true)}</p>
        </li>
      )}
    </ol>
  );
}

function criterionAverages(scorecards) {
  const submitted = scorecards.filter((s) => s.submitted_at);
  const totals = {};
  for (const s of submitted) {
    for (const [k, v] of Object.entries(s.ratings || {})) {
      const n = Number(v);
      if (!n) continue;
      totals[k] ??= { sum: 0, count: 0 };
      totals[k].sum += n;
      totals[k].count += 1;
    }
  }
  return { count: submitted.length, rows: Object.entries(totals).map(([k, t]) => [k, t.sum / t.count]) };
}

function InterviewsTab({ interviews, canManage, onReschedule, onCancel }) {
  if (!interviews.length) return <EmptyState icon={CalendarPlus} title="No interviews yet" />;
  return (
    <div className="space-y-4">
      {interviews.map((iv) => {
        const avg = criterionAverages(iv.scorecards || []);
        const scheduled = iv.status === "Scheduled";
        return (
          <article key={iv.id} className="border border-slate-200 rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">R{iv.round}</Badge>
                  {iv.round_name}
                  <span className="text-xs font-medium text-slate-400 capitalize">{iv.type}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(iv.scheduled_at, true)} · {iv.duration_min} min · <span className="capitalize">{iv.mode}</span>
                </p>
              </div>
              <Badge className={INTERVIEW_STATUS_STYLES[iv.status]}>{iv.status}</Badge>
            </div>

            <dl className="mt-3 grid sm:grid-cols-2 gap-3">
              <Info label={iv.mode === "onsite" ? "Location" : "Link / dial-in"}>
                {iv.mode === "online" && iv.meeting_link ? (
                  <a href={externalHref(iv.meeting_link)} target="_blank" rel="noopener noreferrer" className="text-brand-teal-700 hover:underline break-all">
                    {iv.meeting_link}
                  </a>
                ) : (
                  iv.location || iv.meeting_link
                )}
              </Info>
              <Info label="Panel">{(iv.panel || []).map((p) => p.name).join(", ")}</Info>
              <Info label="Candidate confirmed">
                {iv.candidate_confirmed_at ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {formatDate(iv.candidate_confirmed_at, true)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Not yet
                  </span>
                )}
              </Info>
            </dl>

            {iv.reschedule_request && scheduled && (
              <p className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Candidate asked to reschedule: {iv.reschedule_request}
              </p>
            )}

            {canManage && scheduled && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant={iv.reschedule_request ? "primary" : "secondary"} onClick={() => onReschedule(iv)}>
                  Reschedule
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onCancel(iv)}>
                  Cancel interview
                </Button>
              </div>
            )}

            {(iv.scorecards || []).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-900 mb-2">Scorecards</h5>
                {avg.rows.length > 0 && (
                  <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                      Average across {avg.count} submitted
                    </p>
                    <ul className="space-y-1">
                      {avg.rows.map(([k, v]) => (
                        <li key={k} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-700 capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="flex items-center gap-2">
                            <Dots value={v} />
                            <span className="w-7 text-right font-semibold text-slate-700">{v.toFixed(1)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ul className="space-y-3">
                  {iv.scorecards.map((s, i) => (
                    <li key={s.id || i} className="text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">{s.interviewer_name}</span>
                        {s.recommendation && <Badge className={RECOMMENDATION_STYLES[s.recommendation]}>{s.recommendation}</Badge>}
                        <span className="text-slate-400">{s.submitted_at ? `Submitted ${formatDate(s.submitted_at, true)}` : "Draft"}</span>
                      </div>
                      {Object.keys(s.ratings || {}).length > 0 && (
                        <ul className="mt-1.5 grid sm:grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(s.ratings).map(([k, v]) => (
                            <li key={k} className="flex items-center justify-between gap-2">
                              <span className="text-slate-600 capitalize">{k.replace(/_/g, " ")}</span>
                              <Dots value={v} />
                            </li>
                          ))}
                        </ul>
                      )}
                      {s.comments && <p className="mt-1.5 text-slate-700 whitespace-pre-wrap">{s.comments}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function NotesTab({ notes, onAdd }) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onAdd(body.trim());
      setBody("");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-5">
        <Field label="Add a note" hint="Visible to the recruiting team only.">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Observations, follow-ups..." />
        </Field>
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" loading={saving} disabled={!body.trim()}>
            Add note
          </Button>
        </div>
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-slate-400">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {[...notes].reverse().map((n, i) => (
            <li key={n.id || i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60">
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.body}</p>
              <p className="text-xs text-slate-500 mt-1">
                {n.author_name || "Unknown"} · {formatDate(n.created_at, true)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmailsTab({ emails }) {
  if (!emails.length) return <p className="text-sm text-slate-400">No emails recorded.</p>;
  return (
    <ul className="divide-y divide-slate-100 border border-slate-200 rounded-2xl">
      {emails.map((m, i) => {
        const status = EMAIL_STATUS[m.status] || { label: m.status, className: undefined };
        return (
          <li key={m.id || i} className="px-4 py-3 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{m.subject || m.template_code}</p>
              <p className="text-xs text-slate-500">
                {m.template_code} · {formatDate(m.created_at, true)}
              </p>
            </div>
            <Badge className={status.className}>{status.label}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
