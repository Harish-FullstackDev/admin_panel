"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle, FileText, Upload } from "lucide-react";
import { useCandidateSession } from "./useCandidateSession";

const inputClass =
  "w-full h-10 bg-slate-50 rounded-lg px-3 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all";
const labelClass = "block text-sm font-medium text-slate-800 mb-1.5";

function Field({ label, required, className, as = "input", options, ...props }) {
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={props.id} className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {as === "select" ? (
        <select {...props} required={required} className={`${inputClass} cursor-pointer`}>
          <option value="" disabled>Select an option</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <Tag
          {...props}
          required={required}
          className={as === "textarea" ? `${inputClass} h-auto min-h-20 py-2 resize-y` : inputClass}
        />
      )}
    </div>
  );
}

function Card({ title, description, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const EXPERIENCE_LEVELS = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const START_DATE_OPTIONS = ["Immediate", "Within 2 weeks", "Within 1 month", "More than 1 month"];
const SOURCE_OPTIONS = ["LinkedIn", "Indeed", "Company Website", "Employee Referral", "Job Fair", "Other"];
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const initialForm = {
  firstName: "", lastName: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", zip: "", country: "", experience: "", jobTitle: "", employer: "",
  keySkills: "", coverLetter: "", startDate: "", currentSalary: "", expectedSalary: "",
  linkedin: "", portfolio: "", refName: "", refRelationship: "", refEmail: "", refPhone: "",
  hearAbout: "",
};

export default function ApplyForm({ job }) {
  const { user, loading, authFetch } = useCandidateSession({ required: true });
  const [form, setForm] = useState(initialForm);
  const [profileResume, setProfileResume] = useState(null);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    authFetch("/api/candidate/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const p = data?.profile;
        if (!p) return;
        const [firstName = "", ...rest] = (p.full_name || "").split(" ");
        setForm((prev) => ({
          ...prev,
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || rest.join(" "),
          phone: prev.phone || p.phone || "",
          city: prev.city || p.city || "",
          country: prev.country || p.country || "",
          experience: prev.experience || p.experience || "",
          keySkills: prev.keySkills || p.key_skills || "",
          linkedin: prev.linkedin || p.linkedin || "",
          portfolio: prev.portfolio || p.portfolio || "",
        }));
        if (p.resume_path) {
          setProfileResume(p.resume_filename || "Saved resume");
          setUseProfileResume(true);
        }
      })
      .catch(() => {});
  }, [user, authFetch]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleResumeSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) return setError("Please upload a PDF or Word document.");
    if (file.size > MAX_RESUME_SIZE) return setError("File is too large. Maximum size is 5MB.");
    setError("");
    setResumeFile(file);
    setUseProfileResume(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!useProfileResume && !resumeFile) return setError("Resume/CV is required.");
    if (!consent) return setError("Please accept the data processing consent to continue.");

    setStatus("submitting");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.append("jobSlug", job.slug);
    body.append("consentGiven", "true");
    if (useProfileResume) body.append("useProfileResume", "true");
    else body.append("resume", resumeFile);

    try {
      const res = await authFetch("/api/candidate/applications", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application.");
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" aria-label="Loading" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div role="alert" className="max-w-xl mx-auto text-center bg-white border border-slate-200 rounded-3xl p-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-teal-500 text-white flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Application submitted</h1>
        <p className="text-slate-500">
          Thanks for applying for <strong>{job.title}</strong>. You can track its status from your dashboard.
        </p>
        <Link
          href="/candidate/dashboard"
          className="inline-flex mt-8 h-11 items-center px-6 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold"
        >
          Go to my applications
        </Link>
      </div>
    );
  }

  const f = (name) => ({ id: name, name, value: form[name], onChange: handleChange });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-teal-600">Applying for</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{job.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{job.location} · {job.mode_of_work} · {job.type_of_work}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Personal information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First name" required autoComplete="given-name" {...f("firstName")} />
            <Field label="Last name" required autoComplete="family-name" {...f("lastName")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input value={user.email} readOnly className={`${inputClass} text-slate-500 cursor-not-allowed`} aria-label="Email" />
            </div>
            <Field label="Phone" required type="tel" autoComplete="tel" {...f("phone")} />
          </div>
          <Field label="Street address" autoComplete="address-line1" {...f("addressLine1")} />
          <Field label="Address line 2" autoComplete="address-line2" {...f("addressLine2")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="City" required autoComplete="address-level2" {...f("city")} />
            <Field label="State/Province" autoComplete="address-level1" {...f("state")} />
            <Field label="ZIP/Postal code" autoComplete="postal-code" {...f("zip")} />
            <Field label="Country" required autoComplete="country-name" {...f("country")} />
          </div>
        </Card>

        <Card title="Professional information">
          <Field label="Years of experience" required as="select" options={EXPERIENCE_LEVELS} {...f("experience")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Current job title" {...f("jobTitle")} />
            <Field label="Current employer" {...f("employer")} />
          </div>
          <Field label="Key skills" required as="textarea" rows={3} placeholder="e.g. React, Node.js, Figma" {...f("keySkills")} />
        </Card>

        <Card title="Resume & cover letter">
          <div>
            <span className={labelClass}>Resume/CV <span className="text-red-500">*</span></span>
            {profileResume && (
              <label className="flex items-center gap-2 mb-3 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useProfileResume}
                  onChange={(e) => setUseProfileResume(e.target.checked)}
                  className="size-4 accent-brand-teal-500"
                />
                Use my saved resume ({profileResume})
              </label>
            )}
            {!useProfileResume && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  resumeFile ? "border-brand-teal-300 bg-brand-teal-50/40" : "border-slate-300 hover:border-brand-teal-400"
                }`}
              >
                {resumeFile ? <FileText className="w-8 h-8 text-brand-teal-500" /> : <Upload className="w-8 h-8 text-slate-400" />}
                <span className="text-sm text-slate-600 font-medium">
                  {resumeFile ? resumeFile.name : "Click to upload resume (PDF or Word, max 5MB)"}
                </span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="hidden" />
          </div>
          <Field label="Cover letter" as="textarea" rows={4} placeholder="Why are you a good fit for this role?" {...f("coverLetter")} />
        </Card>

        <Card title="Availability & links">
          <Field label="Available start date" required as="select" options={START_DATE_OPTIONS} {...f("startDate")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Current salary (annual)" {...f("currentSalary")} />
            <Field label="Expected salary (annual)" {...f("expectedSalary")} />
            <Field label="LinkedIn URL" type="url" {...f("linkedin")} />
            <Field label="Portfolio/Website URL" type="url" {...f("portfolio")} />
          </div>
        </Card>

        <Card title="Professional reference" description="Optional">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name" {...f("refName")} />
            <Field label="Relationship" {...f("refRelationship")} />
            <Field label="Email" type="email" {...f("refEmail")} />
            <Field label="Phone" type="tel" {...f("refPhone")} />
          </div>
        </Card>

        <Card title="Where did you hear about us?">
          <Field label="Source" as="select" options={SOURCE_OPTIONS} {...f("hearAbout")} />
        </Card>

        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4 accent-brand-teal-500"
          />
          I consent to Ascendus storing and processing my personal data for recruitment purposes.
        </label>

        {error && (
          <p role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="h-12 min-w-[200px] px-6 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {status === "submitting" ? (<><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Submitting...</>) : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
}
