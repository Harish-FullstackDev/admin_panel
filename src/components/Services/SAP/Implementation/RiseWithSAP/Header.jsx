import React from 'react'
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import { motion } from "framer-motion";
import InnerPagesolution from "@/assets/Service/InnerPagesolution.svg";

const Header = () => {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.6,
        delayChildren: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const titleVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <div className="text-gray-800 relative overflow-x-hidden overflow-hidden">
         <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
           <div className="relative h-[75vh] w-full flex flex-col">
             {/* Background Image */}
             <Image
               src={InnerPagesolution}
               alt="Contact Background"
               fill  
               priority
               className="object-cover z-0"
             />
   
             {/* Gradient Overlay */}
             <div
               className="absolute inset-0 z-10"
               style={{
                 backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))`,
                 backgroundBlendMode: "overlay",
               }}
             />
   
             {/* Navbar */}
             <Navbar />
   
             {/* Content Container */}
        <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center px-4 sm:px-8">
          <div className="max-w-4xl text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-white">
                Unlock Your Business Potential
              </h1>
              <p className="text-4xl sm:text-5xl lg:text-6xl font-normal text-white ">
                with Our Expert Solutions.
              </p>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
              From innovative marketing strategies to operational excellence, we provide tailored solutions to help your business grow, scale, and thrive.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <button className="px-3 py-1 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition duration-300 shadow-lg hover:shadow-xl">
                Contact Me
              </button>
              <button className="px-3 py-1 border-2 border-white text-black font-semibold rounded-lg bg-white hover:bg-gray-200 transition duration-300">
                Let’s Collaborate
              </button>
            </div>
          </div>

          {/* Right Side Image/Stats Box */}
          {/* <div className="absolute bottom-12 right-8 hidden lg:block">
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-lg p-6 w-64">
              <div className="space-y-4">
                <p className="text-white font-semibold text-sm">Recent Success Cases</p>
                <div className="flex gap-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg"></div>
                </div>
                <p className="text-gray-300 text-xs">Trusted by 500+ businesses worldwide</p>
              </div>
            </div>
          </div> */}
        </div>

           </div>
         </div>
       </div>
  )
}

export default Header