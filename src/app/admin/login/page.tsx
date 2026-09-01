"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation and process errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    // Show session expired notification if redirected from middleware
    if (searchParams.get("reason") === "session_expired") {
      setNotice("Your administrative session has expired. Please sign in again.");
    }
  }, [searchParams]);

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setApiError("");

    if (!email) {
      setEmailError("Email address is required.");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      isValid = false;
    }

    return isValid;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError("");
    setNotice("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        // Securely write the access token into the administrative session cookie
        const maxAge = data.session.expires_in;
        document.cookie = `sst_admin_session=${data.session.access_token}; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
        
        // Redirect to admin blog inventory dashboard
        router.push("/admin/dashboard/blogs");
      } else {
        throw new Error("Failed to initialize session. Please check your credentials.");
      }
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      setApiError(err.message || "Invalid administrative email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xl relative z-10 hover:shadow-2xl transition-all duration-300">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
          Support Studio <span className="text-brand-teal-500">Technologies</span>
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-2">
          Administrative Access Control Center
        </p>
      </div>

      {notice && (
        <div className="mb-6 p-4 bg-brand-teal-50/80 border border-brand-teal-200/60 rounded-2xl text-brand-teal-700 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-brand-teal-500" />
          <span>{notice}</span>
        </div>
      )}

      {apiError && (
        <div className="mb-6 p-4 bg-red-50/80 border border-red-200/60 rounded-2xl text-red-600 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Admin Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              placeholder="admin@supportstudio.tech"
              className={`w-full pl-12 pr-4 py-3 rounded-2xl border bg-slate-50/50 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all text-xs ${
                emailError ? "border-red-500" : "border-slate-200"
              }`}
            />
          </div>
          {emailError && (
            <p className="text-red-500 text-xs mt-1.5 pl-1">{emailError}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Secure Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder="••••••••••••"
              className={`w-full pl-12 pr-12 py-3 rounded-2xl border bg-slate-50/50 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all text-xs ${
                passwordError ? "border-red-500" : "border-slate-200"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && (
            <p className="text-red-500 text-xs mt-1.5 pl-1">{passwordError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-brand-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-xs tracking-wide uppercase"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Authenticate Session"
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-80 h-80 rounded-full bg-brand-teal-500/5 blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
