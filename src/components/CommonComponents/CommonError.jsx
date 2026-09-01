import React from "react";
import Navbar from "../Navbar/Navbar";
import Image from "next/image";

const CommonError = ({
  title,
  message,
  buttonText,
  buttonLink,
  imageSrc,
  imageAlt,
}) => {
  return (
    <div className="">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center max-w-2xl w-full">
          {/* Icon */}
          {/* {imageSrc && ( */}
          <div className="flex justify-center mb-1">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={200}
              height={160}
              className="w-52 h-40 sm:w-44 sm:h-32 lg:w-56 lg:h-44"
            />
          </div>
          {/* )} */}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A65CC] mb-3 md:mb-4">
            {title}
          </h1>

          {/* Message */}
          <p className="text-base sm:text-lg text-gray-600 mb-6 lg:mb-6 px-4">
            {message}
          </p>

          {/* Button */}
          <a
            href={buttonLink}
            className="inline-block bg-[#0A65CC] hover:bg-blue-700 text-white font-medium px-6 py-1 sm:px-8 sm:py-1 rounded-xs transition-colors duration-200 text-lg sm:text-lg"
          >
            {buttonText}
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommonError;
