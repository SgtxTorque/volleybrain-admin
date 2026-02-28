// =============================================================================
// PaymentSummaryCard — Collected/total + progress bar matching v0 payment-summary.tsx
// =============================================================================

import React from 'react'
import { ArrowRight, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function PaymentSummaryCard({ stats, recentPayments, onNavigate }) {
  const { isDark, accent } = useTheme()

  const totalCollected = stats.totalCollected || 0
  const totalExpected = stats.totalExpected || totalCollected || 0
  const pastDue = stats.pastDue || 0
  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <div className={`flex flex-col gap-5 rounded-xl p-6 shadow-sm overflow-hidden ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
          Payment Summary
        </h3>
        <button
          onClick={() => onNavigate('payments')}
          className="flex items-center gap-1 text-lg font-medium transition-colors"
          style={{ color: isDark ? '#5eead4' : '#0d9488' }}
        >
          View All
          <ArrowRight className="h-5.5 w-5.5" />
        </button>
      </div>

      <div>
        {/* Amounts + pie chart row */}
        <div className="flex items-center gap-5">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold ${
              collectionPct <= 25 ? 'text-red-500'
              : collectionPct <= 50 ? 'text-amber-500'
              : collectionPct <= 75 ? 'text-blue-500'
              : 'text-emerald-500'
            }`}>
              ${totalCollected.toLocaleString()}
            </span>
            <span className={`text-3xl font-bold ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              / ${totalExpected.toLocaleString()}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 ml-auto">
            <span className="text-3xl font-bold text-red-500">
              ${pastDue.toLocaleString()}
            </span>
            <span className={`text-3xl font-bold ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              overdue
            </span>
          </div>
        </div>

        {/* Stacked bar: collected + overdue + remaining */}
        {(() => {
          const collectedW = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0
          const overdueW = totalExpected > 0 ? (pastDue / totalExpected) * 100 : 0
          return (
            <>
              <div className={`mt-4 flex h-3 w-full overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                {collectedW > 0 && (
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${collectedW}%` }} />
                )}
                {overdueW > 0 && (
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${overdueW}%` }} />
                )}
              </div>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{Math.round(collectedW)}% collected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{Math.round(overdueW)}% overdue</span>
                </div>
              </div>
            </>
          )
        })()}
      </div>

      {/* Sources + Recent */}
      <div className="flex items-stretch gap-0">
        {/* Payment Sources */}
        <div className="flex flex-1 flex-col gap-0 pr-8">
          <span className={`mb-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
            Sources
          </span>
          {[
            { icon: CreditCard, label: 'Stripe', amount: stats.paidBySource?.stripe || 0, color: isDark ? 'text-sky-400' : 'text-sky-600' },
            { icon: Smartphone, label: 'Zelle', amount: stats.paidBySource?.zelle || 0, color: isDark ? 'text-purple-400' : 'text-purple-600' },
            { icon: Wallet, label: 'CashApp', amount: stats.paidBySource?.cashapp || 0, color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
            { icon: Smartphone, label: 'Venmo', amount: stats.paidBySource?.venmo || 0, color: isDark ? 'text-blue-400' : 'text-blue-600' },
            { icon: Banknote, label: 'Cash/Check', amount: stats.paidBySource?.cash_check || 0, color: isDark ? 'text-amber-400' : 'text-amber-600' },
          ].map((source) => {
            const Icon = source.icon
            return (
              <div
                key={source.label}
                className={`flex items-center gap-3 border-t py-2.5 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}
              >
                <Icon className={`h-4 w-4 ${source.color}`} />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{source.label}</span>
                <span className={`ml-auto text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ${source.amount.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div className={`w-px ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-silver'}`} />

        {/* Recent Payments */}
        <div className="flex flex-1 flex-col gap-0 pl-8">
          <span className={`mb-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
            Recent
          </span>
          {recentPayments && recentPayments.length > 0 ? (
            recentPayments.slice(0, 5).map((payment, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 items-center py-2.5 px-2 rounded-lg ${
                  i % 2 === 0
                    ? isDark ? 'bg-white/[0.03]' : 'bg-lynx-cloud/60'
                    : ''
                }`}
              >
                <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{payment.name}</span>
                <span className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{payment.date}</span>
                <span className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{payment.lineItem}</span>
                <span className={`text-sm font-semibold text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment.amount}</span>
              </div>
            ))
          ) : (
            <div className={`border-t py-2.5 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
              <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>No recent payments</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
