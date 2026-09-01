import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const CyclingMarquee = ({ logos, logosPerSet, intervalTime }) => {
  const [currentSet, setCurrentSet] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind's sm breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Determine logos per set based on screen size
  const currentLogosPerSet = isMobile ? 3 : logosPerSet;

  // Calculate how many sets we need based on current screen size
  const totalSets = Math.ceil(logos.length / currentLogosPerSet);

  // Auto-cycle through sets
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev + 1) % totalSets);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [totalSets, intervalTime]);

  // Reset current set when screen size changes
  useEffect(() => {
    setCurrentSet(0);
  }, [isMobile]);

  // Get current set of logos
  const getCurrentLogos = () => {
    const startIndex = currentSet * currentLogosPerSet;
    const endIndex = startIndex + currentLogosPerSet;
    return logos.slice(startIndex, endIndex);
  };

  return (
    <div className="mx-2 sm:mx-4 lg:mx-6 mb-4 sm:mb-6 lg:mb-8 overflow-x-hidden">
      <div className="py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 flex flex-col justify-center min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]">
        <p className="text-center text-gray-600 text-xs sm:text-sm font-medium tracking-wider uppercase mb-3 sm:mb-4 lg:mb-6 px-2">
          <span className="text-blue-500 mr-2 text-sm sm:text-base">
            ✦
          </span>
          OUR PROUD PARTNERS
        </p>

        {/* Cycling Logo Container */}
        <div className="flex items-center justify-center min-w-[90px] sm:min-w-[60px] lg:min-w-[120px] h-12 sm:h-5 lg:h-12 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSet}-${isMobile}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex items-center justify-center space-x-3 sm:space-x-4 lg:space-x-8 w-full max-w-full"
            >
              {getCurrentLogos().map((logo, index) => (
                <motion.div
                  key={`${currentSet}-${index}-${isMobile}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  className="flex items-center justify-center min-w-[50px] sm:min-w-[70px] lg:min-w-[120px] h-5 sm:h-6 lg:h-12 flex-shrink-0"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={100}
                    height={70}
                    className="w-20 sm:w-14 lg:w-24 h-auto object-contain opacity-80 hover:opacity-100 transition-all duration-300"
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center mt-3 sm:mt-4 space-x-1.5 sm:space-x-2">
          {Array.from({ length: totalSets }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSet(index)}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${index === currentSet
                  ? "bg-blue-600 w-4 sm:w-6"
                  : "bg-gray-300 hover:bg-gray-400"
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CyclingMarquee;