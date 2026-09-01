"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const WhyjoinSST = () => {
  // Header animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  // Container for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <section className="bg-gray-50 py-16 px-4 overflow-x-hidden overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-6 md:mb-10 -mt-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={headerVariants}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              Join our team
            </p>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 px-2">
            Why join <span className="gradient-text">SST?</span>
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg md:text-lg px-2">
            No matter your experience level, all SST employees get opportunities,
            support, and resources to pursue their career goals, balance work-life
            commitments, and strengthen their health and well-being.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Career Development */}
          <motion.div
            className="group text-center"
            variants={cardVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
          >
            <div className="relative w-full h-80 mb-6 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/CareerPage/CareerDev.png"
                alt="Career development"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw,
                        (max-width: 1200px) 33vw,
                        25vw"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Career development
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Grow your skills with continuous learning opportunities and
              AI-powered strategies to boost your career.
            </p>
          </motion.div>

          {/* Flex Work */}
          <motion.div
            className="group text-center"
            variants={cardVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
          >
            <div className="relative w-full h-80 mb-6 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/CareerPage/Flexwork.png"
                alt="Flex work"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw,
                        (max-width: 1200px) 33vw,
                        25vw"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Flex work</h3>
            <p className="text-gray-600 leading-relaxed">
              Enjoy flexible work options tailored to support both productivity
              and work-life balance.
            </p>
          </motion.div>

          {/* World-class Benefits */}
          <motion.div
            className="group text-center"
            variants={cardVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
          >
            <div className="relative w-full h-80 mb-6 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/CareerPage/ClassBenifits.png"
                alt="World-class benefits"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw,
                        (max-width: 1200px) 33vw,
                        25vw"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              World-class benefits
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Access top-tier benefits designed to enhance your health,
              well-being, and financial security.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyjoinSST;
