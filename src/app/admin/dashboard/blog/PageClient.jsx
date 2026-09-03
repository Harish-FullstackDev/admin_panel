"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowRight, Calendar, User, Image as ImageIcon, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ContentHeader from "@/components/CommonComponents/ContentHeader";
// import backgroundImage from "../../../../public/blog/land.jpg";
import backgroundImage from "@/assets/Insights/Blogs.jpg";
import { supabase } from "@/lib/supabaseClient";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import AuthorsSection from "@/components/blog/author";
import Hero from "@/components/blog/Hero";
import HeroText from "@/components/blog/HeroText";
import { staticBlogsData } from "@/data/blogsData";

export default function BlogPage() {
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState(null);

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [publishDate, setPublishDate] = useState("");
    const [sections, setSections] = useState([
        { id: 1, heading: "", content: "", showImage: false, imageFile: null, imagePreview: null, caption: "" }
    ]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [authors, setAuthors] = useState([]);

    useEffect(() => {
        const fetchAuthors = async () => {
            const { data } = await supabase
                .from("blogs")
                .select("author");

            const uniqueAuthors = [...new Set(data.map(item => item.author))];
            setAuthors(uniqueAuthors);
        };

        fetchAuthors();
    }, []);

    // Fetch blogs: prepend static entries, then append DB posts
    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("blogs")
                .select("*")
                .order("publish_date", { ascending: false });

            if (error) {
                throw error;
            }

            // Merge: static blogs first (newest first by publish_date), then DB posts
            const dbBlogs = data || [];
            const staticSlugs = new Set(staticBlogsData.map((b) => b.slug));
            const filteredDb = dbBlogs.filter((b) => !staticSlugs.has(b.slug));
            const merged = [...staticBlogsData, ...filteredDb];
            setBlogs(merged);
        } catch (err) {
            console.error("Error fetching blogs:", err.message);
            // Show static blogs even if Supabase fails
            setBlogs(staticBlogsData);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);


    // Escape key to close expanded modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (activeCard) setActiveCard(null);
                if (isFormOpen) setIsFormOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeCard, isFormOpen]);

    // Lock body scroll when cards or forms are open
    useEffect(() => {
        if (activeCard || isFormOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [activeCard, isFormOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!title.trim() || !author.trim() || !publishDate || !imageFile) {
                throw new Error("Title, Author, Publish Date, and Cover Image are required.");
            }

            // Verify each section has a heading and content
            for (let i = 0; i < sections.length; i++) {
                if (!sections[i].heading.trim() || !sections[i].content.trim()) {
                    throw new Error(`Section ${i + 1} must have a heading and content.`);
                }
            }

            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("author", author.trim());
            formData.append("publish_date", publishDate);
            formData.append("image", imageFile);

            // Construct sections array with file markers
            const sectionsData = sections.map((sec, idx) => {
                if (sec.showImage && sec.imageFile) {
                    const fileKey = `section_image_${idx}`;
                    formData.append(fileKey, sec.imageFile);
                    return {
                        heading: sec.heading.trim(),
                        content: sec.content.trim(),
                        image: fileKey,
                        caption: sec.caption.trim() || null
                    };
                } else {
                    return {
                        heading: sec.heading.trim(),
                        content: sec.content.trim(),
                        image: null,
                        caption: null
                    };
                }
            });

            formData.append("sections", JSON.stringify(sectionsData));

            const response = await fetch("/api/blog", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to publish blog.");
            }

            // Reload details smoothly
            await fetchBlogs();

            // Reset states & close modal
            setTitle("");
            setAuthor("");
            setPublishDate("");
            setSections([{ id: 1, heading: "", content: "", showImage: false, imageFile: null, imagePreview: null, caption: "" }]);
            setImageFile(null);
            setImagePreview(null);
            setIsFormOpen(false);
        } catch (err) {
            console.error(err);
            setError(err.message || "An unexpected error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar />
            <div className="relative -mt-[64px] lg:-mt-[68px] h-[680px] sm:h-[200vh]">
                <div className="sticky top-0 h-[340px] sm:h-screen z-0">
                    <Hero />
                </div>

                <div className="absolute inset-x-0 top-0 h-[340px] sm:h-screen z-[5]">
                    <HeroText />
                </div>
            </div>
            {/* <ContentHeader
                className="bg-cover"
                backgroundImage={backgroundImage}
                subtitle="Our Tech Insights"
                title="Our Blogs"
                description="We simplify complex trends and innovations, transforming technical concepts into clear, practical insights that anyone can understand. From emerging technologies and digital transformation to business strategies and industry best practices, our blogs deliver valuable, actionable knowledge !"
                highlights={[
                    "Real-time insights",
                    "End-to-End Visibility",
                    "Advanced Automation",
                    "Flexibility and Scalability",
                    "Security & Compliance",
                ]}
            /> */}
            <div className="relative z-10 -mt-[340px] sm:-mt-[80vh] bg-white">
                {/* Main Container */}
                <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12 md:py-20">

                    {/* Header Section (Inspired by KaarTech blogs page layout) */}
                    {/* <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 mb-12 gap-6"> */}
                    {/* <div className="space-y-3">
                        <span className="text-sm font-bold uppercase tracking-wider text-blue-500">
                            Ascendus Tech Insights
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-neutral-900 dark:text-white">
                            Our <span className="gradient-text font-black">Blogs</span>
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 text-lg md:text-xl max-w-2xl font-light">
                            Explore the latest insights on SAP, digital transformation, cloud infrastructure, and software engineering.
                        </p>
                    </div> */}

                    {/* <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-300 self-start md:self-end"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Post a Blog</span>
                    </button> */}
                    {/* </div> */}

                    {/* Loading Spinner */}
                    {loading ? (
                        <div className="flex items-center justify-center py-40">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 bg-white">
                            <p className="text-slate-600 text-lg mb-6">
                                No blog posts found. Be the first to post an insights article!
                            </p>
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Write First Post
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map((blog) => (
                                <div
                                    key={blog.id}
                                    onClick={() => router.push(`/blog/${blog.slug}`)}
                                    className="cursor-pointer h-full"
                                >
                                    <CardContainer
                                        className="inter-var h-[491px]"
                                        containerClassName="h-full py-0"
                                    >
                                        <CardBody className="bg-[#F5F6F6] p-6 border shadow-md hover:shadow-2xl flex flex-col h-full">

                                            <div className="flex-1 my-7">
                                                <div className="h-52 overflow-hidden">
                                                    <img
                                                        src={blog.cover_image}
                                                        alt={blog.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <CardItem
                                                    translateZ="0"
                                                    className="mt-4 text-lg  line-clamp-2 min-h-[56px]"
                                                >
                                                    {blog.title}
                                                </CardItem>

                                                <CardItem
                                                    translateZ="0"
                                                    className="mt-3 text-xs uppercase tracking-wider text-[#0A3A52]"
                                                >
                                                    By {blog.author}
                                                </CardItem>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t pt-4">
                                                <CardItem translateZ={20} className="text-xs text-neutral-500">
                                                    {new Date(blog.publish_date).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </CardItem>

                                                <CardItem
                                                    translateZ={20}
                                                    as="div"
                                                    className="w-8 h-8 rounded-full border border-black bg-[#F5F6F6] flex items-center justify-center"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </CardItem>
                                            </div>

                                        </CardBody>
                                    </CardContainer>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

            </div>

            {/* Creation Modal Dialog */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 overflow-y-auto"
                        onClick={() => setIsFormOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-450"
                                onClick={() => setIsFormOpen(false)}
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                                Post a New Insights Article
                            </h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} className="space-y-5">

                                {/* Upload Section */}
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                                        Cover Image
                                    </label>
                                    <div className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            required
                                        />
                                        {imagePreview ? (
                                            <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-inner">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setImageFile(null);
                                                        setImagePreview(null);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-650 hover:bg-red-750 text-white shadow-md transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <ImageIcon className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                                                <span className="text-sm text-neutral-500 dark:text-neutral-450 block font-medium">
                                                    Click or drag file to upload cover image
                                                </span>
                                                <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 block">
                                                    Supports PNG, JPG, JPEG or WEBP
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                            Blog Title
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            placeholder="e.g. Navigating SAP S/4HANA Migration"
                                            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                            Author Name
                                        </label>
                                        <input
                                            type="text"
                                            value={author}
                                            onChange={(e) => setAuthor(e.target.value)}
                                            required
                                            placeholder="e.g. John Doe"
                                            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                        Publish Date
                                    </label>
                                    <input
                                        type="date"
                                        value={publishDate}
                                        onChange={(e) => setPublishDate(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                            Article Sections
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setSections([...sections, { id: Date.now(), heading: "", content: "", showImage: false, imageFile: null, imagePreview: null, caption: "" }])}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Section
                                        </button>
                                    </div>

                                    {sections.map((sec, idx) => (
                                        <div key={sec.id} className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 bg-slate-50/50 dark:bg-neutral-800/10 relative">

                                            {/* Section Header with Actions */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-blue-500">
                                                    Section #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={idx === 0}
                                                        onClick={() => {
                                                            if (idx === 0) return;
                                                            const updated = [...sections];
                                                            const temp = updated[idx];
                                                            updated[idx] = updated[idx - 1];
                                                            updated[idx - 1] = temp;
                                                            setSections(updated);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-30 transition-all cursor-pointer"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={idx === sections.length - 1}
                                                        onClick={() => {
                                                            if (idx === sections.length - 1) return;
                                                            const updated = [...sections];
                                                            const temp = updated[idx];
                                                            updated[idx] = updated[idx + 1];
                                                            updated[idx + 1] = temp;
                                                            setSections(updated);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-30 transition-all cursor-pointer"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={sections.length === 1}
                                                        onClick={() => {
                                                            if (sections.length === 1) return;
                                                            setSections(sections.filter(s => s.id !== sec.id));
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-30 transition-all ml-1 cursor-pointer"
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Heading Input */}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                                    Heading / Topic Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={sec.heading}
                                                    onChange={(e) => {
                                                        const updated = [...sections];
                                                        updated[idx].heading = e.target.value;
                                                        setSections(updated);
                                                    }}
                                                    placeholder="e.g. Introduction or Clean Core"
                                                    required
                                                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* Content Textarea */}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                                    Content / Paragraph
                                                </label>
                                                <textarea
                                                    value={sec.content}
                                                    onChange={(e) => {
                                                        const updated = [...sections];
                                                        updated[idx].content = e.target.value;
                                                        setSections(updated);
                                                    }}
                                                    placeholder="Enter paragraph text..."
                                                    required
                                                    rows={4}
                                                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                                />
                                            </div>

                                            {/* Optional Image Area */}
                                            {sec.showImage ? (
                                                <div className="space-y-3 p-4 bg-neutral-100/50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = [...sections];
                                                            updated[idx].showImage = false;
                                                            updated[idx].imageFile = null;
                                                            updated[idx].imagePreview = null;
                                                            updated[idx].caption = "";
                                                            setSections(updated);
                                                        }}
                                                        className="absolute top-2 right-2 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                                        Section Image (optional)
                                                    </label>
                                                    <div className="relative border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-white dark:bg-neutral-900 cursor-pointer hover:border-blue-500 transition-colors">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const updated = [...sections];
                                                                    updated[idx].imageFile = file;
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        updated[idx].imagePreview = reader.result;
                                                                        setSections(updated);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                        {sec.imagePreview ? (
                                                            <div className="relative w-full h-32 rounded-lg overflow-hidden shadow-inner">
                                                                <img src={sec.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        const updated = [...sections];
                                                                        updated[idx].imageFile = null;
                                                                        updated[idx].imagePreview = null;
                                                                        setSections(updated);
                                                                    }}
                                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-650 text-white shadow-md transition-colors"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-2">
                                                                <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-1" />
                                                                <span className="text-xs text-neutral-500 dark:text-neutral-450 block font-medium">
                                                                    Click to upload section image
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-neutral-500 mb-1">
                                                            Image Caption (optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Figure 1: SAP Clean Core Architecture"
                                                            value={sec.caption}
                                                            onChange={(e) => {
                                                                const updated = [...sections];
                                                                updated[idx].caption = e.target.value;
                                                                setSections(updated);
                                                            }}
                                                            className="w-full px-3 py-2 rounded-xl border border-neutral-350 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...sections];
                                                        updated[idx].showImage = true;
                                                        setSections(updated);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-355 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add Image (optional)
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <div className="flex justify-center pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSections([...sections, { id: Date.now(), heading: "", content: "", showImage: false, imageFile: null, imagePreview: null, caption: "" }])}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold rounded-xl transition-all border border-blue-200 cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" /> Add Another Section
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Posting...
                                            </>
                                        ) : (
                                            "Publish Blog"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <section>
                <AuthorsSection authors={authors} />
            </section>
            <Footer />
        </div>
    );
}
