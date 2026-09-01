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

export default function JobListingSection() {
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
        <div className="flex flex-col gap-7 w-full lg:w-[324px] shrink-0">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[18px] text-black">Filters</span>
                    <button
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className="flex items-center gap-1.5 text-[12px] text-black transition-opacity hover:opacity-70 disabled:opacity-40"
                    >
                        Clear filters
                        <Image src={clearFilterIcon} alt="" width={16} height={16} />
                    </button>
                </div>
                <div className="h-px w-full bg-[#e5e5e5]" />
            </div>

            <label className="flex items-center gap-2.5 h-[30px] border-[0.5px] border-[#7f7f7f] px-[10px]">
                <Image src={searchIcon} alt="" width={14} height={14} />
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search Area of Interest"
                    className="w-full bg-transparent text-[10px] font-thin text-[#6c6c6c] outline-none placeholder:text-[#6c6c6c]"
                />
            </label>

            <div className="flex flex-col gap-3">
                <span className="text-[16px] text-black">Area of Interest</span>
                <div className="flex flex-col">
                    {AREA_OF_INTEREST.map((category) => {
                        const count = categoryCounts[category];
                        const disabled = count === 0;
                        return (
                            <label
                                key={category}
                                className={`flex items-center gap-2.5 h-10 px-2.5 text-[14px] text-black transition-colors ${disabled ? "opacity-40" : "cursor-pointer hover:bg-black/[0.02]"
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
                                <span className="text-black font-light">{count}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <section id="job-listings" className="w-full py-16 sm:pb-10 sm:pt-5 scroll-mt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-8"
            >
                <p className="text-lg text-black">Join our Team</p>
                <h2 className="text-2xl sm:text-3xl font-medium text-black mt-1">Explore Opportunities</h2>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="relative w-full bg-[#f3f3f3] shadow-[0px_1px_30.9px_rgba(0,0,0,0.14)] px-10 sm:px-40 py-8"
            >
                <div aria-hidden className="hidden lg:block absolute top-2 bottom-2 right-2 w-[6px] rounded-full bg-[#d7d7d7]">
                    <div className="w-full h-2/3 rounded-full bg-[#c5c2c2] shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)]" />
                </div>

                <button
                    type="button"
                    onClick={() => setFiltersOpen((prev) => !prev)}
                    className="lg:hidden flex items-center justify-between w-full border border-[#a9a9a9] px-4 py-2.5 mb-4 text-sm text-[#5c5c5c] bg-white"
                >
                    Filters
                    <span>{filtersOpen ? "−" : "+"}</span>
                </button>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 lg:pr-4">
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

                    <div className="hidden lg:block w-px bg-[#ddd]" />

                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
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
                                        whileHover={{ scale: 1.015 }}
                                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-l-4 border-transparent px-5 py-4 transition-all duration-300 hover:border-[#2d8ec5] hover:shadow-[1px_3px_12px_rgba(0,0,0,0.18)]"
                                    >
                                        <div>
                                            <p className="text-[16px] text-black">{job.title}</p>
                                            <p className="text-[14px] font-light text-[#6c6c6c] mt-1">
                                                {job.location} | {job.typeOfWork} | Experience: {job.experienceLevel}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/careers/${job.slug}`}
                                            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-[#7f7f7f] px-4 py-2 text-sm text-[#2d8ec5]"
                                        >
                                            <Image src={viewJobDetailsIcon} alt="" width={13} height={13} />
                                            View Details
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
                                        className={`flex items-center justify-center size-6 rounded text-sm font-semibold transition-colors ${pageNumber === page
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
            </motion.div>
        </section>
    );
}
