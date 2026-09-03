"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Search,
  Image as ImageIcon,
  ArrowLeft,
  Save,
  Upload,
  X,
  Calendar,
  User,
  LayoutList,
  AlertTriangle,
} from "lucide-react";

interface Section {
  heading: string;
  content: string;
  image: string | File | null;
  caption: string;
  localPreviewUrl?: string; // used for previewing newly uploaded section files
}

interface Highlight {
  label: string;
  value: string;
}

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  cover_image: string;
  author: string;
  publish_date: string;
  meta_line: string | null;
  tags: string[];
  highlights: any;
  sections: any;
  created_at: string;
}

export default function AdminCaseStudiesDashboard() {
  const router = useRouter();

  // Navigation and data states
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "create" | "edit">("list");
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback states
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Deletion prompt state
  const [deleteTarget, setDeleteTarget] = useState<CaseStudy | null>(null);

  // Form states (Post Mutation Canvas)
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [metaLine, setMetaLine] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [publishDate, setPublishDate] = useState("");
  const [coverImage, setCoverImage] = useState<File | string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  // Fetch case studies list
  const fetchCaseStudies = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/case-studies");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load case studies catalog.");
      }
      setCaseStudies(data.caseStudies || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error connecting to case studies API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  // Clear states and return to inventory view
  const returnToInventory = () => {
    setActiveView("list");
    setEditingId("");
    setTitle("");
    setAuthor("");
    setCategory("");
    setSummary("");
    setMetaLine("");
    setTagsInput("");
    setHighlights([]);
    setPublishDate(new Date().toISOString().split("T")[0]);
    setCoverImage(null);
    setCoverPreviewUrl("");
    setSections([]);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Switch to Create New Post form
  const initCreateView = () => {
    returnToInventory();
    setActiveView("create");
  };

  // Load a case study details into Mutation Form
  const initEditView = (caseStudy: CaseStudy) => {
    returnToInventory();
    setEditingId(caseStudy.id);
    setTitle(caseStudy.title);
    setAuthor(caseStudy.author);
    setCategory(caseStudy.category || "");
    setSummary(caseStudy.summary || "");
    setMetaLine(caseStudy.meta_line || "");
    setTagsInput((caseStudy.tags || []).join(", "));
    setHighlights(Array.isArray(caseStudy.highlights) ? caseStudy.highlights : []);
    // Format publish date yyyy-MM-dd
    const formattedDate = caseStudy.publish_date
      ? new Date(caseStudy.publish_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    setPublishDate(formattedDate);
    setCoverImage(caseStudy.cover_image);
    setCoverPreviewUrl(caseStudy.cover_image);

    // Map database dynamic sections
    let dbSections: any[] = [];
    if (typeof caseStudy.sections === "string") {
      try {
        dbSections = JSON.parse(caseStudy.sections);
      } catch (e) {
        dbSections = [];
      }
    } else if (Array.isArray(caseStudy.sections)) {
      dbSections = caseStudy.sections;
    }

    const mappedSections: Section[] = dbSections.map((sec: any) => ({
      heading: sec.heading || "",
      content: sec.content || "",
      image: sec.image || null,
      caption: sec.caption || "",
      localPreviewUrl: sec.image || ""
    }));

    setSections(mappedSections);
    setActiveView("edit");
  };

  // Log Out operation
  const handleLogout = () => {
    document.cookie = "sst_admin_session=; path=/; max-age=0; Secure; SameSite=Lax";
    router.push("/admin/login");
  };

  // Cover image selection preview
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Add a key highlight pair
  const handleAddHighlight = () => {
    setHighlights([...highlights, { label: "", value: "" }]);
  };

  // Remove a key highlight pair
  const handleRemoveHighlight = (index: number) => {
    const updated = [...highlights];
    updated.splice(index, 1);
    setHighlights(updated);
  };

  // Update a key highlight field
  const handleHighlightChange = (index: number, field: keyof Highlight, value: string) => {
    const updated = [...highlights];
    updated[index] = { ...updated[index], [field]: value };
    setHighlights(updated);
  };

  // Add a content block section
  const handleAddSection = () => {
    setSections([
      ...sections,
      { heading: "", content: "", image: null, caption: "" }
    ]);
  };

  // Remove a content block section
  const handleRemoveSection = (index: number) => {
    const updated = [...sections];
    updated.splice(index, 1);
    setSections(updated);
  };

  // Update specific text/attribute fields in sections
  const handleSectionTextChange = (
    index: number,
    field: keyof Section,
    value: string
  ) => {
    const updated = [...sections];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setSections(updated);
  };

  // Handle section image attachment selection
  const handleSectionImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const updated = [...sections];
      updated[index] = {
        ...updated[index],
        image: file,
        localPreviewUrl: URL.createObjectURL(file)
      };
      setSections(updated);
    }
  };

  // Submit mutations to backend endpoint
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) return setErrorMessage("Case study title is required.");
    if (!author.trim()) return setErrorMessage("Author name is required.");
    if (!category.trim()) return setErrorMessage("Category is required.");
    if (!summary.trim()) return setErrorMessage("Summary is required.");
    if (!publishDate) return setErrorMessage("Publish Date is required.");
    if (!coverImage) return setErrorMessage("Cover image is required.");

    setSaving(true);
    const formData = new FormData();

    if (activeView === "edit") {
      formData.append("id", editingId);
    }
    formData.append("title", title);
    formData.append("author", author);
    formData.append("category", category);
    formData.append("summary", summary);
    formData.append("meta_line", metaLine);
    formData.append(
      "tags",
      JSON.stringify(
        tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      )
    );
    formData.append("highlights", JSON.stringify(highlights.filter((h) => h.label.trim() || h.value.trim())));
    formData.append("publish_date", publishDate);

    // Append cover image file or URL string
    if (coverImage instanceof File) {
      formData.append("image", coverImage);
    } else {
      formData.append("image", coverImage || "");
    }

    // Map section images into placeholders, packaging files separately in form attributes
    const formattedSections = sections.map((sec, idx) => {
      if (sec.image instanceof File) {
        const fileKey = `section_image_${idx}`;
        formData.append(fileKey, sec.image);
        return {
          heading: sec.heading,
          content: sec.content,
          image: fileKey, // server resolves this placeholder to storage url
          caption: sec.caption
        };
      } else {
        return {
          heading: sec.heading,
          content: sec.content,
          image: sec.image, // URL string or null
          caption: sec.caption
        };
      }
    });

    formData.append("sections", JSON.stringify(formattedSections));

    try {
      const method = activeView === "create" ? "POST" : "PUT";
      const res = await fetch("/api/case-studies", {
        method,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit record mutation.");
      }

      setSuccessMessage(
        `Case study was successfully ${activeView === "create" ? "created" : "updated"}!`
      );

      // Refresh inventory and return
      await fetchCaseStudies();
      setTimeout(() => {
        returnToInventory();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during save operations.");
    } finally {
      setSaving(false);
    }
  };

  // Delete case study procedure
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setErrorMessage("");
    setSuccessMessage("");
    const targetId = deleteTarget.id;

    // Optimistic UI updates
    const backupCaseStudies = [...caseStudies];
    setCaseStudies(caseStudies.filter((c) => c.id !== targetId));
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/case-studies?id=${targetId}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete from database table.");
      }

      setSuccessMessage("Case study was successfully deleted.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to delete case study records.");
      // Rollback optimistic update
      setCaseStudies(backupCaseStudies);
    }
  };

  // Filtered rows for catalog list view
  const filteredCaseStudies = caseStudies.filter((caseStudy) => {
    const textQuery = searchQuery.toLowerCase();
    return (
      caseStudy.title.toLowerCase().includes(textQuery) ||
      caseStudy.author.toLowerCase().includes(textQuery)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">

      {/* HEADER CONTROLS */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-teal-600 to-brand-teal-400 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-sm shadow-brand-teal-500/10">
            SST
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-widest text-slate-900 uppercase">
              STUDIO PORTAL
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider">Administrator Control Board</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs">
              <p className="font-semibold text-slate-700">Admin Session</p>
              <p className="text-[10px] text-slate-400 font-medium">Read / Write Access Enabled</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 px-3 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-2xl border border-slate-200 hover:border-red-200 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEW SYSTEM */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">

        {/* GLOBAL ALERT SYSTEM */}
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50/80 border border-red-200/60 rounded-2xl text-red-700 text-sm flex items-start gap-3 shadow-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <h5 className="font-bold text-red-650">Operation Error</h5>
              <p className="text-xs mt-0.5 text-red-600 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 bg-brand-teal-50 border border-brand-teal-200/50 rounded-2xl text-brand-teal-800 text-sm flex items-start gap-3 shadow-sm animate-fade-in">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-teal-500 mt-1.5 shrink-0 animate-ping" />
            <div>
              <h5 className="font-bold text-brand-teal-700">Success</h5>
              <p className="text-xs mt-0.5 text-brand-teal-600 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {activeView === "list" ? (
          /* ==================================================== */
          /* -------------- CASE STUDY INVENTORY LIST ------------ */
          /* ==================================================== */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 border-none">
                  Case Studies Management
                </h2>
                <p className="text-slate-500 text-xs mt-1 font-semibold">
                  Manage case study list, insert content blocks database records, or modify existing publications.
                </p>
              </div>
              <button
                onClick={initCreateView}
                className="px-4 py-2.5 bg-brand-teal-500 hover:bg-brand-teal-600 text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-brand-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Case Study</span>
              </button>
            </div>

            {/* Catalog filter systems */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 max-w-md shadow-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search case studies by title or author name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 placeholder-slate-400 focus:outline-none w-full"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                <div className="w-8 h-8 border-3 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" />
                <span className="text-xs text-slate-450 font-semibold">Hydrating inventory matrix...</span>
              </div>
            ) : filteredCaseStudies.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl">
                <LayoutList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="text-slate-700 font-bold">No Records Found</h4>
                <p className="text-slate-450 text-xs mt-1 max-w-sm mx-auto font-medium">
                  There are no case studies found matching current filter parameters or the repository is empty.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                        <th className="px-6 py-4">Title & Details</th>
                        <th className="px-6 py-4">Author</th>
                        <th className="px-6 py-4">Publish Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCaseStudies.map((caseStudy) => (
                        <tr key={caseStudy.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-4 max-w-md">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                {caseStudy.cover_image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={caseStudy.cover_image}
                                    alt={caseStudy.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                    <ImageIcon className="w-3.5 h-3.5 text-slate-350" />
                                  </div>
                                )}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-slate-800 text-sm hover:text-brand-teal-600 transition-colors truncate">
                                  {caseStudy.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                                  <span>Slug: {caseStudy.slug}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{caseStudy.author}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(caseStudy.publish_date).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right animate-transition">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => initEditView(caseStudy)}
                                className="p-2 bg-slate-50 hover:bg-brand-teal-50 text-slate-400 hover:text-brand-teal-600 rounded-xl border border-slate-200 hover:border-brand-teal-200/50 active:scale-95 transition-all cursor-pointer"
                                title="Edit case study"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(caseStudy)}
                                className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 hover:border-red-200/50 active:scale-95 transition-all cursor-pointer"
                                title="Delete case study"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ==================================================== */
          /* -------------- POST MUTATION CANVAS ---------------- */
          /* ==================================================== */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={returnToInventory}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-900 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to inventory</span>
              </button>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                {activeView === "create" ? "New Case Study Canvas" : "Edit Case Study Canvas"}
              </h2>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-8">

              {/* PRIMARY DETAILS GRID */}
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-6 shadow-sm">
                <h3 className="text-xs font-extrabold tracking-wider uppercase text-brand-teal-600">
                  Primary Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Case Study Title (Required)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SAP S/4HANA Migration in the GCC"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Author Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chief Cybersec Architect"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Publish Date
                      </label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Category (Required)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Software"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Meta Line (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Software · 7 minute read"
                      value={metaLine}
                      onChange={(e) => setMetaLine(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Summary (Required)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Short summary shown on listing cards..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SAP S/4HANA, ZATCA, GCC"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-200 transition-all"
                  />
                </div>

                {/* COVER IMAGE UPLOADER */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Cover Image
                  </label>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="relative group w-48 h-28 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center font-sans">
                      {coverPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPreviewUrl}
                          alt="Cover image preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                          <span className="text-[10px] text-slate-400 font-semibold">No cover picture</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 select-none font-sans">
                      <label className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold flex items-center gap-2 active:scale-95 transition-all shadow-sm">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-450 font-medium">
                        Accepts JPG, PNG, WebP up to 4MB format. Overwrites existing record files.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KEY HIGHLIGHTS */}
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase text-brand-teal-600">
                    Key Highlights
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="px-3.5 py-2 bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-600 rounded-xl border border-brand-teal-200 hover:border-brand-teal-300 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Highlight</span>
                  </button>
                </div>

                {highlights.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                    <p className="text-xs text-slate-400 font-medium">
                      No key highlights added yet. Click &quot;Add Highlight&quot; to build.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Label, e.g. Target Region"
                          value={highlight.label}
                          onChange={(e) => handleHighlightChange(index, "label", e.target.value)}
                          className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal-200 transition-all"
                        />
                        <input
                          type="text"
                          placeholder="Value, e.g. GCC"
                          value={highlight.value}
                          onChange={(e) => handleHighlightChange(index, "value", e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal-200 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(index)}
                          className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 active:scale-90 transition-all cursor-pointer"
                          title="Remove highlight"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTIONS LIST */}
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase text-brand-teal-600">
                    Content Blocks & Sections
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-3.5 py-2 bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-600 rounded-xl border border-brand-teal-200 hover:border-brand-teal-300 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Content Block</span>
                  </button>
                </div>

                {sections.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                    <p className="text-xs text-slate-400 font-medium">
                      No paragraphs or content blocks have been added yet. Click &quot;Add Content Block&quot; to build.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sections.map((section, index) => (
                      <div
                        key={index}
                        className="p-5 bg-white border border-slate-100 rounded-2xl relative space-y-4 shadow-sm group"
                      >
                        <div className="flex justify-between items-center bg-slate-50 -mx-5 -mt-5 px-5 py-2.5 border-b border-slate-100 rounded-t-2xl">
                          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            Block Section #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(index)}
                            className="p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 active:scale-90 transition-all cursor-pointer"
                            title="Remove section block"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                              Section Header (Optional)
                            </label>
                            <input
                              type="text"
                              value={section.heading}
                              onChange={(e) =>
                                handleSectionTextChange(
                                  index,
                                  "heading",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Building Compliance Into the Migration"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal-200 transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                              Section Image Caption (Optional)
                            </label>
                            <input
                              type="text"
                              value={section.caption}
                              onChange={(e) =>
                                handleSectionTextChange(
                                  index,
                                  "caption",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Graph of latency comparison stats."
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal-200 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                            Section Paragraph Body Content
                          </label>
                          <textarea
                            rows={4}
                            value={section.content}
                            onChange={(e) =>
                              handleSectionTextChange(
                                index,
                                "content",
                                e.target.value
                              )
                            }
                            placeholder="Type paragraph markdown content details here..."
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal-200 transition-all font-sans resize-y"
                          />
                        </div>

                        {/* Section Image controls */}
                        <div className="space-y-2">
                          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                            Section Content Image Attachment
                          </label>
                          <div className="flex gap-4 items-center">
                            <div className="w-16 h-12 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {section.localPreviewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={section.localPreviewUrl}
                                  alt="Section preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <label className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 cursor-pointer text-[10px] font-semibold active:scale-95 transition-all shadow-sm">
                              <span>Attach Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleSectionImageChange(index, e)
                                }
                                className="hidden"
                              />
                            </label>
                            {section.localPreviewUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...sections];
                                  updated[index].image = null;
                                  updated[index].localPreviewUrl = "";
                                  setSections(updated);
                                }}
                                className="text-[10px] text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                              >
                                Remove Attachment
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SAVE / SUBMIT ACTIONS */}
              <div className="flex items-center gap-4 justify-end">
                <button
                  type="button"
                  onClick={returnToInventory}
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-semibold rounded-2xl border border-slate-200 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-brand-teal-600 hover:bg-brand-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-brand-teal-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Records...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Commit Publication</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* CONFIRM DELETION MODAL DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-800/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 bg-white border border-slate-100 rounded-3xl shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                Confirm Deletion
              </h4>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to permanently delete:
              <span className="block font-bold text-slate-800 text-sm my-2 quote">
                &ldquo;{deleteTarget.title}&rdquo;
              </span>
              This action cannot be undone. All associated content blocks and image references will be permanently lost from the database table.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Keep Publication
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 border border-red-200 rounded-xl text-white text-xs font-bold shadow-lg shadow-red-100 active:scale-95 transition-all cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-6 text-center text-[10px] text-slate-400 mt-20 select-none">
        &copy; {new Date().getFullYear()} Support Studio Technologies (SST) Inc. Control Panel. All rights reserved.
      </footer>
    </div>
  );
}
