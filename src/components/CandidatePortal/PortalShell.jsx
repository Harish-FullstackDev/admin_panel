"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, UserCircle, LogOut, LogIn } from "lucide-react";
import { useCandidateSession } from "./useCandidateSession";

const NAV = [
  { href: "/careers", label: "Jobs", icon: Briefcase },
  { href: "/candidate/dashboard", label: "My Applications", icon: LayoutDashboard, auth: true },
  { href: "/candidate/profile", label: "Profile", icon: UserCircle, auth: true },
];

export default function PortalShell({ children }) {
  const pathname = usePathname();
  const { user, loading, signOut } = useCandidateSession();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/careers" className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">Ascendus</span>
            <span className="hidden sm:inline text-xs font-semibold text-brand-teal-600 border border-brand-teal-200 bg-brand-teal-50 rounded-full px-2 py-0.5">
              Careers
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            {NAV.filter((item) => !item.auth || user).map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/careers" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors ${
                    active ? "text-brand-teal-600 bg-brand-teal-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}

            {!loading &&
              (user ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden md:inline">Sign out</span>
                </button>
              ) : (
                <Link
                  href={`/candidate/login?redirect=${encodeURIComponent(pathname)}`}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Sign in
                </Link>
              ))}
          </nav>
        </div>
      </header>

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500">
          © {new Date().getFullYear()} Ascendus. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
