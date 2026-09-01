"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import card1 from "@/assets/career/card 1 image.jpg";
import card2 from "@/assets/career/card 2 image.jpg";
import card3 from "@/assets/career/card 3 image.jpg";

const CARDS = [
    {
        image: card1,
        title: "Grow your career",
        description:
            "From developers and designers to strategists and SAP pros, there are endless opportunities for you to learn, grow and make a difference.",
    },
    {
        image: card2,
        title: "Flex work",
        description:
            "Enjoy flexible work options tailored to support both productivity and work-life balance.",
    },
    {
        image: card3,
        title: "World-class benefits",
        description:
            "Access top-tier benefits designed to enhance your health, well-being, and financial security.",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function WhatYouWantToDo() {
    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-3xl mx-auto text-center mb-12"
            >
                <h2 className="text-2xl sm:text-3xl font-medium text-black">Whatever you want to do</h2>
                <p className="mt-4 text-sm sm:text-base text-[#4a5565] leading-relaxed">
                    No matter your experience level, all SST employees get opportunities, support, and resources to
                    pursue their career goals, balance work-life commitments, and strengthen their health and
                    well-being.
                </p>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-5"
            >
                {CARDS.map((card) => (
                    <motion.div
                        key={card.title}
                        variants={itemVariants}
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-white shadow-[0px_2px_7.5px_rgba(0,0,0,0.19)] flex flex-col"
                    >
                        <div className="relative aspect-[470/263] w-full overflow-hidden">
                            <Image
                                src={card.image}
                                alt={card.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-5 text-center">
                            <h3 className="text-md font-semibold font-medium text-black">{card.title}</h3>
                            <p className="mt-2 text-sm font-light ">{card.description}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
