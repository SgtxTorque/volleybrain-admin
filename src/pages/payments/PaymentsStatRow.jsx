// =============================================================================
// PaymentsStatRow — 4 stat cards: Collected, Outstanding, Families Overdue, Rate
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { DollarSign, AlertCircle, Users, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-[14px] p-5 ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-4xl font-extrabold tabular-nums leading-none ${valueColor || (isDark ? 'text-white' : 'text-slate-900')}`}>
            {value}
          </p>
          <p className={`text-sm font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
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
