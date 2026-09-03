import React from "react";
import {
  SkeletonNavbar,
  SkeletonBlogCard,
  SkeletonFooter,
  Shimmer,
} from "@/components/skeletons/SkeletonPrimitives";

export default function BlogLoading() {
  return (
    <div className="relative w-full bg-slate-50 dark:bg-neutral-950 pb-0 overflow-hidden min-h-screen flex flex-col">
      {/* Navbar skeleton */}
      <SkeletonNavbar />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12 md:py-20 mt-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-200 dark:border-neutral-850 pb-8 mb-12 gap-6">
          <div className="space-y-3 flex-grow max-w-2xl">
            <Shimmer className="h-4 w-28 bg-blue-100 dark:bg-blue-900/30" rounded="rounded-full" />
            <Shimmer className="h-8 md:h-12 w-3/5" rounded="rounded-xl" />
            <Shimmer className="h-5 w-full" rounded="rounded-lg" />
            <Shimmer className="h-5 w-4/5" rounded="rounded-lg" />
          </div>

          <Shimmer className="h-12 w-40 flex-shrink-0" rounded="rounded-2xl" />
        </div>

        {/* Shimmering blog cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <SkeletonBlogCard />
          <SkeletonBlogCard />
          <SkeletonBlogCard />
          <SkeletonBlogCard />
          <SkeletonBlogCard />
          <SkeletonBlogCard />
        </div>
      </main>

      {/* Footer skeleton */}
      <SkeletonFooter />
    </div>
  );
}
