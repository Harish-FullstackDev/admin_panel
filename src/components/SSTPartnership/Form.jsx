import React, { useState } from "react";
import { motion } from "framer-motion";
function Form() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    company: "",
    address: "",
    partnerName: "",
    partnerAddress: "",
    otherInfo: "",
    termsAccepted: false,
  });
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };
  const steps = [
    {
      number: 1,
      title: "Personal information",
      subtitle: "Tell us who you are to get started.",
      active: currentStep === 1,
      completed: currentStep > 1,
    },
    {
      number: 2,
      title: "Partner Information",
      subtitle: "Details about your partnership.",
      active: currentStep === 2,
      completed: currentStep > 2,
    },
    {
      number: 3,
      title: "Other Information",
      subtitle: "Add any other relevant details.",
      active: currentStep === 3,
      completed: currentStep > 3,
    },
    {
      number: 4,
      title: "Summary & Submit",
      subtitle: "Final step! Let's activate your account.",
      active: currentStep === 4,
      completed: currentStep > 4,
    },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleContinue = () => {
    // Basic validation before moving to the next step
    if (currentStep === 1) {
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.phoneNumber ||
        !formData.address
      ) {
        alert("Please fill in all required fields for this step.");
        return;
      }
    }
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Final validation for step 4
    if (currentStep === 4 && formData.termsAccepted) {
      alert("Form Submitted successfully!");
      // You can send formData to a backend API here
      console.log("Form Data:", formData);
    } else {
      alert("Please accept the terms to submit the form.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Personal Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Exp: John Carter"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="(123) 000-0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Exp: Company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Exp: San Francisco, CA"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Partner Information
            </h2>
            <div>
              <label
                htmlFor="partnerName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Partner Name
              </label>
              <input
                type="text"
                name="partnerName"
                id="partnerName"
                value={formData.partnerName}
                onChange={handleInputChange}
                placeholder="Partner's full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="partnerAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Partner Address
              </label>
              <input
                type="text"
                name="partnerAddress"
                id="partnerAddress"
                value={formData.partnerAddress}
                onChange={handleInputChange}
                placeholder="Partner's address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Other Information
            </h2>
            <div>
              <label
                htmlFor="otherInfo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Additional Information
              </label>
              <textarea
                name="otherInfo"
                id="otherInfo"
                value={formData.otherInfo}
                onChange={handleInputChange}
                rows="4"
                placeholder="Provide any other information here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              ></textarea>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Summary & Submit
            </h2>
            <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">
                Review Your Information
              </h3>
              <ul className="space-y-2 text-gray-600">
                {Object.entries(formData).map(([key, value]) => (
                  <li key={key} className="capitalize">
                    <span className="font-medium text-gray-700">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </span>{" "}
                    {String(value)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                name="termsAccepted"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="termsAccepted"
                className="ml-2 block text-sm text-gray-900"
              >
                I accept the{" "}
                <a href="#" className="text-blue-500 hover:underline">
                  terms and conditions
                </a>
                .
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8 overflow-x-hidden">
      {/* Header */}
      <div className="text-center py-8">
        <motion.h1
          className="text-4xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4"
          variants={textVariants}
        >
          SST Partnership 
          <span className="gradient-text"> Program Registration</span>
        </motion.h1>
        <motion.p
          className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          variants={itemVariants}
        >
          {" "}
          A General Partnership Firm is a business structure in which two or
          more individuals manage and operate a business.
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl w-full px-4 pb-12 flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Steps */}
        <div className="lg:w-2/5 xl:w-1/3">
          <div className="bg-white rounded-2xl shadow-sm p-10">
            <div className="space-y-10">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-start">
                  {/* Step Number */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                        step.active
                          ? "bg-black text-white"
                          : step.completed
                          ? "gradient-primary text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.completed ? "✓" : step.number}
                    </div>
                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute top-8 left-4 w-0.5 h-20 -ml-0.5 ${
                          step.completed || step.active
                            ? "bg-blue-200"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="ml-4 min-w-0 flex-1">
                    <h3
                      className={`text-sm font-semibold ${
                        step.active ? "text-black" : "text-gray-700"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:w-3/5 xl:w-2/3">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* The conditional rendering happens here */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 mt-6 ">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-1.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Back
                </button>
              )}

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="ml-auto px-6 py-1.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="ml-auto px-6 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Form;
