/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Updated Color Palette (Deep Teal Theme)
        primary: {
          DEFAULT: '#0F766E', // Deep Teal (Teal-700)
          hover: '#0D9488',   // Teal-600
          light: '#F0FDFA',   // Teal-50
        },
        secondary: {
          DEFAULT: '#14B8A6', // Mint Teal (Teal-500)
          hover: '#0F766E',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6', // App Background
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563', // Body Text
          700: '#374151',
          800: '#1F2937', // Title Text
          900: '#111827',
        },
        success: '#14B8A6', // Mint Teal
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'toss': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'float': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
