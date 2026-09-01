"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Banner from "../../assets/Service/ExpertiseCard_BG.svg";
import { useRouter } from "next/navigation";
import { SiSap } from "react-icons/si";
import { TfiMicrosoft } from "react-icons/tfi";
import { MdArrowOutward, MdOutlineCloud } from "react-icons/md";
import { GrTechnology } from "react-icons/gr";
import { FaCode } from "react-icons/fa6";
import { SiAntdesign } from "react-icons/si";

const OurExpertise = () => {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const Services = [
    {
      icon: SiSap,
      title: "SAP Services",
      description: "SAP streamlines processes and enables smarter decisions.",
      link: "/services/sapService/rise-with-sap",
    },
    {
      icon: TfiMicrosoft,
      title: "Microsoft Services",
      description:
        "Microsoft empowers organizations with cloud and modern tools.",
    },
    {
      icon: MdOutlineCloud,
      title: "Cloud Services",
      description:
        "Secure cloud solutions for agile, innovative business organizations.",
    },
    {
      icon: GrTechnology,
      title: "Digital Transformation",
      description:
        "Enabling digital-first strategies for sustainable growth organizations.",
    },
    {
      icon: FaCode,
      title: "Web & Product Development",
      description:
        "Creating responsive, scalable, high-performing web applications.",
    },
    {
      icon: SiAntdesign,
      title: "UI/UX Design",
      description:
        "Engage your audience with highly relevant messaging organizations.",
    },
  ];

  return (
    <div>
      <section className=" relative pt-16 sm:pt-16 md:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 overflow-hidden -mt-5 overflow-x-hidden">
        {/* Content */}
        <div className="max-w-4xl mx-auto text-center mb-3 sm:mb-16 relative z-10">
          <div className="flex items-center justify-center mb-2 gap-2">
            <span className="text-blue-500 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              Our Expertise
            </p>
          </div>
          <h2 className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4">
            What We Offer <br className="sm:hidden" /><span className="gradient-text">For You</span>
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto px-2">
            We provide a full range of services from enterprise solutions to
            cloud adoption, product development, and design — helping businesses
            innovate, transform, and thrive in the digital era.
          </p>
        </div>

        {/* Cards Container with Background */}
        <div className="relative py-8 sm:py-12 md:py-16">
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-4/5 max-w-4xl h-3/4 rounded-2xl overflow-hidden">
            <Image
              src={Banner}
              alt="Background Banner"
              priority
              fill
              sizes="(max-width: 768px) 80vw, (max-width: 1200px) 70vw, 60vw"
              // className="object-cover "
            />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="relative z-10 max-w-7xl mx-auto bg-blue-300/20 backdrop-blur-lg  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 p-6 rounded-2xl "
          >
            <div className="absolute inset-0 bg-[8EC5FF] filter blur-3xl -z-10"></div>

            {Services.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  onClick={() => feature.link && router.push(feature.link)}
                  className="group relative w-full bg-white backdrop-blur-md p-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
                >
                  <div className="items-start relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-blue-500 flex-1">
                        {feature.title}
                      </h3>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110 ml-3">
                        <IconComponent className="w-6 h-6 text-gray-600 transition-colors duration-200" />
                      </div>
                    </div>

                    {/* Description with inline hover-arrow at the end of text */}
                    <div className="mt-4">
                      <p className="text-base leading-relaxed text-grey-400">
                        {feature.description}
                        <span className="ml-2 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 ease-out inline-block align-text-bottom">
                          <MdArrowOutward className="w-5 h-5 text-blue-500 group-hover:text-blue-500" />
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default OurExpertise;
