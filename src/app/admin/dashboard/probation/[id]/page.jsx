"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, Gavel, Plus, Settings2, XCircle } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { Card, Button, Field, Input, Textarea, Select, Spinner, ErrorBanner, Modal, Badge, formatDate } from "@/components/hcm/ui";
import { StatusChip, ProgressBar, relativeDays, daysFromToday, useOrgLists } from "@/components/hcm/onboarding";
import { ReviewForm, ReviewSummary, RatingButtons, Stars, LetterModal, REVIEW_LABELS } from "@/components/hcm/stage";

export default function StageRecordPage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{!user ? <Spinner /> : <StageDetail />}</div>;
}

function StageDetail() {
  const { id } = useParams();
  const { can } = useInternalUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("Tasks");
  const [dialog, setDialog] = useState(null);
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

  const act = async (body, message) => {
    setError("");
    const res = await hcmJson(`/api/hcm/probation/${id}`, { method: "POST", body });
    setData(res);
    if (message) setNotice(message);
    return res;
  };

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const { record, employee, access } = data;
  const open = record.status !== "Completed";
  const left = daysFromToday(record.end_date);
  const tabs = ["Tasks", "Weekly updates", "Reviews", "Letters", ...(access.manage || access.approve ? ["Activity"] : [])];

  return (
    <>
      {(can("probation.review") || can("probation.manage")) && (
        <Link href="/admin/dashboard/probation" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Interns & Probation
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              <Link href={`/admin/dashboard/employees/${employee.id}`} className="hover:text-brand-teal-700">
                {employee.full_name}
              </Link>
            </h1>
            <StatusChip status={record.type} />
            <StatusChip status={record.outcome || record.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {employee.designation || "—"} · {employee.employee_code} · {formatDate(record.start_date)} – {formatDate(record.end_date)}
            {open && <span className={left <= 15 ? "font-semibold text-red-600" : ""}> ({relativeDays(record.end_date)})</span>}
            {record.extension_count > 0 && ` · extended ×${record.extension_count}`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Manager: {employee.manager?.full_name || "—"} · Mentor: {record.mentor?.full_name || "—"} · Mid-point review {formatDate(record.mid_review_date)} · Final review{" "}
            {formatDate(record.final_review_date)}
          </p>
        </div>
        {access.manage && open && (
          <Button variant="secondary" onClick={() => setDialog("settings")}>
            <Settings2 className="w-4 h-4" aria-hidden="true" /> Mentor & dates
          </Button>
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

      <OutcomePanel data={data} onDecide={() => setDialog("outcome")} onApprove={(decision) => setDialog({ decision })} onLetter={setLetterId} />

      <div role="tablist" aria-label="Sections" className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {tabs.map((t) => (
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

      {tab === "Tasks" && <TasksTab data={data} open={open} onAdd={(t) => act({ action: "add_task", ...t }, "Task assigned.")} onChanged={load} setError={setError} />}
      {tab === "Weekly updates" && <UpdatesTab data={data} onRate={(body) => act({ action: "rate_update", ...body }, "Feedback saved.")} />}
      {tab === "Reviews" && <ReviewsTab data={data} open={open} act={act} setError={setError} />}
      {tab === "Letters" && <LettersList letters={data.letters} onOpen={setLetterId} />}
      {tab === "Activity" && <ActivityList activity={data.activity} />}

      {dialog === "settings" && <SettingsDialog record={record} employeeId={employee.id} onClose={() => setDialog(null)} onSaved={(res) => { setData(res); setDialog(null); setNotice("Saved."); }} />}
      {dialog === "outcome" && (
        <OutcomeDialog
          record={record}
          onClose={() => setDialog(null)}
          onSubmit={async (body) => {
            const res = await act({ action: "propose_outcome", ...body });
            setDialog(null);
            setNotice(res.record.status === "Pending approval" ? "Sent to the CHRO for approval." : `Outcome recorded: ${res.record.outcome}. Letter issued.`);
          }}
        />
      )}
      {dialog?.decision && (
        <DecisionDialog
          decision={dialog.decision}
          record={record}
          onClose={() => setDialog(null)}
          onSubmit={async (comment) => {
            await act({ action: "decide_outcome", decision: dialog.decision, comment });
            setDialog(null);
            setNotice(dialog.decision === "Approved" ? "Approved. The outcome has been applied." : "Rejected and returned to HR.");
          }}
        />
      )}
      {letterId && <LetterModal letterId={letterId} onClose={() => setLetterId(null)} />}
    </>
  );
}

function OutcomePanel({ data, onDecide, onApprove, onLetter }) {
  const { record, access, approvals, letters } = data;
  if (record.status === "Completed") {
    return (
      <div className="mb-5 p-4 rounded-2xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Outcome: {record.outcome}</p>
          <p className="text-xs text-slate-500">
            Closed {formatDate(record.closed_at)}
            {record.outcome_note ? ` · ${record.outcome_note}` : ""}
          </p>
        </div>
        {letters[0] && (
          <Button variant="secondary" size="sm" onClick={() => onLetter(letters[0].id)}>
            <FileText className="w-3.5 h-3.5" aria-hidden="true" /> {letters[0].title}
          </Button>
        )}
      </div>
    );
  }
  if (record.status === "Pending approval") {
    const detail =
      record.proposed_outcome === "Extended" ? `Extend until ${formatDate(record.proposed_end_date)}` : `Release · last working day ${formatDate(record.proposed_last_day)}`;
    return (
      <div className="mb-5 p-4 rounded-2xl border border-orange-200 bg-orange-50/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Waiting for CHRO approval: {detail}</p>
            {record.proposed_note && <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{record.proposed_note}</p>}
          </div>
          {access.canDecide && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => onApprove("Rejected")}>
                <XCircle className="w-4 h-4" aria-hidden="true" /> Reject
              </Button>
              <Button onClick={() => onApprove("Approved")}>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  const rejected = [...approvals].reverse().find((a) => a.status === "Rejected");
  return (
    <div className="mb-5 p-4 rounded-2xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-slate-700">
          {record.recommendation ? (
            <>
              Manager recommends <span className="font-bold text-brand-teal-700">{record.recommendation}</span>
            </>
          ) : (
            "Outcome is decided after the final review."
          )}
        </p>
        {rejected && (
          <p className="text-xs text-red-600 mt-1">
            Last proposal rejected by {rejected.decided_by_name || "CHRO"}: {rejected.comment}
          </p>
        )}
      </div>
      {access.manage && !access.self && (
        <Button onClick={onDecide}>
          <Gavel className="w-4 h-4" aria-hidden="true" /> Decide outcome
        </Button>
      )}
    </div>
  );
}

function TasksTab({ data, open, onAdd, onChanged, setError }) {
  const { tasks, access } = data;
  const [adding, setAdding] = useState(false);
  const canAssign = open && (access.manage || access.review) && !access.self;

  const update = async (task, body) => {
    setError("");
    try {
      await hcmJson(`/api/hcm/tasks/${task.id}`, { method: "PATCH", body });
      await onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card
      title="Assigned tasks"
      actions={
        canAssign && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Assign task
          </Button>
        )
      }
    >
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No tasks assigned yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 -my-2">
          {tasks.map((t) => (
            <li key={t.id} className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className={`text-sm font-semibold ${t.status === "Skipped" ? "text-slate-400 line-through" : "text-slate-800"}`}>{t.title}</p>
                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                <p className="text-[11px] text-slate-400 mt-0.5">{t.due_date ? `Due ${formatDate(t.due_date)}` : "No due date"}</p>
              </div>
              <ProgressBar value={t.status === "Done" ? 100 : t.progress || 0} total={100} label="Progress" />
              <StatusChip status={t.status} />
              {canAssign && t.status === "Open" && (
                <Button size="sm" variant="ghost" onClick={() => update(t, { status: "Skipped" })}>
                  Cancel task
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <AddTaskDialog
          onClose={() => setAdding(false)}
          onSave={async (t) => {
            await onAdd(t);
            setAdding(false);
          }}
        />
      )}
    </Card>
  );
}

function AddTaskDialog({ onClose, onSave }) {
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title="Assign a task"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            disabled={!form.title.trim()}
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                await onSave({ ...form, due_date: form.due_date || null });
              } catch (err) {
                setError(err.message);
                setSaving(false);
              }
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <div className="space-y-4">
        <Field label="Task" required>
          <Input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Build the login screen" />
        </Field>
        <Field label="Details">
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="Due date">
          <Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  );
}

function UpdatesTab({ data, onRate }) {
  const { updates, access } = data;
  const canRate = (access.manage || access.review) && !access.self;
  if (!updates.length) return <Card><p className="text-sm text-slate-500">No weekly updates yet.</p></Card>;
  return (
    <div className="space-y-3">
      {updates.map((u) => (
        <UpdateCard key={u.id} update={u} canRate={canRate} onRate={onRate} />
      ))}
    </div>
  );
}

function UpdateCard({ update: u, canRate, onRate }) {
  const [rating, setRating] = useState(u.mentor_rating || null);
  const [comment, setComment] = useState(u.mentor_comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <Card title={`Week of ${formatDate(u.week_start)}`} actions={u.mentor_rating ? <Stars value={u.mentor_rating} /> : <Badge>Not rated</Badge>}>
      <div className="space-y-2 text-sm">
        <p className="text-slate-800 whitespace-pre-line">{u.summary}</p>
        {u.blockers && (
          <p className="text-slate-600">
            <span className="font-semibold">Blockers:</span> {u.blockers}
          </p>
        )}
        {u.next_week && (
          <p className="text-slate-600">
            <span className="font-semibold">Next week:</span> {u.next_week}
          </p>
        )}
        {u.mentor_comment && !canRate && <p className="text-brand-teal-800 bg-brand-teal-50 rounded-lg p-2 text-xs">{u.mentor_comment}</p>}
      </div>
      {canRate && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <ErrorBanner message={error} />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Rating</span>
            <RatingButtons label="Rating" value={rating} onChange={setRating} />
          </div>
          <Textarea rows={2} placeholder="Feedback for the employee" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!rating}
              loading={saving}
              onClick={async () => {
                setSaving(true);
                setError("");
                try {
                  await onRate({ update_id: u.id, rating, comment });
                } catch (err) {
                  setError(err.message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save feedback
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ReviewsTab({ data, open, act, setError }) {
  const { reviews, access, criteria, recommendations } = data;
  const byType = Object.fromEntries(reviews.map((r) => [r.type, r]));
  const reviewer = (access.manage || access.review) && !access.self;
  const save = (body, submit) => act({ action: submit ? "submit_review" : "save_review", ...body }, submit ? `${REVIEW_LABELS[body.type]} submitted.` : "Draft saved.");

  return (
    <div className="space-y-5">
      {["self", "mid", "final"].map((type) => {
        const review = byType[type];
        const submitted = Boolean(review?.submitted_at);
        const editable = open && data.record.status === "Active" && !submitted && (type === "self" ? access.self : reviewer);
        const due = type === "mid" ? data.record.mid_review_date : type === "final" ? data.record.final_review_date : null;
        return (
          <Card
            key={type}
            title={
              <span className="flex items-center gap-2">
                {REVIEW_LABELS[type]}
                {due && <span className="text-xs font-normal text-slate-500">due {formatDate(due)}</span>}
              </span>
            }
            actions={
              <div className="flex items-center gap-2">
                {submitted ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Submitted</Badge> : review ? <Badge>Draft</Badge> : <Badge>Not started</Badge>}
                {submitted && access.manage && open && data.record.status === "Active" && (
                  <Button size="sm" variant="ghost" onClick={() => act({ action: "reopen_review", type }, "Review reopened.").catch((err) => setError(err.message))}>
                    Reopen
                  </Button>
                )}
              </div>
            }
          >
            {submitted ? (
              <ReviewSummary review={review} criteria={criteria} />
            ) : editable ? (
              <ReviewForm key={review?.updated_at || type} type={type} criteria={criteria} recommendations={recommendations} review={review} onSave={save} />
            ) : (
              <p className="text-sm text-slate-500">{type === "self" ? "The employee hasn't submitted a self-assessment yet." : "Not submitted yet."}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function LettersList({ letters, onOpen }) {
  if (!letters.length) return <Card><p className="text-sm text-slate-500">No letters issued yet.</p></Card>;
  return (
    <Card>
      <ul className="divide-y divide-slate-100 -my-2">
        {letters.map((l) => (
          <li key={l.id} className="py-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{l.title}</p>
              <p className="text-xs text-slate-500">Issued {formatDate(l.issued_at)}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onOpen(l.id)}>
              <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Open
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const ACTIVITY_LABELS = {
  "stage.update": "Mentor / review dates changed",
  "stage.add_task": "Task assigned",
  "stage.review_self": "Self-assessment submitted",
  "stage.review_mid": "Mid-point review submitted",
  "stage.review_final": "Final review submitted",
  "stage.review_reopen": "Review reopened",
  "stage.propose": "Outcome proposed",
  "stage.reject_outcome": "Outcome rejected",
  "stage.confirm": "Confirmed",
  "stage.extend": "Extended",
  "stage.convert": "Converted",
  "stage.release": "Released",
  "task.status": "Task updated",
};

function ActivityList({ activity }) {
  if (!activity.length) return <Card><p className="text-sm text-slate-500">No activity yet.</p></Card>;
  return (
    <Card>
      <ol className="space-y-3">
        {activity.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-teal-400 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm text-slate-800">
                <span className="font-semibold">{ACTIVITY_LABELS[e.action] || e.action}</span>
                {e.after?.title && <span className="text-slate-500"> · {e.after.title}</span>}
                {e.after?.outcome && <span className="text-slate-500"> · {e.after.outcome}</span>}
                {e.after?.recommendation && <span className="text-slate-500"> · {e.after.recommendation}</span>}
                {e.after?.comment && <span className="text-slate-500"> · {e.after.comment}</span>}
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

function SettingsDialog({ record, employeeId, onClose, onSaved }) {
  const org = useOrgLists();
  const [form, setForm] = useState({ mentor_id: record.mentor_id || "", mid_review_date: record.mid_review_date || "", final_review_date: record.final_review_date || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      onSaved(await hcmJson(`/api/hcm/probation/${record.id}`, { method: "PATCH", body: { ...form, mentor_id: form.mentor_id || null } }));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return (
    <Modal
      title="Mentor and review dates"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <div className="space-y-4">
        <Field label="Mentor">
          <Select
            placeholder="No mentor"
            options={org.users.filter((u) => u.id !== employeeId).map((u) => ({ value: u.id, label: u.full_name }))}
            value={form.mentor_id}
            onChange={(e) => setForm((f) => ({ ...f, mentor_id: e.target.value }))}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mid-point review">
            <Input type="date" min={record.start_date} max={record.end_date} value={form.mid_review_date} onChange={(e) => setForm((f) => ({ ...f, mid_review_date: e.target.value }))} />
          </Field>
          <Field label="Final review">
            <Input type="date" min={record.start_date} max={record.end_date} value={form.final_review_date} onChange={(e) => setForm((f) => ({ ...f, final_review_date: e.target.value }))} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

const DEFAULT_OUTCOME = {
  Confirm: "Confirmed",
  Extend: "Extended",
  "Convert to probation": "Converted",
  "Convert to full-time": "Converted",
  Release: "Released",
};

function addDaysIso(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function OutcomeDialog({ record, onClose, onSubmit }) {
  const intern = record.type === "Intern";
  const options = intern ? ["Converted", "Extended", "Released"] : ["Confirmed", "Extended", "Released"];
  const [form, setForm] = useState({
    outcome: DEFAULT_OUTCOME[record.recommendation] || options[0],
    to_stage: record.recommendation === "Convert to full-time" ? "Full-time" : "Probation",
    end_date: addDaysIso(record.end_date, 60),
    probation_end: addDaysIso(new Date().toISOString().slice(0, 10), 182),
    last_day: addDaysIso(new Date().toISOString().slice(0, 10), 30),
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const needsApproval = form.outcome === "Extended" || form.outcome === "Released";

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { outcome: form.outcome, note: form.note };
      if (form.outcome === "Extended") body.end_date = form.end_date;
      if (form.outcome === "Converted") {
        body.to_stage = form.to_stage;
        if (form.to_stage === "Probation") body.end_date = form.probation_end;
      }
      if (form.outcome === "Released") body.last_day = form.last_day;
      await onSubmit(body);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Decide outcome"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={form.outcome === "Released" ? "danger" : "primary"} onClick={submit} loading={saving}>
            {needsApproval ? "Send for CHRO approval" : "Confirm outcome"}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      {record.recommendation && (
        <p className="text-sm text-slate-600 mb-4">
          Manager recommends <span className="font-semibold">{record.recommendation}</span>.
        </p>
      )}
      <div className="space-y-4">
        <Field label="Outcome" required>
          <Select options={options.map((o) => ({ value: o, label: o === "Confirmed" ? "Confirm" : o === "Extended" ? "Extend" : o === "Converted" ? "Convert" : "Release" }))} value={form.outcome} onChange={set("outcome")} />
        </Field>
        {form.outcome === "Extended" && (
          <Field label="New end date" required hint={`Currently ${formatDate(record.end_date)}`}>
            <Input type="date" min={addDaysIso(record.end_date, 1)} value={form.end_date} onChange={set("end_date")} />
          </Field>
        )}
        {form.outcome === "Converted" && (
          <>
            <Field label="Convert to" required>
              <Select options={["Probation", "Full-time"]} value={form.to_stage} onChange={set("to_stage")} />
            </Field>
            {form.to_stage === "Probation" && (
              <Field label="Probation end date" required>
                <Input type="date" value={form.probation_end} onChange={set("probation_end")} />
              </Field>
            )}
          </>
        )}
        {form.outcome === "Released" && (
          <Field label="Last working day" required>
            <Input type="date" value={form.last_day} onChange={set("last_day")} />
          </Field>
        )}
        <Field label={form.outcome === "Released" ? "Reason (required)" : "Note"} hint={form.outcome === "Extended" ? "Included in the extension letter." : undefined}>
          <Textarea value={form.note} onChange={set("note")} />
        </Field>
        <p className="text-xs text-slate-500">
          {needsApproval ? "Extensions and releases need CHRO approval before they take effect." : "This takes effect now and issues a letter to the employee."}
        </p>
      </div>
    </Modal>
  );
}

function DecisionDialog({ decision, record, onClose, onSubmit }) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title={`${decision === "Approved" ? "Approve" : "Reject"}: ${record.proposed_outcome}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={decision === "Approved" ? "primary" : "danger"}
            loading={saving}
            disabled={decision === "Rejected" && !comment.trim()}
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                await onSubmit(comment);
              } catch (err) {
                setError(err.message);
                setSaving(false);
              }
            }}
          >
            {decision === "Approved" ? "Approve" : "Reject"}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <Field label={decision === "Rejected" ? "Reason (sent to HR)" : "Comment (optional)"} required={decision === "Rejected"}>
        <Textarea autoFocus value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
    </Modal>
  );
}
