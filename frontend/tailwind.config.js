/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B2027',
        teal: {
          DEFAULT: '#0F5C5C',
          50: '#E6F0EF',
          100: '#C2DBDA',
          400: '#1A7A79',
          500: '#0F5C5C',
          600: '#0C4A4A',
          700: '#093838',
        },
        sky: {
          DEFAULT: '#2B7A9B',
          400: '#3E93B5',
          500: '#2B7A9B',
          600: '#20627D',
        },
        amber: {
          DEFAULT: '#E8A33D',
          400: '#EDB35C',
          500: '#E8A33D',
        },
        mist: '#F7F9F9',
        good: '#2F9E44',
        warn: '#E8A33D',
        crit: '#D64545',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,32,39,0.06), 0 8px 24px -12px rgba(11,32,39,0.12)',
      },
      keyframes: {
        drip: {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translateY(36px)', opacity: '0' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        drip: 'drip 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-slow': 'pulseSlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
