"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { Badge, Button, inputClass } from "@/components/hcm/ui";

export const TASK_TEAMS = ["HR", "IT", "Admin", "Finance", "Manager", "Buddy"];
export const JOIN_STAGES = ["Intern", "Probation", "Full-time"];
export const BGV_STATUSES = ["Not started", "In progress", "Cleared", "Failed"];

const STYLES = {
  // joiner status
  "Pre-joining": "bg-amber-50 text-amber-700 border-amber-200",
  Ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Joined: "bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  // documents
  Requested: "bg-slate-100 text-slate-600 border-slate-200",
  Uploaded: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  // bgv
  "Not started": "bg-slate-100 text-slate-600 border-slate-200",
  "In progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Cleared: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
  // tasks
  Open: "bg-amber-50 text-amber-700 border-amber-200",
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Skipped: "bg-slate-100 text-slate-500 border-slate-200",
  // employee stage / status
  Intern: "bg-violet-50 text-violet-700 border-violet-200",
  Probation: "bg-amber-50 text-amber-700 border-amber-200",
  "Full-time": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Notice: "bg-orange-50 text-orange-700 border-orange-200",
  Exited: "bg-slate-100 text-slate-500 border-slate-200",
  // stage records / outcomes
  "Pending approval": "bg-orange-50 text-orange-700 border-orange-200",
  Completed: "bg-slate-100 text-slate-600 border-slate-200",
  Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Extended: "bg-amber-50 text-amber-700 border-amber-200",
  Converted: "bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200",
  Released: "bg-red-50 text-red-700 border-red-200",
  // leave
  "Pending manager": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending HR": "bg-orange-50 text-orange-700 border-orange-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  // attendance
  Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Checked in": "bg-sky-50 text-sky-700 border-sky-200",
  "Checked out": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Half day": "bg-teal-50 text-teal-700 border-teal-200",
  Absent: "bg-red-50 text-red-700 border-red-200",
  "On leave": "bg-violet-50 text-violet-700 border-violet-200",
  Holiday: "bg-pink-50 text-pink-700 border-pink-200",
  Weekend: "bg-slate-50 text-slate-400 border-slate-200",
  "Missing check-out": "bg-orange-50 text-orange-700 border-orange-200",
  "Not checked in": "bg-slate-100 text-slate-600 border-slate-200",
  "Off today": "bg-slate-50 text-slate-500 border-slate-200",
  Upcoming: "bg-white text-slate-400 border-slate-200",
  "Not joined": "bg-white text-slate-300 border-slate-100",
  // exits
  "In notice": "bg-orange-50 text-orange-700 border-orange-200",
  Withdrawn: "bg-slate-100 text-slate-500 border-slate-200",
  Resignation: "bg-slate-50 text-slate-700 border-slate-200",
  Termination: "bg-red-50 text-red-700 border-red-200",
  Release: "bg-red-50 text-red-700 border-red-200",
  "Contract end": "bg-slate-50 text-slate-700 border-slate-200",
  Retirement: "bg-slate-50 text-slate-700 border-slate-200",
  Processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Not applicable": "bg-slate-100 text-slate-500 border-slate-200",
};

export function StatusChip({ status }) {
  return <Badge className={STYLES[status] || undefined}>{status}</Badge>;
}

/** Whole days from today to `date` (negative = past). */
export function daysFromToday(date) {
  if (!date) return null;
  const target = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

export function relativeDays(date) {
  const d = daysFromToday(date);
  if (d === null) return "";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

/** Departments, locations, grades and active internal users for pickers. */
export function useOrgLists({ users = true } = {}) {
  const [lists, setLists] = useState({ departments: [], locations: [], grades: [], users: [] });
  useEffect(() => {
    let active = true;
    Promise.all([
      hcmJson("/api/hcm/org/departments").catch(() => ({ items: [] })),
      hcmJson("/api/hcm/org/locations").catch(() => ({ items: [] })),
      hcmJson("/api/hcm/org/grades").catch(() => ({ items: [] })),
      users ? hcmJson("/api/hcm/users?lite=1").catch(() => ({ users: [] })) : { users: [] },
    ]).then(([d, l, g, u]) => {
      if (active) setLists({ departments: d.items || [], locations: l.items || [], grades: g.items || [], users: u.users || [] });
    });
    return () => {
      active = false;
    };
  }, [users]);
  return lists;
}

export function CopyField({ value, label = "Link" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex gap-2">
      <input readOnly aria-label={label} value={value} onFocus={(e) => e.target.select()} className={`${inputClass} font-mono text-xs`} />
      <Button variant="secondary" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
        {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function ProgressBar({ value, total, label }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[110px]" aria-label={label}>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-brand-teal-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
        {value}/{total}
      </span>
    </div>
  );
}
