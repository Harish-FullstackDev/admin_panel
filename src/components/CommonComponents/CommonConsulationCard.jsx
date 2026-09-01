import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import CustomButton from "../Cards/Button";

const CommonConsultation = ({
  backgroundImage,
  backgroundAlt = "Background",

  // Content props
  title,
  description,

  // Button props
  buttonText = "Get Started",
  buttonIconColor = "text-white",
  buttonIconBgColor = "bg-black group-hover:bg-gray-800",
  buttonBgColor = "bg-white",
  buttonTextColor = "text-black",
  onButtonClick,

  // Styling props
  textColor = "text-white",
  sectionClassName = "",
  contentClassName = "",

  // Animation props
  animationDuration = 0.8,
  animationDelay = 0,

  // Layout props
  maxWidth = "max-w-4xl",
  padding = "py-20 sm:py-24 lg:py-28",
}) => {
  return (
    <div>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration: animationDuration,
          delay: animationDelay,
        }}
        className={`${padding} ${textColor} relative overflow-hidden ${sectionClassName}`}
      >
        {/* Background Image */}
        {backgroundImage && (
          <div className="absolute inset-0">
            <Image
              src={backgroundImage}
              alt={backgroundAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className={`${maxWidth} mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10  ${contentClassName}`}
        >
          {title && (
            <h2 className="text-3xl sm:text-4xl font-normal mb-10 lg:-mt-8 ">{title}</h2>
          )}

          {description && (
            <p className="text-md md:text-md font-light mb-20 max-w-7xl mx-auto opacity-90 ">
              {description}
            </p>
          )}

          {buttonText && (
            <CustomButton
              text={buttonText}
              iconColor={buttonIconColor}
              iconBgColor={buttonIconBgColor}
              buttonBgColor={buttonBgColor}
              textColor={buttonTextColor}
              onClick={onButtonClick}
            />
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default CommonConsultation;
