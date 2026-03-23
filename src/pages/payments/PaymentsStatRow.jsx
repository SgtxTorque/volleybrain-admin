// =============================================================================
// PaymentsStatRow — 4 stat cards: Collected, Outstanding, Families Overdue, Rate
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { DollarSign, AlertCircle, Users, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-[14px] p-5 transition-all duration-200 ${
      isDark ? 'bg-[#132240] border border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border border-[#E8ECF2] hover:shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]'
    }`} style={{ fontFamily: 'var(--v2-font)' }}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/[0.06]' : ''}`}
          style={{ backgroundColor: isDark ? undefined : `${iconColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-extrabold tabular-nums leading-none ${valueColor || (isDark ? 'text-white' : 'text-[#10284C]')}`}
            style={{ letterSpacing: '-0.03em' }}>
            {value}
          </p>
          <p className={`text-[10.5px] font-bold uppercase tracking-[0.08em] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {label}
          </p>
          {(sub || pill) && (
            <div className="flex items-center gap-2 mt-1.5">
              {sub && (
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{sub}</span>
              )}
              {pill && (
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${pill.className}`}>
                  {pill.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentsStatRow({ totalCollected = 0, totalOwed = 0, uniqueFamilies = 0, collectionRate = 0, overdueFamilyCount = 0, totalBilled = 0 }) {
  const ratePill = collectionRate >= 80
    ? { label: 'Healthy', className: 'bg-emerald-500/12 text-emerald-500' }
    : collectionRate >= 50
      ? { label: 'Needs follow-up', className: 'bg-amber-500/12 text-amber-500' }
      : { label: 'Critical', className: 'bg-red-500/12 text-red-500' }

  const rateColor = collectionRate >= 80 ? 'text-emerald-500' : collectionRate >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={DollarSign}
        label="Total Collected"
        value={`$${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        sub={totalBilled > 0 ? `of $${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} billed` : null}
        valueColor="text-emerald-500"
        iconColor="#22C55E"
      />
      <StatCard
        icon={AlertCircle}
        label="Outstanding"
        value={`$${totalOwed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        pill={overdueFamilyCount > 0 ? { label: `${overdueFamilyCount} overdue`, className: 'bg-red-500/12 text-red-500' } : null}
        valueColor="text-red-500"
        iconColor="#EF4444"
      />
      <StatCard
        icon={Users}
        label="Families"
        value={uniqueFamilies}
        sub={overdueFamilyCount > 0 ? `${overdueFamilyCount} with balance` : 'All current'}
        iconColor="#8B5CF6"
      />
      <StatCard
        icon={TrendingUp}
        label="Collection Rate"
        value={`${collectionRate}%`}
        valueColor={rateColor}
        pill={ratePill}
        iconColor={collectionRate >= 80 ? '#22C55E' : collectionRate >= 50 ? '#F59E0B' : '#EF4444'}
      />
    </div>
  )
}
