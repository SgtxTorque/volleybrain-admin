// =============================================================================
// GameDayStats — QuickStatsPanel + StatPickerModal
// =============================================================================

import { positionColors } from './CourtPlayerCard'
import { Icons, STAT_ACTIONS } from './GameDayHelpers'

// ═══ QUICK STATS PANEL ═══
export function QuickStatsPanel({ stats, roster, theme }) {
  const teamTotals = Object.values(stats).reduce((acc, ps) => {
    Object.entries(ps || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + (v || 0) })
    return acc
  }, {})

  const getLeader = (statKey) => {
    let leader = null, maxVal = 0
    Object.entries(stats).forEach(([pid, ps]) => {
      if ((ps?.[statKey] || 0) > maxVal) { maxVal = ps[statKey]; leader = roster.find(p => p.id === pid) }
    })
    return leader ? { player: leader, value: maxVal } : null
  }

  const killLeader = getLeader('kills')
  const digLeader = getLeader('digs')

  const statBoxes = [
    { key: 'kills', label: 'Kills', color: 'text-red-400' },
    { key: 'aces', label: 'Aces', color: 'text-emerald-400' },
    { key: 'blocks', label: 'Blocks', color: 'text-indigo-400' },
    { key: 'digs', label: 'Digs', color: 'text-amber-400' },
  ]

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
      <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.textMuted }}>
        <Icons.BarChart className="w-4 h-4" /> Live Stats
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {statBoxes.map(s => (
          <div key={s.key} className="text-center p-4 rounded-xl" style={{ backgroundColor: theme.statsBg }}>
            <p className={`text-4xl font-black ${s.color}`}>{teamTotals[s.key] || 0}</p>
            <p className="text-base uppercase" style={{ color: theme.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {(killLeader || digLeader) && (
        <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <p className="text-base uppercase" style={{ color: theme.textMuted }}>Hot Players</p>
          {killLeader && killLeader.value > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
              <Icons.Flame className="w-4 h-4 text-red-400" />
              <span className="text-xl font-medium" style={{ color: theme.textPrimary }}>{killLeader.player.first_name} {killLeader.player.last_name?.[0]}.</span>
              <span className="text-red-400 font-bold ml-auto">{killLeader.value} K</span>
            </div>
          )}
          {digLeader && digLeader.value > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg">
              <Icons.Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-medium" style={{ color: theme.textPrimary }}>{digLeader.player.first_name} {digLeader.player.last_name?.[0]}.</span>
              <span className="text-amber-400 font-bold ml-auto">{digLeader.value} D</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ STAT PICKER MODAL ═══
export function StatPickerModal({ player, onSelect, onClose, theme }) {
  if (!player) return null
  const posColor = positionColors[player?.position || player?.team_position] || '#6366F1'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-5" onClick={onClose}>
      <div className="rounded-3xl p-7 max-w-sm w-full shadow-2xl"
        style={{ backgroundColor: theme.modalBg, border: `1px solid ${theme.border}`, boxShadow: `0 0 60px ${posColor}30` }}
        onClick={(e) => e.stopPropagation()}>
        {/* Player header */}
        <div className="flex items-center gap-4 mb-6">
          {player.photo_url ? (
            <img src={player.photo_url} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-4xl" style={{ backgroundColor: posColor }}>
              #{player.jersey_number}
            </div>
          )}
          <div>
            <p className="text-amber-400 font-bold text-xl">{player.first_name}</p>
            <p className="font-black text-4xl" style={{ color: theme.textPrimary }}>{player.last_name?.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-xl transition" style={{ backgroundColor: theme.buttonBg }}>
            <Icons.X className="w-5 h-5" style={{ color: theme.textMuted }} />
          </button>
        </div>

        {/* Stat buttons */}
        <div className="grid grid-cols-3 gap-4">
          {STAT_ACTIONS.map(stat => (
            <button key={stat.key} onClick={() => onSelect(player.id, stat.key)}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl transition-all min-h-[80px] hover:scale-105 active:scale-95"
              style={{ backgroundColor: `${stat.color}15`, border: `2px solid ${stat.color}30`, boxShadow: `0 0 20px ${stat.color}10` }}>
              <span className="text-4xl">{stat.icon}</span>
              <span className="text-xl font-bold" style={{ color: stat.color }}>{stat.label}</span>
              {stat.points !== 0 && (
                <span className={`text-lg ${stat.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.points > 0 ? '+' : ''}{stat.points} pt
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-center text-lg mt-4" style={{ color: theme.textMuted }}>Tap a stat to record • Long press to undo last</p>
      </div>
    </div>
  )
}
