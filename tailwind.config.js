/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#030712',
          card: 'rgba(15, 23, 42, 0.75)',
          cyan: '#06b6d4',
          neonCyan: '#22d3ee',
          emerald: '#10b981',
          neonEmerald: '#34d399',
          magenta: '#d946ef',
          neonMagenta: '#f472b6',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -2px rgba(6, 182, 212, 0.5)',
        'glow-magenta': '0 0 20px -2px rgba(217, 70, 239, 0.5)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.5)',
      }
    },
  },
  plugins: [],
}
