// ============================================
// POST GAME SUMMARY
// ============================================

// Inline Trophy icon (matches GameDayCommandCenter's Icons.Trophy)
const TrophyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
)

function PostGameSummary({
  setScores,
  stats,
  roster,
  teamName,
  opponentName,
  onClose,
  onSaveStats,
  theme,
}) {
  // Calculate winner
  const ourSetsWon = setScores.filter(s => s.our > s.their).length
  const theirSetsWon = setScores.filter(s => s.their > s.our).length
  const isWin = ourSetsWon > theirSetsWon

  // Calculate totals
  const teamTotals = Object.values(stats).reduce((acc, playerStats) => {
    Object.entries(playerStats || {}).forEach(([key, val]) => {
      acc[key] = (acc[key] || 0) + (val || 0)
    })
    return acc
  }, {})

  // Get top performers
  const getTopPerformers = () => {
    return Object.entries(stats)
      .map(([playerId, playerStats]) => {
        const player = roster.find(p => p.id === playerId)
        const points = (playerStats?.kills || 0) + (playerStats?.aces || 0) + (playerStats?.blocks || 0)
        return { player, stats: playerStats, points }
      })
      .filter(p => p.player && p.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
  }

  const topPerformers = getTopPerformers()

  return (
    <div
      className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: theme?.modalOverlay || 'rgba(0, 0, 0, 0.9)' }}
    >
      <div
        className="rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: theme?.modalBg || '#0f172a',
          border: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}`,
        }}
      >
        {/* Header */}
        <div className={`p-8 text-center ${isWin ? 'bg-gradient-to-b from-emerald-900/50' : 'bg-gradient-to-b from-red-900/50'}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrophyIcon className={`w-12 h-12 ${isWin ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <h2 className={`text-4xl font-black ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
            {isWin ? 'VICTORY!' : 'DEFEAT'}
          </h2>
          <p style={{ color: theme?.textMuted || '#64748b' }} className="mt-2">{teamName} vs {opponentName}</p>

          {/* Final score */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <span className="text-6xl font-black" style={{ color: theme?.textPrimary || '#ffffff' }}>{ourSetsWon}</span>
            <span className="text-3xl" style={{ color: theme?.textMuted || '#64748b' }}>—</span>
            <span className="text-6xl font-black" style={{ color: theme?.textMuted || '#64748b' }}>{theirSetsWon}</span>
          </div>
        </div>

        {/* Set breakdown */}
        <div
          className="px-8 py-6"
          style={{ borderBottom: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
        >
          <h3
            className="text-sm font-bold uppercase mb-4"
            style={{ color: theme?.textMuted || '#64748b' }}
          >
            Set Scores
          </h3>
          <div className="flex justify-center gap-4">
            {setScores.map((set, i) => (
              <div
                key={i}
                className={`px-6 py-3 rounded-xl ${
                  set.our > set.their ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}
              >
                <p className="text-xs text-center mb-1" style={{ color: theme?.textMuted || '#64748b' }}>Set {i + 1}</p>
                <p className="text-xl font-bold text-center">
                  <span className={set.our > set.their ? 'text-emerald-400' : ''} style={{ color: set.our > set.their ? undefined : theme?.textPrimary }}>{set.our}</span>
                  <span className="mx-2" style={{ color: theme?.textMuted || '#64748b' }}>-</span>
                  <span className={set.their > set.our ? 'text-red-400' : ''} style={{ color: set.their > set.our ? undefined : theme?.textPrimary }}>{set.their}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team stats */}
        <div
          className="px-8 py-6"
          style={{ borderBottom: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
        >
          <h3
            className="text-sm font-bold uppercase mb-4"
            style={{ color: theme?.textMuted || '#64748b' }}
          >
            Team Stats
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { key: 'kills', label: 'Kills', color: 'text-red-400' },
              { key: 'aces', label: 'Aces', color: 'text-emerald-400' },
              { key: 'blocks', label: 'Blocks', color: 'text-indigo-400' },
              { key: 'digs', label: 'Digs', color: 'text-amber-400' },
              { key: 'assists', label: 'Assists', color: 'text-purple-400' },
            ].map(stat => (
              <div key={stat.key} className="text-center">
                <p className={`text-3xl font-black ${stat.color}`}>{teamTotals[stat.key] || 0}</p>
                <p className="text-xs uppercase mt-1" style={{ color: theme?.textMuted || '#64748b' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top performers */}
        {topPerformers.length > 0 && (
          <div
            className="px-8 py-6"
            style={{ borderBottom: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
          >
            <h3
              className="text-sm font-bold uppercase mb-4"
              style={{ color: theme?.textMuted || '#64748b' }}
            >
              Top Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.map(({ player, stats: pStats, points }, i) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: theme?.cardBg || 'rgba(30, 41, 59, 0.5)' }}
                >
                  <span className={`text-2xl font-black ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : 'text-amber-700'
                  }`}>
                    #{i + 1}
                  </span>
                  {player.photo_url ? (
                    <img src={player.photo_url} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                      style={{ backgroundColor: theme?.buttonBg || '#334155', color: theme?.textPrimary || '#ffffff' }}
                    >
                      {player.jersey_number}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: theme?.textPrimary || '#ffffff' }}>{player.first_name} {player.last_name}</p>
                    <p style={{ color: theme?.textMuted || '#64748b' }} className="text-sm">
                      {pStats?.kills || 0}K • {pStats?.aces || 0}A • {pStats?.digs || 0}D • {pStats?.blocks || 0}B
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-400">{points}</p>
                    <p className="text-xs" style={{ color: theme?.textMuted || '#64748b' }}>points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-semibold rounded-xl transition"
            style={{
              backgroundColor: theme?.buttonBg || '#1e293b',
              color: theme?.textPrimary || '#ffffff',
            }}
          >
            Close
          </button>
          <button
            onClick={onSaveStats}
            className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
                       text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/30"
          >
            Save & Finish
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostGameSummary
