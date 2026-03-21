// =============================================================================
// CoachStatsTab — V2 top players stats + evaluations for coach dashboard tabs
// Props-only.
// =============================================================================

export default function CoachStatsTab({
  topPlayers = [],
  roster = [],
  evalData = [],
  onPlayerClick,
}) {
  const getPlayerName = (playerId) => {
    const p = roster.find(r => r.id === playerId)
    if (p) return `${p.first_name} ${p.last_name}`
    return '—'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const ratingColor = (val) => {
    if (val >= 8) return 'var(--v2-green)'
    if (val >= 6) return 'var(--v2-sky)'
    if (val >= 4) return '#D97706'
    return 'var(--v2-coral)'
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Season Stats Table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 60px 60px 60px 60px 60px 60px',
        gap: 4, padding: '10px 24px',
        background: 'var(--v2-surface)',
        borderBottom: '1px solid var(--v2-border-subtle)',
      }}>
        {['Player', 'PTS', 'K', 'A', 'D', 'B', 'ACE'].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
            textAlign: i > 0 ? 'center' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {topPlayers.map((tp, i) => (
        <div
          key={tp.player_id || i}
          onClick={() => {
            const p = roster.find(r => r.id === tp.player_id)
            if (p) onPlayerClick?.(p)
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 60px 60px 60px 60px 60px',
            gap: 4, padding: '10px 24px',
            borderBottom: i < topPlayers.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 800,
              color: i < 3 ? 'var(--v2-sky)' : 'var(--v2-text-muted)',
              width: 18,
            }}>
              #{i + 1}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
              {getPlayerName(tp.player_id)}
            </span>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--v2-text-primary)' }}>
            {tp.total_points || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_kills || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_assists || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_digs || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_blocks || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_aces || 0}
          </div>
        </div>
      ))}

      {topPlayers.length === 0 && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          fontSize: 13, color: 'var(--v2-text-muted)',
        }}>
          No player stats yet
        </div>
      )}

      {/* Evaluations Section */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          color: 'var(--v2-text-muted)', letterSpacing: '0.04em', marginBottom: 12,
        }}>
          Player Evaluations
        </div>

        {evalData.length === 0 ? (
          <div style={{
            padding: '20px 16px', textAlign: 'center',
            background: 'var(--v2-surface)', borderRadius: 10,
            fontSize: 13, color: 'var(--v2-text-muted)',
          }}>
            No evaluations yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evalData.map((ev, i) => {
              const skills = [
                { label: 'SRV', val: ev.serve },
                { label: 'PAS', val: ev.pass },
                { label: 'ATK', val: ev.attack },
                { label: 'BLK', val: ev.block },
                { label: 'DIG', val: ev.dig },
                { label: 'SET', val: ev.set_skill },
              ].filter(s => s.val != null)

              return (
                <div
                  key={ev.player_id || i}
                  onClick={() => {
                    const p = roster.find(r => r.id === ev.player_id)
                    if (p) onPlayerClick?.(p)
                  }}
                  style={{
                    background: 'var(--v2-surface)', borderRadius: 10, padding: '12px 14px',
                    cursor: 'pointer', transition: 'opacity 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                        {getPlayerName(ev.player_id)}
                      </span>
                      {ev.overall_rating != null && (
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 6,
                          background: `${ratingColor(ev.overall_rating)}15`,
                          color: ratingColor(ev.overall_rating),
                        }}>
                          {ev.overall_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                      {formatDate(ev.created_at)}
                    </span>
                  </div>

                  {skills.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {skills.map((s, j) => (
                        <div key={j} style={{
                          textAlign: 'center', minWidth: 40,
                          padding: '4px 6px', borderRadius: 6,
                          background: 'var(--v2-bg)',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: ratingColor(s.val) }}>
                            {s.val}
                          </div>
                          <div style={{ fontSize: 8.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', letterSpacing: '0.03em' }}>
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
