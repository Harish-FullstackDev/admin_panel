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
    <div className="relative ">
      {/* Main Header Section */}
      <div className="relative h-[75vh] w-full overflow-hidden overflow-x-hidden">
        {/* Background Image with Next.js Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/sstPartner/sstPartner2.png"
            alt="Header Background"
            fill
            priority
            className="object-cover object-center"
            quality={100}
          />
        </div>

        {/* Content Container */}
        <div className="relative z-30 h-full flex flex-col">
          {/* Navbar */}
          <div className="flex-shrink-0">
            <Navbar />
          </div>

          {/* Main Content - Centered Vertically */}
          <div className="flex-1 flex items-center justify-start px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
            <motion.div
              className="max-w-6xl w-full"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Main Title */}
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
              >
                Unlocking Potential,<br />
                Maximizing Profit.
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={subtitleVariants}
                className="text-white/90 text-lg md:text-lg lg:text-lg
                  max-w-3xl  mb-12
                  drop-shadow-lg font-light"
              >
                Strategic financial services designed to maximize your business's earning
                potential. Empowering growth through innovative solutions.
              </motion.p>

            </motion.div>
          </div>
        </div>
      </div>

    

    
    </div>
  );
};

export default Header;