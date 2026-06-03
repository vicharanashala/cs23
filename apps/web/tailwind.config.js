/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          muted: '#64748b',
          text: '#f1f5f9',
        },
      },
    },
  },
  plugins: [],
};