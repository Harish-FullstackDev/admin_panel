import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import Image from "next/image";
import Icon from "../../assets/Home/testinomials/Icon.svg";
import backgroundImage from "../../assets/Home/testinomials/CTA_BG.png";

const TestimonialsPage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Jacob Jones",
      title: "SAP Services",
      rating: 5,
      text: "Streamline business processes and accelerate digital transformation with our expert SAP consulting, implementation, and managed support services.",
    },
    {
      name: "Marcus Chen",
      title: "Quality Deliverables",
      rating: 3.5,
      text: "Consistently delivering dependable, high-quality solutions that help businesses achieve their goals with confidence.",
    },
    {
      name: "Sarah Williams",
      title: "Trusted Partner",
      rating: 4,
      text: "More than a service provider, they became a trusted partner who understood our goals and consistently delivered solutions that exceeded expectations.",
    },
  ];

  // Simple boy and girl avatar components
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

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

  const testimonialSectionVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const servicesSectionVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const testimonialVariants = {
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      x: -30,
      transition: {
        duration: 0.3,
        ease: "easeIn",
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

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 30px rgba(255, 255, 255, 0.2)",
      transition: {
        duration: 0.3,
      },
    },
    tap: {
      scale: 0.98,
    },
  };

  const starVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1 + 0.8,
        duration: 0.3,
        type: "spring",
        stiffness: 200,
      },
    }),
  };

  const backgroundVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut",
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        delay: 0.3,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount: 0.2,
        margin: "-100px 0px -100px 0px",
      }}
      variants={containerVariants}
      className="rounded-2xl text-gray-800 min-h-screen p-6 flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        margin: "1rem",
        backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)),
                          url(${backgroundImage.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background overlay for better text readability */}
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
      />

      <div className="flex flex-col lg:flex-row gap-16 lg:gap-28 items-center justify-center w-full max-w-7xl relative z-10">
        {/* Testimonial Section */}
        <motion.div
          variants={testimonialSectionVariants}
          className="w-full lg:w-[30%] rounded-3xl p-6 flex flex-col items-center text-center"
        >
          <motion.p
            variants={itemVariants}
            className="text-sm font-medium tracking-wider text-white uppercase mb-4"
          >
            <span className="text-blue-400 mr-2">✦</span> TESTIMONIALS
          </motion.p>

          <div>
            <motion.h2
              variants={itemVariants}
              className="text-2xl sm:text-3xl mb-4 text-white flex flex-col items-center gap-3"
            >
              <span>What our clients say</span>
              <motion.span
                className="flex -space-x-2"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
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
              </motion.span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base text-white text-center"
            >
              From innovative marketing strategies to operational excellence, we
              provide expert solutions that drive success.
            </motion.p>
          </div>

          {/* Glassmorphism testimonial card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className="bg-black/30 backdrop-blur-md w-full w-full rounded-2xl p-8 shadow-xl border border-white/20 mt-4 text-center"
          >
            <motion.div
              className="flex justify-center items-center gap-1 mb-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              {[1, 2, 3, 4, 5].map((star, i) => (
                <motion.div
                  key={star}
                  custom={i}
                  variants={starVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {testimonials[currentTestimonial].rating >= star ? (
                    <FaStar className="w-6 h-6 text-[#FDC776]" />
                  ) : testimonials[currentTestimonial].rating >= star - 0.5 ? (
                    <FaStarHalfAlt className="w-6 h-6 text-[#FDC776]" />
                  ) : (
                    <FaRegStar className="w-6 h-6 text-[#FDC776]" />
                  )}
                </motion.div>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.blockquote
                key={currentTestimonial}
                variants={testimonialVariants}
                initial={{ opacity: 0, x: 30 }}
                animate="enter"
                exit="exit"
                className="text-base leading-relaxed font-medium mb-8 text-white"
              >
                "{testimonials[currentTestimonial].text}"
              </motion.blockquote>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`author-${currentTestimonial}`}
                variants={testimonialVariants}
                initial={{ opacity: 0, y: 20 }}
                animate="enter"
                exit="exit"
                className="mb-8"
              >
                <h4 className="font-bold text-xl text-white">
                  {testimonials[currentTestimonial].name}
                </h4>
                <p className="text-white/80 text-sm">
                  {testimonials[currentTestimonial].title}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center space-x-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentTestimonial
                    ? "bg-blue-400 scale-110"
                    : "bg-white/30 hover:bg-white/50"
                    }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Services Section */}
        <motion.div
          variants={servicesSectionVariants}
          className="w-full lg:w-[70%] rounded-3xl  text-center flex flex-col items-center"
        >
          <motion.h1
            variants={itemVariants}
            className="text-3xl lg:text-4xl xl:text-5xl font-normal leading-tight "
          >
            <motion.span variants={itemVariants} className="text-white">
              Proven Impact Backing Our
            </motion.span>
            <br />
            <motion.span variants={itemVariants} className="text-white">
              Prime Solutions
            </motion.span>
          </motion.h1>

          {/* CTA Section */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-16 mb-8 w-full"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-black/40 to-black/30 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl"
            >
              <motion.h3
                variants={itemVariants}
                className="text-2xl font-bold text-white mb-4"
              >
                Ready to Transform Your Business?
              </motion.h3>

              <motion.p variants={itemVariants} className="text-gray-300 mb-6">
                Join our satisfied clients and experience the power of SST's Prime
                solutions
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="border border-white/30 text-white font-semibold py-2 px-4 sm:py-3 sm:px-8 text-sm sm:text-base rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Get Started Today
                </motion.button>

              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TestimonialsPage;

