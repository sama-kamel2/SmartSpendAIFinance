/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef9f4',
          100: '#d6f0e4',
          200: '#aee0c9',
          300: '#7acaa6',
          400: '#48b085',
          500: '#2d9a6c',
          600: '#1f7d56',
          700: '#1a6347',
          800: '#174f3a',
          900: '#134230',
          950: '#0a2618',
        },
      },
    },
  },
  plugins: [],
}
