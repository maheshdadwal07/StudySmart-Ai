export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
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
