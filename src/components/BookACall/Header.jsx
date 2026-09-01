import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "../Navbar/Navbar";

const Header = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.6,
        delayChildren: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const titleVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const subtitleVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* Main Header Section */}
      <div className="relative min-h-screen sm:min-h-[75vh] w-full overflow-hidden">
        {/* Background Image with Next.js Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/BookAcall/bookacall.png"
            alt="Header Background"
            fill
            priority
            className="object-cover object-center"
            quality={100}
          />
         
        </div>

        {/* Content Container */}
        <div className="relative z-30 min-h-screen sm:min-h-[75vh] flex flex-col">
          {/* Navbar */}
          <div className="flex-shrink-0">
            <Navbar />
          </div>

          {/* Main Content - Centered with proper spacing */}
          <div className="flex-1 lg:-mt-60 -mt-110  mb-10 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-0">
            <motion.div
              className="max-w-6xl w-full text-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Main Title */}
              <motion.h1
                variants={titleVariants}
                className="text-white
                     text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl
                     font-normal tracking-wide leading-tight
                     drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]
                     max-w-4xl mx-auto mb-4 sm:mb-6"
              >
                Contact our sales team
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={subtitleVariants}
                className="text-white/95 
                  text-base sm:text-lg md:text-xl lg:text-lg
                  max-w-3xl mx-auto leading-relaxed
                  drop-shadow-lg font-light px-2 sm:px-0"
              >
                If you need our help, have questions about how to use the platform or are experiencing technical difficulties, please do not hesitate to contact us.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;