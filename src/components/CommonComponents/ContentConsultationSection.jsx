import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import CustomButton from "../Cards/Button";

const ContentConsultation = ({
  bgImage,
  title,
  description,
  buttonText = "Get Started",
  buttonTextColor = "text-black",
  buttonBgColor = "bg-white",
  buttonIconColor = "text-white",
  buttonIconBgColor = "bg-black group-hover:bg-gray-800",
}) => {
  // Motion variants
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, delay: 0.4, ease: "easeOut" },
    },
    hover: { scale: 1.05 },
  };

  return (
    <motion.section
      className="py-20 sm:py-24 lg:py-28 text-white relative overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
    >
      {/* Background Image with subtle zoom effect */}
      {bgImage && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Image
            src={bgImage}
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-4"
          variants={fadeUp}
        >
          {title}
        </motion.h2>
        <motion.p
          className="text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto opacity-90"
          variants={fadeUp}
        >
          {description}
        </motion.p>
        <motion.div variants={buttonVariants} whileHover="hover">
          <CustomButton
            text={buttonText}
            textColor={buttonTextColor}
            buttonBgColor={buttonBgColor}
            iconColor={buttonIconColor}
            iconBgColor={buttonIconBgColor}
          />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ContentConsultation;
