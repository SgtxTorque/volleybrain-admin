import React from 'react'
import { getContrastText, hexToRgba } from '../../cardColorUtils'

// ============================================
// STAT LINE CARD
// Wide format focus. Photo left (optional),
// score + 4-stat grid right. Shows kills, aces,
// digs, blocks.
// ============================================

function fmtDate(d) {
  if (!d) return 'TBD'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getSetScores(event) {
  try {
    return Array.isArray(event?.set_scores)
      ? event.set_scores
      : JSON.parse(event?.set_scores || '[]')
  } catch {
    return []
  }
}

function OpponentLogo({ name, size = 44, color }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: size * 0.45,
      color: color || '#555',
    }}>
      {(name || '?')[0]}
    </div>
  )
}

function abbreviate(name) {
  if (!name) return '???'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase()
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 4)
}

export default function StatLineCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const isWin = event?.game_result === 'win'
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const date = fmtDate(event?.event_date)
  const venue = event?.venue_name || ''
  const setScores = getSetScores(event)
  const photoUrl = featuredPlayer?.photo_url
  const hasPhoto = !!photoUrl

  // Aggregate stats
  const agg = (stats || []).reduce((a, s) => ({
    kills: (a.kills || 0) + (s.kills || 0),
    aces: (a.aces || 0) + (s.aces || 0),
    digs: (a.digs || 0) + (s.digs || 0),
    blocks: (a.blocks || 0) + (s.blocks || 0),
  }), {})

  const statItems = [
    { label: 'Kills', value: agg.kills || 0 },
    { label: 'Aces', value: agg.aces || 0 },
    { label: 'Digs', value: agg.digs || 0 },
    { label: 'Blocks', value: agg.blocks || 0 },
  ]

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: '#0a0a0a',
      display: 'flex',
    }}>
      {/* Photo panel (left) */}
      {hasPhoto && (
        <div style={{
          width: '42%',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <img
            src={photoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              objectPosition: 'top center',
            }}
          />
          {/* Right fade */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 40%, #0a0a0a 100%)',
          }} />
          {/* Bottom fade */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%)',
          }} />
          {/* FINAL badge */}
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '3px 12px',
            background: teamColor,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 11,
            letterSpacing: 3,
            color: getContrastText(teamColor),
            zIndex: 4,
          }}>
            FINAL
          </div>
        </div>
      )}

      {/* Stats panel (right or full) */}
      <div style={{
        flex: 1,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        {/* Header row: logo + team info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: 36,
                height: 36,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          ) : (
            <OpponentLogo name={teamName} size={36} color={teamColor} />
          )}
          <div>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}>
              {teamName || 'Team'}
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: '#444',
              textTransform: 'uppercase',
            }}>
              {date}{venue ? ` \u00B7 ${venue}` : ''}
            </div>
          </div>
        </div>

        {/* Score row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          {/* Our side */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: '#555',
              textTransform: 'uppercase',
            }}>
              {abbreviate(teamName)}
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 52,
              lineHeight: 0.85,
              color: isWin ? teamColor : '#666',
              letterSpacing: 2,
            }}>
              {event?.our_score ?? '-'}
            </div>
          </div>

          {/* Dash */}
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 20,
            color: '#333',
          }}>
            &mdash;
          </div>

          {/* Opponent side */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 52,
              lineHeight: 0.85,
              color: isWin ? '#555' : teamColor,
              letterSpacing: 2,
            }}>
              {event?.opponent_score ?? '-'}
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: '#555',
              textTransform: 'uppercase',
            }}>
              {abbreviate(opponent)}
            </div>
          </div>
        </div>

        {/* Stats grid (4 cols) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 6,
          marginTop: 12,
        }}>
          {statItems.map((item, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding: '8px 4px',
              background: hexToRgba(teamColor, 0.08),
              borderRadius: 6,
            }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 24,
                color: teamColor,
                lineHeight: 1,
              }}>
                {item.value}
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 8,
                fontWeight: 700,
                color: '#555',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Set scores at bottom */}
        {setScores.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 6,
            marginTop: 10,
            justifyContent: 'center',
          }}>
            {setScores.map((s, i) => {
              const won = (s.our ?? s.ours ?? 0) > (s.their ?? s.theirs ?? 0)
              return (
                <div key={i} style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 14,
                  letterSpacing: 1,
                  padding: '4px 12px',
                  background: won
                    ? hexToRgba(teamColor, 0.15)
                    : 'rgba(100,100,100,0.15)',
                  borderRadius: 4,
                  color: won ? teamColor : '#666',
                }}>
                  {s.our ?? s.ours ?? 0}-{s.their ?? s.theirs ?? 0}
                </div>
              )
            })}
          </div>
        )}

        {/* FINAL label when no photo (since the badge is on the photo panel) */}
        {!hasPhoto && (
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 4,
            color: isWin ? '#22C55E' : '#666',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginTop: 8,
          }}>
            FINAL
          </div>
        )}
      </div>

      {/* Watermark */}
      <div style={{
        position: 'absolute',
        bottom: 7,
        right: 10,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 8,
        letterSpacing: 3,
        textTransform: 'uppercase',
        opacity: 0.3,
        zIndex: 20,
        color: teamColor,
      }}>
        POWERED BY LYNX
      </div>
    </div>
  )
}
