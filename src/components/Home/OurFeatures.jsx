import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineArrowUpRight } from "react-icons/hi2";
import Image from "next/image";
import SAP from "../../assets/Home/ourFutureIcons/sap-logo-svg.svg";
import {
  modulesData,
  featuresData,
  featureText,
} from "../Constants/Home/OurFeatures";
 
const Feature = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
 
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );
 
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
 
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
 
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
 
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };
 
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };
 
  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };
 
  return (
    <div
      ref={sectionRef}
      className=" relative overflow-hidden bg-white overflow-x-hidden "
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        {/* Header Section */}
        <motion.div
          className="text-center  mb-10"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.div
            className="flex items-center justify-center gap-2"
            variants={textVariants}
          >
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              OUR Feature
            </p>
          </motion.div>
 
          <motion.h1
            className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-2"
            variants={textVariants}
          >
            Transform Your
            <span className="gradient-text"> Enterprise</span>
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            SAP solutions unlock efficiency, transparency, and intelligence
            across every business function. We bring these capabilities together
            to accelerate enterprise transformation.
          </motion.p>
        </motion.div>
 
        {/* Main Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {/* Hero Card */}
          <motion.div className="lg:col-span-8" variants={itemVariants}>
            <motion.div
              className="h-full relative overflow-hidden"
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
            >
              {/* Main card — gradient border wrapper + inner card */}
              <div className="h-full relative overflow-hidden">
                <div className="rounded-2xl p-[1.5px] bg-gray-200 shadow-[0_6px_24px_rgba(45,142,197,0.08)]">
                  <div className="h-full md:h-133 bg-white rounded-2xl p-8 relative overflow-hidden shadow-sm  transition-shadow duration-500">
                    {/* Floating gradient orbs */}
                    <motion.div
                      className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gray-100 opacity-50 blur-3xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gray-50 opacity-40 blur-2xl"
                      animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
 
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6 gap-4">
                        {/* Left side (icon + text) */}
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="relative flex-shrink-0">
                            <motion.div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-white/60 backdrop-blur-sm">
                              <Image
                                src={SAP}
                                alt="SAP"
                                className="w-20 h-20 sm:w-32 sm:h-32"
                              />
                            </motion.div>
                          </div>
                          <div className="flex-1 min-w-0 mt-2.25">
                            <h3 className="gradient-text text-xl sm:text-2xl font-bold mb-1 tracking-tight">
                              {featureText.heroCard.title}
                            </h3>
                            <p className="text-gray-600 text-sm sm:text-base font-medium">
                              {featureText.heroCard.description}
                            </p>
                          </div>
                        </div>
 
                        {/* Right side button - Hidden on mobile */}
                        <motion.button
                          className="hidden sm:flex flex-shrink-0 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <HiOutlineArrowUpRight className="w-6 sm:h-6 text-blue-500 hover:text-black transition-colors" />
                        </motion.button>
                      </div>
 
                      {/* Enhanced Data Visualization */}
                      <motion.div
                        className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-black font-semibold">
                            Progress Metrics{" "}
                          </h4>
                        </div>
 
                        <div className="space-y-5">
                          {featureText.heroCard.metrics.map((metric, index) => (
                            <motion.div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 text-base font-medium">
                                  {metric.label}
                                </span>
                                <span className="text-black font-bold text-lg">
                                  {metric.value}%
                                </span>
                              </div>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-[#2d8ec5]"
                                  initial={{ width: "0%" }}
                                  animate={{ width: `${metric.value}%` }}
                                />
                              </div>
                              <p className="text-gray-500 text-sm">
                                {metric.subtext}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
 
          {/* Feature Cards - Made Smaller */}
          <div className="lg:col-span-4 space-y-4">
            {featuresData.map((feature, index) => (
              <motion.div key={index} variants={itemVariants} custom={index}>
                <motion.div
                  className="bg-white backdrop-blur-xl rounded-xl border border-gray-200 p-4  transition-all duration-500 shadow-md mb-7"
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gray-100"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={feature.icon}
                      alt={feature.title}
                      width={20}
                      height={20}
                      className="w-10 h-10"
                    />
                  </motion.div>
                  <h3 className="text-black text-base mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
 
        {/* Bottom Feature Grid Heading */}
        <motion.div
          className="text-center lg:mb-12 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.h2
            className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-3"
            variants={textVariants}
          >
            Explore Our Powerful
            <span className="gradient-text"> Core Modules</span>
          </motion.h2>
 
          <motion.p
            className="text-gray-600 text-base max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Discover the enterprise modules that power efficiency, intelligence,
            and growth across your business functions.
          </motion.p>
        </motion.div>
 
        {/* Bottom Feature Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {modulesData.map((module, index) => (
            <motion.div key={index} variants={itemVariants} custom={index}>
              <motion.div
                className="bg-white backdrop-blur-xl rounded-xl border border-gray-200 p-4  transition-all duration-500 shadow-md"
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-100">
                    <Image
                      src={module.icon}
                      alt={module.name}
                      width={24}
                      height={24}
                      className="w-10 h-10 text-[#2d8ec5]"
                    />
                  </div>
                </div>
                <h3 className="text-black text-lg mb-1">
                  {module.name}
                </h3>
                {/* <p className="text-gray-600 text-sm">{module.desc}</p> */}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
 
export default Feature;
 
 