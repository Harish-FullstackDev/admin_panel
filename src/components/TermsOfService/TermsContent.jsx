"use client"
import React, { useState, useEffect, useRef } from "react";

export default function TermsContent() {
  const [activeSection, setActiveSection] = useState("Introduction");
  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  const sections = [
    "Introduction",
    "Data Collection",
    "Use od Data",
    "Cookies",
    "Third Party Services",
    "Contact Us",
  ];

  const content = {
    Introduction: `We only collect the information that we actually need. Some of that is information that you actively give us when you sign up for an account, register for an event, ask for customer support, or buy something from us. We store your name and contact information, but we don't store credit card numbers (except with your permission and in one of our secured payment gateways).

When you visit one of our websites or use our software, we automatically log some basic information like how you got to the site, where you navigated within it, and what features and settings you use. We use this information to improve our websites and services and to drive new product development.`,
    "Data Collection": `We only collect the information that we actually need. Some of that is information that you actively give us when you sign up for an account, register for an event, ask for customer support, or buy something from us. We store your name and contact information, but we don't store credit card numbers (except with your permission and in one of our secured payment gateways).

When you visit one of our websites or use our software, we automatically log some basic information like how you got to the site, where you navigated within it, and what features and settings you use. We use this information to improve our websites and services and to drive new product development.`,
    "Use od Data": `We only collect the information that we actually need. Some of that is information that you actively give us when you sign up for an account, register for an event, ask for customer support, or buy something from us. We store your name and contact information, but we don't store credit card numbers (except with your permission and in one of our secured payment gateways).

When you visit one of our websites or use our software, we automatically log some basic information like how you got to the site, where you navigated within it, and what features and settings you use. We use this information to improve our websites and services and to drive new product development.`,
    Cookies: `We use cookies and similar technologies to recognize you when you return to our websites. We use them to remember your preferences and to understand how you use our websites.

Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.`,
    "Third Party Services": `We use third party services to help us provide our services. These include payment processors, analytics providers, and customer support tools.

These third parties have access to your personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.`,
    "Contact Us": `If you have any questions about this Privacy Policy, please contact us at privacy@example.com.

We will respond to your inquiry within a reasonable timeframe.`,
  };

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const container = contentRef.current;
      const scrollPosition = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;

      // Check if we're at the bottom
      if (scrollPosition + containerHeight >= scrollHeight - 50) {
        setActiveSection(sections[sections.length - 1]);
        return;
      }

      // Find the current section based on scroll position
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = sectionRefs.current[section];

        if (element) {
          const elementTop = element.offsetTop - container.offsetTop;

          if (scrollPosition >= elementTop - 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll);
      handleScroll(); // Initial check
      return () => contentElement.removeEventListener("scroll", handleScroll);
    }
  }, [sections]);

  // Handle navigation click to scroll to section
  const scrollToSection = (section) => {
    const element = sectionRefs.current[section];
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop - 32,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto rounded-lg overflow-hidden flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        {/* Sidebar Navigation */}
        <div className="hidden md:block w-64 bg-gray-50 border-r border-gray-400 p-6 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Quick Navigation
          </h2>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`w-full cursor-pointer text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {section}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content - Scrollable */}
        <div
          ref={contentRef}
          className="flex-1 p-8 overflow-y-auto invisible-scrollbar"
        >
          {sections.map((section) => (
            <div
              key={section}
              ref={(el) => (sectionRefs.current[section] = el)}
              className="mb-12"
            >
              <h1 className="text-2xl font-semibold text-blue-600 mb-6">
                {section}
              </h1>

              <div className="space-y-4 text-gray-700 leading-8">
                {content[section]
                  ?.split("\n\n")
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  )) || <p>Content for {section} section.</p>}
              </div>
            </div>
          ))}
          {/* Add padding at the bottom so last sections can scroll into view */}
          <div style={{ height: "50vh" }}></div>
        </div>
      </div>
    </div>
  );
}
