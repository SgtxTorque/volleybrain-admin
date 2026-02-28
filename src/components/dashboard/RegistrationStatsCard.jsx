// =============================================================================
// RegistrationStatsCard — Donut chart + legend matching v0 registration-stats.tsx
// =============================================================================

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}/${dd}/${yy}`
}

function getDaysUntilClose(closeDate) {
  if (!closeDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const close = new Date(closeDate + 'T00:00:00')
  const diff = Math.ceil((close - now) / (1000 * 60 * 60 * 24))
  return diff
}

export default function RegistrationStatsCard({ stats, season, onNavigate }) {
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

        {/* Season Status + Health Metrics */}
        {season?.status && (
          <>
            <div className={`self-stretch w-px ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-silver'}`} />
            <div className="flex flex-1 flex-col items-center gap-4 px-4">
              {/* Season name + status badge */}
              <div className="flex flex-col items-center gap-2">
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {season.name || 'Current Season'}
                </span>
                <span className={`inline-block px-5 py-2 rounded-full text-base font-black uppercase tracking-wide ${
                  season.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : season.status === 'upcoming'
                      ? 'bg-sky-500/15 text-sky-500'
                      : season.status === 'archived'
                        ? 'bg-slate-500/15 text-slate-400'
                        : 'bg-amber-500/15 text-amber-500'
                }`}>
                  {season.status}
                </span>
              </div>

              {/* Health metrics card */}
              <div className={`w-full rounded-xl p-4 ${
                isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-lynx-cloud border border-lynx-silver/50'
              }`}>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {(() => {
                    const rosterMatch = rostered === total
                    const coachMatch = (stats.teamsWithCoach || 0) === (stats.teams || 0)
                    const spots = stats.openSpots || 0
                    return (
                      <>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                            Rostered
                          </p>
                          <p className="text-lg font-black whitespace-nowrap">
                            <span className={rosterMatch ? (isDark ? 'text-white' : 'text-slate-900') : 'text-amber-500'}>{rostered}</span>
                            <span className={isDark ? 'text-white' : 'text-slate-900'}>/{total}</span>
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                            Coached
                          </p>
                          <p className="text-lg font-black whitespace-nowrap">
                            <span className={coachMatch ? (isDark ? 'text-white' : 'text-slate-900') : 'text-amber-500'}>{stats.teamsWithCoach || 0}</span>
                            <span className={isDark ? 'text-white' : 'text-slate-900'}>/{stats.teams || 0}</span>
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                            Open Spots
                          </p>
                          <p className={`text-lg font-black ${
                            spots > 0 ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-500'
                          }`}>
                            {spots}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
              <p className={`-mt-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                Team Status
              </p>
            </div>
          </>
        )}
      </div>

      {/* Registration Dates Table */}
      {season && (() => {
        const daysLeft = getDaysUntilClose(season.registration_closes)
        return (
          <div className={`grid grid-cols-3 gap-4 pt-5 mt-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="text-center">
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                Reg Open Date
              </p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatDateShort(season.registration_opens)}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                Reg Close Date
              </p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatDateShort(season.registration_closes)}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                {daysLeft != null && daysLeft > 0 ? 'Days Left' : 'Status'}
              </p>
              {daysLeft != null && daysLeft > 0 ? (
                <p className={`text-3xl font-black ${
                  daysLeft <= 7 ? 'text-red-500' : daysLeft <= 30 ? 'text-amber-500' : isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {daysLeft}
                </p>
              ) : (
                <span className="inline-block mt-1 px-4 py-1.5 rounded-full text-sm font-black bg-red-500/15 text-red-500">
                  Registration Closed
                </span>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
