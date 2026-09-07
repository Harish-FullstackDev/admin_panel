"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function NewsletterSubscriptionForm() {
  const [email, setEmail] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent_given: consentGiven }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Subscription failed.");
      }

      setStatus("success");
      setEmail("");
      setConsentGiven(false);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "A system error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {status === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          role="alert"
          aria-live="polite"
          className="bg-blue-600/10 border border-blue-600/20 p-8 rounded-[2.5rem] text-center"
        >
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Transmission Confirmed</h3>
          <p className="text-slate-400 text-sm">You are now part of the Ascendus Enterprise Network. Expect high-value SAP insights shortly.</p>
          <button 
            onClick={() => setStatus("idle")}
            className="mt-6 text-blue-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
          >
            Register Another Email
          </button>
        </motion.div>
      ) : (
        <form 
          onSubmit={handleSubmit} 
          className="relative group"
          aria-labelledby="newsletter-heading"
        >
          <div className="flex flex-col gap-4">
            <div className="relative">
              <label htmlFor="newsletter-email" className="sr-only">Business Email Address</label>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
                <Mail className="w-5 h-5" />
              </div>
              <input
                required
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enterprise Email Address"
                autoComplete="email"
                className="w-full pl-16 pr-40 py-6 bg-slate-900/50 border border-slate-800 text-white rounded-full focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500 text-lg"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  disabled={status === "submitting"}
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {status === "submitting" ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      <span>Join Network</span>
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 px-6">
              <input
                required
                id="newsletterConsent"
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-800 bg-slate-900 text-blue-500 focus:ring-blue-500/40 cursor-pointer"
              />
              <label htmlFor="newsletterConsent" className="text-[10px] text-slate-500 leading-tight select-none cursor-pointer">
                By subscribing, I consent to receiving technical updates and marketing communications from Ascendus under GCC data laws and EU GDPR protocols.
              </label>
            </div>
          </div>

          <AnimatePresence>
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
}
