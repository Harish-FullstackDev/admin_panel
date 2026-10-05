"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, Lock, Video, MapPin, Phone, Check, AlertTriangle, FileText, ClipboardCheck, ExternalLink } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import ScheduleInterviewModal from "@/components/hcm/ScheduleInterviewModal";
import { PageHeader, Card, Button, Field, Textarea, Badge, Spinner, EmptyState, ErrorBanner, Modal, formatDate } from "@/components/hcm/ui";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

const MODE = {
  online: { label: "Online", icon: Video },
  onsite: { label: "Onsite", icon: MapPin },
  phone: { label: "Phone", icon: Phone },
};

const STATUS_STYLES = {
  Scheduled: "bg-purple-50 text-purple-700 border-purple-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const REC_STYLES = {
  "Strong hire": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Hire: "bg-teal-50 text-teal-700 border-teal-200",
  "No hire": "bg-orange-50 text-orange-700 border-orange-200",
  "Strong no hire": "bg-red-50 text-red-700 border-red-200",
};

const SCALE = [1, 2, 3, 4, 5];

function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const base = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (same(d, today)) return `Today · ${base}`;
  if (same(d, tomorrow)) return `Tomorrow · ${base}`;
  if (same(d, yesterday)) return `Yesterday · ${base}`;
  return base;
}

export default function InterviewsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <Suspense fallback={<Spinner />}>
        <InterviewsGate />
      </Suspense>
    </div>
  );
}

function InterviewsGate() {
  const { user, can } = useInternalUser();
  if (!user) return <Spinner />;
  if (!can("interview.view")) {
    return <EmptyState icon={Lock} title="You don't have access to this page" description="Ask an administrator for the interview.view permission." />;
  }
  return <InterviewsManager />;
}

function InterviewsManager() {
  const { can } = useInternalUser();
  const params = useSearchParams();
  const focusId = params.get("focus");
  const canSchedule = can("interview.schedule");

  const [tab, setTab] = useState(focusId ? "all" : "upcoming");
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scorecardFor, setScorecardFor] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const focusHandled = useRef(false);

  const load = useCallback(async (scope) => {
    setLoading(true);
    setError("");
    try {
      const data = await hcmJson(`/api/hcm/interviews?scope=${scope}`);
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  useEffect(() => {
    if (!focusId || focusHandled.current || loading) return;
    const target = interviews.find((i) => i.id === focusId);
    if (!target) return;
    focusHandled.current = true;
    requestAnimationFrame(() => {
      const el = document.getElementById(`interview-${focusId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    });
    if (target.on_panel) setScorecardFor(target);
  }, [focusId, interviews, loading]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const i of interviews) {
      const key = dayKey(i.scheduled_at);
      if (!map.has(key)) map.set(key, { key, label: dayLabel(i.scheduled_at), items: [] });
      map.get(key).items.push(i);
    }
    return [...map.values()];
  }, [interviews]);

  const complete = async (interview) => {
    setCompletingId(interview.id);
    setError("");
    try {
      await hcmJson(`/api/hcm/interviews/${interview.id}`, { method: "PATCH", body: { action: "complete" } });
      await load(tab);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title={canSchedule ? "Interviews" : "My Interviews"}
        description={canSchedule ? "All scheduled interviews, panel feedback and reschedule requests." : "Interviews you are on the panel for. Submit your scorecard after each one."}
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <div role="tablist" aria-label="Interview filter" className="inline-flex gap-1 p-1 mb-5 rounded-xl bg-slate-100">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`h-8 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={tab === "upcoming" ? "No upcoming interviews" : tab === "past" ? "No past interviews" : "No interviews yet"}
          description={canSchedule ? "Schedule interviews from an application in the Careers pipeline." : "You'll see interviews here once you are added to a panel."}
        />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">{g.label}</h2>
              <ul className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {g.items.map((i) => (
                  <InterviewRow
                    key={i.id}
                    interview={i}
                    focused={i.id === focusId}
                    canSchedule={canSchedule}
                    completing={completingId === i.id}
                    onScorecard={() => setScorecardFor(i)}
                    onReschedule={() => setRescheduling(i)}
                    onCancel={() => setCancelling(i)}
                    onComplete={() => complete(i)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {scorecardFor && (
        <ScorecardModal
          interview={scorecardFor}
          onClose={() => setScorecardFor(null)}
          onSaved={() => load(tab)}
        />
      )}

      {rescheduling && (
        <ScheduleInterviewModal
          application={{ id: rescheduling.application_id, name: rescheduling.candidate_name, position: rescheduling.position }}
          interview={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={() => {
            setRescheduling(null);
            load(tab);
          }}
        />
      )}

      {cancelling && (
        <CancelModal
          interview={cancelling}
          onClose={() => setCancelling(null)}
          onDone={() => {
            setCancelling(null);
            load(tab);
          }}
        />
      )}
    </>
  );
}

function InterviewRow({ interview: i, focused, canSchedule, completing, onScorecard, onReschedule, onCancel, onComplete }) {
  const mode = MODE[i.mode] || { label: i.mode, icon: CalendarClock };
  const ModeIcon = mode.icon;
  const start = new Date(i.scheduled_at);
  const end = new Date(start.getTime() + (i.duration_min || 0) * 60000);
  const scheduled = i.status === "Scheduled";
  const isLink = i.meeting_link && /^https?:\/\//i.test(i.meeting_link);

  return (
    <li
      id={`interview-${i.id}`}
      tabIndex={-1}
      className={`p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 focus:outline-none ${
        focused ? "bg-brand-teal-50 ring-2 ring-inset ring-brand-teal-300 first:rounded-t-2xl last:rounded-b-2xl" : ""
      }`}
    >
      <div className="lg:w-32 shrink-0">
        <p className="text-sm font-bold text-slate-900">{start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
        <p className="text-[11px] text-slate-400">
          to {end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {i.duration_min} min
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{i.candidate_name}</span>
          <Badge className={STATUS_STYLES[i.status]}>{i.status}</Badge>
          {scheduled && i.candidate_confirmed_at && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Check className="w-3 h-3 mr-0.5" aria-hidden="true" /> Candidate confirmed
            </Badge>
          )}
          {scheduled && i.reschedule_request && (
            <Badge className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-0.5" aria-hidden="true" /> Reschedule requested
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {i.position} · {i.round_name}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 min-w-0">
            <ModeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            {mode.label}
            {i.mode === "onsite" && i.location && <span className="truncate">· {i.location}</span>}
            {i.mode !== "onsite" && i.meeting_link && (
              <>
                {" · "}
                {isLink ? (
                  <a href={i.meeting_link} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-teal-600 hover:underline inline-flex items-center gap-0.5">
                    Join link <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="truncate">{i.meeting_link}</span>
                )}
              </>
            )}
          </span>
          <span className="truncate">Panel: {i.panel.map((p) => p.name).join(", ") || "—"}</span>
          <span className="text-slate-400">
            {i.scorecards_submitted}/{i.panel.length} scorecards
          </span>
        </div>
        {scheduled && i.reschedule_request && <p className="mt-1.5 text-xs text-amber-800">Candidate note: {i.reschedule_request}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
        {i.on_panel && (
          <>
            {i.my_scorecard === "Submitted" ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">My scorecard: submitted</Badge>
            ) : i.my_scorecard === "Draft" ? (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">My scorecard: draft</Badge>
            ) : (
              i.status !== "Cancelled" && <Badge>My scorecard: pending</Badge>
            )}
            {i.status !== "Cancelled" && (
              <Button size="sm" variant={i.my_scorecard === "Submitted" ? "secondary" : "primary"} onClick={onScorecard}>
                <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" /> Open scorecard
              </Button>
            )}
          </>
        )}
        {canSchedule && scheduled && (
          <>
            <Button size="sm" variant="secondary" onClick={onReschedule}>Reschedule</Button>
            {start.getTime() <= Date.now() && (
              <Button size="sm" variant="secondary" onClick={onComplete} loading={completing}>Mark completed</Button>
            )}
            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={onCancel}>Cancel</Button>
          </>
        )}
      </div>
    </li>
  );
}

function CancelModal({ interview, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason.trim()) return setError("A reason is required to cancel.");
    setSaving(true);
    setError("");
    try {
      await hcmJson(`/api/hcm/interviews/${interview.id}`, { method: "PATCH", body: { action: "cancel", reason: reason.trim() } });
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Cancel interview · ${interview.candidate_name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Keep interview</Button>
          <Button variant="danger" onClick={submit} loading={saving}>Cancel interview</Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="text-sm text-slate-600 mb-4">
        {interview.round_name} on {formatDate(interview.scheduled_at, true)}. The candidate and panel will be notified.
      </p>
      <Field label="Reason" required>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
      </Field>
    </Modal>
  );
}

function RatingRow({ criterion, value, onChange, disabled }) {
  const name = `rating-${criterion.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <fieldset className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5">
      <legend className="sr-only">{criterion}</legend>
      <span className="sm:w-44 text-sm font-medium text-slate-700" aria-hidden="true">
        {criterion}
      </span>
      <div className="flex gap-1.5">
        {SCALE.map((n) => (
          <label key={n} className="relative">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              disabled={disabled}
              className="peer sr-only"
              aria-label={`${criterion}: ${n} of 5`}
            />
            <span
              className={`flex items-center justify-center size-9 rounded-lg border text-sm font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-teal-300 ${
                value === n ? "bg-brand-teal-500 border-brand-teal-500 text-white" : "bg-white border-slate-200 text-slate-600"
              } ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:border-brand-teal-300"}`}
              aria-hidden="true"
            >
              {n}
            </span>
          </label>
        ))}
      </div>
      <span className="text-[11px] text-slate-400 sm:ml-2">1 = poor · 5 = excellent</span>
    </fieldset>
  );
}

function FeedbackCard({ card, criteria }) {
  const ratings = card.ratings || {};
  const keys = [...new Set([...criteria, ...Object.keys(ratings)])].filter((k) => ratings[k]);
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{card.interviewer_name}</span>
        {card.recommendation && <Badge className={REC_STYLES[card.recommendation]}>{card.recommendation}</Badge>}
      </div>
      {keys.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-500">
          {keys.map((k) => `${k}: ${ratings[k]}/5`).join(" · ")}
        </p>
      )}
      {card.comments && <p className="mt-1.5 text-xs text-slate-700 whitespace-pre-line">{card.comments}</p>}
      {card.submitted_at && <p className="mt-1 text-[11px] text-slate-400">Submitted {formatDate(card.submitted_at, true)}</p>}
    </div>
  );
}

function ScorecardModal({ interview, onClose, onSaved }) {
  const { user, can } = useInternalUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [criteria, setCriteria] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [detail, setDetail] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [saving, setSaving] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sc, app] = await Promise.all([
        hcmJson(`/api/hcm/scorecards?interview_id=${interview.id}`),
        hcmJson(`/api/hcm/applications/${interview.application_id}`).catch(() => null),
      ]);
      setCriteria(sc.criteria || []);
      setRecommendations(sc.recommendations || []);
      setScorecard(sc.scorecard);
      setRatings(sc.scorecard?.ratings || {});
      setComments(sc.scorecard?.comments || "");
      setRecommendation(sc.scorecard?.recommendation || "");
      setDetail(app);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [interview.id, interview.application_id]);

  useEffect(() => {
    load();
  }, [load]);

  const locked = Boolean(scorecard?.submitted_at);
  const started = new Date(interview.scheduled_at).getTime() <= Date.now();
  const complete = criteria.every((c) => ratings[c]) && Boolean(recommendation);

  const save = async (submit) => {
    setSaving(submit ? "submit" : "draft");
    setError("");
    setNotice("");
    try {
      const data = await hcmJson("/api/hcm/scorecards", {
        method: "POST",
        body: { interview_id: interview.id, ratings, comments, recommendation: recommendation || null, submit },
      });
      setScorecard(data.scorecard);
      setConfirming(false);
      setNotice(submit ? "Scorecard submitted." : "Draft saved.");
      onSaved();
      if (submit) await load();
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    } finally {
      setSaving("");
    }
  };

  const reopen = async () => {
    setSaving("reopen");
    setError("");
    try {
      await hcmJson("/api/hcm/scorecards", { method: "PATCH", body: { id: scorecard.id } });
      setNotice("Scorecard reopened for edits.");
      onSaved();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving("");
    }
  };

  const app = detail?.application;
  const otherInterviews = (detail?.interviews || []).filter((iv) => iv.id !== interview.id && iv.status !== "Cancelled");
  const currentOthers = ((detail?.interviews || []).find((iv) => iv.id === interview.id)?.scorecards || []).filter(
    (s) => s.interviewer_id !== user?.id && s.submitted_at
  );

  let footer;
  if (loading) footer = null;
  else if (locked) {
    footer = (
      <>
        {can("scorecard.reopen") && (
          <Button variant="secondary" onClick={reopen} loading={saving === "reopen"}>Reopen for edits</Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </>
    );
  } else if (confirming) {
    footer = (
      <>
        <span className="mr-auto self-center text-xs text-slate-600">Submitting locks your scorecard. Continue?</span>
        <Button variant="secondary" onClick={() => setConfirming(false)}>Back</Button>
        <Button onClick={() => save(true)} loading={saving === "submit"}>Yes, submit</Button>
      </>
    );
  } else {
    footer = (
      <>
        <Button variant="secondary" onClick={() => save(false)} loading={saving === "draft"}>Save draft</Button>
        <Button onClick={() => setConfirming(true)} disabled={!complete || !started || Boolean(saving)}>Submit</Button>
      </>
    );
  }

  return (
    <Modal wide title={`Scorecard · ${interview.candidate_name}`} onClose={onClose} footer={footer}>
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <p role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{interview.candidate_name}</p>
                <p className="text-xs text-slate-500">
                  {interview.position} · {interview.round_name} · {formatDate(interview.scheduled_at, true)}
                </p>
              </div>
              {app?.resume_signed_url && (
                <a
                  href={app.resume_signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" /> View resume
                </a>
              )}
            </div>
            {app && (
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                {[
                  ["Experience", app.experience],
                  ["Current role", [app.job_title, app.employer].filter(Boolean).join(" at ")],
                  ["Location", [app.city, app.country].filter(Boolean).join(", ")],
                  ["Key skills", app.key_skills],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-2 min-w-0">
                      <dt className="text-slate-400 shrink-0">{k}</dt>
                      <dd className="text-slate-700 truncate">{v}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </section>

          <section aria-labelledby="prior-feedback">
            <h3 id="prior-feedback" className="text-sm font-bold text-slate-900 mb-2">
              Panel feedback
            </h3>
            <p className="text-xs text-slate-500 mb-3">Other panelists&apos; feedback appears after you submit yours.</p>
            {otherInterviews.length === 0 && currentOthers.length === 0 ? (
              <p className="text-xs text-slate-400">No other feedback visible yet.</p>
            ) : (
              <div className="space-y-4">
                {currentOthers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">This round</p>
                    <div className="grid gap-2">
                      {currentOthers.map((s) => (
                        <FeedbackCard key={s.id} card={s} criteria={criteria} />
                      ))}
                    </div>
                  </div>
                )}
                {otherInterviews.map((iv) => {
                  const cards = (iv.scorecards || []).filter((s) => s.submitted_at);
                  return (
                    <div key={iv.id}>
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        {iv.round_name} · {formatDate(iv.scheduled_at)}
                      </p>
                      {cards.length ? (
                        <div className="grid gap-2">
                          {cards.map((s) => (
                            <FeedbackCard key={s.id} card={s} criteria={criteria} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No visible feedback for this round.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="my-scorecard">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 id="my-scorecard" className="text-sm font-bold text-slate-900">
                Your scorecard
              </h3>
              {locked ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <Lock className="w-3 h-3 mr-0.5" aria-hidden="true" /> Submitted {formatDate(scorecard.submitted_at, true)}
                </Badge>
              ) : scorecard ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200">Draft</Badge>
              ) : null}
            </div>
            {!locked && !started && (
              <p className="mb-3 text-xs text-amber-700">You can save a draft now and submit once the interview has started.</p>
            )}
            {locked && <p className="mb-3 text-xs text-slate-500">This scorecard is locked. Ask HR to reopen it if you need to make changes.</p>}

            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {criteria.map((c) => (
                <RatingRow key={c} criterion={c} value={ratings[c] || null} disabled={locked} onChange={(n) => setRatings((r) => ({ ...r, [c]: n }))} />
              ))}
            </div>

            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-slate-600 mb-2">
                Recommendation {!locked && <span className="text-red-500">*</span>}
              </legend>
              <div className="flex flex-wrap gap-2">
                {recommendations.map((r) => (
                  <label key={r} className="relative">
                    <input
                      type="radio"
                      name="recommendation"
                      value={r}
                      checked={recommendation === r}
                      onChange={() => setRecommendation(r)}
                      disabled={locked}
                      className="peer sr-only"
                    />
                    <span
                      className={`inline-flex items-center h-9 px-3.5 rounded-xl border text-xs font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-teal-300 ${
                        recommendation === r ? REC_STYLES[r] || "bg-brand-teal-50 border-brand-teal-300 text-brand-teal-700" : "bg-white border-slate-200 text-slate-600"
                      } ${locked ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:border-slate-300"} ${recommendation === r ? "ring-1 ring-current" : ""}`}
                    >
                      {r}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Comments" className="mt-4">
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                disabled={locked}
                placeholder="Strengths, concerns and evidence from the interview."
              />
            </Field>
            {!locked && !complete && <p className="mt-2 text-[11px] text-slate-400">Rate every criterion and choose a recommendation to submit.</p>}
          </section>
        </div>
      )}
    </Modal>
  );
}
