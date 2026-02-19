/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'card': 'rgb(32, 34, 52)',
        'accent-green': '#4caf50',
        'tab-active': 'rgb(102, 126, 234)',
      },
      borderRadius: {
        'card': '15px',
      },
      backdropBlur: {
        'card': '10px',
      },
    },
  },
  plugins: [],
}