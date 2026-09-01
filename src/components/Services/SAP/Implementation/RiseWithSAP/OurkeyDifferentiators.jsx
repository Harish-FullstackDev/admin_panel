"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import keyImage from "../../../../../../public/KeyImage3.png";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -60, y: 20, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0)",
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 60, y: 20, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0)",
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

const lineVariants = {
  hidden: { height: 0, y: 100 },
  visible: {
    height: "100%",
    y: 0,
    transition: { duration: 1.8, ease: "easeInOut" },
  },
};

const imageHover = {
  hover: { scale: 1.05, rotate: 1, transition: { duration: 0.5 } },
};

const OurkeyDifferentiators = () => {
  const milestones = [
    {
      title: "Scalable Cloud Solutions",
      text: "with a focus on SAP services.",
      side: "right",
    },
    {
      title: "Integrated Innovation",
      text: "Establishing offices in Oman, UAE, Qatar, KSA, and Kuwait",
      side: "left",
    },
    {
      title: "Support & Notifications",
      text: "Recognized for excellence in enterprise solutions.",
      side: "right",
    },
  ];

  return (
    <div className="relative bg-white overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-3xl lg:text-5xl font-normal leading-tight mb-8">
            Our key{" "}
            <span className="gradient-text bg-clip-text text-transparent">
              Differentiators
            </span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <motion.div
            className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-300"
            initial="hidden"
            whileInView="visible"
            variants={lineVariants}
          />

          <motion.div
            className="space-y-10 md:space-y-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {milestones.map((item, index) => (
              <motion.div
                key={index}
                className="relative flex flex-col md:flex-row items-center md:items-center"
                variants={item.side === "left" ? fadeLeft : fadeRight}
              >
                {item.side === "left" ? (
                  <>
                    {/* Text Left */}
                    <motion.div
                      className="w-full md:w-1/2 md:pr-8 text-center md:text-right md:mb-0"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.text}</p>
                    </motion.div>

                    {/* Dot (Static) */}
                    <div className="hidden md:block absolute left-1/2 -translate-x-[7px] w-4 h-4 bg-blue-600 rounded-full z-10" />

                    {/* Image Right */}
                    <motion.div
                      className="hidden md:flex md:w-1/2 md:pl-8 justify-center"
                      whileHover="hover"
                      variants={imageHover}
                    >
                      <Image
                        src={keyImage}
                        alt={item.title}
                        className="rounded-lg shadow-lg w-96 h-48 object-cover"
                      />
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Image Left */}
                    <motion.div
                      className="hidden md:flex md:w-1/2 md:pr-8 justify-center"
                      whileHover="hover"
                      variants={imageHover}
                    >
                      <Image
                        src={keyImage}
                        alt={item.title}
                        className="rounded-lg shadow-lg w-96 h-48 object-cover"
                      />
                    </motion.div>

                    {/* Dot (Static) */}
                    <div className="hidden md:block absolute left-1/2 -translate-x-[7px] w-4 h-4 bg-blue-600 rounded-full z-10" />

                    {/* Text Right */}
                    <motion.div
                      className="w-full md:w-1/2 md:pl-8 text-center md:text-left md:mb-0"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.text}</p>
                    </motion.div>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OurkeyDifferentiators;
