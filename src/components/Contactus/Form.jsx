import React, { useState } from 'react';
import { Snackbar, Alert, CircularProgress } from '@mui/material';
 
const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    secondName: '',
    companyEmail: '',
    contactNumber: '',
    country: '',
    companyName: '',
    enquiries: ''
  });
 
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  // MUI Snackbar states
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });
 
  // Handle notification close
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };
 
  const validateForm = () => {
    const newErrors = {};
 
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 3) {
      newErrors.firstName = 'First name must be at least 3 characters long';
    } else if (!/^[A-Za-z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name should only contain characters';
    }
 
    if (!formData.secondName.trim()) {
      newErrors.secondName = 'Last name is required';
    } else if (formData.secondName.trim().length < 1) {
      newErrors.secondName = 'Last name must be at least 1 characters long';
    } else if (!/^[A-Za-z\s]+$/.test(formData.secondName.trim())) {
      newErrors.secondName = 'Last name should only contain characters';
    }
 
    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail.trim())) {
      newErrors.companyEmail = 'Please enter a valid email address';
    }
 
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required'
    } else if (!/^[\+]?[\d\s\-\(\)]+$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber = 'Please enter a valid contact number'
    } else {
      const digitsOnly = formData.contactNumber.replace(/\D/g, '')
      if (digitsOnly.length < 10) {
        newErrors.contactNumber = 'Contact number must be at least 10 digits'
      } else if (digitsOnly.length > 10) {
        newErrors.contactNumber = 'Contact number cannot exceed 10 digits'
      }
    }
 
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    } else if (formData.country.trim().length < 2) {
      newErrors.country = 'Please enter a valid country name';
    } else if (!/^[A-Za-z\s]+$/.test(formData.country.trim())) {
      newErrors.country = 'Country should only contain characters';
    }
 
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters long';
    }
 
    if (!formData.enquiries.trim()) {
      newErrors.enquiries = 'Enquiries field is required';
    } else if (formData.enquiries.trim().length < 10) {
      newErrors.enquiries = 'Enquiries must be at least 10 characters long';
    }
 
    return newErrors;
  };
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
   
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
 
    const newErrors = validateForm();
 
    if (Object.keys(newErrors).length === 0) {
      try {
        const payload = {
          firstName: formData.firstName,
          lastName: formData.secondName,  
          cmpnyEmail: formData.companyEmail,
          contactNumber: formData.contactNumber,
          country: formData.country,
          companyName: formData.companyName,
          message: formData.enquiries
        };
 
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
 
        if (!res.ok) {
          const errorData = await res.json();
         
          // Show error notification
          setNotification({
            open: true,
            message: errorData.error || "Something went wrong",
            severity: 'error'
          });
         
          throw new Error(errorData.error || "Something went wrong");
        }
 
        const data = await res.json();
        console.log("✅ Form submitted successfully:", data);
 
        // Show success notification
        setNotification({
          open: true,
          message: 'Form submitted successfully!',
          severity: 'success'
        });
 
        // Reset form after submission
        setFormData({
          firstName: '',
          secondName: '',
          companyEmail: '',
          contactNumber: '',
          country: '',
          companyName: '',
          enquiries: ''
        });
 
      } catch (error) {
        console.error(error);
       
        // Show error notification if not already shown
        if (!notification.open) {
          setNotification({
            open: true,
            message: "An error occurred. Please try again.",
            severity: 'error'
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
      setIsSubmitting(false);
     
    }
  };
 
  return (
    <>
      <div
        className="rounded-3xl shadow-lg p-8 lg:p-8 m-4 lg:m-8 overflow-x-hidden overflow-hidden border"
        style={{
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          background: "rgba(255, 255, 255, 0.55)",
          borderColor: "rgba(229, 231, 235, 0.5)"
        }}
      >
        <div className="mb-8">
          <h3 className="text-xl lg:text-xl font-semibold text-gray-900 mb-2">
            Personal information
          </h3>
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name and Second Name Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Exp. John"
                className={`w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-gray-50 backdrop-blur-sm placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white/80 transition-all duration-200 ${
                  errors.firstName
                    ? 'border-red-300 focus:ring-red-300'
                    : 'focus:ring-blue-300'
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
 
            <div className="space-y-2">
              <label htmlFor="secondName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                id="secondName"
                name="secondName"
                value={formData.secondName}
                onChange={handleChange}
                placeholder="Exp. Carter"
                className={`w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-gray-50 backdrop-blur-sm placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white/80 transition-all duration-200 ${
                  errors.secondName
                    ? 'border-red-300 focus:ring-red-300'
                    : 'focus:ring-blue-300'
                }`}
              />
              {errors.secondName && (
                <p className="text-red-500 text-xs mt-1">{errors.secondName}</p>
              )}
            </div>
          </div>
 
          {/* Company Email and Contact Number Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                Company Email *
              </label>
              <input
                type="email"
                id="companyEmail"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleChange}
                placeholder="john@company.com"
                className={`w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-gray-50 backdrop-blur-sm placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white/80 transition-all duration-200 ${
                  errors.companyEmail
                    ? 'border-red-300 focus:ring-red-300'
                    : 'focus:ring-blue-300'
                }`}
              />
              {errors.companyEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.companyEmail}</p>
              )}
            </div>
 
            <div className="space-y-2">
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="(123) 000-0000"
                className={`w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-gray-50 backdrop-blur-sm placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white/80 transition-all duration-200 ${
                  errors.contactNumber
                    ? 'border-red-300 focus:ring-red-300'
                    : 'focus:ring-blue-300'
                }`}
              />
              {errors.contactNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>
              )}
            </div>
          </div>
 
          {/* Country and Company Name Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country *
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
                className={`w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-gray-50 backdrop-blur-sm placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white/80 transition-all duration-200 ${
                  errors.country
                    ? 'border-red-300 focus:ring-red-300'
                    : 'focus:ring-blue-300'
                }`}
              />
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">{errors.country}</p>
              )}
            </div>
 
            <div className="space-y-2">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="ABC Corporation"
                className={`w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-gray-50 backdrop-blur-sm placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white/80 transition-all duration-200 ${
                  errors.companyName
                    ? 'border-red-300 focus:ring-red-300'
                    : 'focus:ring-blue-300'
                }`}
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
              )}
            </div>
          </div>
 
          {/* Enquiries Field */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="enquiries" className="block text-sm font-medium text-gray-700">
                Enquiries *
              </label>
              <textarea
                id="enquiries"
                name="enquiries"
                value={formData.enquiries}
                onChange={handleChange}
                rows={4}
                placeholder="Please describe your enquiry in detail..."
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none ${
                  errors.enquiries
                    ? 'border-red-300 focus:ring-red-300'
                    : 'focus:ring-blue-300'
                }`}
              />
              {errors.enquiries && (
                <p className="text-red-500 text-xs mt-1">{errors.enquiries}</p>
              )}
            </div>
          </div>
 
          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 bg-black text-white py-2 px-5 rounded-lg font-medium text-sm transition duration-200 ease-in-out  ${
                isSubmitting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-800 hover:shadow-md transform hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                   <>
                     <span>Submitting</span>
                     <CircularProgress size={18} color="inherit" />
                   </>
                 ) : (
                   'Submit'
                 )}
            </button>
          </div>
        </form>
      </div>
 
      {/* MUI Snackbar Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};
 
export default ContactForm;
