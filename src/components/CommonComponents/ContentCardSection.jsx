import React from "react";
import { motion } from "framer-motion";
import { MdArrowOutward } from "react-icons/md";

const ContentCardSection = ({
  heading,
  description,
  cards = [],
  buttonText,
}) => {
  // Container animation for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
        delayChildren: 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Text animation variants
  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Card container variants
  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
        delayChildren: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Individual card animation
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.9,
      rotateX: 15
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Button animation
  const buttonVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Icon animation
  const iconVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0,
      rotate: -180
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        delay: 0.2,
        ease: [0.68, -0.55, 0.265, 1.55] // Bounce effect
      }
    }
  };

  return (
    <div className="mt-10 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20">
      <motion.div
        className="flex flex-col items-start justify-center space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        whileInView="visible"
        viewport={{ 
          once: false, 
          amount: 0.1,
          margin: "100px 0px -100px 0px"
        }}
      >
        {/* Heading */}
        <motion.h1 
          className="text-4xl lg:text-6xl xl:text-4xl font-semibold leading-tight text-start"
          variants={textVariants}
        >
          {heading}
        </motion.h1>

        {/* Description */}
        <motion.p 
          className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-10"
          variants={textVariants}
        >
          {description}
        </motion.p>

        {/* Cards + Button Grid */}
        <motion.div 
          className="w-full grid grid-cols-1 lg:grid-cols-3 gap-20 relative z-10"
          variants={cardContainerVariants}
        >
          {/* Background blur */}
          <motion.div 
            className="absolute inset-0 bg-[8EC5FF] filter blur-3xl -z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ 
              once: false,
              amount: 0.1
            }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          />

          {/* Cards */}
          {cards.map((card, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative w-full bg-white backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <div className="flex flex-col items-start space-y-3">
                <motion.div 
                  className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center self-end group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110"
                  variants={iconVariants}
                >
                  <MdArrowOutward className="w-6 h-6 text-blue-300 hover:text-blue-500 transition-colors duration-200" />
                </motion.div>
                <motion.h3 
                  className="text-lg font-semibold text-gray-900"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ 
                    once: false,
                    amount: 0.1
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {card.title}
                </motion.h3>
              </div>
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ 
                  once: false,
                  amount: 0.1
                }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="text-sm text-gray-600 leading-relaxed">
                  {card.text}
                </p>
              </motion.div>
            </motion.div>
          ))}

          {/* Button */}
          <motion.div 
            className="group relative w-full flex items-center justify-center bg-white backdrop-blur-md p-6 rounded-2xl transition-all duration-300"
            variants={cardVariants}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
          >
            <motion.button
              className="group inline-flex items-center px-6 py-2.5 cursor-pointer text-white secondary-Button text-sm font-medium rounded-full transition-all duration-300 transform hover:scale-105 hover:brightness-110"
              variants={buttonVariants}
              whileHover={{ 
                scale: 1.08,
                transition: { duration: 0.2, ease: "easeOut" }
              }}
              whileTap={{ 
                scale: 0.95,
                transition: { duration: 0.1 }
              }}
            >
              {buttonText}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContentCardSection;