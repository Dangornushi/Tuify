/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      colors: {
        // TUI用のカラーパレット（xterm-256風）
        terminal: {
          bg: '#1a1a2e',
          'bg-secondary': '#16213e',
          border: '#0f3460',
          text: '#e8e8e8',
          'text-dim': '#a0a0a0',
          accent: '#c8ff00',
          'accent-hover': '#a8d900',
          error: '#ff6b6b',
          success: '#51cf66',
          warning: '#ffd43b',
        },
      },
    },
  },
  plugins: [],
}
