"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X, Loader2, AlertCircle } from "lucide-react";
import locationIcon from "@/assets/career/icons/location.svg";
import modeOfWorkIcon from "@/assets/career/icons/mode of work.svg";
import typeOfWorkIcon from "@/assets/career/icons/type of work.svg";
import applicantsIcon from "@/assets/career/icons/applicants.svg";
import shareIcon from "@/assets/career/icons/share.svg";
import menuIcon from "@/assets/career/icons/menu.svg";
import viewJobDetailsIcon from "@/assets/career/icons/view job details.svg";
import uploadIcon from "@/assets/career/icons/upload.svg";


function MetaItem({ icon, label }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-[#4a5565]">
            <Image src={icon} alt="" width={16} height={16} />
            {label}
        </span>
    );
}

function Badge({ children }) {
    return (
        <span className="inline-flex items-center rounded-lg bg-[#eceef2] px-2.5 py-1 text-xs font-medium text-[#030213]">
            {children}
        </span>
    );
}

function BulletList({ items }) {
    return (
        <ul className="space-y-2">
            {items.map((item) => (
                <li key={item} className="flex gap-2 text-base leading-6 text-[#364153]">
                    <span aria-hidden="true">•</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function IconButton({ icon, label, onClick }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-[#0a0a0a] transition-colors hover:bg-slate-50"
        >
            <Image src={icon} alt="" width={16} height={16} />
        </button>
    );
}

function ResumeUploadModal({ isOpen, onClose, jobTitle }) {
    const router = useRouter();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;
        const isValidType = /\.(pdf|doc|docx)$/i.test(selectedFile.name);
        if (!isValidType) {
            setError("Please upload a PDF or Word document (.pdf, .doc, .docx).");
            setFile(null);
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError("File is too large. Maximum size is 5MB.");
            setFile(null);
            return;
        }
        setError("");
        setFile(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const convertToBase64 = (fileObj) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(fileObj);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsParsing(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/parse-resume", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to parse resume");
            }

            // Convert file to Base64 to store in sessionStorage
            const base64Content = await convertToBase64(file);

            // Set sessionStorage fields
            sessionStorage.setItem("parsedResumeData", JSON.stringify({
                ...result.data,
                position: jobTitle // Automatically set position applying for
            }));
            sessionStorage.setItem("parsedResumeFile", JSON.stringify({
                name: file.name,
                type: file.type,
                base64: base64Content
            }));
            sessionStorage.setItem("applyFlowType", "resume-parsed");

            onClose();
            router.push("/careers/apply");
        } catch (err) {
            console.error("Parsing failed, using fallback:", err);
            // Fallback: still redirect user to application form with file pre-attached, but leaving text fields blank
            try {
                const base64Content = await convertToBase64(file);
                sessionStorage.setItem("parsedResumeData", JSON.stringify({
                    position: jobTitle
                }));
                sessionStorage.setItem("parsedResumeFile", JSON.stringify({
                    name: file.name,
                    type: file.type,
                    base64: base64Content
                }));
                sessionStorage.setItem("applyFlowType", "resume-parsed-fallback");
                onClose();
                router.push("/careers/apply");
            } catch (fallbackErr) {
                setError(err.message || "An error occurred during parsing. Please try again.");
                setIsParsing(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-black/10 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Upload your Resume</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Upload your PDF or Word document, and we&apos;ll automatically pre-fill your application.
                    </p>
                </div>

                {!isParsing ? (
                    <div className="space-y-4">
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${dragActive
                                    ? "border-blue-500 bg-blue-50/50"
                                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                                }`}
                        >
                            <Image src={uploadIcon} alt="" width={36} height={36} />
                            <span className="text-sm font-medium text-slate-700 text-center">
                                {file ? file.name : "Drag & drop or click to upload"}
                            </span>
                            <span className="text-xs text-slate-400">PDF, DOC, DOCX up to 5MB</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 flex items-start gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </p>
                        )}

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={!file}
                                className="px-4 py-2 bg-[#030213] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Extracting details from resume...</p>
                            <p className="text-xs text-slate-500 mt-1">This will only take a moment.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function JobDescription({ job, otherJobs = [] }) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleShare = () => {
        if (typeof window === "undefined") return;
        if (navigator.share) {
            navigator.share({ title: job.title, url: window.location.href }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    return (
        <div className="max-w-5xl mx-auto ml-2.5 space-y-4">
            {/* Job Details Card */}
            <div className="bg-white border border-black/10 rounded-[14px] p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="border-l-5 border-[#2d8ec5] pl-4">
                            <h1 className="text-base font-semibold text-[#0a0a0a]">{job.title}</h1>
                            <p className="text-base text-[#4a5565] mt-1">{job.company}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                <MetaItem icon={locationIcon} label={job.location} />
                                <span className="text-[#4a5565] text-sm">•</span>
                                <MetaItem icon={modeOfWorkIcon} label={job.modeOfWork} />
                                <span className="text-[#4a5565] text-sm">•</span>
                                <MetaItem icon={typeOfWorkIcon} label={job.typeOfWork} />
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-[#6a7282]">
                                <Image src={applicantsIcon} alt="" width={16} height={16} />
                                <span>{job.applicants} applicants</span>
                                <span>•</span>
                                <span>{job.postedAgo}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Badge>{job.experienceLevel}</Badge>
                                <Badge>{job.typeOfWork}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 self-start">
                        <IconButton icon={shareIcon} label="Share this job" onClick={handleShare} />
                        <IconButton icon={menuIcon} label="More options" />
                    </div>
                </div>

                <div className="border-t border-black/10 mt-6 pt-6 pl-5 pr-9 space-y-6">
                    <div>
                        <h2 className="text-xl font-medium text-[#0a0a0a] mb-2">About the job</h2>
                        <p className="text-base leading-6 text-[#364153]">{job.aboutJob}</p>
                    </div>

                    <div>
                        <h3 className="text-base font-medium text-[#0a0a0a] mb-2">Responsibilities</h3>
                        <BulletList items={job.responsibilities} />
                    </div>

                    <div>
                        <h3 className="text-base font-medium text-[#0a0a0a] mb-2">Qualifications</h3>
                        <BulletList items={job.qualifications} />
                    </div>
                </div>
            </div>

            {/* Instant Apply Card */}
            <div className="bg-white border border-black/10 rounded-[14px] p-5 sm:p-6">
                <h3 className="text-base font-medium text-[#0a0a0a]">Instant Apply</h3>
                <p className="text-sm text-[#4a5565] mt-1">Apply with one tap using your saved profile</p>

                <div className="border-t border-black/10 mt-4 pt-4">
                    <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[10px] px-3.5 py-3">
                        <p className="text-xs leading-4 text-[#1c398e]">
                            <span className="font-bold">How Instant Apply works:</span> Upload your resume to apply in
                            seconds. We&apos;ll review your profile and contact you if there&apos;s a suitable
                            opportunity.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-full h-10 rounded-lg bg-[#030213] text-white text-sm font-medium flex items-center justify-center transition-colors hover:bg-black cursor-pointer"
                        >
                            Upload your Resume
                        </button>
                        <Link
                            href={`/careers/apply?position=${encodeURIComponent(job.title)}`}
                            className="w-full h-9 rounded-lg border border-black/10 bg-white text-[#0a0a0a] text-sm font-medium flex items-center justify-center transition-colors hover:bg-slate-50"
                        >
                            Apply for This Job
                        </Link>
                    </div>
                </div>
            </div>

            {/* View More Jobs Card */}
            {otherJobs.length > 0 && (
                <div className="bg-white border border-black/10 rounded-[14px] p-5 sm:p-6">
                    <h4 className="text-base font-medium text-[#0a0a0a] mb-3">View More Jobs</h4>
                    <div className="space-y-4">
                        {otherJobs.map((other) => (
                            <div
                                key={other.slug}
                                className="flex items-center justify-between gap-4 border-l-4 border-[#2d8ec5] px-3 py-3"
                            >
                                <div>
                                    <p className="text-sm text-[#5c5c5c]">{other.title}</p>
                                    <p className="text-xs font-light text-[#5c5c5c] mt-0.5">
                                        {other.location} | {other.typeOfWork} | Experience: {other.experienceLevel}
                                    </p>
                                </div>
                                <Link
                                    href={`/careers/${other.slug}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#7f7f7f] px-3 py-1.5 text-xs text-[#2d8ec5] whitespace-nowrap transition-colors hover:bg-slate-50"
                                >
                                    View Job Details
                                    <Image src={viewJobDetailsIcon} alt="" width={8} height={8} />
                                </Link>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/careers"
                        className="mt-4 w-full h-9 rounded-lg border border-black/10 bg-white text-[#0a0a0a] text-sm font-medium flex items-center justify-center transition-colors hover:bg-slate-50"
                    >
                        View More Jobs
                    </Link>
                </div>
            )}

            <ResumeUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                jobTitle={job.title}
            />
        </div>
    );
}

