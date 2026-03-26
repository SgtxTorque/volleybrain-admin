import React from 'react'
import { getContrastText, hexToRgba } from '../../cardColorUtils'

// ============================================
// SCOREBOARD RESULTS CARD
// Classic centered matchup. Both logos, big scores,
// set scores below. No photo needed.
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

export default function ScoreboardResCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const isWin = event?.game_result === 'win'
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const date = fmtDate(event?.event_date)
  const venue = event?.venue_name || ''
  const setScores = getSetScores(event)
  const isWide = format === 'wide'

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      {/* Win background texture */}
      {isWin && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          background: `repeating-conic-gradient(${teamColor} 0% 25%, transparent 0% 50%)`,
          backgroundSize: '28px 28px',
        }} />
      )}

      {/* FINAL label */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 6,
        textTransform: 'uppercase',
        marginBottom: 16,
        color: isWin ? '#22C55E' : '#666',
        position: 'relative',
        zIndex: 2,
      }}>
        {isWin ? '\u2726  FINAL  \u2726' : 'FINAL'}
      </div>

      {/* Matchup row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isWide ? 40 : 28,
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Our team column */}
        <div style={{
          width: 130,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{
                width: 70,
                height: 70,
                objectFit: 'contain',
              }}
            />
          ) : (
            <OpponentLogo
              name={teamName}
              size={70}
              color={isWin ? teamColor : '#666'}
            />
          )}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 72,
            lineHeight: 0.85,
            letterSpacing: 2,
            color: isWin ? teamColor : '#666',
            marginTop: 6,
          }}>
            {event?.our_score ?? '-'}
          </div>
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: isWin ? '#fff' : '#888',
            textTransform: 'uppercase',
            marginTop: 4,
          }}>
            {teamName || 'Team'}
          </div>
        </div>

        {/* VS divider */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 1,
            height: 28,
            background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 3,
            color: '#444',
          }}>
            VS
          </div>
          <div style={{
            width: 1,
            height: 28,
            background: 'rgba(255,255,255,0.06)',
          }} />
        </div>

        {/* Opponent column */}
        <div style={{
          width: 130,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <OpponentLogo
            name={opponent}
            size={70}
            color={isWin ? '#555' : teamColor}
          />
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 72,
            lineHeight: 0.85,
            letterSpacing: 2,
            color: isWin ? '#555' : teamColor,
            marginTop: 6,
          }}>
            {event?.opponent_score ?? '-'}
          </div>
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: isWin ? '#888' : '#fff',
            textTransform: 'uppercase',
            marginTop: 4,
          }}>
            {opponent}
          </div>
        </div>
      </div>

      {/* Set scores row */}
      {setScores.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 6,
          marginTop: 14,
          position: 'relative',
          zIndex: 2,
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

      {/* Date / venue */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 2,
        color: '#333',
        textTransform: 'uppercase',
        marginTop: 12,
        position: 'relative',
        zIndex: 2,
      }}>
        {date}{venue ? ` \u00B7 ${venue}` : ''}
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
