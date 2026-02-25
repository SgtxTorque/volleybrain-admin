import { useThemeClasses, useTheme } from '../../contexts/ThemeContext'

// ============================================
// EMPTY STATE — Reusable empty/no-data component
// ============================================
export function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  compact = false
}) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  return (
    <div className={`text-center ${compact ? 'py-8' : 'py-16'}`}>
      {Icon && (
        <div className={`mx-auto mb-4 ${compact ? 'w-12 h-12' : 'w-20 h-20'} rounded-2xl flex items-center justify-center ${
          isDark ? 'bg-slate-800/60' : 'bg-slate-100'
        }`}>
          <Icon className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
        </div>
      )}
      <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold ${tc.text}`}>{title}</h3>
      {description && (
        <p className={`text-sm ${tc.textMuted} mt-1 max-w-sm mx-auto`}>{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:brightness-110 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
