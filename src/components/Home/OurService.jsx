import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import BGFILL from "../../assets/Home/BGFILL.svg";
import SAP from "../../assets/Home/OurServiceIcons/SAPServices.svg";
import MicroServices from "../../assets/Home/OurServiceIcons/MicroService.svg";
import DesignServices from "../../assets/Home/OurServiceIcons/DesignServices.svg";
import CloudServices from "../../assets/Home/OurServiceIcons/CloudServices.svg";

// Main OurService component
const OurService = () => {
  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const gridItemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 30
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-4 sm:py-8 lg:py-12 ">
      {/* Hero section with content-based height */}
      <div className="relative overflow-hidden mb-8 sm:mb-12 lg:mb-16 sm:-mt-20">
        <div className="absolute inset-0 z-0 w-full h-full">
          <Image
            src={BGFILL}
            alt="Background Waves"
            fill
            sizes="100vw"
            priority
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 w-full py-8 sm:py-24 lg:py-50 px-4 sm:px-24 lg:px-24">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ 
              once: true, 
              amount: 0.3,
              margin: "-100px 0px -100px 0px"
            }}
          >
            {/* Service badge - responsive spacing */}
            <motion.div
              className="flex items-center justify-center mb-4 sm:mb-6"
              variants={textVariants}
            >
              <span className="text-blue-500 mr-2 text-sm sm:text-base">✦</span>
              <p className="text-gray-600 text-xs sm:text-sm font-medium tracking-wider uppercase">
                OUR SERVICES
              </p>
            </motion.div>

            {/* Main heading - responsive text sizes */}
            <motion.h1
              variants={heroVariants}
              className="text-2xl lg:text-6xl xl:text-4xl font-normal leading-tight"
            >
              Future-ready Services for 
              <br className="hidden sm:block" />
              <span className="gradient-text"> Enterprise Growth</span>
            </motion.h1>
          </motion.div>
        </div>
      </div>

      {/* 4-column services grid section */}
      <div className="px-4 sm:px-8 lg:px-24 sm:-mt-30">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ 
            once: true, 
            amount: 0.1,
            margin: "-50px 0px -50px 0px"
          }}
        >
          {/* Grid Item 1 */}
          <motion.div
            className="relative overflow-hidden h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={SAP}
              alt="Service 1"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>

          {/* Grid Item 2 */}
          <motion.div
            className="relative overflow-hidden h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={MicroServices}
              alt="Service 2"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>

          {/* Grid Item 3 */}
          <motion.div
            className="relative overflow-hidden h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={CloudServices}
              alt="Service 3"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>

          {/* Grid Item 4 */}
          <motion.div
            className="relative overflow-hidden h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={DesignServices}
              alt="Service 4"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default OurService;