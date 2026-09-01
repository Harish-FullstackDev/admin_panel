"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Phone, Mail, Compass, X } from "lucide-react";
import careerlocation from "../../assets/contactus/careerlocation.svg";

const InteractiveLocationPreview = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [pinBounced, setPinBounced] = useState(false);

    const hoverTimeoutRef = useRef(null);
    const triggerRef = useRef(null);

    // Check if viewport is mobile size
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    // Handle hover intent (desktop)
    const handleMouseEnter = () => {
        if (isMobile) return;

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // Anti-frustration delay: Only open if hovered for 180ms
        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpen(true);
            // Trigger a single gentle bounce for the icon
            setPinBounced(true);
            setTimeout(() => setPinBounced(false), 600);
        }, 180);
    };

    const handleMouseLeave = () => {
        if (isMobile) return;

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // Delay exit slightly to allow mouse to transit across safe corridor
        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    };

    // Keyboard accessibility
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isMobile) {
                setIsBottomSheetOpen(true);
            } else {
                setIsOpen(!isOpen);
            }
        }
    };

    const handleClick = (e) => {
        if (isMobile) {
            e.preventDefault();
            setIsBottomSheetOpen(true);
        }
    };

    // Google Maps location URL details
    const mapsUrl = "https://maps.app.goo.gl/FPyusDn4whKnYmst8";
    const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3903.5025088649436!2d79.81591100000001!3d11.939670300000008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5361c4eec70b95%3A0x584de4859b109201!2sSupport%20Studio%20Technologies!5e0!3m2!1sen!2sin!4v1757399839664!5m2!1sen!2sin%22";

    // Framer Motion variants
    const cardVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            x: "-50%"
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            x: "-50%",
            transition: {
                type: "tween",
                ease: [0.16, 1, 0.3, 1], // ease-out-expo curve
                duration: 0.4
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: -8,
            x: "-50%",
            transition: {
                duration: 0.2
            }
        }
    };

    const pinVariants = {
        hidden: { y: -45, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 14,
                delay: 0.15
            }
        }
    };

    const rippleVariants = {
        animate: {
            scale: [1, 2.4],
            opacity: [0.5, 0],
            transition: {
                duration: 1.6,
                repeat: Infinity,
                ease: "easeOut"
            }
        }
    };

    return (
        <div
            className="relative inline-block w-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Location Trigger Block */}
            <div className="flex items-start space-x-4">
                {/* Location Pin Icon */}
                <div className="relative w-6 h-6 flex-shrink-0 mt-0.5">
                    <motion.div
                        animate={pinBounced || isOpen ? {
                            y: [0, -6, 0],
                            transition: { duration: 0.45, ease: "easeInOut" }
                        } : {}}
                        className="w-full h-full flex items-center justify-center relative z-10"
                    >
                        <Image
                            src={careerlocation}
                            alt="Location Pin Icon"
                            width={24}
                            height={24}
                            className="text-gray-700 pointer-events-none"
                        />
                    </motion.div>
                    {/* Active pulse ring around original location pin */}
                    {(isOpen || pinBounced) && (
                        <motion.span
                            initial={{ scale: 0.7, opacity: 0.6 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full bg-blue-500/25 border border-blue-500/40 pointer-events-none"
                        />
                    )}
                </div>

                {/* Address Link / Interactive trigger */}
                <div className="text-gray-700 text-base leading-relaxed flex-1 relative">
                    <a
                        ref={triggerRef}
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        className="hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:text-blue-500 focus:underline cursor-pointer"
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isOpen || isBottomSheetOpen}
                        tabIndex={0}
                    >
                        #192, Kamaraj Salai, Puducherry - 605 013
                    </a>

                    {/* Desktop Hover Card with Safe Corridor (appears below the link) */}
                    <AnimatePresence>
                        {isOpen && !isMobile && (
                            <>
                                {/* Connection Line */}
                                <svg
                                    className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-4 overflow-visible pointer-events-none z-40"
                                    style={{ marginTop: "0px" }}
                                >
                                    <motion.path
                                        d="M 4 0 L 4 16"
                                        stroke="url(#lineGrad)"
                                        strokeWidth="1.5"
                                        strokeDasharray="3 3"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                    />
                                    <defs>
                                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2d8ec5" />
                                            <stop offset="100%" stopColor="#30cdb0" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Hover card container. Absolute positioned below the link, centered */}
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="absolute top-full left-1/2 mt-4 pt-4 z-50 pointer-events-auto"
                                    style={{ width: "450px" }}
                                >
                                    {/* Actual card block with Vertical Layout & Large Map */}
                                    <div
                                        className="flex flex-col rounded-3xl relative overflow-hidden"
                                        style={{
                                            backdropFilter: "blur(14px)",
                                            WebkitBackdropFilter: "blur(14px)",
                                            background: "rgba(255, 255, 255, 0.9)",
                                            border: "1px solid rgba(229, 231, 235, 0.6)",
                                            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.15)", // Premium soft shadow
                                            WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                                            maskImage: "radial-gradient(white, black)"
                                        }}
                                    >
                                        {/* Top Section: Large Map Thumbnail */}
                                        <div
                                            className="w-full h-60 relative bg-slate-100 flex-shrink-0 rounded-t-3xl overflow-hidden"
                                            style={{
                                                WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                                                maskImage: "radial-gradient(white, black)"
                                            }}
                                        >
                                            <iframe
                                                src={mapEmbedUrl}
                                                className="absolute top-0 left-0 w-full h-full border-0 pointer-events-none scale-110 rounded-t-3xl"
                                                allowFullScreen=""
                                                loading="lazy"
                                                title="Map Thumbnail"
                                            />

                                            {/* Floating Dropping Pin & Ripple in the center */}
                                            <div className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none">
                                                {/* Ripple */}
                                                <motion.div
                                                    variants={rippleVariants}
                                                    animate="animate"
                                                    className="absolute -left-3.5 -top-3.5 w-7 h-7 rounded-full bg-blue-500/25 border border-blue-500/40"
                                                />
                                                {/* Dropping Pin */}
                                                <motion.div
                                                    variants={pinVariants}
                                                    className="absolute -left-3 -top-6 w-6 h-6"
                                                >
                                                    <MapPin className="w-6 h-6 text-blue-500 fill-blue-500/10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Bottom Section: Address & Details */}
                                        <div
                                            className="p-5 flex justify-between items-stretch gap-4 relative rounded-b-3xl"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(23, 37, 84, 0.93) 0%, rgba(15, 23, 42, 0.97) 100%)",
                                                borderTop: "1px solid rgba(255, 255, 255, 0.1)"
                                            }}
                                        >
                                            {/* Left Column: Info */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="text-base font-extrabold tracking-wider text-white uppercase">
                                                        SST Technologies
                                                    </h4>
                                                    {/* Accent underline */}
                                                    <div className="w-12 h-[3px] bg-blue-500 rounded-full mt-1.5 mb-3" />

                                                    <p className="text-xs text-slate-200 leading-relaxed font-light">
                                                        #192, Kamaraj Salai, Puducherry - 605 013
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-slate-300 mt-3">
                                                    <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                    <span className="text-[11px] tracking-wide font-normal">Mon - Fri: 9AM - 6PM</span>
                                                </div>
                                            </div>

                                            {/* Right Column: Pin Icon & View button */}
                                            <div className="flex flex-col justify-between items-end w-32 flex-shrink-0">
                                                {/* Circular pin badge */}
                                                <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-blue-400">
                                                    <MapPin className="w-5 h-5 text-blue-400" />
                                                </div>

                                                {/* Button */}
                                                <a
                                                    href={mapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold py-2 px-4 rounded-full transition-all duration-200 shadow-md shadow-blue-500/20 flex items-center gap-1.5 mt-4 focus:outline-none"
                                                >
                                                    View on Maps
                                                    <motion.span
                                                        className="inline-block"
                                                        animate={{ x: [0, 3, 0] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                                                    >
                                                        →
                                                    </motion.span>
                                                </a>
                                            </div>
                                        </div>

                                        {/* Tooltip Pointer (anchored to top boundary, centered) */}
                                        <div
                                            className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-l border-t z-10"
                                            style={{
                                                background: "#ffffff",
                                                borderColor: "rgba(229, 231, 235, 0.6)"
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Bottom Sheet Fallback */}
            <AnimatePresence>
                {isBottomSheetOpen && isMobile && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBottomSheetOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                        />

                        {/* Bottom Sheet Card */}
                        <motion.div
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.3}
                            onDragEnd={(e, info) => {
                                // If dragged down by more than 80px, dismiss
                                if (info.offset.y > 80) {
                                    setIsBottomSheetOpen(false);
                                }
                            }}
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 24, stiffness: 220 }}
                            className="fixed bottom-0 left-0 right-0 max-h-[92vh] bg-slate-950 border-t border-white/10 rounded-t-3xl z-[10000] overflow-hidden flex flex-col pointer-events-auto"
                        >
                            {/* Drag Handle & Close button header */}
                            <div className="flex-shrink-0 relative py-4 flex items-center justify-center border-b border-white/5">
                                <div className="w-12 h-1 bg-slate-700 rounded-full cursor-pointer" onClick={() => setIsBottomSheetOpen(false)} />
                                <button
                                    onClick={() => setIsBottomSheetOpen(false)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                    aria-label="Close details"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Scrollable Sheet Content */}
                            <div className="overflow-y-auto px-6 pt-4 pb-8 space-y-5">

                                {/* Office Title */}
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-wide">
                                        Support Studio Technologies
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-xs">Mon - Fri: 9:00 AM - 6:00 PM</span>
                                    </div>
                                </div>

                                {/* Larger Interactive Map Preview */}
                                <div className="w-full h-52 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                                    <iframe
                                        src={mapEmbedUrl}
                                        className="absolute top-0 left-0 w-full h-full border-0"
                                        allowFullScreen=""
                                        loading="lazy"
                                        title="Interactive Mobile Location Map"
                                    />
                                </div>

                                {/* Address block */}
                                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Head Office Address</h4>
                                        <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                                            #192, Kamaraj Salai, Puducherry - 605 013, India
                                        </p>
                                    </div>
                                </div>

                                {/* Grid Action pill buttons (Google Maps-like) */}
                                <div className="flex gap-3 pt-2">
                                    {/* Call Action */}
                                    <a
                                        href="tel:+04132191301"
                                        className="flex-1 py-3 px-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-800/80 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 text-white transition-colors"
                                    >
                                        <Phone className="w-5 h-5 text-cyan-400" />
                                        <span className="text-[10px] font-medium tracking-wide">Call Office</span>
                                    </a>

                                    {/* Email Action */}
                                    <a
                                        href="mailto:hi@isupportz.com"
                                        className="flex-1 py-3 px-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-800/80 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 text-white transition-colors"
                                    >
                                        <Mail className="w-5 h-5 text-cyan-400" />
                                        <span className="text-[10px] font-medium tracking-wide">Send Email</span>
                                    </a>

                                    {/* Get Directions Action */}
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-3 px-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-xl flex flex-col items-center justify-center gap-1 text-white transition-colors shadow-lg shadow-blue-500/15"
                                    >
                                        <Compass className="w-5 h-5 text-white" />
                                        <span className="text-[10px] font-semibold tracking-wide">Directions</span>
                                    </a>
                                </div>

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveLocationPreview;

