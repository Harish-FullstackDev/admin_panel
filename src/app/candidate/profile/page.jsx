"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, FileText, Upload, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import { useCandidateSession } from "@/components/CandidatePortal/useCandidateSession";

const inputClass =
  "w-full h-10 bg-slate-50 rounded-lg px-3 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all";
const labelClass = "block text-sm font-medium text-slate-800 mb-1.5";

const FIELDS = [
  { name: "full_name", label: "Full name" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "city", label: "City" },
  { name: "country", label: "Country" },
  { name: "linkedin", label: "LinkedIn URL", type: "url" },
  { name: "portfolio", label: "Portfolio URL", type: "url" },
];
const EXPERIENCE_LEVELS = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

function ProfileContent() {
  const { user, loading, authFetch } = useCandidateSession({ required: true });
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    authFetch("/api/candidate/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!data.profile) throw new Error(data.error);
        setProfile(data.profile);
        setForm(data.profile);
      })
      .catch((err) => setMessage({ type: "error", text: err.message || "Failed to load profile." }));
  }, [user, authFetch]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await authFetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      setMessage({ type: "success", text: "Profile saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Resume must be a PDF or Word document under 5MB." });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("resume", file);
      const res = await authFetch("/api/candidate/profile", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      setMessage({ type: "success", text: "Resume uploaded." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to upload resume." });
    } finally {
      setUploading(false);
    }
  };

  const openResume = async () => {
    const res = await authFetch("/api/candidate/resume");
    const data = await res.json();
    if (res.ok) window.open(data.url, "_blank", "noopener,noreferrer");
    else setMessage({ type: "error", text: data.error });
  };

  if (loading || !user || (!profile && !message)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">My profile</h1>
      <p className="text-slate-500 mb-8">These details pre-fill your job applications.</p>

      {message && (
        <p
          role="status"
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 border ${
            message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </p>
      )}

      {profile && (
        <>
          <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Resume</h2>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-brand-teal-500 shrink-0" aria-hidden="true" />
                <span className="text-sm text-slate-700 truncate">{profile.resume_filename || "No resume uploaded yet"}</span>
              </div>
              <div className="flex gap-2">
                {profile.resume_path && (
                  <button type="button" onClick={openResume} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <ExternalLink className="w-4 h-4" aria-hidden="true" /> View
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-black disabled:opacity-60 cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {profile.resume_path ? "Replace" : "Upload"}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
            </div>
          </section>

          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Details</h2>
            <div>
              <label className={labelClass}>Email</label>
              <input value={profile.email} readOnly aria-label="Email" className={`${inputClass} text-slate-500 cursor-not-allowed`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELDS.map(({ name, label, type = "text" }) => (
                <div key={name}>
                  <label htmlFor={name} className={labelClass}>{label}</label>
                  <input id={name} name={name} type={type} value={form[name] || ""} onChange={handleChange} className={inputClass} />
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="experience" className={labelClass}>Years of experience</label>
              <select id="experience" name="experience" value={form.experience || ""} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                <option value="">Select</option>
                {EXPERIENCE_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="key_skills" className={labelClass}>Key skills</label>
              <textarea id="key_skills" name="key_skills" rows={3} value={form.key_skills || ""} onChange={handleChange} className={`${inputClass} h-auto py-2 resize-y`} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="h-11 px-6 rounded-xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-sm font-bold disabled:opacity-60 cursor-pointer inline-flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save profile
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default function CandidateProfilePage() {
  return (
    <PortalShell>
      <ProfileContent />
    </PortalShell>
  );
}
