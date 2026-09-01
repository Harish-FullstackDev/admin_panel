"use client";

import { HiOutlineCalendarDays } from "react-icons/hi2";

const BookAcallButton = ({
  floating = false,
  setShowCalendly,
}) => {
  return (
    <button
      type="button"
      onClick={() => setShowCalendly(true)}
      className={`
        inline-flex items-center gap-2
        px-4 py-2
        rounded-xl bg-[#51A2FF]
        text-white shadow-lg transition-all duration-300
        hover:scale-105 hover:shadow-xl
        ${floating ? "fixed bottom-10 right-6 z-50" : ""}
      `}
    >
      <HiOutlineCalendarDays className="text-xl" />
      <span className="font-medium whitespace-nowrap">
        Schedule a Call
      </span>
    </button>
  );
};

export default BookAcallButton;