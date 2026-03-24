/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0f172a',
        darker: '#020617',
        primary: '#3b82f6',
        primaryDark: '#1d4ed8',
        card: '#1e293b'
      }
    },
  },
  plugins: [],
}
