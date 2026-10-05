"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { Card, Button, Field, Input, Textarea, Select, Badge, Spinner, ErrorBanner, formatMoney } from "@/components/hcm/ui";

export const REQUISITION_STATUS_STYLES = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  "Pending HR": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending CHRO": "bg-orange-50 text-orange-700 border-orange-200",
  "Sent back": "bg-yellow-50 text-yellow-800 border-yellow-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Posted: "bg-sky-50 text-sky-700 border-sky-200",
  Filled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Closed: "bg-slate-100 text-slate-500 border-slate-200",
  Withdrawn: "bg-slate-50 text-slate-400 border-slate-200",
};

export function RequisitionStatusBadge({ status }) {
  return <Badge className={REQUISITION_STATUS_STYLES[status] || undefined}>{status}</Badge>;
}

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

function initialState(req) {
  return {
    role_title: req?.role_title || "",
    openings: req?.openings ? String(req.openings) : "1",
    request_type: req?.request_type || "New",
    replacing_name: req?.replacing_name || "",
    employment_type: req?.employment_type || "Full-time",
    department_id: req?.department_id || "",
    location_id: req?.location_id || "",
    grade_id: req?.grade_id || "",
    budget_min: req?.budget_min ?? "",
    budget_max: req?.budget_max ?? "",
    currency: req?.currency || "INR",
    target_date: req?.target_date ? String(req.target_date).slice(0, 10) : "",
    justification: req?.justification || "",
  };
}

export default function RequisitionForm({ initial = null, onSave, onCancel, allowSubmit = true }) {
  const [form, setForm] = useState(() => initialState(initial));
  const [skills, setSkills] = useState(() => (Array.isArray(initial?.skills) ? initial.skills : []));
  const [skillDraft, setSkillDraft] = useState("");
  const [lists, setLists] = useState({ departments: [], locations: [], grades: [] });
  const [loadingLists, setLoadingLists] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      hcmJson("/api/hcm/org/departments"),
      hcmJson("/api/hcm/org/locations"),
      hcmJson("/api/hcm/org/grades"),
    ])
      .then(([d, l, g]) => {
        if (active) setLists({ departments: d.items || [], locations: l.items || [], grades: g.items || [] });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingLists(false));
    return () => {
      active = false;
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const grade = useMemo(() => lists.grades.find((g) => g.id === form.grade_id), [lists.grades, form.grade_id]);
  const gradeHint = grade
    ? grade.band_min != null || grade.band_max != null
      ? `Band: ${formatMoney(grade.band_min, grade.currency || form.currency)} – ${formatMoney(grade.band_max, grade.currency || form.currency)}`
      : "No band defined for this grade."
    : undefined;

  const addSkills = (text) => {
    const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setSkills((list) => [...list, ...parts.filter((p) => !list.some((s) => s.toLowerCase() === p.toLowerCase()))]);
  };

  const onSkillKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkills(skillDraft);
      setSkillDraft("");
    } else if (e.key === "Backspace" && !skillDraft && skills.length) {
      setSkills((list) => list.slice(0, -1));
    }
  };

  const onSkillChange = (e) => {
    const value = e.target.value;
    if (value.includes(",")) {
      const idx = value.lastIndexOf(",");
      addSkills(value.slice(0, idx));
      setSkillDraft(value.slice(idx + 1));
    } else {
      setSkillDraft(value);
    }
  };

  const validate = (submit) => {
    if (!form.role_title.trim()) return "Role title is required.";
    const openings = parseInt(form.openings, 10);
    if (!openings || openings < 1) return "Number of openings must be at least 1.";
    if (form.budget_min !== "" && form.budget_max !== "" && Number(form.budget_min) > Number(form.budget_max)) {
      return "Budget minimum must not exceed maximum.";
    }
    if (submit) {
      if (!form.department_id) return "Department is required to submit.";
      if (form.request_type === "Replacement" && !form.replacing_name.trim()) return "Name the person who is leaving.";
      if (!form.justification.trim()) return "Justification is required to submit.";
    }
    return null;
  };

  const save = async (submit) => {
    setError("");
    const problem = validate(submit);
    if (problem) {
      setError(problem);
      return;
    }
    const pendingSkills = skillDraft.trim() ? [...skills, ...skillDraft.split(",").map((s) => s.trim()).filter(Boolean)] : skills;
    setSaving(submit ? "submit" : "draft");
    try {
      await onSave(
        {
          ...form,
          openings: parseInt(form.openings, 10),
          replacing_name: form.request_type === "Replacement" ? form.replacing_name : "",
          skills: pendingSkills,
        },
        submit
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving("");
    }
  };

  if (loadingLists) return <Spinner label="Loading form..." />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(allowSubmit);
      }}
      className="space-y-6"
      noValidate
    >
      <ErrorBanner message={error} onClose={() => setError("")} />

      <Card title="Role">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Role title" required className="lg:col-span-2">
            <Input value={form.role_title} onChange={set("role_title")} placeholder="e.g. Senior Backend Engineer" required />
          </Field>
          <Field label="Number of openings" required>
            <Input type="number" min={1} value={form.openings} onChange={set("openings")} required />
          </Field>
          <Field label="Request type" required>
            <Select options={["New", "Replacement"]} value={form.request_type} onChange={set("request_type")} />
          </Field>
          {form.request_type === "Replacement" && (
            <Field label="Who is leaving" required>
              <Input value={form.replacing_name} onChange={set("replacing_name")} placeholder="Employee name" />
            </Field>
          )}
          <Field label="Employment type">
            <Select options={EMPLOYMENT_TYPES} value={form.employment_type} onChange={set("employment_type")} />
          </Field>
          <Field label="Department" required>
            <Select
              placeholder="Select department"
              options={lists.departments.map((d) => ({ value: d.id, label: d.name }))}
              value={form.department_id}
              onChange={set("department_id")}
            />
          </Field>
          <Field label="Location">
            <Select
              placeholder="Select location"
              options={lists.locations.map((l) => ({ value: l.id, label: l.name }))}
              value={form.location_id}
              onChange={set("location_id")}
            />
          </Field>
          <Field label="Grade" hint={gradeHint}>
            <Select
              placeholder="Select grade"
              options={lists.grades.map((g) => ({ value: g.id, label: g.name ? `${g.code} · ${g.name}` : g.code }))}
              value={form.grade_id}
              onChange={set("grade_id")}
            />
          </Field>
        </div>
      </Card>

      <Card title="Budget and timeline">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Budget min (annual)">
            <Input type="number" min={0} value={form.budget_min} onChange={set("budget_min")} />
          </Field>
          <Field label="Budget max (annual)">
            <Input type="number" min={0} value={form.budget_max} onChange={set("budget_max")} />
          </Field>
          <Field label="Currency">
            <Select options={CURRENCIES.includes(form.currency) ? CURRENCIES : [form.currency, ...CURRENCIES]} value={form.currency} onChange={set("currency")} />
          </Field>
          <Field label="Target joining date">
            <Input type="date" value={form.target_date} onChange={set("target_date")} />
          </Field>
        </div>
      </Card>

      <Card title="Details">
        <div className="space-y-4">
          <div>
            <label htmlFor="req-skills" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Skills
            </label>
            <div className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-xl border border-slate-200 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-teal-200">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-brand-teal-50 border border-brand-teal-100 text-brand-teal-700 text-xs font-semibold pl-2.5 pr-1 py-0.5">
                  {s}
                  <button
                    type="button"
                    aria-label={`Remove ${s}`}
                    onClick={() => setSkills((list) => list.filter((x) => x !== s))}
                    className="p-0.5 rounded-full hover:bg-brand-teal-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                id="req-skills"
                value={skillDraft}
                onChange={onSkillChange}
                onKeyDown={onSkillKey}
                onBlur={() => {
                  addSkills(skillDraft);
                  setSkillDraft("");
                }}
                placeholder={skills.length ? "" : "Type a skill and press comma or Enter"}
                className="flex-1 min-w-[160px] h-7 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>
          <Field label="Justification" required={allowSubmit} hint="Why is this hire needed? Required to submit for approval.">
            <Textarea rows={4} value={form.justification} onChange={set("justification")} />
          </Field>
        </div>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={Boolean(saving)}>
            Cancel
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => save(false)} loading={saving === "draft"} disabled={Boolean(saving)}>
          Save draft
        </Button>
        {allowSubmit && (
          <Button type="submit" loading={saving === "submit"} disabled={Boolean(saving)}>
            Submit for approval
          </Button>
        )}
      </div>
    </form>
  );
}
