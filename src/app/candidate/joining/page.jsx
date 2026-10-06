"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, DoorOpen, CalendarDays, Clock, MapPin, UserRound, Users, Upload, CheckCircle2, AlertCircle, FileText, Hourglass } from "lucide-react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import { useCandidateSession } from "@/components/CandidatePortal/useCandidateSession";
import { formatDate } from "@/components/hcm/ui";

const DOC_STATUS = {
  Requested: { text: "Upload needed", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: Upload },
  Uploaded: { text: "Under review", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Hourglass },
  Verified: { text: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  Rejected: { text: "Re-upload needed", cls: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
};

function formatTime(value) {
  if (!value) return null;
  const [h, m] = String(value).split(":").map(Number);
  if (!Number.isFinite(h)) return value;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function daysUntil(date) {
  const target = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  const now = new Date();
  return Math.round((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

function DocumentRow({ doc, authFetch, onUploaded }) {
  const input = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const status = DOC_STATUS[doc.status] || DOC_STATUS.Requested;
  const StatusIcon = status.icon;
  const canUpload = doc.status === "Requested" || doc.status === "Rejected";

  const upload = async (file) => {
    if (!file) return;
    setError("");
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return setError("Upload a PDF, JPG or PNG file.");
    if (file.size > 5 * 1024 * 1024) return setError("File exceeds the 5MB limit.");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("document_id", doc.id);
      form.append("file", file);
      const res = await authFetch("/api/candidate/onboarding/documents", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onUploaded(data.document);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <li className="py-4 flex flex-wrap items-center gap-3">
      <FileText className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold text-slate-800">
          {doc.name} {!doc.required && <span className="text-xs font-normal text-slate-400">(optional)</span>}
        </p>
        <p className="text-xs text-slate-500">{doc.file_name || doc.document_types?.description || "PDF, JPG or PNG, up to 5MB"}</p>
        {doc.status === "Rejected" && doc.rejection_reason && <p className="text-xs text-red-600 mt-1">{doc.rejection_reason}</p>}
        {error && (
          <p role="alert" className="text-xs text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>
        <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" /> {status.text}
      </span>
      {canUpload && (
        <>
          <input
            ref={input}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="sr-only"
            id={`file-${doc.id}`}
            onChange={(e) => upload(e.target.files?.[0])}
            disabled={uploading}
          />
          <label
            htmlFor={`file-${doc.id}`}
            className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold cursor-pointer ${
              uploading ? "bg-slate-200 text-slate-500" : "bg-brand-teal-500 hover:bg-brand-teal-600 text-white"
            }`}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
            {uploading ? "Uploading…" : doc.status === "Rejected" ? "Re-upload" : "Upload"}
          </label>
        </>
      )}
    </li>
  );
}

function JoiningContent() {
  const { user, loading, authFetch } = useCandidateSession({ required: true });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return authFetch("/api/candidate/onboarding")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setData(body);
      })
      .catch((err) => setError(err.message || "Failed to load joining details."));
  }, [authFetch]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user || (!data && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" aria-label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
        {error}
      </p>
    );
  }

  const { joiner, documents } = data;
  if (!joiner) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <DoorOpen className="w-10 h-10 text-slate-300 mx-auto mb-4" aria-hidden="true" />
        <p className="text-slate-600 font-medium">Nothing here yet.</p>
        <p className="mt-1 text-sm text-slate-500">Your joining checklist appears once you accept an offer.</p>
        <Link href="/candidate/offers" className="inline-flex mt-6 h-11 items-center px-6 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold">
          View my offers
        </Link>
      </div>
    );
  }

  const joined = joiner.status === "Joined";
  const required = documents.filter((d) => d.required);
  const pending = documents.filter((d) => d.status === "Requested" || d.status === "Rejected");
  const verified = required.filter((d) => d.status === "Verified").length;
  const days = daysUntil(joiner.joining_date);

  const details = [
    { icon: CalendarDays, label: "Joining date", value: formatDate(joiner.joining_date) },
    { icon: Clock, label: "Reporting time", value: formatTime(joiner.reporting_time) },
    { icon: MapPin, label: "Reporting location", value: joiner.reporting_location || joiner.locations?.name },
    { icon: UserRound, label: "Your manager", value: joiner.manager?.full_name },
    { icon: Users, label: "Your buddy", value: joiner.buddy?.full_name },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-600">Welcome to Ascendus</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Getting ready to join</h1>
        <p className="mt-2 text-slate-500">
          {joiner.position}
          {joined ? " · You have joined. Use your official email to sign in to the employee portal." : days > 1 ? ` · ${days} days to go` : days === 1 ? " · Tomorrow!" : days === 0 ? " · Today is your first day!" : ""}
        </p>
      </div>

      {!joined && pending.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Please upload {pending.length} document{pending.length > 1 ? "s" : ""} before your joining date.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <section aria-labelledby="docs-heading" className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="docs-heading" className="text-lg font-bold text-slate-900">
              Documents
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {verified}/{required.length} required verified
            </span>
          </div>
          <ul className="divide-y divide-slate-100 mt-2">
            {documents.map((doc) =>
              joined ? (
                <li key={doc.id} className="py-3 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{doc.name}</span>
                  <span className="text-xs text-slate-500">{DOC_STATUS[doc.status]?.text || doc.status}</span>
                </li>
              ) : (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  authFetch={authFetch}
                  onUploaded={(updated) =>
                    setData((d) => ({ ...d, documents: d.documents.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)) }))
                  }
                />
              )
            )}
          </ul>
        </section>

        <section aria-labelledby="day1-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 h-fit">
          <h2 id="day1-heading" className="text-lg font-bold text-slate-900">
            Your first day
          </h2>
          <dl className="mt-4 space-y-3">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 text-brand-teal-600 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm font-semibold text-slate-800">{value || "To be confirmed"}</dd>
                </div>
              </div>
            ))}
          </dl>
          {joiner.day1_notes && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1">What to know</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{joiner.day1_notes}</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function CandidateJoiningPage() {
  return (
    <PortalShell>
      <JoiningContent />
    </PortalShell>
  );
}
