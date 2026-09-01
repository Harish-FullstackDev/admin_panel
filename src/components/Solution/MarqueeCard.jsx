import React, { useState } from "react";
import ConsultationCard from "@/components/Cards/MeetingCard";
import { motion } from "framer-motion";

const MarqueeCard = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const leftColumnVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const rightColumnVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.3,
      },
    },
  };

  const descriptionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.5,
      },
    },
  };

  const handleSendEmail = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setIsSubmitted(true);
      setEmail("");
      
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);

    } catch (err) {
      console.error('Error submitting email:', err);
      setError(err.message || 'Failed to send email. Please try again.');
      
      setTimeout(() => {
        setError("");
      }, 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="overflow-x-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Main Heading */}
        <motion.div
          className="relative z-10 flex items-center p-25 px-4 sm:px-6 lg:px-8"
          style={{
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundImage: `url(/SolutionPage/Solution.gif)`,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center px-4 sm:px-8 lg:px-16 relative z-20 -mt-10">
            {/* Left Column for the TopArrowCard component */}

            {/* Right Column for the existing text content */}
            <motion.div
              className="flex-1 flex items-center justify-center py-8 md:py-0"
              variants={leftColumnVariants}
            >
              <div className="text-center md:text-left max-w-5xl mx-auto">
                <div className="text-white">
                  <motion.h1
                    className="text-2xl mt-15 sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl font-bold leading-tight mb-4 gradient-text tracking-wide md:leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                    variants={titleVariants}
                  >
                    Ready To Optimize Your
                    <br />
                    <motion.span
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl font-bold leading-tight gradient-text"
                      variants={subtitleVariants}
                    >
                      Business Operations With AI?
                    </motion.span>
                  </motion.h1>

                  <motion.p
                    className="text-base sm:text-md lg:text-md text-white max-w-2xl leading-relaxed font-light mb-8 lg:mb-10"
                    variants={descriptionVariants}
                  >
                    Contact us today for a personalized consultation and see how
                    our solutions can help your business.
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex-1 flex justify-center items-center py-8 md:py-0"
              variants={rightColumnVariants}
            >
              <motion.div
                initial={{ opacity: 0, rotateY: 15 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: 0.4,
                }}
              >
                <ConsultationCard 
                  email={email}
                  setEmail={setEmail}
                  error={error}
                  setError={setError}
                  isSubmitted={isSubmitted}
                  isLoading={isLoading}
                  handleSendEmail={handleSendEmail}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default MarqueeCard;