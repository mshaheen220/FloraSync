/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#f3f8ef',
          100: '#e3f0da',
          200: '#c8e1b8',
          300: '#a7cd90',
          400: '#82b364', // Your chosen color!
          500: '#679c48',
          600: '#4f7c36',
          700: '#3e602b',
          800: '#334e25',
          900: '#2a401f',
          950: '#15220f',
        }
      }
    },
  },
  plugins: [],
  // Optional: add any custom earthy typography or CSS variables in 'extend' later
}