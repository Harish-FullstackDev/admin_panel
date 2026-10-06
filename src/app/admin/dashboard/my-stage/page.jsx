"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, FileText, Hourglass, UserRound, Users } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { Card, Button, Field, Textarea, Spinner, EmptyState, ErrorBanner, Badge, formatDate } from "@/components/hcm/ui";
import { StatusChip, daysFromToday } from "@/components/hcm/onboarding";
import { ReviewForm, ReviewSummary, Stars, LetterModal, REVIEW_LABELS } from "@/components/hcm/stage";

export default function MyStagePage() {
  const { user } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !user.stageRecord ? (
        <EmptyState icon={Hourglass} title="You're not on an internship or probation" description="Letters from completed periods are on your profile." />
      ) : (
        <Tracker id={user.stageRecord.id} />
      )}
    </div>
  );
}

function Tracker({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [letterId, setLetterId] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/probation/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const { record, employee, tasks, updates, reviews, letters, criteria } = data;
  const left = daysFromToday(record.end_date);
  const label = record.type === "Intern" ? "internship" : "probation";
  const byType = Object.fromEntries(reviews.map((r) => [r.type, r]));
  const active = record.status === "Active";

  const updateTask = async (task, body) => {
    setError("");
    try {
      await hcmJson(`/api/hcm/tasks/${task.id}`, { method: "PATCH", body });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveSelf = async (body, submit) => {
    const res = await hcmJson(`/api/hcm/probation/${id}`, { method: "POST", body: { action: submit ? "submit_review" : "save_review", ...body } });
    setData(res);
    setNotice(submit ? "Self-assessment submitted." : "Draft saved.");
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-600">My {label}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
          {left > 0 ? `${left} day${left === 1 ? "" : "s"} to go` : left === 0 ? "Last day today" : "Period ended"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {formatDate(record.start_date)} – {formatDate(record.end_date)}
          {record.extension_count > 0 && ` · extended ×${record.extension_count}`}
        </p>
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
      {record.status === "Pending approval" && (
        <div className="mb-4 p-3 rounded-xl border border-orange-200 bg-orange-50 text-sm text-orange-800">HR has made a decision about your {label} and it is awaiting final approval.</div>
      )}

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: UserRound, label: "Manager", value: employee.manager?.full_name },
          { icon: Users, label: "Mentor", value: record.mentor?.full_name },
          { icon: CalendarDays, label: "Mid-point review", value: formatDate(record.mid_review_date) },
          { icon: CalendarDays, label: "Final review", value: formatDate(record.final_review_date) },
        ].map(({ icon: Icon, label: l, value }) => (
          <div key={l} className="p-4 bg-white border border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-500 inline-flex items-center gap-1">
              <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {l}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <Card title="My tasks">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500">Your manager hasn&apos;t assigned any tasks yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} disabled={!active} onUpdate={(body) => updateTask(t, body)} />
              ))}
            </ul>
          )}
        </Card>

        <WeeklyUpdate recordId={id} currentWeek={data.currentWeek} updates={updates} disabled={!active} onSaved={async (msg) => { setNotice(msg); await load(); }} />

        <Card
          title={REVIEW_LABELS.self}
          actions={byType.self?.submitted_at ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Submitted</Badge> : null}
        >
          {byType.self?.submitted_at ? (
            <ReviewSummary review={byType.self} criteria={criteria} />
          ) : active ? (
            <ReviewForm key={byType.self?.updated_at || "self"} type="self" criteria={criteria} review={byType.self} onSave={saveSelf} />
          ) : (
            <p className="text-sm text-slate-500">Not submitted.</p>
          )}
        </Card>

        {["mid", "final"].map((type) =>
          byType[type]?.submitted_at ? (
            <Card key={type} title={REVIEW_LABELS[type]}>
              <ReviewSummary review={byType[type]} criteria={criteria} />
            </Card>
          ) : null
        )}

        {letters.length > 0 && (
          <Card title="Letters">
            <ul className="divide-y divide-slate-100 -my-2">
              {letters.map((l) => (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">{l.title}</span>
                  <Button size="sm" variant="secondary" onClick={() => setLetterId(l.id)}>
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Open
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
      {letterId && <LetterModal letterId={letterId} onClose={() => setLetterId(null)} />}
    </>
  );
}

function TaskRow({ task, disabled, onUpdate }) {
  const [progress, setProgress] = useState(task.status === "Done" ? 100 : task.progress || 0);
  const open = task.status === "Open";
  return (
    <li className="py-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <p className={`text-sm font-semibold ${task.status === "Skipped" ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</p>
        {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
        {task.due_date && <p className="text-[11px] text-slate-400">Due {formatDate(task.due_date)}</p>}
      </div>
      {open && !disabled ? (
        <>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              onMouseUp={() => onUpdate({ progress })}
              onTouchEnd={() => onUpdate({ progress })}
              onKeyUp={() => onUpdate({ progress })}
              aria-label={`Progress on ${task.title}`}
              className="w-28 accent-brand-teal-600"
            />
            <span className="w-9 tabular-nums">{progress}%</span>
          </label>
          <Button size="sm" onClick={() => onUpdate({ status: "Done" })}>
            Mark done
          </Button>
        </>
      ) : (
        <StatusChip status={task.status} />
      )}
    </li>
  );
}

function WeeklyUpdate({ recordId, currentWeek, updates, disabled, onSaved }) {
  const thisWeek = updates.find((u) => u.week_start === currentWeek);
  const [form, setForm] = useState({ summary: thisWeek?.summary || "", blockers: thisWeek?.blockers || "", next_week: thisWeek?.next_week || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const locked = Boolean(thisWeek?.mentor_rating) || disabled;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await hcmJson(`/api/hcm/probation/${recordId}/updates`, { method: "POST", body: form });
      await onSaved(res.created ? "Weekly update posted." : "Weekly update edited.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const history = updates.filter((u) => u !== thisWeek);
  return (
    <Card title="Weekly update" actions={thisWeek ? <Badge>{thisWeek.mentor_rating ? "Reviewed" : "Posted · editable this week"}</Badge> : <Badge className="bg-amber-50 text-amber-700 border-amber-200">Due this week</Badge>}>
      <ErrorBanner message={error} onClose={() => setError("")} />
      {locked && thisWeek ? (
        <div className="text-sm space-y-1">
          <p className="text-slate-800 whitespace-pre-line">{thisWeek.summary}</p>
          {thisWeek.mentor_comment && <p className="text-xs text-brand-teal-800 bg-brand-teal-50 rounded-lg p-2">{thisWeek.mentor_comment}</p>}
        </div>
      ) : !disabled ? (
        <div className="space-y-3">
          <Field label="What did you work on this week?" required>
            <Textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Blockers">
              <Textarea rows={2} value={form.blockers} onChange={(e) => setForm((f) => ({ ...f, blockers: e.target.value }))} />
            </Field>
            <Field label="Plan for next week">
              <Textarea rows={2} value={form.next_week} onChange={(e) => setForm((f) => ({ ...f, next_week: e.target.value }))} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} loading={saving} disabled={!form.summary.trim()}>
              {thisWeek ? "Save changes" : "Post update"}
            </Button>
          </div>
        </div>
      ) : null}

      {history.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Earlier weeks</p>
          <ul className="space-y-3">
            {history.map((u) => (
              <li key={u.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">Week of {formatDate(u.week_start)}</span>
                  <Stars value={u.mentor_rating} />
                </div>
                <p className="text-slate-600 whitespace-pre-line">{u.summary}</p>
                {u.mentor_comment && <p className="text-xs text-brand-teal-800 bg-brand-teal-50 rounded-lg p-2 mt-1">{u.mentor_comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
