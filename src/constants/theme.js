// Accent color options for user customization
// Each accent now includes a navBar gradient for the horizontal navigation
export const accentColors = {
  orange: { 
    primary: '#F97316', 
    light: '#FFEDD5', 
    lighter: '#FFF7ED', 
    dark: '#C2410C',
    navBar: 'linear-gradient(135deg, #2C3E50 0%, #1a252f 100%)',
    navBarSolid: '#2C3E50',
  },
  blue: { 
    primary: '#0EA5E9', 
    light: '#E0F2FE', 
    lighter: '#F0F9FF', 
    dark: '#0369A1',
    navBar: 'linear-gradient(135deg, #1E3A5F 0%, #0C4A6E 100%)',
    navBarSolid: '#1E3A5F',
  },
  purple: { 
    primary: '#8B5CF6', 
    light: '#EDE9FE', 
    lighter: '#F5F3FF', 
    dark: '#6D28D9',
    navBar: 'linear-gradient(135deg, #2E1065 0%, #1E1B4B 100%)',
    navBarSolid: '#2E1065',
  },
  green: { 
    primary: '#10B981', 
    light: '#D1FAE5', 
    lighter: '#ECFDF5', 
    dark: '#047857',
    navBar: 'linear-gradient(135deg, #134E4A 0%, #0F172A 100%)',
    navBarSolid: '#134E4A',
  },
  rose: { 
    primary: '#F43F5E', 
    light: '#FFE4E6', 
    lighter: '#FFF1F2', 
    dark: '#BE123C',
    navBar: 'linear-gradient(135deg, #4C1D30 0%, #1F1020 100%)',
    navBarSolid: '#4C1D30',
  },
  slate: { 
    primary: '#64748B', 
    light: '#F1F5F9', 
    lighter: '#F8FAFC', 
    dark: '#475569',
    navBar: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
    navBarSolid: '#334155',
  },
}

// Theme color definitions
// Light mode uses Apple-inspired warm off-white (#F5F5F7) for floating card effect
export const themes = {
  dark: {
    name: 'dark',
    bg: 'bg-slate-900',
    bgSecondary: 'bg-slate-800',
    bgTertiary: 'bg-slate-900',
    bgHover: 'hover:bg-slate-700',
    border: 'border-slate-700',
    text: 'text-white',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    colors: {
      bg: '#0F172A',
      bgSecondary: '#1E293B',
      bgTertiary: '#0F172A',
      card: '#1E293B',
      cardAlt: '#0F172A',
      border: '#334155',
      text: '#ffffff',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
    }
  },
  light: {
    name: 'light',
    // Apple-inspired warm off-white background - makes cards float
    bg: 'bg-[#F5F5F7]',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-slate-100',
    bgHover: 'hover:bg-slate-50',
    border: 'border-slate-200/60',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-500',
    colors: {
      bg: '#F5F5F7',
      bgSecondary: '#FFFFFF',
      bgTertiary: '#F1F5F9',
      card: '#FFFFFF',
      cardAlt: '#F1F5F9',
      border: '#E2E8F0',
      text: '#1D1D1F',
      textSecondary: '#515154',
      textMuted: '#86868B',
    }
  }
}

// Color picker options for UI
export const colorPickerOptions = [
  { id: 'orange', color: '#F97316', label: 'Orange' },
  { id: 'blue', color: '#0EA5E9', label: 'Blue' },
  { id: 'purple', color: '#8B5CF6', label: 'Purple' },
  { id: 'green', color: '#10B981', label: 'Green' },
  { id: 'rose', color: '#F43F5E', label: 'Rose' },
  { id: 'slate', color: '#64748B', label: 'Slate' },
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
