"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, User, ChevronDown, Check, Mail, Link2 } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { supabase } from "@/lib/supabaseClient";
import { getStaticBlogBySlug } from "@/data/blogsData";
import ReactMarkdown from "react-markdown";


export default function BlogPostClient() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug;

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeSectionId, setActiveSectionId] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [scrollDirection, setScrollDirection] = useState("up");
    const [copied, setCopied] = useState(false);

    // Fetch blog post – static first, then Supabase fallback
    useEffect(() => {
        const fetchBlogPost = async () => {
            try {
                setLoading(true);

                // 1. Check static data first
                const staticBlog = getStaticBlogBySlug(slug);
                if (staticBlog) {
                    setBlog(staticBlog);
                    if (staticBlog.sections?.length > 0) {
                        setActiveSectionId("section-0");
                    }
                    return;
                }

                // 2. Fall back to Supabase for DB-backed posts
                const { data, error: fetchError } = await supabase
                    .from("blogs")
                    .select("*")
                    .eq("slug", slug)
                    .single();

                if (fetchError) {
                    throw fetchError;
                }

                if (!data) {
                    throw new Error("Post not found");
                }

                setBlog(data);

                // Set initial active section
                if (data.sections && data.sections.length > 0) {
                    setActiveSectionId("section-0");
                }
            } catch (err) {
                console.error("Error fetching blog post:", err.message);
                setError(err.message || "Could not load the requested article.");
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchBlogPost();
        }
    }, [slug]);


    // Scroll Direction Tracking (to adjust mobile sticky TOC bar relative to sliding Navbar)
    useEffect(() => {
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY <= 10) {
                setScrollDirection("up");
                return;
            }
            if (currentScrollY - lastScrollY > 10) {
                setScrollDirection("down");
            } else if (currentScrollY - lastScrollY < -10) {
                setScrollDirection("up");
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // IntersectionObserver Scroll Spy
    useEffect(() => {
        if (!blog?.sections?.length) return;

        const handleScroll = () => {
            const headings = document.querySelectorAll("h2[id^='section-']");

            const OFFSET =
                window.innerWidth >= 1024
                    ? window.innerHeight * 0.25 // 25% down the screen
                    : 170;

            let active = "section-0";

            headings.forEach((heading) => {
                const rect = heading.getBoundingClientRect();

                if (rect.top <= OFFSET) {
                    active = heading.id;
                }
            });

            setActiveSectionId((prev) =>
                prev === active ? prev : active
            );
        };

        handleScroll();

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () =>
            window.removeEventListener("scroll", handleScroll);
    }, [blog]);

    // Scroll helper with exact offset for sticky header components
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = window.innerWidth >= 1024 ? 100 : 130;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });
        }
    };

    const getShareUrl = () => window.location.href;

    // Copy Share Link
    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(getShareUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Share via Email
    const handleShareEmail = () => {
        if (typeof window === "undefined") return;
        const subject = encodeURIComponent(blog?.title || "Check out this article");
        const body = encodeURIComponent(getShareUrl());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    // Share on WhatsApp
    const handleShareWhatsApp = () => {
        if (typeof window === "undefined") return;
        const text = encodeURIComponent(getShareUrl());
        window.open(
            `https://wa.me/?text=${text}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    // Share on LinkedIn
    const handleShareLinkedIn = () => {
        if (typeof window === "undefined") return;
        const text = encodeURIComponent(getShareUrl());
        window.open(
            `https://www.linkedin.com/feed/?shareActive=true&text=${text}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex flex-col font-sans">
                <Navbar />
                <div className="flex-grow flex items-center justify-center py-40">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex flex-col font-sans">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center py-40 px-6 text-center">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                        Article Not Found
                    </h1>
                    <p className="text-slate-500 dark:text-neutral-400 mb-8 max-w-md">
                        The article you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-md"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Blogs
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const sections = blog.sections || [];
    const activeSectionIndex = parseInt(activeSectionId.replace("section-", "")) || 0;
    const activeHeadingName = sections[activeSectionIndex]?.heading;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
            <Navbar />

            {/* Header / Hero Section */}
            <header className="w-full max-w-7xl mx-auto px-6 pt-12 md:pt-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-12 md:border-b md:border-slate-200 md:dark:border-neutral-800">

                    {/* Left: Meta Details */}
                    <div className="lg:col-span-6 flex flex-col justify-center space-y-4 lg:pl-4">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-500 transition-colors mb-2 self-start"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Blogs
                        </Link>
                        <p className="text-2xl md:text-2xl font-black ">
                            {blog.title}
                        </p>
                        <div className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-neutral-850 mt-6 text-slate-500 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Author</span>
                                    <span className=" text-slate-800 text-sm">{blog.author}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Published</span>
                                    <span className="font-semibold text-slate-800 text-sm">
                                        {new Date(blog.publish_date).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Share Section */}
                        <div className="flex items-center gap-4 pt-2">
                            <span className="text-sm font-bold text-slate-500 dark:text-neutral-400">
                                Share:
                            </span>
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={handleShareEmail}
                                    aria-label="Share via Email"
                                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-600 dark:bg-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleShareWhatsApp}
                                    aria-label="Share on WhatsApp"
                                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-600 dark:bg-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                        <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.909.532 3.694 1.455 5.215L2 22l4.918-1.397A9.955 9.955 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.093a8.05 8.05 0 0 1-4.116-1.128l-.295-.176-3.03.86.826-2.995-.192-.307A8.05 8.05 0 1 1 20.05 12a8.06 8.06 0 0 1-8.049 8.093z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleShareLinkedIn}
                                    aria-label="Share on LinkedIn"
                                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-600 dark:bg-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.56V9h3.554v11.452z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleShare}
                                    aria-label="Copy link"
                                    className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-600 dark:bg-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Cover Image */}
                    <div className="lg:col-span-6 flex justify-center">
                        <div className="inline-flex rounded-none overflow-hidden shadow-lg bg-neutral-100">
                            <img
                                src={blog.cover_image}
                                alt={blog.title}
                                className="block max-h-[250px] md:max-h-[400px] w-auto object-contain rounded-none"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sticky TOC Dropdown Bar */}
            <div className={`lg:hidden sticky z-40 transition-all duration-300 ${scrollDirection === 'down' ? 'top-0' : 'top-[64px]'} border-b border-slate-200 dark:border-neutral-850 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-sm`}>
                <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex justify-between items-center text-sm font-bold text-slate-800 dark:text-white cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-blue-500 font-semibold">📑</span>
                            {activeHeadingName || "Table of Contents"}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 dark:border-neutral-850 shadow-xl overflow-hidden py-3 z-50 flex flex-col gap-1 max-h-[300px] overflow-y-auto"
                            >
                                {sections.map((sec, idx) => {
                                    const targetId = `section-${idx}`;
                                    const isActive = activeSectionId === targetId;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                scrollToSection(targetId);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`flex items-center justify-between px-6 py-2.5 text-left text-sm transition-colors cursor-pointer ${isActive
                                                ? "text-blue-500 bg-blue-50/50 dark:bg-blue-900/10 font-semibold"
                                                : "text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-neutral-800"
                                                }`}
                                        >
                                            <span>{sec.heading}</span>
                                            {isActive && <Check className="w-4 h-4 text-blue-500" />}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Content & TOC Grid */}
            <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Sticky Sidebar (Desktop only) */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-28 space-y-6">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Table of Contents
                            </h3>
                            <ul className="relative border-l border-slate-300 ml-2">
                                {sections.map((sec, idx) => {
                                    const targetId = `section-${idx}`;
                                    const isActive = activeSectionId === targetId;

                                    return (
                                        <li key={idx} className="relative">
                                            <button
                                                onClick={() => scrollToSection(targetId)}
                                                className={`relative w-full pl-6 pr-2 py-4 text-left transition-colors duration-200 ${isActive
                                                    ? "text-blue-600 font-semibold"
                                                    : "text-slate-700 hover:text-slate-900"
                                                    }`}
                                            >
                                                {isActive && (
                                                    <motion.span
                                                        layoutId="toc-indicator"
                                                        className="absolute left-[-2px] top-0 h-full w-[3px] rounded-full bg-blue-500"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 450,
                                                            damping: 35,
                                                        }}
                                                    />
                                                )}

                                                {sec.heading}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </aside>

                    {/* Right Main Article Content */}
                    <div className="lg:col-span-9 space-y-12">
                        {sections.map((sec, idx) => (
                            <section key={idx} className="space-y-4 border-b border-slate-100 pb-8 last:border-none last:pb-0">
                                <p
                                    id={`section-${idx}`}
                                    className="text-2xl md:text-2xl font-semibold scroll-mt-28 pt-2"
                                >
                                    {sec.heading}
                                </p>
                                <div className="text-slate-655 dark:text-neutral-350 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-light [&_strong]:font-bold">
                                    <ReactMarkdown>{sec.content}</ReactMarkdown>
                                </div>
                                {sec.image && (
                                    <div className="my-6 space-y-2">
                                        <div className="flex justify-center">
                                            <div className="inline-flex rounded-none overflow-hidden border border-slate-200 shadow-md bg-neutral-100 p-2.5">
                                                <img
                                                    src={sec.image}
                                                    alt={sec.caption || sec.heading}
                                                    className="block max-h-[350px] w-auto object-contain rounded-none"
                                                />
                                            </div>
                                        </div>
                                        {sec.caption && (
                                            <p className="text-center text-xs md:text-sm text-slate-500 dark:text-neutral-450 font-light">
                                                {sec.caption}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </div>
                {/* Author Section - Outside Grid */}
                <div className="lg:ml-[25%] lg:w-[75%] mt-12">
                    <div className="border-t border-slate-200 pt-8">
                        <div className="flex flex-wrap items-center gap-8">
                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">
                                        Author
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                        {blog.author}
                                    </p>
                                </div>
                            </div>


                            {/* Published */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">
                                        Published
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                        {new Date(blog.publish_date).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main >
            <Footer />
        </div >
    );
}

