"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase, Clock, ChevronRight, X } from "lucide-react";

const MODES = ["On-site", "Hybrid", "Remote"];

export default function JobBoard({ jobs }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("");

  const categories = useMemo(
    () => [...new Set(jobs.flatMap((job) => job.categories || []))].sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !q || job.title.toLowerCase().includes(q) || job.location.toLowerCase().includes(q);
      const matchesCategory = !category || (job.categories || []).includes(category);
      const matchesMode = !mode || job.mode_of_work === mode;
      return matchesSearch && matchesCategory && matchesMode;
    });
  }, [jobs, search, category, mode]);

  const hasFilters = search || category || mode;
  const selectClass =
    "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 cursor-pointer";

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location"
            aria-label="Search jobs"
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200"
          />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className={selectClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Work mode" className={selectClass}>
          <option value="">Any work mode</option>
          {MODES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setCategory(""); setMode(""); }}
            className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-4">
        {filtered.length} open position{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">
          No open positions match your filters right now.
        </div>
      ) : (
        <ul className="grid gap-4">
          {filtered.map((job) => (
            <li key={job.id}>
              <Link
                href={`/careers/${job.slug}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-teal-300 hover:shadow-md transition-all"
              >
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-brand-teal-600 transition-colors">
                    {job.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{job.location}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" aria-hidden="true" />{job.mode_of_work} · {job.type_of_work}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{job.experience_level}</span>
                  </div>
                  {job.categories?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.categories.map((c) => (
                        <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-brand-teal-500 transition-colors" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
