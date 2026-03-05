// PlaceholderWidget — Empty card to reserve space on the dashboard grid

import { useTheme } from '../../contexts/ThemeContext'

export default function PlaceholderWidget({ label = 'Reserved Space' }) {
  const { isDark } = useTheme()

  return (
    <div className={`h-full rounded-2xl border-2 border-dashed flex items-center justify-center ${
      isDark
        ? 'border-white/[0.08] bg-white/[0.02]'
        : 'border-slate-200 bg-slate-50/50'
    }`}>
      <span className={`text-xs font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  )
}
