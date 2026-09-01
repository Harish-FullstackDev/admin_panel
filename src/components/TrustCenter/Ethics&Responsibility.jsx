import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const ResponsibilitySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const isInViewport = useInView(sectionRef, { once: true, threshold: 0.1 });

  useEffect(() => {
    if (isInViewport) {
      setIsVisible(true);
    }
  }, [isInViewport]);

  // Card data
  const cards = [
    {
      title: "Sustainability Mindset",
      description:
        "We prioritize environmental consciousness in every decision, creating solutions that minimize ecological impact while maximizing positive outcomes for future generations.",
      bgImage:
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2070&q=80",
      gradient: "from-green-800 to-green-900",
      overlayGradient: "from-green-900/80 to-green-700/60",
      colSpan: "lg:col-span-6",
    },
    {
      title: "Responsible Innovation",
      description:
        "Innovation guided by ethics and social responsibility, ensuring our technological advances contribute positively to society and human wellbeing.",
      bgImage:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=2069&q=80",
      gradient: "from-blue-800 to-blue-900",
      overlayGradient: "from-blue-900/80 to-blue-700/60",
      colSpan: "lg:col-span-4",
    },
    {
      title: "Fair Engagement",
      description:
        "Building inclusive partnerships and maintaining transparent, equitable relationships with all stakeholders across diverse communities and markets.",
      bgImage:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=2069&q=80",
      gradient: "from-orange-800 to-orange-900",
      overlayGradient: "from-orange-900/80 to-orange-700/60",
      colSpan: "lg:col-span-4",
    },
    {
      title: "Global Responsibility",
      description:
        "Embracing our role as global citizens, we consider the worldwide impact of our actions and strive to contribute to a more just and sustainable world.",
      bgImage:
        "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=2128&q=80",
      gradient: "from-indigo-800 to-indigo-900",
      overlayGradient: "from-indigo-900/80 to-indigo-700/60",
      colSpan: "lg:col-span-6",
    },
  ];

  const ResponsibilityCard = ({ card, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect if device is mobile/touch
    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window);
      };
      
      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      
      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Determine if card should show content
    const shouldShowContent = isMobile ? isClicked : isHovered;

    const handleCardClick = () => {
      if (isMobile) {
        setIsClicked(!isClicked);
      }
    };

    const cardVariants = {
      hidden: {
        opacity: 0,
        y: 60,
        scale: 0.9,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.6,
          delay: index * 0.15,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      hover: {
        scale: 1.05,
        y: -8,
        transition: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };

    const titleVariants = {
      default: {
        y: 0,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      active: {
        y: -96,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };

    const descriptionVariants = {
      default: {
        opacity: 0,
        y: 32,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      active: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };

    const backgroundVariants = {
      default: {
        scale: 1,
        filter: "blur(0px) brightness(1)",
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      active: {
        scale: 1.1,
        filter: "blur(1px) brightness(0.75)",
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };

    return (
      <motion.div
        className={`${card.colSpan} relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} text-white min-h-[280px] group cursor-pointer select-none overflow-x-hidden`}
        variants={cardVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        whileHover={!isMobile ? "hover" : {}}
        onHoverStart={() => !isMobile && setIsHovered(true)}
        onHoverEnd={() => !isMobile && setIsHovered(false)}
        onClick={handleCardClick}
        whileTap={isMobile ? { scale: 0.98 } : {}}
      >
        {/* Background Image */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${card.bgImage}')`,
          }}
          variants={backgroundVariants}
          animate={shouldShowContent ? "active" : "default"}
        />

        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${card.overlayGradient}`}
        />

        {/* Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-white/30" />

        {/* Mobile tap indicator */}
        {/* {isMobile && (
          <div className="absolute top-4 right-4 z-20">
            <motion.div
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center"
              animate={{
                scale: shouldShowContent ? [1, 1.2, 1] : 1,
                rotate: shouldShowContent ? 180 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {shouldShowContent ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                )}
              </svg>
            </motion.div>
          </div>
        )} */}

        {/* Content Container */}
        <div className="relative z-10 h-full p-8">
          {/* Title */}
          <motion.div
            className="absolute bottom-8 left-8 right-8"
            variants={titleVariants}
            animate={shouldShowContent ? "active" : "default"}
          >
            <h3 className="text-2xl font-bold drop-shadow-lg mb-4">
              {card.title}
            </h3>
          </motion.div>

          {/* Description */}
          <motion.div
            className="absolute bottom-8 left-8 right-8"
            variants={descriptionVariants}
            animate={shouldShowContent ? "active" : "default"}
          >
            <p className="text-white/90 leading-relaxed text-sm">
              {card.description}
            </p>
          </motion.div>
        </div>

        {/* Mobile instruction overlay (shows briefly on first load) */}
        {isMobile && (
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <motion.p
              className="text-white text-sm font-medium bg-white/20 px-4 py-2 rounded-lg border border-white/30"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              Tap to explore
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };
  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const rayVariants = {
    hidden: { opacity: 0, scaleY: 0 },
    visible: {
      opacity: 1,
      scaleY: 1,
      transition: {
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.8,
      },
    },
  };

  return (
    <motion.div
      ref={sectionRef}
      className="py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
    >
      {/* Background rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/20 to-transparent"
          variants={rayVariants}
          style={{ transformOrigin: "top" }}
        />
        <motion.div
          className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-indigo-200/15 to-transparent"
          variants={rayVariants}
          style={{
            transformOrigin: "top",
            transitionDelay: "0.2s",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div className="text-center mb-12" variants={headerVariants}>
          <motion.div
            className="mb-2 flex items-center justify-center space-x-2"
            variants={textVariants}
          >
            <motion.span className="text-blue-500 text-base sm:text-lg">✦</motion.span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
              Ethics & Responsibility
            </p>
          </motion.div>

          <motion.h1
            className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Responsibility Beyond{" "}
            <span className="gradient-text">
              Technology
            </span>
          </motion.h1>

          <motion.div
            className="max-w-4xl mx-auto text-gray-600 leading-relaxed font-base"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="mb-4">
              At SST, we believe trust is earned not just through secure
              solutions, but through responsible innovation and ethical
              practices. We design technology with people, society, and the
              environment in mind, ensuring long-term, sustainable value.
            </p>
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <ResponsibilityCard card={cards[0]} index={0} />
            <ResponsibilityCard card={cards[1]} index={1} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <ResponsibilityCard card={cards[2]} index={2} />
            <ResponsibilityCard card={cards[3]} index={3} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResponsibilitySection;