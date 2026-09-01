import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import HomeCard from "../Cards/HomeCard";
import { processSteps } from "../Constants/Service/ProcessSectionData";

const ProcessSection = () => {
  return (
    <>
      <div className="h-[40px]"></div>

      <div className="relative overflow-x-hidden overflow-hidden">
        {/* Optimized Background Image */}
        <div className="absolute inset-0 h-auto min-h-[400px] md:h-[600px] md:top-1/2 md:-translate-y-1/2">
          <Image
            src="/ServicePage/Card_BG_S.webp"
            alt="Process Section Background"
            fill
            priority
            quality={90}
            className="object-cover object-center"
          />
        </div>

        {/* Content Layer */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 rounded-2xl z-10"
          style={{ margin: "1rem" }}
        >
          <div className="flex flex-col lg:flex-row items-start gap-8 max-w-7xl mx-auto">
            {/* Left Text Div - 40% */}
            <div className="lg:w-[40%] w-full text-center lg:text-left mt-6">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <span className="text-blue-500 text-lg mr-2">✦</span>
                <p className="text-white text-sm font-medium tracking-widest uppercase">
                  Our Journey
                </p>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4 ">
                Our Simple & Effective Process
              </h2>
              <p className="text-white gap-y-12 text-lg leading-relaxed max-w-xl">
                From initial consultation to successful implementation, we guide
                you through every step of your digital transformation journey
                with clarity and expertise.
              </p>
            </div>

            {/* Right Process Steps Div - 60% */}
            <div className="lg:w-[60%] w-full flex items-center justify-center p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full">
                {processSteps.map((step, index) => (
                  <HomeCard
                    key={index}
                    icon={step.icon}
                    index={index}
                    title={step.title}
                    desc={step.desc}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </>
  );
};

export default ProcessSection;
