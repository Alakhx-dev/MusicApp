/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: 'rgba(255, 255, 255, 0.03)',
        surfaceHover: 'rgba(255, 255, 255, 0.06)',
        primary: '#E11D48', // rose-600 for neon accent
        primaryGlow: 'rgba(225, 29, 72, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        neon: '0 0 15px rgba(225, 29, 72, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '10px',
      }
    },
  },
  plugins: [],
}
