import React, { useState } from 'react';
import { Snackbar, Alert, CircularProgress } from '@mui/material';
import CalendlyModal from '../CommonComponents/CommonCalendy';

const Form = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    country: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendly Modal State
  const [showCalendly, setShowCalendly] = useState(false);

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

  // ✅ Validation logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name should only contain letters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Please select a country';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        const res = await fetch("/api/bookacall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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
          name: '',
          email: '',
          companyName: '',
          country: '',
          message: ''
        });
      } catch (error) {
        console.error("Error:", error.message);

        // Show error notification if not already shown
        if (!notification.open) {
          setNotification({
            open: true,
            message: error.message === "This email is already registered"
              ? "This email is already registered"
              : "An error occurred. Please try again.",
            severity: 'error'
          });
        }
      }
      finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-10 bg-white shadow-lg rounded-md overflow-x-hidden overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name and Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-md font-medium text-gray-700 mb-2">
                Your name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Your Name"
                className={`w-full px-3 py-2 border placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-md font-medium text-gray-700 mb-2">
                Contact email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your Email"
                className={`w-full px-3 py-2 border placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.email ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Company and Country Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-md font-medium text-gray-700 mb-2">
                Company name*
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Company name"
                className={`w-full px-3 py-2 border placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.companyName ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
              />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-md font-medium text-gray-700 mb-2">
                Country*
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 bg-white ${errors.country ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
              >
                <option value="">Select a country</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="IN">India</option>
                <option value="CN">China</option>
              </select>
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>
          </div>

          {/* Message Field */}
          <div>
            <label htmlFor="message" className="block text-md font-medium text-gray-700 mb-2">
              Your message*
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Type your message..."
              rows={4}
              className={`w-full px-3 py-2 border placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 resize-vertical ${errors.message ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
            />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
          </div>

          {/* Terms and Privacy Notice */}
          <div className="text-sm text-gray-600 leading-relaxed">
            By submitting this form you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">
              terms and conditions
            </a>{' '}
            and our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">
              Privacy Policy
            </a>{' '}
            which explains how we may collect, use and disclose your personal information including to third parties.
          </div>

          {/* Submit Buttons */}
          <div>
            <div className="flex gap-4">
              {/* Contact Sales Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 bg-[#2d8ec5] text-white font-medium py-2 px-6 rounded-md transition duration-200 ease-in-out ${isSubmitting
                  ? 'opacity-80 cursor-not-allowed'
                  : 'hover:bg-blue-400'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <span>Submitting</span>
                    <CircularProgress size={18} color="inherit" />
                  </>
                ) : (
                  'Contact Sales'
                )}
              </button>

              {/* Schedule a Call Button - Opens Calendly Modal */}
              <button
                type="button"
                onClick={() => setShowCalendly(true)}
                className="flex items-center gap-2 bg-[#2d8ec5] text-white font-medium py-2 px-6 rounded-md transition duration-200 ease-in-out hover:bg-blue-400"
              >
                Schedule a Call
              </button>
            </div>
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

      {/* Calendly Modal Component */}
      <CalendlyModal
        isOpen={showCalendly}
        onClose={() => setShowCalendly(false)}
        // To use this Calendly modal, first create an account at https://calendly.com,
        // set up your meeting event (e.g., 30-minute call), and then replace the calendlyUrl
        // with your own Calendly link (for example: https://calendly.com/your-username/30min).
        calendlyUrl={process.env.NEXT_PUBLIC_CALENDLY_URL}
        pageSettings={{
          backgroundColor: "ffffff",
          primaryColor: "#2d8ec5",
          textColor: "#2d8ec5",
        }}
      />
    </>
  );
};

export default Form;