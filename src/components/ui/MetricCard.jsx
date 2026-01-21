import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

// Enhanced Metric Card with status indicators
export function MetricCard({ label, value, sublabel, icon, status = 'neutral', onClick }) {
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  
  const statusConfig = {
    success: { 
      indicator: 'bg-emerald-500', 
      iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50', 
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600', 
      sublabelColor: isDark ? 'text-emerald-400' : 'text-emerald-600' 
    },
    warning: { 
      indicator: 'bg-amber-500', 
      iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-50', 
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600', 
      sublabelColor: isDark ? 'text-amber-400' : 'text-amber-600' 
    },
    neutral: { 
      indicator: 'bg-transparent', 
      iconBg: isDark ? 'bg-slate-700' : 'bg-slate-100', 
      iconColor: tc.textMuted, 
      sublabelColor: tc.textMuted 
    },
    accent: { 
      indicator: '', 
      iconBg: '', 
      iconColor: '', 
      sublabelColor: '' 
    },
  }
  
  const config = statusConfig[status]

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 ${tc.card} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''}`}
    >
      <div 
        className={`absolute top-0 left-0 right-0 h-1 ${config.indicator}`} 
        style={{ backgroundColor: status === 'accent' ? accent?.primary : undefined }} 
      />
      <div className="flex justify-between items-start pt-2">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${tc.textMuted}`}>{label}</p>
          <p className={`text-4xl font-bold ${tc.text} tracking-tight`}>{value}</p>
          {sublabel && (
            <p 
              className={`text-sm font-medium mt-1 ${config.sublabelColor}`} 
              style={{ color: status === 'accent' ? accent?.primary : undefined }}
            >
              {sublabel}
            </p>
          )}
        </div>
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.iconBg}`} 
          style={{ backgroundColor: status === 'accent' ? `${accent?.primary}20` : undefined }}
        >
          <span 
            className={`text-xl ${config.iconColor}`} 
            style={{ color: status === 'accent' ? accent?.primary : undefined }}
          >
            {icon}
          </span>
        </div>
      </div>
      {onClick && (
        <div 
          className={`mt-4 pt-4 border-t ${tc.border} flex items-center gap-1 text-sm font-medium`} 
          style={{ color: accent?.primary }}
        >
          View details <span className="text-xs">→</span>
        </div>
      )}
    </div>
  )
}
