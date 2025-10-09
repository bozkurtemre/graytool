/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./popup/**/*.{html,tsx,ts,jsx,js}",
    "./src/**/*.{html,tsx,ts,jsx,js}",
    "./content-script.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
