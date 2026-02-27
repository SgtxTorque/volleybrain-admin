// =============================================================================
// PaymentSummaryCard — Collected/total + progress bar matching v0 payment-summary.tsx
// =============================================================================

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function PaymentSummaryCard({ stats, recentPayments, onNavigate }) {
  const { isDark, accent } = useTheme()

  const totalCollected = stats.totalCollected || 0
  const totalExpected = stats.totalExpected || totalCollected || 0
  const pastDue = stats.pastDue || 0
  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <div className={`flex flex-col gap-5 rounded-xl p-6 shadow-sm ${
      isDark ? 'bg-slate-800 border border-white/[0.06]' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Payment Summary
        </h3>
        <button
          onClick={() => onNavigate('payments')}
          className="flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: isDark ? '#5eead4' : '#0d9488' }}
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ${totalCollected.toLocaleString()}
          </span>
          <span className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            / ${totalExpected.toLocaleString()}
          </span>
        </div>

        <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, collectionPct)}%`, backgroundColor: accent.primary || '#0d9488' }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{collectionPct}% collected</span>
          {pastDue > 0 && (
            <span className="text-xs font-semibold text-red-500">${pastDue.toLocaleString()} overdue</span>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      {recentPayments && recentPayments.length > 0 && (
        <div className="flex flex-col gap-0">
          <span className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Recent
          </span>
          {recentPayments.slice(0, 3).map((payment, i) => (
            <div
              key={i}
              className={`flex items-center justify-between border-t py-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}
            >
              <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{payment.name}</span>
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
