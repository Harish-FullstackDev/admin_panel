import React from 'react';
import Image from "next/image";
import { motion } from "framer-motion";
import KSA from "../../assets/aboutus/KSA.svg";
import Kuwait from "../../assets/aboutus/Kuwait.svg";
import Oman from "../../assets/aboutus/Oman.svg";
import Puducherrymap from "../../assets/aboutus/Puducherrymap.svg";
import Qatar from "../../assets/aboutus/Qatar.svg";
import UAE from "../../assets/aboutus/UAE.svg";

const AboutMap = () => {
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

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <section className="py-10 px-4 bg-white overflow-x-hidden mt-4 lg:mt-0 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-3 mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              Our Global Presence
            </p>
          </motion.div>

          <motion.h2 
            className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Connecting Enterprises  <span className='gradient-text'> Across Borders</span>
          </motion.h2>
          
          <motion.p 
            className="text-gray-600 max-w-4xl mx-auto leading-relaxed text-md mb-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Support Studio Technologies (SST) combines local expertise with global delivery capabilities.<br />
              With our headquarters in India and a strong footprint across the Middle East, we bring world-class enterprise solutions<br />
            closer to our clients while ensuring compliance with regional business and regulatory needs.
          </motion.p>
        </motion.div>

        {/* Map Section */}
        <div className="relative">
          {/* Headquarters Section - Horizontal Layout */}
          <motion.div 
            className="flex items-center justify-center gap-8 md:gap-16 mb-12"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Map on the left - Made bigger */}
            <motion.div 
              className="flex-shrink-0"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <Image 
                src={Puducherrymap} 
                alt="Puducherry Map" 
                width={200}
                height={200}
                className="w-48 h-48 md:w-56 md:h-56 object-contain"
              />
            </motion.div>

            {/* Text on the right */}
            <motion.div 
              className="flex flex-col items-start text-left"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div 
                className="mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-xs sm:text-sm font-medium tracking-widest uppercase text-gray-500">
                  Headquarters
                </span>
              </motion.div>
              
              <motion.h3 
                className="text-2xl md:text-3xl font-semibold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Puducherry
              </motion.h3>
            </motion.div>
          </motion.div>

          {/* Regional Offices Section */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-xs sm:text-sm font-medium tracking-widest uppercase text-gray-500">
              Regional Offices
            </span>
          </motion.div>

          {/* Regional Offices Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-10 items-center justify-items-center max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {/* Oman */}
            <motion.div 
              className="text-center"
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Image 
                  src={Oman} 
                  alt="Oman" 
                  width={150}
                  height={150}
                  className="mx-auto w-32 h-32 md:w-40 md:h-40 object-contain"
                />
              </motion.div>
              <motion.h3 
                className="text-lg font-semibold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Oman
              </motion.h3>
            </motion.div>

            {/* UAE */}
            <motion.div 
              className="text-center"
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Image 
                  src={UAE} 
                  alt="UAE" 
                  width={150}
                  height={150}
                  className="mx-auto w-32 h-32 md:w-40 md:h-40 object-contain"
                />
              </motion.div>
              <motion.h3 
                className="text-lg font-semibold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                UAE
              </motion.h3>
            </motion.div>

            {/* Qatar */}
            <motion.div 
              className="text-center"
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Image 
                  src={Qatar} 
                  alt="Qatar" 
                  width={150}
                  height={150}
                  className="mx-auto w-32 h-32 md:w-40 md:h-40 object-contain"
                />
              </motion.div>
              <motion.h3 
                className="text-lg font-semibold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Qatar
              </motion.h3>
            </motion.div>

            {/* KSA */}
            <motion.div 
              className="text-center"
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Image 
                  src={KSA} 
                  alt="KSA" 
                  width={150}
                  height={150}
                  className="mx-auto w-32 h-32 md:w-40 md:h-40 object-contain"
                />
              </motion.div>
              <motion.h3 
                className="text-lg font-semibold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                KSA
              </motion.h3>
            </motion.div>

            {/* Kuwait */}
            <motion.div 
              className="text-center"
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Image 
                  src={Kuwait} 
                  alt="Kuwait" 
                  width={150}
                  height={150}
                  className="mx-auto w-32 h-32 md:w-40 md:h-40 object-contain"
                />
              </motion.div>
              <motion.h3 
                className="text-lg font-semibold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Kuwait
              </motion.h3>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutMap;