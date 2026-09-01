"use client";
 
import { useState } from "react";
import { motion} from "framer-motion";
import Image from "next/image";
 
// Import SVGs for collapsed states
import SAPIcon1 from "../../assets/Home/OurServiceIcons/SAP_logo.svg";
import MicrosoftIcon1 from "../../assets/Home/OurServiceIcons/Microsoft_logo.svg";
import CloudIcon1 from "../../assets/Home/OurServiceIcons/Cloud_logo.svg";
import DesignIcon1 from "../../assets/Home/OurServiceIcons/Design_logo.svg";
import SAPIcon2 from "../../assets/Home/OurServiceIcons/SAP_logo_bottom.svg";
import MicrosoftIcon2 from "../../assets/Home/OurServiceIcons/Microsoft_logo_bottom.svg";
import CloudIcon2 from "../../assets/Home/OurServiceIcons/Cloud_logo_bottom.svg";
import DesignIcon2 from "../../assets/Home/OurServiceIcons/Design_logo_bottom.svg";
 
const serviceCards = [
  {
    id: "sap",
    title: "SAP Services",
    expandedTitle: "SAP Services",
    description: "From implementation to S/4HANA Conversion, Rollout, Migration, and AMS Support our Certified SAP expertise ensures seamless digital transformation.",
    icon1: SAPIcon1,
    icon2: SAPIcon2,
  },
  {
    id: "microsoft",
    title: "Microsoft Solutions",
    expandedTitle: "Microsoft Solutions",
    description: "Enhance efficiency with Dynamics 365, Power BI, and Azure. Unlock smarter decisions, streamline processes, and accelerate growth.",
    icon1: MicrosoftIcon1,
    icon2: MicrosoftIcon2,
  },
  {
    id: "cloud",
    title: "Cloud Services",
    expandedTitle: "Cloud & Digital Transformation",
    description: "Empowering enterprises with AWS, Azure, and Google Cloud integrated with AI, ML, IoT, and Big Data for innovation at scale.",
    icon1: CloudIcon1,
    icon2: CloudIcon2,
  },
  {
    id: "design",
    title: "Design Services",
    expandedTitle: "Design & Development",
    description: "Building intuitive UI/UX, scalable full-stack applications, and custom software solutions that redefine user experiences.",
    icon1: DesignIcon1,
    icon2: DesignIcon2,
  },
];
 
export default function ServiceStackedCards({ height = "400px" }) {
  const [active, setActive] = useState(0);
 
  return (
    <div
      className="flex w-full overflow-hidden bg-slate-100/10 border border-slate-200/20 shadow-xl"
      style={{ height }}
    >
      {serviceCards.map((card, index) => {
        const isActive = active === index;
 
        return (
          <motion.div
            key={card.id}
            onClick={() => setActive(index)}
            transition={{
                          duration: 0.75,
                          ease: [0.22, 1, 0.36, 1],
                        }}
            className={`
              relative
              cursor-pointer
              overflow-hidden
              border-r
              border-white/10
              last:border-r-0
              transition-all
              duration-500
              flex
              flex-col
              justify-between
              ${isActive ? "flex-[6] gradient-card-active" : "flex-[0.6] gradient-card-inactive"}
            `}
          >
            {/* Collapsed State Layout */}
            {!isActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-between py-8 px-1 z-10">
                {/* Title rotating vertically */}
                <span
                  className="
                    [writing-mode:vertical-rl]
                    rotate-180
                    font-semibold
                    text-xs
                    tracking-wider
                    uppercase
                    select-none
                  "
                >
                  {card.title}
                </span>
 
                {/* Small Icon at bottom */}
                <div className="w-6 h-6 relative opacity-70">
                  <Image
                    src={card.icon2}
                    alt={card.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
 
           
          {/* Active Content State */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="relative w-full h-full flex flex-col p-5 select-none"
            >
              {/* Top row */}
              <div className="flex items-center justify-between w-full">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-white text-[#1f2937] flex items-center justify-center border border-black/10 shadow-md hover:scale-105 transition-transform duration-200">
                  <div className="w-6.5 h-6.5 relative">
                    <Image
                      src={card.icon1}
                      alt={card.title}
                      fill
                      className="object-contain filter"
                    />
                  </div>
                </div>
 
                {/* Arrow */}
                <div className="w-8 h-8 rounded-full bg-white text-[#1f2937] flex items-center justify-center shadow-md hover:scale-105 transition-transform duration-200">
                  <svg
                    className="w-4.5 h-4.5 rotate-45 text-slate-800"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
 
              {/* Content */}
              <div className="flex-1 flex flex-col justify-end gap-3 pb-2">
                <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 font-medium">
                  Enterprise Solutions
                </span>
 
                <h3 className="text-2xl font-bold leading-tight text-slate-800">
                  {card.expandedTitle}
                </h3>
 
                <p className="text-sm leading-relaxed text-slate-700 max-w-[95%]">
                  {card.description}
                </p>
              </div>
            </motion.div>
          )}
          </motion.div>
        );
      })}
    </div>
  );
}
 
 