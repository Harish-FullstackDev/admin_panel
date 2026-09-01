"use client";
import React from "react";
import { motion } from "framer-motion";

const EnterpriseCards = () => {
  // Professional fade-in animation variants
  const fadeInUp = {
    initial: { 
      opacity: 0, 
      y: 24 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 0.03, 0.26, 1], // Professional easing curve
      }
    }
  };

  // Staggered container for sequential animations
  const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  };

  // Subtle hover effect for cards
  const cardHover = {
    scale: 1.008,
    y: -2,
    transition: { 
      duration: 0.25,
      ease: "easeOut"
    }
  };

  // Professional statistic counter animation
  const statisticVariants = {
    initial: { 
      opacity: 0, 
      x: -16 
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      }
    }
  };

  // Subtle text animation
  const textReveal = {
    initial: { 
      opacity: 0, 
      y: 12 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-5 p-4 sm:p-6 lg:p-8 overflow-x-hidden overflow-hidden">
      <motion.div
        className="flex flex-col lg:flex-row gap-6 lg:gap-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Main Information Card - 60% width */}
        <motion.div
          className="lg:w-3/5 w-full"
          variants={fadeInUp}
          whileHover={cardHover}
        >
          <div className="bg-[#CBE3F0] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 lg:p-4 h-full flex flex-col justify-center items-center min-h-[380px] lg:min-h-[380px] text-center overflow-hidden relative">
            {/* Subtle background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <motion.div
              className="mb-6 lg:mb-8 relative z-10"
              variants={textReveal}
            >
              <motion.div 
                className="flex items-center justify-center space-x-2 text-gray-400 text-sm mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <motion.span 
                  className="text-blue-500"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  ✦
                </motion.span>
                <p className="text-black text-sm font-medium tracking-wider uppercase">
                  Who We Are
                </p>
              </motion.div>

              <motion.h1 
                className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              >
                Driving Intelligent {" "}
                <motion.span 
                  className="gradient-text bg-clip-text text-transparent "
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                   Transformation
                </motion.span>
              </motion.h1>
            </motion.div>

            <motion.div
              className="text-gray-700 text-base sm:text-lg leading-relaxed space-y-4 lg:space-y-6 relative z-10"
              variants={textReveal}
              transition={{ delay: 0.6 }}
            >
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                Support Studio Technologies (SST) is a global SAP-certified
                partner enabling organizations to embrace innovation and achieve
                sustainable growth. With expertise across SAP, Microsoft,
                Salesforce, Cloud, and Emerging Technologies, we design
                transformation strategies that connect people, processes, and
                technology to deliver measurable results.
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        {/* Statistics Card - 40% width */}
        <motion.div
          className="lg:w-2/5 w-full"
          variants={fadeInUp}
          whileHover={cardHover}
        >
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 lg:p-10 h-full flex flex-col justify-center relative overflow-hidden">
            {/* Subtle accent line */}
            
            <motion.div
              className="space-y-8 lg:space-y-10"
              variants={staggerContainer}
            >
              {/* Statistic 1 */}
              <motion.div
                className="flex items-start gap-6 group"
                variants={statisticVariants}
                whileHover={{ 
                  x: 4, 
                  transition: { duration: 0.2, ease: "easeOut" } 
                }}
              >
                <div className="w-32 flex-shrink-0">
                  <motion.div
                    className="text-2xl sm:text-2xl lg:text-2xl font-bold text-gray-800"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.9,
                      duration: 0.4,
                      ease: "easeOut"
                    }}
                  >
                    210+
                  </motion.div>
                  <motion.div 
                    className="text-base font-medium text-gray-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                  >
                    Projects Delivered
                  </motion.div>
                </div>

                <div className="border-l-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-300 pl-4 mt-2">
                  <motion.div 
                    className="text-base text-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.3 }}
                  >
                    Proven track record of successful implementations
                  </motion.div>
                </div>
              </motion.div>

              {/* Statistic 2 */}
              <motion.div
                className="flex items-start gap-6 group"
                variants={statisticVariants}
                whileHover={{ 
                  x: 4, 
                  transition: { duration: 0.2, ease: "easeOut" } 
                }}
              >
                <div className="w-32 flex-shrink-0">
                  <motion.div
                    className="text-2xl sm:text-2xl lg:text-2xl font-bold text-gray-800"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 1.1,
                      duration: 0.4,
                      ease: "easeOut"
                    }}
                  >
                    300+
                  </motion.div>
                  <motion.div 
                    className="text-base font-medium text-gray-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.3 }}
                  >
                    Global Resources
                  </motion.div>
                </div>
                <div className="border-l-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-300 pl-4 mt-2">
                  <motion.div 
                    className="text-base text-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3, duration: 0.3 }}
                  >
                    Skilled professionals across diverse enterprise domains
                  </motion.div>
                </div>
              </motion.div>

              {/* Statistic 3 */}
              <motion.div
                className="flex items-start gap-6 group"
                variants={statisticVariants}
                whileHover={{ 
                  x: 4, 
                  transition: { duration: 0.2, ease: "easeOut" } 
                }}
              >
                <div className="w-32 flex-shrink-0">
                  <motion.div
                    className="text-2xl sm:text-2xl lg:text-2xl font-bold text-gray-800"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 1.3,
                      duration: 0.4,
                      ease: "easeOut"
                    }}
                  >
                    8+
                  </motion.div>
                  <motion.div 
                    className="text-base font-medium text-gray-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.3 }}
                  >
                    Quality Awards
                  </motion.div>
                </div>
                <div className="border-l-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-300 pl-4 mt-2">
                  <motion.div 
                    className="text-base text-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.3 }}
                  >
                    Recognized for delivering excellence and innovation
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EnterpriseCards;