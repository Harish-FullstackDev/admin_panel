"use client"
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar/Navbar";

const ContentHeader = ({
  backgroundImage,
  backgroundVideo,
  subtitle,
  title,
  description,
  showNavbar = true,
}) => {
  // Helper function to check if the background source is a video
  const isVideo = (src) => {
    if (!src) return false;
    if (typeof src === "string") {
      return src.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/);
    }
    return false;
  };

  // Determine which background to use
  const backgroundSrc = backgroundVideo || backgroundImage;
  const useVideo = isVideo(backgroundSrc);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.6, // Increased for more noticeable sequential effect
        delayChildren: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const subtitleVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
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

  const descriptionVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <>
      <div className="text-gray-800 relative">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="relative h-[75vh] w-full flex flex-col">
            {/* Background Media - Video or Image */}
            {useVideo ? (
              <video
                preload="none"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              >
                <source src={backgroundSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : backgroundSrc ? (
              <Image
                src={backgroundSrc}
                alt="Background"
                fill
                priority
                className="object-cover z-0"
              />
            ) : null}

            {/* Gradient Overlay */}
            <div
              className="absolute inset-0 z-10"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))`,
                backgroundBlendMode: "overlay",
              }}
            />

            {/* Navbar */}
            {showNavbar && <Navbar />}

            {/* Content - Left Aligned */}
            <div className="flex-1 flex items-center px-4 sm:px-8 lg:px-16 relative z-20 -mt-10">
              <div className="w-full max-w-5xl">
                <motion.div
                  className="text-left"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Subtitle - First to animate */}
                  {subtitle && (
                    <motion.p
                      variants={subtitleVariants}
                      className="text-white text-lg"
                    >
                      {subtitle}
                    </motion.p>
                  )}

                  {/* Title - Second to animate */}
                  {title && (
                    <motion.h1
                      variants={titleVariants}
                      className="text-white
      text-[clamp(1.6rem,3vw,2.4rem)]
      md:text-[clamp(2rem,3.5vw,2.8rem)]
      lg:text-[clamp(2.4rem,4vw,3.2rem)]
      xl:text-[clamp(2.8rem,4.5vw,3.6rem)]
      tracking-wide leading-tight
      drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]
      max-w-4xl"
                      dangerouslySetInnerHTML={{ __html: title }}
                    />
                  )}

                  {/* Description - Third to animate */}
                  {description && (
                    <motion.p
                      variants={descriptionVariants}
                      className="mt-4 text-white text-[clamp(0.9rem,1.5vw,1.1rem)] md:text-[clamp(1rem,1.6vw,1.2rem)] lg:text-[clamp(1.1rem,1.7vw,1.3rem)] xl:text-[clamp(1.2rem,1.8vw,1.4rem)]
                        drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                    >
                      {description}
                    </motion.p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentHeader;
