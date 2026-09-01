"use client";

import Link from "next/link";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

const ContactUsButton = ({ floating = false }) => {
  return (
    <Link
      href="/contact-us"
      className={`
        inline-flex items-center gap-2
        px-4 py-2
        rounded-xl bg-[#51A2FF]
        text-white shadow-lg transition-all duration-300
        hover:scale-105 hover:shadow-xl
        ${floating ? "fixed bottom-10 right-6 z-50" : ""}
      `}
    >
      <HiOutlineChatBubbleLeftRight className="text-xl" />
      <span className="font-medium whitespace-nowrap">
        Contact Us
      </span>
    </Link>
  );
};

export default ContactUsButton;
