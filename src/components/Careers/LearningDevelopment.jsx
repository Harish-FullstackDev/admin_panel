"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import learningImage from "@/assets/career/Learning and development.svg";

export default function LearningDevelopment() {
    return (
        <section className="w-full py-8 sm:py-12">
            <div className="flex flex-col lg:relative lg:w-full lg:aspect-[1280/537]">
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative w-full h-[280px] sm:h-[380px] lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-[65.078%] bg-[#5c5c5c]"
                >
                    <Image src={learningImage} alt="" fill className="object-cover" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className="w-full lg:absolute lg:top-[12.104%] lg:left-[44.766%] lg:h-[77.467%] lg:w-[50.547%] bg-[#f4f3f9] flex flex-col justify-center gap-6 px-6 sm:px-10 py-10 sm:py-14"
                >
                    <div>
                        <p className="text-lg text-black">Grow</p>
                        <h2 className="text-2xl font-medium text-black mt-1">Learning and Development</h2>
                    </div>
                    <div className="text-sm sm:text-base text-[#6c6c6c] leading-relaxed space-y-1">
                        <p>We believe continuous learning drives exceptional careers.</p>
                        <p>Enhance your expertise through structured SAP training programs.</p>
                        <p>Gain hands-on experience with real-world client projects.</p>
                        <p>Learn from certified consultants and experienced industry mentors.</p>
                        <p>Stay ahead with the latest SAP technologies and best practices.</p>
                        <p>Grow your career in a culture that values innovation and excellence.</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Learn more about Learning and Development"
                        className="flex items-center justify-center size-9 rounded-full border border-[#6c6c6c] text-[#6c6c6c] transition-colors hover:bg-black hover:text-white hover:border-black"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
