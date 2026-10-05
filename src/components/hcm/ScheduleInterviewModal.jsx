"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Input, Select, Textarea, ErrorBanner } from "@/components/hcm/ui";
import { hcmJson } from "@/lib/hcm/session";

const TYPES = [
  { value: "hr", label: "HR" },
  { value: "technical", label: "Technical" },
  { value: "managerial", label: "Managerial" },
  { value: "culture", label: "Culture fit" },
  { value: "other", label: "Other" },
];
const MODES = [
  { value: "online", label: "Online" },
  { value: "onsite", label: "Onsite" },
  { value: "phone", label: "Phone" },
];

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Schedules a new interview, or reschedules an existing one.
 * @param {{
 *   application: { id: string, name: string, position: string },
 *   rounds?: { name: string, type: string }[],   // job.interview_rounds
 *   nextRound?: number,                           // 1-based, used to preselect the round
 *   interview?: object,                           // pass to reschedule (needs id, panel:[{id}])
 *   onClose: () => void,
 *   onSaved: (interview) => void,
 * }} props
 */
export default function ScheduleInterviewModal({ application, rounds = [], nextRound = 1, interview, onClose, onSaved }) {
  const editing = Boolean(interview);
  const preset = rounds[nextRound - 1];
  const [form, setForm] = useState(() => ({
    round_name: interview?.round_name || preset?.name || `Round ${nextRound}`,
    type: interview?.type || preset?.type || "technical",
    mode: interview?.mode || "online",
    scheduled_at: toLocalInput(interview?.scheduled_at),
    duration_min: interview?.duration_min || 45,
    meeting_link: interview?.meeting_link || "",
    location: interview?.location || "",
    instructions: interview?.instructions || "",
  }));
  const [panel, setPanel] = useState(() => (interview?.panel || []).map((p) => p.id));
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    hcmJson("/api/hcm/users?lite=1")
      .then((d) => setPeople(d.users))
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => !q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [people, search]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const togglePanel = (id) => setPanel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const pickRound = (name) => {
    const r = rounds.find((x) => x.name === name);
    setForm((f) => ({ ...f, round_name: name, type: r?.type || f.type }));
  };

  const submit = async () => {
    setError("");
    if (!form.scheduled_at) return setError("Pick a date and time.");
    if (!panel.length) return setError("Add at least one interviewer.");
    setSaving(true);
    try {
      const payload = { ...form, scheduled_at: new Date(form.scheduled_at).toISOString(), panel };
      const data = editing
        ? await hcmJson(`/api/hcm/interviews/${interview.id}`, { method: "PATCH", body: { action: "reschedule", ...payload } })
        : await hcmJson("/api/hcm/interviews", { method: "POST", body: { application_id: application.id, ...payload } });
      onSaved(data.interview);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={`${editing ? "Reschedule" : "Schedule"} interview · ${application.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{editing ? "Save changes" : "Schedule and notify"}</Button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="text-xs text-slate-500 mb-4">{application.position}</p>
      {interview?.reschedule_request && (
        <p className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Candidate asked to reschedule: {interview.reschedule_request}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Round" required>
          {rounds.length ? (
            <Select
              value={form.round_name}
              onChange={(e) => pickRound(e.target.value)}
              options={[...new Set([...rounds.map((r) => r.name), form.round_name])]}
            />
          ) : (
            <Input value={form.round_name} onChange={set("round_name")} />
          )}
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={set("type")} options={TYPES} />
        </Field>
        <Field label="Date and time" required>
          <Input type="datetime-local" value={form.scheduled_at} onChange={set("scheduled_at")} />
        </Field>
        <Field label="Duration (minutes)">
          <Input type="number" min={10} max={480} step={5} value={form.duration_min} onChange={set("duration_min")} />
        </Field>
        <Field label="Mode">
          <Select value={form.mode} onChange={set("mode")} options={MODES} />
        </Field>
        {form.mode === "onsite" ? (
          <Field label="Location" required>
            <Input value={form.location} onChange={set("location")} placeholder="Office address, room" />
          </Field>
        ) : (
          <Field label={form.mode === "online" ? "Meeting link" : "Dial-in / phone"} required={form.mode === "online"}>
            <Input value={form.meeting_link} onChange={set("meeting_link")} placeholder={form.mode === "online" ? "https://meet.google.com/..." : "+91 ..."} />
          </Field>
        )}
        <Field label="Instructions for candidate" className="sm:col-span-2">
          <Textarea value={form.instructions} onChange={set("instructions")} placeholder="What to prepare, who to ask for at reception..." />
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-600 mb-2">
          Interview panel <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">({panel.length} selected)</span>
        </p>
        <Input placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search people" />
        <ul className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
          {filtered.map((p) => (
            <li key={p.id}>
              <label className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={panel.includes(p.id)} onChange={() => togglePanel(p.id)} className="size-4 accent-brand-teal-500" />
                <span className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800">{p.full_name}</span>
                  <span className="block text-[11px] text-slate-400 truncate">{p.designation || p.email}</span>
                </span>
              </label>
            </li>
          ))}
          {!filtered.length && <li className="px-3 py-4 text-xs text-slate-400 text-center">No active users found.</li>}
        </ul>
      </div>
      <p className="mt-4 text-[11px] text-slate-400">
        The candidate and panel are notified. Email delivery isn&apos;t connected yet, so emails are recorded in the outbox.
      </p>
    </Modal>
  );
}
