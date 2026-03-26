import React from 'react'
import { getContrastText, hexToRgba } from '../../cardColorUtils'

// ============================================
// HEADLINE SCORE CARD
// Team color header bar with "FINAL". Two team rows
// below showing logo, name, record, big score.
// Set scores at bottom.
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

export default function HeadlineScoreCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const isWin = event?.game_result === 'win'
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const date = fmtDate(event?.event_date)
  const venue = event?.venue_name || ''
  const setScores = getSetScores(event)
  const contrast = getContrastText(teamColor)
  const contrastBase = contrast === '#ffffff' ? '#ffffff' : '#000000'

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Color bar */}
      <div style={{
        background: teamColor,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 40,
          color: contrast,
          letterSpacing: 2,
          lineHeight: 1,
        }}>
          FINAL
        </div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          color: hexToRgba(contrastBase, 0.5),
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}>
          {date}{venue ? ` \u00B7 ${venue}` : ''}
        </div>
      </div>

      {/* Team rows area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        {/* Our team row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          padding: '0 40px',
        }}>
          {/* Logo */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: 44,
                height: 44,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          ) : (
            <OpponentLogo
              name={teamName}
              size={44}
              color={isWin ? teamColor : '#666'}
            />
          )}
          {/* Name + record */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: isWin ? '#fff' : '#888',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}>
              {teamName || 'Team'}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              color: '#555',
            }}>
              {event?.our_sets_won != null ? `Sets won: ${event.our_sets_won}` : 'Home'}
            </div>
          </div>
          {/* Score */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 72,
            lineHeight: 0.85,
            color: isWin ? teamColor : '#555',
            letterSpacing: 2,
            flexShrink: 0,
          }}>
            {event?.our_score ?? '-'}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: 'calc(100% - 80px)',
          height: 1,
          background: 'rgba(255,255,255,0.06)',
        }} />

        {/* Opponent team row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          padding: '0 40px',
        }}>
          {/* Opponent logo */}
          <OpponentLogo
            name={opponent}
            size={44}
            color={isWin ? '#555' : teamColor}
          />
          {/* Name + record */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: isWin ? '#888' : '#fff',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}>
              {opponent}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              color: '#555',
            }}>
              {event?.opponent_sets_won != null ? `Sets won: ${event.opponent_sets_won}` : 'Away'}
            </div>
          </div>
          {/* Score */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 72,
            lineHeight: 0.85,
            color: isWin ? '#555' : teamColor,
            letterSpacing: 2,
            flexShrink: 0,
          }}>
            {event?.opponent_score ?? '-'}
          </div>
        </div>
      </div>

      {/* Set scores footer */}
      {setScores.length > 0 && (
        <div style={{
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          borderTop: `1px solid ${hexToRgba(teamColor, 0.1)}`,
          flexShrink: 0,
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
