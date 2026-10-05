"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, Lock, Mail, Send } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Badge,
  Spinner,
  EmptyState,
  ErrorBanner,
  formatDate,
} from "@/components/hcm/ui";

const PLACEHOLDER_RE = /\{\{\s*(\w+)\s*\}\}/g;

const OUTBOX_STYLES = {
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  queued: "bg-sky-50 text-sky-700 border-sky-200",
  pending: "bg-sky-50 text-sky-700 border-sky-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  skipped: "bg-amber-50 text-amber-700 border-amber-200",
};

const unescapeNewlines = (text) => String(text || "").replace(/\\n/g, "\n");

function extractPlaceholders(...texts) {
  const found = new Set();
  for (const t of texts) for (const m of String(t || "").matchAll(PLACEHOLDER_RE)) found.add(m[1]);
  return [...found];
}

function renderTemplate(text, vars) {
  return String(text || "").replace(PLACEHOLDER_RE, (match, name) => (vars[name] ? vars[name] : match));
}

function sampleFor(name) {
  if (/email/i.test(name)) return "jane.doe@example.com";
  if (/link|url/i.test(name)) return "https://example.com/link";
  if (/date|time/i.test(name)) return new Date().toLocaleDateString();
  if (/name/i.test(name)) return "Jane Doe";
  return "";
}

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-200 ${
        checked ? "bg-brand-teal-500" : "bg-slate-300"
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function TemplatesPage() {
  const { user, can } = useInternalUser();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("template.manage") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Ask a Super Admin for the template.manage permission." />
      ) : (
        <TemplatesManager />
      )}
    </div>
  );
}

function TemplatesManager() {
  const [templates, setTemplates] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedCode, setSelectedCode] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [samples, setSamples] = useState({});
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    const data = await hcmJson("/api/hcm/templates");
    setTemplates(data.templates || []);
    setOutbox(data.outbox || []);
    return data.templates || [];
  }, []);

  const selected = templates.find((t) => t.code === selectedCode) || null;

  const select = useCallback((template) => {
    setSelectedCode(template.code);
    setSubject(unescapeNewlines(template.subject));
    setBody(unescapeNewlines(template.body));
    setNotice("");
    setSamples((prev) => {
      const next = { ...prev };
      for (const name of extractPlaceholders(template.subject, template.body)) {
        if (next[name] === undefined) next[name] = sampleFor(name);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    load()
      .then((list) => list[0] && select(list[0]))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [load, select]);

  const grouped = useMemo(() => {
    const groups = new Map();
    for (const t of templates) {
      const stage = t.stage || "General";
      if (!groups.has(stage)) groups.set(stage, []);
      groups.get(stage).push(t);
    }
    return [...groups.entries()];
  }, [templates]);

  const placeholders = useMemo(() => extractPlaceholders(subject, body), [subject, body]);

  const dirty = selected && (subject !== unescapeNewlines(selected.subject) || body !== unescapeNewlines(selected.body));

  const trySelect = (template) => {
    if (template.code === selectedCode) return;
    if (dirty && !window.confirm("Discard unsaved changes to this template?")) return;
    select(template);
  };

  const updateTemplate = (updated) => setTemplates((list) => list.map((t) => (t.code === updated.code ? updated : t)));

  const toggleEnabled = async (template, enabled) => {
    setError("");
    setToggling(template.code);
    updateTemplate({ ...template, enabled });
    try {
      const res = await hcmJson("/api/hcm/templates", { method: "PUT", body: { code: template.code, enabled } });
      updateTemplate(res.template);
    } catch (err) {
      updateTemplate(template);
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const save = async () => {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await hcmJson("/api/hcm/templates", { method: "PUT", body: { code: selectedCode, subject, body } });
      updateTemplate(res.template);
      setSubject(unescapeNewlines(res.template.subject));
      setBody(unescapeNewlines(res.template.body));
      setNotice("Template saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setError("");
    setNotice("");
    setSending(true);
    try {
      const vars = Object.fromEntries(placeholders.map((p) => [p, samples[p] || ""]));
      const res = await hcmJson("/api/hcm/templates", { method: "POST", body: { code: selectedCode, vars } });
      setNotice(res.message || "Test email queued.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title="Email Templates" description="Edit the messages sent to candidates and staff at each stage." />

      <div role="note" className="mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>Email delivery is not connected yet. Messages are recorded in the outbox with status &apos;skipped&apos;.</span>
      </div>

      <ErrorBanner message={error} onClose={() => setError("")} />
      {notice && (
        <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : templates.length === 0 ? (
        <EmptyState icon={Mail} title="No email templates configured" />
      ) : (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
            <nav aria-label="Templates" className="bg-white border border-slate-200 rounded-2xl p-2 lg:sticky lg:top-4 max-h-[75vh] overflow-y-auto">
              {grouped.map(([stage, list]) => (
                <div key={stage} className="mb-2 last:mb-0">
                  <h2 className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{stage}</h2>
                  <ul>
                    {list.map((t) => (
                      <li key={t.code}>
                        <div
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                            t.code === selectedCode ? "bg-brand-teal-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => trySelect(t)}
                            aria-current={t.code === selectedCode ? "true" : undefined}
                            className="flex-1 min-w-0 text-left cursor-pointer focus:outline-none focus-visible:underline"
                          >
                            <span className={`block text-sm font-semibold truncate ${t.enabled ? "text-slate-800" : "text-slate-400"}`}>
                              {t.name}
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate">To: {t.recipient || "—"}</span>
                          </button>
                          <Toggle
                            checked={Boolean(t.enabled)}
                            disabled={toggling === t.code}
                            onChange={(v) => toggleEnabled(t, v)}
                            label={`${t.enabled ? "Disable" : "Enable"} ${t.name}`}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            {selected && (
              <Card
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {selected.name}
                    <span className="font-mono text-[11px] font-medium text-slate-400">{selected.code}</span>
                    {!selected.enabled && <Badge>Disabled</Badge>}
                    {dirty && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Unsaved</Badge>}
                  </span>
                }
                actions={<span className="text-[11px] text-slate-400">Updated {formatDate(selected.updated_at, true)}</span>}
              >
                <div className="space-y-4">
                  <Field label="Subject" required>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </Field>
                  <Field label="Body" required hint="Use {{placeholder}} for values filled in when the email is sent.">
                    <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-xs leading-relaxed" />
                  </Field>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">Placeholders &amp; sample values</h3>
                    {placeholders.length === 0 ? (
                      <p className="text-xs text-slate-400">No placeholders in this template.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {placeholders.map((p) => (
                          <label key={p} className="block">
                            <span className="block font-mono text-[11px] text-brand-teal-700 mb-1">{`{{${p}}}`}</span>
                            <Input
                              value={samples[p] || ""}
                              placeholder="Sample value"
                              onChange={(e) => setSamples((s) => ({ ...s, [p]: e.target.value }))}
                              className="h-9"
                            />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">Preview</h3>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden" aria-live="polite">
                      <div className="px-4 py-2.5 border-b border-slate-200 bg-white text-sm">
                        <span className="text-slate-400 mr-2">Subject:</span>
                        <span className="font-semibold text-slate-800">{renderTemplate(subject, samples)}</span>
                      </div>
                      <div className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap break-words">{renderTemplate(body, samples)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={sendTest} loading={sending} disabled={dirty}>
                      <Send className="w-4 h-4" aria-hidden="true" /> Send test
                    </Button>
                    <Button onClick={save} loading={saving} disabled={!dirty || !subject.trim() || !body.trim()}>
                      Save
                    </Button>
                  </div>
                  {dirty && <p className="text-[11px] text-slate-400 text-right">Save your changes before sending a test.</p>}
                </div>
              </Card>
            )}
          </div>

          <Card title="Recent outbox">
            {outbox.length === 0 ? (
              <p className="text-sm text-slate-400">No messages recorded yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                      <th className="px-5 py-2">Time</th>
                      <th className="px-3 py-2">Template</th>
                      <th className="px-3 py-2">To</th>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-5 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outbox.map((o) => (
                      <tr key={o.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(o.created_at, true)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{o.template_code}</td>
                        <td className="px-3 py-2.5 text-slate-600">{o.to_email}</td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-xs truncate" title={o.subject}>
                          {o.subject}
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge className={OUTBOX_STYLES[o.status] || undefined}>{o.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
