"use client";

import { motion } from "framer-motion";

const STATS = [
    { value: "500+", title: "SAP Projects Delivered", description: "Helping businesses transform with innovative SAP solutions." },
    { value: "500+", title: "SAP Projects Delivered", description: "Helping businesses transform with innovative SAP solutions." },
    { value: "500+", title: "SAP Projects Delivered", description: "Helping businesses transform with innovative SAP solutions." },
    { value: "500+", title: "SAP Projects Delivered", description: "Helping businesses transform with innovative SAP solutions." },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function WhatSetsUsApart() {
    return (
        <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center max-w-[1500px] mx-auto"
                >
                    <h2 className="text-2xl font-medium text-black">What sets us apart</h2>
                    <p className="mt-3 text-base text-black">At Ascendus, people are at the heart of everything we do.</p>
                    <p className="mt-2 text-sm sm:text-base text-[#6c6c6c] leading-relaxed">
                        We empower our teams through continuous learning and innovation. Our collaborative culture
                        encourages creativity and shared success.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
                >
                    {STATS.map((stat, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="bg-[#0a2b3e] shadow-[0px_2px_8px_rgba(0,0,0,0.19)] flex flex-col justify-end gap-4 p-6 h-[220px] sm:h-[237px]"
                        >
                            <p className="text-2xl text-white">{stat.value}</p>
                            <div>
                                <p className="text-lg font-medium text-white">{stat.title}</p>
                                <p className="text-xs text-white/80 mt-3 leading-relaxed">{stat.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
