"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import background from "../../assets/aboutus/Aboutus_bg_lineart.svg";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const fadeAndScaleUp = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -60, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 60, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: "backOut" },
  },
};

const lineVariants = {
  hidden: { height: 0, y: 100 },
  visible: {
    height: "100%",
    y: 0,
    transition: { duration: 1.8, ease: "easeInOut" },
  },
};

const OurStorySection = () => {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden overflow-x-hidden ">
      {/* Background */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Image
          src={background}
          alt="Background Waves"
          fill
          sizes="100vw"
          priority
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeAndScaleUp}
        >
          <div className="flex items-center justify-center gap-2 ">
            <motion.div
              className="text-blue-500 text-base sm:text-lg"
              initial={{ rotate: -90, opacity: 0 }}
              whileInView={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              ✦
            </motion.div>
            <span className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              Our Story
            </span>
          </div>
          <h2 className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-8">
            From Local Expertise to{" "}
            <span className="gradient-text bg-clip-text text-transparent">
              Global Impact
            </span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-4xl mx-auto">
            Support Studio Technologies (SST) began with a vision to bring
            world-class enterprise solutions to businesses of all sizes.
            Starting as a specialized SAP implementation partner in Pondicherry,
            we have grown into a global player with a strong presence across the
            Middle East. Our journey has been guided by a commitment to
            innovation, customer success, and delivering value that goes beyond
            technology.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full">
            {/* Glow */}
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-5 bg-blue-200/10 blur-xl" />

            {/* Main line */}
            <motion.div
              variants={lineVariants}
              className="relative mx-auto w-[2px] h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-cyan-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
          </div>

          {/* Timeline container with stagger effect */}
          <motion.div
            className="space-y-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {/* First milestone (Left) */}
            <motion.div
              className="relative flex items-center"
              variants={fadeLeft}
            >
              <div className="w-1/2 pr-8 md:pr-15 text-right">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Founded in Pondicherry
                </h3>
                <p className="text-gray-600">with a focus on SAP services</p>
              </div>
              {/* Center circle */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-3 h-3 gradient-primary rounded-full"
                variants={dotVariants}
              >
                {/* Glow */}
                {/* <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-70 scale-150" /> */}
              </motion.div>
              {/* Line from the circle */}
              <div className="absolute top-1/2 right-1/2 w-6 md:w-10 h-[2px] bg-gradient-to-r from-blue-500 to-transparent" />
              {/* Year */}
              <div className="w-1/2 pl-10 md:pl-15">
                <span className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  2020
                </span>
              </div>
            </motion.div>

            {/* Second milestone (Right) */}
            <motion.div
              className="relative flex items-center"
              variants={fadeRight}
            >
              {/* Year */}
              <div className="w-1/2 pr-10 md:pr-15 flex justify-end">
                <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-400 via-blue-500 bg-clip-text text-transparent">
                  2021
                </span>
              </div>
              {/* Center circle */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-3 h-3 gradient-primary rounded-full"
                variants={dotVariants}
              >
                {/* Glow */}
                {/* <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-70 scale-150" /> */}
              </motion.div>
              {/* Line from the circle */}
              <div className="absolute top-1/2 left-1/2 w-6 md:w-10 h-[2px] bg-gradient-to-r from-transparent to-blue-500" />
              <div className="w-1/2 pl-8 md:pl-15">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Expanded to Middle East
                </h3>
                <p className="text-gray-600">
                  Establishing offices in Oman, UAE, Qatar, KSA, and Kuwait
                </p>
              </div>
            </motion.div>

            {/* Third milestone (Left) */}
            <motion.div
              className="relative flex items-center"
              variants={fadeLeft}
            >
              <div className="w-1/2 pr-8 md:pr-15 text-right">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  SAP-Certified Partner
                </h3>
                <p className="text-gray-600">
                  Recognized for excellence in enterprise solutions
                </p>
              </div>
              {/* Center circle */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-3 h-3 gradient-primary rounded-full"
                variants={dotVariants}
              >
                {/* Glow */}
                {/* <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-70 scale-150" /> */}
              </motion.div>
              {/* Line from the circle */}
              <div className="absolute top-1/2 right-1/2 w-6 md:w-10 h-[2px] bg-gradient-to-r from-blue-500 to-transparent" />
              {/* Year */}
              <div className="w-1/2 pl-10 md:pl-15">
                <span className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  2023
                </span>
              </div>
            </motion.div>

            {/* Fourth milestone (Right) */}
            <motion.div
              className="relative flex items-center"
              variants={fadeRight}
            >
              {/* Year */}
              <div className="w-1/2 pr-10 md:pr-15 flex justify-end">
                <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-400 via-blue-500 bg-clip-text text-transparent">
                  2024
                </span>
              </div>
              {/* Center circle */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-3 h-3 gradient-primary rounded-full"
                variants={dotVariants}
              >
                {/* Glow */}
                {/* <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-70 scale-150" /> */}
              </motion.div>
              {/* Line from the circle */}
              <div className="absolute top-1/2 left-1/2 w-6 md:w-10 h-[2px] bg-gradient-to-r from-transparent to-blue-500" />
              <div className="w-1/2 pl-8 md:pl-15">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Diversified Expertise
                </h3>
                <p className="text-gray-600">
                  Extending services into Microsoft, Salesforce, Cloud, and
                  Emerging Tech
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OurStorySection;

