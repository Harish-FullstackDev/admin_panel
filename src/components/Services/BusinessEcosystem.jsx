import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const SAPBusinessEcosystemSection = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const headerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20, duration: 0.8 },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 20, duration: 0.6 },
    },
  };

  const services = [
    {
      id: 1,
      title: "SAP S/4 HANA Implementation",
      description:
        "We are a forward-thinking AI agency specializing in cutting-edge AI.",
      image: "/ServicePage/HANA.png",
      gradient: "from-blue-900 via-blue-800 to-indigo-900",
    },
    {
      id: 2,
      title: "Cloud Migration Services",
      description:
        "Our team excels in seamless cloud transitions to enhance operational efficiency.",
      image: "/ServicePage/HANA.png",
      gradient: "from-gray-900 via-gray-800 to-black",
    },
    {
      id: 3,
      title: "Data Analytics Solutions",
      description:
        "Leveraging big data, we provide insights that drive strategic business decisions.",
      image: "/ServicePage/HANA.png",
      gradient: "from-cyan-900 via-blue-900 to-indigo-900",
    },
  ];

  return (
    <>
      <section className="lg:py-6 py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16 -mt-5"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-blue-500 text-base sm:text-lg">✦</span>
              <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
                Enterprise Solutions
              </p>
            </div>
            <motion.h1
              className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
             SAP Solutions. Scalable to Your  <motion.span
                className="gradient-text bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Business.
              </motion.span>
           
            </motion.h1>
          </motion.div>

          {/* Cards Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={cardVariants}
                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer"
                onMouseEnter={() => setHoveredCard(service.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{ transition: { duration: 0.3 } }}
              >
                {/* Image/Header Section */}
                <div
                  className={`relative h-48 bg-gradient-to-br ${service.gradient} overflow-hidden`}
                >
                  {/* Animated particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.5, 1.2, 0.5] }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 3,
                        }}
                      />
                    ))}
                  </div>

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>

                  {/* Optimized background image */}
                  <motion.div className="absolute inset-0">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                    />
                  </motion.div>
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-500 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>

                  {/* See More Button */}
                  <motion.button
                    className="group/btn relative px-6 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-300 hover:bg-blue-600 hover:shadow-lg overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <span>Read more</span>
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <div className="h-[60px]"></div>
    </>
  );
};

export default SAPBusinessEcosystemSection;
