/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#eef2f7',
          100: '#d3dfee',
          200: '#a8bddd',
          300: '#7a9bc9',
          400: '#4f7ab0',
          500: '#2e5a91',
          600: '#1e3d6b',
          700: '#162f52',
          800: '#102342',
          900: '#0a1a33',
          950: '#070f1f',
        },
        amber: {
          50: '#fefae8',
          100: '#fdf3c4',
          200: '#fae888',
          300: '#f5d84e',
          400: '#e6c020',
          500: '#cba014',
          600: '#a67d10',
          700: '#85610e',
          800: '#6b4d0e',
          900: '#5a3f0e',
        },
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
