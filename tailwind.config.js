/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      colors: {
        ink: "#1f2a24",
        muted: "#68766f",
        line: "#e3ebe6",
        surface: "#f8faf8",
        brand: "#3b7a61",
        brandDark: "#2f654f",
        accent: "#b9863d",
      },
    },
  },
  plugins: [],
};

export default config;
