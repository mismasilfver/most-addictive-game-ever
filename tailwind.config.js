/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1a2e',
        'bg-secondary': '#16213e',
        'bg-card': '#0f3460',
        'accent': '#e94560',
        'text-primary': '#eaeaea',
        'text-secondary': '#a0a0a0',
        'tier-common': '#9ca3af',
        'tier-uncommon': '#22c55e',
        'tier-rare': '#3b82f6',
        'tier-epic': '#a855f7',
        'tier-legendary': '#eab308',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
