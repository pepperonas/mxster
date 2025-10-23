/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Celox Dark Theme
        primary: '#2C2E3B',
        secondary: '#4A90E2',
        accent: '#FF6B35',
        background: '#1A1C27',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B0B3C1',

        // mxster Game Colors (zusätzlich)
        'game-bg': '#1a1a2e',
        'game-card': '#16213e',
        'game-accent': '#0f3460',
        'game-highlight': '#e94560',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(74, 144, 226, 0.3)',
        'glow-md': '0 0 20px rgba(74, 144, 226, 0.4)',
        'glow-lg': '0 0 30px rgba(74, 144, 226, 0.5)',
        'glow-accent': '0 0 25px rgba(255, 107, 53, 0.4)',
        'glow-game': '0 0 20px rgba(233, 69, 96, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      screens: {
        'xs': '375px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(74, 144, 226, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(74, 144, 226, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
