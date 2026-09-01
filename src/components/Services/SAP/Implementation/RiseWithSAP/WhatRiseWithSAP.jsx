"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

export default function RiseWithSAP() {
  const [isMounted, setIsMounted] = useState(false);
  const [particlePositions, setParticlePositions] = useState([]);
  const [nodePositions, setNodePositions] = useState([]);

  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    threshold: 0.1,
    margin: "0px 0px -100px 0px",
  });
  const mainControls = useAnimation();

  useEffect(() => {
    setIsMounted(true);
    setParticlePositions(
      [...Array(20)].map(() => ({
        x: Math.random() * 400,
        y: Math.random() * 400,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      }))
    );
    setNodePositions(
      [...Array(6)].map(() => ({
        left: 20 + Math.random() * 60,
        top: 20 + Math.random() * 60,
        delay: Math.random() * 0.3,
        duration: 2 + Math.random(),
      }))
    );
  }, []);

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      x: -20,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const imageVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      rotateY: -15,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 1,
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.3,
      },
    },
  };

  const headingVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.4,
      },
    },
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.6,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.8,
      },
    },
  };

  const shimmerVariants = {
    hidden: {
      x: "-100%",
    },
    visible: {
      x: "100%",
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        delay: 1,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className="flex items-center justify-center px-4 sm:px-6 lg:px-8  overflow-x-hidden overflow-hidden"
      initial="hidden"
      animate={mainControls}
      variants={containerVariants}
    >
      <motion.div
        className="w-full max-w-7xl bg-[#F5FAFF] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg"
        variants={itemVariants}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.3 },
        }}
      >
        <div className="flex flex-col xl:flex-row">
          <motion.div
            className="xl:flex-[0.6] p-6 sm:p-8 lg:p-12 flex flex-col justify-center relative"
            variants={itemVariants}
          >
            <motion.div
              className="absolute inset-0 opacity-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              transition={{ duration: 2, delay: 1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent"></div>
            </motion.div>

            <motion.h1
              className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 flex flex-col gap-2"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.4 } },
              }}
            >
              {/* Line 1 */}
              <motion.div
                className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full font-medium text-sm shadow-sm w-fit mb-3"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                Rise With SAP
              </motion.div>

              {/* Line 2 */}
              <motion.div
                className="text-gray-800"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                What is Rise With <br />
                <span className="gradient-text"></span>SAP?
              </motion.div>
            </motion.h1>

            <motion.p
              className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed relative z-10 max-w-2xl"
              variants={textVariants}
            >
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Rise with SAP is a comprehensive business transformation
                offering that helps clients move their operations to the cloud
                and leverage the power of SAP’s suite of tools and services. It
                is designed to simplify and accelerate the digital
                transformation process for businesses by providing a set of
                pre-configured solutions, services, and innovations in one
                package. Rise with SAP is a comprehensive business
                transformation offering that helps clients move their operations
                to the cloud and leverage the power of SAP’s suite of tools and
                services.
              </motion.span>
            </motion.p>
          </motion.div>

          {/* Second Content Section - Image with better responsiveness */}
          <motion.div
            className="xl:flex-[0.4] flex flex-col justify-center bg-cover bg-center rounded-2xl sm:rounded-3xl m-3 sm:m-4 lg:m-6 min-h-[250px] sm:min-h-[300px] lg:min-h-[400px] xl:min-h-[100px] relative overflow-hidden"
            style={{ backgroundImage: `url(/RiseWithSAP.png)` }}
            variants={imageVariants}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/10"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.8 }}
            />

            {isMounted && isInView && (
              <>
                <motion.div
                  className="absolute top-3 sm:top-4 right-3 sm:right-4 w-2 sm:w-3 h-2 sm:h-3 bg-white/30 rounded-full"
                  variants={floatingVariants}
                  animate="animate"
                />
                <motion.div
                  className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400/40 rounded-full"
                  variants={floatingVariants}
                  animate="animate"
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.2,
                  }}
                />
                <motion.div
                  className="absolute top-1/2 left-3 sm:left-4 w-1 h-1 bg-white/50 rounded-full"
                  variants={floatingVariants}
                  animate="animate"
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.8,
                  }}
                />
              </>
            )}

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 w-full h-full"
              initial={{ x: "-100%" }}
              animate={isInView ? { x: "200%" } : {}}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                delay: 1.2,
              }}
            />
          </motion.div>
        </div>

        <motion.div
          className="h-0.5 sm:h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, delay: 1.5, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
