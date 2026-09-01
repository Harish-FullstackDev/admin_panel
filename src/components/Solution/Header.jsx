"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import ContentHeader from "../CommonComponents/ContentHeader";

function Header() {
  const badgeVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.6,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.8,
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: 1,
      },
    },
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden overflow-x-hidden">
      {/* Hero Content with Gif Background */}
      <ContentHeader
        backgroundImage="/SolutionPage/Solution.gif"
        subtitle="We are your trusted partners in innovation."
        title="Explore Innovative Solutions Designed to Propel Your Success!"
        description="  Discover unparalleled commitment at Solutions Hub. Our
              comprehensive range of services guarantees cutting-edge solutions,
              personalized support, and success for your business."
      />

      <div className="h-[40px]"></div>

      {/* Centered Section */}
      <div className="flex flex-col items-center justify-center text-center px-4 lg:mb-16 sm:mb-8">
        {/* Small Badge */}
        <motion.div
          className="inline-flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="text-blue-500 text-base sm:text-lg">✦</span>
          <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
            INNOVATIVE TECHNOLOGY
          </p>
        </motion.div>

        {/* Main Heading */}
        <motion.h2
          className="text-2xl sm:text-2xl lg:text-5xl xl:text-4xl font-normal leading-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Transforming Business with
          <br className="block sm:hidden" />
          <span className="gradient-text"> Smart Solutions</span>
        </motion.h2>
      </div>

      {/* Main content container with motion */}
      <motion.div
        className="relative z-10 flex items-center px-4 sm:-mt-8  sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-10 ">
          {/* Left side - Content (60%) */}
          <motion.div
            className="lg:col-span-3 text-left space-y-4"
            variants={contentVariants}
          >
            <motion.div
              className="flex gap-4 sm:gap-6 flex-wrap items-center -ml-5 -mb-2 md:mb-0"
              variants={badgeVariants}
            >
              {/* SAP Logo */}
              <span className=" text-lg font-bold flex items-center gap-2">
                <Image
                  src="/SolutionPage/SAP_Logo.png"
                  alt="SAP Logo"
                  className="w-24 h-auto sm:w-28"
                  width={150}
                  height={150}
                  priority
                />
              </span>

              {/* Divider */}
              <div className="h-10 w-px bg-gray-800 block sm:block"></div>

              {/* Text */}
              <span className="text-xl lg:text-xl sm:text-lg text-gray-700 font-semibold">
                Smart Works
              </span>
            </motion.div>

            <motion.h1
              className="text-2xl sm:text-3xl lg:text-5xl font-normal text-black leading-tight lg:-mt-6"
              variants={contentVariants}
            >
              SAP-Powered AI Business Innovation Models & Customer Experience
              Transformation{" "}
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed text-gray-600"
              variants={contentVariants}
            >
              This case study shows how AI improved efficiency, streamlined
              operations, and enhanced customer experience through automation,
              personalization, and data insights.
            </motion.p>
          </motion.div>

          {/* Right side - Image (40%) */}
          <motion.div
            className="lg:col-span-2 relative group cursor-pointer w-full max-w-sm mx-auto lg:max-w-md"
            variants={imageVariants}
          >
            <div className="aspect-[1/1] w-full rounded-2xl relative overflow-hidden">
              <Image
                src="/SolutionPage/SolutionHeader.png"
                alt="AI Boosted Business Innovation - VR Technology"
                fill
                className="object-contain rounded-2xl "
                // transition-transform duration-700 ease-out group-hover:scale-105
                priority
              />
            </div>

            {/* Subtle glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-50"></div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Header;
