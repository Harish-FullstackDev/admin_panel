"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
 
const TechnologiesWeMaster = ({ logos }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="pt-16 pb-5 mx-4 rounded-3xl mb-8 overflow-hidden -mt-5 overflow-x-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <h2 className="text-3xl md:text-4xl mb-4">
          <span className="text-black">Technologies</span>{" "}
         <br className="sm:hidden" /> <span className="gradient-text">We Master</span>
        </h2>
        <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto">
          We stay at the forefront of technology, using the latest tools and
          frameworks to build cutting-edge solutions.
        </p>
 
        {/* Scrolling Logo Marquee */}
        <div className="relative w-[300px] sm:w-[500px] md:w-[700px] lg:w-[800px] mx-auto overflow-hidden rounded-full">
          <div className="flex space-x-0 md:space-x-4 animate-scroll">
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center justify-center w-28 md:w-44 h-auto "
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};
 
export default TechnologiesWeMaster;
