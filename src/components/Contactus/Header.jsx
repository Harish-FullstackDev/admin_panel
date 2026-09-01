import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "../Navbar/Navbar";
import RectangleHeader from "../../../public/SolutionPage/ConsulationBg.png";
 
const ContactHeader = () => {
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
 
  return (
    <div className="text-gray-800 relative overflow-x-hidden overflow-hidden">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="relative h-[55vh] md:h-[75vh] w-full flex flex-col">
          {/* Background Image */}
          <Image
            src={RectangleHeader}
            alt="Contact Background"
            fill  
            priority
            className="object-cover z-0"
          />
 
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 z-10"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))`,
              backgroundBlendMode: "overlay",
            }}
          />
 
          {/* Navbar */}
          <Navbar />
 
          {/* Content - Left Aligned */}
          <div className="flex-1 flex items-start justify-center px-4 sm:px-8 lg:px-16 relative z-20 pt-8 md:pt-16">
            <div className="w-full max-w-5xl">
              <motion.div
                className="text-left"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Title */}
                <motion.h1
                  variants={titleVariants}
                  className="text-white
                     text-[clamp(1.6rem,3vw,2.4rem)]
                     md:text-[clamp(2rem,3.5vw,2.8rem)]
                     lg:text-[clamp(2.4rem,4vw,3.2rem)]
                     xl:text-[clamp(2.8rem,4.5vw,3.6rem)]
                     tracking-wide leading-tight
                     drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]
                     max-w-3xl"
                >
                  Get in touch with us. We're <br />
                  here to assist you.
                </motion.h1>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default ContactHeader;
 