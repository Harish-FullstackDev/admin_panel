import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { iconImages, textContent } from "../Constants/Home/AboutData";
import EnterpriseSolutionsGrid from "./reusable-grid/EnterpriseSolutionsGrid";

const Home = () => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const fadeTextRef = useRef(null);
  const [visibleWords, setVisibleWords] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleHorizontalScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress =
      maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0;

    setScrollProgress(progress);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const words = textContent.split(" ");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-in");
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-50px 0px",
      }
    );

    const observeImages = () => {
      if (containerRef.current) {
        const images = containerRef.current.querySelectorAll(".image-card");
        images.forEach((img) => {
          observer.observe(img);
        });
      }
    };

    const handleScroll = () => {
      // Handle word-by-word reveal for SAP text
      if (textRef.current) {
        const rect = textRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        if (elementTop + elementHeight < 0) {
          setVisibleWords(words.length);
          return;
        }

        if (elementTop > viewportHeight) {
          setVisibleWords(0);
          return;
        }

        const scrollProgress = Math.max(
          0,
          Math.min(
            1,
            (viewportHeight - elementTop) /
            (viewportHeight + elementHeight * 0.5)
          )
        );

        const totalWords = words.length;
        const newVisibleWords = Math.floor(scrollProgress * totalWords);

        setVisibleWords(Math.max(newVisibleWords, 0));
      }
    };

    setTimeout(observeImages, 100);

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      if (containerRef.current) {
        const images = containerRef.current.querySelectorAll(".image-card");
        images.forEach((img) => {
          observer.unobserve(img);
        });
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [words.length]);

  // Function to calculate fade effect based on element position
  const getFadeProgress = () => {
    if (!fadeTextRef.current) return 0;

    const rect = fadeTextRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const elementTop = rect.top;
    const elementHeight = rect.height;

    // Start fading when element enters viewport
    if (elementTop > viewportHeight) return 0;
    if (elementTop + elementHeight < 0) return 1;

    // Calculate progress based on element position
    const progress = Math.max(
      0,
      Math.min(
        1,
        (viewportHeight - elementTop) / (viewportHeight + elementHeight * 0.3)
      )
    );
    return progress;
  };

  const fadeProgress = getFadeProgress();

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const headerVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  const descriptionVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
        staggerChildren: 0.05,
        delayChildren: 0.3,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const gridContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cards = [
    {
      title: "Assessment",
      subtitle: "SAP Discovery",
      description:
        "Analyze your SAP landscape and identify technical debt before migration.",
      icon: "🔍",
    },
    {
      title: "Roadmap",
      subtitle: "Transformation Planning",
      description:
        "Create a structured roadmap for S/4HANA migration and optimization.",
      icon: "🗺️",
    },
    {
      title: "Migration",
      subtitle: "Execution",
      description:
        "Move from legacy SAP systems with minimal disruption.",
      icon: "🚀",
    },
    {
      title: "Optimization",
      subtitle: "Continuous Improvement",
      description:
        "Improve performance, governance, and long-term scalability.",
      icon: "⚡",
    },
  ];

  return (
    <>
      <style>{`
        .holographic-card {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }
 
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter 0.3s ease;
        }
 
        /* Default name overlay - always visible at bottom */
        .card-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%);
          color: white;
          padding: 16px 20px 20px 20px;
          z-index: 5;
          transition: opacity 0.3s ease;
        }
 
        .card-name h2 {
          font-size: 1rem;
          font-weight: bold;
          margin: 0;
          color: white;
          text-align: left;
        }
 
        /* Hover description overlay - hidden by default */
        .card-description {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          // background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 20px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.3s ease;
          z-index: 10;
        }
 
        .card-description p {
          font-size: 0.9rem;
          line-height: 1.4;
          color: white;
          text-align: center;
          margin: 0;
        }
 
        .holographic-card:hover .card-image {
          filter: blur(4px);
        }
 
        .holographic-card:hover .card-name {
          opacity: 0;
        }
 
        .holographic-card:hover .card-description {
          opacity: 1;
          transform: translateY(0);
        }
 
        @media (max-width: 768px) {
          .card-name h2 {
            font-size: 1.2rem;
          }
          .card-description p {
            font-size: 0.8rem;
          }
        }
          .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
 
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="h-[40px]"></div>

      <motion.div
        className="md:min-h-screen p-4 sm:p-6 lg:px-6 px-0"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto" ref={containerRef}>
          {/* Header Section */}
          <motion.div className="text-center mb-16" variants={textVariants}>
            <motion.div
              className="flex items-center justify-center gap-2"
              variants={textVariants}
            >
              <span className="text-blue-500 text-base sm:text-lg">✦</span>
              <p className="text-xs sm:text-sm font-medium tracking-widest uppercase">
                About us
              </p>
            </motion.div>

            <motion.h2
              className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
              variants={headerVariants}
            >
              Our Enterprise
              <span className="gradient-text"> Services</span>
            </motion.h2>

            <motion.div
              className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12"
              variants={descriptionVariants}
            >
              {/* Split text into words for staggered animation */}
              {textContent
                .split(" ")
                .map((word, index) => (
                  <motion.span
                    key={index}
                    className="inline-block mr-1"
                    variants={wordVariants}
                  >
                    {word}
                  </motion.span>
                ))}
            </motion.div>
          </motion.div>

          {/* solutons Grid Section */}
          <EnterpriseSolutionsGrid />
        </div>
      </motion.div>
    </>
  );
};

export default Home;
