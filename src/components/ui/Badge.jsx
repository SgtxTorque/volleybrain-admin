import { useTheme } from '../../contexts/ThemeContext'

export function Badge({ children, variant = 'default' }) {
  const { isDark, accent } = useTheme()
  
  const variants = {
    default: isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600',
    accent: '',
    success: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    warning: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600',
    error: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600',
    info: isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-600',
  }
  
  return (
    <span 
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}
      style={variant === 'accent' ? { 
        backgroundColor: `${accent?.primary}20`, 
        color: accent?.primary 
      } : undefined}
    >
      {children}
    </span>
  )
}
