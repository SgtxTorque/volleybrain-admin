// =============================================================================
// PlayerStatsTab — V2 season stats display for player dashboard
// Props-only.
// =============================================================================

export default function PlayerStatsTab({
  seasonStats = {},
  gameStats = [],
  rankings = {},
}) {
  const statRows = [
    { label: 'Games Played', value: seasonStats.games_played || 0 },
    { label: 'Kills', value: seasonStats.total_kills || 0, rank: rankings.kills },
    { label: 'Aces', value: seasonStats.total_aces || 0, rank: rankings.aces },
    { label: 'Digs', value: seasonStats.total_digs || 0, rank: rankings.digs },
    { label: 'Blocks', value: seasonStats.total_blocks || 0, rank: rankings.blocks },
    { label: 'Assists', value: seasonStats.total_assists || 0, rank: rankings.assists },
    { label: 'Points', value: seasonStats.total_points || 0, rank: rankings.points },
    { label: 'Hit %', value: seasonStats.hit_percentage ? `${(seasonStats.hit_percentage * 100).toFixed(1)}%` : '—' },
    { label: 'Serve %', value: seasonStats.serve_percentage ? `${(seasonStats.serve_percentage * 100).toFixed(1)}%` : '—' },
  ]

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Season Stats */}
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'rgba(255,255,255,0.40)',
        marginBottom: 12,
      }}>
        Season Stats
      </div>

      {statRows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < statRows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.70)' }}>
            {row.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
              {row.value}
            </span>
            {row.rank && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: row.rank <= 3 ? '#FFD700' : 'rgba(255,255,255,0.30)',
                background: row.rank <= 3 ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                padding: '2px 6px', borderRadius: 6,
              }}>
                #{row.rank}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Recent Games */}
      {gameStats.length > 0 && (
        <>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'rgba(255,255,255,0.40)',
            marginTop: 24, marginBottom: 12,
          }}>
            Recent Games
          </div>
          {gameStats.slice(0, 5).map((game, i) => (
            <div
              key={game.id || i}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < Math.min(gameStats.length, 5) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>
                  {game.event?.title || game.event?.event_type || 'Game'}
                </div>
                {game.event?.event_date && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
                    {new Date(game.event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 700 }}>
                {game.kills > 0 && <span style={{ color: '#4BB9EC' }}>{game.kills}K</span>}
                {game.aces > 0 && <span style={{ color: '#FFD700' }}>{game.aces}A</span>}
                {game.digs > 0 && <span style={{ color: '#22C55E' }}>{game.digs}D</span>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
