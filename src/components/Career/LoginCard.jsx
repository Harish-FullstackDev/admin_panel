"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Card_BG from "../../assets/career/ConsultationCard.svg";
import CustomButton from "../Cards/Button";
 
const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
 
  const handleCareerSubmit = (action) => {
    console.log(`${action} with:`, { email, password });
    setIsSubmitted(true);
    setEmail("");
    setPassword("");
    setTimeout(() => setIsSubmitted(false), 2000);
  };
 
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCareerSubmit("login");
    }
  };
 
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 },
    },
  };
 
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };
 
  const titleVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.3 },
    },
  };
 
  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };
 
  return (
    <motion.div
      className="flex flex-col items-start w-full max-w-xs sm:max-w-md lg:max-w-lg mx-auto px-4 sm:px-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Card Section with Background */}
      <motion.div
        className="relative lg:w-full w-80 "
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* SVG Background */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Image
            src={Card_BG}
            alt="Card Background"
            className="lg:w-full lg:h-auto lg:object-cover w-80 h-80 object-contain"
            priority
          />
        </motion.div>
 
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-start justify-center p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-5 lg:space-y-6 text-left">
          <>
            <motion.h1
              className="text-sm sm:text-xl lg:text-2xl text-white font-normal leading-tight text-start sm:text-start mb-2 sm:mb-4"
              variants={titleVariants}
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Unlock Career Potential now!
              </motion.span>
            </motion.h1>
 
            {/* Email Input */}
            <motion.div
              className="w-full max-w-xs sm:max-w-sm space-y-3 sm:space-y-4"
              variants={itemVariants}
            >
              <div>
                <motion.label
                  className="text-white text-xs sm:text-sm lg:text-base font-normal text-start block mb-1 sm:mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  Enter Your Email
                </motion.label>
                <motion.input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Email Here"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-xs sm:text-sm lg:text-base"
                  variants={inputVariants}
                  whileFocus="focus"
                  whileTap="tap"
                />
              </div>
 
              {/* Password Input */}
              <div>
                <motion.label
                  className="text-white text-xs sm:text-sm lg:text-base font-normal text-start block mb-1 sm:mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  Enter Your Password
                </motion.label>
                <motion.input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Password Here"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-xs sm:text-sm lg:text-base"
                  variants={inputVariants}
                  whileFocus="focus"
                  whileTap="tap"
                />
              </div>
 
              {/* Buttons */}
              <motion.div
                className="flex w-full justify-center pt-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                <motion.div
                  animate={isSubmitted ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <CustomButton
                    text={isSubmitted ? "Logged In!" : "Sign In"}
                    onClick={() => handleCareerSubmit("login")}
                    iconColor="text-white"
                    iconBgColor="bg-black group-hover:bg-gray-800"
                    buttonBgColor="bg-white"
                    textColor="text-black"
                  />
                </motion.div>
              </motion.div>
              <motion.p
                className="text-white text-xs sm:text-sm -mt-1  text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.8 }}
              >
                Don’t have an account?{" "}
                <a
                  href="/signup"
                  className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 cursor-pointer"
                >
                  Create an account
                </a>
              </motion.p>
            </motion.div>
          </>
        </div>
      </motion.div>
    </motion.div>
  );
};
 
export default LoginCard;