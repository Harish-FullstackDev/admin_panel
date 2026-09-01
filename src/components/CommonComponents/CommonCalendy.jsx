"use client";

import React, { useEffect } from "react";
import { InlineWidget } from "react-calendly";

/**
 * Reusable Calendly Modal Component
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback function to close the modal
 * @param {string} calendlyUrl - Your Calendly scheduling URL
 * @param {object} pageSettings - Optional Calendly page settings (colors, etc.)
 */
export default function CalendlyModal({
  isOpen,
  onClose,
  // To use this Calendly modal, first create an account at https://calendly.com,
  // set up your meeting event (e.g., 30-minute call), and then replace the calendlyUrl
  // with your own Calendly link (for example: https://calendly.com/your-username/30min).
  calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/pdhanoosh-isupportz/new-meeting",
  pageSettings = {
    backgroundColor: "ffffff",
    primaryColor: "#2d8ec5",
    textColor: "#2d8ec5",
  }
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[800px] relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black z-50 text-xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Calendly Widget Container - Full Height with Internal Scrolling */}
        <div className="flex-1 overflow-hidden rounded-2xl">
          <InlineWidget
            url={calendlyUrl}
            styles={{
              height: "100%",
              width: "100%",
              minHeight: "100%"
            }}
            pageSettings={pageSettings}
          />
        </div>
      </div>
    </div>
  );
}

