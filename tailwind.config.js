/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#030712',
          card: 'rgba(17, 24, 39, 0.7)',
          border: 'rgba(0, 242, 255, 0.2)',
          neon: '#00f2ff',
          neonGlow: 'rgba(0, 242, 255, 0.5)',
          text: '#f3f4f6',           
          muted: '#9ca3af',
          pulse: '#ef4444' // Red for emergencies
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 242, 255, 0.5)',
        'neon-hover': '0 0 15px rgba(0, 242, 255, 0.8), inset 0 0 5px rgba(0, 242, 255, 0.2)',
        'pulse': '0 0 15px rgba(239, 68, 68, 0.6)'
      },
      backdropBlur: {
        'glass': '12px'
      }
    },
  },
  plugins: [],
}
