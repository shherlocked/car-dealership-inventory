/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Near-black navy canvas and raised surfaces.
        canvas: {
          DEFAULT: '#0B1020',
          50: '#141a2e',
          100: '#1b2338',
          200: '#232c45',
          300: '#2d3855',
        },
        surface: {
          DEFAULT: '#10172a',
          raised: '#161f36',
        },
        line: {
          DEFAULT: '#25304a',
          soft: '#1d2740',
        },
        // Warm amber/orange accent used for primary actions and highlights.
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        // Semantic stock/status colors, tuned for contrast on dark surfaces.
        ok: {
          DEFAULT: '#34d399',
          muted: '#052e22',
        },
        warn: {
          DEFAULT: '#fbbf24',
          muted: '#3a2a06',
        },
        danger: {
          DEFAULT: '#f87171',
          muted: '#3c1111',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px -12px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.4), 0 16px 40px -12px rgba(0, 0, 0, 0.6)',
        glow: '0 0 0 1px rgba(249, 115, 22, 0.35), 0 8px 24px -12px rgba(249, 115, 22, 0.5)',
        modal: '0 24px 64px -16px rgba(0, 0, 0, 0.7)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        display: ['"Sora"', '"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'toast-in': 'toast-in 200ms ease-out',
        'modal-in': 'modal-in 200ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
