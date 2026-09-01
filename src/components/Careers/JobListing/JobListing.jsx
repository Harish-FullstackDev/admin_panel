"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import searchIcon from "@/assets/career/icons/Search Icon.svg";
import clearFilterIcon from "@/assets/career/icons/Clear filter.svg";
import prevPageIcon from "@/assets/career/icons/previous page toggle.svg";
import nextPageIcon from "@/assets/career/icons/Next page toggle arrow.svg";
import viewJobDetailsIcon from "@/assets/career/icons/view job details.svg";
import { jobs } from "@/components/Constants/Career/jobsData";
import { AREA_OF_INTEREST } from "@/components/Constants/Career/filterCategories";

const PAGE_SIZE = 6;

export default function JobListing() {
    const [search, setSearch] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const categoryCounts = useMemo(() => {
        const counts = {};
        AREA_OF_INTEREST.forEach((category) => {
            counts[category] = jobs.filter((job) => job.categories.includes(category)).length;
        });
        return counts;
    }, []);

    const filteredJobs = useMemo(() => {
        const query = search.trim().toLowerCase();
        return jobs.filter((job) => {
            const matchesSearch =
                !query ||
                job.location.toLowerCase().includes(query) ||
                job.title.toLowerCase().includes(query);
            const matchesCategory =
                selectedCategories.length === 0 ||
                job.categories.some((category) => selectedCategories.includes(category));
            return matchesSearch && matchesCategory;
        });
    }, [search, selectedCategories]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
    const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [search, selectedCategories]);

    const toggleCategory = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
        );
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedCategories([]);
    };

    const hasActiveFilters = search !== "" || selectedCategories.length > 0;

    const sidebar = (
        <div className="flex flex-col gap-7 w-full lg:w-[280px] shrink-0">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5c5c5c]">Filters</span>
                    <button
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className="flex items-center gap-1.5 text-xs text-[#5c5c5c] transition-opacity hover:opacity-70 disabled:opacity-40"
                    >
                        Clear filters
                        <Image src={clearFilterIcon} alt="" width={16} height={16} />
                    </button>
                </div>
                <div className="h-px w-full bg-[#e5e5e5]" />
            </div>

            <label className="flex items-center gap-2 border border-[#a9a9a9] px-3 py-2.5">
                <Image src={searchIcon} alt="" width={17} height={17} />
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search locations"
                    className="w-full bg-transparent text-sm text-[#5c5c5c] outline-none placeholder:text-[#5c5c5c]"
                />
            </label>

            <div className="flex flex-col gap-3">
                <span className="text-xs text-[#5c5c5c]">Area of Interest</span>
                <div className="flex flex-col">
                    {AREA_OF_INTEREST.map((category) => {
                        const count = categoryCounts[category];
                        const disabled = count === 0;
                        return (
                            <label
                                key={category}
                                className={`flex items-center gap-2.5 px-2 py-2.5 text-xs text-[#5c5c5c] transition-colors ${
                                    disabled ? "opacity-40" : "cursor-pointer hover:bg-black/[0.02]"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => toggleCategory(category)}
                                    disabled={disabled}
                                    className="size-3.5 accent-[#2d8ec5]"
                                />
                                <span className="flex-1">{category}</span>
                                <span className="text-[#5d5d5c]">{count}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className="lg:hidden flex items-center justify-between w-full border border-[#a9a9a9] px-4 py-2.5 mb-4 text-sm text-[#5c5c5c]"
            >
                Filters
                <span>{filtersOpen ? "−" : "+"}</span>
            </button>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                <AnimatePresence initial={false}>
                    {filtersOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden lg:hidden"
                        >
                            {sidebar}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="hidden lg:block">{sidebar}</div>

                <div className="hidden lg:block w-px bg-[#ebebeb]" />

                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        {paginatedJobs.length === 0 ? (
                            <p className="text-sm text-[#5c5c5c] py-10 text-center">
                                No open positions match your filters right now.
                            </p>
                        ) : (
                            paginatedJobs.map((job, index) => (
                                <motion.div
                                    key={job.slug}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                                    className="flex items-center justify-between gap-4 border-l-4 border-[#2d8ec5] px-4 py-4"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-[#0a0a0a]">{job.title}</p>
                                        <p className="text-xs font-light text-[#5c5c5c] mt-1">
                                            {job.location} | {job.typeOfWork} | Experience: {job.experienceLevel}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/careers/${job.slug}`}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-[#7f7f7f] px-3 py-1.5 text-xs text-[#2d8ec5] whitespace-nowrap transition-colors hover:bg-[#2d8ec5] hover:text-white hover:border-[#2d8ec5]"
                                    >
                                        View Job Details
                                        <Image src={viewJobDetailsIcon} alt="" width={8} height={8} />
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="flex items-center justify-center size-6 disabled:opacity-30"
                                aria-label="Previous page"
                            >
                                <Image src={prevPageIcon} alt="" width={20} height={20} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    onClick={() => setPage(pageNumber)}
                                    className={`flex items-center justify-center size-6 rounded text-sm font-semibold transition-colors ${
                                        pageNumber === page
                                            ? "border border-[#2d8ec5] text-[#2d8ec5]"
                                            : "text-black opacity-50 hover:opacity-80"
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="flex items-center justify-center size-6 disabled:opacity-30"
                                aria-label="Next page"
                            >
                                <Image src={nextPageIcon} alt="" width={20} height={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
