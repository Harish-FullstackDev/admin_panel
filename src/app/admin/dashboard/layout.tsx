"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Newspaper, FileText, ScrollText } from "lucide-react";

const NAV_ITEMS = [
  { label: "Careers", href: "/admin/dashboard/careers", icon: Briefcase },
  { label: "Blogs", href: "/admin/dashboard/blogs", icon: Newspaper },
  { label: "Case Studies", href: "/admin/dashboard/case-studies", icon: FileText },
  { label: "Whitepapers", href: "/admin/dashboard/whitepapers", icon: ScrollText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-teal-600 to-brand-teal-400 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-sm shadow-brand-teal-500/10">
            SST
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  active
                    ? "bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
