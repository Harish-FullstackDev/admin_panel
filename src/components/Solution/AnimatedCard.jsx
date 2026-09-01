import React, { useState } from 'react';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cardData } from '../Constants/AnimatedCardData';


const Card = ({ title, description, onCardClick, imageSrc, reportType, stats, bottomContent, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Card animation variants
  const cardVariants = {
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
        duration: 0.8,
        ease: "easeOut",
        delay: index * 0.15, // Stagger animation
      },
    },
  };

  // Stats animation variants
  const statsVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: (index * 0.15) + 0.4, // Delay after card animation
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div 
        className="relative w-full h-[18rem] rounded-3xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onCardClick}
        // whileHover={{ 
        //   scale: 1.05,
        //   transition: { duration: 0.3 }
        // }}
        // whileTap={{ scale: 0.98 }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src={imageSrc} 
            alt={title} 
            fill 
            className={`object-cover transition-all duration-700 ${
              isHovered ? 'scale-125 blur-sm' : 'scale-100 blur-0'
            }`} 
            priority 
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6">
          {/* Header - Always visible */}
          <div className="text-white">
            <p className="text-sm font-medium opacity-90 mb-2 tracking-wide">
              {reportType}
            </p>
          </div>

          {/* Main Content - Animated on hover */}
          <div className={`text-white transition-all duration-700 ${
            isHovered 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-8'
          }`}>
            <h1 className="text-2xl font-bold leading-tight mb-4">
              {title}
            </h1>
            <div className="space-y-3 text-sm opacity-90">
              <p>
                {description}
              </p>
            </div>
          </div>

          {/* Arrow Icon - Always visible, enhanced on hover */}
          <div className="flex justify-end">
            <FaArrowRight className={`text-white text-2xl transition-all duration-300 ${
              isHovered 
                ? 'opacity-100 translate-x-0 scale-110' 
                : 'opacity-70 translate-x-0 scale-100'
            }`} />
          </div>
        </div>

        {/* Shimmer Effect on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-all duration-1000 ${
          isHovered 
            ? 'translate-x-full opacity-100' 
            : '-translate-x-full opacity-0'
        }`}></div>
      </motion.div>

      {/* Bottom Statistics Section - With motion animation */}
      <motion.div 
        className="mt-4 mb-5"
        variants={statsVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        <h2 className="text-black text-xl font-bold mb-3">
          {bottomContent.title}
        </h2>
        
        <div className="flex items-center border-t-2 border-gray-400 space-x-8">
          {stats.map((stat, statIndex) => (
            <motion.div 
              key={statIndex} 
              className="flex flex-col items-start mt-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5, 
                delay: (index * 0.15) + 0.6 + (statIndex * 0.1) 
              }}
            >
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-gray-500 text-xl font-bold">{stat.value}</span>
                {/* <FaArrowUp className="text-green-400 text-lg" /> */}
              </div>
              <p className="text-base text-gray-600 leading-tight max-w-[200px]">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};


const AnimatedCard = () => {
  const router = useRouter();

  // Navigation handler function
  const handleCardClick = (cardTitle) => {
    if (cardTitle === "ERP") {
      router.push("/solutions/erp/Hanaonpremises");
    }
     else if (cardTitle === "Business Technology") {
      router.push("/solutions/businessTechnology/BTP");
    }
     else if (cardTitle === "HCM") {
      router.push("/solutions/HCM/SAPSuccess");
    }
      else if (cardTitle === "Customer Experience") {
      router.push("/solutions/CustomerExperience/CRM");
    }
     else if (cardTitle === "Finance and Controlling") {
      router.push("/solutions/FinanceControlling/FICO");
    }
     else if (cardTitle === "Supply Spend Management") {
      router.push("/solutions/SpendManagement/Procurement");
    }
  };

 

  // Header animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <>
      <div></div>
      <div className=" mt-6 p-2 overflow-x-hidden overflow-hidden">
        {/* Header Section with Motion */}
        <div className="py-4 px-8">
          <motion.div 
            className="max-w-7xl mx-auto text-center mb-10"
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Case Study Badge */}
            <motion.div 
              className="inline-flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-blue-500 text-base sm:text-lg">✦</span>
              <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
                OUR SOLUTION
              </p>
            </motion.div>
            
            {/* Main Heading */}
            <motion.h2 
              className="text-2xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Driving Digital Growth with 
              <span className="gradient-text"> SAP Solutions</span>
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p 
              className="text-gray-600 sm:text-lg leading-relaxed max-w-1xl mx-auto px-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Discover how solutions drive significant business growth and transformative results.
            </motion.p>
          </motion.div>
     
          {/* Cards Grid with Motion Container */}
          <motion.div 
            className="max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-20 gap-y-10">
              {cardData.map((card, index) => (
                <Card
                  key={index}
                  title={card.title}
                  description={card.description}
                  tags={card.tags}
                  imageSrc={card.imageSrc}
                  reportType={card.reportType}
                  stats={card.stats}
                  bottomContent={card.bottomContent}
                  onCardClick={() => handleCardClick(card.title)}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>      
    </>
  );
};

export default AnimatedCard;