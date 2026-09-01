import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const AboutValues = () => {
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

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 80,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

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

  const values = [
    {
      id: 1,
      title: "Innovation at Core",
      description:
        "We embrace change and continuously explore new technologies to create future-ready solutions",
    },
    {
      id: 2,
      title: "Client Success First",
      description:
        "We build trusted partnerships and deliver solutions that drive lasting business growth.",
    },
    {
      id: 3,
      title: "Excellence Through Integrity",
      description:
        "We uphold quality, transparency, and accountability to deliver reliable clint solutions.",
    },
  ];

  return (
    <section className=" lg:py-5 px-4 overflow-x-hidden overflow-hidden">
      <div className="max-w-7xl mx-auto ">
        <motion.div
          className="text-center mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 "
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              OUR VALUES
            </p>
          </motion.div>

          <motion.h2
            className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The Principles That <span className="gradient-text"> Guide Us</span>
          </motion.h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {values.slice(0, 3).map((value, index) => (
            <motion.div
              key={value.id}
              className="relative overflow-hidden rounded-2xl p-8 transition-all duration-300 h-96
               shadow-[0_0_20px_rgba(0,0,0,0.15)] hover:shadow-[0_0_25px_rgba(0,0,0,0.25)]"
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.3 },
              }}
            >
              <div className="absolute inset-0">
                <Image
                  src="/AboutPage/OueValue.png"
                  alt="Background Pattern"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-end">
                <motion.h3
                  className="text-2xl font-semibold text-white mb-4 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  {value.title}
                </motion.h3>

                <motion.p
                  className="text-white text-base leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  {value.description}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AboutValues;

