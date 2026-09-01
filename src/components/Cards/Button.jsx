import React from "react";
import { HiOutlineArrowRight } from "react-icons/hi2";
 
const CustomButton = ({
  text,
  onClick,
  iconColor,
  iconBgColor,
  buttonBgColor,
  textColor,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center ${buttonBgColor} ${textColor} text-xs sm:text-sm font-medium rounded-full shadow-lg transition-all duration-300 transform  hover:shadow-xl cursor-pointer  pl-1 pr-3 sm:pr-4 py-1 overflow-hidden`}
    >
      <div
        className={`absolute transition-all duration-700 ease-out ${iconBgColor} rounded-full w-7 h-7 flex items-center justify-center z-10 left-1 group-hover:left-[calc(100%-1.5rem)] sm:group-hover:left-[calc(100%-2rem)]`}
      >
        <HiOutlineArrowRight className={`${iconColor} w-3 h-3 sm:w-4 sm:h-4`} />
      </div>
 
      <span className="py-2 md:py-1 whitespace-nowrap transition-all duration-700 ease-out ml-8 sm:ml-10 group-hover:ml-2 group-hover:mr-4 sm:group-hover:mr-5">
        {text}
      </span>
    </button>
  );
};
 
export default CustomButton;
 
 