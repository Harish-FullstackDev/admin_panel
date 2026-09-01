"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const YourGrowthPartner = () => {
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
          className="text-center mb-8 md:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={headerVariants}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 lg:mb-0 mb-1">
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              Your Growth Partner
            </p>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 px-2">
At SST, we help you shine {" "}
<span className="block sm:hidden"></span>
<span className="gradient-text">your best.</span>
          </h2>

        
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
                src="/CareerPage/Job4.png"
                alt="Career development"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw,
                        (max-width: 1200px) 33vw,
                        25vw"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Unlocking Growth with SAP-Powered Solutions
            </h3>
            <p className="text-gray-600 leading-relaxed">
             Learn how SAP-powered strategies fueled business growth and improved market performance.
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
                src="/CareerPage/Job5.png"
                alt="Flex work"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw,
                        (max-width: 1200px) 33vw,
                        25vw"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">SAP-Powered Customer Loyalty</h3>
            <p className="text-gray-600 leading-relaxed">
            Discover the Impact of SAP-Powered Tailored Experiences on Customer Satisfaction and Retention            </p>
          </motion.div>

          {/* World-class Benefits */}
          <motion.div
            className="group text-center"
            variants={cardVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
          >
            <div className="relative w-full h-80 mb-6 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/CareerPage/JobSST.png"
                alt="World-class benefits"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw,
                        (max-width: 1200px) 33vw,
                        25vw"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
             Streamlining Operations with SAP Automation
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Access Top-Tier SAP Benefits for Health, Well-Being, and Financial Security
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default YourGrowthPartner;
