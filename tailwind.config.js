/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0f172a',
          950: '#080e1a',
        },
        risk: {
          low: '#10B981',       // Green
          'low-bg': 'rgba(16, 185, 129, 0.15)',
          moderate: '#F59E0B',  // Yellow
          'moderate-bg': 'rgba(245, 158, 11, 0.15)',
          high: '#F97316',      // Orange
          'high-bg': 'rgba(249, 115, 22, 0.15)',
          severe: '#EF4444',    // Red
          'severe-bg': 'rgba(239, 68, 68, 0.15)',
        },
        panel: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          hover: '#334155',
          input: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
