import React from "react";
import { motion } from "framer-motion";

const resources = [
  {
    name: "Do you care about privacy as much as your customers do?",
    type: "Article",
  },
  { name: "Security and Trust Blogs", type: "Blog" },
  { name: "Privacy Data Sheet", type: "Data Sheet" },
  { name: "How SST Scales Our Secure ERP", type: "Case Study" },
  { name: "Cloud Migration Checklist", type: "Guide" },
];

const QuickResources = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="flex justify-center items-center text-gray-800 overflow-x-hidden">
      <motion.div
        className="w-full max-w-7xl p-4 sm:p-6 lg:p-8 rounded-lg mx-4 sm:mx-6 lg:mx-12 mb-8 sm:mb-12 lg:-mt-7 -mt-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Section Label */}
        <motion.div
          className="flex items-center justify-center lg:justify-start gap-2 mb-1"
          variants={textVariants}
        >
          <motion.span className="text-blue-500 text-base sm:text-lg">✦</motion.span>
          <p className="text-xs sm:text-xs font-medium tracking-widest uppercase">
            Quick resources
          </p>
        </motion.div>

        {/* Heading */}
        <motion.div className="mb-4 sm:mb-6" variants={textVariants}>
          <h2 className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 text-center lg:text-left">
            Explore Our{" "}
            <motion.span
              className="gradient-text inline-block gradient-text"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
               Policies & Resources
            </motion.span>
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p
          className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8  leading-relaxed"
          variants={textVariants}
        >
          We believe transparency means giving our clients easy access to the
          information they need. Explore our resources to understand how SST
          protects your enterprise.
        </motion.p>

        {/* Table - Desktop Version */}
        <motion.div
          className="hidden md:block border-t border-gray-200 pt-4"
          variants={containerVariants}
        >
          <div className="grid grid-cols-2 gap-6 lg:gap-10 text-gray-600 text-sm pb-3 font-medium border-b border-gray-200">
            <div className="col-span-1">Document Name</div>
            <div className="col-span-1">Document Type</div>
          </div>

          {resources.map((resource, index) => (
            <motion.div
              key={index}
              className="grid grid-cols-2 gap-6 lg:gap-10 py-4 border-b border-gray-200"
              variants={textVariants}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <a
                href="#"
                className="col-span-1 text-blue-600 hover:underline text-sm lg:text-base"
              >
                {resource.name}
              </a>
              <div className="col-span-1 text-black text-sm lg:text-base">
                {resource.type}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Card Layout - Mobile Version */}
        <motion.div
          className="md:hidden space-y-4"
          variants={containerVariants}
        >
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              variants={textVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <a
                href="#"
                className="block text-blue-600 hover:underline font-medium mb-2 text-sm leading-tight"
              >
                {resource.name}
              </a>
              <div className="text-gray-500 text-xs uppercase tracking-wide">
                {resource.type}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
};

export default QuickResources;
