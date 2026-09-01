"use client";

import { motion } from "framer-motion";

export default function CareersHeroText() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full"
        >
            <div className="flex items-center gap-4 sm:gap-6">
                <p className="text-white text-base sm:text-3xl shrink-0">Career</p>
            </div>
            <div className="flex-1 h-px bg-white/30" />
            <h1 className="text-white/90 text-3xl sm:text-5xl lg:text-6xl font-medium mt-3 max-w-4xl">
                Opportunities don&apos;t happen, you create them.
            </h1>
            <p className="text-white text-xs sm:text-xl mt-3 max-w-xl">
                We are always interested in receiving and reviewing resumes
            </p>
        </motion.div>
    );
}
