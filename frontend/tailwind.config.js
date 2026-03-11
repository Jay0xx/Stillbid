/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "auction-bg": "#FAFAFA",
        "auction-card": "#FFFFFF",
        "auction-accent": "#111111",
        "auction-muted": "#6B7280",
        "auction-border": "#E5E7EB",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
