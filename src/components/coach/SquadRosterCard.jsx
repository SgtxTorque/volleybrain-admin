// =============================================================================
// SquadRosterCard — Player photos + jersey + position in 2-column grid
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, ChevronRight } from 'lucide-react'

export default function SquadRosterCard({ roster = [], selectedTeam, onNavigate, onPlayerSelect }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Users className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Squad ({roster.length})
          </h3>
        </div>
        <button onClick={() => onNavigate?.('teams')} className="text-xs text-lynx-sky font-medium flex items-center gap-1">
          Full Roster <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {roster.length === 0 ? (
        <p className={`text-sm text-center py-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No players on roster</p>
      ) : (
        <div className="space-y-0.5 max-h-[600px] overflow-y-auto">
          {roster.map(player => (
            <button
              key={player.id}
              onClick={() => onPlayerSelect?.(player)}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
              }`}
            >
              {player.photo_url ? (
                <img src={player.photo_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {player.jersey_number ? `#${player.jersey_number} ` : ''}{player.first_name} {(player.last_name || '').charAt(0)}.
                </p>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {player.position || 'Player'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
