"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Calendar, User, ChevronDown, Check } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { supabase } from "@/lib/supabaseClient";

export default function BlogPostDetailPage() {
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

    // Fetch blog post from Supabase
    useEffect(() => {
        const fetchBlogPost = async () => {
            try {
                setLoading(true);
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
        if (!blog || !blog.sections || blog.sections.length === 0) return;

        const headingElements = document.querySelectorAll("h2[id^='section-']");

        const observerCallback = (entries) => {
            const visibleSections = entries
                .filter((entry) => entry.isIntersecting)
                .map((entry) => ({
                    id: entry.target.id,
                    top: entry.boundingClientRect.top,
                }));

            if (visibleSections.length > 0) {
                // Sort by top parameter to find the topmost visible section
                visibleSections.sort((a, b) => a.top - b.top);
                setActiveSectionId(visibleSections[0].id);
            }
        };

        const observer = new IntersectionObserver(observerCallback, {
            rootMargin: "-120px 0px -60% 0px", // triggers when heading crosses upper viewport area
            threshold: [0, 1.0],
        });

        headingElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
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

    // Copy Share Link
    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
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
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4">
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-12 border-b border-slate-200 dark:border-neutral-800">
                    {/* Left: Cover Image */}
                    <div className="lg:col-span-6 flex justify-center">
                        <div className="inline-flex rounded-2xl overflow-hidden shadow-lg bg-neutral-100">
                            <img
                                src={blog.cover_image}
                                alt={blog.title}
                                className="block max-h-[250px] md:max-h-[400px] w-auto object-contain rounded-2xl"
                            />
                        </div>
                    </div>
                    {/* Right: Meta Details */}
                    <div className="lg:col-span-6 flex flex-col justify-center space-y-4 lg:pl-4">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-500 transition-colors mb-2 self-start"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Blogs
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                            {blog.title}
                        </h1>
                        <div className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-neutral-850 mt-6 text-slate-500 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Author</span>
                                    <span className="font-semibold text-slate-800 text-sm">{blog.author}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Published</span>
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
                                            className={`flex items-center justify-between px-6 py-2.5 text-left text-sm font-semibold transition-colors cursor-pointer ${isActive
                                                ? "text-blue-500 bg-blue-50/50 dark:bg-blue-900/10 font-bold"
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
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Table of Contents
                            </h3>
                            <ul className="relative space-y-4 border-l border-slate-200">
                                {sections.map((sec, idx) => {
                                    const targetId = `section-${idx}`;
                                    const isActive = activeSectionId === targetId;
                                    return (
                                        <li key={idx} className="pl-4 -ml-[1px]">
                                            <button
                                                onClick={() => scrollToSection(targetId)}
                                                className={`block text-left text-sm font-semibold transition-all duration-300 border-l-2 pl-4 -ml-[17px] py-1 cursor-pointer w-full ${isActive
                                                    ? "text-blue-500 border-blue-500 font-bold translate-x-1"
                                                    : "text-slate-550 hover:text-slate-805 dark:hover:text-white"
                                                    }`}
                                            >
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
                                <h2
                                    id={`section-${idx}`}
                                    className="text-2xl md:text-3xl font-black text-slate-900 scroll-mt-28 pt-2"
                                >
                                    {sec.heading}
                                </h2>
                                <div className="text-slate-655 dark:text-neutral-350 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-normal">
                                    {sec.content}
                                </div>

                                {sec.image && (
                                    <div className="my-6 space-y-2">
                                        <div className="flex justify-center">
                                            <div className="inline-flex rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-neutral-100 p-2.5">
                                                <img
                                                    src={sec.image}
                                                    alt={sec.caption || sec.heading}
                                                    className="block max-h-[350px] w-auto object-contain rounded-2xl"
                                                />
                                            </div>
                                        </div>
                                        {sec.caption && (
                                            <p className="text-center text-xs md:text-sm text-slate-500 dark:text-neutral-450 italic">
                                                {sec.caption}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>

                </div>
            </main>

            {/* Floating Share Button */}
            <button
                onClick={handleShare}
                className="fixed bottom-6 right-6 z-[45] bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center group cursor-pointer"
                aria-label="Share article"
            >
                <Share2 className="w-5 h-5" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-20 group-hover:ml-2 transition-all duration-300 text-xs font-semibold whitespace-nowrap">
                    {copied ? "Copied!" : "Copy Link"}
                </span>
            </button>

            <Footer />
        </div>
    );
}

