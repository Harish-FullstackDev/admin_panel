import PortalShell from "@/components/CandidatePortal/PortalShell";
import JobBoard from "@/components/CandidatePortal/JobBoard";
import { getOpenJobs } from "@/lib/publicJobs";

export const revalidate = 60;

export const metadata = {
  title: "Careers | Ascendus",
  description: "Explore open positions at Ascendus and apply online.",
};

export default async function CareersPage() {
  const jobs = await getOpenJobs();

  return (
    <PortalShell>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Open positions</h1>
        <p className="mt-2 text-slate-500">Find a role that fits you and apply in a few minutes.</p>
      </div>
      <JobBoard jobs={jobs} />
    </PortalShell>
  );
}
