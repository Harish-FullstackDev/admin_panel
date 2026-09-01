"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, CheckCircle, AlertCircle, Loader2, User, Phone, Clock } from "lucide-react";

export default function CallbackRequestForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "", // Added explicit email field for enterprise leads
    preferredTime: "",
    consentGiven: false,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

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
        phone: formData.phone.trim(),
        inquiry_type: "Callback Request", // Matches Enum
        message: `User requested a priority callback. Preferred Window: ${formData.preferredTime}`,
        preferred_callback_time: null, // We store simplified window in message or specific column if needed
        lead_source: "Callback Intent",
        consent_given: formData.consentGiven,
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Callback scheduling failed.");

      setStatus("success");
      setFormData({ name: "", phone: "", email: "", preferredTime: "", consentGiven: false });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "A system error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
        <PhoneCall className="w-8 h-8" />
      </div>

      <h3 id="callback-form-title" className="text-2xl font-extrabold text-gray-900 mb-2">Priority Callback</h3>
      <p className="text-gray-500 text-sm mb-10 leading-relaxed">Schedule a direct conversation with our regional account managers.</p>

      <form 
        onSubmit={handleSubmit} 
        className="w-full space-y-5 text-left"
        aria-labelledby="callback-form-title"
      >
        <div className="space-y-1.5">
          <label htmlFor="callback-name" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" aria-hidden="true" />
            <input
              required
              id="callback-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              autoComplete="name"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="callback-email" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Business Email</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" aria-hidden="true" />
            <input
              required
              id="callback-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="corporate@domain.com"
              autoComplete="email"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="callback-phone" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" aria-hidden="true" />
            <input
              required
              id="callback-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+971 -- --- ----"
              autoComplete="tel"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="callback-time" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preferred Time Window</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" aria-hidden="true" />
            <select
              required
              id="callback-time"
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
            >
              <option value="">Select slot...</option>
              <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
              <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM - 5 PM)</option>
              <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
            </select>
          </div>
        </div>

        <div className="flex items-start gap-3 py-2">
          <input
            required
            id="callbackConsent"
            name="consentGiven"
            type="checkbox"
            checked={formData.consentGiven}
            onChange={handleChange}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="callbackConsent" className="text-[10px] text-gray-400 leading-tight select-none cursor-pointer">
            I agree to be contacted for business purposes and accept the privacy terms (GCC/GDPR).
          </label>
        </div>

        <button
          disabled={status === "submitting" || status === "success"}
          type="submit"
          className="w-full bg-slate-900 border border-slate-800 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {status === "submitting" ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : status === "success" ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" aria-hidden="true" />
              Slot Scheduled
            </>
          ) : (
            "Request Callback"
          )}
        </button>

        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              role="alert"
              className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-600 text-[10px] font-bold"
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
