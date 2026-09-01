import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import arrow from "../../assets/SSTPartner/arrow.svg";
import Image from "next/image";

const Success = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Button animation variants
  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.3,
      },
    },
    hover: {
      scale: 1.05,
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  // Arrow animation variants
  const arrowVariants = {
    hover: {
      x: 5,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  // Text animation variants
  const textVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className=" items-center justify-center px-2 sm:px-4 py-4 sm:py-4 md:py-8 overflow-x-hidden">
      <div className="max-w-8xl mx-auto">
        {/* Main Content Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Section */}
          <motion.div className="text-center px-8" variants={textVariants}>
            <h1 className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-8">
              Driving Business Success with{" "}
              <span className="gradient-text"> Finance</span>
            </h1>
          </motion.div>

          {/* Video Section */}
          <motion.div
            className="px-2 sm:px-4 md:px-6 lg:px-8 mb-4 sm:mb-8 md:mb-10 flex justify-center relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div
              className="relative cursor-pointer w-full max-w-7xl"
              onClick={handleVideoClick}
            >
              <video
                ref={videoRef}
                preload="none"
                loop
                muted
                className="w-full h-auto rounded-xl sm:rounded-2xl md:rounded-3xl object-cover"
                style={{
                  minHeight: "200px",
                  maxHeight: "500px",
                  aspectRatio: "16/9",
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src="/videoBg.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className={`bg-black bg-opacity-50 rounded-full p-2 sm:p-3 md:p-4 transition-opacity duration-300 ${
                    isPlaying ? "opacity-0" : "opacity-100"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isPlaying ? (
                      // Pause icon
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    ) : (
                      // Play icon
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Content Section */}
          <motion.div
            className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-16 2xl:px-25  lg:pb-5 mr-0 sm:mr-1"
            variants={textVariants}
          >
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-3 lg:space-y-0 lg:space-x-6">
              {/* Left Side - Growth Badge and Text */}
              <motion.div
                className="flex flex-col sm:flex-row items-center sm:items-center space-y-0 sm:space-y-0 sm:space-x-3 md:space-x-4 w-full lg:w-auto text-center sm:text-left"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="text-[#A7CAFF] px-3 py-1 text-base sm:text-lg font-normal whitespace-nowrap rounded-lg sm:bg-transparent ">
                  Growth
                </div>
                <div className="max-w-full  sm:max-w-md lg:max-w-lg xl:max-w-xl">
                  <p className="text-gray-600 text-md sm:text-base md:text-md leading-relaxed">
                    We design financial solutions tailored to your goals,{" "}
                    <br className="hidden sm:block" /> helping your business
                    thrive.
                  </p>
                </div>
              </motion.div>

              {/* Right Side - CTA Button - Centered on mobile */}
              <div className="flex w-full sm:w-auto justify-center lg:justify-end">
                <motion.button
                  className="bg-[#A7CAFF] text-white px-4  sm:px-4 md:px-6 py-3 sm:py-2 text-sm sm:text-base md:text-md rounded-lg font-medium flex items-center gap-3 hover:bg-[#96B8FF] transition-colors w-full sm:w-auto max-w-xs sm:max-w-none justify-center shadow-lg hover:shadow-xl"
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <span>Explore More</span>
                  <motion.div
                    variants={arrowVariants}
                    className="flex-shrink-0"
                  >
                    <Image
                      src={arrow}
                      alt="arrow icon"
                      width={12}
                      height={12}
                    />
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
