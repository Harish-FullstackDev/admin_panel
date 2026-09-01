"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaClipboardList, FaShieldAlt, FaBookOpen, FaBusinessTime } from "react-icons/fa";
import HomeBG from "../../../../../../public/Home/HomeBG.webp"; // make sure the path is correct

const SAPToday = () => {
  return (
    <section className="w-full px-6 md:px-20 py-16 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        
        {/* Left Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full md:w-1/3 relative rounded-2xl overflow-hidden shadow-xl min-h-[350px]"
        >
          {/* Background Image */}
          <Image
            src={HomeBG}
            alt="Background"
            fill
            priority
            className="object-cover"
          />

          {/* Content */}
          <div className="relative p-8 text-white">
            <div className="absolute top-4 right-4 bg-white/10 rounded-xl p-2">
              <FaClipboardList className="text-white text-xl" />
            </div>

            <p className="text-sm text-gray-300 mb-2">For Customers</p>
            <h2 className="text-3xl font-semibold mb-4">Free Demo Call</h2>
            <div className="space-y-1 mb-6 text-sm">
              <p>Starter Kit</p>
              <p>Discover The Possibilities.</p>
              <p>Contact Us For A</p>
              <p>Personalized Demo.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-900 font-medium px-5 py-2 rounded-full shadow hover:bg-gray-100 transition"
            >
              Contact Now
            </motion.button>
          </div>
        </motion.div>

        {/* Right Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full md:w-2/3 mt-12 md:mt-0 md:ml-12"
        >
          <div className="space-y-6">
            {/* Row 1 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between border-b pb-4"
            >
              <div className="flex items-center space-x-4">
                <FaBusinessTime className="text-gray-500 text-xl" />
                <p className="font-medium text-lg text-gray-600">Agile Business Processes</p>
              </div>
              <p className="text-sm text-gray-500">100+ Customers</p>
            </motion.div>

            {/* Row 2 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between border-b pb-4"
            >
              <div className="flex items-center space-x-4">
                <FaShieldAlt className="text-gray-500 text-xl" />
                <p className="font-medium text-lg text-gray-600">Comprehensive Security</p>
              </div>
              <p className="text-sm text-gray-500">100+ Customers</p>
            </motion.div>

            {/* Row 3 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between border-b pb-4"
            >
              <div className="flex items-center space-x-4">
                <FaBookOpen className="text-gray-500 text-xl" />
                <p className="font-medium text-lg text-gray-600">Collaborative Ecosystem</p>
              </div>
              <p className="text-sm text-gray-500">100+ Employees</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SAPToday;
