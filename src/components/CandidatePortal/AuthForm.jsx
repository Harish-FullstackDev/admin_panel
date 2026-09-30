"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { candidateSupabase } from "@/lib/candidateSupabase";
import { safeRedirect } from "./useCandidateSession";

const inputClass =
  "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup && !fullName.trim()) return setError("Please enter your full name.");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const { data, error: authError } = isSignup
        ? await candidateSupabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName.trim() } },
          })
        : await candidateSupabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;
      if (!data.session) {
        throw new Error(
          "Account created, but sign-in is pending email confirmation. Please contact the recruiting team."
        );
      }
      router.replace(redirect);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const otherHref = `${isSignup ? "/candidate/login" : "/candidate/signup"}?redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          {isSignup ? "Apply to jobs and track your applications." : "Sign in to continue to Ascendus Careers."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isSignup && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              aria-label="Full name"
              className={inputClass}
            />
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            aria-label="Email address"
            className={inputClass}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            aria-label="Password"
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isSignup ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={otherHref} className="font-semibold text-brand-teal-600 hover:underline">
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
