"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Lock, Search, UserPlus, Users } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Select,
  Badge,
  Spinner,
  EmptyState,
  ErrorBanner,
  Modal,
  formatDate,
  inputClass,
} from "@/components/hcm/ui";

const STATUSES = ["Invited", "Active", "Suspended", "Deactivated"];

const STATUS_STYLES = {
  Invited: "bg-amber-50 text-amber-700 border-amber-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Suspended: "bg-orange-50 text-orange-700 border-orange-200",
  Deactivated: "bg-slate-100 text-slate-500 border-slate-200",
};

function StatusBadge({ status }) {
  return <Badge className={STATUS_STYLES[status] || undefined}>{status}</Badge>;
}

function toEndOfDayIso(date) {
  return date ? new Date(`${date}T23:59:59`).toISOString() : null;
}

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayInput() {
  return toDateInput(new Date());
}

export default function UsersPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("user.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask a Super Admin for the user.manage permission." />
      ) : (
        <UsersManager currentUserId={user.id} />
      )}
    </div>
  );
}

function UsersManager({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [inviteLink, setInviteLink] = useState("");

  const loadUsers = useCallback(async () => {
    const data = await hcmJson("/api/hcm/users");
    setUsers(data.users || []);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [u, r, d] = await Promise.all([
          hcmJson("/api/hcm/users"),
          hcmJson("/api/hcm/roles"),
          hcmJson("/api/hcm/org/departments"),
        ]);
        if (!active) return;
        setUsers(u.users || []);
        setRoles(r.roles || []);
        setDepartments(d.items || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const roleNames = useMemo(() => Object.fromEntries(roles.map((r) => [r.code, r.name])), [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter && u.status !== statusFilter) return false;
      if (roleFilter && !(u.user_roles || []).some((r) => r.role_code === roleFilter)) return false;
      if (!q) return true;
      return [u.full_name, u.email, u.designation].some((v) => v && v.toLowerCase().includes(q));
    });
  }, [users, search, statusFilter, roleFilter]);

  const refresh = async () => {
    try {
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Invite internal users, assign roles and manage account status."
        actions={
          <Button onClick={() => setShowAdd(true)} disabled={loading}>
            <UserPlus className="w-4 h-4" aria-hidden="true" /> Add user
          </Button>
        }
      />
      <ErrorBanner message={error} onClose={() => setError("")} />

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <Input
                type="search"
                aria-label="Search users"
                placeholder="Search name, email or designation"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              aria-label="Filter by status"
              className="w-auto min-w-[160px]"
              placeholder="All statuses"
              options={STATUSES}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              aria-label="Filter by role"
              className="w-auto min-w-[180px]"
              placeholder="All roles"
              options={roles.map((r) => ({ value: r.code, label: r.name }))}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Users} title={users.length ? "No users match your filters" : "No users yet"} />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Roles</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-5 py-2">Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      tabIndex={0}
                      onClick={() => setSelectedId(u.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(u.id);
                        }
                      }}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer focus:outline-none focus:bg-brand-teal-50"
                    >
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-800">
                          {u.full_name}
                          {u.id === currentUserId && <span className="ml-1.5 text-[11px] font-medium text-slate-400">(you)</span>}
                        </div>
                        {u.designation && <div className="text-xs text-slate-500">{u.designation}</div>}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{u.email}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.user_roles || []).map((r) => (
                            <Badge key={r.role_code} className="bg-brand-teal-50 text-brand-teal-700 border-brand-teal-100">
                              {roleNames[r.role_code] || r.role_code}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{u.departments?.name || "—"}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDate(u.last_login_at, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showAdd && (
        <AddUserModal
          roles={roles}
          departments={departments}
          onClose={() => setShowAdd(false)}
          onInvited={(link) => {
            setShowAdd(false);
            setInviteLink(link || "");
            refresh();
          }}
        />
      )}

      {selectedId && (
        <UserDetailModal
          userId={selectedId}
          currentUserId={currentUserId}
          roles={roles}
          departments={departments}
          roleNames={roleNames}
          onClose={() => setSelectedId(null)}
          onChanged={refresh}
          onInviteLink={setInviteLink}
        />
      )}

      {inviteLink && <InviteLinkModal link={inviteLink} onClose={() => setInviteLink("")} />}
    </>
  );
}

function InviteLinkModal({ link, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Modal title="Invite link" onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
      <p className="text-sm text-slate-600 mb-3">
        Email delivery isn&apos;t connected yet — share this one-time link (valid 48 hours) with the user.
      </p>
      <div className="flex gap-2">
        <input readOnly aria-label="Invite link" value={link} onFocus={(e) => e.target.select()} className={`${inputClass} font-mono text-xs`} />
        <Button variant="secondary" onClick={copy} aria-label="Copy invite link">
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Modal>
  );
}

function AddUserModal({ roles, departments, onClose, onInvited }) {
  const [form, setForm] = useState({ full_name: "", email: "", designation: "", department_id: "", expires_at: "" });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleRole = (code) =>
    setSelectedRoles((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedRoles.length) {
      setError("Assign at least one role.");
      return;
    }
    setSaving(true);
    try {
      const data = await hcmJson("/api/hcm/users", {
        method: "POST",
        body: {
          full_name: form.full_name,
          email: form.email,
          designation: form.designation || undefined,
          department_id: form.department_id || undefined,
          roles: selectedRoles,
          expires_at: toEndOfDayIso(form.expires_at) || undefined,
        },
      });
      onInvited(data.inviteLink);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="add-user-form" loading={saving}>
            Send invite
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} onClose={() => setError("")} />
      <form id="add-user-form" onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <Input value={form.full_name} onChange={set("full_name")} required autoFocus />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label="Designation">
            <Input value={form.designation} onChange={set("designation")} />
          </Field>
          <Field label="Department">
            <Select
              placeholder="No department"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              value={form.department_id}
              onChange={set("department_id")}
            />
          </Field>
        </div>
        <fieldset>
          <legend className="block text-xs font-semibold text-slate-600 mb-1.5">
            Roles <span className="text-red-500">*</span>
          </legend>
          <div className="grid sm:grid-cols-2 gap-2">
            {roles.map((r) => (
              <label
                key={r.code}
                className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-brand-teal-500"
                  checked={selectedRoles.includes(r.code)}
                  onChange={() => toggleRole(r.code)}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{r.name}</span>
                  {r.description && <span className="block text-[11px] text-slate-500">{r.description}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Access expires on" hint="Optional. Leave empty for permanent access.">
          <Input type="date" min={todayInput()} value={form.expires_at} onChange={set("expires_at")} />
        </Field>
      </form>
    </Modal>
  );
}

const ACTION_COPY = {
  suspend: {
    title: "Suspend user",
    message: "The user will be signed out and blocked from logging in until reactivated.",
    button: "Suspend",
    variant: "danger",
  },
  reactivate: {
    title: "Reactivate user",
    message: "The user will be able to log in again with their existing roles.",
    button: "Reactivate",
    variant: "primary",
  },
  deactivate: {
    title: "Deactivate user",
    message:
      "Deactivation blocks login immediately. The account and its full history are kept — accounts are never deleted.",
    button: "Deactivate",
    variant: "danger",
  },
};

function noop() {}

function UserDetailModal({ userId, currentUserId, roles, departments, roleNames, onClose, onChanged, onInviteLink }) {
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(null);
  const [roleState, setRoleState] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const data = await hcmJson(`/api/hcm/users/${userId}`);
    setDetail(data.user);
    setHistory(data.history || []);
    setForm({
      full_name: data.user.full_name || "",
      designation: data.user.designation || "",
      department_id: data.user.department_id || "",
    });
    setRoleState(
      Object.fromEntries((data.user.user_roles || []).map((r) => [r.role_code, { expires_at: toDateInput(r.expires_at) }]))
    );
  }, [userId]);

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  const isSelf = userId === currentUserId;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleRole = (code) =>
    setRoleState((s) => {
      const next = { ...s };
      if (next[code]) delete next[code];
      else next[code] = { expires_at: "" };
      return next;
    });

  const setRoleExpiry = (code, value) => setRoleState((s) => ({ ...s, [code]: { expires_at: value } }));

  const save = async () => {
    setError("");
    setNotice("");
    const codes = Object.keys(roleState);
    if (!codes.length) {
      setError("A user needs at least one role. Deactivate the account instead.");
      return;
    }
    setSaving(true);
    try {
      await hcmJson(`/api/hcm/users/${userId}`, {
        method: "PATCH",
        body: {
          full_name: form.full_name,
          designation: form.designation,
          department_id: form.department_id || null,
          roles: codes.map((code) => ({ code, expires_at: toEndOfDayIso(roleState[code].expires_at) })),
        },
      });
      await load();
      onChanged();
      setNotice("Changes saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action) => {
    setError("");
    setNotice("");
    setActing(action);
    try {
      const data = await hcmJson(`/api/hcm/users/${userId}`, { method: "PATCH", body: { action } });
      if (action === "resend_invite") {
        onInviteLink(data.inviteLink || "");
      } else {
        await load();
        onChanged();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActing("");
      setConfirmAction(null);
    }
  };

  const status = detail?.status;
  const deactivated = status === "Deactivated";

  return (
    <>
      <Modal
        wide
        title={detail ? detail.full_name : "User"}
        onClose={confirmAction ? noop : onClose}
        footer={
          detail && (
            <>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button onClick={save} loading={saving} disabled={deactivated}>
                Save changes
              </Button>
            </>
          )
        }
      >
        {loading ? (
          <Spinner />
        ) : !detail ? (
          <ErrorBanner message={error || "User not found."} />
        ) : (
          <div className="space-y-6">
            <ErrorBanner message={error} onClose={() => setError("")} />
            {notice && (
              <div role="status" className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <StatusBadge status={status} />
              <span>{detail.email}</span>
              <span className="text-slate-400">·</span>
              <span>Created {formatDate(detail.created_at)}</span>
              <span className="text-slate-400">·</span>
              <span>Last login {formatDate(detail.last_login_at, true)}</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Full name" required>
                <Input value={form.full_name} onChange={set("full_name")} disabled={deactivated} />
              </Field>
              <Field label="Designation">
                <Input value={form.designation} onChange={set("designation")} disabled={deactivated} />
              </Field>
              <Field label="Department">
                <Select
                  placeholder="No department"
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  value={form.department_id}
                  onChange={set("department_id")}
                  disabled={deactivated}
                />
              </Field>
            </div>

            <fieldset>
              <legend className="block text-xs font-semibold text-slate-600 mb-1.5">Roles</legend>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {roles.map((r) => {
                  const assigned = Boolean(roleState[r.code]);
                  return (
                    <div key={r.code} className="flex flex-wrap items-center gap-3 px-3 py-2">
                      <label className="flex items-center gap-2 flex-1 min-w-[180px] cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-brand-teal-500"
                          checked={assigned}
                          onChange={() => toggleRole(r.code)}
                          disabled={deactivated}
                        />
                        <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                      </label>
                      {assigned && (
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                          Expires
                          <input
                            type="date"
                            aria-label={`${r.name} access expiry`}
                            value={roleState[r.code].expires_at}
                            onChange={(e) => setRoleExpiry(r.code, e.target.value)}
                            disabled={deactivated}
                            className={`${inputClass} h-8 w-auto text-xs`}
                          />
                          {roleState[r.code].expires_at && (
                            <button
                              type="button"
                              onClick={() => setRoleExpiry(r.code, "")}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              aria-label={`Clear ${r.name} expiry`}
                            >
                              Clear
                            </button>
                          )}
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {!isSelf && (
              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-2">Account status</h3>
                <div className="flex flex-wrap gap-2">
                  {status === "Invited" && (
                    <Button variant="secondary" size="sm" loading={acting === "resend_invite"} onClick={() => runAction("resend_invite")}>
                      Resend invite
                    </Button>
                  )}
                  {(status === "Active" || status === "Invited") && (
                    <Button variant="secondary" size="sm" onClick={() => setConfirmAction("suspend")}>
                      Suspend
                    </Button>
                  )}
                  {(status === "Suspended" || status === "Deactivated") && (
                    <Button variant="secondary" size="sm" onClick={() => setConfirmAction("reactivate")}>
                      Reactivate
                    </Button>
                  )}
                  {!deactivated && (
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction("deactivate")}>
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-slate-600 mb-2">Change history</h3>
              {history.length === 0 ? (
                <p className="text-sm text-slate-400">No changes recorded.</p>
              ) : (
                <ol className="space-y-2">
                  {history.map((h, i) => (
                    <li key={h.id || i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">{h.action}</span>
                        <span className="text-xs text-slate-500">{formatDate(h.created_at, true)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">by {h.actor_email || "system"}</div>
                      <ChangeSummary before={h.before} after={h.after} roleNames={roleNames} />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </Modal>

      {confirmAction && (
        <Modal
          title={ACTION_COPY[confirmAction].title}
          onClose={() => !acting && setConfirmAction(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={Boolean(acting)}>
                Cancel
              </Button>
              <Button
                variant={ACTION_COPY[confirmAction].variant}
                loading={acting === confirmAction}
                onClick={() => runAction(confirmAction)}
              >
                {ACTION_COPY[confirmAction].button}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {ACTION_COPY[confirmAction].message} Continue for <strong>{detail?.full_name}</strong>?
          </p>
        </Modal>
      )}
    </>
  );
}

function formatValue(key, value, roleNames) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "roles" && Array.isArray(value)) {
    return (
      value
        .map((r) => {
          const code = typeof r === "string" ? r : r.role_code;
          const name = roleNames[code] || code;
          return r?.expires_at ? `${name} (until ${formatDate(r.expires_at)})` : name;
        })
        .join(", ") || "—"
    );
  }
  if (key === "expires_at") return formatDate(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ChangeSummary({ before, after, roleNames }) {
  const b = before && typeof before === "object" ? before : {};
  const a = after && typeof after === "object" ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter(
    (k) => JSON.stringify(b[k]) !== JSON.stringify(a[k])
  );
  if (!keys.length) return null;
  return (
    <dl className="mt-2 space-y-1 text-xs">
      {keys.map((k) => (
        <div key={k} className="flex flex-wrap gap-1">
          <dt className="font-semibold text-slate-600">{k.replace(/_/g, " ")}:</dt>
          <dd className="text-slate-600">
            {k in b && <span className="line-through text-slate-400 mr-1">{formatValue(k, b[k], roleNames)}</span>}
            {k in a && <span>{formatValue(k, a[k], roleNames)}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
