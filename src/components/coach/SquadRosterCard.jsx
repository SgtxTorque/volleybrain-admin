// =============================================================================
// SquadRosterCard — Overhauled: larger player cards, rounded portrait photos,
// jersey number, position badge, overall rating, top per-game stats
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, ChevronRight } from 'lucide-react'

export default function SquadRosterCard({ roster = [], selectedTeam, onNavigate, onPlayerSelect }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4 max-h-card-tall overflow-y-auto`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Users className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-r-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Squad ({roster.length})
          </h3>
        </div>
        <button onClick={() => onNavigate?.('teams')} className="text-r-sm text-lynx-sky font-semibold flex items-center gap-1 hover:brightness-110">
          Full Roster <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {roster.length === 0 ? (
        <p className={`text-r-base text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          No players on roster yet. Time to build the squad! 🏐
        </p>
      ) : (
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {roster.map(player => {
            const initials = `${(player.first_name || '?').charAt(0)}${(player.last_name || '').charAt(0)}`
            const rating = player.overall_rating || player.rating
            const stats = player.top_stats || []

            return (
              <button
                key={player.id}
                onClick={() => onPlayerSelect?.(player)}
                className={`flex items-center gap-3 p-2.5 rounded-xl w-full text-left transition-colors ${
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                }`}
              >
                {/* Portrait photo — rounded, NOT circle */}
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-r-base font-bold shrink-0 ${
                    isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {initials}
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={`text-r-base font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {player.jersey_number ? <span className="text-lynx-sky font-bold">#{player.jersey_number}</span> : null}
                    {player.jersey_number ? ' ' : ''}{player.first_name} {(player.last_name || '').charAt(0)}.
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {player.position && (
                      <span className={`text-r-xs font-bold px-2 py-0.5 rounded-md ${
                        isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {player.position}
                      </span>
                    )}
                    {stats.length > 0 && stats.slice(0, 3).map((s, i) => (
                      <span key={i} className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {s.label}: {s.value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Overall rating */}
                {rating != null && rating > 0 && (
                  <div className={`flex flex-col items-center shrink-0 min-w-[36px]`}>
                    <span className={`text-r-lg font-black tabular-nums ${
                      rating >= 8 ? 'text-emerald-400' : rating >= 5 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {typeof rating === 'number' ? rating.toFixed(1) : rating}
                    </span>
                    <span className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>OVR</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
