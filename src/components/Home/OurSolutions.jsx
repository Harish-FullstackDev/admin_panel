import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import SolutionsStackedCards from "./SolutionsStackedCards";
import BGFILL from "../../assets/Home/BGFILL.svg";
import SAP from "../../assets/Home/OurServiceIcons/SAP_Services.svg";
import MicroServices from "../../assets/Home/OurServiceIcons/Micro_Service.svg";
import DesignServices from "../../assets/Home/OurServiceIcons/Design_Services.svg";
import CloudServices from "../../assets/Home/OurServiceIcons/Cloud_Services.svg";

// Main OurSolutions component
const OurSolutions = () => {
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
    <section className="hidden md:flex flex-col py-4 sm:py-8 lg:py-12 ">
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
              className="flex items-center justify-center mt-[-25px] md:mt-[-102px] mb-4 sm:mb-6"
              variants={textVariants}
            >
              <span className="text-blue-500 mr-2 text-sm sm:text-base">✦</span>
              <p className="text-gray-600 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase">

                OUR SOLUTIONS
              </p>
            </motion.div>

            {/* Main heading - responsive text sizes */}
            <motion.h2
              variants={heroVariants}
              className="text-center text-3xl leading-snug px-4 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
            >
              Future-ready Solutions for
              <br className="hidden sm:block" />
              <span className="gradient-text sm:inline"> Enterprise Growth</span>
            </motion.h2>
          </motion.div>

        </div>
      </div>

      {/* 4-column services grid section */}
      <div className="px-0 sm:px-8 lg:px-24 sm:-mt-30">
        {/* Desktop/Tablet Grid View */}
        <motion.div
          className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-8 max-w-7xl mx-auto"
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
            className="relative overflow-hidden h-50 md:h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={SAP}
              alt="Comprehensive SAP Managed Services Icon"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>

          {/* Grid Item 2 */}
          <motion.div
            className="relative overflow-hidden h-50 md:h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={MicroServices}
              alt="Microservices Engineering and Architecture Icon"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>

          {/* Grid Item 3 */}
          <motion.div
            className="relative overflow-hidden h-50 md:h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={CloudServices}
              alt="Cloud Infrastructure and Managed Hosting Icon"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>

          {/* Grid Item 4 */}
          <motion.div
            className="relative overflow-hidden h-50 md:h-96 sm:h-96"
            variants={gridItemVariants}
          >
            <Image
              src={DesignServices}
              alt="UI/UX Design and Product Strategy Icon"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </motion.div>
        </motion.div>

        {/* Mobile Accordion View */}
        {/* <div className="block md:hidden mx-auto">
          <SolutionsStackedCards />
        </div> */}
      </div>
    </section>
  );
};

export default OurSolutions;
