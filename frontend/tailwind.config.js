/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          accent: '#00ffaa',
          background: '#111111',
          foreground: '#ffffff',
        },
      },
    },
    plugins: [],
  }