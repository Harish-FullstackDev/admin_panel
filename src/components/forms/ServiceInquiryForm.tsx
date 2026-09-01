"use client";
import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, CheckCircle, AlertCircle, Loader2, User, Mail, MessageSquare, ChevronDown } from "lucide-react";

interface Service {
  id: string;
  name: string;
  slug: string;
}

export default function ServiceInquiryForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    serviceId: "",
    message: "",
    consentGiven: false,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [loadingServices, setLoadingServices] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        const json = await res.json();
        if (json.success) setServices(json.data);
      } catch (err) {
        console.error("Failed to load services");
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "Client";

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: formData.email.trim().toLowerCase(),
        service_id: formData.serviceId,
        inquiry_type: "Service Detail", // Matches Enum
        problem_summary: formData.message,
        lead_source: "Service Detail Ingestion",
        consent_given: formData.consentGiven,
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Inquiry capture failed.");

      setStatus("success");
      setFormData({ name: "", email: "", serviceId: "", message: "", consentGiven: false });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "A system error occurred. Please try again.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Settings className="w-24 h-24 animate-spin-slow" aria-hidden="true" />
      </div>

      <div className="relative z-10">
        <h3 id="service-inquiry-heading" className="text-2xl font-bold text-white mb-2">Service-Specific Inquiry</h3>
        <p className="text-slate-400 text-sm mb-8">Detailed technical requests for specialized SAP and IT solutions.</p>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          aria-labelledby="service-inquiry-heading"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label htmlFor="service-name" className="sr-only">Full Name</label>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" aria-hidden="true" />
              <input
                required
                id="service-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
                className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <label htmlFor="service-email" className="sr-only">Business Email</label>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" aria-hidden="true" />
              <input
                required
                id="service-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Business Email"
                className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="service-select" className="sr-only">Select Targeted Service</label>
            <select
              required
              id="service-select"
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="w-full px-5 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">{loadingServices ? "Loading services..." : "Select Targeted Service"}</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true" />
          </div>

          <div className="relative">
            <label htmlFor="service-message" className="sr-only">Technical requirement details</label>
            <MessageSquare className="absolute left-4 top-5 text-slate-500 w-5 h-5" aria-hidden="true" />
            <textarea
              required
              id="service-message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Technical requirement details..."
              className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 px-2">
            <input
              required
              type="checkbox"
              id="serviceConsent"
              checked={formData.consentGiven}
              onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
              className="w-5 h-5 rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <label htmlFor="serviceConsent" className="text-[10px] sm:text-xs text-slate-500 font-medium cursor-pointer">
              I agree to the regional data processing terms (GCC/GDPR compliant).
            </label>
          </div>

          <button
            disabled={status === "submitting" || loadingServices}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                Submitting Request
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-400" aria-hidden="true" />
                Inquiry Sent
              </>
            ) : (
              "Submit Technical Inquiry"
            )}
          </button>

          <AnimatePresence>
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
