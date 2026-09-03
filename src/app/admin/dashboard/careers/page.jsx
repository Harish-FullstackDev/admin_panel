"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Search,
  ArrowLeft,
  Save,
  X,
  MapPin,
  Users,
  Briefcase,
  LayoutList,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

const AREA_OF_INTEREST = ["SALES", "SAP", "DIGITAL MARKETING", "UI/UX", "PRODUCT & WEB DEVELOPMENT"];
const MODES_OF_WORK = ["On-site", "Hybrid", "Remote"];
const TYPES_OF_WORK = ["Full-time", "Part-time", "Contract", "Freelancer", "Internship"];
const STATUSES = ["Draft", "Open", "Closed"];

const STATUS_STYLES = {
  Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-red-50 text-red-600 border-red-200",
  Draft: "bg-slate-100 text-slate-500 border-slate-200",
};

const emptyForm = {
  title: "",
  company: "",
  location: "",
  mode_of_work: "On-site",
  type_of_work: "Full-time",
  experience_level: "",
  categories: [],
  about_job: "",
  responsibilities: [""],
  qualifications: [""],
  status: "Draft",
};

export default function AdminCareersDashboard() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("list"); // "list" | "create" | "edit"
  const [searchQuery, setSearchQuery] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const fetchJobs = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load job postings.");
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Error connecting to jobs API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const returnToInventory = () => {
    setActiveView("list");
    setEditingId("");
    setForm(emptyForm);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const initCreateView = () => {
    returnToInventory();
    setActiveView("create");
  };

  const initEditView = (job) => {
    setEditingId(job.id);
    setForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      mode_of_work: job.mode_of_work || "On-site",
      type_of_work: job.type_of_work || "Full-time",
      experience_level: job.experience_level || "",
      categories: job.categories || [],
      about_job: job.about_job || "",
      responsibilities: job.responsibilities?.length ? job.responsibilities : [""],
      qualifications: job.qualifications?.length ? job.qualifications : [""],
      status: job.status || "Draft",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setActiveView("edit");
  };

  const handleLogout = () => {
    document.cookie = "sst_admin_session=; path=/; max-age=0; Secure; SameSite=Lax";
    router.push("/admin/login");
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCategory = (category) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const updateListItem = (field, index, value) => {
    setForm((prev) => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const addListItem = (field) => setForm((prev) => ({ ...prev, [field]: [...prev[field], ""] }));

  const removeListItem = (field, index) =>
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.title.trim()) return setErrorMessage("Job title is required.");
    if (!form.location.trim()) return setErrorMessage("Location is required.");
    if (!form.experience_level.trim()) return setErrorMessage("Experience level is required.");

    setSaving(true);

    const payload = {
      ...form,
      responsibilities: form.responsibilities.map((item) => item.trim()).filter(Boolean),
      qualifications: form.qualifications.map((item) => item.trim()).filter(Boolean),
    };
    if (activeView === "edit") payload.id = editingId;

    try {
      const method = activeView === "create" ? "POST" : "PUT";
      const res = await fetch("/api/jobs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to commit job posting.");

      setSuccessMessage(`Job posting was successfully ${activeView === "create" ? "created" : "updated"}!`);
      await fetchJobs();
      setTimeout(() => returnToInventory(), 1200);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred while saving the job posting.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setErrorMessage("");
    setSuccessMessage("");
    const targetId = deleteTarget.id;

    const backupJobs = [...jobs];
    setJobs(jobs.filter((j) => j.id !== targetId));
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/jobs?id=${targetId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete job posting.");
      setSuccessMessage("Job posting was successfully deleted.");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to delete job posting.");
      setJobs(backupJobs);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      (job.categories || []).some((c) => c.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* HEADER CONTROLS */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-teal-600 to-brand-teal-400 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-sm shadow-brand-teal-500/10">
            SST
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-widest text-slate-900 uppercase">STUDIO PORTAL</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider">Administrator Control Board</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard/careers/applications"
            className="p-2 px-3 bg-white hover:bg-brand-teal-50 text-slate-500 hover:text-brand-teal-600 rounded-2xl border border-slate-200 hover:border-brand-teal-200 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Applications</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 px-3 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-2xl border border-slate-200 hover:border-red-200 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEW SYSTEM */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50/80 border border-red-200/60 rounded-2xl text-red-700 text-sm flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <h5 className="font-bold text-red-650">Operation Error</h5>
              <p className="text-xs mt-0.5 text-red-600 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 bg-brand-teal-50 border border-brand-teal-200/50 rounded-2xl text-brand-teal-800 text-sm flex items-start gap-3 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-teal-500 mt-1.5 shrink-0 animate-ping" />
            <div>
              <h5 className="font-bold text-brand-teal-700">Success</h5>
              <p className="text-xs mt-0.5 text-brand-teal-600 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {activeView === "list" ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Job Listings</h2>
                <p className="text-slate-500 text-xs mt-1 font-semibold">
                  Manage open positions, drafts, and closed postings shown on the careers page.
                </p>
              </div>
              <button
                onClick={initCreateView}
                className="px-4 py-2.5 bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-brand-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Job</span>
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 max-w-md shadow-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, location, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 placeholder-slate-400 focus:outline-none w-full"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                <div className="w-8 h-8 border-3 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" />
                <span className="text-xs text-slate-450 font-semibold">Loading job postings...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl">
                <LayoutList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="text-slate-700 font-bold">No Records Found</h4>
                <p className="text-slate-450 text-xs mt-1 max-w-sm mx-auto font-medium">
                  There are no job postings matching current filters, or the catalog is empty.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                        <th className="px-6 py-4">Position</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-4 max-w-md">
                            <p className="font-bold text-slate-800 text-sm truncate">{job.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                              <span>{job.type_of_work}</span>
                              <span>&middot;</span>
                              <span>{job.experience_level}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{job.location}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[job.status] || STATUS_STYLES.Draft}`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/admin/dashboard/careers/applications?q=${encodeURIComponent(job.title)}`}
                                className="p-2 bg-slate-50 hover:bg-brand-teal-50 text-slate-400 hover:text-brand-teal-600 rounded-xl border border-slate-200 hover:border-brand-teal-200/50 active:scale-95 transition-all cursor-pointer"
                                title="View applicants for this position"
                              >
                                <Users className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => initEditView(job)}
                                className="p-2 bg-slate-50 hover:bg-brand-teal-50 text-slate-400 hover:text-brand-teal-600 rounded-xl border border-slate-200 hover:border-brand-teal-200/50 active:scale-95 transition-all cursor-pointer"
                                title="Edit job posting"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(job)}
                                className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 hover:border-red-200/50 active:scale-95 transition-all cursor-pointer"
                                title="Delete job posting"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={returnToInventory}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-900 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to inventory</span>
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeView === "create" ? "New Job Posting" : "Edit Job Posting"}
              </h2>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-8">
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-6 shadow-sm">
                <h3 className="text-xs font-extrabold tracking-wider uppercase text-brand-teal-600 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Primary Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Job Title (Required)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior SAP Consultant"
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Location (Required)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai, India"
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Mode of Work
                    </label>
                    <select
                      value={form.mode_of_work}
                      onChange={(e) => updateField("mode_of_work", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    >
                      {MODES_OF_WORK.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Type of Work
                    </label>
                    <select
                      value={form.type_of_work}
                      onChange={(e) => updateField("type_of_work", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    >
                      {TYPES_OF_WORK.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Experience Level (Required)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3-5 years"
                      value={form.experience_level}
                      onChange={(e) => updateField("experience_level", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Publish Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Area of Interest
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AREA_OF_INTEREST.map((category) => {
                      const selected = form.categories.includes(category);
                      return (
                        <button
                          type="button"
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`px-3.5 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                            selected
                              ? "bg-brand-teal-500 border-brand-teal-500 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:border-brand-teal-200"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-6 shadow-sm">
                <h3 className="text-xs font-extrabold tracking-wider uppercase text-brand-teal-600">
                  Job Description
                </h3>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    About the Job
                  </label>
                  <textarea
                    rows={4}
                    value={form.about_job}
                    onChange={(e) => updateField("about_job", e.target.value)}
                    placeholder="Summarize the role, team, and what success looks like..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal-200 transition-all resize-y"
                  />
                </div>

                {["responsibilities", "qualifications"].map((field) => (
                  <div key={field} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        {field === "responsibilities" ? "Responsibilities" : "Qualifications"}
                      </label>
                      <button
                        type="button"
                        onClick={() => addListItem(field)}
                        className="px-2.5 py-1.5 bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-600 rounded-lg border border-brand-teal-200 active:scale-95 transition-all text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Add Bullet
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form[field].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateListItem(field, index, e.target.value)}
                            placeholder={`e.g. ${field === "responsibilities" ? "Lead SAP module implementations" : "3+ years of relevant SAP experience"}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal-200 transition-all"
                          />
                          {form[field].length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeListItem(field, index)}
                              className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 active:scale-90 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 justify-end">
                <button
                  type="button"
                  onClick={returnToInventory}
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-semibold rounded-2xl border border-slate-200 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-brand-teal-600 hover:bg-brand-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-brand-teal-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Job Posting</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white border border-slate-100 rounded-3xl shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">Confirm Deletion</h4>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to permanently delete:
              <span className="block font-bold text-slate-800 text-sm my-2">&ldquo;{deleteTarget.title}&rdquo;</span>
              This will also remove it from any application filters. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Keep Posting
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 border border-red-200 rounded-xl text-white text-xs font-bold shadow-lg shadow-red-100 active:scale-95 transition-all cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-100 py-6 text-center text-[10px] text-slate-400 mt-20 select-none">
        &copy; {new Date().getFullYear()} Support Studio Technologies (SST) Inc. Control Panel. All rights reserved.
      </footer>
    </div>
  );
}
