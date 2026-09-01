"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

const STATS = [
    {
        value: "799k",
        description:
            "Getting a job here is very easy, with a few registration steps you immediately get a call from the company you want.",
    },
    {
        value: "200+",
        description:
            "What's interesting about our process is that candidates don't have to wait long for an interview, often within 1 month.",
    },
    {
        value: "9,000+",
        description:
            "No matter how uncertain the market feels, just by registering with us you get discovered quickly.",
    },
];

function parseStatValue(raw) {
    const hasComma = raw.includes(",");
    const numeric = Number(raw.replace(/[^0-9]/g, ""));
    const suffix = raw.replace(/[0-9,]/g, "");
    return { numeric, suffix, hasComma };
}

function CountUpStat({ value }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const [display, setDisplay] = useState("0");
    const { numeric, suffix, hasComma } = parseStatValue(value);

    useEffect(() => {
        if (!isInView) return;
        const controls = animate(0, numeric, {
            duration: 1.4,
            ease: "easeOut",
            onUpdate: (latest) => {
                const rounded = Math.round(latest);
                setDisplay(hasComma ? rounded.toLocaleString() : String(rounded));
            },
        });
        return () => controls.stop();
    }, [isInView, numeric, hasComma]);

    return (
        <p ref={ref} className="font-bold text-[#0d0c22] text-4xl sm:text-5xl">
            {display}
            {suffix}
        </p>
    );
}

export default function WeAreEverywhere() {
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
                    <h2 className="text-2xl sm:text-3xl font-semibold text-[#0d0c22] capitalize">We Are Everywhere</h2>
                    <p className="mt-4 text-sm sm:text-base text-[#3d3d4e]">
                        You might want to hear from some of our team on their unique expeditions
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                    {STATS.map((stat) => (
                        <motion.div
                            key={stat.value}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="flex flex-col items-center text-center gap-2"
                        >
                            <CountUpStat value={stat.value} />
                            <p className="text-sm text-[#0d0c22] leading-relaxed max-w-xs">{stat.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
