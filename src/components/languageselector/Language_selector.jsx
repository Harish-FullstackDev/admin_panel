"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

const regionalLocales = [
  {
    regionGroup: "Americas",
    items: [
      {
        country: "United States",
        flag: "🇺🇸",
        language: { code: "en-US", name: "English" },
      },
      {
        country: "Canada",
        flag: "🇨🇦",
        language: { code: "en-CA", name: "English" },
      },
      {
        country: "Brazil",
        flag: "🇧🇷",
        language: { code: "pt-BR", name: "Português" },
      },
    ],
  },
  {
    regionGroup: "Europe",
    items: [
      {
        country: "United Kingdom",
        flag: "🇬🇧",
        language: { code: "en-GB", name: "English" },
      },
      {
        country: "France",
        flag: "🇫🇷",
        language: { code: "fr-FR", name: "Français" },
      },
      {
        country: "Germany",
        flag: "🇩🇪",
        language: { code: "de-DE", name: "Deutsch" },
      },
    ],
  },
  {
    regionGroup: "Asia Pacific",
    items: [
      {
        country: "India",
        flag: "🇮🇳",
        language: { code: "en-IN", name: "English" },
      },
      {
        country: "Japan",
        flag: "🇯🇵",
        language: { code: "ja-JP", name: "日本語" },
      },
      {
        country: "China",
        flag: "🇨🇳",
        language: { code: "zh-CN", name: "简体中文" },
      },
    ],
  },
];

export default function LanguageSelector({ isNavbarLight }) {
  const dropdownRef = useRef(null);

  const [selected, setSelected] = useState({
    regionGroup: "Asia Pacific",
    country: "India",
    flag: "🇮🇳",
    language: { code: "en-IN", name: "English" },
  });

  const [openRegion, setOpenRegion] = useState("Asia Pacific");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (regionGroup, item) => {
    setSelected({ regionGroup, ...item });
    setIsOpen(false);
  };

  const toggleRegion = (region) => {
    setOpenRegion((prev) => (prev === region ? null : region));
  };

  const glassBase =
    "border transition-all duration-300 ease-in-out";

  const themeClass = isNavbarLight
    ? "bg-white/80 border-gray-200/30 text-gray-800 shadow-md backdrop-blur-md"
    : "bg-neutral-900/80 border-white/20 text-white backdrop-blur-md";

  const themeClass1 = isNavbarLight
    ? "bg-white/80 border-gray-200/30 text-gray-800 shadow-md backdrop-blur-md"
    : "bg-white/10 border-white/20 text-white backdrop-blur-md";


  return (
    <div
      ref={dropdownRef}
      className="relative inline-block group"
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2
          px-4 py-2 rounded-xl
          ${glassBase}
          ${themeClass1}
          hover:scale-105 active:scale-95
          hover:shadow-lg
        `}
      >
        <Globe className="h-4 w-4" />

        <span className="hidden sm:flex items-center gap-2 text-sm">
          <span>{selected.country}</span>
          <span className="opacity-40">|</span>
          <span className="uppercase text-xs font-semibold opacity-70">
            {selected.language.code.split("-")[0]}
          </span>
        </span>

        <span className="sm:hidden text-xs ">
          {selected.country}
        </span>

        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : "lg:group-hover:rotate-180"
            }`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`
                      absolute right-[-52px] sm:right-0 z-50 mt-3
                      w-[300px] sm:w-[380px]
                      overflow-hidden
                      rounded-2xl
                      transition-all duration-300
                      backdrop-blur-md
                      ${glassBase}
                      ${themeClass}
                      shadow-2xl
                      ${isOpen
            ? "visible opacity-100 translate-y-0"
            : "invisible opacity-0 translate-y-3 lg:group-hover:visible lg:group-hover:opacity-100 lg:group-hover:translate-y-0"
          }
                    `}
      >
        {/* Header */}
        <div className={`border-b px-5 py-4 ${isNavbarLight ? "border-gray-200/50" : "border-white/10"}`}>
          <h3 className="text-sm font-semibold">
            Select Region & Language
          </h3>
          <p className="text-xs opacity-70 mt-1">
            Choose your preferred locale
          </p>
        </div>

        <div className="max-h-[450px] overflow-y-auto">
          {regionalLocales.map((group) => {
            const isExpanded = openRegion === group.regionGroup;

            return (
              <div
                key={group.regionGroup}
                className={`border-b last:border-0 ${isNavbarLight ? "border-gray-200/50" : "border-white/10"}`}
              >
                {/* Region */}
                <button
                  type="button"
                  onClick={() => toggleRegion(group.regionGroup)}
                  className={`flex w-full justify-between px-5 py-3 transition ${isNavbarLight ? "hover:bg-gray-100" : "hover:bg-white/10"
                    }`}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {group.regionGroup}
                    </p>
                    <p className="text-xs opacity-60">
                      {group.items.length} countries
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Countries */}
                {isExpanded && (
                  <div className="py-1">
                    {group.items.map((item) => {
                      const isSelected =
                        selected.country === item.country &&
                        selected.language.code === item.language.code;

                      return (
                        <button
                          key={item.language.code}
                          onClick={() =>
                            handleSelect(group.regionGroup, item)
                          }
                          className={`
                              flex w-full items-center justify-between
                              px-5 py-3
                              transition-colors duration-200
                              ${isSelected
                              ? isNavbarLight
                                ? "bg-gray-100"
                                : "bg-white/10"
                              : isNavbarLight
                                ? "hover:bg-gray-50"
                                : "hover:bg-white/5"
                            }
                            `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {item.flag}
                            </span>

                            <div className="text-left">
                              <p
                                className={`text-sm font-medium ${isSelected
                                  ? "opacity-100"
                                  : "opacity-90"
                                  }`}
                              >
                                {item.country}
                              </p>

                              <p className="text-xs opacity-60">
                                {item.language.name}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

