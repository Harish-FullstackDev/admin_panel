import React from 'react'

const BottomCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 sm:px-8 md:px-12 py-4 max-w-3xl mx-auto">
      {/* Trusted by text */}
      <div className="text-center mb-3">
        <span className="text-black text-base sm:text-lg font-medium">Trusted by</span>
      </div>
      
      {/* Main content - responsive layout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        {/* Left section */}
        <div className="flex-1 text-center sm:text-left">
          <div className="text-black text-lg sm:text-xl font-medium">
            Your Partner in Progress
          </div>
        </div>
        
        {/* Center number */}
        <div className="flex-shrink-0 sm:mx-4 md:mx-8">
          <div className="text-3xl sm:text-3xl font-bold text-gray-800 flex items-baseline justify-center">
            320
            <span className="text-blue-400 text-xl sm:text-2xl ml-1">K+</span>
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex-1 text-center sm:text-right">
          <div className="text-black text-lg sm:text-xl font-medium">
            Happy Customers
          </div>
        </div>
      </div>
    </div>
  )
}

export default BottomCard