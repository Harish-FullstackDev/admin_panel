import React from "react";
import {
  SkeletonNavbar,
  SkeletonHeroDark,
  SkeletonLogoStrip,
  SkeletonSectionHeading,
  SkeletonFeatureCard,
  SkeletonSplitSection,
  SkeletonTestimonialCard,
  SkeletonFAQRow,
  SkeletonFooter,
  Shimmer,
} from "@/components/skeletons/SkeletonPrimitives";

export default function Loading() {
  return (
    <div className="relative w-full bg-white overflow-hidden min-h-screen">
      {/* Navbar skeleton */}
      <SkeletonNavbar />

      {/* Hero Section Container (matches src/app/page.jsx dark/gradient layout) */}
      <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0">
        <div className="flex min-h-screen items-center justify-center px-4 sm:px-8 lg:px-16 pt-20">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-center gap-10">
            {/* Left Content column */}
            <div className="flex-1 flex flex-col items-start justify-center py-8 md:py-0 text-center md:text-left gap-5">
              <Shimmer className="h-4 w-32 bg-slate-700" rounded="rounded-full" />
              <Shimmer className="h-10 w-full max-w-md bg-slate-700" rounded="rounded-xl" />
              <Shimmer className="h-10 w-4/5 max-w-sm bg-slate-700" rounded="rounded-xl" />
              <Shimmer className="h-5 w-full max-w-lg bg-slate-700 mt-2" rounded="rounded-md" />
              <Shimmer className="h-5 w-5/6 max-w-md bg-slate-700" rounded="rounded-md" />
            </div>

            {/* Right Meeting Card column */}
            <div className="flex-1 flex justify-center items-center w-full max-w-md">
              <div className="w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <Shimmer className="h-12 w-12 bg-slate-700" rounded="rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Shimmer className="h-4 w-32 bg-slate-700" rounded="rounded-md" />
                    <Shimmer className="h-3 w-20 bg-slate-700" rounded="rounded-md" />
                  </div>
                </div>
                <div className="border-t border-slate-700 my-2" />
                <Shimmer className="h-4 w-full bg-slate-700" rounded="rounded-md" />
                <Shimmer className="h-4 w-5/6 bg-slate-700" rounded="rounded-md" />
                <div className="flex flex-col gap-3 mt-2">
                  <Shimmer className="h-10 w-full bg-slate-700" rounded="rounded-xl" />
                  <Shimmer className="h-10 w-full bg-slate-700" rounded="rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee Partner Logos */}
      <SkeletonLogoStrip />

      {/* Our Solutions Section Grid */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <SkeletonSectionHeading />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <SkeletonFeatureCard />
          <SkeletonFeatureCard />
          <SkeletonFeatureCard />
          <SkeletonFeatureCard />
          <SkeletonFeatureCard />
          <SkeletonFeatureCard />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SkeletonSectionHeading />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col gap-3 shadow-sm">
                <Shimmer className="h-10 w-10" rounded="rounded-xl" />
                <Shimmer className="h-5 w-24" rounded="rounded-md" />
                <Shimmer className="h-3.5 w-full" rounded="rounded-md" />
                <Shimmer className="h-3.5 w-4/5" rounded="rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are Split Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <SkeletonSplitSection imageRight={false} />
      </section>

      {/* Our Projects / Case Studies Grid */}
      <section className="py-20 px-6 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SkeletonSectionHeading />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex flex-col">
                <Shimmer className="h-64 w-full" rounded="rounded-none" />
                <div className="p-6 flex flex-col gap-3">
                  <Shimmer className="h-3.5 w-20" rounded="rounded-full" />
                  <Shimmer className="h-6 w-3/4" rounded="rounded-md" />
                  <Shimmer className="h-4 w-full" rounded="rounded-md" />
                  <Shimmer className="h-4 w-5/6" rounded="rounded-md" />
                  <Shimmer className="h-9 w-28 mt-2" rounded="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Timeline */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <SkeletonSectionHeading />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col gap-3">
              <Shimmer className="h-10 w-10" rounded="rounded-full" />
              <Shimmer className="h-5 w-32" rounded="rounded-md" />
              <Shimmer className="h-4 w-full" rounded="rounded-md" />
              <Shimmer className="h-4 w-3/4" rounded="rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SkeletonSectionHeading />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            <SkeletonTestimonialCard />
            <SkeletonTestimonialCard />
            <SkeletonTestimonialCard />
          </div>
        </div>
      </section>

      {/* FAQ Accordion block */}
      <section className="py-20 px-6 md:px-12 max-w-4xl mx-auto">
        <SkeletonSectionHeading />
        <div className="flex flex-col gap-4 mt-8">
          <SkeletonFAQRow />
          <SkeletonFAQRow />
          <SkeletonFAQRow />
          <SkeletonFAQRow />
          <SkeletonFAQRow />
        </div>
      </section>

      {/* Footer skeleton */}
      <SkeletonFooter />
    </div>
  );
}
