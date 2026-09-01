import React, { useState, useRef, useEffect } from "react";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import CountingNumber from "./CountingNumber";
import { accordionItems, text } from "../Constants/Home/WhoWeAreData";
import Image from "next/image";

const AccordionItem = ({
  title,
  content,
  Icon,
  isOpen,
  onHover,
  isGradient,
}) => {
  return (
    <motion.div
      className={`rounded-xl p-4 transition-all duration-500 ease-in-out cursor-pointer transform hover:scale-[1.02] hover:shadow-xl ${
        isOpen && isGradient
          ? "bg-gradient-to-r from-[#3650a5] via-[#2d8ec5] to-[#30cdb0] shadow-lg"
          : isOpen
          ? "bg-gray-800 shadow-lg"
          : "border border-gray-700 bg-gray-900 hover:border-gray-600"
      }`}
      onMouseEnter={onHover}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            className="rounded-full border border-white p-2 mt-3"
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            style={{
              y: useTransform(useScroll().scrollY, [0, 300], [0, -10]),
            }}
          >
            {Icon && (
              <Image
                src={Icon}
                alt={title}
                className="w-6 h-6 transition-all duration-300"
              />
            )}
          </motion.div>
          <h3
            className={`font-semibold transition-all duration-300 ${
              isOpen || isGradient ? "text-white" : "text-gray-200"
            }`}
          >
            {title}
          </h3>
        </div>
        <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
          {isOpen ? (
            <HiOutlineChevronUp
              className={`w-6 h-6 transition-all duration-300 ${
                isOpen ? "text-white rotate-180" : "text-gray-400"
              }`}
            />
          ) : (
            <HiOutlineChevronDown
              className={`w-6 h-6 transition-all duration-300 ${
                isOpen ? "text-white" : "text-gray-400"
              }`}
            />
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="text-sm text-gray-200 border-t border-white/10 pt-4">
              <p className="leading-relaxed">{content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const WhoWeAre = () => {
  const [openItem, setOpenItem] = useState("data");
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.2,
        rootMargin: "50px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.15, 
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.9, ease: "easeOut" },
    },
  };

  return (
    <>
      <div className="h-[40px]"></div>
      <motion.div
        ref={sectionRef}
        className="bg-gray-950 text-white rounded-2xl p-8 md:p-16 flex items-center justify-center overflow-hidden overflow-x-hidden"
        style={{ margin: "1rem" }}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={containerVariants}
        whileInView={{
          boxShadow: "0 0 20px rgba(48, 205, 176, 0.3)",
          transition: { duration: 1.5, ease: "easeInOut" },
        }}
      >
        <div className="h-[40px]"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:grid-flow-dense">
          {/* Right Column on Mobile, Left on Desktop - Content */}
          <motion.div
            className="flex flex-col justify-between space-y-8 md:order-2"
            variants={itemVariants}
          >
            <motion.div variants={titleVariants}>
              <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                <span className="text-blue-500 mr-2">✦</span>
                <p className="text-white text-sm font-medium tracking-wider uppercase">
                  Who We Are
                </p>
              </div>
              <h1 className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight">
                <span>Smart Enterprise </span>
                <span className="gradient-text bg-clip-text text-transparent">
                   Transformation
                </span>
              </h1>
              <motion.p
                className="mt-6 text-gray-400 max-w-lg"
                variants={itemVariants}
              >
                {text}
              </motion.p>
            </motion.div>
            <motion.div
              className="grid grid-cols-3 gap-6 mt-8"
              variants={itemVariants}
            >
              <div className="text-center">
                <CountingNumber
                  end={210}
                  duration={2000}
                  suffix="+"
                  start={isVisible} 
                />
                <p className="mt-2 text-sm text-gray-400">
                  Projects Delivered
                </p>
              </div>
              <div className="text-center">
                <CountingNumber
                  end={8}
                  duration={2000}
                  suffix="+"
                  start={isVisible}
                />
                <p className="mt-2 text-sm text-gray-400">Quality Awards</p>
              </div>
              <div className="text-center">
                <CountingNumber
                  end={300}
                  duration={2000}
                  suffix="%"
                  start={isVisible}
                />
                <p className="mt-2 text-sm text-gray-400">Global Resources</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Left Column on Mobile, Right on Desktop - Accordion */}
          <motion.div
            className="flex flex-col space-y-4 md:order-1"
            variants={itemVariants}
          >
            {accordionItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, x: -20, scale: 0.95 }, // Slide in from left
                  visible: {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    transition: { duration: 0.7, delay: index * 0.1 }, // Staggered delay
                  },
                }}
              >
                <AccordionItem
                  title={item.title}
                  content={item.content}
                  Icon={item.icon}
                  isOpen={openItem === item.id}
                  onHover={() => setOpenItem(item.id)}
                  isGradient={item.isGradient}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
        <div className="h-[40px]"></div>
      </motion.div>
    </>
  );
};

export default WhoWeAre;