"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { learningDevelopmentSlides } from "@/components/Constants/Career/learningDevelopmentData";

const AUTO_ADVANCE_MS = 5000;

export default function LearningDevelopment() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % learningDevelopmentSlides.length);
        }, AUTO_ADVANCE_MS);
        return () => clearInterval(timer);
    }, [isPaused]);

    const slide = learningDevelopmentSlides[activeIndex];

    return (
       <section className="w-full py-16 sm:py-20">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-2xl sm:text-3xl font-semibold text-black text-center mb-8"
            >
                Learning and Development
            </motion.h2>

            <div
                className="relative w-full h-[220px] sm:h-[300px] lg:h-[491px] overflow-hidden rounded-[20px] border border-[#d3d5d8]"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={slide.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
                            priority={activeIndex === 0}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-b ${slide.gradient}`} />
                        <div className="relative z-10 h-full flex flex-col justify-center gap-4 px-6 sm:px-12 lg:px-16 max-w-xl -translate-y-30">
                            <motion.h3
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.15 }}
                                className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wide"
                            >
                                {slide.title}
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.25 }}
                                className="text-white text-sm sm:text-base lg:text-lg leading-relaxed"
                            >
                                {slide.description}
                            </motion.p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-2.5 mt-6">
                {learningDevelopmentSlides.map((item, index) => (
                    <button
                        key={item.title}
                        type="button"
                        aria-label={`Show ${item.title}`}
                        onClick={() => setActiveIndex(index)}
                        className={`h-2 rounded-full border border-black transition-all duration-300 ${
                            index === activeIndex ? "w-[30px] bg-black" : "w-2 bg-transparent"
                        }`}
                    />
                ))}
            </div>
        </section>
    );
}
