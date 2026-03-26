import React from 'react'
import { getContrastText, darken, lighten, hexToRgba, isLightColor } from '../../cardColorUtils'

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getSetScores(event) {
  try {
    return Array.isArray(event?.set_scores) ? event.set_scores : JSON.parse(event?.set_scores || '[]')
  } catch {
    return []
  }
}

function OpponentLogo({ name, size = 32, color }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: size * 0.45,
        color: color || '#555',
      }}
    >
      {(name || '?')[0]}
    </div>
  )
}

export default function TriPanelCard({
  event,
  events,
  team,
  organization,
  season,
  stats,
  teamColor,
  teamName,
  orgName,
  logoUrl,
  featuredPlayer,
  format,
  width,
  height,
  sportIcon,
}) {
  const isWide = format === 'wide'
  const hasPhoto = featuredPlayer?.photo_url
  const isWin = event?.game_result === 'win'
  const ourScore = event?.our_score ?? '–'
  const oppScore = event?.opponent_score ?? '–'
  const opponentName = event?.opponent_name || event?.opponent || 'TBD'
  const eventDate = event?.date || event?.event_date
  const venue = event?.venue_name || event?.venue || event?.location || ''
  const stripWidth = isWide ? 100 : 80

  // Build ticker content: repeat teamName 10+ times
  const tickerText = ((teamName || 'TEAM') + ' \u2022 ').repeat(12)

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: '#0B1628',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Ticker top */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 0,
          right: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 11,
          letterSpacing: 4,
          color: hexToRgba(teamColor, 0.07),
          textTransform: 'uppercase',
          zIndex: 1,
        }}
      >
        {tickerText}
      </div>

      {/* Ticker bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 0,
          right: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 11,
          letterSpacing: 4,
          color: hexToRgba(teamColor, 0.07),
          textTransform: 'uppercase',
          zIndex: 1,
        }}
      >
        {tickerText}
      </div>

      {/* Grid texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `linear-gradient(${hexToRgba(teamColor, 0.3)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRgba(teamColor, 0.3)} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          zIndex: 1,
        }}
      />

      {/* Photo strips */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: 20,
          bottom: 20,
          display: 'flex',
          gap: 6,
          zIndex: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: stripWidth,
              borderRadius: 8,
              overflow: 'hidden',
              border: `2px solid ${hexToRgba(teamColor, 0.2)}`,
            }}
          >
            {hasPhoto ? (
              <img
                src={featuredPlayer.photo_url}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(180deg, ${hexToRgba(teamColor, 0.15)}, ${hexToRgba(teamColor, 0.05)})`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Score area */}
      <div
        style={{
          position: 'absolute',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{
              width: 36,
              height: 36,
              objectFit: 'contain',
              marginBottom: 6,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: hexToRgba(teamColor, 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 16,
              color: teamColor,
              marginBottom: 6,
            }}
          >
            {(teamName || '?')[0]}
          </div>
        )}

        {/* Our score */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 68,
            color: isWin ? teamColor : '#445',
            lineHeight: 0.85,
            letterSpacing: 3,
            textShadow: isWin ? `0 2px 12px ${hexToRgba(teamColor, 0.3)}` : 'none',
          }}
        >
          {ourScore}
        </div>

        {/* FINAL badge */}
        <div
          style={{
            padding: '3px 16px',
            background: hexToRgba(teamColor, 0.15),
            border: `1px solid ${hexToRgba(teamColor, 0.3)}`,
            borderRadius: 4,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 14,
            color: teamColor,
            letterSpacing: 4,
            margin: '6px 0',
          }}
        >
          FINAL
        </div>

        {/* Opponent score */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 68,
            color: isWin ? '#445' : teamColor,
            lineHeight: 0.85,
            letterSpacing: 3,
          }}
        >
          {oppScore}
        </div>

        {/* Opponent logo */}
        <div style={{ marginTop: 6 }}>
          <OpponentLogo name={opponentName} size={28} color="rgba(255,255,255,0.4)" />
        </div>

        {/* Date / venue */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 2,
            color: hexToRgba(teamColor, 0.5),
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        >
          {fmtDate(eventDate)}{venue ? ` \u2022 ${venue}` : ''}
        </div>
      </div>

      {/* POWERED BY LYNX watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 7,
          right: 10,
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 8,
          letterSpacing: 3,
          textTransform: 'uppercase',
          opacity: 0.3,
          zIndex: 20,
          color: teamColor,
        }}
      >
        POWERED BY LYNX
      </div>
    </div>
  )
}
