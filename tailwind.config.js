/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#20df60",
        "background-light": "#f6f8f6",
        "background-dark": "#142526",
        "surface-dark": "#1e3336",
        "surface-border": "#304a4d",
        "profit": "#ef4444", // Taiwan Red
        "loss": "#22c55e",   // Taiwan Green
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
    },
  },
  plugins: [],
}