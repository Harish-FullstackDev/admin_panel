import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChevronDown } from "react-icons/hi";
import { faqs } from "../Constants/Home/HomeFaqData";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleItemClick = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const leftSectionVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const rightSectionVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const faqItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const answerVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      y: -10,
    },
    visible: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        opacity: { delay: 0.1 },
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount: 0.2,
        margin: "-100px 0px -100px 0px",
      }}
      variants={containerVariants}
      className="p-6 sm:p-8 lg:p-10 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 overflow-hidden "
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Left Section */}
        <motion.div
          variants={leftSectionVariants}
          className="flex flex-col justify-start ml-6"
        >
          <motion.p
            variants={itemVariants}
            className="text-blue-600 font-semibold text-sm mb-2 flex items-center"
          >
            <span className="mr-2">✦</span> FAQ'S
          </motion.p>

          <motion.h2
            variants={itemVariants}
            className="text-4xl lg:text-6xl xl:text-4xl text-gray-900 font-normal leading-tight mb-3"
          >
            <span className="">Frequently asked questions on</span>
            <br />
            <span className="gradient-text">SAP Services</span>{" "}
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-gray-700 text-sm sm:text-base leading-relaxed"
          >
            Find answers to common queries about our AI solutions and services
            in a clear and concise format.
          </motion.p>
        </motion.div>

        {/* Right Section - FAQ Items */}
        <motion.div variants={rightSectionVariants} className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                variants={faqItemVariants}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                  isOpen ? "gradient-primary" : "bg-white/70 hover:bg-white/90"
                }`}
                onClick={() => handleItemClick(index)}
              >
                <motion.div
                  className="flex justify-between items-center p-3 sm:p-4"
                  layout
                >
                  <h3
                    className={`font-medium text-sm sm:text-base ${
                      isOpen ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{
                      rotate: isOpen ? 180 : 0,
                      scale: isOpen ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <HiOutlineChevronDown
                      className={`w-5 h-5 ${
                        isOpen ? "text-white" : "text-gray-700"
                      }`}
                    />
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      variants={answerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="overflow-hidden"
                    >
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <p className="text-white text-sm sm:text-sm leading-snug">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FAQ;
