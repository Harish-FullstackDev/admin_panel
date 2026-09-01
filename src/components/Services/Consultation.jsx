import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import CustomButton from "../Cards/Button";

const Consultation = () => {
  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const backgroundVariants = {
    hidden: { 
      scale: 1.1,
      opacity: 0 
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.8,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  return (
    <div>
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-20 sm:py-24 lg:py-28 text-white relative overflow-hidden overflow-x-hidden"
      >
        {/* Background Image with Motion */}
        <motion.div 
          className="absolute inset-0"
          variants={backgroundVariants}
        >
          <Image
            src="/SolutionPage/Solution.gif"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <motion.div 
            className="absolute inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </motion.div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-4"
            variants={itemVariants}
          >
            <motion.span
              className="inline-block"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              Providing Brilliant Service for Your Business
            </motion.span>
          </motion.h2>
          
          <motion.p 
            className="text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto opacity-90"
            variants={itemVariants}
          >
            <motion.span
              className="inline-block"
              whileHover={{ 
                opacity: 1,
                transition: { duration: 0.2 }
              }}
            >
              Let's build something great together. Our team is ready to help you
              achieve your business goals and unlock new opportunities.
            </motion.span>
          </motion.p>
          
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <CustomButton
              text="Get Started"
              iconColor="text-white"
              iconBgColor="bg-black group-hover:bg-gray-800"
              buttonBgColor="bg-white"
              textColor="text-black"
            />
          </motion.div>
        </div>

        {/* Subtle glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 1 }}
        />
      </motion.section>
    </div>
  );
};

export default Consultation;