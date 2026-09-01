import { useRef, useEffect, useState } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Growth } from "../Constants/Service/BusinessGrowthData";

export default function BusinessGrowthLanding() {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    threshold: 0.1,
    margin: "0px 0px -50px 0px",
  });

  const mainControls = useAnimation();
  const cardControls = useAnimation();

  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
      cardControls.start("visible");
    }
  }, [isInView, mainControls, cardControls]);

  // ===== Scroll Handler (updates active dot) =====
  const handleHorizontalScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = el.clientWidth * 0.85 + 16;
    const index = Math.round(el.scrollLeft / cardWidth);

    setActiveIndex(Math.min(index, Growth.length - 1));
  };

  // ===== Scroll to card when dot clicked =====
  const scrollToIndex = (index) => {
    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = el.clientWidth * 0.85 + 16;

    el.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });

    setActiveIndex(index);
  };

  // ===== Animations (unchanged) =====
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const leftColumnVariants = {
    hidden: { opacity: 0, x: -60, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.15,
      },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.2 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.4 },
    },
  };

  const cardContainerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.12,
        delayChildren: 0.3,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.85 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      ref={ref}
      className="pt-12 pb-0 px-4 sm:pt-18 sm:px-6 relative overflow-x-hidden"
      initial="hidden"
      animate={mainControls}
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 lg:gap-12">

          {/* LEFT CONTENT */}
          <motion.div
            className="space-y-4 sm:space-y-6"
            variants={leftColumnVariants}
          >
            <motion.h1
              className="text-2xl sm:text-4xl lg:text-5xl font-normal leading-tight"
              variants={headingVariants}
            >
              What We Can Do for Your <br />
              <span className="gradient-text">
                Business Growth Today
              </span>
            </motion.h1>

            <motion.p
              className="text-gray-600 text-base sm:text-lg leading-relaxed"
              variants={textVariants}
            >
              We go beyond providing a service. We partner with you to achieve
              sustainable growth and competitive advantage by leveraging
              technology and data.
            </motion.p>
          </motion.div>

          {/* MOBILE SLIDER */}
          <div className="block md:hidden">

            {/* SLIDER */}
            <div
              ref={scrollRef}
              onScroll={handleHorizontalScroll}
              className="
                flex gap-4
                overflow-x-auto
                snap-x snap-mandatory
                scrollbar-hide
                px-1 py-2
              "
            >
              {Growth.map((service, index) => (
                <motion.div
                  key={index}
                  className="flex-shrink-0 snap-center"
                  variants={cardVariants}
                >
                  <div
                    className="
                      relative
                      w-[85vw]
                      max-w-[320px]
                      h-[320px]
                      rounded-2xl
                      overflow-hidden
                      border border-gray-200
                      shadow-lg
                    "
                    style={{
                      backgroundImage: "url(/ServicePage/GrowthToday5.png)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/35" />

                    <div className="relative z-10 p-5 h-full flex flex-col justify-end">
                      <h3 className="text-white text-xl font-semibold mb-3">
                        {service.title}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* DOTS */}
            <div className="flex justify-center items-center gap-2 mt-5">
              {Growth.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    activeIndex === index
                      ? "w-6 h-2 bg-cyan-500"
                      : "w-2 h-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* DESKTOP GRID */}
          <motion.div
            className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={cardContainerVariants}
          >
            {Growth.map((service, index) => (
              <motion.div
                key={index}
                className="relative h-80 rounded-2xl overflow-hidden shadow-md"
                style={{
                  backgroundImage: "url(/ServicePage/GrowthToday5.png)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                variants={cardVariants}
              >
                <div className="absolute inset-0 bg-black/25" />

                <div className="absolute bottom-0 p-5 text-white">
                  <h3 className="text-lg font-semibold">
                    {service.title}
                  </h3>
                  <p className="text-sm text-white/90">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}