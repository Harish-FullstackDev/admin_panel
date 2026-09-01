import React from "react";
import { motion } from "framer-motion";

export default function ContentFeatureSection({
  headText,
  title,
  description,
  imageSrc,
  reverse = false,
}) {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const textVariants = {
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

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 my-12">
      {/* Only render headText section if headText is provided */}
      {headText && (
        <motion.div
          className="text-center mt-16 mb-16 uppercase"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h1
            className="gradient-text text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight"
            variants={textVariants}
          >
            {headText}
          </motion.h1>
        </motion.div>
      )}

      <motion.div
        className="flex items-center justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <motion.div
          className={`w-full rounded-3xl overflow-hidden ${
            reverse ? "" : "bg-[#F5FAFF]"
          }`}
          variants={itemVariants}
        >
          <div
            className={`flex flex-col lg:flex-row ${
              reverse ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Content Section */}
            <motion.div
              className="lg:flex-[0.6] p-6 lg:p-12 flex flex-col justify-center"
              variants={itemVariants}
            >
              <motion.h1
                className="text-3xl lg:text-4xl font-bold text-black mb-4 lg:mb-6 leading-tight"
                variants={itemVariants}
              >
                {title}
              </motion.h1>

              <motion.p
                className="text-gray-600 text-lg mb-6 lg:mb-8 leading-relaxed"
                variants={itemVariants}
              >
                {description}
              </motion.p>
            </motion.div>

            {/* Image Section */}
            <motion.div
              className="lg:flex-[0.4] flex flex-col justify-center bg-cover bg-center rounded-3xl m-2 lg:m-4 min-h-[250px]"
              style={{ backgroundImage: `url(${imageSrc})` }}
              variants={itemVariants}
            ></motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
