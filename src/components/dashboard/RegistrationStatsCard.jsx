// =============================================================================
// RegistrationStatsCard — Donut chart + legend matching v0 registration-stats.tsx
// =============================================================================

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function RegistrationStatsCard({ stats, onNavigate }) {
  const { isDark } = useTheme()

  const rostered = stats.rostered || 0
  const pending = stats.pending || 0
  const waitlisted = stats.waitlisted || 0
  const denied = stats.denied || 0
  const total = stats.totalRegistrations || 0

  const statItems = [
    { label: 'Rostered', count: rostered, color: isDark ? '#5eead4' : '#0d9488' },
    { label: 'Pending', count: pending, color: '#f59e0b' },
    { label: 'Waitlisted', count: waitlisted, color: '#22c55e' },
    { label: 'Denied', count: denied, color: '#ef4444' },
  ]

  // Donut chart calculations
  const circumference = 2 * Math.PI * 50 // r=50, C = 314.16
  const safeTotal = total || 1

  // Calculate segment offsets
  let offset = 0
  const segments = statItems
    .filter(s => s.count > 0)
    .map(s => {
      const seg = {
        dasharray: `${(s.count / safeTotal) * circumference} ${circumference}`,
        dashoffset: -offset,
        color: s.color,
      }
      offset += (s.count / safeTotal) * circumference
      return seg
    })

  return (
    <div className={`flex flex-col gap-5 rounded-xl p-6 shadow-sm overflow-hidden ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
          Registration Stats
        </h3>
        <button
          onClick={() => onNavigate('registrations')}
          className="flex items-center gap-1 text-lg font-medium transition-colors"
          style={{ color: isDark ? '#5eead4' : '#0d9488' }}
        >
          View All
          <ArrowRight className="h-5.5 w-5.5" />
        </button>
      </div>

      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke={isDark ? '#334155' : '#f1f5f9'}
              strokeWidth="12"
            />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="60" cy="60" r="50"
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={seg.dasharray}
                strokeDashoffset={seg.dashoffset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{total}</span>
            <span className={`text-md font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {statItems.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: stat.color }} />
              <span className={`text-lg ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{stat.label}</span>
              <span className={`ml-auto text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
