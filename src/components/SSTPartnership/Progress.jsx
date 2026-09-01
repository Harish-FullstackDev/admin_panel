import React from 'react';
import Image from 'next/image';
import partnership from "../../assets/SSTPartner/partnership.svg";

const Progress = () => {
  return (
    <div className="lg:mb-12 mb-8 lg:mt-0 mt-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto lg:ml-25 px-4 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2  lg:gap-8 items-center">
          
          {/* Mobile/Tablet: Services Content First */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-12 order-1 lg:order-1">
            {/* Services */}
            <div className="space-y-0">
              {/* Tax Advisory & Compliance */}
              <div className="flex items-start justify-between p-4 sm:p-6 border-b lg:mr-10 border-gray-200">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Tax Advisory & Compliance
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    Minimize tax liabilities while staying compliant
                  </p>
                </div>
                <div className="ml-4 sm:ml-6 flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Risk Assessment & Management */}
              <div className="flex items-start justify-between lg:mr-10 p-4 sm:p-6">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Risk Assessment & Management
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    Identify, analyze, and mitigate potential risks to your business.
                  </p>
                </div>
                <div className="ml-4 sm:ml-6 flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: Image Second */}
          <div className="flex justify-center lg:hidden order-2 mt-1">
            <div className="relative">
              <Image
                src={partnership}
                alt="Partnership illustration"
                width={300}
                height={300}
                className="w-full max-w-xs sm:max-w-sm"
                priority
              />
            </div>
          </div>

          {/* Mobile/Tablet: Text Third */}
          <div className="flex justify-center lg:hidden order-3 mt-4">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-normal text-black mb-2 leading-tight">
                Your Partner<br />
                in Progress
              </h1> 
              <p className="text-[#A7CAFF] text-base sm:text-lg font-medium">Growth</p>
            </div>
          </div>

          {/* Desktop: Right Side - Image with Text Overlay */}
          <div className="relative hidden lg:flex order-2">
            {/* Blue Abstract Image */}
            <div className="">
              <Image
                src={partnership}
                alt="Partnership illustration"
                width={350}
                height={350}
                className=""
                priority
              />
              
              {/* Text Overlay */}
              <div className="absolute top-8 right-15 text-right">
                <h1 className="text-3xl lg:text-4xl font-normal text-black mb-2 leading-tight">
                  Your Partner<br />
                  <span className='mr-3'>in Progress</span>
                </h1> 
                <p className="text-[#A7CAFF] text-lg font-medium mr-31">Growth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;