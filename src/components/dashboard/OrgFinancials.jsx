// =============================================================================
// OrgFinancials — Horizontal bar graph, category breakdown, dual action buttons
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { DollarSign, AlertCircle, ChevronRight } from 'lucide-react'

export default function OrgFinancials({ stats = {}, onNavigate }) {
  const { isDark } = useTheme()

  const collected = stats.totalCollected || 0
  const expected = stats.totalExpected || 0
  const outstanding = Math.max(0, expected - collected)
  const total = collected + outstanding
  const collectedPct = total > 0 ? (collected / total) * 100 : 50
  const overdueCount = stats.pastDue > 0 ? Math.ceil(stats.pastDue / 100) : 0

  // Category breakdown from stats
  const categories = [
    { label: 'Registration', collected: stats.regCollected || 0, total: stats.regTotal || 0 },
    { label: 'Uniforms', collected: stats.uniformCollected || 0, total: stats.uniformTotal || 0 },
    { label: 'Monthly', collected: stats.monthlyCollected || 0, total: stats.monthlyTotal || 0 },
    { label: 'Other', collected: stats.otherCollected || 0, total: stats.otherTotal || 0 },
  ].filter(c => c.total > 0)

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4 h-full flex flex-col`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <DollarSign className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Financials
        </h3>
      </div>

      {/* Dollar amounts above the bar */}
      <div className="flex items-end justify-between mb-1">
        <div>
          <p className="text-xl font-extrabold text-green-500 tabular-nums">${collected.toLocaleString()}</p>
          <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Collected</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-red-500 tabular-nums">${outstanding.toLocaleString()}</p>
          <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Outstanding</p>
        </div>
      </div>

      {/* Horizontal stacked bar */}
      <div className="w-full h-7 rounded-lg overflow-hidden flex mb-3">
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${collectedPct}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${100 - collectedPct}%` }}
        />
      </div>

      {/* Category breakdown — label on top, big collected amount below */}
      {categories.length > 0 && (
        <>
          <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} my-3`} />
          <div className={`grid gap-3 mb-3`} style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)` }}>
            {categories.map(cat => (
              <div key={cat.label} className="text-center">
                <p className={`text-[10px] font-bold uppercase tracking-[1px] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {cat.label}
                </p>
                <p className={`text-lg font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                  ${cat.collected.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dual action buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        {overdueCount > 0 ? (
          <button
            onClick={() => onNavigate?.('blasts')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-lynx-sky text-white text-xs font-semibold hover:brightness-110 transition"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Reminders ({overdueCount})
          </button>
        ) : (
          <div className="py-2 rounded-xl bg-green-500/10 text-green-500 text-xs font-semibold text-center">
            All Paid
          </div>
        )}
        <button
          onClick={() => onNavigate?.('payments')}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-lynx-navy text-white text-xs font-semibold hover:brightness-125 transition"
        >
          Payments <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
