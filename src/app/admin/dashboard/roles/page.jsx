"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Plus, ShieldCheck } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Badge,
  Spinner,
  EmptyState,
  ErrorBanner,
  Modal,
} from "@/components/hcm/ui";

const SCOPE_OPTIONS = [
  { value: "", label: "—" },
  { value: "own", label: "Own" },
  { value: "team", label: "Team" },
  { value: "department", label: "Department" },
  { value: "all", label: "All" },
];

const SCOPE_STYLES = {
  own: "bg-sky-50 text-sky-700 border-sky-200",
  team: "bg-indigo-50 text-indigo-700 border-indigo-200",
  department: "bg-amber-50 text-amber-700 border-amber-200",
  all: "bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200",
};

const grantKey = (role, perm) => `${role}|${perm}`;

export default function RolesPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("role.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask a Super Admin for the role.manage permission." />
      ) : (
        <RolesMatrix />
      )}
    </div>
  );
}

function RolesMatrix() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [grants, setGrants] = useState({});
  const [locked, setLocked] = useState({});
  const [pending, setPending] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    const data = await hcmJson("/api/hcm/roles");
    setRoles(data.roles || []);
    setPermissions(data.permissions || []);
    setLocked(data.locked || {});
    setGrants(Object.fromEntries((data.grants || []).map((g) => [grantKey(g.role_code, g.permission_code), g.scope])));
  }, []);

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [load]);

  const grouped = useMemo(() => {
    const groups = new Map();
    for (const p of permissions) {
      const mod = p.module || "general";
      if (!groups.has(mod)) groups.set(mod, []);
      groups.get(mod).push(p);
    }
    return [...groups.entries()];
  }, [permissions]);

  const changeScope = async (roleCode, permCode, value) => {
    const key = grantKey(roleCode, permCode);
    const previous = grants[key];
    const scope = value || null;
    setError("");
    setGrants((g) => {
      const next = { ...g };
      if (scope) next[key] = scope;
      else delete next[key];
      return next;
    });
    setPending((p) => ({ ...p, [key]: true }));
    try {
      await hcmJson("/api/hcm/roles", { method: "PUT", body: { role_code: roleCode, permission_code: permCode, scope } });
    } catch (err) {
      setGrants((g) => {
        const next = { ...g };
        if (previous) next[key] = previous;
        else delete next[key];
        return next;
      });
      setError(err.message);
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Choose what each role can do and how far its access reaches."
        actions={
          <Button onClick={() => setShowNew(true)} disabled={loading}>
            <Plus className="w-4 h-4" aria-hidden="true" /> New role
          </Button>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      {loading ? (
        <Spinner />
      ) : !roles.length || !permissions.length ? (
        <EmptyState icon={ShieldCheck} title="No roles or permissions configured" />
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
            <span className="font-semibold text-slate-600">Scopes:</span>
            {SCOPE_OPTIONS.slice(1).map((s) => (
              <Badge key={s.value} className={SCOPE_STYLES[s.value]}>
                {s.label}
              </Badge>
            ))}
            <span className="inline-flex items-center gap-1 ml-2">
              <Lock className="w-3 h-3" aria-hidden="true" /> Locked to prevent admin lock-out
            </span>
          </div>
          <div className="overflow-x-auto -mx-5 border-y border-slate-100">
            <table className="text-sm border-separate border-spacing-0 min-w-full">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-20 bg-white text-left text-xs font-semibold text-slate-500 px-5 py-3 border-b border-r border-slate-100 min-w-[240px]"
                  >
                    Permission
                  </th>
                  {roles.map((r) => (
                    <th
                      key={r.code}
                      scope="col"
                      className="text-left px-3 py-3 border-b border-slate-100 min-w-[130px] align-bottom"
                    >
                      <div className="text-xs font-bold text-slate-800">{r.name}</div>
                      <div className="text-[11px] font-medium text-slate-400">
                        {r.member_count} {r.member_count === 1 ? "member" : "members"}
                        {!r.is_system && " · custom"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped.map(([mod, perms]) => (
                  <Fragment key={mod}>
                    <tr>
                      <th
                        scope="colgroup"
                        className="sticky left-0 z-10 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 px-5 py-2 border-b border-r border-slate-100"
                      >
                        {mod}
                      </th>
                      <td colSpan={roles.length} className="bg-slate-50 border-b border-slate-100" />
                    </tr>
                    {perms.map((p) => (
                      <tr key={p.code} className="group">
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 text-left font-normal px-5 py-2 border-b border-r border-slate-100"
                        >
                          <div className="font-mono text-xs font-semibold text-slate-700">{p.code}</div>
                          {p.description && <div className="text-[11px] text-slate-500">{p.description}</div>}
                        </th>
                        {roles.map((r) => {
                          const key = grantKey(r.code, p.code);
                          const scope = grants[key] || "";
                          const isLocked = (locked[r.code] || []).includes(p.code);
                          return (
                            <td key={r.code} className="px-3 py-2 border-b border-slate-100 group-hover:bg-slate-50">
                              <div className="flex items-center gap-1" title={isLocked ? "Locked: this permission can't be removed from this role." : undefined}>
                                <select
                                  aria-label={`${r.name} – ${p.code} scope`}
                                  value={scope}
                                  disabled={isLocked || pending[key]}
                                  onChange={(e) => changeScope(r.code, p.code, e.target.value)}
                                  className={`h-7 rounded-lg border px-1.5 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-teal-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                                    scope ? SCOPE_STYLES[scope] : "bg-white text-slate-400 border-slate-200"
                                  }`}
                                >
                                  {SCOPE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" aria-label="Locked" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showNew && (
        <NewRoleModal
          roles={roles}
          onClose={() => setShowNew(false)}
          onCreated={async () => {
            setShowNew(false);
            try {
              await load();
            } catch (err) {
              setError(err.message);
            }
          }}
        />
      )}
    </>
  );
}

function NewRoleModal({ roles, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", clone_from: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await hcmJson("/api/hcm/roles", {
        method: "POST",
        body: { name: form.name, description: form.description, clone_from: form.clone_from || null },
      });
      onCreated();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="New role"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-role-form" loading={saving}>
            Create role
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <form id="new-role-form" onSubmit={submit} className="space-y-4">
        <Field label="Name" required>
          <Input value={form.name} onChange={set("name")} required autoFocus />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={set("description")} />
        </Field>
        <Field label="Clone permissions from" hint="Optional. Copies every grant from the selected role.">
          <Select
            placeholder="Start empty"
            options={roles.map((r) => ({ value: r.code, label: r.name }))}
            value={form.clone_from}
            onChange={set("clone_from")}
          />
        </Field>
      </form>
    </Modal>
  );
}
