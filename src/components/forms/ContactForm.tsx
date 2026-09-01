"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, AlertCircle, Loader2, Building2, User2, Mail, Phone, Briefcase, Globe } from "lucide-react";

/**
 * PostgreSQL Error Code Translation for Enterprise Feedback
 */
function resolveApiError(code?: string, fallback?: string): string {
  const errorMap: Record<string, string> = {
    '23505': 'This business email is already registered in our system.',
    '23514': 'The email address format is invalid.',
    '23503': 'Required data reference missing. Please refresh and try again.',
    '42501': 'Security policy restriction. Please contact SST Support.',
  };
  return (code && errorMap[code]) || fallback || 'An unexpected error occurred. Please try again.';
}

const INDUSTRIES = [
  'Oil & Gas', 
  'Manufacturing', 
  'Finance', 
  'Healthcare', 
  'Retail', 
  'Construction', 
  'Public Sector'
] as const;

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    problemSummary: "",
    consentGiven: false,
  });
  
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      industry: formData.industry,
      problem_summary: formData.problemSummary.trim(),
      lead_source: "Enterprise Contact Form",
      consent_given: formData.consentGiven,
      inquiry_type: "Contact Form", // Enum matching
      // Campaign Attribution
      utm_source: urlParams.get("utm_source"),
      utm_medium: urlParams.get("utm_medium"),
      utm_campaign: urlParams.get("utm_campaign"),
      referrer_url: typeof document !== "undefined" ? document.referrer || null : null,
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(resolveApiError(result.code, result.error));
        return;
      }

      setStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        industry: "",
        problemSummary: "",
        consentGiven: false,
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("System unreachable. Please check your connectivity or try again later.");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (status === "success") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        role="alert"
        aria-live="polite"
        className="text-center py-24 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-blue-50 max-w-2xl mx-auto px-8"
      >
        <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-xl shadow-blue-500/30">
          <CheckCircle className="w-12 h-12" aria-hidden="true" />
        </div>
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Requirement Captured</h2>
        <p className="text-slate-500 mb-10 text-lg font-medium">Your request has been prioritized under sst-premium. An SST transformation consultant will contact you via your business email shortly.</p>
        <button 
          onClick={() => setStatus("idle")}
          className="bg-slate-900 text-white font-bold py-4 px-10 rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
        >
          Submit New Inquiry
        </button>
      </motion.div>
    );
  }

  return (
    <form 
      id="contact-enterprise-form"
      onSubmit={handleSubmit} 
      className="w-full max-w-4xl mx-auto p-1 bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden"
      aria-labelledby="form-heading"
    >
      <div className="bg-slate-900 text-white p-12 rounded-[3.2rem]">
        <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Globe className="w-3.5 h-3.5" aria-hidden="true" /> GCC Global Delivery Network
            </div>
            <h2 id="form-heading" className="text-5xl font-black tracking-tighter mb-4 leading-none">Enterprise <br/><span className="text-blue-500">Inquiry</span></h2>
            <p className="text-slate-400 font-medium text-lg max-w-lg leading-relaxed">Let&apos;s refine your SAP landscape. Provide your business details below to initiate a technical assessment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <div className="space-y-3">
            <label htmlFor="firstName" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <User2 className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" /> First Name
            </label>
            <input
              required
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Abdullah"
              autoComplete="given-name"
              className="w-full px-6 py-5 bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="lastName" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <User2 className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" /> Last Name
            </label>
            <input
              required
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Al-Mansoor"
              autoComplete="family-name"
              className="w-full px-6 py-5 bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="email" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" /> Business Email
            </label>
            <input
              required
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="corporate@domain.com"
              autoComplete="email"
              className="w-full px-6 py-5 bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="phone" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" /> Mobile / WhatsApp
            </label>
            <input
              required
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+971 -- --- ----"
              autoComplete="tel"
              className="w-full px-6 py-5 bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="company" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" /> Organization
            </label>
            <input
              required
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Sovereign Wealth / Corp"
              autoComplete="organization"
              className="w-full px-6 py-5 bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="industry" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" /> Industry Sector
            </label>
            <div className="relative">
                <select
                required
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-6 py-5 bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white appearance-none cursor-pointer"
                >
                <option value="" className="bg-slate-900">Select sector...</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-slate-900">{ind}</option>)}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" aria-hidden="true">▼</div>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-3">
          <label htmlFor="problemSummary" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Transformation Objectives</label>
          <textarea
            required
            id="problemSummary"
            name="problemSummary"
            value={formData.problemSummary}
            onChange={handleChange}
            rows={5}
            placeholder="Outline your current technical challenges or SAP S/4HANA migration goals..."
            className="w-full px-8 py-6 bg-slate-800/50 border border-slate-700/50 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white resize-none text-lg leading-relaxed placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mt-12 pt-12 border-t border-slate-800/50 p-2">
          <div className="flex items-start gap-4 flex-1 max-w-xl">
            <div className="relative flex items-center mt-1">
                <input
                    required
                    id="consentGiven"
                    name="consentGiven"
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={handleChange}
                    className="w-6 h-6 rounded-lg border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/40 cursor-pointer"
                />
            </div>
            <label htmlFor="consentGiven" className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-bold select-none cursor-pointer">
              By initializing this request, I consent to SST processing my professional data under GCC Regional Data Laws (UAE PDPL / Saudi PDPL) and EU GDPR protocols for enterprise consulting.
            </label>
          </div>

          <button
            disabled={status === "submitting"}
            type="submit"
            className="group relative bg-blue-600 hover:bg-blue-500 text-white font-black py-6 px-16 rounded-[2rem] transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 disabled:bg-slate-700 disabled:shadow-none min-w-[280px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {status === "submitting" ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                Validating...
              </>
            ) : (
                <>
                <span className="text-xl">Initialize Request</span>
                <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" aria-hidden="true" />
                </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              role="alert"
              className="mt-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-sm font-black"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" aria-hidden="true" />
              </div>
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
