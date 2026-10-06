"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Briefcase, CalendarClock, CalendarDays, CheckSquare, ClipboardList, FileSignature, Inbox, MessageSquareWarning,
  Percent, Plus, ShieldCheck, Timer, UserPlus, Users, Activity, Building2, ListTodo, FileCheck2, ShieldQuestion, UserCheck, Contact,
} from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { Card, Spinner, ErrorBanner, formatDate } from "@/components/hcm/ui";

const FUNNEL_STAGES = ["Applied", "Screening", "Hold", "Shortlisted", "Interview", "Selected", "Offer", "Hired", "Rejected"];
const USER_STATUSES = ["Active", "Invited", "Suspended", "Deactivated"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const { user, activeRole, can } = useInternalUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    hcmJson("/api/hcm/dashboard")
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Spinner />
      </div>
    );
  }

  const firstName = (user.fullName || user.email || "").split(/[\s@]/)[0];
  const roleName = user.roles.find((r) => r.code === activeRole)?.name;

  const quickLinks = [
    can("requisition.create") && { href: "/admin/dashboard/requisitions/new", label: "Raise requisition", icon: Plus },
    can("requisition.view") && { href: "/admin/dashboard/requisitions", label: "Requisitions", icon: ClipboardList },
    can("job.manage") && { href: "/admin/dashboard/careers", label: "Job postings", icon: Briefcase },
    can("application.move") && { href: "/admin/dashboard/careers/applications", label: "Applications", icon: Users },
    can("interview.view") && { href: "/admin/dashboard/interviews", label: "Interviews", icon: CalendarDays },
    can("user.manage") && { href: "/admin/dashboard/users", label: "Add user", icon: UserPlus },
    can("org.manage") && { href: "/admin/dashboard/org", label: "Organisation", icon: Building2 },
    can("onboarding.manage") && { href: "/admin/dashboard/onboarding", label: "Pre-joining", icon: UserCheck },
    can("employee.view") && { href: "/admin/dashboard/employees", label: "Employees", icon: Contact },
  ].filter(Boolean);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {roleName ? `Signed in as ${roleName}. ` : ""}Here is what needs your attention today.
        </p>
      </div>

      {quickLinks.length > 0 && (
        <nav aria-label="Quick links" className="flex flex-wrap gap-2 mb-6">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <l.icon className="w-4 h-4 text-brand-teal-600" aria-hidden="true" /> {l.label}
            </Link>
          ))}
        </nav>
      )}

      <ErrorBanner message={error} onClose={() => setError("")} />

      {loading ? (
        <Spinner label="Loading dashboard..." />
      ) : data ? (
        <div className="space-y-8">
          {data.me && <MyProfileSection me={data.me} />}
          <PendingActions data={data} />
          {data.onboarding && <OnboardingSection o={data.onboarding} />}
          {data.recruitment && <RecruitmentSection r={data.recruitment} />}
          {data.manager && <ManagerSection m={data.manager} />}
          {data.interviewer && <InterviewerSection iv={data.interviewer} />}
          {data.admin && <AdminSection a={data.admin} />}
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{children}</h2>;
}

function ActionCard({ href, icon: Icon, count, label, tone = "teal" }) {
  const tones = {
    teal: "bg-brand-teal-50 text-brand-teal-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-teal-200 hover:shadow-sm transition"
    >
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-2xl font-extrabold text-slate-900 leading-none">{count}</span>
        <span className="block text-xs font-semibold text-slate-500 mt-1">{label}</span>
      </span>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-teal-500" aria-hidden="true" />
    </Link>
  );
}

function PendingActions({ data }) {
  const cards = [];
  if (data.pendingApprovals > 0) {
    cards.push({ key: "approvals", href: "/admin/dashboard/approvals", icon: Inbox, count: data.pendingApprovals, label: "Approvals waiting for you", tone: "amber" });
  }
  if (data.recruitment?.approvedRequisitionsToPost > 0) {
    cards.push({
      key: "toPost",
      href: "/admin/dashboard/requisitions?status=Approved",
      icon: ClipboardList,
      count: data.recruitment.approvedRequisitionsToPost,
      label: "Approved requisitions to post",
      tone: "teal",
    });
  }
  if (data.manager?.awaitingReview > 0) {
    cards.push({ key: "review", href: "/admin/dashboard/careers/applications", icon: CheckSquare, count: data.manager.awaitingReview, label: "Shortlisted candidates to review", tone: "sky" });
  }
  if (data.manager?.awaitingDecision > 0) {
    cards.push({ key: "decide", href: "/admin/dashboard/careers/applications", icon: FileSignature, count: data.manager.awaitingDecision, label: "Candidates awaiting your decision", tone: "sky" });
  }
  const sentBack = data.manager?.requisitions?.["Sent back"] || 0;
  if (sentBack > 0) {
    cards.push({ key: "sentBack", href: "/admin/dashboard/requisitions?tab=action", icon: ClipboardList, count: sentBack, label: "Requisitions sent back to you", tone: "amber" });
  }
  if (data.myTasks > 0) {
    cards.push({ key: "tasks", href: "/admin/dashboard/tasks", icon: ListTodo, count: data.myTasks, label: "Open tasks assigned to you", tone: "teal" });
  }
  if (data.onboarding?.docsAwaiting > 0) {
    cards.push({ key: "docs", href: "/admin/dashboard/onboarding", icon: FileCheck2, count: data.onboarding.docsAwaiting, label: "Joiner documents to verify", tone: "sky" });
  }
  if (data.onboarding?.readyToConvert > 0) {
    cards.push({ key: "convert", href: "/admin/dashboard/onboarding?status=Ready", icon: UserCheck, count: data.onboarding.readyToConvert, label: "Joiners ready to convert", tone: "teal" });
  }
  if (data.interviewer?.feedbackDue > 0) {
    cards.push({ key: "feedback", href: "/admin/dashboard/interviews", icon: MessageSquareWarning, count: data.interviewer.feedbackDue, label: "Interview feedback due", tone: "red" });
  }

  return (
    <section aria-labelledby="pending-heading">
      <h2 id="pending-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        Pending actions
      </h2>
      {cards.length === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-white border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500">
          <ShieldCheck className="w-5 h-5 text-emerald-500" aria-hidden="true" /> You are all caught up. Nothing is waiting on you.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ key, ...c }) => (
            <ActionCard key={key} {...c} />
          ))}
        </div>
      )}
    </section>
  );
}

function StatTile({ icon: Icon, label, value, href, hint }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <Icon className="w-4 h-4 text-slate-300" aria-hidden="true" />
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </>
  );
  const cls = "block p-4 bg-white border border-slate-200 rounded-2xl";
  return href ? (
    <Link href={href} className={`${cls} hover:border-brand-teal-200 hover:shadow-sm transition`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function RecruitmentSection({ r }) {
  const funnel = r.funnel || {};
  const stages = [...FUNNEL_STAGES, ...Object.keys(funnel).filter((s) => !FUNNEL_STAGES.includes(s))];
  const max = Math.max(1, ...stages.map((s) => funnel[s] || 0));
  const total = stages.reduce((sum, s) => sum + (funnel[s] || 0), 0);
  return (
    <section>
      <SectionTitle>Recruitment</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <StatTile icon={Briefcase} label="Open jobs" value={r.openJobs} href="/admin/dashboard/careers" />
        <StatTile icon={Users} label="New applications today" value={r.newToday} href="/admin/dashboard/careers/applications" />
        <StatTile icon={CalendarClock} label="Interviews today" value={r.interviewsToday} href="/admin/dashboard/interviews" />
        <StatTile icon={FileSignature} label="Offers pending" value={r.offersPending} hint="Sent or under discussion" />
        <StatTile icon={ClipboardList} label="Requisitions to post" value={r.approvedRequisitionsToPost} href="/admin/dashboard/requisitions?status=Approved" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Application funnel" className="lg:col-span-2">
          {total === 0 ? (
            <p className="text-sm text-slate-400">No applications yet.</p>
          ) : (
            <ul className="space-y-2">
              {stages.map((s) => {
                const n = funnel[s] || 0;
                const pct = Math.round((n / max) * 100);
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-slate-600">{s}</span>
                    <span
                      className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden"
                      role="meter"
                      aria-label={`${s} applications`}
                      aria-valuemin={0}
                      aria-valuemax={max}
                      aria-valuenow={n}
                    >
                      <span
                        className={`block h-full rounded-full ${s === "Rejected" ? "bg-slate-300" : s === "Hired" ? "bg-emerald-500" : "bg-brand-teal-500"}`}
                        style={{ width: `${n ? Math.max(pct, 2) : 0}%` }}
                      />
                    </span>
                    <span className="w-10 text-right font-semibold text-slate-800 tabular-nums">{n}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <StatTile icon={Timer} label="Avg. time to hire" value={r.avgTimeToHire != null ? `${r.avgTimeToHire} days` : "—"} hint="Application to hired" />
          <StatTile icon={Percent} label="Offer acceptance rate" value={r.offerAcceptanceRate != null ? `${r.offerAcceptanceRate}%` : "—"} hint="Of decided offers" />
        </div>
      </div>
    </section>
  );
}

function ManagerSection({ m }) {
  const reqs = m.requisitions || {};
  const inApproval = (reqs["Pending HR"] || 0) + (reqs["Pending CHRO"] || 0);
  const approved = (reqs.Approved || 0) + (reqs.Posted || 0);
  return (
    <section>
      <SectionTitle>My hiring</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={ClipboardList} label="Requisitions in approval" value={inApproval} href="/admin/dashboard/requisitions?tab=approval" />
        <StatTile icon={CheckSquare} label="Approved / posted" value={approved} href="/admin/dashboard/requisitions?tab=approved" />
        <StatTile icon={ClipboardList} label="Drafts" value={reqs.Draft || 0} href="/admin/dashboard/requisitions?tab=action" />
        <StatTile icon={Briefcase} label="Jobs I manage" value={m.openings} />
      </div>
    </section>
  );
}

function InterviewerSection({ iv }) {
  const upcoming = iv.upcoming || [];
  return (
    <section>
      <SectionTitle>My interviews</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          title="Upcoming this week"
          className="lg:col-span-2"
          actions={
            <Link href="/admin/dashboard/interviews" className="text-xs font-semibold text-brand-teal-600 hover:underline">
              View all
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No interviews scheduled in the next 7 days.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((i) => {
                const a = i.applications || {};
                return (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{[a.first_name, a.last_name].filter(Boolean).join(" ") || "Candidate"}</p>
                      <p className="text-xs text-slate-500">
                        {i.round_name}
                        {a.position && ` · ${a.position}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-700">{formatDate(i.scheduled_at, true)}</p>
                      {i.mode && <p className="text-xs text-slate-400">{i.mode}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <StatTile icon={MessageSquareWarning} label="Feedback due" value={iv.feedbackDue} href="/admin/dashboard/interviews" hint="Past interviews without your scorecard" />
      </div>
    </section>
  );
}

function AdminSection({ a }) {
  const byStatus = a.byStatus || {};
  const recent = a.recentAccessChanges || [];
  return (
    <section>
      <SectionTitle>Administration</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <Card
            title="Users by status"
            actions={
              <Link href="/admin/dashboard/users" className="text-xs font-semibold text-brand-teal-600 hover:underline">
                Manage
              </Link>
            }
          >
            <dl className="grid grid-cols-2 gap-3">
              {USER_STATUSES.map((s) => (
                <div key={s}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s}</dt>
                  <dd className="text-xl font-extrabold text-slate-900">{byStatus[s] || 0}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <StatTile icon={UserPlus} label="Pending invites" value={a.pendingInvites} href="/admin/dashboard/users" />
        </div>
        <Card
          title="Recent access changes"
          className="lg:col-span-2"
          actions={
            <Link href="/admin/dashboard/audit" className="text-xs font-semibold text-brand-teal-600 hover:underline">
              Audit log
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">No recent changes.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2 min-w-0">
                    <Activity className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800 truncate">{r.action}</span>
                      <span className="block text-xs text-slate-500 truncate">by {r.actor_email || "system"}</span>
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(r.created_at, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}

function MyProfileSection({ me }) {
  return (
    <section>
      <SectionTitle>My profile</SectionTitle>
      <Card
        actions={
          <Link href={`/admin/dashboard/employees/${me.id}`} className="text-xs font-semibold text-brand-teal-600 hover:underline">
            View profile
          </Link>
        }
        title={`${me.designation || "Employee"} · ${me.employee_code}`}
      >
        <dl className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            ["Department", me.departments?.name],
            ["Location", me.locations?.name],
            ["Manager", me.manager?.full_name],
            ["Joined", formatDate(me.joining_date)],
            ["Stage", me.stage_end_date ? `${me.stage} until ${formatDate(me.stage_end_date)}` : me.stage],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
              <dd className="text-sm font-semibold text-slate-800 mt-0.5">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  );
}

function OnboardingSection({ o }) {
  return (
    <section>
      <SectionTitle>Onboarding</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          title="Upcoming joiners"
          className="lg:col-span-2"
          actions={
            <Link href="/admin/dashboard/onboarding" className="text-xs font-semibold text-brand-teal-600 hover:underline">
              View all
            </Link>
          }
        >
          {o.upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No one is in pre-joining.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {o.upcoming.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/admin/dashboard/onboarding/${j.id}`} className="text-sm font-semibold text-slate-800 hover:text-brand-teal-700">
                      {j.full_name}
                    </Link>
                    <p className="text-xs text-slate-500">{j.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700">{formatDate(j.joining_date)}</p>
                    <p className={`text-xs ${j.status === "Ready" ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>{j.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <StatTile icon={CalendarDays} label="Joining this week" value={o.joinersThisWeek} href="/admin/dashboard/onboarding" />
          <StatTile icon={ShieldQuestion} label="Background checks pending" value={o.bgvPending} href="/admin/dashboard/onboarding" />
        </div>
      </div>
    </section>
  );
}
