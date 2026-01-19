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
        // Kanagawa-dragon Theme カラーパレット
        terminal: {
          bg: '#181616',           // dragonBlack3 - メイン背景
          'bg-secondary': '#1d1c19', // dragonBlack4 - セカンダリ背景
          border: '#282727',       // dragonBlack5 - ボーダー
          text: '#c5c9c5',         // dragonWhite - メインテキスト
          'text-dim': '#a6a69c',   // dragonGray2 - 薄いテキスト
          accent: '#8ba4b0',       // dragonBlue - アクセント
          'accent-hover': '#9cabce', // dragonBlue2 - アクセントホバー
          error: '#c4746e',        // dragonRed - エラー
          success: '#87a987',      // dragonGreen - 成功
          warning: '#c4b28a',      // dragonYellow - 警告
          // 追加カラー
          purple: '#8992a7',       // dragonViolet
          orange: '#b6927b',       // dragonOrange
          pink: '#a292a3',         // dragonPink
          aqua: '#8ea4a2',         // dragonAqua
        },
      },
    },
  },
  plugins: [],
}
