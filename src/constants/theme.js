// Accent color — Lynx brand (single accent, no user selection)
export const accentColors = {
  lynx: {
    primary: '#4BB9EC',
    light: '#E8F4FD',
    lighter: '#F0F8FF',
    dark: '#2A9BD4',
    glow: 'rgba(75, 185, 236, 0.15)',
    navBar: '#10284C',
    navBarSolid: '#10284C',
  },
}

// Theme color definitions — Lynx brand palette
export const themes = {
  dark: {
    name: 'dark',
    bg: 'bg-lynx-midnight',
    bgSecondary: 'bg-lynx-charcoal',
    bgTertiary: 'bg-lynx-graphite',
    bgHover: 'hover:bg-lynx-graphite',
    border: 'border-lynx-border-dark',
    text: 'text-white',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    colors: {
      bg: '#0A1B33',
      bgSecondary: '#1A2332',
      bgTertiary: '#232F3E',
      card: '#1A2332',
      cardAlt: '#232F3E',
      border: '#2A3545',
      text: '#ffffff',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
    }
  },
  light: {
    name: 'light',
    bg: 'bg-lynx-cloud',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-lynx-frost',
    bgHover: 'hover:bg-lynx-frost',
    border: 'border-lynx-silver',
    text: 'text-lynx-navy',
    textSecondary: 'text-lynx-slate',
    textMuted: 'text-lynx-slate',
    colors: {
      bg: '#F5F7FA',
      bgSecondary: '#FFFFFF',
      bgTertiary: '#F0F3F7',
      card: '#FFFFFF',
      cardAlt: '#F0F3F7',
      border: '#DFE4EA',
      text: '#10284C',
      textSecondary: '#5A6B7F',
      textMuted: '#5A6B7F',
    }
  }
}

// Color picker options — single Lynx brand color
export const colorPickerOptions = [
  { id: 'lynx', color: '#4BB9EC', label: 'Lynx Blue' },
]

// Status color configurations
export const statusColors = {
  success: {
    bg: 'bg-emerald-500/20',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-400',
    textLight: 'text-emerald-600',
    indicator: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-500/20',
    bgLight: 'bg-amber-50',
    text: 'text-amber-400',
    textLight: 'text-amber-600',
    indicator: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-500/20',
    bgLight: 'bg-red-50',
    text: 'text-red-400',
    textLight: 'text-red-600',
    indicator: 'bg-red-500',
  },
  info: {
    bg: 'bg-sky-500/20',
    bgLight: 'bg-sky-50',
    text: 'text-sky-400',
    textLight: 'text-sky-600',
    indicator: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-slate-700',
    bgLight: 'bg-slate-100',
    text: 'text-slate-400',
    textLight: 'text-slate-600',
    indicator: 'bg-transparent',
  },
}

// Priority dot colors for attention items
export const priorityColors = {
  high: 'bg-amber-500',
  medium: 'bg-sky-500',
  low: 'bg-slate-400',
}
