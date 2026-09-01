import React from "react";
import Image from "next/image";
import careercall from "../../assets/contactus/careercall.svg";
import careermsg from "../../assets/contactus/careermsg.svg";
import InteractiveLocationPreview from "./InteractiveLocationPreview";
 
const ContactInfo = () => {
  return (
    <div className="bg-white p-8 lg:p-12">
      <div className="max-w-md">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Contact Information
        </h2>
        <p className="text-gray-600 mb-8 lg:mb-12">
          Say something to start a live chat!
        </p>
 
        <div className="space-y-6 lg:space-y-8">
          {/* Phone */}
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 flex-shrink-0">
              <Image
                src={careercall}
                alt="Phone"
                width={24}
                height={24}
                className="text-gray-700"
              />
            </div>
            <span className="text-gray-700 text-base">
              <a className="hover:text-blue-500 transition-colors duration-200"  href="tel:+04132191301" target="_blank">0413-2191301</a></span>
          </div>
 
          {/* Email */}
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 flex-shrink-0">
              <Image
                src={careermsg}
                alt="Email"
                width={24}
                height={24}
                className="text-gray-700"
              />
            </div>
            <div className="text-gray-700 text-base">
              <div>
                <a className="hover:text-blue-500 transition-colors duration-200" href="mailto:hi@isupportz.com" target="_blank">hi@isupportz.com</a></div>
              <div>
                <a className="hover:text-blue-500 transition-colors duration-200" href="mailto:info@isupportz.com" target="_blank">info@isupportz.com</a></div>
            </div>
          </div>
 
          {/* Address with Interactive Location Preview */}
          <InteractiveLocationPreview />
        </div>
      </div>
    </div>
  );
};
 
export default ContactInfo;
 