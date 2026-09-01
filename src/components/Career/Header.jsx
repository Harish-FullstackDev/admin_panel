"use client";
import Image from "next/image";
import Navbar from "../../components/Navbar/Navbar";
import { motion } from "framer-motion";
import LoginCard from "./LoginCard";
export default function Header() {
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };
  const avatarVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1 + 0.5,
        duration: 0.4,
        type: "spring",
        stiffness: 100,
      },
    }),
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.2,
      },
    },
  };
  const BoyAvatar = ({ className }) => (
    <div
      className={`${className} bg-gray-500 rounded-full flex items-center justify-center`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="7" r="3" fill="white" />
        <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" fill="white" />
      </svg>
    </div>
  );

  const GirlAvatar = ({ className }) => (
    <div
      className={`${className} bg-gray-500 rounded-full flex items-center justify-center`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="7" r="3" fill="white" />
        <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" fill="white" />
        <circle cx="9" cy="6" r="1" fill="white" opacity="0.8" />
        <circle cx="15" cy="6" r="1" fill="white" opacity="0.8" />
      </svg>
    </div>
  );
  const avatarComponents = [
    <BoyAvatar key={0} className="w-8 h-8 border-2 border-white/50" />,
    <GirlAvatar key={1} className="w-8 h-8 border-2 border-white/50" />,
    <BoyAvatar key={2} className="w-8 h-8 border-2 border-white/50" />,
    <GirlAvatar key={3} className="w-8 h-8 border-2 border-white/50" />,
    <BoyAvatar key={4} className="w-8 h-8 border-2 border-white/50" />,
  ];
  return (
    <div className="relative overflow-x-hidden overflow-hidden">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="relative h-screen w-full flex flex-col">
          <Image
            src="/CareerPage/career.png"
            alt="Background"
            fill
            priority
            className="object-cover object-top z-0"
          />

          <div
            className="absolute inset-0 z-10"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))`,
              backgroundBlendMode: "overlay",
            }}
          />

          <Navbar />

          <div className="flex min-h-screen items-center justify-center px-4 sm:px-8 lg:px-16 relative z-20 -mt-10">
            <div className="flex-1 flex flex-col md:flex-row items-start justify-center">
              {/* Text Content */}
              <div className="flex-1 flex items-start justify-center py-8 md:py-0 -mt-2">
                <div className="text-center md:text-left max-w-5xl mx-auto">
                  <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer mb-2">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        background:
                          "linear-gradient(to right, #3650a5, #2d8ec5, #30cdb0)",
                      }}
                    ></span>
                    <span className="text-sm font-medium text-[#1E1E1E]">
                      GET HIRED
                    </span>
                  </div>

                  <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-white
            text-[clamp(1.6rem,3vw,2.4rem)]
            md:text-[clamp(2rem,3.5vw,2.8rem)]
            lg:text-[clamp(2.4rem,4vw,3.2rem)]
            xl:text-[clamp(2.8rem,4.5vw,3.6rem)]
            tracking-wide md:leading-tight
            drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                  >
                    <span>The Fastest Way to Your Next Role</span>{" "}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    className="mt-4 text-white text-[clamp(0.9rem,1.5vw,1.1rem)] md:text-[clamp(1rem,1.6vw,1.2rem)] lg:text-[clamp(1.1rem,1.7vw,1.3rem)] xl:text-[clamp(1.2rem,1.8vw,1.4rem)]
            drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                  >
                    Our platform connects employers and job seekers quickly &
                    easily. Start your journey today!
                  </motion.p>

                  <motion.div
                    className="flex items-center space-x-3 mt-4 justify-center md:justify-start"
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                  >
                    {/* Avatars */}
                    <div className="flex -space-x-2">
                      {avatarComponents.map((avatar, index) => (
                        <motion.div
                          key={index}
                          custom={index}
                          variants={avatarVariants}
                          whileHover="hover"
                          className="cursor-pointer"
                        >
                          {avatar}
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-white text-sm font-medium leading-tight">
                      <p>15K+ People</p>
                      <p>Hired</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Home Card */}
              <div className="flex-1 flex justify-center items-start py-8 md:py-0 
              ">
                <LoginCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
