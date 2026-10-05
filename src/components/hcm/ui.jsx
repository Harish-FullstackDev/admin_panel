"use client";

import { useEffect } from "react";
import { Loader2, X, AlertCircle } from "lucide-react";

export const inputClass =
  "w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 disabled:bg-slate-50 disabled:text-slate-500";

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "" }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-2xl ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const VARIANTS = {
  primary: "bg-brand-teal-500 hover:bg-brand-teal-600 text-white border-transparent",
  secondary: "bg-white hover:bg-slate-50 text-slate-700 border-slate-200",
  danger: "bg-red-500 hover:bg-red-600 text-white border-transparent",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-600 border-transparent",
};

export function Button({ variant = "primary", loading = false, className = "", children, size = "md", ...props }) {
  const sizing = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizing} ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Field({ label, required, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input {...props} className={`${inputClass} ${props.className || ""}`} />;
}

export function Textarea(props) {
  return <textarea rows={3} {...props} className={`${inputClass} h-auto py-2 resize-y ${props.className || ""}`} />;
}

export function Select({ options, placeholder, ...props }) {
  return (
    <select {...props} className={`${inputClass} cursor-pointer ${props.className || ""}`}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((opt) => {
        const value = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function Badge({ children, className = "bg-slate-100 text-slate-700 border-slate-200" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin text-brand-teal-500" aria-hidden="true" /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-14 bg-white border border-dashed border-slate-300 rounded-2xl">
      {Icon && <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />}
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

export function formatMoney(amount, currency = "INR") {
  if (amount === null || amount === undefined || amount === "") return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
