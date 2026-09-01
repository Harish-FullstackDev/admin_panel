import React from "react";
import Image from "next/image";
import OurCommitmentBg from "../../assets/trustcenter/OurCommitment.svg";
import { motion } from "framer-motion";

const OurCommitment = () => {
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 lg:mb-4 mb-7 overflow-x-hidden">
      <div className="relative w-full rounded-4xl overflow-hidden max-w-7xl lg:ml-25">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={OurCommitmentBg}
            alt="Our Commitment Background"
            fill
            className="object-cover object-right"
            priority
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-10 lg:py-10">
          <div className="max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
            {/* Tag */}
            <motion.div
              className="mb-2 flex items-center justify-center lg:justify-start space-x-2"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.span className="text-blue-500 text-base sm:text-lg ">✦</motion.span>
              <p className="text-xs sm:text-sm font-medium tracking-widest  text-white  uppercase">
                OUR COMMITMENT
              </p>
            </motion.div>
            
            {/* Main Heading */}
            <motion.h2 
              className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 text-center lg:text-left  text-white "
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              Trust is Our {" "}
              <span className="gradient-text">
              Greatest  Asset
              </span>
            </motion.h2>

            {/* Description */}
            <motion.p 
              className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-prose"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              Every successful transformation begins with trust. That's why we
              embed integrity, reliability, and accountability into every
              solution. By making security and transparency a core part of our
              services, we enable enterprises to focus on what matters most:
              growth and innovation.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurCommitment;