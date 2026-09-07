import React, { useState } from 'react';
import Image from "next/image";

const Map = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <div className="py-8 sm:py-12 lg:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-center text-[#000000] mb-8 sm:mb-10 lg:mb-12">
          Contact us
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start sm:-mb-35">
  {/* Map Section */}    
  <div className="px-6 pt-6 pb-2 ">
    <div className="relative w-full h-0 pb-[97.5%] overflow-hidden rounded-lg">
      <iframe 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3903.5025088649436!2d79.81591100000001!3d11.939670300000008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5361c4eec70b95%3A0x584de4859b109201!2sSupport%20Studio%20Technologies!5e0!3m2!1sen!2sin!4v1757399839664!5m2!1sen!2sin"
        className="absolute top-0 left-0 w-120 h-100 border-0"
        allowFullScreen="" 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        title="Ascendus Location">
      </iframe>
    </div>
  </div>


          {/* Form Section */}
          <div className="p-4 sm:p-6 lg:p-8 order-1 lg:order-2">
            <div className="space-y-4 sm:space-y-6">
              {/* Name Field */}
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:py-4 bg-[#FBFBFB] rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-gray-700 text-sm sm:text-base"
                />
              </div>

              {/* Email Field */}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:py-4 bg-[#FBFBFB] rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-gray-700 text-sm sm:text-base"
                />
              </div>

              {/* Message Field */}
              <div>
                <textarea
                  name="message"
                  placeholder="Message"
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:py-4 bg-[#FBFBFB] rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-gray-700 resize-none text-sm sm:text-base sm:rows-5"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                Send now
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 sm:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Call */}
          <div className="flex items-center justify-center sm:justify-start space-x-3 p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Image 
                src="/Contactus/call.png"
                alt="Call icon" 
                width={24} 
                height={24}
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-sm sm:text-base font-semibold text-[#202020]">Call</h3>
              <p className="text-sm sm:text-base text-[#615E5B]">0413123456</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-center sm:justify-start space-x-3 p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Image 
                src="/Contactus/email.png" 
                alt="Email icon" 
                width={24} 
                height={24}
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-sm sm:text-base font-semibold text-[#202020]">Email</h3>
              <p className="text-sm sm:text-base text-[#615E5B] break-all sm:break-normal">info@isupportz.com</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center sm:justify-start space-x-3 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Image 
                src="/Contactus/location.png"
                alt="Location icon" 
                width={24} 
                height={24}
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-sm sm:text-base font-semibold text-[#202020]">Location</h3>
              <p className="text-sm sm:text-base text-[#615E5B]">Pondicherry, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;