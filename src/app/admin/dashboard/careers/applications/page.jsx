"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock, Search } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import CandidateDrawer, { ApplicationsTable } from "@/components/hcm/CandidateDrawer";
import { PageHeader, Card, Input, Select, Spinner, EmptyState, ErrorBanner } from "@/components/hcm/ui";

export default function ApplicationsPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("application.view") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask an administrator for the application.view permission." />
      ) : (
        <Suspense fallback={<Spinner />}>
          <Applications />
        </Suspense>
      )}
    </div>
  );
}

function Applications() {
  const { can } = useInternalUser();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState(() => params.get("job") || "");
  const [search, setSearch] = useState(() => params.get("q") || "");
  const [query, setQuery] = useState(() => (params.get("q") || "").trim());
  const [openId, setOpenId] = useState(() => params.get("open") || null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!can("job.view")) return;
    hcmJson("/api/hcm/jobs?archived=1")
      .then((d) => setJobs(d.jobs || []))
      .catch(() => setJobs([]));
  }, [can]);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (jobId) qs.set("job_id", jobId);
    if (query) qs.set("q", query);
    const data = await hcmJson(`/api/hcm/applications${qs.toString() ? `?${qs}` : ""}`);
    setApps(data.applications || []);
  }, [jobId, query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load()
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  const refresh = useCallback(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const jobOptions = useMemo(
    () => jobs.map((j) => ({ value: j.id, label: `${j.title}${j.archived ? " (archived)" : j.status !== "Open" ? ` (${j.status})` : ""}` })),
    [jobs]
  );

  const closeDrawer = useCallback(() => {
    setOpenId(null);
    if (params.get("open")) {
      const next = new URLSearchParams(params.toString());
      next.delete("open");
      router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [params, pathname, router]);

  return (
    <>
      <PageHeader title="Applications" description="Every application across your job openings." />
      <ErrorBanner message={error} onClose={() => setError("")} />
      <Card>
        {loading && !apps.length ? (
          <Spinner />
        ) : (
          <ApplicationsTable
            applications={apps}
            showJob
            canBulk={can("application.move")}
            onOpen={setOpenId}
            onChanged={refresh}
            toolbar={
              <>
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <Input
                    type="search"
                    aria-label="Search applications"
                    placeholder="Search name, email, position or skills"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {jobOptions.length > 0 && (
                  <Select
                    aria-label="Filter by job"
                    className="w-auto min-w-[200px] max-w-[280px]"
                    placeholder="All jobs"
                    options={jobOptions}
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                  />
                )}
              </>
            }
          />
        )}
      </Card>

      {openId && <CandidateDrawer applicationId={openId} onClose={closeDrawer} onChanged={refresh} />}
    </>
  );
}
