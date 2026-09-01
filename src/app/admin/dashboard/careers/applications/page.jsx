"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LogOut,
  Search,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  FileText,
  LayoutList,
  Mail,
  Phone,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

const STATUSES = ["New", "Reviewed", "Shortlisted", "Interviewing", "Rejected", "Hired"];

const STATUS_STYLES = {
  New: "bg-blue-50 text-blue-600 border-blue-200",
  Reviewed: "bg-slate-100 text-slate-600 border-slate-200",
  Shortlisted: "bg-amber-50 text-amber-700 border-amber-200",
  Interviewing: "bg-purple-50 text-purple-700 border-purple-200",
  Hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-600 border-red-200",
};

function ApplicationsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/job-applications?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load applications.");
      setApplications(data.applications || []);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Error connecting to applications API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleLogout = () => {
    document.cookie = "sst_admin_session=; path=/; max-age=0; Secure; SameSite=Lax";
    router.push("/admin/login");
  };

  const handleStatusChange = async (application, status) => {
    setErrorMessage("");
    const backup = [...applications];
    setApplications((prev) => prev.map((a) => (a.id === application.id ? { ...a, status } : a)));

    try {
      const res = await fetch("/api/job-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: application.id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status.");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to update application status.");
      setApplications(backup);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setErrorMessage("");
    setSuccessMessage("");
    const targetId = deleteTarget.id;

    const backup = [...applications];
    setApplications(applications.filter((a) => a.id !== targetId));
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/job-applications?id=${targetId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete application.");
      setSuccessMessage("Application successfully deleted.");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to delete application.");
      setApplications(backup);
    }
  };

  const filteredApplications = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return applications.filter((app) => {
      const fullName = `${app.first_name} ${app.last_name}`.toLowerCase();
      return (
        !query ||
        fullName.includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query)
      );
    });
  }, [applications, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/careers"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl active:scale-95 transition-all cursor-pointer"
            title="Back to job postings"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-extrabold text-sm tracking-widest text-slate-900 uppercase">Job Applications</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider">All submitted applications</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 px-3 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-2xl border border-slate-200 hover:border-red-200 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-sm"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Logout</span>
        </button>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50/80 border border-red-200/60 rounded-2xl text-red-700 text-sm flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-brand-teal-50 border border-brand-teal-200/50 rounded-2xl text-brand-teal-800 text-sm shadow-sm">
            <p className="text-xs text-brand-teal-600 leading-relaxed">{successMessage}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 flex-1 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 placeholder-slate-400 focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-200"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
            <div className="w-8 h-8 border-3 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-450 font-semibold">Loading applications...</span>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl">
            <LayoutList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-slate-700 font-bold">No Applications Found</h4>
            <p className="text-slate-450 text-xs mt-1 max-w-sm mx-auto font-medium">
              No submissions match the current filters yet.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {app.first_name} {app.last_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{app.position}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" /> {app.email}
                          </span>
                          {app.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" /> {app.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide cursor-pointer focus:outline-none ${STATUS_STYLES[app.status] || STATUS_STYLES.New}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(app.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {app.resume_signed_url && (
                            <a
                              href={app.resume_signed_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-slate-50 hover:bg-brand-teal-50 text-slate-400 hover:text-brand-teal-600 rounded-xl border border-slate-200 hover:border-brand-teal-200/50 active:scale-95 transition-all cursor-pointer"
                              title={app.resume_filename || "Open resume"}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setViewTarget(app)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl border border-slate-200 active:scale-95 transition-all cursor-pointer"
                            title="View full application"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(app)}
                            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 hover:border-red-200/50 active:scale-95 transition-all cursor-pointer"
                            title="Delete application"
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
      </main>

      {/* VIEW DETAIL MODAL */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-white border border-slate-100 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => setViewTarget(null)}
              className="absolute right-5 top-5 p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              {viewTarget.first_name} {viewTarget.last_name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              Applied for <span className="font-semibold">{viewTarget.position}</span>
              {viewTarget.consent_given ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Consent given
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                  <ShieldX className="w-3.5 h-3.5" /> No consent on file
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
              <Detail label="Email" value={viewTarget.email} />
              <Detail label="Phone" value={viewTarget.phone || "—"} />
              <Detail
                label="Address"
                value={[viewTarget.address_line1, viewTarget.address_line2, viewTarget.city, viewTarget.state, viewTarget.zip, viewTarget.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              />
              <Detail label="Experience" value={viewTarget.experience || "—"} />
              <Detail label="Current Title" value={viewTarget.job_title || "—"} />
              <Detail label="Current Employer" value={viewTarget.employer || "—"} />
              <Detail label="Current Salary" value={viewTarget.current_salary || "—"} />
              <Detail label="Expected Salary" value={viewTarget.expected_salary || "—"} />
              <Detail label="Available From" value={viewTarget.start_date || "—"} />
              <Detail label="Heard About" value={viewTarget.hear_about || "—"} />
              <Detail label="LinkedIn" value={viewTarget.linkedin || "—"} link />
              <Detail label="Portfolio" value={viewTarget.portfolio || "—"} link />
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Key Skills</p>
              <p className="text-xs text-slate-700">{viewTarget.key_skills || "—"}</p>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Cover Letter</p>
              <p className="text-xs text-slate-700 whitespace-pre-line">{viewTarget.cover_letter || "—"}</p>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Reference</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Detail label="Name" value={viewTarget.ref_name || "—"} />
                <Detail label="Relationship" value={viewTarget.ref_relationship || "—"} />
                <Detail label="Email" value={viewTarget.ref_email || "—"} />
                <Detail label="Phone" value={viewTarget.ref_phone || "—"} />
              </div>
            </div>

            {viewTarget.resume_signed_url && (
              <a
                href={viewTarget.resume_signed_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-brand-teal-600 hover:bg-brand-teal-500 text-white text-xs font-bold rounded-2xl transition-all"
              >
                <FileText className="w-4 h-4" /> Open {viewTarget.resume_filename || "Resume"}
              </a>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white border border-slate-100 rounded-3xl shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">Confirm Deletion</h4>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to permanently delete the application from
              <span className="block font-bold text-slate-800 text-sm my-2">
                &ldquo;{deleteTarget.first_name} {deleteTarget.last_name}&rdquo;
              </span>
              This will also remove their uploaded resume. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Keep Application
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
    </div>
  );
}

function Detail({ label, value, link }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
      {link && value !== "—" ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-brand-teal-600 hover:underline break-all">
          {value}
        </a>
      ) : (
        <p className="text-slate-700 break-words">{value}</p>
      )}
    </div>
  );
}

export default function AdminJobApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ApplicationsDashboard />
    </Suspense>
  );
}
