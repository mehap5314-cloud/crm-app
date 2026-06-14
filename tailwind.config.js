/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#94a3b8',
          300: '#64748b',
          400: '#475569',
          500: '#353d52',
          600: '#2a3040',
          700: '#222839',
          800: '#1a1f2e',
          900: '#111827',
          950: '#0a0f1e',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
