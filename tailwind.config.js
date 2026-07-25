/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        muted: "#647067",
        line: "#dfe6e1",
        surface: "#f6f8f6",
        brand: "#245b46",
        brandDark: "#18382c",
        accent: "#c58b3b",
      },
    },
  },
  plugins: [],
};

export default config;
