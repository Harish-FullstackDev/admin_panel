"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FileSignature, CalendarDays, Hourglass, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import { useCandidateSession } from "@/components/CandidatePortal/useCandidateSession";
import { Modal, Button, Field, Input, Textarea, ErrorBanner, formatDate, formatMoney } from "@/components/hcm/ui";

const STATUS_STYLES = {
  Sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Declined: "bg-red-50 text-red-700 border-red-200",
  "Discussion requested": "bg-amber-50 text-amber-700 border-amber-200",
  Expired: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_TEXT = {
  Sent: "Awaiting your response",
  Accepted: "Accepted",
  Declined: "Declined",
  "Discussion requested": "Discussion requested",
  Expired: "Expired",
};

function daysUntil(date) {
  if (!date) return null;
  const end = new Date(`${String(date).slice(0, 10)}T23:59:59`);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function Countdown({ date }) {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days < 0) return <span className="text-slate-500">expired</span>;
  const text = days === 0 ? "expires today" : days === 1 ? "expires tomorrow" : `expires in ${days} days`;
  return <span className={days <= 2 ? "font-semibold text-amber-700" : "text-slate-500"}>{text}</span>;
}

function RespondDialog({ offer, action, expectedName, authFetch, onClose, onDone }) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cfg = {
    accept: { title: "Accept offer", button: "Accept and sign", variant: "primary" },
    decline: { title: "Decline offer", button: "Decline offer", variant: "danger", label: "Reason for declining", placeholder: "Let us know why you are declining." },
    discuss: { title: "Request a discussion", button: "Send request", variant: "primary", label: "What would you like to discuss?", placeholder: "For example, the joining date or compensation details." },
  }[action];

  const submit = async () => {
    setError("");
    if (action === "accept") {
      if (!name.trim()) return setError("Type your full name to sign.");
      if (!agreed) return setError("Please confirm that you accept the terms of this offer.");
    } else if (!note.trim()) {
      return setError(action === "decline" ? "Please share a reason for declining." : "Tell us what you would like to discuss.");
    }
    setSaving(true);
    try {
      const body = action === "accept" ? { id: offer.id, action, name: name.trim() } : { id: offer.id, action, note: note.trim() };
      const res = await authFetch("/api/candidate/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send your response.");
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={cfg.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={cfg.variant} onClick={submit} loading={saving} disabled={action === "accept" && (!agreed || !name.trim())}>
            {cfg.button}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="text-sm text-slate-600 mb-4">
        {offer.position} · {formatMoney(offer.salary, offer.currency)} per year · joining {formatDate(offer.joining_date)}
      </p>
      {action === "accept" ? (
        <div className="space-y-4">
          <Field label="Type your full name to sign" required hint={expectedName ? `Enter your name as it appears on your application, e.g. ${expectedName}.` : undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </Field>
          <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4 accent-brand-teal-500" />
            <span>I accept the terms of this offer.</span>
          </label>
        </div>
      ) : (
        <Field label={cfg.label} required>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder={cfg.placeholder} required />
        </Field>
      )}
    </Modal>
  );
}

function OfferCard({ offer, onRespond }) {
  const breakdown = Array.isArray(offer.breakdown) ? offer.breakdown : [];
  const open = offer.status === "Sent";
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-600">Offer of employment</p>
          <h2 className="mt-0.5 text-lg font-bold text-slate-900">{offer.position}</h2>
          {offer.sent_at && <p className="mt-1 text-xs text-slate-500">Sent {formatDate(offer.sent_at)}</p>}
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[offer.status] || STATUS_STYLES.Expired}`}>
          {STATUS_TEXT[offer.status] || offer.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs text-slate-500">Annual salary</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{formatMoney(offer.salary, offer.currency)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs text-slate-500 inline-flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" /> Joining date
          </p>
          <p className="mt-1 text-base font-bold text-slate-900">{formatDate(offer.joining_date)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Hourglass className="w-3.5 h-3.5" aria-hidden="true" /> Respond by
          </p>
          <p className="mt-1 text-base font-bold text-slate-900">{formatDate(offer.expires_at)}</p>
          {open && (
            <p className="text-xs mt-0.5">
              <Countdown date={offer.expires_at} />
            </p>
          )}
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left text-xs font-semibold text-slate-600 mb-2">Compensation breakdown</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Component</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 border-y border-slate-100">
              {breakdown.map((b, i) => (
                <tr key={`${b.label}-${i}`}>
                  <td className="py-2 text-slate-600">{b.label}</td>
                  <td className="py-2 text-right font-medium text-slate-800">{formatMoney(b.amount, offer.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {offer.letter_body && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-slate-600 mb-2">Offer letter</h3>
          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 sm:p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-line" tabIndex={0}>
            {offer.letter_body}
          </div>
        </div>
      )}

      {open ? (
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-2">
          <Button onClick={() => onRespond(offer, "accept")}>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Accept
          </Button>
          <Button variant="secondary" onClick={() => onRespond(offer, "discuss")}>
            <MessageSquare className="w-4 h-4" aria-hidden="true" /> Request discussion
          </Button>
          <Button variant="secondary" className="hover:text-red-600" onClick={() => onRespond(offer, "decline")}>
            <XCircle className="w-4 h-4" aria-hidden="true" /> Decline
          </Button>
        </div>
      ) : (
        <div className="mt-5 pt-5 border-t border-slate-100 text-sm text-slate-600">
          {offer.status === "Accepted" && (
            <p className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Signed as {offer.accepted_name} on {formatDate(offer.responded_at)}. Welcome aboard!
            </p>
          )}
          {offer.status === "Declined" && <p>You declined this offer on {formatDate(offer.responded_at)}.</p>}
          {offer.status === "Discussion requested" && <p>You asked to discuss this offer on {formatDate(offer.responded_at)}. Our team will be in touch.</p>}
          {offer.status === "Expired" && <p>This offer expired on {formatDate(offer.expires_at)}. Contact our team if you still wish to discuss it.</p>}
          {offer.candidate_note && <p className="mt-2 text-xs text-slate-500">Your note: {offer.candidate_note}</p>}
        </div>
      )}
    </li>
  );
}

function OffersContent() {
  const { user, loading, authFetch } = useCandidateSession({ required: true });
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState(null);

  const load = useCallback(() => {
    return authFetch("/api/candidate/offers")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOffers(data.offers);
      })
      .catch((err) => setError(err.message || "Failed to load offers."));
  }, [authFetch]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user || (!offers && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" aria-label="Loading" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My offers</h1>
        <p className="mt-2 text-slate-500">Review and respond to offers of employment.</p>
      </div>

      {error && (
        <p role="alert" className="p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </p>
      )}

      {offers && offers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600 font-medium">You don&apos;t have any offers yet.</p>
          <Link href="/candidate/dashboard" className="inline-flex mt-6 h-11 items-center px-6 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold">
            View my applications
          </Link>
        </div>
      )}

      {offers?.length > 0 && (
        <ul className="grid gap-6">
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} onRespond={(offer, action) => setResponding({ offer, action })} />
          ))}
        </ul>
      )}

      {responding && (
        <RespondDialog
          offer={responding.offer}
          action={responding.action}
          expectedName={user.user_metadata?.full_name}
          authFetch={authFetch}
          onClose={() => setResponding(null)}
          onDone={() => {
            setResponding(null);
            load();
          }}
        />
      )}
    </>
  );
}

export default function CandidateOffersPage() {
  return (
    <PortalShell>
      <OffersContent />
    </PortalShell>
  );
}
