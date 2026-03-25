import { useTheme } from '../../contexts/ThemeContext'

export default function PageShell({ breadcrumb, title, subtitle, actions, children, className = '' }) {
  const { isDark } = useTheme()

  return (
    <div className={`w-full pl-5 pr-8 py-6 ${className}`} style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${
          isDark ? 'text-lynx-sky/70' : 'text-lynx-sky'
        }`}>
          <span>🏠</span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>›</span>
          {breadcrumb}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-[#10284C]'
          }`} style={{ letterSpacing: '-0.03em' }}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 items-center shrink-0">{actions}</div>
        )}
      </div>

      {children}
    </div>
  )
}
