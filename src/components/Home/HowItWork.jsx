import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronDown } from "react-icons/hi2";
import { allSteps } from "../Constants/Home/HowItWorksData";
import Image from "next/image";

const HowItWork = () => {
  const [selectedService, setSelectedService] = useState("Implementation");

  const handleButtonClick = (stepTitle) => {
    setSelectedService(stepTitle);
  };

  const ServiceCard = ({ service, index }) => {
    return (
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: index * 0.1,
          ease: "easeOut",
        }}
        whileHover={{
          y: -10,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <motion.h3
          className="text-xl leading-relaxed text-gray-600 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.2 }}
        >
          {service.head}
        </motion.h3>
        <motion.div
          className="mb-6 w-16 h-16 mx-auto flex items-center justify-center text-gray-400"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: index * 0.1 + 0.3,
            duration: 0.5,
            ease: "easeOut",
          }}
          whileHover={{
            scale: 1.1,
            transition: { duration: 0.3 },
          }}
        >
          <Image
            src={service.icon}
            alt={service.title || "Service Icon"}
            width={64}
            height={64}
            className="object-contain"
          />
        </motion.div>

        <motion.h3
          className="text-xl font-semibold text-gray-900 mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          {service.title}
        </motion.h3>
        <motion.p
          className="text-gray-600 text-sm leading-relaxed mb-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.5 }}
          dangerouslySetInnerHTML={{
            __html: service.description || service.desc,
          }}
        />
      </motion.div>
    );
  };

  const servicesToDisplay = allSteps[selectedService] || [];
  const serviceKeys = Object.keys(allSteps);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className=" text-gray-800 relative overflow-x-hidden overflow-hidden"
    >
      <section
        className=" px-4 sm:px-6 lg:px-8 rounded-2xl bg-white"
        style={{ margin: "1rem" }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center justify-center gap-2 "
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            >
              <motion.span
                className="text-blue-500 text-base sm:text-lg"
                transition={{
                  duration: 2,
                  ease: "linear",
                }}
              >
                ✦
              </motion.span>
              <motion.p
                className="text-xs sm:text-sm font-medium tracking-widest uppercase"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                How It Works
              </motion.p>
            </motion.div>
            <motion.h1
              className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.span
                className="text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Stepwise Approach to{" "}
              </motion.span>
              <br className="hidden md:block" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedService}
                  className="gradient-text"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {selectedService}
                </motion.span>
              </AnimatePresence>
            </motion.h1>

            {/* Mobile-First Navigation Tabs */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {/* Mobile: Dropdown/Select style */}
              <div className="block md:hidden">
                <motion.div
                  className="relative w-auto max-w-[240px] mx-auto"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  {/* Trigger Button */}
                  <motion.button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm text-gray-700 font-medium"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{selectedService}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <HiChevronDown className="h-5 w-5 text-gray-500" />
                    </motion.span>
                  </motion.button>

                  {/* Dropdown List */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                      >
                        {serviceKeys.map((stepTitle, index) => (
                          <motion.button
                            key={index}
                            onClick={() => {
                              setSelectedService(stepTitle);
                              setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-all ${
                              selectedService === stepTitle
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.15 }}
                          >
                            {stepTitle}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Desktop: Horizontal tabs */}
              <div className="hidden md:flex justify-center items-center">
                <div className="flex gap-2 lg:gap-4 flex-wrap justify-center bg-gray-50 rounded-xl p-2">
                  {serviceKeys.map((stepTitle, index) => (
                    <motion.button
                      key={index}
                      className={`relative px-4 lg:px-6 py-2 lg:py-3 text-center rounded-lg cursor-pointer transition-all duration-300 font-medium text-sm lg:text-base ${
                        selectedService === stepTitle
                          ? "bg-white text-blue-600 shadow-md"
                          : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 1 + index * 0.1,
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleButtonClick(stepTitle)}
                    >
                      {stepTitle}
                      {selectedService === stepTitle && (
                        <motion.div
                          className="absolute inset-0 bg-white rounded-lg -z-10"
                          layoutId="activeTab"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedService}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
            >
              {servicesToDisplay.map((service, index) => (
                <ServiceCard key={index} service={service} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>

          <motion.hr
            className=" border-t border-gray-300"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          />

          <div className="h-[40px]"></div>
        </div>
      </section>
    </motion.div>
  );
};

export default HowItWork;
