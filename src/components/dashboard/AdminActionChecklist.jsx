// =============================================================================
// AdminActionChecklist — Full-width detailed action items with priority sorting
// Red = past due, Amber = upcoming deadline, Sky = pending
// Each item has "Handle →" button to navigate
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight, CheckCircle2 } from 'lucide-react'

/**
 * @param {Object} props
 * @param {Array} props.items - Array of { id, label, detail, count, severity, page, deadline? }
 *   severity: 'critical' | 'warning' | 'info'
 * @param {Function} props.onNavigate
 */
export default function AdminActionChecklist({ items = [], onNavigate }) {
  const { isDark } = useTheme()

  // Sort by severity: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  const sorted = [...items].sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))

  const severityDot = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-lynx-sky',
  }

  const severityLabel = {
    critical: 'Past due',
    warning: 'Needs attention',
    info: 'Pending',
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        isDark ? 'border-white/[0.06]' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <h3 className={`text-r-xl font-bold tracking-wide uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Action Items
          </h3>
          {sorted.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-r-sm font-bold">
              {sorted.length}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="px-6 py-3">
        {sorted.length === 0 ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <p className={`text-r-xl font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              All clear — the org is running smooth
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {sorted.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3.5">
                {/* Priority dot */}
                <div className={`w-3 h-3 rounded-full shrink-0 ${severityDot[item.severity] || 'bg-slate-400'}`} />

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className={`text-r-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {item.label}
                  </p>
                  {item.detail && (
                    <p className={`text-r-base ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {item.detail}
                    </p>
                  )}
                </div>

                {/* Severity tag */}
                <span className={`text-r-sm font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  item.severity === 'critical'
                    ? 'bg-red-500/10 text-red-500'
                    : item.severity === 'warning'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-lynx-sky/10 text-lynx-sky'
                }`}>
                  {severityLabel[item.severity] || 'Pending'}
                </span>

                {/* Handle button */}
                <button
                  onClick={() => onNavigate?.(item.page)}
                  className={`flex items-center gap-1 text-r-base font-semibold shrink-0 px-3 py-1.5 rounded-xl transition-colors ${
                    isDark
                      ? 'text-lynx-sky hover:bg-white/[0.06]'
                      : 'text-lynx-sky hover:bg-slate-50'
                  }`}
                >
                  Handle <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
