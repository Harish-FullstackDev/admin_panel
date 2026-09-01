"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import Card_BG from "../../assets/career/ConsultationCard.svg";
import CustomButton from "./Button";
import { usePathname } from "next/navigation";

const HomeCard = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();
  const ref = useRef(null);
  const cardRef = useRef(null);
  const buttonRef = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  useEffect(() => {
    setMousePosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const updateButtonPosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth;

        if (isVisible) {
          setButtonPosition({
            x: rect.left,
            y: rect.top + rect.height / 2,
          });
          setIsButtonVisible(true);
        } else {
          setIsButtonVisible(false);
        }
      } else {
        setIsButtonVisible(false);
      }
    };

    const handleResize = () => {
      checkMobile();
      updateButtonPosition();
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updateButtonPosition);

    const initialUpdate = setTimeout(updateButtonPosition, 100);
    const intervalUpdate = setInterval(updateButtonPosition, 500);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updateButtonPosition);
      clearTimeout(initialUpdate);
      clearInterval(intervalUpdate);
    };
  }, []);

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendEmail();
    }
  };

  const calculateArrowPath = () => {
    if (!isButtonVisible || buttonPosition.x === 0 || buttonPosition.y === 0) {
      return null;
    }

    const dx = buttonPosition.x - mousePosition.x;
    const dy = buttonPosition.y - mousePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 80) return null;

    const midX = (mousePosition.x + buttonPosition.x) / 2;
    const midY = (mousePosition.y + buttonPosition.y) / 2;
    const angle = Math.atan2(dy, dx);
    const perpendicularAngle = angle + Math.PI / 2;
    const curveIntensity = Math.min(distance * 0.3, 150);

    const controlX = midX + Math.cos(perpendicularAngle) * curveIntensity;
    const controlY = midY + Math.sin(perpendicularAngle) * curveIntensity;

    const arrowAngle = Math.atan2(dy, dx);

    const arrowEndX = buttonPosition.x - 17;
    const arrowEndY = buttonPosition.y;

    return {
      startX: mousePosition.x,
      startY: mousePosition.y,
      controlX,
      controlY,
      endX: arrowEndX,
      endY: arrowEndY,
      buttonX: buttonPosition.x,
      buttonY: buttonPosition.y,
      distance,
      arrowAngle,
    };
  };

  const generateDottedCurvePoints = () => {
    const arrowPath = calculateArrowPath();
    if (!arrowPath) return [];

    const points = [];
    const numDots = Math.floor(arrowPath.distance / 15);

    for (let i = 0; i <= numDots; i++) {
      const t = i / numDots;
      const x =
        Math.pow(1 - t, 2) * arrowPath.startX +
        2 * (1 - t) * t * arrowPath.controlX +
        Math.pow(t, 2) * arrowPath.endX;
      const y =
        Math.pow(1 - t, 2) * arrowPath.startY +
        2 * (1 - t) * t * arrowPath.controlY +
        Math.pow(t, 2) * arrowPath.endY;

      points.push({ x, y, t });
    }

    return points;
  };

  const arrowPath = calculateArrowPath();
  const dottedPoints = generateDottedCurvePoints();

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.3,
      },
    },
  };

  const inputVariants = {
    focus: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const numberVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <>
      {/* Only show arrow on desktop screens (not mobile) */}
      {/* {!isMobile &&
        !isHoveringCard &&
        arrowPath &&
        isButtonVisible &&
        dottedPoints.length > 0 && (
          <motion.svg
            className="fixed inset-0 w-full h-full pointer-events-none z-50"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <defs>
              <filter
                id="dropShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="2"
                  dy="2"
                  stdDeviation="2"
                  floodColor="#000000"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>
 
            {dottedPoints.map((point, index) => (
              <motion.circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill="#ffffff"
                opacity="0.8"
                filter="url(#dropShadow)"
                initial={{
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 0.8,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}
 
            <motion.g>
              <motion.circle
                cx={mousePosition.x - 2}
                cy={mousePosition.y}
                r="12"
                fill="none"
                stroke="#000000"
                strokeWidth="2"
                opacity="0.4"
                filter="url(#dropShadow)"
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.4, 0.1, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.circle
                cx={mousePosition.x - 2}
                cy={mousePosition.y}
                r="8"
                fill="none"
                stroke="#333333"
                strokeWidth="1.5"
                opacity="0.6"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0.2, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              />
              <circle
                cx={mousePosition.x - 2}
                cy={mousePosition.y}
                r="3"
                fill="#000000"
                opacity="0.9"
                filter="url(#dropShadow)"
              />
              <circle
                cx={mousePosition.x - 2}
                cy={mousePosition.y}
                r="1.5"
                fill="#ffffff"
                opacity="0.8"
              />
            </motion.g>
 
            <motion.g>
              <motion.circle
                cx={arrowPath.buttonX}
                cy={arrowPath.buttonY}
                r="12"
                fill="none"
                stroke="#06133C"
                strokeWidth="1.5"
                opacity="0.5"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              />
              <circle
                cx={arrowPath.buttonX}
                cy={arrowPath.buttonY}
                r="8"
                fill="#000000"
                opacity="0.7"
                filter="url(#dropShadow)"
              >
                <animate
                  attributeName="r"
                  values="6;8;6"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
 
              <circle
                cx={arrowPath.buttonX}
                cy={arrowPath.buttonY}
                r="5"
                fill="#ffffff"
                opacity="0.9"
              >
                <animate
                  attributeName="r"
                  values="3;5;3"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
 
              <circle
                cx={arrowPath.buttonX}
                cy={arrowPath.buttonY}
                r="2"
                fill="#000000"
                opacity="1"
              />
            </motion.g>
          </motion.svg>
        )} */}

      <motion.div
        ref={ref}
        className="flex flex-col items-start w-full max-w-md mx-auto relative"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div
          ref={cardRef}
          className="relative w-full"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
          onMouseEnter={() => setIsHoveringCard(true)}
          onMouseLeave={() => setIsHoveringCard(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src={Card_BG}
              alt="Card Background"
              className="w-full h-auto object-cover"
              priority
            />

          </motion.div>

          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-6 md:px-8 lg:px-6 xl:px-12">
            <div className="w-full max-w-[400px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[1000px] mx-auto space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-0">
              <motion.h1
                className="text-3xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-normal leading-tight text-white text-left w-full md:translate-y-3"
                variants={titleVariants}
              >
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="block"
                >
                  Need consultation?
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="block"
                >
                  let's talk
                </motion.span>
              </motion.h1>

              <motion.div
                className="w-full space-y-2 sm:space-y-3 translate-y-5 md:translate-y-0"
                variants={itemVariants}
              >
                <motion.label
                  className="text-white text-base sm:text-sm md:text-base font-normal text-left block w-full md:translate-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  Enter Your Email
                </motion.label>

                <motion.input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Email here"
                  disabled={isLoading}
                  className={`w-[96.5%] md:translate-y-4 md:w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border ${error ? 'border-red-400' : 'border-white/20'
                    } rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-xs sm:text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                  variants={inputVariants}
                  whileFocus="focus"
                  whileTap="tap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                />

                {/* Desktop Stats */}
                <motion.div
                  className="hidden md:flex gap-5 pt-0 translate-y-8"
                  variants={statsVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  <div className="text-left">
                    <motion.div
                      className="text-xl text-white mb-2 font-medium"
                      variants={numberVariants}
                    >
                      200+
                    </motion.div>

                    <motion.p
                      className="text-white/80 text-sm uppercase leading-tight"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 1.5 }}
                    >
                      Expert <br /> Solution
                    </motion.p>
                  </div>

                  <div className="text-left">
                    <motion.div
                      className="text-xl text-white mb-2 font-medium"
                      variants={numberVariants}
                    >
                      200+
                    </motion.div>

                    <motion.p
                      className="text-white/80 text-sm uppercase leading-tight"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 1.7 }}
                    >
                      Enterprises <br /> to Thrive
                    </motion.p>
                  </div>
                </motion.div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-300 text-xs sm:text-sm"
                  >
                    {error}
                  </motion.p>
                )}

                {isSubmitted && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-300 text-xs sm:text-sm"
                  >
                    Thank you! We'll be in touch soon.
                  </motion.p>
                )}

                <motion.div
                  className="flex justify-end w-full pt-2 md:pt-0 px-3 md:px-0 md:-translate-y-11.5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.3 }}
                >
                  <motion.div
                    ref={buttonRef}
                    animate={isSubmitted ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <CustomButton
                      text={
                        isLoading
                          ? "Sending..."
                          : isSubmitted
                            ? "Message Sent!"
                            : "Send Message"
                      }
                      onClick={handleSendEmail}
                      iconColor="text-white"
                      iconBgColor="bg-black"
                      buttonBgColor="bg-white"
                      textColor="text-black"
                      disabled={isLoading}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={`md:hidden flex gap-8 ${pathname === "/solutions" ? "hidden" : ""
            }`}
          variants={statsVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <div className="flex gap-8 ml-6.5 md:ml-2">
            <motion.div
              className="text-left"
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="text-lg sm:text-lg text-white mb-2"
                variants={numberVariants}
              >
                200+
              </motion.div>
              <motion.p
                className="text-white text-sm uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                Expert <br /> Solution
              </motion.p>
            </motion.div>

            <motion.div
              className="text-left"
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="text-lg sm:text-lg text-white mb-2"
                variants={numberVariants}
              >
                200+
              </motion.div>
              <motion.p
                className="text-white text-sm uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.7 }}
              >
                Enterprises <br /> to Thrive
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default HomeCard;

