import React from 'react'
import { motion } from "framer-motion";
import View from "../../assets/trustcenter/View.svg";
import Vector from "../../assets/trustcenter/Vector.svg";
import Security from "../../assets/trustcenter/Security.svg";
import Cloud from "../../assets/trustcenter/Cloud.svg";
import SecurityBlue from "../../assets/trustcenter/SecurityBlue.svg";
import ViewBlue from "../../assets/trustcenter/ViewBlue.svg";
import CloudBlue from "../../assets/trustcenter/CloudBlue.svg";
import VectorBlue from "../../assets/trustcenter/VectorBlue.svg";
import Image from "next/image";

const SecurityPractices = () => {
  const securityFeatures = [
    {
      title: "Encryption",
      description: "Data is protected in transit using advanced encryption standards",
      blackIcon: Vector,
      blueIcon: VectorBlue,
    },
    {
      title: "Continuous Monitoring",
      description: "Proactive detection and response with real-time system monitoring",
      blackIcon: View,
      blueIcon: ViewBlue,
    },
    {
      title: "Access Control",
      description: "Role-based authentication safeguard user access",
      blackIcon: Security,
      blueIcon: SecurityBlue,
    },
    {
      title: "Disaster Recovery",
      description: "Resilient recovery plans ensure uninterrupted business",
      blackIcon: Cloud,
      blueIcon: CloudBlue,
    }
  ];

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

  // Badge animation variants
  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.2,
      },
    },
  };

  // Title animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.4,
      },
    },
  };

  // Description animation variants
  const descriptionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.6,
      },
    },
  };

  // Container animation variants for staggered cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.8,
      },
    },
  };

  // Card animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
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

  // Icon animation variants
  const iconVariants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.3,
      },
    },
  };

  return (
    <div className="py-10 px-4 bg-white overflow-x-hidden overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Motion */}
        <motion.div 
          className="text-center mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Badge */}
          <motion.div 
            className="flex items-center justify-center gap-2 mb-1"
            variants={badgeVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
              <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
                SECURITY PRACTICES
              </p>
          </motion.div>

          {/* Main Title */}
          <motion.h2 
            className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Protecting Your Enterprise, 
            <span className="gradient-text"> End to End</span>
          </motion.h2>

          {/* Description */}
          <motion.p 
            className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed"
            variants={descriptionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            We safeguard critical systems with enterprise-grade security measures designed to prevent, 
            detect, and respond to threats in real time.
          </motion.p>
        </motion.div>

        {/* Security Features Grid with Motion */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8  lg:mt-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {securityFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              className="group text-center p-4 lg:p-2 rounded-lg transition-all duration-100  cursor-pointer"
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon Container with Motion */}
              <motion.div 
                className="relative w-16 h-16 mx-auto mb-6"
                variants={iconVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {/* Black Icon - Default */}
                <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0">
                  <Image
                    src={feature.blackIcon}
                    alt={feature.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Blue Icon - On Hover */}
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <Image
                    src={feature.blueIcon}
                    alt={feature.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
              </motion.div>

              {/* Content with subtle animations */}
              <motion.h3 
                className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
              >
                {feature.title}
              </motion.h3>
              
              <motion.p 
                className="text-gray-600 text-base leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.6 }}
              >
                {feature.description}
              </motion.p>

             
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SecurityPractices;