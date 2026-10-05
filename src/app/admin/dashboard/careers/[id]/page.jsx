"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Briefcase, ExternalLink, KanbanSquare, Lock, Pencil, Table2, ChevronDown, ChevronRight, ArrowRightLeft } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import ScheduleInterviewModal from "@/components/hcm/ScheduleInterviewModal";
import StageBadge from "@/components/hcm/StageBadge";
import CandidateDrawer, {
  ActionMenu,
  ApplicationsTable,
  InterestIcon,
  PIPELINE_COLUMNS,
  REASON_STAGES,
  ReasonModal,
  daysInStage,
  fullName,
  moveTargets,
} from "@/components/hcm/CandidateDrawer";
import { Card, Badge, Spinner, EmptyState, ErrorBanner } from "@/components/hcm/ui";

const JOB_STATUS_STYLES = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Paused: "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-red-50 text-red-600 border-red-200",
};

const COLUMN_HINTS = {
  Interview: "Drop to schedule",
  Offer: "Set by offer workflow",
  Hired: "Set by offer workflow",
  Rejected: "Reason required",
};

export default function PipelinePage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {!user ? (
        <Spinner />
      ) : !can("application.view") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask an administrator for the application.view permission." />
      ) : (
        <Pipeline />
      )}
    </div>
  );
}

function Pipeline() {
  const { id } = useParams();
  const { can } = useInternalUser();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("board");
  const [openId, setOpenId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [reasonFor, setReasonFor] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [announce, setAnnounce] = useState("");

  const loadApps = useCallback(async () => {
    const data = await hcmJson(`/api/hcm/applications?job_id=${encodeURIComponent(id)}`);
    setApps(data.applications || []);
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [j] = await Promise.all([hcmJson(`/api/hcm/jobs?id=${encodeURIComponent(id)}&archived=1`), loadApps()]);
        if (!active) return;
        setJob(j.jobs?.[0] || null);
        if (!j.jobs?.length) setError("Job not found.");
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, loadApps]);

  const refresh = useCallback(() => {
    loadApps().catch((e) => setError(e.message));
  }, [loadApps]);

  const byStage = useMemo(() => {
    const out = Object.fromEntries([...PIPELINE_COLUMNS, "Withdrawn"].map((s) => [s, []]));
    for (const a of apps) (out[a.stage] ||= []).push(a);
    return out;
  }, [apps]);

  const dropTargets = useCallback(
    (app) => moveTargets(app.stage, can).filter((s) => PIPELINE_COLUMNS.includes(s) && s !== app.stage),
    [can]
  );

  const doMove = async (app, to, reason) => {
    const snapshot = app;
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, stage: to, stage_changed_at: new Date().toISOString() } : a)));
    setAnnounce(`${fullName(app)} moved to ${to}.`);
    try {
      const data = await hcmJson(`/api/hcm/applications/${app.id}`, { method: "POST", body: { action: "move", to, reason } });
      if (data.application) setApps((list) => list.map((a) => (a.id === app.id ? { ...a, ...data.application } : a)));
    } catch (e) {
      setApps((list) => list.map((a) => (a.id === app.id ? snapshot : a)));
      setAnnounce(`Could not move ${fullName(app)}.`);
      if (reason) throw e;
      setError(e.message);
    }
  };

  const requestMove = (app, to) => {
    if (to === app.stage && to !== "Interview") return;
    if (to === "Interview") return setScheduleFor(app);
    if (REASON_STAGES.includes(to)) return setReasonFor({ app, to });
    doMove(app, to);
  };

  const menuItems = (app) =>
    moveTargets(app.stage, can).map((s) => ({
      label: s === "Interview" ? (app.stage === "Interview" ? "Schedule next round" : "Interview (schedule)") : s,
      danger: REASON_STAGES.includes(s),
      onSelect: () => requestMove(app, s),
    }));

  if (loading) return <Spinner />;
  if (!job) return <ErrorBanner message={error || "Job not found."} />;

  const draggingApp = dragging ? apps.find((a) => a.id === dragging) : null;
  const validTargets = draggingApp ? dropTargets(draggingApp) : [];

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/dashboard/careers" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All jobs
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
              {job.title}
              <Badge className={JOB_STATUS_STYLES[job.status]}>{job.status}</Badge>
              {job.archived && <Badge>Archived</Badge>}
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{job.departments?.name || "No department"}</span>
              <span>{job.locations?.name || job.location}</span>
              <span>
                {job.openings} opening{job.openings === 1 ? "" : "s"}
              </span>
              <span>
                {job.active_count} active / {job.applicant_count} total
              </span>
              {job.hiring_manager && <span>Hiring manager: {job.hiring_manager.full_name}</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {job.status === "Open" && job.slug && (
              <a
                href={`/careers/${job.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" /> Public page
              </a>
            )}
            {can("job.manage") && (
              <Link
                href={`/admin/dashboard/careers?edit=${job.id}`}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" /> Edit job
              </Link>
            )}
            <div role="group" aria-label="View" className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5">
              {[
                { key: "board", label: "Board", icon: KanbanSquare },
                { key: "table", label: "Table", icon: Table2 },
              ].map((v) => (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={view === v.key}
                  onClick={() => setView(v.key)}
                  className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-sm font-semibold cursor-pointer ${
                    view === v.key ? "bg-brand-teal-500 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <v.icon className="w-4 h-4" aria-hidden="true" /> {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ErrorBanner message={error} onClose={() => setError("")} />
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      {view === "table" ? (
        <Card>
          <ApplicationsTable applications={apps} canBulk={can("application.move")} onOpen={setOpenId} onChanged={refresh} />
        </Card>
      ) : apps.length === 0 ? (
        <EmptyState icon={Briefcase} title="No applicants yet" description="Candidates who apply to this job appear here." />
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto pb-4" aria-label="Pipeline board">
            {PIPELINE_COLUMNS.map((stage) => {
              const valid = validTargets.includes(stage);
              const isSource = draggingApp?.stage === stage;
              const state = !draggingApp ? "idle" : valid ? "valid" : isSource ? "source" : "invalid";
              return (
                <section
                  key={stage}
                  aria-label={`${stage} column, ${byStage[stage].length} candidates`}
                  onDragOver={(e) => {
                    if (!valid) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overColumn !== stage) setOverColumn(stage);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn((c) => (c === stage ? null : c));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const app = apps.find((a) => a.id === e.dataTransfer.getData("text/plain")) || draggingApp;
                    setDragging(null);
                    setOverColumn(null);
                    if (app && dropTargets(app).includes(stage)) requestMove(app, stage);
                  }}
                  className={`w-72 shrink-0 flex flex-col rounded-2xl border transition-all ${
                    state === "valid"
                      ? overColumn === stage
                        ? "border-brand-teal-400 bg-brand-teal-50 ring-2 ring-brand-teal-200"
                        : "border-brand-teal-300 bg-brand-teal-50/40 border-dashed"
                      : state === "invalid"
                      ? "border-slate-200 bg-slate-50 opacity-40"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <header className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StageBadge stage={stage} />
                      <span className="text-xs font-semibold text-slate-500">{byStage[stage].length}</span>
                    </div>
                    {COLUMN_HINTS[stage] && <span className="text-[10px] text-slate-400">{COLUMN_HINTS[stage]}</span>}
                  </header>
                  <ul className="flex-1 px-2 pb-2 space-y-2 min-h-[120px] max-h-[calc(100vh-18rem)] overflow-y-auto">
                    {byStage[stage].map((app) => (
                      <PipelineCard
                        key={app.id}
                        app={app}
                        draggable={dropTargets(app).length > 0}
                        dragging={dragging === app.id}
                        menuItems={menuItems(app)}
                        canOffer={can("offer.create")}
                        onOpen={() => setOpenId(app.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", app.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragging(app.id);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setOverColumn(null);
                        }}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {byStage.Withdrawn.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                aria-expanded={showWithdrawn}
                onClick={() => setShowWithdrawn((v) => !v)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {showWithdrawn ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                Withdrawn ({byStage.Withdrawn.length})
              </button>
              {showWithdrawn && (
                <ul className="mt-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {byStage.Withdrawn.map((app) => (
                    <PipelineCard key={app.id} app={app} draggable={false} menuItems={[]} onOpen={() => setOpenId(app.id)} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {reasonFor && (
        <ReasonModal
          title={`${reasonFor.to === "Rejected" ? "Reject" : "Withdraw"} ${fullName(reasonFor.app)}`}
          description={reasonFor.to === "Rejected" ? "The candidate is notified that they were not selected." : "Record why this application is withdrawn."}
          confirmLabel={reasonFor.to === "Rejected" ? "Reject" : "Withdraw"}
          onClose={() => setReasonFor(null)}
          onSubmit={async (reason) => {
            await doMove(reasonFor.app, reasonFor.to, reason);
            setReasonFor(null);
          }}
        />
      )}

      {scheduleFor && (
        <ScheduleInterviewModal
          application={{ id: scheduleFor.id, name: fullName(scheduleFor), position: scheduleFor.position }}
          rounds={job.interview_rounds || []}
          nextRound={(scheduleFor.current_round || 0) + 1}
          onClose={() => setScheduleFor(null)}
          onSaved={() => {
            setScheduleFor(null);
            refresh();
          }}
        />
      )}

      {openId && <CandidateDrawer applicationId={openId} onClose={() => setOpenId(null)} onChanged={refresh} />}
    </>
  );
}

function PipelineCard({ app, draggable, dragging = false, menuItems, canOffer = false, onOpen, onDragStart, onDragEnd }) {
  const days = daysInStage(app);
  const tags = app.tags || [];
  return (
    <li
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-brand-teal-300 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${dragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="text-left min-w-0 flex-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-200 rounded"
          aria-label={`Open ${fullName(app)}, ${app.stage}`}
        >
          <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <span className="truncate">{fullName(app)}</span>
            <InterestIcon value={app.manager_interest} />
          </span>
          {(app.job_title || app.employer) && (
            <span className="block text-xs text-slate-500 truncate">{[app.job_title, app.employer].filter(Boolean).join(" · ")}</span>
          )}
        </button>
        {app.stage === "Interview" && app.current_round > 0 && (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">R{app.current_round}</Badge>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
        {app.experience && <span>{app.experience}</span>}
        {days !== null && <span title="Days in current stage">{days}d in stage</span>}
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-brand-teal-50 border border-brand-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-teal-700">
              {t}
            </span>
          ))}
          {tags.length > 4 && <span className="text-[10px] text-slate-400">+{tags.length - 4}</span>}
        </div>
      )}
      {app.stage === "Selected" && (
        <p className="mt-2 text-[11px] text-slate-500">
          {canOffer ? (
            <Link href={`/admin/dashboard/offers?application=${app.id}`} className="text-brand-teal-700 font-semibold hover:underline">
              Create an offer from the Offers page
            </Link>
          ) : (
            "Awaiting offer"
          )}
        </p>
      )}
      {menuItems.length > 0 && (
        <div className="mt-2 flex justify-end">
          <ActionMenu label="Move to…" ariaLabel={`Move ${fullName(app)} to stage`} icon={ArrowRightLeft} items={menuItems} variant="ghost" />
        </div>
      )}
    </li>
  );
}
