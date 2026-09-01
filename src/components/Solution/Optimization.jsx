import React from 'react';
import Image from 'next/image';
import { motion } from "framer-motion";

function ITServicesLanding() {
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

  // Badge animation variants
  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: 0.2,
        ease: "easeOut",
      },
    },
  };

  // Card animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 80,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Container animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.4,
      },
    },
  };

  // Individual service card variants with different delays
  const serviceCardVariants = (delay = 0) => ({
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        delay: delay,
      },
    },
  });

  return (
    <div className="min-h-[40]  py-10 px-4 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
         
        {/* Hero Section with Motion */}
        <motion.div 
          className="text-center mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Badge with Motion */}
          <motion.div 
            className="inline-flex items-center gap-2"
            variants={badgeVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              OPTIMIZATION
            </p>
          </motion.div>

          {/* Main Title with Motion */}
          <motion.h1 
            className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
           Your Tech,
              <span className="gradient-text"> Our Expertise.</span>
          </motion.h1>

          {/* Subtitle with Motion */}
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            From troubleshooting to advanced IT solutions, we ensure your technology 
            works flawlessly, so you can focus on growing your business.
          </motion.p>
        </motion.div>

        {/* Services Grid with Motion Container */}
        <motion.div 
          className="grid md:grid-cols-3 mb-5 gap-10 items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Network Design Card with Motion */}
          <motion.div 
            className="relative rounded-2xl p-6 shadow-sm h-89 overflow-hidden"
            variants={serviceCardVariants(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Image */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <Image
                src="/SolutionPage/Website.png"
                alt="Website background"
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Content overlay */}
            <div className="relative z-10">
              <motion.h3 
                className="text-xl font-normal text-white mb-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                Network Design and <br />
                Optimization
              </motion.h3>
              
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <motion.button 
                  className="bg-white text-black cursor-pointer mb-15 px-4 py-2 rounded-lg text-sm font-medium  "
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Discover more
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Cloud Solutions Card - Featured with Motion */}
          <motion.div 
            className="rounded-2xl relative overflow-hidden"
            variants={serviceCardVariants(0.4)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Image */}
            <div className="relative">
              {/* Get Started Button - Hidden on mobile, shown on desktop */}
              <motion.div 
                className="justify-center hidden md:flex"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <motion.button 
                  className="bg-[#1D1D1D] rounded-2xl cursor-pointer text-white w-full h-12 sm:h-16 text-lg sm:text-md mb-3 font-medium px-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                </motion.button>
              </motion.div>

              <motion.div
                className="w-full aspect-square md:aspect-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Image
                 src="/SolutionPage/Website.png"
                  alt="Website"
                  width={800}
                  height={800}
                  className="object-cover rounded-2xl w-full lg:h-[280px] h-[350px]"
                />
              </motion.div>
              
              {/* Overlay Content */}
              <div className="absolute inset-0 flex flex-col justify-between mt-25 ">
                {/* Content at Bottom */}
                <motion.div 
                  className="text-white"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <h3 className="text-xl font-normal text-center mb-3">
                    Cloud Solutions
                  </h3>
                  <p className="text-white/90 text-sm text-center leading-relaxed max-w-md">
                    Migrate to the cloud with solutions that enhance flexibility and security.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* System Upgrades Card with Motion */}
          <motion.div 
            className="relative rounded-2xl p-6 shadow-sm h-89 overflow-hidden"
            variants={serviceCardVariants(0.6)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Image */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <Image
               src="/SolutionPage/Website.png"
                alt="Website background"
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Content overlay */}
            <div className="relative z-10">
              <motion.h3 
                className="text-xl font-normal text-white mb-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                System Upgrades and <br />
                Maintenance
              </motion.h3>
              
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <motion.button 
                  className="bg-white text-black mb-15 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Discover more
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Get Started Button - Mobile Only (shown after all cards) */}
        <motion.div 
          className="flex justify-center md:hidden mt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.button 
            className="bg-[#1D1D1D] rounded-2xl cursor-pointer text-white w-50 max-w-md h-12 text-lg font-medium px-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default ITServicesLanding;