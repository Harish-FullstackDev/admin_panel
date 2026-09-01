// components/CookieConsent.js
"use client"; // Important for client-side functionality

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

// Third-party library for easy cookie handling on the client side
// Install: npm install js-cookie

const COOKIE_NAME = 'cookie_consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already made a choice
    const consent = Cookies.get(COOKIE_NAME);
    if (consent === undefined) {
      // If no choice is found, show the banner
      setShowBanner(true);
    }
    // If 'accepted' or 'rejected' is found, the banner remains hidden.
  }, []);

  const handleConsent = (accepted) => {
    // Set the cookie with the user's choice and an expiration of 365 days
    Cookies.set(COOKIE_NAME, accepted ? 'accepted' : 'rejected', { expires: 365, path: '/' });
    
    // Hide the banner after the choice is made
    setShowBanner(false);

    // 💡 OPTIONAL: You can send this choice to your backend here
    // for logging or server-side cookie setup (see API route example below).
    // sendConsentToServer(accepted);

    // 💡 IMPORTANT: If accepted, you can now load scripts that use cookies (e.g., Google Analytics)
    if (accepted) {
      console.log("Cookies accepted. Safe to load tracking scripts.");
      // Example: loadTrackingScripts();
    } else {
       console.log("Cookies rejected. Only essential functionality allowed.");
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 text-white shadow-lg z-50 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
      <p className="text-sm text-center md:text-left">
        We use cookies to ensure you get the best experience on our website. Review our <a href="/privacyPolicy" className="underline font-semibold">Privacy Policy</a>.
      </p>
      <div className="flex space-x-3">
        <button
          onClick={() => handleConsent(false)}
          className="px-4 py-2 text-sm border border-gray-500 rounded hover:bg-gray-700 transition"
        >
          Reject All
        </button>
        <button
          onClick={() => handleConsent(true)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}