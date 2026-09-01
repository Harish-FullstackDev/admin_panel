import React, { useState } from "react";
import Tree from "../../assets/Solution/SolutionTree.svg";
import Image from "next/image";

function BusinessLandingPage() {

  return (
    <div className=" px-4 pb-8 sm:px-6 md:px-8 lg:px-10 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 justify-between items-center lg:items-start mb-8 lg:mb-12">
          {/* Title */}
          <div className="w-full lg:max-w-md text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4">
              Helping Businesses <br className="block sm:hidden" />
              Like <br className="hidden sm:block" />
              Yours Reach <br className="block sm:hidden" />
              <span className="gradient-text"> New Heights</span>
            </h1>
          </div>

          {/* Button - Only visible on laptop/desktop */}
          <div className="hidden lg:flex justify-center lg:justify-start lg:mt-10">
            <button
              className="group inline-flex items-center justify-center px-5 py-2
              bg-[#A7CAFF] text-black text-sm font-medium rounded-full                  
              transition-all duration-300 transform hover:scale-105 hover:brightness-110                  
              mx-auto sm:mx-0 cursor-pointer w-auto"
            >
              Read more
              {/* Arrow Image */}
              <div className="w-6 h-6 rounded-full flex items-center justify-center ml-2 transition-transform duration-300 group-hover:translate-x-1">
                <Image
                  src="/SolutionPage/SolutionArrow.png"
                  alt="Arrow"
                  width={12}
                  height={12}
                  className="object-contain"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-7 items-start">
          {/* Left Column - Stats and Description */}
          <div className="space-y-5 lg:space-y-12 text-center lg:text-left order-1 -mt-6 lg:-mt-0">
            {/* Stats */}
            <div className="space-y-0 lg:space-y-2">
              <div className="text-3xl sm:text-3xl font-normal text-gray-900">
                52K+
              </div>
              <div className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Your goals, our mission.
                <br />
                Together, we build success.
              </div>
            </div>

            {/* Partner Section */}
            <div className="space-y-1 lg:space-y-3">
              <h2 className="text-2xl sm:text-3xl font-normal text-gray-900 leading-tight">
                Your Partner in
                <br />
                Business Growth
              </h2>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-sm mx-auto lg:mx-0">
                Empower your business with our comprehensive agency solutions
                tailored to meet your needs.
              </p>

              {/* Button - Only visible on mobile/tablet */}
              <div className="flex lg:hidden justify-center pt-4">
                <button
                  className="group inline-flex items-center justify-center px-5 py-2
                  bg-[#A7CAFF] text-black text-sm font-medium rounded-full                  
                  transition-all duration-300 transform hover:scale-105 hover:brightness-110                  
                  cursor-pointer w-auto"
                >
                  Read more
                  {/* Arrow Image */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    <Image
                      src="/SolutionPage/SolutionArrow.png"
                      alt="Arrow"
                      width={12}
                      height={12}
                      className="object-contain"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Tree Image */}
          <div className="flex justify-center order-2 lg:order-2">
            <div className="relative">
              <Image
                src={Tree}
                alt="Fullstack Development"
                width={280}
                height={280}
                className="w-64 h-64 sm:w-72 sm:h-72 lg:w-70 lg:h-70 lg:mt-10 object-contain"
                priority
              />
            </div>
          </div>

          {/* Right Column - Research Solution */}
          <div className="flex justify-center order-3 lg:order-3">
            <div className="relative">
              <Image
                src="/SolutionPage/researchsolution.png"
                alt="Research Solution"
                width={320}
                height={320}
                className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 lg:-mt-11 object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessLandingPage;