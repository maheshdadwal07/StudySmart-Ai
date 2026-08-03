/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        background: "#0f172a",
        surface: "#1e293b",
        textPrimary: "#f8fafc",
        textSecondary: "#94a3b8"
      }
    },
  },
  plugins: [],
}
