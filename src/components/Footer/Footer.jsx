"use client"
import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/Navbar/SST_Updated_White.svg";
import { useState } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import FBIcon from "../../assets/Footer/FacebookIcon.svg";
import InstagramIcon from "../../assets/Footer/instagram.svg";
import LinkedinIcon from "../../assets/Footer/LinkedinIcon.svg";
// import CalendlyIcon from "../../assets/Footer/CalendlyIcon.svg";

const Footer = () => {
  const [email, setEmail] = useState("");
  const handleSendEmail = () => {
    if (email) {
      console.log("Sending email to:", email);
      setEmail("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendEmail();
    }
  };

  return (
    <>
      <footer className="bg-neutral-900 text-gray-400 p-8 md:p-12 ">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-16  pb-4 md:pb-12 mb-2">
          <div className="space-x-3 md:col-span-1">
            <div className="relative h-8 sm:h-10 w-auto aspect-[4/1] md:mb-12">
              <Image
                src={logo}
                alt="SST Logo"
                fill
                style={{
                  objectFit: "contain",
                }}
              />
            </div>
            <div className="mt-4 mb-7.5 md:mb-12">
              <h3 className="text-white text-lg font-semibold mb-4">
                Quick Link
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/aboutus"
                    className="hover:text-white transition-colors duration-200"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Services
                  </Link>
                </li>
                {/* <li>
                  <Link
                    href="/solutions"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Solutions
                  </Link>
                </li> */}
                <li>
                  <Link
                    href="/contact-us"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Contact
                  </Link>
                </li>
                {/* <li>
                <Link
                  href="/sstpartner"
                  className="hover:text-white transition-colors duration-200"
                >
                  SST Partnership
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-white hover:underline-offset-8 transition-colors duration-200"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/trustcenter"
                  className="hover:text-white transition-colors duration-200"
                >
                  Trust Center
                </Link>
              </li> */}
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Blog
                  </Link>
                </li>
                {/* <li>
                <Link
                  href="#contact"
                  className="hover:text-white transition-colors duration-200"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#careers"
                  className="hover:text-white transition-colors duration-200"
                >
                  News Letter
                </Link>
              </li> */}
              </ul>
            </div>
            <div className="flex space-x-3 md:col-span-1">
              {/* <a
              href="https://www.linkedin.com/company/supportstudiotechnologies/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="LinkedIn"
            >
              <Image
                src={LinkedinIcon}
                alt="LinkedIn"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="Twitter"
            >
              <Image
                src={TwitterIcon}
                alt="Twitter"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a> */}
            </div>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-white text-lg font-semibold md:mt-21.5 mb-4">Capabilities</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/services/sapService/rise-with-sap"
                  className="hover:text-white transition-colors duration-200"
                >
                  SAP Services
                </Link>
              </li>
              <li>
                <Link
                  href="#digital"
                  className="hover:text-white transition-colors duration-200"
                >
                  Digital Transformation
                </Link>
              </li>
              <li>
                <Link
                  href="#product"
                  className="hover:text-white transition-colors duration-200"
                >
                  Product and Development
                </Link>
              </li>
              <li>
                <Link
                  href="#experience"
                  className="hover:text-white transition-colors duration-200"
                >
                  Design and Development
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-white text-lg font-semibold md:mt-21.5 mb-4">Industries</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/services/sapService/rise-with-sap"
                  className="hover:text-white transition-colors duration-200"
                >
                  SAP Services
                </Link>
              </li>
              <li>
                <Link
                  href="#digital"
                  className="hover:text-white transition-colors duration-200"
                >
                  Digital Transformation
                </Link>
              </li>
              <li>
                <Link
                  href="#product"
                  className="hover:text-white transition-colors duration-200"
                >
                  Product and Development
                </Link>
              </li>
              <li>
                <Link
                  href="#experience"
                  className="hover:text-white transition-colors duration-200"
                >
                  Design and Development
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-white text-lg font-semibold md:mt-21.5 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#compliance"
                  className="hover:text-white transition-colors duration-200"
                >
                  Compliance
                </Link>
              </li>
              <li>
                <Link
                  href="/bookacall"
                  className="hover:text-white transition-colors duration-200"
                >
                  Book a call
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-white text-lg font-semibold md:mt-21.5 mb-4">
              Get In Touch
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="tel:+04132191301"
                  className="hover:text-white transition-colors duration-200"
                >
                  0413-2191301
                </a>
              </li>
              <li>
                <a
                  href="mailto:getinfo@isupportz.com"
                  className="hover:text-white transition-colors duration-200"
                >
                  getinfo@isupportz.com
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/pHCzqbb6vXihYvjn6"
                  className="hover:text-white transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  #192, Kamaraj Salai, Puducherry, India, <br /> Pin Code - 605013
                </a>
              </li>
            </ul>
            {/* <div className="w-full max-w-xs mt-24 space-y-3">
              <label className="text-white text-sm sm:text-base font-normal block text-start">
                News Letter
              </label>

              <div className="relative w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email address"
                  className="w-full pr-10 px-3 sm:px-4 py-2 sm:py-3  border-b border-white/20 rounded-none text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                />
                <MdOutlineMailOutline className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white text-lg" />
              </div>
            </div> */}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6  md:gap-16  ">
          <div className="flex space-x-3 md:col-span-1 min-h-[50px] mb-2">
            {/* <div className="space-x-3 md:col-span-1">
              <p className="text-sm text-white mb-4 md:mb-0">
                <a
                  href="/privacyPolicy"
                  className="hover:text-gray-300 transition-colors"
                >
                  Privacy Policy
                </a>
                {" | "}
                <a
                  href="/security-policy"
                  className="hover:text-gray-300 transition-colors"
                >
                  Security Policy
                </a>
                {" | "}
                <a
                  href="/ethics-policy"
                  className="hover:text-gray-300 transition-colors"
                >
                  Ethics Policy
                </a>
                {" | "}
                <a
                  href="/cookie-policy"
                  className="hover:text-gray-300 transition-colors"
                >
                  Cookie Policy
                </a>
              </p> 
            </div> */}
            <a
              href="https://www.linkedin.com/company/supportstudiotechnologies/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="LinkedIn"
            >
              <Image
                src={LinkedinIcon}
                alt="LinkedIn"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a>
            <a
              href="https://www.instagram.com/isupportz.official?igsh=MWF5Z3M2MXFrbXI3cg=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="Instagram"
            >
              <Image
                src={InstagramIcon}
                alt="Instagram"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a>
            {/* <a
              href="https://calendly.com/supportstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="Calendly"
            >
              <Image
                src={CalendlyIcon}
                alt="Calendly"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a> */}
          </div>

          <div className="flex space-x-3 md:col-span-1">
            {/* <a
              href="#"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="Facebook"
            >
              <Image
                src={FBIcon}
                alt="Facebook"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a> */}

            {/* <a
              href="https://www.linkedin.com/company/supportstudiotechnologies/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="LinkedIn"
            >
              <Image
                src={LinkedinIcon}
                alt="LinkedIn"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              aria-label="Twitter"
            >
              <Image
                src={TwitterIcon}
                alt="Twitter"
                className="w-10 h-10"
                width={24}
                height={24}
              />
            </a> */}
          </div>

          <div className="md:col-span-1"></div>

          <div className="md:col-span-1"></div>

          <div className="md:col-span-2 ">
            <p className="text-sm text-white flex items-center min-h-[50px]">
              © 2026 Support Studio Technologies. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
