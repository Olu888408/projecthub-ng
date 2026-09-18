/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand: deep ink-navy — an official-document, trustworthy
        // feel rather than a generic SaaS blue. Key names kept as "teal" so
        // all existing bg-teal-*/text-teal-* usage across the app updates
        // automatically without touching every file.
        teal: {
          50: '#EFF1F6',
          100: '#D9DEEA',
          200: '#B3BDD5',
          300: '#8D9CC0',
          400: '#56658F',
          500: '#2E3B5E',
          600: '#1B2745',
          700: '#141D34',
          800: '#0F1626',
          900: '#0A0F1A',
          950: '#05080D',
        },
        // Accent: burnt clay/ochre — used sparingly for the one
        // distinctive visual moment (hero accent, star ratings, highlight
        // chips), never as a background wash.
        amber: {
          50: '#FBF4EC',
          100: '#F5E3CC',
          200: '#EBC593',
          300: '#DFA663',
          400: '#CE8541',
          500: '#B96B2C',
          600: '#9C5522',
          700: '#7C431B',
          800: '#5F3316',
          900: '#472712',
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(10, 15, 26, 0.04)',
        DEFAULT: '0 1px 3px 0 rgba(10, 15, 26, 0.06)',
        md: '0 2px 6px 0 rgba(10, 15, 26, 0.06)',
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
