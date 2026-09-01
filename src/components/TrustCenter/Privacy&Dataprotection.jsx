import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MdLockOutline } from "react-icons/md";
import { LuKeyRound } from "react-icons/lu";
import { FiShield } from "react-icons/fi";

export default function PrivacyAndDataprotection() {
  const [activeButton, setActiveButton] = useState('confidentiality');

  const defaultDesc =
    "Sensitive business data is never shared without explicit consent.";
  const hoverDesc =
    "We implement zero-trust architecture and end-to-end encryption to ensure your data remains protected at every level of our infrastructure.";

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Title animation variants
  const title = {
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

  const handleButtonClick = (buttonType) => {
    setActiveButton(buttonType);
  };

  const getButtonClasses = (buttonType) => {
    const isActive = activeButton === buttonType;
    return `flex items-center justify-center space-x-2 px-4 lg:px-6 py-2 rounded-full border cursor-pointer transition-all duration-300 text-sm sm:text-sm font-medium shadow-md w-full sm:w-1/3 text-center ${
      isActive 
        ? 'bg-[#FFFFFF80] border-none  text-black' 
        : 'text-white border-none bg-[#FFFFFF1A] '
    }`;
  };

  return (
    <div className="bg-white flex items-center justify-center lg:mt-4 lg:mb-4  px-4 overflow-x-hidden">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
        {/* Left Content Column */}
        <div className="w-full lg:w-[35%] text-center lg:text-left px-4 lg:px-0">
          <motion.div 
            className="flex items-center justify-center lg:justify-start gap-2 mb-1"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.span className="text-blue-500">✦</motion.span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              Privacy & Data Protection
            </p>
          </motion.div>

          {/* Heading */}
          <motion.h2 
            className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 text-center lg:text-left"
            variants={title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Your Privacy, Our 
            <span className="gradient-text"> Priority</span>
          </motion.h2>
          <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
            At SST, data privacy isn't an afterthought—it's built into
            everything we do. From system design to daily operations, we
            safeguard sensitive information with strict policies and advanced
            technologies, ensuring you stay in control of your data.
          </p>
        </div>

        {/* Right Card Column - Removed background color */}
        <div className="w-full lg:w-[57%] relative rounded-3xl p-6 sm:p-8 lg:p-12 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/trustcenter/Data.webp"
              alt="Data Protection Background"
              fill
              className="object-cover rounded-3xl"
              priority
            />
            {/* Optional overlay for better text readability */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-[#000000] to-[#3650A5] rounded-3xl"></div> */}
          </div>

          <div className="relative z-10 space-y-6 lg:space-y-12">
            {/* Pill-shaped buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full">
              <div 
                className={getButtonClasses('confidentiality')}
                onClick={() => handleButtonClick('confidentiality')}
              >
                <MdLockOutline className="w-4 h-4"/>
                <span className="text-md">Data Confidentiality</span>
              </div>
              <div 
                className={getButtonClasses('encryption')}
                onClick={() => handleButtonClick('encryption')}
              >
                <LuKeyRound className="w-4 h-4" />
                <span className="text-md">Advanced Encryption</span>
              </div>
              <div 
                className={getButtonClasses('access')}
                onClick={() => handleButtonClick('access')}
              >
                <FiShield className="w-4 h-4" />
                <span className="text-md">Access Control</span>
              </div>
            </div>

            {/* Dynamic text based on active button */}
            <div className="text-left mt-4 lg:mt-6 lg:mb-4">
              <motion.p
                key={activeButton}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className=" text-base lg:text-base font-medium text-white"
              >
                {activeButton === 'confidentiality' && "Sensitive business data is never shared without explicit consent data remains protected at every level of our infrastructure."}
                {activeButton === 'encryption' && "We implement zero-trust architecture and end-to-end encryption to ensure your data remains protected at every level of our infrastructure."}
                {activeButton === 'access' && "Advanced role-based access controls ensure only authorized personnel can access sensitive information with full audit trails."}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}