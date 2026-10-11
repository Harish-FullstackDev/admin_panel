"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList, CornerUpLeft, FileSignature, Forward, Inbox, XCircle, Hourglass, Plane, DoorOpen } from "lucide-react";
import { LeaveActionModal, leaveDates } from "@/components/hcm/leave";
import { AcceptExitModal, SeparationDecisionModal } from "@/components/hcm/exit";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import {
  PageHeader, Card, Button, Field, Input, Textarea, Badge, Spinner, EmptyState, ErrorBanner, Modal, formatDate, formatMoney,
} from "@/components/hcm/ui";

const STEP_LABELS = { hr_review: "HR review", chro_approval: "CHRO approval" };

function waitingLabel(days) {
  if (!days) return "Waiting since today";
  return `${days} day${days === 1 ? "" : "s"} waiting`;
}

function candidateName(app) {
  return [app?.first_name, app?.last_name].filter(Boolean).join(" ") || app?.email || "Candidate";
}

export default function ApprovalsPage() {
  const { user } = useInternalUser();
  return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{!user ? <Spinner /> : <ApprovalsInbox />}</div>;
}

function ApprovalsInbox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [leaveAction, setLeaveAction] = useState(null);
  const [exitAction, setExitAction] = useState(null);

  const load = useCallback(async () => {
    const data = await hcmJson("/api/hcm/approvals");
    setItems(data.approvals || []);
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  const sorted = useMemo(() => [...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [items]);
  const overdueCount = items.filter((i) => i.overdue).length;

  const onDone = async (message) => {
    setModal(null);
    setNotice(message);
    await load().catch((err) => setError(err.message));
  };

  return (
    <>
      <PageHeader
        title="Approvals"
        description={
          loading
            ? "Items waiting for your decision."
            : `${items.length} item${items.length === 1 ? "" : "s"} waiting for your decision${overdueCount ? ` · ${overdueCount} overdue` : ""}. Oldest first.`
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing waiting for you" description="Requisitions, above-band offers, probation extensions or releases, leave requests and resignations that need your approval appear here." />
      ) : (
        <ul className="space-y-4">
          {sorted.map((item) => (
            <li key={item.id}>
              {item.entity_type === "exit_case" ? (
                <ExitCard item={item} onAction={(action) => setExitAction({ item, action })} />
              ) : item.entity_type === "leave_request" ? (
                <LeaveCard item={item} onAction={(action) => setLeaveAction({ request: item.entity, action })} />
              ) : item.entity_type === "stage_record" ? (
                <StageOutcomeCard item={item} />
              ) : item.entity_type === "offer" ? (
                <OfferCard item={item} onAction={(action) => setModal({ item, action })} />
              ) : (
                <RequisitionCard item={item} onAction={(action) => setModal({ item, action })} />
              )}
            </li>
          ))}
        </ul>
      )}

      {modal && <DecisionModal item={modal.item} action={modal.action} onClose={() => setModal(null)} onDone={onDone} />}
      {exitAction &&
        (exitAction.action === "accept" ? (
          <AcceptExitModal
            exitCase={exitAction.item.entity}
            employeeName={exitAction.item.entity.employees?.full_name}
            hrStep={exitAction.item.step_key === "hr_acceptance"}
            onClose={() => setExitAction(null)}
            onDone={async (message) => {
              setExitAction(null);
              await onDone(message);
            }}
          />
        ) : (
          <SeparationDecisionModal
            exitCase={exitAction.item.entity}
            employeeName={exitAction.item.entity.employees?.full_name}
            decision={exitAction.action}
            onClose={() => setExitAction(null)}
            onDone={async (message) => {
              setExitAction(null);
              await onDone(message);
            }}
          />
        ))}
      {leaveAction && (
        <LeaveActionModal
          request={leaveAction.request}
          action={leaveAction.action}
          onClose={() => setLeaveAction(null)}
          onDone={async (a) => {
            setLeaveAction(null);
            await onDone(a === "approve" ? "Leave approved." : "Leave rejected.");
          }}
        />
      )}
    </>
  );
}

function CardShell({ icon: Icon, kind, stepLabel, item, title, subtitle, children, actions }) {
  return (
    <Card className={item.overdue ? "border-red-200" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-brand-teal-50 text-brand-teal-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {kind}
              {stepLabel && <span className="normal-case tracking-normal text-slate-500">· {stepLabel}</span>}
            </div>
            <h2 className="text-base font-bold text-slate-900 truncate">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs ${item.overdue ? "text-red-600 font-semibold" : "text-slate-500"}`}>{waitingLabel(item.age_days)}</span>
          {item.overdue && <Badge className="bg-red-500 text-white border-transparent">Overdue</Badge>}
        </div>
      </div>
      {children}
      <div className="flex flex-wrap justify-end gap-2 mt-4 pt-4 border-t border-slate-100">{actions}</div>
    </Card>
  );
}

function Detail({ label, children, wide }) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-4" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children || "—"}</dd>
    </div>
  );
}

function RequisitionCard({ item, onAction }) {
  const r = item.entity;
  const g = r.grades;
  const budget = r.budget_min != null || r.budget_max != null ? `${formatMoney(r.budget_min, r.currency)} – ${formatMoney(r.budget_max, r.currency)}` : null;
  const band =
    g && (g.band_min != null || g.band_max != null)
      ? `${g.code}: ${formatMoney(g.band_min, g.currency || r.currency)} – ${formatMoney(g.band_max, g.currency || r.currency)}`
      : g?.code;
  const isFinal = item.step_key === "chro_approval";
  return (
    <CardShell
      icon={ClipboardList}
      kind="Requisition"
      stepLabel={STEP_LABELS[item.step_key] || item.step_key}
      item={item}
      title={r.role_title}
      subtitle={`${r.code || ""}${r.code ? " · " : ""}Raised by ${r.raiser?.full_name || "—"} · submitted ${formatDate(r.submitted_at || r.created_at)}`}
      actions={
        <>
          <Link
            href={`/admin/dashboard/requisitions/${r.id}`}
            className="inline-flex items-center h-8 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 mr-auto"
          >
            View details
          </Link>
          <Button size="sm" variant="secondary" onClick={() => onAction("send_back")}>
            <CornerUpLeft className="w-3.5 h-3.5" aria-hidden="true" /> Send back
          </Button>
          <Button size="sm" variant="danger" onClick={() => onAction("reject")}>
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Reject
          </Button>
          {isFinal ? (
            <Button size="sm" onClick={() => onAction("approve")}>
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Approve
            </Button>
          ) : (
            <Button size="sm" onClick={() => onAction("forward")}>
              <Forward className="w-3.5 h-3.5" aria-hidden="true" /> Forward to CHRO
            </Button>
          )}
        </>
      }
    >
      <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
        <Detail label="Department">{r.departments?.name}</Detail>
        <Detail label="Openings">
          {String(r.openings)} · {r.request_type}
          {r.request_type === "Replacement" && r.replacing_name && <span className="text-slate-500"> ({r.replacing_name})</span>}
        </Detail>
        <Detail label="Budget (annual)">{budget}</Detail>
        <Detail label="Grade band">{band}</Detail>
        <Detail label="Justification" wide>
          {r.justification && <span className="whitespace-pre-wrap line-clamp-4">{r.justification}</span>}
        </Detail>
      </dl>
    </CardShell>
  );
}

function OfferCard({ item, onAction }) {
  const o = item.entity;
  const app = o.applications || {};
  const currency = o.currency || item.band?.currency || "INR";
  const bandMax = item.band?.max != null ? Number(item.band.max) : null;
  const salary = Number(o.salary);
  const above = bandMax != null && salary > bandMax ? salary - bandMax : 0;
  const abovePct = above && bandMax ? Math.round((above / bandMax) * 1000) / 10 : 0;
  return (
    <CardShell
      icon={FileSignature}
      kind="Offer above band"
      stepLabel={STEP_LABELS[item.step_key] || item.step_key}
      item={item}
      title={candidateName(app)}
      subtitle={[app.position, app.email].filter(Boolean).join(" · ")}
      actions={
        <>
          <Button size="sm" variant="danger" onClick={() => onAction("reject")}>
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Reject
          </Button>
          <Button size="sm" onClick={() => onAction("approve")}>
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Approve
          </Button>
        </>
      }
    >
      <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
        <Detail label="Position">{app.position}</Detail>
        <Detail label="Offered salary">
          <span className="font-semibold">{formatMoney(o.salary, currency)}</span>
        </Detail>
        <Detail label="Band max">{bandMax != null ? formatMoney(bandMax, item.band?.currency || currency) : "No band set"}</Detail>
        <Detail label="Joining date">{o.joining_date ? formatDate(o.joining_date) : null}</Detail>
      </dl>
      {above > 0 && (
        <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs text-red-700">
          <span className="font-semibold">
            {formatMoney(above, currency)} above band ({abovePct}%)
          </span>
        </p>
      )}
    </CardShell>
  );
}

const COPY = {
  forward: { title: "Forward to CHRO", button: "Forward", variant: "primary", comment: "optional" },
  approve: { title: "Approve", button: "Approve", variant: "primary", comment: "optional" },
  send_back: { title: "Send back to requester", button: "Send back", variant: "secondary", comment: "required" },
  reject: { title: "Reject", button: "Reject", variant: "danger", comment: "required" },
};

function DecisionModal({ item, action, onClose, onDone }) {
  const isOffer = item.entity_type === "offer";
  const r = item.entity;
  const copy = COPY[action];
  const showChanges = !isOffer && action === "approve";
  const [comment, setComment] = useState("");
  const [changes, setChanges] = useState({
    openings: String(r.openings ?? ""),
    budget_min: r.budget_min ?? "",
    budget_max: r.budget_max ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setChange = (key) => (e) => setChanges((c) => ({ ...c, [key]: e.target.value }));
  const subject = isOffer ? `${candidateName(r.applications)} · ${r.applications?.position || "offer"}` : `${r.code || ""} ${r.role_title}`.trim();
  const commentRequired = copy.comment === "required" && !(isOffer && action === "approve");

  const run = async () => {
    setError("");
    const note = comment.trim();
    if (commentRequired && !note) {
      setError("A comment is required.");
      return;
    }
    const body = { action, comment: note };
    if (showChanges) {
      if (!(parseInt(changes.openings, 10) >= 1)) {
        setError("Openings must be at least 1.");
        return;
      }
      if (changes.budget_min !== "" && changes.budget_max !== "" && Number(changes.budget_min) > Number(changes.budget_max)) {
        setError("Budget minimum must not exceed maximum.");
        return;
      }
      const diff = {};
      if (parseInt(changes.openings, 10) !== r.openings) diff.openings = parseInt(changes.openings, 10);
      if (String(changes.budget_min) !== String(r.budget_min ?? "")) diff.budget_min = changes.budget_min;
      if (String(changes.budget_max) !== String(r.budget_max ?? "")) diff.budget_max = changes.budget_max;
      if (Object.keys(diff).length) body.changes = diff;
    }
    setBusy(true);
    try {
      const url = isOffer ? `/api/hcm/offers/${item.entity_id}` : `/api/hcm/requisitions/${item.entity_id}`;
      await hcmJson(url, { method: "POST", body });
      const verb = { forward: "forwarded to CHRO", approve: "approved", send_back: "sent back", reject: isOffer ? "rejected and returned to draft" : "rejected" }[action];
      await onDone(`${subject} ${verb}.`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`${copy.title}${isOffer ? " offer" : " requisition"}`}
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
          <strong>{subject}</strong>
        </p>
        {showChanges && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Adjust openings or budget before approving, if needed.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Openings">
                <Input type="number" min={1} value={changes.openings} onChange={setChange("openings")} />
              </Field>
              <Field label={`Budget min (${r.currency || "INR"})`}>
                <Input type="number" min={0} value={changes.budget_min} onChange={setChange("budget_min")} />
              </Field>
              <Field label={`Budget max (${r.currency || "INR"})`}>
                <Input type="number" min={0} value={changes.budget_max} onChange={setChange("budget_max")} />
              </Field>
            </div>
          </div>
        )}
        <Field label="Comment" required={commentRequired}>
          <Textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={commentRequired ? "Explain the reason" : "Optional note"}
            autoFocus
          />
        </Field>
      </div>
    </Modal>
  );
}

function StageOutcomeCard({ item }) {
  const r = item.entity;
  const e = r.employees || {};
  const detail =
    r.proposed_outcome === "Extended"
      ? `Extend until ${formatDate(r.proposed_end_date)} (currently ${formatDate(r.end_date)})`
      : r.proposed_outcome === "Released"
        ? `Release · last working day ${formatDate(r.proposed_last_day)}`
        : r.proposed_outcome;
  return (
    <CardShell
      icon={Hourglass}
      kind={`${r.type} outcome`}
      stepLabel="CHRO approval"
      item={item}
      title={`${r.proposed_outcome === "Extended" ? "Extend" : "Release"}: ${e.full_name || "Employee"}`}
      subtitle={[e.designation, e.employee_code].filter(Boolean).join(" · ")}
      actions={
        <Link
          href={`/admin/dashboard/probation/${r.id}`}
          className="inline-flex items-center h-10 px-4 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-semibold"
        >
          Review and decide
        </Link>
      }
    >
      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Proposal</dt>
          <dd className="font-semibold text-slate-800">{detail}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Manager recommendation</dt>
          <dd className="text-slate-800">{r.recommendation || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Previous extensions</dt>
          <dd className="text-slate-800">{r.extension_count}</dd>
        </div>
        {r.proposed_note && (
          <div className="sm:col-span-3">
            <dt className="text-xs text-slate-500">HR note</dt>
            <dd className="text-slate-700 whitespace-pre-line">{r.proposed_note}</dd>
          </div>
        )}
      </dl>
    </CardShell>
  );
}

const EXIT_STEPS = { manager_acceptance: "Manager acceptance", hr_acceptance: "HR acceptance", chro_approval: "CHRO approval" };

function ExitCard({ item, onAction }) {
  const c = item.entity;
  const e = c.employees || {};
  const resignation = c.type === "Resignation";
  return (
    <CardShell
      icon={DoorOpen}
      kind={resignation ? "Resignation" : `Separation · ${c.type}`}
      stepLabel={EXIT_STEPS[item.step_key] || item.step_key}
      item={item}
      title={e.full_name || "Employee"}
      subtitle={[e.designation, e.employee_code, e.stage].filter(Boolean).join(" · ")}
      actions={
        <>
          <Link href={`/admin/dashboard/exits/${c.id}`} className="inline-flex items-center h-8 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 mr-auto">
            View details
          </Link>
          {resignation ? (
            <Button onClick={() => onAction("accept")}>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Accept
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => onAction("reject")}>
                <XCircle className="w-4 h-4" aria-hidden="true" /> Reject
              </Button>
              <Button onClick={() => onAction("approve")}>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve
              </Button>
            </>
          )}
        </>
      }
    >
      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">{resignation ? "Requested last day" : "Last working day"}</dt>
          <dd className="font-semibold text-slate-800">{formatDate(c.requested_last_day)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Notice period</dt>
          <dd className="text-slate-800">{c.notice_days} days</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Submitted</dt>
          <dd className="text-slate-800">{formatDate(c.submitted_at)}</dd>
        </div>
        {(c.reason_category || c.reason) && (
          <div className="sm:col-span-3">
            <dt className="text-xs text-slate-500">Reason</dt>
            <dd className="text-slate-700 whitespace-pre-line">{[c.reason_category, c.reason].filter(Boolean).join(": ")}</dd>
          </div>
        )}
        {c.manager_comment && (
          <div className="sm:col-span-3">
            <dt className="text-xs text-slate-500">Manager comment</dt>
            <dd className="text-slate-700 whitespace-pre-line">{c.manager_comment}</dd>
          </div>
        )}
      </dl>
    </CardShell>
  );
}

function LeaveCard({ item, onAction }) {
  const r = item.entity;
  const e = r.employees || {};
  return (
    <CardShell
      icon={Plane}
      kind="Leave request"
      stepLabel={item.step_key === "manager_approval" ? "Manager approval" : "HR approval"}
      item={item}
      title={`${e.full_name || "Employee"} · ${r.leave_types?.name || r.leave_type}`}
      subtitle={[e.designation, e.employee_code].filter(Boolean).join(" · ")}
      actions={
        <>
          <Button variant="secondary" onClick={() => onAction("reject")}>
            <XCircle className="w-4 h-4" aria-hidden="true" /> Reject
          </Button>
          <Button onClick={() => onAction("approve")}>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve
          </Button>
        </>
      }
    >
      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Dates</dt>
          <dd className="font-semibold text-slate-800">{leaveDates(r)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Working days</dt>
          <dd className="text-slate-800">{r.days}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Status</dt>
          <dd className="text-slate-800">{r.status}</dd>
        </div>
        {r.reason && (
          <div className="sm:col-span-3">
            <dt className="text-xs text-slate-500">Reason</dt>
            <dd className="text-slate-700">{r.reason}</dd>
          </div>
        )}
      </dl>
    </CardShell>
  );
}
