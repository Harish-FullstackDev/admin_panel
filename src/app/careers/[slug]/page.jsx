import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Briefcase, Clock, Building2 } from "lucide-react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import ApplyButton from "@/components/CandidatePortal/ApplyButton";
import { getOpenJobBySlug } from "@/lib/publicJobs";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const job = await getOpenJobBySlug(slug);
  return {
    title: job ? `${job.title} | Ascendus Careers` : "Job not found | Ascendus Careers",
    description: job?.about_job?.slice(0, 160),
  };
}

function Section({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <ul className="space-y-2 list-disc pl-5 text-slate-600 text-sm leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function JobDetailPage({ params }) {
  const { slug } = await params;
  const job = await getOpenJobBySlug(slug);
  if (!job) notFound();

  return (
    <PortalShell>
      <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All jobs
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{job.title}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {job.company && (
                <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" aria-hidden="true" />{job.company}</span>
              )}
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" aria-hidden="true" />{job.location}</span>
              <span className="inline-flex items-center gap-1.5"><Briefcase className="w-4 h-4" aria-hidden="true" />{job.mode_of_work} · {job.type_of_work}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" aria-hidden="true" />{job.experience_level}</span>
            </div>
            {job.categories?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {job.categories.map((c) => (
                  <span key={c} className="rounded-full bg-brand-teal-50 border border-brand-teal-100 px-2.5 py-0.5 text-xs font-medium text-brand-teal-700">{c}</span>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0">
            <ApplyButton slug={job.slug} />
          </div>
        </div>

        {job.about_job && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-900 mb-3">About the role</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{job.about_job}</p>
          </section>
        )}
        <Section title="Responsibilities" items={job.responsibilities} />
        <Section title="Qualifications" items={job.qualifications} />

        <div className="mt-10 pt-8 border-t border-slate-100">
          <ApplyButton slug={job.slug} />
        </div>
      </div>
    </PortalShell>
  );
}
