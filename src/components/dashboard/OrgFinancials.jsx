// =============================================================================
// OrgFinancials — 4 financial stat tiles + Send reminders CTA
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { DollarSign, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react'

function FinTile({ label, value, sub, color, isDark }) {
  return (
    <div className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
      <p className="text-r-2xl font-black tabular-nums" style={{ color }}>{value}</p>
      <p className={`text-r-lg font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      {sub && <p className={`text-r-lg mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>{sub}</p>}
    </div>
  )
}

export default function OrgFinancials({ stats = {}, onNavigate }) {
  const { isDark } = useTheme()

  const collected = stats.totalCollected || 0
  const expected = stats.totalExpected || 0
  const outstanding = Math.max(0, expected - collected)
  const paidOnline = stats.paidOnline || 0
  const paidManual = stats.paidManual || 0
  const overdueCount = stats.pastDue > 0 ? Math.ceil(stats.pastDue / 100) : 0

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <DollarSign className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-r-lg font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Financials
          </h3>
        </div>
        <button
          onClick={() => onNavigate?.('payments')}
          className="text-r-base text-lynx-sky font-medium flex items-center gap-1"
        >
          Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <FinTile
          label="Collected"
          value={`$${collected.toLocaleString()}`}
          color="#22C55E"
          isDark={isDark}
        />
        <FinTile
          label="Outstanding"
          value={`$${outstanding.toLocaleString()}`}
          color={outstanding > 0 ? '#F59E0B' : '#22C55E'}
          isDark={isDark}
        />
        <FinTile
          label="Online"
          value={`$${paidOnline.toLocaleString()}`}
          color="#4BB9EC"
          isDark={isDark}
        />
        <FinTile
          label="Manual"
          value={`$${paidManual.toLocaleString()}`}
          color="#8B5CF6"
          isDark={isDark}
        />
      </div>

      {overdueCount > 0 && (
        <button
          onClick={() => onNavigate?.('blasts')}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-lynx-sky text-white text-r-lg font-semibold hover:brightness-110 transition"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Send Reminders ({overdueCount})
        </button>
      )}
    </div>
  )
}
