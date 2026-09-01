"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import profile1 from "@/assets/career/Team story profile 1.svg";
import profile2 from "@/assets/career/Team story profile 2.svg";
import profile3 from "@/assets/career/Team story profile 3.svg";

const TESTIMONIALS = [
    {
        avatar: profile1,
        name: "Gilbert B.",
        role: "HR at Tech International",
        quote:
            "Getting a job here is very easy, with a few registration steps I immediately get a call from the company I want.",
    },
    {
        avatar: profile2,
        name: "Audrey William",
        role: "Senior Designer at Bright Studio",
        quote:
            "What's interesting about the process is that I didn't have to wait long for an interview, and within 1 month I was onboard.",
    },
    {
        avatar: profile3,
        name: "Jammie F.",
        role: "Senior Finance at News Update",
        quote:
            "Lockdown made me confused and had difficulty getting a job, but just by registering here I immediately got noticed.",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function TeamStory() {
    return (
        <section className="bg-[#fdfdfd] py-16 sm:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-12"
                >
                    <h2 className="text-2xl sm:text-3xl font-semibold text-[#0d0c22] capitalize">Our Team Story</h2>
                    <p className="mt-4 text-sm sm:text-base text-[#3d3d4e]">
                        You might want to hear from some of our team on their unique expeditions
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8"
                >
                    {TESTIMONIALS.map((item) => (
                        <motion.div
                            key={item.name}
                            variants={itemVariants}
                            className="flex flex-col items-center text-center gap-4"
                        >
                            <Image
                                src={item.avatar}
                                alt={item.name}
                                width={70}
                                height={70}
                                className="rounded-full object-cover size-[70px] bg-[#d8d8d8]"
                            />
                            <div>
                                <p className="font-bold text-[#0d0c22] text-base">{item.name}</p>
                                <p className="text-[#3d3d4e] text-sm opacity-60">{item.role}</p>
                            </div>
                            <p className="text-sm text-[#0d0c22] px-10 leading-relaxed">{item.quote}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
