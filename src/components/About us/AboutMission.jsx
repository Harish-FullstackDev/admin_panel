import React from 'react';
import Image from "next/image";
import { motion } from "framer-motion";

const AboutMission = () => {
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

  // Content animation variants
  const contentVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Image animation variants
  const imageVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Section animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-10 px-4 overflow-x-hidden overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* OUR VISION & MISSION Badge */}
          <motion.div
            className="inline-flex items-center gap-2 "
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              OUR VISION & MISSION
            </p>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Driving Growth with <span className='gradient-text'>Purpose</span>
          </motion.h2>
        </motion.div>

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto">

          {/* Vision Section */}
          <div className="flex flex-col lg:grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-center">

            {/* Vision Image */}
            <motion.div
              variants={imageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="order-1 w-full"
            >
              <Image
                src="/AboutPage/Vision.jpg"
                alt="Vision"
                width={700}
                height={467}
                className="w-full max-w-[560px] mx-auto aspect-[3/2] object-cover rounded-[32px]"
              />
            </motion.div>

            {/* Vision Content */}
            <motion.div
              variants={contentVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="order-2 px-2 sm:px-4 lg:px-0"
            >
              <h3 className="text-3xl lg:text-5xl font-bold mb-5">
                Vision
              </h3>

              <p className="text-gray-600 text-lg md:text-2xl leading-relaxed max-w-[650px] text-justify">
                Our vision is to become the trusted global technology partner that
                empowers enterprises to achieve sustainable growth. We do this by
                driving innovation, fostering collaboration, and delivering intelligent
                transformation that prepares businesses for the future.
              </p>
            </motion.div>

          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-12 lg:my-12"></div>

          {/* Mission Section */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-16 items-center">

            {/* Mobile Image First */}
            <motion.div
              variants={imageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="order-1 lg:order-2 w-full"
            >
              <Image
                src="/AboutPage/Mission.jpg"
                alt="Mission"
                width={700}
                height={467}
                className="w-full max-w-[560px] mx-auto aspect-[3/2] object-cover rounded-[32px]"
              />
            </motion.div>

            {/* Mission Content */}
            <motion.div
              variants={contentVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="order-2 lg:order-1 px-2 sm:px-4 lg:px-0"
            >
              <h3 className="text-3xl lg:text-5xl font-bold mb-5">
                Mission
              </h3>

              <p className="text-gray-600 text-lg md:text-2xl leading-relaxed max-w-[650px] text-justify">
                To deliver scalable, future-ready enterprise solutions that connect
                people, processes, and technology by blending certified expertise with
                innovation, we empower organizations to reimagine their business
                models, improve efficiency, and stay competitive in a digital-first
                world.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMission;
