// =============================================================================
// LastGameCard — 4-stat grid from most recent game
// Always dark theme — does NOT use isDark toggle
// =============================================================================

export default function LastGameCard({ gameStats }) {
  const lastGame = gameStats?.[0]
  if (!lastGame) return (
    <div className="rounded-2xl p-4 h-full flex flex-col items-center justify-center" style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-2xl mb-2 opacity-40">🏐</span>
      <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>No game stats yet</p>
    </div>
  )

  const stats = [
    { label: 'Kills', value: lastGame.kills || 0 },
    { label: 'Aces', value: lastGame.aces || 0 },
    { label: 'Digs', value: lastGame.digs || 0 },
    { label: 'Blocks', value: lastGame.blocks || 0 },
  ]

  return (
    <div className="rounded-2xl p-4 h-full flex flex-col" style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-[10px] font-bold uppercase tracking-[1.2px] mb-3" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Last Game
      </h3>
      <div className="flex-1 grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl py-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-2xl font-black leading-none text-white">{s.value}</p>
            <p className="text-[9px] font-semibold uppercase mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
