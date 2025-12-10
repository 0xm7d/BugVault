/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0f172a",
        accent: "#6366f1",
        success: "#22c55e",
        warning: "#fbbf24",
        danger: "#ef4444",
      },
    },
  },
  plugins: [],
};

