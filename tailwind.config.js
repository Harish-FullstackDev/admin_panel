/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            50: "#f0fdfa",
            100: "#ccfbf1",
            200: "#99f6e4",
            300: "#5eead4",
            400: "#2dd4bf",
            500: "#14b8a6", // Signature brand accent tone
            600: "#0d9488",
            700: "#0f766e",
            800: "#115e59",
            900: "#134e4a",
            950: "#042f2e",
          },
          corporate: {
            50: "#f8fafc", // Light luminous canvas bg
            100: "#f1f5f9",
            200: "#e2e8f0", // Clean dividers and borders
            300: "#cbd5e1",
            400: "#94a3b8",
            500: "#64748b",
            600: "#475569",
            700: "#334155",
            800: "#1e293b", // Primary blue-gray corporate focus
            900: "#0f172a", // Rich deep corporate navy slate
            950: "#020617",
          },
        },
      },
      fontFamily: {
        sans: ["Gelion", "sans-serif"],
        heading: ["Gelion", "sans-serif"],
      },
    },
  },
  plugins: [],
};
