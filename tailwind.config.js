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
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      // Responsive font sizes: clamp(min, preferred, max)
      // min = readable on 1024px laptop, max = capped on ultrawide
      fontSize: {
        'r-xs':   ['clamp(0.6875rem, 0.6rem + 0.25vw, 0.8125rem)', { lineHeight: '1.4' }],
        'r-sm':   ['clamp(0.75rem, 0.65rem + 0.3vw, 0.9375rem)', { lineHeight: '1.4' }],
        'r-base': ['clamp(0.875rem, 0.75rem + 0.35vw, 1.0625rem)', { lineHeight: '1.5' }],
        'r-lg':   ['clamp(1rem, 0.85rem + 0.4vw, 1.25rem)', { lineHeight: '1.4' }],
        'r-xl':   ['clamp(1.125rem, 0.95rem + 0.5vw, 1.5rem)', { lineHeight: '1.3' }],
        'r-2xl':  ['clamp(1.375rem, 1.1rem + 0.7vw, 1.875rem)', { lineHeight: '1.2' }],
        'r-3xl':  ['clamp(1.75rem, 1.4rem + 0.9vw, 2.5rem)', { lineHeight: '1.1' }],
        'r-4xl':  ['clamp(2.25rem, 1.8rem + 1.2vw, 3.25rem)', { lineHeight: '1' }],
        'r-5xl':  ['clamp(3rem, 2.4rem + 1.5vw, 4.5rem)', { lineHeight: '1' }],
      },
      // Responsive spacing: scales smoothly between viewport sizes
      spacing: {
        'r-1': 'clamp(0.25rem, 0.2rem + 0.15vw, 0.375rem)',
        'r-2': 'clamp(0.5rem, 0.4rem + 0.25vw, 0.75rem)',
        'r-3': 'clamp(0.75rem, 0.6rem + 0.35vw, 1rem)',
        'r-4': 'clamp(1rem, 0.8rem + 0.5vw, 1.5rem)',
        'r-6': 'clamp(1.5rem, 1.2rem + 0.75vw, 2.25rem)',
        'r-8': 'clamp(2rem, 1.6rem + 1vw, 3rem)',
      },
      // Max-width/max-height design tokens for cards and containers
      maxWidth: {
        'card-sm': '320px',
        'card-md': '480px',
        'card-lg': '640px',
        'card-xl': '800px',
        'dashboard': '1600px',
      },
      maxHeight: {
        'hero': '380px',
        'hero-sm': '280px',
        'card': '500px',
        'card-sm': '320px',
        'card-tall': '700px',
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
