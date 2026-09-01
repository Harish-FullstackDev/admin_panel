"use client";
import React from "react";
import { motion } from "framer-motion";
import BusinessEcosystemSection from "./BusinessEcosystem";
import SAPAICapabilities from "./ScheduleDemo";
import OurExpertise from "./OurExpertise";
import TechnologiesWeMaster from "./TechnologiesWeMaster";
import ProcessSection from "./ProcessSection";
import Consultation from "./Consultation";
import BusinessGrowthSection from "./BusinessGrowthSection";
import Footer from "../Footer/Footer";
import ContentHeader from "../CommonComponents/ContentHeader";

const Services = () => {
  const TechnologiesLogo = [
    { src: "/TechnologiesLogo/Angular.png", alt: "Angular" },
    { src: "/TechnologiesLogo/AWS.png", alt: "AWS" },
    { src: "/TechnologiesLogo/Azure.png", alt: "Azure" },
    { src: "/TechnologiesLogo/Docker.png", alt: "Docker" },
    { src: "/TechnologiesLogo/GraphQL.png", alt: "GraphQL" },
    { src: "/TechnologiesLogo/kubernetes.png", alt: "kubernetes" },
    { src: "/TechnologiesLogo/mongoDB.png", alt: "mongoDB" },
    { src: "/TechnologiesLogo/NextJs.png", alt: "NextJs" },
    { src: "/TechnologiesLogo/PostgreSQL.png", alt: "PostgreSQL" },
    { src: "/TechnologiesLogo/TypeScript.png", alt: "TypeScript" },
    { src: "/TechnologiesLogo/redis.png", alt: "redis" },
    { src: "/TechnologiesLogo/VueJs.png", alt: "VueJs" },
    { src: "/TechnologiesLogo/React.png", alt: "ReactLog" },
  ];
  return (
    <div className="text-gray-800 relative overflow-x-hidden">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="relative h-[75vh] w-full flex flex-col">
          {/* Background Image with `next/image` */}

          <ContentHeader
            backgroundVideo="/ServiceBGVideo.mp4"
            subtitle="We are your trusted partners in innovation."
            title=" Elevate Your Business with Cutting-Edge Solution"
            description="  Our team is committed to providing an unparalleled experience
                  for our clients. With Support Studio, you can anticipate
                  outstanding customer service, cutting-edge solutions, and a
                  dedication to achieving tangible results for your business."
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
      >
        <OurExpertise />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
      >
        <BusinessEcosystemSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
      >
        <SAPAICapabilities />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
      >
        <BusinessGrowthSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
      >
        <ProcessSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
      >
        <TechnologiesWeMaster logos={TechnologiesLogo} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
      >
        <Consultation />
      </motion.div>

      <Footer />
    </div>
  );
};

export default Services;
