import React, { useState } from "react";
import { motion } from "framer-motion";
import Outline from "../../assets/trustcenter/outline.svg"; 
import data from "../../assets/trustcenter/data.svg";
import Monitoring from "../../assets/trustcenter/Monitoring.svg";
import Image from "next/image";

const SecuritySection = () => {
  const [selectedItem, setSelectedItem] = useState("system");

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
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

  const featureItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        delay: 0.3,
      },
    },
  };
   // Title animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.4,
      },
    },
  };

  const numberVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.2,
      },
    },
  };

  
  // Badge animation variants
  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.2,
      },
    },
  };

  // Function to get the current icon and number based on selected state
  const getCurrentDisplayData = () => {
    switch (selectedItem) {
      case "system":
        return { icon: Outline, number: "24/7" };
      case "monitoring":
        return { icon: Monitoring, number: "5/7" };
      case "encryption":
        return { icon: data, number: "6/6" };
      default:
        return { icon: Outline, number: "24/7" };
    }
  };

  const currentData = getCurrentDisplayData();

  return (
    <motion.div
      className="p-6 lg:p-8 rounded-lg mx-auto max-w-7xl overflow-x-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      viewport={{ once: true, amount: 0.3 }}
      style={{
        margin: "1rem sm:2rem lg:3rem",
      }}
    >
      {/* Header */}
      <motion.div 
                 className="flex items-center justify-center lg:justify-start gap-2 mb-1"
                 variants={badgeVariants}
                 initial="hidden"
                 whileInView="visible"
                 viewport={{ once: true }}
               >
                 <span className="text-blue-500 text-base sm:text-lg">✦</span>
                   <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
                     Security in action
                   </p>
               </motion.div>

      {/* Main Title */}  
        <motion.h2 
                  className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 text-center lg:text-left"
                  variants={titleVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  Security that Works 
                  <span className="gradient-text"> for You</span>
                </motion.h2>
      
      {/* Mobile Layout (Icon at top, features at bottom) */}
      <div className="flex flex-col lg:hidden">
        {/* Mobile Icon Section - Top */}
        <div className="flex items-center justify-center mb-6">
          <motion.div
            className="relative w-32 h-32 sm:w-40 sm:h-40"
            variants={imageVariants}
            whileHover={{
              scale: 1.05,
              rotate: 2,
              transition: { duration: 0.3 },
            }}
          >
            <Image
              src={currentData.icon}
              alt="Security Icon"
              className="text-blue-600"
              fill
              style={{ objectFit: "contain" }}
              key={selectedItem || "default"}
            />
          </motion.div>
        </div>

        {/* Mobile Content Section - Bottom */}
        <motion.div className="flex-1" variants={containerVariants}>
          {/* Dynamic Number Section */}
          <div className="mb-6">
            <motion.h3
              className="border-b border-gray-400 text-2xl  font-bold text-gray-900 mb-4 text-left"
              variants={numberVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              key={currentData.number}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {currentData.number}
            </motion.h3>

            {/* Feature List */}
            <motion.div className="space-y-3" variants={containerVariants}>
              <motion.div
                className="border-b border-gray-400 pb-2 cursor-pointer"
                variants={featureItemVariants}
                whileHover={{
                  x: 10,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedItem("system")}
              >
                <motion.span 
                  className={`text-sm transition-colors duration-300 ease-out ${
                    selectedItem === "system" ? "font-bold" : "font-medium"
                  }`}
                  animate={{
                    color: selectedItem === "system" ? "#000000" : "#4B5563"
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  System Uptime
                </motion.span>
              </motion.div>

              <motion.div
                className="border-b border-gray-400 pb-2 cursor-pointer"
                variants={featureItemVariants}
                whileHover={{
                  x: 10,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedItem("monitoring")}
              >
                <motion.span 
                  className={`text-sm transition-colors duration-300 ease-out ${
                    selectedItem === "monitoring" ? "font-bold" : "font-medium"
                  }`}
                  animate={{
                    color: selectedItem === "monitoring" ? "#000000" : "#4B5563"
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  Monitoring Coverage
                </motion.span>
              </motion.div>

              <motion.div
                className="pb-2 border-b border-gray-400 cursor-pointer"
                variants={featureItemVariants}
                whileHover={{
                  x: 10,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedItem("encryption")}
              >
                <motion.span 
                  className={`text-sm transition-colors duration-300 ease-out ${
                    selectedItem === "encryption" ? "font-bold" : "font-medium"
                  }`}
                  animate={{
                    color: selectedItem === "encryption" ? "#000000" : "#4B5563"
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  Data Encryption
                </motion.span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Desktop/Laptop Layout (Original side-by-side layout) */}
      <div className="hidden lg:flex lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Content */}
        <motion.div className="flex-1 lg:mr-8" variants={containerVariants}>
          {/* Dynamic Number Section */}
          <div className="mb-6 sm:mb-8">
            <motion.h3
              className="border-b border-gray-400 text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6"
              variants={numberVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              key={currentData.number}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {currentData.number}
            </motion.h3>

            {/* Feature List */}
            <motion.div className="space-y-3 sm:space-y-4" variants={containerVariants}>
              <motion.div
                className="border-b border-gray-400 pb-2 sm:pb-3 cursor-pointer"
                variants={featureItemVariants}
                whileHover={{
                  x: 10,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedItem("system")}
              >
                <motion.span 
                  className={`text-sm lg:text-base transition-colors duration-300 ease-out ${
                    selectedItem === "system" ? "font-bold" : "font-medium"
                  }`}
                  animate={{
                    color: selectedItem === "system" ? "#000000" : "#374151"
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  System Uptime
                </motion.span>
              </motion.div>

              <motion.div
                className="border-b border-gray-400 pb-2 sm:pb-3 cursor-pointer"
                variants={featureItemVariants}
                whileHover={{
                  x: 10,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedItem("monitoring")}
              >
                <motion.span 
                  className={`text-sm sm:text-base transition-colors duration-300 ease-out ${
                    selectedItem === "monitoring" ? "font-bold" : "font-medium"
                  }`}
                  animate={{
                    color: selectedItem === "monitoring" ? "#000000" : "#374151"
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  Monitoring Coverage
                </motion.span>
              </motion.div>

              <motion.div
                className="pb-2 sm:pb-3 border-b border-gray-400 cursor-pointer"
                variants={featureItemVariants}
                whileHover={{
                  x: 10,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedItem("encryption")}
              >
                <motion.span 
                  className={`text-sm sm:text-base transition-colors duration-300 ease-out ${
                    selectedItem === "encryption" ? "font-bold" : "font-medium"
                  }`}
                  animate={{
                    color: selectedItem === "encryption" ? "#000000" : "#374151"
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  Data Encryption
                </motion.span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Icon */}
        <div className="flex-shrink-0 flex items-center justify-center lg:justify-end">
          <motion.div
            className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48"
            variants={imageVariants}
            whileHover={{
              scale: 1.05,
              rotate: 2,
              transition: { duration: 0.3 },
            }}
          >
            {/* Dynamic SVG Image */}
            <Image
              src={currentData.icon}
              alt="Security Icon"
              className="text-blue-600"
              fill
              style={{ objectFit: "contain" }}
              key={selectedItem || "default"}
            />
          </motion.div>
        </div>
      </div>
    </motion.div> 
  );
};

export default SecuritySection;