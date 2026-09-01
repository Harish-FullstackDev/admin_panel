"use client";
import React, { useState, useEffect } from "react";
import { HiOutlineArrowUp } from "react-icons/hi2";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const toggleVisibility = () => {
    if (typeof window !== "undefined" && window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    if (typeof window === "undefined") return;

    const scrollStep = -window.scrollY / (800 / 15);
    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 15);
  };

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", toggleVisibility);
      toggleVisibility();

      return () => {
        window.removeEventListener("scroll", toggleVisibility);
      };
    }
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-4 z-50 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-500 ease-in-out transform hover:scale-110 hover:-translate-y-1 sm:right-6
        ${
          isVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }
        bottom-24 sm:bottom-16`} 
      style={{
        background: "#51A2FF",
      }}
      aria-label="Scroll to top"
    >
      <HiOutlineArrowUp className="text-white text-xl transition-transform duration-300 hover:animate-bounce cursor-pointer" />
    </button>
  );
};

export default ScrollToTop;

