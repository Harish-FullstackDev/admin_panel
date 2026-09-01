import React from "react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

const CommonHeader = ({ Title, TitleColor, description }) => {
  return (
    <div className="">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          {/* Main Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">
            {Title}
            <span className="block md:inline"></span>
            <span className="gradient-text font-bold">{TitleColor}</span>
          </h1>

          {/* Description */}
          <div className="max-w-7xl mx-auto">
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed  text-left">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonHeader;
