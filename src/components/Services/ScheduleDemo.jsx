"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import CustomButton from "../Cards/Button";
import CalendlyModal from "../CommonComponents/CommonCalendy";

export default function SAPAICapabilities() {
  const [isMounted, setIsMounted] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);

  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    threshold: 0.1,
    margin: "0px 0px -100px 0px",
  });
  const mainControls = useAnimation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  const containerVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, x: -20 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.7 },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateY: -15 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: { duration: 1, delay: 0.3 },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2 } },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.4 } },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, delay: 0.6 },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <>
      {/* ===== Main Section ===== */}
      <motion.div
        ref={ref}
        className="flex items-center justify-center px-4 sm:px-6 lg:px-8 -mt-10 overflow-x-hidden overflow-hidden"
        initial="hidden"
        animate={mainControls}
        variants={containerVariants}
      >
        <motion.div
          className="w-full max-w-7xl bg-[#F5FAFF] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
        >
          <div className="flex flex-col xl:flex-row">
            {/* === Left Section === */}
            <motion.div
              className="xl:flex-[0.6] p-6 sm:p-8 lg:p-12 flex flex-col justify-center relative"
              variants={itemVariants}
            >
              <motion.h1
                className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
                variants={headingVariants}
              >
                Want to See What Our Capabilities Can Do For Your{" "}
                <span className="gradient-text relative inline-block">
                  SAP Business
                </span>
                ?
              </motion.h1>

              <motion.p
                className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed relative z-10 max-w-2xl"
                variants={textVariants}
              >
                From intelligent data extraction to automated SAP processes, we
                transform your enterprise with cutting-edge AI development
                services. Ready to revolutionize your SAP ecosystem?
              </motion.p>

              <motion.div
                className="relative z-10"
                variants={buttonVariants}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CustomButton
                    text="Schedule a call"
                    iconColor="text-black"
                    iconBgColor="bg-white"
                    buttonBgColor="bg-black"
                    textColor="text-white"
                    onClick={() => setShowCalendly(true)}
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* === Right Section (Image) === */}
            <motion.div
              className="xl:flex-[0.4] flex flex-col justify-center bg-cover bg-center rounded-2xl sm:rounded-3xl m-3 sm:m-4 lg:m-6 min-h-[300px] relative overflow-hidden"
              style={{ backgroundImage: `url(/ServicePage/DesignerSAP.jpeg)` }}
              variants={imageVariants}
            >
              {isMounted && (
                <>
                  <motion.div
                    className="absolute top-3 right-3 w-2 h-2 bg-white/30 rounded-full"
                    variants={floatingVariants}
                    animate="animate"
                  />
                  <motion.div
                    className="absolute bottom-4 left-4 w-2 h-2 bg-blue-400/40 rounded-full"
                    variants={floatingVariants}
                    animate="animate"
                    transition={{ delay: 1 }}
                  />
                </>
              )}
            </motion.div>
          </div>

          <motion.div
            className="h-0.5 sm:h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 1.5 }}
          />
        </motion.div>
      </motion.div>

      {/* ===== Calendly Modal (Now using reusable component) ===== */}
      <CalendlyModal
        isOpen={showCalendly}
        onClose={() => setShowCalendly(false)}
        // To use this Calendly modal, first create an account at https://calendly.com,
        // set up your meeting event (e.g., 30-minute call), and then replace the calendlyUrl
        // with your own Calendly link (for example: https://calendly.com/your-username/30min).
        calendlyUrl={process.env.NEXT_PUBLIC_CALENDLY_URL}
        pageSettings={{
          backgroundColor: "ffffff",
          primaryColor: "#2d8ec5",
          textColor: "#2d8ec5",
        }}
      />
    </>
  );
}