import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

// ============================================
// TRENDS TAB - Timeline, Sources, Payment breakdown, Season comparison
// ============================================
export default function TrendsTab({ metrics, hasFunnelTable, seasons, selectedSeasonId, organization }) {
  const { isDark } = useTheme()
  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className="space-y-6">
      {/* Registrations Over Time */}
      <div className={`${cardCls} rounded-[14px] p-6`}>
        <h2 className={`text-r-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>REGISTRATIONS OVER TIME</h2>
        <p className="text-r-xs mb-5 text-slate-400">Weekly registration volume</p>

        {metrics.timeline.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p className="mt-3 text-r-sm text-slate-400">No timeline data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              const maxCount = Math.max(...metrics.timeline.map(t => t.count), 1)
              return metrics.timeline.map((t, i) => {
                const pct = (t.count / maxCount) * 100
                const d = new Date(t.date)
                return (
                  <div key={t.date} className="flex items-center gap-3">
                    <span className="text-[11px] tabular-nums w-20 text-right flex-shrink-0 text-slate-400">
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className={`flex-1 h-6 rounded-md overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                      <div className="h-full rounded-md fnl-bar bg-lynx-navy" style={{ '--target-w': `${Math.max(pct, 3)}%`, width: `${Math.max(pct, 3)}%`, animationDelay: `${i * .03}s` }} />
                    </div>
                    <span className={`text-r-xs font-bold tabular-nums w-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.count}</span>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* Source Breakdown + Payment Rate side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Breakdown */}
        <div className={`${cardCls} rounded-[14px] p-6`}>
          <h2 className={`text-r-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>TRAFFIC SOURCES</h2>
          <p className="text-r-xs mb-5 text-slate-400">Where registrants come from</p>

          {!hasFunnelTable || Object.keys(metrics.sources).length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <p className="mt-3 text-r-sm text-slate-400">
                {hasFunnelTable ? 'No source data yet. Traffic sources will appear as registrations come in.' : 'Enable funnel tracking to see traffic sources'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const entries = Object.entries(metrics.sources).sort((a, b) => b[1] - a[1])
                const total = entries.reduce((s, [, v]) => s + v, 0)
                const sourceColors = { direct: '#6366f1', directory: '#10b981', invite_link: '#f59e0b', qr_code: '#06b6d4' }
                return entries.map(([source, count]) => {
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-r-sm font-bold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{source.replace(/_/g, ' ')}</span>
                        <span className="text-r-xs font-bold" style={{ color: sourceColors[source] || '#4BB9EC' }}>{count} ({pct}%)</span>
                      </div>
                      <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                        <div className="h-full rounded-full fnl-bar" style={{ '--target-w': `${pct}%`, width: `${pct}%`, background: sourceColors[source] || '#4BB9EC' }} />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>

        {/* Payment Completion Breakdown */}
        <div className={`${cardCls} rounded-[14px] p-6`}>
          <h2 className={`text-r-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>PAYMENT STATUS</h2>
          <p className="text-r-xs mb-5 text-slate-400">Breakdown of payment completion</p>

          {metrics.totalRegistrations === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <p className="mt-3 text-r-sm text-slate-400">No registration data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Fully Paid', count: metrics.paid, color: '#06b6d4' },
                { label: 'Partially Paid', count: metrics.partialPaid, color: '#8b5cf6' },
                { label: 'Approved, Unpaid', count: metrics.pipeline.filter(r => r.pipe_status === 'unpaid').length, color: '#ef4444' },
                { label: 'Pending Approval', count: metrics.pending, color: '#f59e0b' },
              ].filter(s => s.count > 0).map(s => {
                const pct = Math.round((s.count / metrics.totalRegistrations) * 100)
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-r-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.label}</span>
                      <span className="text-r-xs font-bold" style={{ color: s.color }}>{s.count} ({pct}%)</span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                      <div className="h-full rounded-full fnl-bar" style={{ '--target-w': `${pct}%`, width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Season Comparison */}
      {seasons.length > 1 && (
        <div className={`${cardCls} rounded-[14px] p-6`}>
          <h2 className={`text-r-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>SEASON COMPARISON</h2>
          <p className="text-r-xs mb-5 text-slate-400">Registration counts across seasons (selected season highlighted)</p>

          <SeasonComparisonChart
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            orgId={organization?.id}
            isDark={isDark}
          />
        </div>
      )}
    </div>
  )
}

// ============================================
// SEASON COMPARISON SUB-COMPONENT
// ============================================
function SeasonComparisonChart({ seasons, selectedSeasonId, orgId, isDark }) {
  const [seasonCounts, setSeasonCounts] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadCounts()
  }, [orgId])

  async function loadCounts() {
    const counts = {}
    for (const s of seasons.slice(0, 6)) {
      const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('season_id', s.id)
      counts[s.id] = count || 0
    }
    setSeasonCounts(counts)
    setLoaded(true)
  }

  if (!loaded) return (
    <div className="py-6 text-center">
      <div className="w-6 h-6 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  const maxCount = Math.max(...Object.values(seasonCounts), 1)

  return (
    <div className="space-y-2">
      {seasons.slice(0, 6).map(s => {
        const count = seasonCounts[s.id] || 0
        const pct = (count / maxCount) * 100
        const isSelected = s.id === selectedSeasonId
        return (
          <div key={s.id} className="flex items-center gap-3">
            <span className={`text-[11px] w-32 text-right flex-shrink-0 truncate ${isSelected ? 'font-bold text-lynx-sky' : 'text-slate-400'}`}>{s.name}</span>
            <div className={`flex-1 h-6 rounded-md overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
              <div className="h-full rounded-md fnl-bar" style={{ '--target-w': `${Math.max(pct, 3)}%`, width: `${Math.max(pct, 3)}%`, background: isSelected ? '#4BB9EC' : isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)' }} />
            </div>
            <span className={`text-r-xs font-bold tabular-nums w-8 ${isSelected ? 'text-lynx-sky' : isDark ? 'text-white' : 'text-slate-900'}`}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}
