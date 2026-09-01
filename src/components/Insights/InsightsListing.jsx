"use client";

import React, { useMemo, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import Hero from "@/components/Insights/Hero";
import HeroText from "@/components/Insights/HeroText";

export default function InsightsListing({
  items,
  basePath,
  backgroundImage,
  subtitle,
  title,
  description,
  highlights,
  emptyStateText = "No entries found yet. Please check back soon.",
}) {
  const router = useRouter();
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -80]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.5],
    [1, 0.85]
  );

  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.category))];
    return ["All", ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <div className="relative -mt-[64px] lg:-mt-[68px] h-[680px] sm:h-[200vh]">
        <div className="sticky top-0 h-[340px] sm:h-screen z-0">
          <Hero backgroundImage={backgroundImage} />
        </div>

        <div className="absolute inset-x-0 top-0 h-[340px] sm:h-screen z-[5]">
          <HeroText subtitle={subtitle} title={title} description={description} />
        </div>
      </div>

      <motion.main
        ref={containerRef}
        style={{
          y: contentY,
          opacity,
        }}
        className="relative z-10 -mt-[340px] sm:-mt-[100vh] bg-gradient-to-b from-sky-50 via-white to-slate-100 flex-grow w-full mx-auto px-6 py-12 md:p-16 md:pb-30"
      >

        {/* Category Filter Chips */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-none text-sm border transition-all cursor-pointer ${activeCategory === cat
                  ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-neutral-200 rounded-none p-8 bg-white">
            <p className="text-slate-600 text-lg">{emptyStateText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                onClick={() => router.push(`${basePath}/${item.slug}`)}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 20,
                }}
                className="cursor-pointer"
              >

                <CardContainer className="inter-var w-full h-full" containerClassName="py-0 flex-grow">
                  <CardBody className="bg-[#F5F6F6] relative shadow-md hover:shadow-2xl group/card dark:hover:shadow-2xl dark:hover:shadow-blue-500/[0.1] dark:bg-neutral-900 dark:border-neutral-850 border-neutral-100 w-full h-full rounded-none p-6 border flex flex-col justify-between">

                    <div className="flex flex-col flex-grow">
                      <CardItem translateZ="0" className="w-full mt-4 relative">
                        <img
                          src={item.cover_image}
                          className="h-60 w-full object-cover group-hover/card:shadow-xl"
                          alt={item.title}
                        />

                        {/* <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-500/90 text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                          {item.type}
                        </span> */}
                      </CardItem>

                      <CardItem
                        translateZ="0"
                        className="text-lg  text-neutral-900 dark:text-neutral-100 mt-4 line-clamp-2"
                      >
                        {item.title}
                      </CardItem>
                      <CardItem
                        translateZ="0"
                        className="text-xs font-semibold text-blue-500 uppercase tracking-wider block mt-4 mb-2"
                      >
                        {item.category}
                      </CardItem>
                      <CardItem
                        translateZ="0"
                        className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2"
                      >
                        {item.summary}
                      </CardItem>
                    </div>
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-850">
                      <CardItem translateZ={20} className="text-xs text-neutral-500">
                        {new Date(item.publish_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </CardItem>
                      <CardItem
                        translateZ={20}
                        as="div"
                        className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover/card:bg-blue-50 group-hover/card:text-black transition-all duration-350 transform group-hover/card:translate-x-0.5"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              </motion.div>
            ))}
          </div>
        )}
      </motion.main>
      <Footer />
    </div>
  );
}
