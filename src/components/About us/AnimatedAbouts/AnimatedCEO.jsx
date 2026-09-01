"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import CEOImage from "../../../assets/aboutus/CEO3.png";
import CEOBG from "../../../assets/aboutus/CEOBG.svg";

const AnimatedCEOMessage = () => {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.2,
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      className="relative text-white pt-16 bg-cover bg-center"
      style={{ backgroundImage: `url(${CEOBG.src})` }}
    >
      <div className="w-full px-6 lg:px-20 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <motion.div
          className="lg:col-span-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            className="flex items-center space-x-2 text-gray-300 text-sm mb-2"
            variants={itemVariants}
          >
            <motion.span
              className="text-blue-500"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              ✦
            </motion.span>
            <p className="text-sm font-medium tracking-wider uppercase">
              Message from CEO
            </p>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl font-bold mb-6"
            variants={itemVariants}
          >
            Leading with <span className="gradient-text">Innovation</span>
          </motion.h2>

          <motion.p
            className="text-gray-200 mb-6 leading-loose [br]:block [br]:mb-4"
            variants={itemVariants}
          >
            "The future belongs to enterprises that embrace change fearlessly.
            At SFT, we partner with our clients to accelerate
            <br /> this journey from digitizing processes to adopting cloud,
            analytics, and next-generation enterprise platforms. Our <br />
            strength lies in our people, our partnerships, and our passion for
            excellence. Together, we are not just building <br />
            solutions, we are shaping the future of intelligent enterprises."
          </motion.p>

          <motion.div variants={itemVariants}>
            <p className="font-semibold text-lg">- Krishnakumar</p>
            <p className="text-sm text-gray-300">
              Chief Executive Officer <br />
              Support Studio Technologies
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex justify-center lg:justify-end items-start"
          variants={imageVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <Image
            src={CEOImage}
            alt="CEO"
            className="rounded-xl object-cover shadow-lg"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedCEOMessage;