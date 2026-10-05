"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Briefcase, CheckCircle2, Circle, Clock, CornerUpLeft, Pencil, Send, XCircle, Lock, Forward, Ban, Archive, ExternalLink,
} from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import {
  PageHeader, Card, Button, Field, Input, Textarea, Badge, Spinner, EmptyState, ErrorBanner, Modal, formatDate, formatMoney,
} from "@/components/hcm/ui";
import RequisitionForm, { RequisitionStatusBadge } from "@/components/hcm/RequisitionForm";

const STEP_LABELS = { hr_review: "HR review", chro_approval: "CHRO approval" };

const ACTIONS = {
  submit: { title: "Submit for approval", button: "Submit", variant: "primary", message: "The requisition will be sent to HR for review." },
  withdraw: { title: "Withdraw requisition", button: "Withdraw", variant: "danger", message: "Pending approvals will be cancelled. This cannot be undone." },
  forward: { title: "Forward to CHRO", button: "Forward to CHRO", variant: "primary", comment: "optional", message: "HR review is complete. The CHRO will make the final decision." },
  approve: { title: "Approve requisition", button: "Approve", variant: "primary", comment: "optional", changes: true },
  send_back: { title: "Send back to requester", button: "Send back", variant: "secondary", comment: "required", message: "The requester can edit and resubmit." },
  reject: { title: "Reject requisition", button: "Reject", variant: "danger", comment: "required", message: "Rejection is final." },
  close: { title: "Close requisition", button: "Close", variant: "danger", message: "No further hiring will happen against this requisition." },
};

const APPROVAL_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Sent back": "bg-yellow-50 text-yellow-800 border-yellow-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function RequisitionDetailPage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{!user ? <Spinner /> : <RequisitionDetail />}</div>;
}

function RequisitionDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, can } = useInternalUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState(null);
  const [converting, setConverting] = useState(false);

  const load = useCallback(async () => {
    const res = await hcmJson(`/api/hcm/requisitions/${id}`);
    setData(res);
  }, [id]);

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  if (loading) return <Spinner />;
  if (!data) {
    return (
      <>
        <BackLink />
        <EmptyState icon={Lock} title="Requisition not available" description={error || "It may not exist or you may not have access."} />
      </>
    );
  }

  const req = data.requisition;
  const approvals = data.approvals || [];
  const jobs = data.jobs || [];
  const isRaiser = req.raised_by === user.id;
  const isAdmin = can("user.manage");
  const editable = ["Draft", "Sent back"].includes(req.status);

  const allowed = [];
  if (isRaiser && editable) allowed.push("edit", "submit");
  if (req.status === "Pending HR" && can("requisition.review")) {
    if (!isRaiser || isAdmin) allowed.push("forward");
    allowed.push("send_back");
    if (!isRaiser || isAdmin) allowed.push("reject");
  }
  if (req.status === "Pending CHRO" && can("requisition.approve")) {
    if (!isRaiser || isAdmin) allowed.push("approve");
    allowed.push("send_back");
    if (!isRaiser || isAdmin) allowed.push("reject");
  }
  if (["Approved", "Posted"].includes(req.status) && can("job.manage")) allowed.push("convert");
  if (["Approved", "Posted", "Filled"].includes(req.status) && can("job.manage")) allowed.push("close");
  if (isRaiser && ["Draft", "Sent back", "Pending HR", "Pending CHRO"].includes(req.status)) allowed.push("withdraw");

  const onDone = async (message) => {
    setModal(null);
    setNotice(message);
    setError("");
    await load().catch((err) => setError(err.message));
  };

  const saveEdit = async (payload, submit) => {
    await hcmJson(`/api/hcm/requisitions/${id}`, { method: "PATCH", body: payload });
    if (submit) await hcmJson(`/api/hcm/requisitions/${id}`, { method: "POST", body: { action: "submit" } });
    setEditing(false);
    await onDone(submit ? "Requisition submitted for approval." : "Draft saved.");
  };

  const convert = async () => {
    setConverting(true);
    setError("");
    try {
      const res = await hcmJson("/api/hcm/jobs", { method: "POST", body: { from_requisition: id } });
      router.push(`/admin/dashboard/careers?edit=${res.job.id}`);
    } catch (err) {
      setError(err.message);
      setConverting(false);
    }
  };

  if (editing) {
    return (
      <>
        <BackLink />
        <PageHeader title={`Edit ${req.code || "requisition"}`} description={req.status === "Sent back" ? "Address the reviewer's comments, then resubmit." : "Update the draft, then submit for approval."} />
        <RequisitionForm initial={req} onSave={saveEdit} onCancel={() => setEditing(false)} />
      </>
    );
  }

  const sentBackNote = req.status === "Sent back" ? [...approvals].reverse().find((a) => a.status === "Sent back" && a.comment) : null;

  return (
    <>
      <BackLink />
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {req.role_title}
            <RequisitionStatusBadge status={req.status} />
          </span>
        }
        description={`${req.code || "Unnumbered draft"} · Raised by ${req.raiser?.full_name || "—"} on ${formatDate(req.created_at)}`}
        actions={
          <ActionBar
            allowed={allowed}
            onEdit={() => setEditing(true)}
            onAction={(action) => setModal(action)}
            onConvert={convert}
            converting={converting}
          />
        }
      />

      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {sentBackNote && isRaiser && (
        <div role="note" className="mb-4 p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          <span className="font-semibold">Sent back by {sentBackNote.decided_by_name || "reviewer"}:</span> {sentBackNote.comment}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SummaryCard req={req} />
          <Card title="Linked job postings">
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-400">
                {["Approved", "Posted"].includes(req.status) ? "No job posting has been created yet." : "Job postings can be created once the requisition is approved."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {jobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Briefcase className="w-4 h-4 text-slate-400" aria-hidden="true" /> {j.title}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge>{j.status}</Badge>
                      {can("job.manage") && (
                        <Link
                          href={`/admin/dashboard/careers?edit=${j.id}`}
                          aria-label={`Open job posting ${j.title}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card title="Approval trail">
          <ApprovalTimeline req={req} approvals={approvals} />
        </Card>
      </div>

      {modal && (
        <ActionModal
          action={modal}
          req={req}
          onClose={() => setModal(null)}
          onDone={onDone}
        />
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link href="/admin/dashboard/requisitions" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-3">
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to requisitions
    </Link>
  );
}

function ActionBar({ allowed, onEdit, onAction, onConvert, converting }) {
  if (!allowed.length) return null;
  const has = (a) => allowed.includes(a);
  return (
    <>
      {has("edit") && (
        <Button variant="secondary" onClick={onEdit}>
          <Pencil className="w-4 h-4" aria-hidden="true" /> Edit
        </Button>
      )}
      {has("submit") && (
        <Button onClick={() => onAction("submit")}>
          <Send className="w-4 h-4" aria-hidden="true" /> Submit for approval
        </Button>
      )}
      {has("forward") && (
        <Button onClick={() => onAction("forward")}>
          <Forward className="w-4 h-4" aria-hidden="true" /> Forward to CHRO
        </Button>
      )}
      {has("approve") && (
        <Button onClick={() => onAction("approve")}>
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve
        </Button>
      )}
      {has("send_back") && (
        <Button variant="secondary" onClick={() => onAction("send_back")}>
          <CornerUpLeft className="w-4 h-4" aria-hidden="true" /> Send back
        </Button>
      )}
      {has("reject") && (
        <Button variant="danger" onClick={() => onAction("reject")}>
          <XCircle className="w-4 h-4" aria-hidden="true" /> Reject
        </Button>
      )}
      {has("convert") && (
        <Button onClick={onConvert} loading={converting}>
          <Briefcase className="w-4 h-4" aria-hidden="true" /> Create job posting
        </Button>
      )}
      {has("close") && (
        <Button variant="secondary" onClick={() => onAction("close")}>
          <Archive className="w-4 h-4" aria-hidden="true" /> Close
        </Button>
      )}
      {has("withdraw") && (
        <Button variant="ghost" onClick={() => onAction("withdraw")}>
          <Ban className="w-4 h-4" aria-hidden="true" /> Withdraw
        </Button>
      )}
    </>
  );
}

function SummaryItem({ label, children, wide }) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children || "—"}</dd>
    </div>
  );
}

function SummaryCard({ req }) {
  const g = req.grades;
  const band = g && (g.band_min != null || g.band_max != null)
    ? `${formatMoney(g.band_min, g.currency || req.currency)} – ${formatMoney(g.band_max, g.currency || req.currency)}`
    : null;
  const budget = req.budget_min != null || req.budget_max != null
    ? `${formatMoney(req.budget_min, req.currency)} – ${formatMoney(req.budget_max, req.currency)}`
    : null;
  return (
    <Card title="Summary">
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        <SummaryItem label="Openings">{String(req.openings)}</SummaryItem>
        <SummaryItem label="Request type">
          {req.request_type}
          {req.request_type === "Replacement" && req.replacing_name && <span className="text-slate-500"> · replacing {req.replacing_name}</span>}
        </SummaryItem>
        <SummaryItem label="Employment type">{req.employment_type}</SummaryItem>
        <SummaryItem label="Department">{req.departments?.name}</SummaryItem>
        <SummaryItem label="Location">{req.locations?.name}</SummaryItem>
        <SummaryItem label="Grade">
          {g ? (
            <>
              {g.code}
              {g.name && ` · ${g.name}`}
              {band && <span className="block text-xs text-slate-500">Band {band}</span>}
            </>
          ) : null}
        </SummaryItem>
        <SummaryItem label="Budget (annual)">{budget}</SummaryItem>
        <SummaryItem label="Target joining date">{req.target_date ? formatDate(req.target_date) : null}</SummaryItem>
        <SummaryItem label="Submitted">{req.submitted_at ? formatDate(req.submitted_at, true) : null}</SummaryItem>
        <SummaryItem label="Skills" wide>
          {req.skills?.length ? (
            <span className="flex flex-wrap gap-1.5">
              {req.skills.map((s) => (
                <Badge key={s} className="bg-brand-teal-50 text-brand-teal-700 border-brand-teal-100">
                  {s}
                </Badge>
              ))}
            </span>
          ) : null}
        </SummaryItem>
        <SummaryItem label="Justification" wide>
          {req.justification ? <span className="whitespace-pre-wrap">{req.justification}</span> : null}
        </SummaryItem>
      </dl>
    </Card>
  );
}

function ApprovalTimeline({ req, approvals }) {
  const now = Date.now();
  const events = [
    { key: "raised", label: "Raised", status: "Done", who: req.raiser?.full_name, when: req.created_at },
    ...(req.submitted_at ? [{ key: "submitted", label: "Submitted for approval", status: "Done", who: req.raiser?.full_name, when: req.submitted_at }] : []),
  ];
  return (
    <ol className="relative space-y-5">
      {events.map((e) => (
        <TimelineItem key={e.key} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />}>
          <p className="text-sm font-semibold text-slate-800">{e.label}</p>
          <p className="text-xs text-slate-500">
            {e.who || "—"} · {formatDate(e.when, true)}
          </p>
        </TimelineItem>
      ))}
      {approvals.map((a, i) => {
        const pending = a.status === "Pending";
        const overdue = pending && a.due_at && new Date(a.due_at).getTime() < now;
        const label = STEP_LABELS[a.step_key] || a.step_key || `Step ${a.step + 1}`;
        const statusLabel = a.status === "Approved" && a.step_key === "hr_review" ? "Forwarded" : a.status;
        const icon = pending ? (
          <Clock className={`w-4 h-4 ${overdue ? "text-red-500" : "text-amber-500"}`} aria-hidden="true" />
        ) : a.status === "Approved" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
        ) : a.status === "Rejected" ? (
          <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
        ) : a.status === "Sent back" ? (
          <CornerUpLeft className="w-4 h-4 text-yellow-600" aria-hidden="true" />
        ) : (
          <Circle className="w-4 h-4 text-slate-300" aria-hidden="true" />
        );
        return (
          <TimelineItem key={a.id || i} icon={icon}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <Badge className={APPROVAL_STYLES[a.status] || undefined}>{statusLabel}</Badge>
              {overdue && <Badge className="bg-red-500 text-white border-transparent">Overdue</Badge>}
            </div>
            {pending ? (
              <p className={`text-xs mt-0.5 ${overdue ? "text-red-600 font-semibold" : "text-slate-500"}`}>
                Waiting since {formatDate(a.created_at, true)}
                {a.due_at && ` · due ${formatDate(a.due_at, true)}`}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                {a.decided_by_name || "—"} · {formatDate(a.decided_at, true)}
              </p>
            )}
            {a.comment && <p className="mt-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 whitespace-pre-wrap">{a.comment}</p>}
          </TimelineItem>
        );
      })}
      {approvals.length === 0 && !req.submitted_at && (
        <li className="text-xs text-slate-400 pl-7">Not submitted for approval yet.</li>
      )}
    </ol>
  );
}

function TimelineItem({ icon, children }) {
  return (
    <li className="relative pl-7 before:absolute before:left-[7px] before:top-5 before:-bottom-5 before:w-px before:bg-slate-200 last:before:hidden">
      <span className="absolute left-0 top-0.5 bg-white">{icon}</span>
      {children}
    </li>
  );
}

function ActionModal({ action, req, onClose, onDone }) {
  const copy = ACTIONS[action];
  const [comment, setComment] = useState("");
  const [changes, setChanges] = useState({
    openings: String(req.openings ?? ""),
    budget_min: req.budget_min ?? "",
    budget_max: req.budget_max ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setChange = (key) => (e) => setChanges((c) => ({ ...c, [key]: e.target.value }));

  const run = async () => {
    setError("");
    const note = comment.trim();
    if (copy.comment === "required" && !note) {
      setError("A comment is required.");
      return;
    }
    const body = { action };
    if (note) body.comment = note;
    if (copy.changes) {
      if (!(parseInt(changes.openings, 10) >= 1)) {
        setError("Openings must be at least 1.");
        return;
      }
      if (changes.budget_min !== "" && changes.budget_max !== "" && Number(changes.budget_min) > Number(changes.budget_max)) {
        setError("Budget minimum must not exceed maximum.");
        return;
      }
      const diff = {};
      if (parseInt(changes.openings, 10) !== req.openings) diff.openings = parseInt(changes.openings, 10);
      if (String(changes.budget_min) !== String(req.budget_min ?? "")) diff.budget_min = changes.budget_min;
      if (String(changes.budget_max) !== String(req.budget_max ?? "")) diff.budget_max = changes.budget_max;
      if (Object.keys(diff).length) body.changes = diff;
    }
    setBusy(true);
    try {
      await hcmJson(`/api/hcm/requisitions/${req.id}`, { method: "POST", body });
      const done = {
        submit: "Requisition submitted for approval.",
        withdraw: "Requisition withdrawn.",
        forward: "Forwarded to CHRO.",
        approve: "Requisition approved.",
        send_back: "Sent back to the requester.",
        reject: "Requisition rejected.",
        close: "Requisition closed.",
      }[action];
      await onDone(done);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={copy.title}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={copy.variant} onClick={run} loading={busy}>
            {copy.button}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {copy.message || "Confirm the final approval."} <strong>{req.code || req.role_title}</strong> · {req.role_title}
        </p>
        {copy.changes && (
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Openings">
              <Input type="number" min={1} value={changes.openings} onChange={setChange("openings")} />
            </Field>
            <Field label={`Budget min (${req.currency})`}>
              <Input type="number" min={0} value={changes.budget_min} onChange={setChange("budget_min")} />
            </Field>
            <Field label={`Budget max (${req.currency})`}>
              <Input type="number" min={0} value={changes.budget_max} onChange={setChange("budget_max")} />
            </Field>
          </div>
        )}
        {copy.comment && (
          <Field label="Comment" required={copy.comment === "required"}>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={copy.comment === "required" ? "Explain what needs to change or why" : "Optional note for the requester"}
              autoFocus
            />
          </Field>
        )}
      </div>
    </Modal>
  );
}
