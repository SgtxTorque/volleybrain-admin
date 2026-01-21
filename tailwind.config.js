/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#FFD700',
          dim: '#B8860B',
          light: '#FFE55C',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          darker: '#050505',
          card: '#141414',
          hover: '#1a1a1a',
          border: '#2a2a2a',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
