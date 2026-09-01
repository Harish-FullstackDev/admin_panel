import React from "react";
import { motion } from "framer-motion";

const AboutCareer = () => {
  const words =
    "Uncover opportunities that align with your purpose and potential.".split(
      " "
    );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        delay: 0.2,
        ease: "easeOut",
      },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: "easeOut" },
    },
  };

  const textContainerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05, delayChildren: 0.3 },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <motion.div
        className="px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 bg-[rgba(167,202,255,0.13)] overflow-x-hidden overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center">
            {/* Career Badge */}
            <motion.div
              className="flex items-center justify-center mb-1 lg:mb-0"
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
            >
              <span className="text-blue-500 mr-2 text-sm sm:text-base">✦</span>
              <p className="text-gray-600 text-xs sm:text-sm font-medium tracking-wider uppercase">
                Job Listing
              </p>
            </motion.div>

            {/* Main Heading */}

            <motion.h1
              className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-2"
              variants={headerVariants}
            >
              Turn Your Passion into a {" "}
              <span className="gradient-text">Career</span>{" "}
            </motion.h1>

            {/* Animated Text Content */}
            <motion.div
              className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto"
              variants={textContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  className="inline-block mr-1 sm:mr-1.5"
                  variants={wordVariants}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AboutCareer;
