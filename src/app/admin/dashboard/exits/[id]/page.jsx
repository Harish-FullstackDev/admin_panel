"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, ListPlus, Plus, XCircle } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Field, Input, Textarea, Select, Spinner, ErrorBanner, Modal, formatDate, formatMoney } from "@/components/hcm/ui";
import { StatusChip, ProgressBar, TASK_TEAMS, useOrgLists } from "@/components/hcm/onboarding";
import { LetterModal } from "@/components/hcm/stage";
import { ExitSteps, ExitInterviewForm, InterviewSummary, AcceptExitModal, SeparationDecisionModal, daysLeft } from "@/components/hcm/exit";

const TEAM_ORDER = ["Manager", "HR", "Finance", "IT", "Admin", "Buddy"];

export default function ExitDetailPage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{!user ? <Spinner /> : <ExitDetail />}</div>;
}

function userOptions(users) {
  return users.map((u) => ({ value: u.id, label: u.designation ? `${u.full_name} (${u.designation})` : u.full_name }));
}

function ExitDetail() {
  const { user } = useInternalUser();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("Overview");
  const [modal, setModal] = useState(null);
  const [letterId, setLetterId] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/exits/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Runs a POST action; returns true on success. */
  const act = async (body, message) => {
    setError("");
    try {
      const res = await hcmJson(`/api/hcm/exits/${id}`, { method: "POST", body });
      if (res.exitCase) setData(res);
      else await load();
      setNotice([message, ...(res.warnings || [])].filter(Boolean).join(" "));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const { exitCase: c, employee: e, access, readiness } = data;
  const hr = access.hr;
  const canAccept = c.type === "Resignation" && ((c.status === "Pending manager" && (access.manager || hr)) || (c.status === "Pending HR" && hr));
  const canDecide = c.status === "Pending approval" && access.chro && c.initiated_by !== user.id;
  const open = ["Pending manager", "Pending HR", "Pending approval", "In notice"].includes(c.status);
  const tabs = ["Overview", "Clearance", ...(access.interview ? ["Exit interview"] : []), ...(hr ? ["Settlement"] : []), "Letters", ...(hr || access.chro ? ["Activity"] : [])];

  const done = async (message) => {
    setModal(null);
    setNotice(message);
    await load();
  };

  return (
    <>
      <Link href="/admin/dashboard/exits" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Exits
      </Link>
      <PageHeader
        title={e.full_name}
        description={[e.designation, e.departments?.name, e.employee_code, e.stage].filter(Boolean).join(" · ")}
        actions={
          <>
            {canAccept && (
              <Button onClick={() => setModal("accept")}>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Accept resignation
              </Button>
            )}
            {canDecide && (
              <>
                <Button variant="secondary" onClick={() => setModal("reject")}>
                  <XCircle className="w-4 h-4" aria-hidden="true" /> Reject
                </Button>
                <Button onClick={() => setModal("approve")}>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve
                </Button>
              </>
            )}
            {hr && c.status === "In notice" && (
              <>
                <Button variant="secondary" onClick={() => setModal("lwd")}>
                  Change last day
                </Button>
                <Button onClick={() => setModal("complete")} disabled={!readiness.ready} title={readiness.blockers.join("; ")}>
                  Complete exit
                </Button>
              </>
            )}
            {hr && open && (
              <Button variant="ghost" onClick={() => setModal("cancel")}>
                Cancel exit
              </Button>
            )}
          </>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <Card className="mb-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Type · status</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <StatusChip status={c.type} />
              <StatusChip status={c.status} />
            </div>
            <div className="mt-2">
              <ExitSteps exitCase={c} />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">{c.last_working_date ? "Last working day" : "Requested last day"}</p>
            <p className="text-lg font-extrabold text-slate-900">{formatDate(c.last_working_date || c.requested_last_day)}</p>
            {c.status === "In notice" && <p className="text-xs font-semibold text-orange-600">{daysLeft(c.last_working_date)}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-500">Notice period</p>
            <p className="text-sm font-semibold text-slate-800">{c.notice_days ? `${c.notice_days} days (full notice ends ${formatDate(c.full_notice_end)})` : "—"}</p>
            {c.shortfall_reason && <p className="text-xs text-amber-700 mt-0.5">Shortened: {c.shortfall_reason}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-500">Clearance</p>
            {readiness.tasksTotal ? <ProgressBar value={readiness.tasksTotal - readiness.tasksOpen} total={readiness.tasksTotal} label="Clearance" /> : <p className="text-sm text-slate-500">Not started</p>}
          </div>
        </div>
        {hr && c.status === "In notice" && readiness.blockers.length > 0 && (
          <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">To complete: {readiness.blockers.join(" · ")}.</p>
        )}
      </Card>

      <div role="tablist" className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
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

      {tab === "Overview" && <Overview data={data} />}
      {tab === "Clearance" && <Clearance data={data} onAct={act} onChanged={load} setError={setError} />}
      {tab === "Exit interview" &&
        (c.interview ? (
          <Card title="Exit interview">
            <p className="text-xs text-slate-500 mb-4">Submitted {formatDate(c.interview_submitted_at, true)}. Confidential: not shown to the manager.</p>
            <InterviewSummary interview={c.interview} questions={data.interviewQuestions} />
          </Card>
        ) : hr && c.status === "In notice" ? (
          <Card title="Record exit interview">
            <p className="text-sm text-slate-600 mb-4">The employee hasn&apos;t submitted it yet. If you held the interview in person, record the answers here.</p>
            <ExitInterviewForm
              questions={data.interviewQuestions}
              reasons={data.reasons}
              initialReason={c.reason_category}
              submitLabel="Save on the employee's behalf"
              onSubmit={async (answers) => {
                const ok = await act({ action: "interview", ...answers }, "Exit interview recorded.");
                if (!ok) throw new Error("Could not save the exit interview.");
              }}
            />
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">No exit interview recorded.</p>
          </Card>
        ))}
      {tab === "Settlement" && <Settlement data={data} onAct={act} />}
      {tab === "Letters" && (
        <Card>
          {data.letters.length === 0 ? (
            <p className="text-sm text-slate-500">Letters are issued when the exit is completed.</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {data.letters.map((l) => (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{l.title}</p>
                    <p className="text-xs text-slate-500">Issued {formatDate(l.issued_at)}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setLetterId(l.id)}>
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {tab === "Activity" && <Activity activity={data.activity} />}

      {modal === "accept" && (
        <AcceptExitModal exitCase={c} employeeName={e.full_name} hrStep={hr} onClose={() => setModal(null)} onDone={done} />
      )}
      {(modal === "approve" || modal === "reject") && (
        <SeparationDecisionModal exitCase={c} employeeName={e.full_name} decision={modal} onClose={() => setModal(null)} onDone={done} />
      )}
      {modal === "lwd" && <ChangeLwdModal exitCase={c} onClose={() => setModal(null)} onSave={(body) => act({ action: "change_lwd", ...body }, "Last working day updated.").then((ok) => ok && setModal(null))} />}
      {modal === "cancel" && <CancelModal exitCase={c} onClose={() => setModal(null)} onSave={(reason) => act({ action: "cancel", reason }, "Exit cancelled.").then((ok) => ok && setModal(null))} />}
      {modal === "complete" && (
        <CompleteModal data={data} onClose={() => setModal(null)} onSave={(body) => act({ action: "complete", ...body }, "Exit completed.").then((ok) => ok && setModal(null))} />
      )}
      {letterId && <LetterModal letterId={letterId} onClose={() => setLetterId(null)} />}
    </>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-slate-50 last:border-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-800 whitespace-pre-line">{children || "—"}</dd>
    </div>
  );
}

const STEP_LABELS = { manager_acceptance: "Manager acceptance", hr_acceptance: "HR acceptance", chro_approval: "CHRO approval" };

function Overview({ data }) {
  const { exitCase: c, employee: e, approvals, names } = data;
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card title="Details" className="lg:col-span-2">
        <dl>
          <Row label="Reason">{[c.reason_category, c.reason].filter(Boolean).join(": ")}</Row>
          <Row label="Submitted">{formatDate(c.submitted_at, true)}</Row>
          {c.initiated_by && c.type !== "Resignation" && <Row label="Started by">{names[c.initiated_by]}</Row>}
          <Row label="Requested last day">{formatDate(c.requested_last_day)}</Row>
          <Row label="Manager">{e.manager?.full_name}</Row>
          {c.manager_comment && <Row label="Manager comment">{c.manager_comment}</Row>}
          {c.hr_comment && <Row label="HR comment">{c.hr_comment}</Row>}
          {c.accepted_at && <Row label="Accepted">{`${formatDate(c.accepted_at, true)}${names[c.accepted_by] ? ` by ${names[c.accepted_by]}` : ""}`}</Row>}
          {c.completed_at && <Row label="Completed">{`${formatDate(c.completed_at, true)}${names[c.completed_by] ? ` by ${names[c.completed_by]}` : ""}`}</Row>}
          {c.cancel_reason && <Row label="Cancelled">{c.cancel_reason}</Row>}
          <Row label="Joined">{formatDate(e.joining_date)}</Row>
        </dl>
        {data.directReports.length > 0 && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            {data.directReports.length} people report to {e.full_name}: {data.directReports.map((r) => r.full_name).join(", ")}. Assign a new manager before the last day.
          </p>
        )}
      </Card>
      <Card title="Approvals">
        {approvals.length === 0 ? (
          <p className="text-sm text-slate-500">No approval steps.</p>
        ) : (
          <ol className="space-y-3">
            {approvals.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{STEP_LABELS[a.step_key] || a.step_key}</span>
                  <StatusChip status={a.status} />
                </div>
                <p className="text-xs text-slate-500">
                  {a.decided_at ? `${a.decided_by_name || "—"} · ${formatDate(a.decided_at, true)}` : `Due ${formatDate(a.due_at)}`}
                </p>
                {a.comment && <p className="text-xs text-slate-600 italic">“{a.comment}”</p>}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

function Clearance({ data, onAct, onChanged, setError }) {
  const { exitCase: c, tasks, access } = data;
  const org = useOrgLists();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(null);
  const editable = access.hr && c.status === "In notice";

  useEffect(() => {
    if (!editable) return;
    hcmJson("/api/hcm/checklist-templates?purpose=exit")
      .then((d) => setTemplates((d.templates || []).filter((t) => !t.archived)))
      .catch(() => setTemplates([]));
  }, [editable]);

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

  const teams = [...TEAM_ORDER, ...TASK_TEAMS.filter((t) => !TEAM_ORDER.includes(t))];
  const groups = teams.map((team) => ({ team, items: tasks.filter((t) => t.team === team) })).filter((g) => g.items.length);

  return (
    <Card
      title="Clearance checklist"
      actions={
        editable && (
          <div className="flex flex-wrap gap-2">
            {templates.length > 0 && (
              <>
                <Select
                  aria-label="Exit checklist"
                  className="h-8 text-xs w-auto"
                  placeholder="Add tasks from checklist…"
                  options={templates.map((t) => ({ value: t.id, label: t.name }))}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!templateId}
                  onClick={async () => {
                    if (await onAct({ action: "apply_checklist", template_id: templateId }, "Checklist tasks added.")) setTemplateId("");
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
        <p className="text-sm text-slate-500">{c.status === "In notice" ? "No clearance tasks yet. Apply a checklist to start." : "Clearance starts once the exit is accepted."}</p>
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
                      disabled={!editable || busy === task.id || task.status === "Skipped"}
                      onChange={(e) => update(task, { status: e.target.checked ? "Done" : "Open" })}
                      className="w-4 h-4 accent-brand-teal-600 cursor-pointer"
                    />
                    <div className="flex-1 min-w-[180px]">
                      <p className={`text-sm ${task.status === "Open" ? "text-slate-800 font-medium" : "text-slate-400 line-through"}`}>{task.title}</p>
                      {task.completed_at && <p className="text-[11px] text-slate-400">{task.status} {formatDate(task.completed_at)}</p>}
                    </div>
                    {editable ? (
                      <>
                        <Select
                          aria-label="Assignee"
                          className="h-8 text-xs w-44"
                          placeholder="Unassigned"
                          disabled={task.status !== "Open" || busy === task.id}
                          options={userOptions(org.users)}
                          value={task.assignee_id || ""}
                          onChange={(e) => update(task, { assignee_id: e.target.value || null })}
                        />
                        <Input
                          type="date"
                          aria-label="Due date"
                          className="h-8 text-xs w-36"
                          disabled={task.status !== "Open" || busy === task.id}
                          value={task.due_date || ""}
                          onChange={(e) => update(task, { due_date: e.target.value || null })}
                        />
                        {task.status === "Open" && (
                          <Button size="sm" variant="ghost" onClick={() => update(task, { status: "Skipped" })} disabled={busy === task.id}>
                            Skip
                          </Button>
                        )}
                        {task.status === "Skipped" && (
                          <Button size="sm" variant="ghost" onClick={() => update(task, { status: "Open" })} disabled={busy === task.id}>
                            Reopen
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-500">{task.assignee?.full_name || "Unassigned"}</span>
                        <span className="text-xs text-slate-500 w-24">{task.due_date ? formatDate(task.due_date) : "—"}</span>
                        <StatusChip status={task.status} />
                      </>
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
          defaultDue={c.last_working_date}
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
      title="Add clearance task"
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
          <Input autoFocus value={form.title} onChange={set("title")} placeholder="e.g. Return client data" />
        </Field>
        <Field label="Team">
          <Select options={TASK_TEAMS.filter((t) => t !== "Buddy")} value={form.team} onChange={set("team")} />
        </Field>
        <Field label="Due date">
          <Input type="date" value={form.due_date} onChange={set("due_date")} />
        </Field>
        <Field label="Assignee" className="sm:col-span-2" hint={form.team === "Manager" ? "Leave empty to assign the employee's manager." : undefined}>
          <Select placeholder="Unassigned" options={userOptions(users)} value={form.assignee_id} onChange={set("assignee_id")} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={form.description} onChange={set("description")} />
        </Field>
      </div>
    </Modal>
  );
}

function Settlement({ data, onAct }) {
  const c = data.exitCase;
  const [form, setForm] = useState({
    settlement_status: c.settlement_status,
    settlement_amount: c.settlement_amount ?? "",
    settlement_paid_on: c.settlement_paid_on || "",
    settlement_note: c.settlement_note || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const locked = ["Withdrawn", "Cancelled"].includes(c.status);
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card title="Full and final settlement" className="lg:col-span-2">
        <p className="text-xs text-slate-500 mb-4">Tracked here for reference. Payroll works out the amount.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Status">
            <Select options={data.settlementStatuses} value={form.settlement_status} onChange={set("settlement_status")} disabled={locked} />
          </Field>
          <Field label="Amount (INR)" hint={c.settlement_amount != null ? `Saved: ${formatMoney(c.settlement_amount)}` : undefined}>
            <Input type="number" step="0.01" value={form.settlement_amount} onChange={set("settlement_amount")} disabled={locked} />
          </Field>
          <Field label="Paid on" required={form.settlement_status === "Paid"}>
            <Input type="date" value={form.settlement_paid_on} onChange={set("settlement_paid_on")} disabled={locked} />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Textarea value={form.settlement_note} onChange={set("settlement_note")} disabled={locked} />
          </Field>
        </div>
        {!locked && (
          <div className="flex justify-end mt-4">
            <Button
              loading={saving}
              onClick={async () => {
                setSaving(true);
                await onAct({ action: "settlement", ...form }, "Settlement saved.");
                setSaving(false);
              }}
            >
              Save
            </Button>
          </div>
        )}
      </Card>
      <Card title="Leave balance (for reference)">
        {data.balances.length === 0 ? (
          <p className="text-sm text-slate-500">Not available.</p>
        ) : (
          <ul className="space-y-2">
            {data.balances.map((b) => (
              <li key={b.code} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{b.name}</span>
                <span className="font-semibold text-slate-900 tabular-nums">{b.unlimited ? `${b.used} used` : `${b.available} left`}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ChangeLwdModal({ exitCase, onClose, onSave }) {
  const [form, setForm] = useState({ last_working_date: exitCase.last_working_date || "", reason: "" });
  const [saving, setSaving] = useState(false);
  const short = exitCase.type === "Resignation" && form.last_working_date && form.last_working_date < exitCase.full_notice_end;
  return (
    <Modal
      title="Change last working day"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button
            loading={saving}
            disabled={!form.last_working_date || !form.reason.trim()}
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Last working day" required hint="Open clearance task due dates move by the same number of days.">
          <Input type="date" value={form.last_working_date} onChange={(e) => setForm((f) => ({ ...f, last_working_date: e.target.value }))} />
        </Field>
        {short && <p className="text-xs text-amber-700">This is shorter than the full notice ({formatDate(exitCase.full_notice_end)}). The reason is recorded as the shortfall reason.</p>}
        <Field label="Reason" required>
          <Textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  );
}

function CancelModal({ exitCase, onClose, onSave }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      title="Cancel exit"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button
            variant="danger"
            loading={saving}
            disabled={!reason.trim()}
            onClick={async () => {
              setSaving(true);
              await onSave(reason);
              setSaving(false);
            }}
          >
            Cancel exit
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 mb-3">
        {exitCase.status === "In notice"
          ? "The employee goes back to Active, the last working day is cleared and open clearance tasks are skipped."
          : "The pending approval is withdrawn."}
      </p>
      <Field label="Reason" required hint="e.g. employee retained after discussion.">
        <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}

function CompleteModal({ data, onClose, onSave }) {
  const [letters, setLetters] = useState(data.defaultLetters);
  const [deactivate, setDeactivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const toggle = (type) => setLetters((l) => (l.includes(type) ? l.filter((x) => x !== type) : [...l, type]));
  return (
    <Modal
      title={`Complete exit · ${data.employee.full_name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button
            loading={saving}
            onClick={async () => {
              setSaving(true);
              await onSave({ letters, deactivate });
              setSaving(false);
            }}
          >
            Complete exit
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-slate-600">
          The employee is marked <strong>Exited</strong> as of {formatDate(data.exitCase.last_working_date)}. Leave after that date is cancelled.
        </p>
        <fieldset>
          <legend className="text-xs font-semibold text-slate-600 mb-1.5">Issue letters</legend>
          {[
            ["relieving", "Relieving letter"],
            ["experience", data.employee.stage === "Intern" ? "Experience certificate (internship)" : "Experience certificate"],
          ].map(([type, label]) => (
            <label key={type} className="flex items-center gap-2 py-1">
              <input type="checkbox" checked={letters.includes(type)} onChange={() => toggle(type)} /> {label}
            </label>
          ))}
        </fieldset>
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" checked={deactivate} onChange={(e) => setDeactivate(e.target.checked)} />
          <span>
            Deactivate portal access
            <span className="block text-xs text-slate-500">They won&apos;t be able to sign in. Letters are emailed to their personal and official addresses.</span>
          </span>
        </label>
        {data.directReports.length > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            {data.directReports.length} people still report to this person. Reassign them in Employees.
          </p>
        )}
      </div>
    </Modal>
  );
}

const ACTION_LABELS = {
  "exit.resign": "Resignation submitted",
  "exit.manager_accept": "Accepted by manager",
  "exit.accept": "Accepted · notice period started",
  "exit.withdraw": "Resignation withdrawn",
  "exit.initiate": "Separation started",
  "exit.reject": "Separation not approved",
  "exit.release": "Released from probation",
  "exit.change_lwd": "Last working day changed",
  "exit.cancel": "Exit cancelled",
  "exit.interview": "Exit interview submitted",
  "exit.settlement": "Settlement updated",
  "exit.complete": "Exit completed",
  "task.status": "Task status changed",
  "task.update": "Task updated",
};

function summarise(entry) {
  const a = entry.after || {};
  if (a.title) return `${a.title}${a.status ? ` → ${a.status}` : ""}`;
  if (entry.action === "exit.change_lwd") return `${a.last_working_date} — ${a.reason}`;
  if (entry.action === "exit.accept") return `Last day ${a.last_working_date}`;
  if (entry.action === "exit.cancel" || entry.action === "exit.reject") return a.reason || a.comment;
  if (entry.action === "exit.settlement") return [a.settlement_status, a.settlement_amount != null ? formatMoney(a.settlement_amount) : null].filter(Boolean).join(" · ");
  if (entry.action === "exit.complete") return (a.letters || []).join(", ");
  return "";
}

function Activity({ activity }) {
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
