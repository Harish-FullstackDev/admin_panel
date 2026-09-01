/**
 * SkeletonPrimitives.tsx
 * Primitive skeleton atoms — zero dependencies beyond React & Tailwind CSS.
 * Every page-level loading.tsx imports from here.
 */

import React from "react";

// ─── SHIMMER BASE ──────────────────────────────────────────────────────────────
/**
 * A single shimmering block. Pass width/height via className.
 */
export function Shimmer({
  className = "",
  rounded = "rounded-xl",
  style,
}: {
  className?: string;
  rounded?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${rounded} ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

// ─── SKELETON NAVBAR ──────────────────────────────────────────────────────────
export function SkeletonNavbar() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6 md:px-12 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm"
      aria-hidden="true"
    >
      {/* Logo */}
      <Shimmer className="h-8 w-32" rounded="rounded-lg" />
      {/* Nav links (desktop) */}
      <div className="hidden md:flex items-center gap-6">
        <Shimmer className="h-4 w-16" rounded="rounded-md" />
        <Shimmer className="h-4 w-20" rounded="rounded-md" />
        <Shimmer className="h-4 w-18" rounded="rounded-md" />
        <Shimmer className="h-4 w-16" rounded="rounded-md" />
        <Shimmer className="h-4 w-20" rounded="rounded-md" />
      </div>
      {/* CTA button */}
      <Shimmer className="h-9 w-36" rounded="rounded-full" />
    </div>
  );
}

// ─── SKELETON FOOTER ──────────────────────────────────────────────────────────
export function SkeletonFooter() {
  return (
    <div
      className="w-full bg-slate-900 px-6 md:px-16 py-14 mt-0"
      aria-hidden="true"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <Shimmer className="h-8 w-28 bg-slate-700" rounded="rounded-lg" />
          <Shimmer className="h-3 w-full bg-slate-700" rounded="rounded-md" />
          <Shimmer className="h-3 w-4/5 bg-slate-700" rounded="rounded-md" />
          <Shimmer className="h-3 w-3/5 bg-slate-700" rounded="rounded-md" />
          <div className="flex gap-3 mt-2">
            <Shimmer className="h-8 w-8 bg-slate-700" rounded="rounded-full" />
            <Shimmer className="h-8 w-8 bg-slate-700" rounded="rounded-full" />
            <Shimmer className="h-8 w-8 bg-slate-700" rounded="rounded-full" />
            <Shimmer className="h-8 w-8 bg-slate-700" rounded="rounded-full" />
          </div>
        </div>
        {/* Link columns */}
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex flex-col gap-3">
            <Shimmer className="h-4 w-24 bg-slate-700 mb-2" rounded="rounded-md" />
            <Shimmer className="h-3 w-28 bg-slate-700" rounded="rounded-md" />
            <Shimmer className="h-3 w-24 bg-slate-700" rounded="rounded-md" />
            <Shimmer className="h-3 w-32 bg-slate-700" rounded="rounded-md" />
            <Shimmer className="h-3 w-20 bg-slate-700" rounded="rounded-md" />
            <Shimmer className="h-3 w-28 bg-slate-700" rounded="rounded-md" />
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-700 flex flex-col md:flex-row justify-between gap-4">
        <Shimmer className="h-3 w-64 bg-slate-700" rounded="rounded-md" />
        <Shimmer className="h-3 w-48 bg-slate-700" rounded="rounded-md" />
      </div>
    </div>
  );
}

// ─── HERO SKELETON (dark gradient bg) ─────────────────────────────────────────
export function SkeletonHeroDark() {
  return (
    <div
      className="relative h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col"
      aria-hidden="true"
    >
      {/* Decorative orbs */}
      <div className="absolute top-24 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute bottom-24 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
      {/* Content */}
      <div className="flex flex-1 items-center px-6 md:px-16 lg:px-24">
        <div className="flex flex-col gap-5 max-w-2xl">
          <Shimmer className="h-4 w-32 bg-slate-700" rounded="rounded-full" />
          <Shimmer className="h-12 w-full bg-slate-700" rounded="rounded-2xl" />
          <Shimmer className="h-12 w-4/5 bg-slate-700" rounded="rounded-2xl" />
          <Shimmer className="h-12 w-3/5 bg-slate-700" rounded="rounded-2xl" />
          <Shimmer className="h-5 w-full bg-slate-700 mt-2" rounded="rounded-lg" />
          <Shimmer className="h-5 w-4/5 bg-slate-700" rounded="rounded-lg" />
          <div className="flex gap-4 mt-4">
            <Shimmer className="h-12 w-40 bg-slate-700" rounded="rounded-full" />
            <Shimmer className="h-12 w-36 bg-slate-700" rounded="rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HERO SKELETON (white/light bg) ───────────────────────────────────────────
export function SkeletonHeroLight({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`w-full ${tall ? "h-[480px]" : "h-72 md:h-96"} bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden relative`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
        <Shimmer className="h-4 w-28" rounded="rounded-full" />
        <Shimmer className="h-10 w-72 md:w-[520px]" rounded="rounded-2xl" />
        <Shimmer className="h-10 w-56 md:w-80" rounded="rounded-2xl" />
        <Shimmer className="h-5 w-80 md:w-[440px]" rounded="rounded-lg" />
        <Shimmer className="h-5 w-60 md:w-80" rounded="rounded-lg" />
      </div>
    </div>
  );
}

// ─── SECTION HEADING BLOCK ────────────────────────────────────────────────────
export function SkeletonSectionHeading({ centered = true }: { centered?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-3 ${centered ? "items-center" : "items-start"} mb-10`}
      aria-hidden="true"
    >
      <Shimmer className="h-3 w-24" rounded="rounded-full" />
      <Shimmer className="h-9 w-72 md:w-96" rounded="rounded-xl" />
      <Shimmer className="h-5 w-60 md:w-[420px]" rounded="rounded-lg" />
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function SkeletonStatCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3"
      aria-hidden="true"
    >
      <Shimmer className="h-10 w-10" rounded="rounded-xl" />
      <Shimmer className="h-8 w-24" rounded="rounded-lg" />
      <Shimmer className="h-4 w-32" rounded="rounded-md" />
      <Shimmer className="h-3 w-28" rounded="rounded-md" />
    </div>
  );
}

// ─── BLOG CARD ────────────────────────────────────────────────────────────────
export function SkeletonBlogCard() {
  return (
    <div
      className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden flex flex-col"
      aria-hidden="true"
    >
      {/* Thumbnail */}
      <Shimmer className="h-56 w-full" rounded="rounded-none" />
      {/* Body */}
      <div className="p-6 flex flex-col gap-3">
        <Shimmer className="h-3 w-20" rounded="rounded-full" />
        <Shimmer className="h-6 w-full" rounded="rounded-lg" />
        <Shimmer className="h-6 w-4/5" rounded="rounded-lg" />
        <Shimmer className="h-4 w-full mt-2" rounded="rounded-md" />
        <Shimmer className="h-4 w-3/4" rounded="rounded-md" />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <Shimmer className="h-3 w-24" rounded="rounded-full" />
          <Shimmer className="h-8 w-8" rounded="rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
export function SkeletonServiceCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7 flex flex-col gap-4"
      aria-hidden="true"
    >
      <Shimmer className="h-12 w-12" rounded="rounded-xl" />
      <Shimmer className="h-6 w-3/5" rounded="rounded-lg" />
      <Shimmer className="h-4 w-full" rounded="rounded-md" />
      <Shimmer className="h-4 w-5/6" rounded="rounded-md" />
      <Shimmer className="h-4 w-4/5" rounded="rounded-md" />
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2">
          <Shimmer className="h-3 w-3 flex-shrink-0" rounded="rounded-full" />
          <Shimmer className="h-3 w-36" rounded="rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-3 w-3 flex-shrink-0" rounded="rounded-full" />
          <Shimmer className="h-3 w-28" rounded="rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-3 w-3 flex-shrink-0" rounded="rounded-full" />
          <Shimmer className="h-3 w-32" rounded="rounded-md" />
        </div>
      </div>
      <Shimmer className="h-9 w-32 mt-2" rounded="rounded-full" />
    </div>
  );
}

// ─── TEAM / PERSON CARD ───────────────────────────────────────────────────────
export function SkeletonTeamCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center gap-3"
      aria-hidden="true"
    >
      <Shimmer className="h-24 w-24" rounded="rounded-full" />
      <Shimmer className="h-5 w-32" rounded="rounded-lg" />
      <Shimmer className="h-3 w-24" rounded="rounded-md" />
      <Shimmer className="h-3 w-36" rounded="rounded-md" />
      <div className="flex gap-3 mt-2">
        <Shimmer className="h-7 w-7" rounded="rounded-full" />
        <Shimmer className="h-7 w-7" rounded="rounded-full" />
        <Shimmer className="h-7 w-7" rounded="rounded-full" />
      </div>
    </div>
  );
}

// ─── FORM SKELETON ────────────────────────────────────────────────────────────
export function SkeletonForm({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Shimmer className="h-4 w-28" rounded="rounded-md" />
          <Shimmer className="h-11 w-full" rounded="rounded-xl" />
        </div>
      ))}
      <Shimmer className="h-12 w-40 mt-2" rounded="rounded-full" />
    </div>
  );
}

// ─── TIMELINE / STEP ROW ──────────────────────────────────────────────────────
export function SkeletonTimelineStep() {
  return (
    <div
      className="flex items-start gap-5"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-0">
        <Shimmer className="h-10 w-10 flex-shrink-0" rounded="rounded-full" />
        <div className="w-0.5 h-16 bg-slate-100 mt-1" />
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <Shimmer className="h-5 w-40" rounded="rounded-lg" />
        <Shimmer className="h-4 w-full" rounded="rounded-md" />
        <Shimmer className="h-4 w-4/5" rounded="rounded-md" />
      </div>
    </div>
  );
}

// ─── TESTIMONIAL CARD ─────────────────────────────────────────────────────────
export function SkeletonTestimonialCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7 flex flex-col gap-4"
      aria-hidden="true"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((s) => (
          <Shimmer key={s} className="h-4 w-4" rounded="rounded-sm" />
        ))}
      </div>
      <Shimmer className="h-4 w-full" rounded="rounded-md" />
      <Shimmer className="h-4 w-5/6" rounded="rounded-md" />
      <Shimmer className="h-4 w-4/6" rounded="rounded-md" />
      <div className="flex items-center gap-3 mt-2">
        <Shimmer className="h-10 w-10" rounded="rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Shimmer className="h-4 w-28" rounded="rounded-md" />
          <Shimmer className="h-3 w-20" rounded="rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ─── ACCORDION / FAQ ROW ──────────────────────────────────────────────────────
export function SkeletonFAQRow() {
  return (
    <div
      className="border-b border-slate-100 py-5 flex items-center justify-between gap-4"
      aria-hidden="true"
    >
      <Shimmer className="h-5 w-72 md:w-[480px]" rounded="rounded-lg" />
      <Shimmer className="h-7 w-7 flex-shrink-0" rounded="rounded-full" />
    </div>
  );
}

// ─── MARQUEE / LOGO STRIP ─────────────────────────────────────────────────────
export function SkeletonLogoStrip() {
  return (
    <div
      className="w-full overflow-hidden py-8 bg-white border-y border-slate-100"
      aria-hidden="true"
    >
      <div className="flex items-center gap-12 px-6">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Shimmer
            key={i}
            className="h-10 flex-shrink-0"
            style={{ width: `${60 + (i % 3) * 20}px` } as React.CSSProperties}
            rounded="rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAP / GLOBE PLACEHOLDER ──────────────────────────────────────────────────
export function SkeletonMap() {
  return (
    <div
      className="w-full h-80 md:h-[480px] bg-slate-100 rounded-2xl relative overflow-hidden"
      aria-hidden="true"
    >
      <Shimmer className="absolute inset-0" rounded="rounded-2xl" />
      {/* Fake pulse markers */}
      <div className="absolute top-1/3 left-1/4 h-4 w-4 rounded-full bg-blue-300 opacity-60 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 h-4 w-4 rounded-full bg-blue-300 opacity-60 animate-pulse delay-300" />
      <div className="absolute top-2/5 right-1/3 h-4 w-4 rounded-full bg-blue-300 opacity-60 animate-pulse delay-700" />
    </div>
  );
}

// ─── SECURITY / TRUST BADGE CARD ──────────────────────────────────────────────
export function SkeletonTrustBadge() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center gap-3 text-center"
      aria-hidden="true"
    >
      <Shimmer className="h-14 w-14" rounded="rounded-2xl" />
      <Shimmer className="h-5 w-28" rounded="rounded-lg" />
      <Shimmer className="h-4 w-40" rounded="rounded-md" />
      <Shimmer className="h-4 w-36" rounded="rounded-md" />
    </div>
  );
}

// ─── JOB LISTING ROW ──────────────────────────────────────────────────────────
export function SkeletonJobRow() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      aria-hidden="true"
    >
      <div className="flex items-center gap-4">
        <Shimmer className="h-12 w-12 flex-shrink-0" rounded="rounded-xl" />
        <div className="flex flex-col gap-2">
          <Shimmer className="h-5 w-48" rounded="rounded-lg" />
          <div className="flex gap-2">
            <Shimmer className="h-3 w-20" rounded="rounded-full" />
            <Shimmer className="h-3 w-16" rounded="rounded-full" />
            <Shimmer className="h-3 w-24" rounded="rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Shimmer className="h-9 w-24" rounded="rounded-full" />
        <Shimmer className="h-9 w-24" rounded="rounded-full" />
      </div>
    </div>
  );
}

// ─── PARTNERSHIP / PROGRESS STEP ──────────────────────────────────────────────
export function SkeletonProgressStep() {
  return (
    <div
      className="flex flex-col items-center gap-3 text-center"
      aria-hidden="true"
    >
      <div className="relative">
        <Shimmer className="h-16 w-16" rounded="rounded-full" />
      </div>
      <Shimmer className="h-5 w-32" rounded="rounded-lg" />
      <Shimmer className="h-4 w-40" rounded="rounded-md" />
      <Shimmer className="h-4 w-36" rounded="rounded-md" />
    </div>
  );
}

// ─── WIDE IMAGE BANNER ────────────────────────────────────────────────────────
export function SkeletonImageBanner({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={`w-full ${height} overflow-hidden relative`}
      aria-hidden="true"
    >
      <Shimmer className="absolute inset-0" rounded="rounded-2xl" />
    </div>
  );
}

// ─── CTA CONSULTATION CARD ────────────────────────────────────────────────────
export function SkeletonCTACard() {
  return (
    <div
      className="w-full bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-4">
        <Shimmer className="h-8 w-72 md:w-96" rounded="rounded-xl" />
        <Shimmer className="h-5 w-80 md:w-[440px]" rounded="rounded-lg" />
        <Shimmer className="h-5 w-64 md:w-[360px]" rounded="rounded-lg" />
      </div>
      <Shimmer className="h-12 w-48 flex-shrink-0" rounded="rounded-full" />
    </div>
  );
}

// ─── SOLUTION / FEATURE GRID CARD ─────────────────────────────────────────────
export function SkeletonFeatureCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10 flex-shrink-0" rounded="rounded-xl" />
        <Shimmer className="h-5 w-36" rounded="rounded-lg" />
      </div>
      <Shimmer className="h-4 w-full" rounded="rounded-md" />
      <Shimmer className="h-4 w-5/6" rounded="rounded-md" />
    </div>
  );
}

// ─── SPLIT LAYOUT (text | image) ──────────────────────────────────────────────
export function SkeletonSplitSection({ imageRight = true }: { imageRight?: boolean }) {
  const Text = () => (
    <div className="flex flex-col gap-4 flex-1">
      <Shimmer className="h-3 w-20" rounded="rounded-full" />
      <Shimmer className="h-9 w-full max-w-sm" rounded="rounded-xl" />
      <Shimmer className="h-9 w-4/5 max-w-xs" rounded="rounded-xl" />
      <Shimmer className="h-4 w-full" rounded="rounded-md" />
      <Shimmer className="h-4 w-5/6" rounded="rounded-md" />
      <Shimmer className="h-4 w-4/6" rounded="rounded-md" />
      <Shimmer className="h-11 w-36 mt-4" rounded="rounded-full" />
    </div>
  );
  const Img = () => (
    <div className="flex-1">
      <Shimmer className="h-64 md:h-80 w-full" rounded="rounded-2xl" />
    </div>
  );
  return (
    <div className="flex flex-col md:flex-row gap-10 items-center" aria-hidden="true">
      {imageRight ? (
        <>
          <Text />
          <Img />
        </>
      ) : (
        <>
          <Img />
          <Text />
        </>
      )}
    </div>
  );
}
