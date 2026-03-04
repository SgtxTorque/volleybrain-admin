// =============================================================================
// TopPlayersCard — 5-player leaderboard with rank, avatar, stats
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Trophy, ChevronRight } from 'lucide-react'

export default function TopPlayersCard({ topPlayers = [], onNavigate, onPlayerSelect }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Trophy className={`w-3.5 h-3.5 text-amber-500`} />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Top Players
          </h3>
        </div>
        <button onClick={() => onNavigate?.('leaderboards')} className="text-xs text-lynx-sky font-medium flex items-center gap-1">
          Leaderboard <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {topPlayers.length === 0 ? (
        <p className={`text-sm text-center py-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No stats yet</p>
      ) : (
        <div className="space-y-1.5">
          {topPlayers.slice(0, 5).map((entry, idx) => {
            const player = entry.player || entry
            const rankColors = ['text-amber-500', 'text-slate-300', 'text-amber-700']
            return (
              <button
                key={player?.id || idx}
                onClick={() => onPlayerSelect?.(player)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
              >
                <span className={`w-5 text-xs font-black text-center ${rankColors[idx] || (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                  {idx + 1}
                </span>
                {player?.photo_url ? (
                  <img src={player.photo_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {(player?.first_name || '?').charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {player?.first_name} {(player?.last_name || '').charAt(0)}.
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {player?.position || 'Player'}
                  </p>
                </div>
                <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-lynx-sky' : 'text-lynx-deep'}`}>
                  {entry.total_points || entry.kills || 0} pts
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
