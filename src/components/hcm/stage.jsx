"use client";

import { useEffect, useState } from "react";
import { Printer, Star } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { Button, Field, Textarea, Select, ErrorBanner, Modal, Spinner, Badge, formatDate } from "@/components/hcm/ui";

export const REVIEW_LABELS = { self: "Self-assessment", mid: "Mid-point review", final: "Final review" };

export function RatingButtons({ value, onChange, label, disabled }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} of 5`}
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:cursor-default ${
            value === n
              ? "bg-brand-teal-500 border-brand-teal-500 text-white"
              : value && n < value
                ? "bg-brand-teal-50 border-brand-teal-200 text-brand-teal-700"
                : "bg-white border-slate-200 text-slate-500 hover:border-brand-teal-300"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Editable review (self / mid / final). Saves a draft or submits. */
export function ReviewForm({ type, criteria, recommendations, review, onSave, disabled }) {
  const [form, setForm] = useState(() => ({
    ratings: review?.ratings || {},
    overall: review?.overall || null,
    strengths: review?.strengths || "",
    improvements: review?.improvements || "",
    comments: review?.comments || "",
    recommendation: review?.recommendation || "",
  }));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const save = async (submit) => {
    setBusy(submit ? "submit" : "save");
    setError("");
    try {
      await onSave({ ...form, type, recommendation: form.recommendation || null }, submit);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const isSelf = type === "self";
  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onClose={() => setError("")} />
      <div className="space-y-2.5">
        {criteria.map((c) => (
          <div key={c} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-slate-700">{c}</span>
            <RatingButtons label={c} value={form.ratings[c] || null} disabled={disabled} onChange={(n) => setForm((f) => ({ ...f, ratings: { ...f.ratings, [c]: n } }))} />
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="text-sm font-semibold text-slate-800">Overall</span>
          <RatingButtons label="Overall" value={form.overall} disabled={disabled} onChange={(n) => setForm((f) => ({ ...f, overall: n }))} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={isSelf ? "What went well" : "Strengths"}>
          <Textarea disabled={disabled} value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} />
        </Field>
        <Field label={isSelf ? "Where I want to improve" : "Areas to improve"}>
          <Textarea disabled={disabled} value={form.improvements} onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))} />
        </Field>
        <Field label="Comments" className="sm:col-span-2">
          <Textarea disabled={disabled} value={form.comments} onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))} />
        </Field>
        {type === "final" && (
          <Field label="Recommendation" required className="sm:col-span-2">
            <Select disabled={disabled} placeholder="Choose…" options={recommendations} value={form.recommendation} onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))} />
          </Field>
        )}
      </div>
      {!disabled && (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => save(false)} loading={busy === "save"} disabled={Boolean(busy)}>
            Save draft
          </Button>
          <Button onClick={() => save(true)} loading={busy === "submit"} disabled={Boolean(busy)}>
            Submit
          </Button>
        </div>
      )}
      {!disabled && <p className="text-[11px] text-slate-400 text-right">Submitted reviews are locked{isSelf ? "" : " and shared with the employee"}.</p>}
    </div>
  );
}

/** Read-only view of a submitted review. */
export function ReviewSummary({ review, criteria }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {review.reviewer?.full_name && <span>by {review.reviewer.full_name}</span>}
        {review.submitted_at && <span>· submitted {formatDate(review.submitted_at)}</span>}
        {review.recommendation && <Badge className="bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200">Recommends: {review.recommendation}</Badge>}
      </div>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {criteria.map((c) => (
          <div key={c} className="flex items-center justify-between gap-2 text-sm">
            <dt className="text-slate-600">{c}</dt>
            <dd>
              <Stars value={review.ratings?.[c]} />
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 text-sm font-semibold">
          <dt className="text-slate-800">Overall</dt>
          <dd>
            <Stars value={review.overall} />
          </dd>
        </div>
      </dl>
      {[
        ["Strengths", review.strengths],
        ["To improve", review.improvements],
        ["Comments", review.comments],
      ]
        .filter(([, v]) => v)
        .map(([label, v]) => (
          <div key={label}>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-sm text-slate-700 whitespace-pre-line">{v}</p>
          </div>
        ))}
    </div>
  );
}

/** Opens a stored letter with a print button. */
export function LetterModal({ letterId, onClose }) {
  const [letter, setLetter] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    hcmJson(`/api/hcm/letters/${letterId}`)
      .then((d) => setLetter(d.letter))
      .catch((err) => setError(err.message));
  }, [letterId]);

  const print = () => {
    const w = window.open("", "_blank", "noopener,width=800,height=900");
    if (!w) return;
    const doc = w.document;
    doc.title = letter.title;
    const wrap = doc.createElement("div");
    wrap.style.cssText = "font-family: Georgia, serif; max-width: 640px; margin: 48px auto; line-height: 1.6; white-space: pre-line; color: #111;";
    const h = doc.createElement("h2");
    h.textContent = letter.title;
    const body = doc.createElement("div");
    body.textContent = letter.body;
    wrap.append(h, body);
    doc.body.append(wrap);
    w.print();
  };

  return (
    <Modal
      title={letter?.title || "Letter"}
      onClose={onClose}
      wide
      footer={
        letter && (
          <Button variant="secondary" onClick={print}>
            <Printer className="w-4 h-4" aria-hidden="true" /> Print
          </Button>
        )
      }
    >
      <ErrorBanner message={error} />
      {!letter && !error ? (
        <Spinner />
      ) : letter ? (
        <article className="font-serif text-[15px] leading-relaxed text-slate-800 whitespace-pre-line">{letter.body}</article>
      ) : null}
    </Modal>
  );
}
