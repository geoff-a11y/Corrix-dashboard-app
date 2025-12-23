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
        // Background colors from extension theme
        bg: {
          primary: '#1a1f2e',
          secondary: '#252b3d',
          tertiary: '#0f1219',
          accent: '#5b4cdb',
          'accent-hover': '#6b5ce6',
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#a0a8c0',
          muted: '#6b7280',
          accent: '#8b7cf7',
        },
        // Border colors
        border: {
          DEFAULT: '#343a4d',
          subtle: 'rgba(255, 255, 255, 0.1)',
          accent: 'rgba(91, 76, 219, 0.3)',
        },
        // Score colors
        score: {
          high: '#22c55e',
          medium: '#eab308',
          low: '#ef4444',
        },
        // Status colors
        status: {
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          info: '#3b82f6',
        },
        // Accent purple
        accent: {
          DEFAULT: '#5b4cdb',
          hover: '#6b5ce6',
          light: '#8b7cf7',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-lg': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
};
