import Image from "next/image";
import { motion } from "framer-motion";
import Enterprise from "../../assets/Home/Enterprise_Services.png";
import Digital from "../../assets/Home/Digital_Solutions.png";
import Vector from "../../assets/Home/Vector.png";
import BGFILL from "../../assets/Home/BGFILL.svg";
import CustomButton from "../Cards/Button";
 
const OurProject = () => {
const Card = ({
                title,
                description,
                imageUrl,
                foregroundImage,
                delay,
                type = "enterprise",
              }) => (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 md:p-6 w-full md:w-1/2 flex"
                >
                  <div
                    className="
                      w-full
                      relative
                      h-[480px]
                      sm:h-[500px]
                      md:h-[460px]
                      lg:h-[500px]
                      rounded-xl
                      overflow-hidden
                      shadow-2xl
                    "
                  >
                    {type === "enterprise" ? (
                      <>
                        {/* Top Image */}
                        <div className="w-full h-[65%] absolute top-0 left-0 overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover object-top"
                          />
                        </div>
 
                        {/* Vector Overlay */}
                        {foregroundImage && (
                          <Image
                            src={foregroundImage}
                            alt="Decorative Vector"
                            fill
                            className="object-cover pointer-events-none z-10"
                          />
                        )}
 
                        {/* Content */}
                        <div className="absolute inset-0 z-20 flex flex-col justify-end">
                          <svg
                            className="block w-full h-12 md:h-16 text-black fill-current translate-y-[1px]"
                            viewBox="0 0 100 20"
                            preserveAspectRatio="none"
                          >
                            <path d="M0,0 C30,12 70,20 100,20 L100,20 L0,20 Z" />
                          </svg>
 
                          <div className="bg-black text-white px-6 md:px-8 pt-2 pb-8">
                            <h3 className="text-xl md:text-2xl font-bold mb-4">
                              {title}
                            </h3>
 
                            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-6">
                              {description}
                            </p>
 
                            <div className="w-full flex justify-end">
                              <CustomButton
                                text="Explore"
                                iconColor="text-white"
                                iconBgColor="bg-black"
                                buttonBgColor="bg-white"
                                textColor="text-black"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover object-top transition-transform duration-700 ease-in-out group-hover:scale-105"
                          />
                        </div>
 
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
 
                        {/* Content */}
                        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-8">
                          <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">
                            {title}
                          </h3>
 
                          <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-6">
                            {description}
                          </p>
 
                          <div className="w-full flex justify-end">
                            <CustomButton
                              text="Explore"
                              iconColor="text-white"
                              iconBgColor="bg-black hover:bg-gray-800"
                              buttonBgColor="bg-white"
                              textColor="text-black"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
 
  return (
    <div
      style={{
        backgroundImage: `url(${BGFILL.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="h-[30px]" />
 
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="flex flex-col items-center py-6 px-4 w-full overflow-hidden"
      >
        {/* Header */}
        <div className="text-center lg:mb-5 mb-3">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-gray-600 text-sm font-medium tracking-wider uppercase"
          >
            <span className="text-blue-500 mr-2">✦</span>
            What We Do
          </motion.p>
 
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mt-4"
          >
            <span className="text-gray-900">Services That Drive </span>
            <span className="gradient-text">Transformation</span>
          </motion.h1>
        </div>
 
        {/* Cards */}
        <div className="w-full md:w-230 flex flex-col md:flex-row justify-center items-stretch max-w-5xl px-4 md:px-0">
          <Card
            title="Enterprise Services"
            description="Comprehensive enterprise services across SAP, Microsoft, Salesforce, and Cloud designed to simplify operations, integrate processes, and accelerate business growth."
            imageUrl={Enterprise}
            // foregroundImage={Vector}
            delay={0.2}
            type="enterprise"
          />
 
          <Card
            title="Digital Solutions"
            description="Future-ready solutions in E-Invoicing, Cybersecurity, and emerging technologies that modernize enterprises and prepare them for the digital age."
            imageUrl={Digital}
            delay={0.4}
            type="digital"
          />
        </div>
      </motion.div>
    </div>
  );
};
 
export default OurProject;
 