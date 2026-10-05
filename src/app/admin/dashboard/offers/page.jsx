"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSignature, Lock, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Badge,
  Spinner,
  EmptyState,
  ErrorBanner,
  Modal,
  formatDate,
  formatMoney,
} from "@/components/hcm/ui";

const STATUSES = ["Draft", "Pending approval", "Approved", "Sent", "Accepted", "Declined", "Discussion requested", "Expired", "Withdrawn"];
const TABS = ["All", ...STATUSES];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

const STATUS_STYLES = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  "Pending approval": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-teal-50 text-teal-700 border-teal-200",
  Sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Declined: "bg-red-50 text-red-700 border-red-200",
  "Discussion requested": "bg-orange-50 text-orange-700 border-orange-200",
  Expired: "bg-slate-100 text-slate-500 border-slate-200",
  Withdrawn: "bg-slate-100 text-slate-500 border-slate-200",
};

const APPROVAL_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const ABOVE_BAND = "bg-red-50 text-red-700 border-red-200";

function StatusBadge({ status }) {
  return <Badge className={STATUS_STYLES[status]}>{status}</Badge>;
}

function dateInput(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fullName(app) {
  return [app?.first_name, app?.last_name].filter(Boolean).join(" ");
}

function letterTemplate({ name, position, salary, currency, joining }) {
  return `Dear ${name || "[Candidate name]"},

We are delighted to offer you the position of ${position || "[Position]"} at Ascendus.

Your annual compensation will be ${salary ? formatMoney(salary, currency) : "[Annual salary]"}, as detailed in the compensation breakdown enclosed with this offer. Your expected date of joining is ${joining ? formatDate(joining) : "[Joining date]"}.

This offer is subject to satisfactory verification of your documents and references. Please review the terms and confirm your acceptance before the offer expiry date.

We look forward to welcoming you to the team.

Warm regards,
Human Resources
Ascendus`;
}

function bandLabel(band, currency) {
  if (!band || (band.min == null && band.max == null)) return "No band configured";
  const cur = band.currency || currency;
  if (band.min != null && band.max != null) return `${formatMoney(band.min, cur)} – ${formatMoney(band.max, cur)}`;
  if (band.max != null) return `Up to ${formatMoney(band.max, cur)}`;
  return `From ${formatMoney(band.min, cur)}`;
}

export default function OffersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <Suspense fallback={<Spinner />}>
        <OffersGate />
      </Suspense>
    </div>
  );
}

function OffersGate() {
  const { user, can } = useInternalUser();
  if (!user) return <Spinner />;
  if (!can("offer.create") && !can("offer.approve")) {
    return <EmptyState icon={Lock} title="You don't have access to this page" description="Ask an administrator for the offer.create or offer.approve permission." />;
  }
  return <OffersManager />;
}

function OffersManager() {
  const { can } = useInternalUser();
  const params = useSearchParams();
  const presetApplication = params.get("application");
  const canCreate = can("offer.create");

  const [tab, setTab] = useState("All");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(null);
  const [openId, setOpenId] = useState(null);
  const presetHandled = useRef(false);

  const load = useCallback(async (status) => {
    setLoading(true);
    setError("");
    try {
      const qs = status === "All" ? "" : `?status=${encodeURIComponent(status)}`;
      const data = await hcmJson(`/api/hcm/offers${qs}`);
      setOffers(data.offers || []);
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
    if (presetApplication && canCreate && !presetHandled.current) {
      presetHandled.current = true;
      setCreating({ applicationId: presetApplication });
    }
  }, [presetApplication, canCreate]);

  const refresh = () => load(tab);

  return (
    <>
      <PageHeader
        title="Offers"
        description="Draft, approve and send offers to selected candidates."
        actions={
          canCreate && (
            <Button onClick={() => setCreating({ applicationId: "" })}>
              <Plus className="w-4 h-4" aria-hidden="true" /> New offer
            </Button>
          )
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <div role="tablist" aria-label="Filter offers by status" className="flex flex-wrap gap-1 p-1 mb-5 rounded-xl bg-slate-100 w-fit max-w-full">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : offers.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title={tab === "All" ? "No offers yet" : `No ${tab.toLowerCase()} offers`}
          description={canCreate ? "Create an offer for a candidate in the Selected stage." : undefined}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-3 py-3">Position</th>
                  <th className="px-3 py-3 text-right">Annual salary</th>
                  <th className="px-3 py-3">Joining</th>
                  <th className="px-3 py-3">Expires</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr
                    key={o.id}
                    tabIndex={0}
                    onClick={() => setOpenId(o.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenId(o.id);
                      }
                    }}
                    aria-label={`Open offer for ${fullName(o.applications)}`}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer focus:outline-none focus:bg-brand-teal-50"
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-800">{fullName(o.applications)}</div>
                      <div className="text-xs text-slate-500">{o.applications?.email}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{o.applications?.position}</td>
                    <td className="px-3 py-3 text-right font-medium text-slate-800 whitespace-nowrap">{formatMoney(o.salary, o.currency)}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatDate(o.joining_date)}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatDate(o.expires_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={o.status} />
                        {o.requires_approval && <Badge className={ABOVE_BAND}>Above band</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {creating && (
        <OfferFormModal
          presetApplicationId={creating.applicationId}
          onClose={() => setCreating(null)}
          onChanged={refresh}
          onOpenDetail={(id) => {
            setCreating(null);
            setOpenId(id);
          }}
        />
      )}

      {openId && <OfferDetailModal id={openId} onClose={() => setOpenId(null)} onChanged={refresh} />}
    </>
  );
}

function BreakdownEditor({ rows, setRows, salary, currency }) {
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const hasAmounts = rows.some((r) => r.amount !== "" && r.amount !== null && r.amount !== undefined);
  const mismatch = hasAmounts && Number(salary) > 0 && Math.round(total) !== Math.round(Number(salary));
  const update = (index, key, value) => setRows((list) => list.map((r, i) => (i === index ? { ...r, [key]: value } : r)));

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1.5">Compensation breakdown</p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <Input aria-label={`Component ${i + 1} label`} placeholder="e.g. Basic salary" value={r.label} onChange={(e) => update(i, "label", e.target.value)} />
            <Input
              aria-label={`Component ${i + 1} amount`}
              type="number"
              min={0}
              step="any"
              placeholder="Amount"
              value={r.amount}
              onChange={(e) => update(i, "amount", e.target.value)}
              className="max-w-[160px]"
            />
            <Button
              type="button"
              variant="ghost"
              aria-label={`Remove component ${i + 1}`}
              onClick={() => setRows((list) => list.filter((_, idx) => idx !== i))}
              className="shrink-0 px-2.5"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setRows((list) => [...list, { label: "", amount: "" }])}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add component
        </Button>
        <span className="text-xs text-slate-600">
          Total: <strong className="text-slate-900">{formatMoney(total, currency)}</strong>
        </span>
      </div>
      {mismatch && (
        <p role="status" className="mt-2 text-xs text-amber-700 inline-flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Breakdown total differs from the annual salary ({formatMoney(salary, currency)}).
        </p>
      )}
    </div>
  );
}

function OfferFormModal({ presetApplicationId = "", offer, onClose, onChanged, onOpenDetail }) {
  const editing = Boolean(offer);
  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(!editing);
  const [applicationId, setApplicationId] = useState(offer?.application_id || presetApplicationId || "");
  const [salary, setSalary] = useState(offer?.salary ?? "");
  const [currency, setCurrency] = useState(offer?.currency || "INR");
  const [rows, setRows] = useState(() =>
    offer?.breakdown?.length
      ? offer.breakdown.map((b) => ({ label: b.label, amount: String(b.amount) }))
      : [
          { label: "Basic salary", amount: "" },
          { label: "House rent allowance", amount: "" },
          { label: "Special allowance", amount: "" },
        ]
  );
  const [joining, setJoining] = useState(offer?.joining_date || "");
  const [expires, setExpires] = useState(offer?.expires_at || dateInput(7));
  const [letter, setLetter] = useState(offer?.letter_body || "");
  const [letterTouched, setLetterTouched] = useState(editing);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (editing) return;
    hcmJson("/api/hcm/applications?stage=Selected")
      .then((d) => setApps(d.applications || []))
      .catch((e) => setError(e.message))
      .finally(() => setAppsLoading(false));
  }, [editing]);

  const selected = useMemo(() => (editing ? offer.applications : apps.find((a) => a.id === applicationId)), [editing, offer, apps, applicationId]);

  useEffect(() => {
    if (letterTouched) return;
    setLetter(letterTemplate({ name: fullName(selected), position: selected?.position, salary, currency, joining }));
  }, [letterTouched, selected, salary, currency, joining]);

  const payload = () => ({
    salary: Number(salary),
    currency,
    breakdown: rows.filter((r) => r.label.trim() && r.amount !== "").map((r) => ({ label: r.label.trim(), amount: Number(r.amount) })),
    joining_date: joining,
    expires_at: expires,
    letter_body: letter,
  });

  const save = async () => {
    setError("");
    if (!editing && !applicationId) return setError("Choose a candidate.");
    if (!(Number(salary) > 0)) return setError("Enter a valid annual salary.");
    if (!joining || !expires) return setError("Joining and expiry dates are required.");
    if (joining < expires) return setError("Joining date should be on or after the offer expiry date.");
    if (!letter.trim()) return setError("Offer letter text is required.");
    setSaving("save");
    try {
      if (editing) {
        await hcmJson(`/api/hcm/offers/${offer.id}`, { method: "POST", body: { action: "update", ...payload() } });
        onChanged();
        onClose();
      } else {
        const data = await hcmJson("/api/hcm/offers", { method: "POST", body: { application_id: applicationId, ...payload() } });
        setCreated(data);
        onChanged();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving("");
    }
  };

  const submitCreated = async () => {
    setSaving("submit");
    setError("");
    try {
      await hcmJson(`/api/hcm/offers/${created.offer.id}`, { method: "POST", body: { action: "submit" } });
      onChanged();
      onOpenDetail(created.offer.id);
    } catch (err) {
      setError(err.message);
      setSaving("");
    }
  };

  if (created) {
    const { offer: o, band } = created;
    return (
      <Modal
        title="Offer drafted"
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Keep as draft</Button>
            <Button onClick={submitCreated} loading={saving === "submit"}>
              {o.requires_approval ? "Submit for CHRO approval" : "Submit"}
            </Button>
          </>
        }
      >
        <ErrorBanner message={error} />
        <p className="text-sm text-slate-700">
          Draft offer created for <strong>{fullName(o.applications)}</strong> · {o.applications?.position} at{" "}
          <strong>{formatMoney(o.salary, o.currency)}</strong>.
        </p>
        <p className="mt-2 text-xs text-slate-500">Salary band: {bandLabel(band, o.currency)}</p>
        {o.requires_approval ? (
          <p className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            The salary is above the band, so this offer needs CHRO approval before it can be sent.
          </p>
        ) : (
          <p className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            The salary is within band. Submitting approves it automatically, and you can then send it to the candidate.
          </p>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      wide
      title={editing ? `Edit offer · ${fullName(offer.applications)}` : "New offer"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving === "save"}>{editing ? "Save changes" : "Create draft"}</Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {editing ? (
          <div className="sm:col-span-2 text-sm text-slate-700">
            <span className="font-semibold">{fullName(offer.applications)}</span> · {offer.applications?.position}
          </div>
        ) : (
          <Field label="Candidate" required className="sm:col-span-2" hint={!appsLoading && !apps.length ? "No candidates are in the Selected stage." : undefined}>
            <Select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder={appsLoading ? "Loading..." : "Choose a selected candidate"}
              disabled={appsLoading}
              options={apps.map((a) => ({ value: a.id, label: `${fullName(a)} · ${a.position}` }))}
            />
          </Field>
        )}
        {selected?.expected_salary && (
          <p className="sm:col-span-2 -mt-2 text-xs text-slate-500">Candidate&apos;s expected salary: {selected.expected_salary}</p>
        )}
        <Field label="Annual salary" required>
          <Input type="number" min={0} step="any" value={salary} onChange={(e) => setSalary(e.target.value)} />
        </Field>
        <Field label="Currency">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES} />
        </Field>
        <div className="sm:col-span-2">
          <BreakdownEditor rows={rows} setRows={setRows} salary={salary} currency={currency} />
        </div>
        <Field label="Joining date" required>
          <Input type="date" min={expires || undefined} value={joining} onChange={(e) => setJoining(e.target.value)} />
        </Field>
        <Field label="Offer expires on" required hint="The candidate must respond by this date.">
          <Input type="date" min={dateInput(0)} value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Offer letter" required hint={letterTouched ? undefined : "Generated from the details above. Edit freely; it stops updating once you do."}>
            <Textarea
              rows={12}
              value={letter}
              onChange={(e) => {
                setLetterTouched(true);
                setLetter(e.target.value);
              }}
            />
          </Field>
          {letterTouched && (
            <button
              type="button"
              onClick={() => setLetterTouched(false)}
              className="mt-1 text-xs font-semibold text-brand-teal-600 hover:underline cursor-pointer"
            >
              Regenerate from template
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function OfferDetailModal({ id, onClose, onChanged }) {
  const { user, can } = useInternalUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [prompt, setPrompt] = useState(null);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await hcmJson(`/api/hcm/offers/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, withComment) => {
    setBusy(action);
    setError("");
    try {
      await hcmJson(`/api/hcm/offers/${id}`, { method: "POST", body: { action, comment: withComment ? comment.trim() : undefined } });
      setPrompt(null);
      setComment("");
      onChanged();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  if (editing && data) {
    return (
      <OfferFormModal
        offer={data.offer}
        onClose={() => {
          setEditing(false);
          load();
        }}
        onChanged={onChanged}
        onOpenDetail={() => setEditing(false)}
      />
    );
  }

  const offer = data?.offer;
  const band = data?.band;
  const approvals = data?.approvals || [];
  const canCreate = can("offer.create");
  const ownOffer = offer?.created_by === user?.id;
  const breakdown = offer?.breakdown || [];
  const breakdownTotal = breakdown.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  const PROMPTS = {
    reject: { title: "Send back to draft", label: "Reason for rejecting", required: true, button: "Reject", variant: "danger" },
    approve: { title: "Approve offer", label: "Comment (optional)", required: false, button: "Approve", variant: "primary" },
    withdraw: { title: "Withdraw offer", label: "Reason for withdrawing", required: true, button: "Withdraw offer", variant: "danger" },
  };

  const actions = [];
  if (offer) {
    const s = offer.status;
    if (s === "Draft" && canCreate) {
      actions.push(<Button key="edit" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>);
      actions.push(
        <Button key="submit" onClick={() => run("submit")} loading={busy === "submit"}>
          {offer.requires_approval ? "Submit for approval" : "Submit"}
        </Button>
      );
    }
    if (s === "Pending approval" && can("offer.approve") && !ownOffer) {
      actions.push(<Button key="reject" variant="secondary" onClick={() => setPrompt("reject")}>Reject</Button>);
      actions.push(<Button key="approve" onClick={() => setPrompt("approve")}>Approve</Button>);
    }
    if (s === "Approved" && canCreate) {
      actions.push(<Button key="send" onClick={() => run("send")} loading={busy === "send"}>Send to candidate</Button>);
    }
    if (s === "Discussion requested" && canCreate) {
      actions.push(<Button key="revise" onClick={() => run("revise")} loading={busy === "revise"}>Revise offer</Button>);
    }
    if (["Draft", "Pending approval", "Approved", "Sent", "Discussion requested"].includes(s) && canCreate) {
      actions.unshift(
        <Button key="withdraw" variant="ghost" className="text-red-600 hover:bg-red-50 mr-auto" onClick={() => setPrompt("withdraw")}>
          Withdraw
        </Button>
      );
    }
  }

  const active = prompt ? PROMPTS[prompt] : null;
  const footer = !offer ? null : active ? (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setPrompt(null);
          setComment("");
        }}
      >
        Back
      </Button>
      <Button variant={active.variant} onClick={() => run(prompt, true)} loading={busy === prompt} disabled={active.required && !comment.trim()}>
        {active.button}
      </Button>
    </>
  ) : actions.length ? (
    <>{actions}</>
  ) : (
    <Button variant="secondary" onClick={onClose}>Close</Button>
  );

  const salaryNum = Number(offer?.salary);
  const aboveBand = band?.max != null && salaryNum > Number(band.max);
  const belowBand = band?.min != null && salaryNum < Number(band.min);

  return (
    <Modal wide title={offer ? `Offer · ${fullName(offer.applications)}` : "Offer"} onClose={onClose} footer={footer}>
      <ErrorBanner message={error} onClose={() => setError("")} />
      {!offer ? (
        !error && <Spinner />
      ) : (
        <div className="space-y-6">
          {active && (
            <section className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-sm font-bold text-slate-900 mb-3">{active.title}</p>
              <Field label={active.label} required={active.required}>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} autoFocus />
              </Field>
            </section>
          )}

          {offer.status === "Pending approval" && ownOffer && can("offer.approve") && (
            <p className="text-xs text-slate-500">You drafted this offer, so another approver must review it.</p>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-700">
                {offer.applications?.position} · <span className="text-slate-500">{offer.applications?.email}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Created {formatDate(offer.created_at, true)}
                {offer.sent_at && ` · Sent ${formatDate(offer.sent_at, true)}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <StatusBadge status={offer.status} />
              {offer.requires_approval && <Badge className={ABOVE_BAND}>Above band</Badge>}
            </div>
          </div>

          <section aria-label="Salary and band" className="grid gap-3 sm:grid-cols-4">
            {[
              ["Annual salary", formatMoney(offer.salary, offer.currency)],
              ["Salary band", bandLabel(band, offer.currency)],
              ["Joining date", formatDate(offer.joining_date)],
              ["Offer expires", formatDate(offer.expires_at)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">{k}</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </section>
          {band && (aboveBand || belowBand) && (
            <p className={`-mt-3 text-xs inline-flex items-center gap-1 ${aboveBand ? "text-red-700" : "text-amber-700"}`}>
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              {aboveBand
                ? `${formatMoney(salaryNum - Number(band.max), offer.currency)} above the band maximum. Requires CHRO approval.`
                : `${formatMoney(Number(band.min) - salaryNum, offer.currency)} below the band minimum.`}
            </p>
          )}

          <section aria-labelledby="offer-breakdown">
            <h3 id="offer-breakdown" className="text-sm font-bold text-slate-900 mb-2">
              Compensation breakdown
            </h3>
            {breakdown.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                    <th className="py-2">Component</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((b, i) => (
                    <tr key={`${b.label}-${i}`} className="border-b border-slate-50">
                      <td className="py-2 text-slate-600">{b.label}</td>
                      <td className="py-2 text-right text-slate-800">{formatMoney(b.amount, offer.currency)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 font-semibold text-slate-700">Total</td>
                    <td className="py-2 text-right font-bold text-slate-900">{formatMoney(breakdownTotal, offer.currency)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-400">No breakdown provided.</p>
            )}
            {breakdown.length > 0 && Math.round(breakdownTotal) !== Math.round(salaryNum) && (
              <p className="mt-1 text-xs text-amber-700">Breakdown total differs from the annual salary.</p>
            )}
          </section>

          {(offer.candidate_note || offer.accepted_name) && (
            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Candidate response</h3>
              {offer.accepted_name && (
                <p className="text-sm text-slate-700">
                  Signed as <strong>{offer.accepted_name}</strong> on {formatDate(offer.responded_at, true)}
                </p>
              )}
              {offer.candidate_note && <p className="text-sm text-slate-700 whitespace-pre-line mt-1">{offer.candidate_note}</p>}
              {!offer.accepted_name && offer.responded_at && <p className="text-[11px] text-slate-400 mt-1">{formatDate(offer.responded_at, true)}</p>}
            </section>
          )}

          <section aria-labelledby="offer-approvals">
            <h3 id="offer-approvals" className="text-sm font-bold text-slate-900 mb-2">
              Approval trail
            </h3>
            {approvals.length ? (
              <ol className="space-y-2">
                {approvals.map((a) => (
                  <li key={a.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">Step {Number(a.step) + 1}{a.step_key ? ` · ${a.step_key}` : ""}</span>
                      <Badge className={APPROVAL_STYLES[a.status]}>{a.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested {formatDate(a.created_at, true)}
                      {a.status === "Pending" && a.due_at && ` · Due ${formatDate(a.due_at)}`}
                      {a.decided_at && ` · Decided ${formatDate(a.decided_at, true)}`}
                      {a.decided_by_name && ` by ${a.decided_by_name}`}
                    </p>
                    {a.comment && <p className="text-xs text-slate-700 mt-1 whitespace-pre-line">{a.comment}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-slate-400">{offer.requires_approval ? "Not yet submitted for approval." : "Within band. No approval needed."}</p>
            )}
          </section>

          <section aria-labelledby="offer-letter">
            <h3 id="offer-letter" className="text-sm font-bold text-slate-900 mb-2">
              Offer letter
            </h3>
            <div tabIndex={0} className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {offer.letter_body}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
