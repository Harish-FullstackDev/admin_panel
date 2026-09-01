import React from "react";
import { motion } from "framer-motion";

const WhyContentSection = ({
  title,
  titleHighlight,
  subtitle,
  features,
  backgroundColor,
  accentColor,
  showBackground = true,
}) => {
  const displayFeatures = features;

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3,
        delayChildren: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Title animation variants
  const titleVariants = {
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
        duration: 1,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Features container animation
  const featuresContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
        delayChildren: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Individual feature animation
  const featureVariants = {
    hidden: { 
      opacity: 0, 
      x: 60,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Icon animation
  const iconVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0,
      rotate: -90
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

  // Text content animation
  const textContentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.1,
        ease: "easeOut"
      }
    }
  };

  // Background decoration animation
  const backgroundVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 2,
        delay: 1.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div
      className={`${backgroundColor} ${
         "min-h-[60vh]"
      } flex items-center justify-center px-4 py-16 relative`}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="grid lg:grid-cols-2 gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Left Section - Title */}
          <motion.div 
            className="space-y-8"
            variants={titleVariants}
          >
            <h1 className="text-4xl lg:text-7xl font-bold text-gray-900 leading-tight">
              {title}
              {titleHighlight && (
                <>
                  <br />
                  <span className="text-gray-900">{titleHighlight}</span>
                </>
              )}
              {subtitle && (
                <>
                  <br />
                  <span className="text-gray-700">{subtitle}</span>
                </>
              )}
            </h1>
          </motion.div>

          {/* Right Section - Features */}
          <motion.div 
            className="space-y-12"
            variants={featuresContainerVariants}
          >
            {displayFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={featureVariants}
                className="flex items-start space-x-4 group cursor-pointer"
                whileHover={{ 
                  scale: 1.05,
                  x: 10,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                {/* Icon Container */}
                <motion.div 
                  className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center group-hover:shadow-xl transition-shadow duration-300"
                  variants={iconVariants}
                  whileHover={{ 
                    rotate: 15,
                    scale: 1.1,
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                </motion.div>

                {/* Content */}
                <motion.div 
                  className="flex-1 space-y-2"
                  variants={textContentVariants}
                >
                  <motion.h3 
                    className="text-2xl font-bold text-gray-900 transition-colors duration-300"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p 
                    className="text-gray-600 leading-relaxed text-lg"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    {feature.description}
                  </motion.p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Background decorative elements */}
      {showBackground && (
        <motion.div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          variants={backgroundVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full opacity-20 blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div 
            className="absolute -bottom-32 -left-32 w-72 h-72 bg-gradient-to-tr from-orange-300 to-yellow-300 rounded-full opacity-15 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default WhyContentSection