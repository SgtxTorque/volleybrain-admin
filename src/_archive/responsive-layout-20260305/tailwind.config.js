/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.7)',
          dark: 'rgba(15, 23, 42, 0.7)',
        },
        gold: {
          DEFAULT: '#FFD700',
          dim: '#B8860B',
          light: '#FFE55C',
          warm: '#D9994A',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          darker: '#050505',
          card: '#141414',
          hover: '#1a1a1a',
          border: '#2a2a2a',
        },
        // BRAND tokens (from mobile theme/colors.ts)
        brand: {
          'navy-deep': '#0D1B3E',
          navy: '#10284C',
          'sky-blue': '#4BB9EC',
          'sky-light': '#6AC4EE',
          gold: '#FFD700',
          'gold-warm': '#D9994A',
          'off-white': '#F6F8FB',
          'warm-gray': '#F0F2F5',
          border: '#E8ECF2',
          teal: '#2A9D8F',
          coral: '#E76F51',
          'gold-brand': '#E9C46A',
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
          'surface-dark': '#0A1628',
          'surface-card': '#1A2744',
          'card-border': 'rgba(75, 185, 236, 0.12)',
          'attention-bg': '#FFF8E1',
        },
        // BRAND text opacity tokens
        'brand-text': {
          primary: '#10284C',
          muted: 'rgba(16,40,76,0.4)',
          faint: 'rgba(16,40,76,0.25)',
          light: '#E8EDF4',
          secondary: '#8A9AB5',
          tertiary: '#556B8A',
        },
        lynx: {
          navy: '#10284C',
          sky: '#4BB9EC',
          deep: '#2A9BD4',
          ice: '#E8F4FD',
          slate: '#5A6B7F',
          silver: '#E8ECF2',
          cloud: '#F6F8FB',
          frost: '#F0F2F5',
          midnight: '#0A1628',
          charcoal: '#1A2744',
          graphite: '#232F3E',
          'border-dark': '#2A3545',
        }
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 24px -6px rgba(0, 0, 0, 0.12), 0 12px 24px -6px rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 20px 40px -8px rgba(0, 0, 0, 0.1), 0 10px 16px -6px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow-sm': '0 0 10px var(--accent-glow, rgba(249, 115, 22, 0.15))',
        'glow-md': '0 0 20px var(--accent-glow, rgba(249, 115, 22, 0.2))',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.2)',
        'glow-blue': '0 0 20px rgba(14, 165, 233, 0.2)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.2)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.2)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.2)',
        'glow-slate': '0 0 20px rgba(100, 116, 139, 0.2)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        sans: ['Tele-Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.2s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
