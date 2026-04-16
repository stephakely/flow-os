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
          dark: '#050505',
          card: '#0a0a0a',
          border: '#1a1a1a',
          text: '#e0e0e0',
          muted: '#808080',
          neon: '#00ffaa', // Toxic Green
          'neon-dim': 'rgba(0, 255, 170, 0.2)',
          purple: '#bc13fe', // Holo Purple
          blue: '#1326ff', // Cyber Blue
          red: '#ff133d', // Alert Red
          gold: '#ffd700', // Luxury Gold
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'neon-small': '0 0 5px rgba(0, 255, 170, 0.4)',
        'neon': '0 0 10px rgba(0, 255, 170, 0.5)',
        'neon-strong': '0 0 20px rgba(0, 255, 170, 0.8)',
        'neon-purple': '0 0 15px rgba(188, 19, 254, 0.5)',
        'neon-blue': '0 0 15px rgba(19, 38, 255, 0.5)',
        'neon-red': '0 0 15px rgba(255, 19, 61, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
      },
      dropShadow: {
        'neon-strong': '0 0 15px rgba(0, 255, 170, 0.6)',
        'neon-gold': '0 0 15px rgba(255, 215, 0, 0.3)',
        'neon-red': '0 0 15px rgba(255, 19, 61, 0.3)',
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-2px, 2px)' },
          '66%': { transform: 'translate(2px, -2px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backdropBlur: {
        'glass': '12px'
      }
    },
  },
  plugins: [],
}
