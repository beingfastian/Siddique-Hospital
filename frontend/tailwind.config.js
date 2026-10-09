/** @type {import('tailwindcss').Config} */
// Tokens from design-system/qclinics/MASTER.md
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand teal. Buttons/links use DEFAULT (700): white text 5.36:1
        primary: {
          DEFAULT: "#0E7490",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
      },
      gridTemplateColumns: {
        auto: "repeat(auto-fill,minmax(200px,1fr))",
      },
      fontFamily: {
        sans: ['"Noto Sans"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Figtree", '"Noto Sans"', "system-ui", "sans-serif"],
        urdu: ['"Noto Nastaliq Urdu"', '"Jameel Noori Nastaleeq"', '"Urdu Typesetting"', "serif"],
      },
    },
  },
  plugins: [],
};
