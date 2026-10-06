"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ListTodo } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Card, Button, Spinner, EmptyState, ErrorBanner, formatDate } from "@/components/hcm/ui";
import { StatusChip, daysFromToday, relativeDays } from "@/components/hcm/onboarding";

const VIEWS = [
  { value: "Open", label: "Open" },
  { value: "Done", label: "Done" },
  { value: "Skipped", label: "Skipped" },
];

export default function TasksPage() {
  const { user, can } = useInternalUser();
  const [view, setView] = useState("Open");
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await hcmJson(`/api/hcm/tasks?status=${view}`);
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    }
  }, [view]);

  useEffect(() => {
    if (!user) return;
    setTasks(null);
    load();
  }, [user, load]);

  const setStatus = async (task, status) => {
    setBusy(task.id);
    setError("");
    try {
      await hcmJson(`/api/hcm/tasks/${task.id}`, { method: "PATCH", body: { status } });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="My Tasks" description="Onboarding work assigned to you." />
      <ErrorBanner message={error} onClose={() => setError("")} />

      <div role="tablist" aria-label="Task status" className="inline-flex p-1 rounded-xl bg-slate-100 mb-5">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            role="tab"
            aria-selected={view === v.value}
            onClick={() => setView(v.value)}
            className={`px-4 h-8 rounded-lg text-sm font-semibold cursor-pointer ${view === v.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {!tasks ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title={view === "Open" ? "Nothing on your plate" : `No ${view.toLowerCase()} tasks`} description={view === "Open" ? "Tasks assigned to you appear here." : undefined} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100 -my-2">
            {tasks.map((t) => {
              const days = daysFromToday(t.due_date);
              const overdue = t.status === "Open" && days !== null && days < 0;
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.team}
                      {t.context && (
                        <>
                          {" · "}
                          {can("onboarding.manage") ? (
                            <Link href={`/admin/dashboard/onboarding/${t.context.id}`} className="text-brand-teal-700 hover:underline">
                              {t.context.full_name}
                            </Link>
                          ) : (
                            t.context.full_name
                          )}
                          {` (${t.context.position}, joins ${formatDate(t.context.joining_date)})`}
                        </>
                      )}
                    </p>
                    {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                  </div>
                  <div className={`text-xs whitespace-nowrap ${overdue ? "font-semibold text-red-600" : "text-slate-500"}`}>
                    {t.due_date ? `Due ${formatDate(t.due_date)}${t.status === "Open" ? ` (${relativeDays(t.due_date)})` : ""}` : "No due date"}
                  </div>
                  {t.status === "Open" ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => setStatus(t, "Done")} loading={busy === t.id}>
                        Mark done
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(t, "Skipped")} disabled={busy === t.id}>
                        Skip
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <StatusChip status={t.status} />
                      <Button size="sm" variant="ghost" onClick={() => setStatus(t, "Open")} disabled={busy === t.id}>
                        Reopen
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
