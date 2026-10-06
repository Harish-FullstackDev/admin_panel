"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, Building2, Mail, ScrollText, Newspaper, FileText, BookOpen,
  ClipboardList, CheckSquare, Briefcase, UserSearch, CalendarClock, BadgeCheck, Bell, LogOut, Menu, X, ChevronDown,
  UserPlus, Contact, ListChecks, ListTodo,
} from "lucide-react";
import { InternalUserProvider, useInternalUser } from "@/components/hcm/InternalUserContext";
import { hcmJson, signOutInternal } from "@/lib/hcm/session";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; perm?: string; exact?: boolean };
type NavGroup = { title?: string; items: NavItem[] };

const HR_RECRUITMENT: NavItem[] = [
  { label: "Requisitions", href: "/admin/dashboard/requisitions", icon: ClipboardList, perm: "requisition.view" },
  { label: "Jobs", href: "/admin/dashboard/careers", icon: Briefcase, perm: "job.view", exact: true },
  { label: "Applications", href: "/admin/dashboard/careers/applications", icon: UserSearch, perm: "application.view" },
  { label: "Interviews", href: "/admin/dashboard/interviews", icon: CalendarClock, perm: "interview.view" },
  { label: "Offers", href: "/admin/dashboard/offers", icon: BadgeCheck, perm: "offer.create" },
];

const CONTENT: NavGroup = {
  title: "Content",
  items: [
    { label: "Blogs", href: "/admin/dashboard/blogs", icon: Newspaper, perm: "content.manage" },
    { label: "Case Studies", href: "/admin/dashboard/case-studies", icon: FileText, perm: "content.manage" },
    { label: "Whitepapers", href: "/admin/dashboard/whitepapers", icon: BookOpen, perm: "content.manage" },
  ],
};

const HOME: NavItem = { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, exact: true };
const MY_TASKS: NavItem = { label: "My Tasks", href: "/admin/dashboard/tasks", icon: ListTodo };

const ONBOARDING: NavGroup = {
  title: "Onboarding",
  items: [
    { label: "Pre-joining", href: "/admin/dashboard/onboarding", icon: UserPlus, perm: "onboarding.manage", exact: true },
    { label: "Employees", href: "/admin/dashboard/employees", icon: Contact, perm: "employee.view" },
    { label: "Checklists", href: "/admin/dashboard/onboarding/templates", icon: ListChecks, perm: "onboarding.manage" },
  ],
};

const MENUS: Record<string, NavGroup[]> = {
  super_admin: [
    { items: [HOME, MY_TASKS] },
    {
      title: "Administration",
      items: [
        { label: "Users", href: "/admin/dashboard/users", icon: Users, perm: "user.manage" },
        { label: "Roles & Permissions", href: "/admin/dashboard/roles", icon: ShieldCheck, perm: "role.manage" },
        { label: "Organization", href: "/admin/dashboard/org", icon: Building2, perm: "org.manage" },
        { label: "Email Templates", href: "/admin/dashboard/templates", icon: Mail, perm: "template.manage" },
        { label: "Audit Logs", href: "/admin/dashboard/audit", icon: ScrollText, perm: "audit.view" },
        { label: "Employees", href: "/admin/dashboard/employees", icon: Contact, perm: "employee.view" },
      ],
    },
    CONTENT,
  ],
  chro: [
    { items: [HOME, MY_TASKS, { label: "Approvals", href: "/admin/dashboard/approvals", icon: CheckSquare, perm: "requisition.approve" }] },
    { title: "Recruitment", items: HR_RECRUITMENT },
    ONBOARDING,
    {
      title: "Settings",
      items: [
        { label: "Email Templates", href: "/admin/dashboard/templates", icon: Mail, perm: "template.manage" },
        { label: "Audit Logs", href: "/admin/dashboard/audit", icon: ScrollText, perm: "audit.view" },
      ],
    },
  ],
  hr_manager: [
    { items: [HOME, MY_TASKS] },
    { title: "Recruitment", items: HR_RECRUITMENT },
    ONBOARDING,
    { title: "Settings", items: [{ label: "Email Templates", href: "/admin/dashboard/templates", icon: Mail, perm: "template.manage" }] },
    CONTENT,
  ],
  hr_executive: [{ items: [HOME, MY_TASKS] }, { title: "Recruitment", items: HR_RECRUITMENT }, ONBOARDING],
  hiring_manager: [
    { items: [HOME, MY_TASKS] },
    {
      title: "Hiring",
      items: [
        { label: "My Requisitions", href: "/admin/dashboard/requisitions", icon: ClipboardList, perm: "requisition.view" },
        { label: "My Openings", href: "/admin/dashboard/careers", icon: Briefcase, perm: "job.view", exact: true },
        { label: "Candidates", href: "/admin/dashboard/careers/applications", icon: UserSearch, perm: "application.view" },
        { label: "Interviews", href: "/admin/dashboard/interviews", icon: CalendarClock, perm: "interview.view" },
      ],
    },
    { title: "People", items: [{ label: "My Team", href: "/admin/dashboard/employees", icon: Contact, perm: "employee.view" }] },
  ],
  interviewer: [{ items: [HOME, MY_TASKS, { label: "Interviews", href: "/admin/dashboard/interviews", icon: CalendarClock, perm: "interview.view" }] }],
  employee: [{ items: [HOME, MY_TASKS] }],
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type Notification = { id: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

function NotificationsBell() {
  const { unread, setUnread } = useInternalUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const data = await hcmJson("/api/hcm/notifications").catch(() => ({ notifications: [] }));
      setItems(data.notifications);
      if (unread) {
        await hcmJson("/api/hcm/notifications", { method: "PATCH", body: {} }).catch(() => {});
        setUnread(0);
      }
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label={`Notifications (${unread} unread)`} className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-40">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Notifications</div>
          {!items ? (
            <p className="p-4 text-xs text-slate-500">Loading...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-xs text-slate-500">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const body = (
                  <>
                    <p className={`text-xs ${n.read_at ? "text-slate-600" : "font-bold text-slate-900"}`}>{n.title}</p>
                    {n.body && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-slate-50">
                        {body}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const { user, error, activeRole, setActiveRole, can } = useInternalUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm text-center bg-white border border-slate-200 rounded-2xl p-8">
          <p className="text-sm font-bold text-slate-900">We couldn&apos;t load your account</p>
          <p className="text-xs text-slate-500 mt-2">{error}</p>
          <button onClick={() => signOutInternal()} className="mt-5 text-sm font-semibold text-brand-teal-600 cursor-pointer">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const groups = (MENUS[activeRole || ""] || [{ items: [HOME] }])
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.perm || can(item.perm)) }))
    .filter((g) => g.items.length);
  const activeRoleName = user.roles.find((r: { code: string }) => r.code === activeRole)?.name;

  const sidebar = (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Main">
      {groups.map((group, i) => (
        <div key={group.title || i}>
          {group.title && <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p>}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active ? "bg-brand-teal-50 text-brand-teal-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-slate-200 bg-white flex-col sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center gap-2 border-b border-slate-200">
          <span className="text-base font-extrabold tracking-tight text-slate-900 uppercase">Ascendus</span>
          <span className="text-[10px] font-bold text-brand-teal-600 border border-brand-teal-200 bg-brand-teal-50 rounded-full px-2 py-0.5">HCM</span>
        </div>
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/30" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 h-16 flex items-center justify-between border-b border-slate-200">
              <span className="text-base font-extrabold text-slate-900 uppercase">Ascendus</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between gap-3 px-4 sm:px-6">
          <button className="lg:hidden p-2 -ml-2 cursor-pointer" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {user.roles.length > 1 ? (
            <label className="relative flex items-center">
              <span className="sr-only">Active role</span>
              <select
                value={activeRole || ""}
                onChange={(e) => setActiveRole(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-teal-200"
              >
                {user.roles.map((r: { code: string; name: string }) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-slate-400" />
            </label>
          ) : (
            activeRoleName && <span className="text-xs font-semibold text-slate-500">{activeRoleName}</span>
          )}
          <NotificationsBell />
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs font-bold text-slate-800">{user.fullName}</span>
            <span className="text-[11px] text-slate-400">{user.email}</span>
          </div>
          <button onClick={() => signOutInternal()} aria-label="Sign out" className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InternalUserProvider>
      <Shell>{children}</Shell>
    </InternalUserProvider>
  );
}
