import React from 'react'
import { getContrastText, hexToRgba } from '../../cardColorUtils'

// ============================================
// HERO SCORE CARD
// Full-bleed photo, bottom gradient, scores overlaid
// at bottom. "FINAL" badge at top.
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

export default function HeroScoreCard({
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

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: '#000',
    }}>
      {/* Photo or dark gradient fallback */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, #111 0%, ${hexToRgba(teamColor, 0.25)} 100%)`,
        }} />
      )}

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.95) 80%)',
        zIndex: 2,
      }} />

      {/* Color tint overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(180deg, transparent 60%, ${hexToRgba(teamColor, 0.15)} 100%)`,
        zIndex: 3,
      }} />

      {/* FINAL badge */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 20px',
          background: teamColor,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 14,
          color: getContrastText(teamColor),
          letterSpacing: 4,
        }}>
          FINAL
        </div>
      </div>

      {/* Score area */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px 24px',
        zIndex: 10,
      }}>
        {/* Score row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}>
          {/* Our side */}
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: isWin ? teamColor : '#888',
              textTransform: 'uppercase',
            }}>
              {teamName || 'Team'}
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 88,
              lineHeight: 0.85,
              color: isWin ? '#fff' : '#555',
              letterSpacing: 2,
            }}>
              {event?.our_score ?? '-'}
            </div>
          </div>

          {/* VS */}
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#444',
            marginBottom: 16,
          }}>
            VS
          </div>

          {/* Opponent side */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: isWin ? '#888' : teamColor,
              textTransform: 'uppercase',
            }}>
              {opponent}
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 88,
              lineHeight: 0.85,
              color: isWin ? '#555' : '#fff',
              letterSpacing: 2,
            }}>
              {event?.opponent_score ?? '-'}
            </div>
          </div>
        </div>

        {/* Set scores */}
        {setScores.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 8,
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
          textAlign: 'center',
          marginTop: 6,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 2,
          color: '#444',
          textTransform: 'uppercase',
        }}>
          {date}{venue ? ` \u00B7 ${venue}` : ''}
        </div>
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
