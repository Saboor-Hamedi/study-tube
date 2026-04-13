/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1a1a1a',
        'surface-2': '#222',
        'surface-3': '#2a2a2a',
        border: 'rgba(255,255,255,0.08)',
        muted: '#888',
        accent: '#3b82f6',          // blue-500
        'accent-hover': '#2563eb',  // blue-600
        success: '#22c55e',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
