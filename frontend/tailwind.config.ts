import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        ink: {
          50: '#f6f7fb',
          100: '#eceef5',
          200: '#d9dce8',
          300: '#b4b9cc',
          400: '#8a90a8',
          500: '#646a85',
          600: '#4a4f68',
          700: '#363a50',
          800: '#242738',
          900: '#171928',
          950: '#0e101b',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgb(23 25 40 / 0.04), 0 4px 16px -4px rgb(23 25 40 / 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
