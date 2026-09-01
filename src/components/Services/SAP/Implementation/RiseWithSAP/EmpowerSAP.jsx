import React from 'react'
import { motion, useInView } from 'framer-motion'
import Image from "next/image"
import RisewithSAP from "@/assets/Service/RisewithSAP.svg"

const EmpowerSAP = () => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  // Stagger animation for children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const scaleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  const counterVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  }

  return (
    <div className="bg-white overflow-hidden">
      <motion.div 
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 py-10 max-w-7xl mx-auto px-4 md:px-6"
      >
        {/* Left Section */}
        <div className="space-y-6">
          <div className="space-y-4">
            <motion.h2 
              variants={fadeUpVariants}
              className="text-3xl md:text-4xl lg:text-5xl font-normal text-black leading-tight"
            >
              Empower Your Business Transformation With Rise With SAP.
            </motion.h2>
            
            <motion.p 
              variants={fadeUpVariants}
              className="text-black text-sm md:text-md leading-relaxed"
            >
              Rise With SAP Empowers Businesses To Transform And Streamline Their Operations By Integrating And Managing Finances, Operations, And Customer Relationships Efficiently Through The SAP SAHANA ERP Suite.
            </motion.p>
          </div>

          {/* Why Section */}
          <motion.div 
            variants={fadeUpVariants}
            className="space-y-4 pt-4"
          >
            <motion.h3 
              className="text-blue-600 font-semibold text-sm tracking-wide"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.3 }}
            >
              Why Rise With SAP?
            </motion.h3>
            
            <motion.p 
              variants={fadeInVariants}
              className="text-gray-600 text-sm md:text-md leading-relaxed"
            >
              Rise With SAP Streamlines Business Functions, Improves Decision-Making, And Enhances Customer Relationships Through Its Modular Design, Leading To Cost Savings And A Competitive Advantage
            </motion.p>
          </motion.div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col justify-between space-y-8 md:space-y-0">
          {/* Satisfaction Card */}
          <motion.div 
            variants={scaleVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.3 }
            }}
            className="to-white p-6 md:p-8 md:ml-45 relative"
          >
            <motion.div 
              variants={counterVariants}
              className="text-4xl md:text-5xl font-bold text-blue-600 mb-2"
              whileHover={{ 
                scale: 1.1,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              95%
            </motion.div>
            <motion.h4 
              variants={fadeInVariants}
              className="text-gray-900 font-semibold mb-4"
            >
              CLIENT SATISFACTION
            </motion.h4>
            <motion.p 
              variants={fadeInVariants}
              className="text-gray-600 text-sm"
            >
              Our platform consistently delivers creative solutions that exceed expectations.
            </motion.p>
            
            {/* Subtle background effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-transparent rounded-lg -z-10"
            />
          </motion.div>

          {/* Logo Section */}
          <motion.div 
            variants={scaleVariants}
            className="flex items-center justify-center md:justify-end"
          >
            <motion.div
              whileHover={{ 
                scale: 1.05,
                rotate: [0, -2, 2, 0],
                transition: { duration: 0.5 }
              }}
              className="relative"
            >
              <motion.div
               
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="rounded-full"
              >
                <Image 
                  src={RisewithSAP} 
                  alt="Rise With SAP Logo" 
                  width={250}
                  height={250}
                  className='mr-0 md:mr-24'
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default EmpowerSAP