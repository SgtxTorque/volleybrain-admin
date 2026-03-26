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

export default function WavesCard({
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
  const hasPhoto = featuredPlayer?.photo_url
  const isWin = event?.game_result === 'win'
  const ourScore = event?.our_score ?? '–'
  const oppScore = event?.opponent_score ?? '–'
  const opponentName = event?.opponent_name || event?.opponent || 'TBD'
  const eventDate = event?.date || event?.event_date
  const venue = event?.venue_name || event?.venue || event?.location || ''

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Photo or fallback */}
      {hasPhoto ? (
        <img
          src={featuredPlayer.photo_url}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, #0a0a0a, ${hexToRgba(teamColor, 0.3)})`,
          }}
        />
      )}

      {/* Right gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 30%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.85) 100%)',
          zIndex: 2,
        }}
      />

      {/* Subtle wave texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          background: `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${hexToRgba(teamColor, 0.05)} 8px, ${hexToRgba(teamColor, 0.05)} 9px)`,
          opacity: 0.6,
          zIndex: 3,
        }}
      />

      {/* Score card stack */}
      <div
        style={{
          position: 'absolute',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          zIndex: 10,
        }}
      >
        {/* Our team card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: hexToRgba(teamColor, 0.15),
            border: `1px solid ${hexToRgba(teamColor, 0.2)}`,
            borderRadius: 8,
            padding: '10px 16px',
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: hexToRgba(teamColor, 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 13,
                color: teamColor,
              }}
            >
              {(teamName || '?')[0]}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              {teamName || 'TEAM'}
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 8,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              HOME
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 52,
              color: isWin ? teamColor : '#555',
              lineHeight: 1,
              marginLeft: 6,
            }}
          >
            {ourScore}
          </div>
        </div>

        {/* FINAL badge */}
        <div
          style={{
            padding: '4px 20px',
            background: teamColor,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            color: getContrastText(teamColor),
            letterSpacing: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          FINAL
        </div>

        {/* Opponent card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '10px 16px',
          }}
        >
          <OpponentLogo name={opponentName} size={28} color="rgba(255,255,255,0.4)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              {opponentName}
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 8,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              AWAY
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 52,
              color: isWin ? '#555' : teamColor,
              lineHeight: 1,
              marginLeft: 6,
            }}
          >
            {oppScore}
          </div>
        </div>
      </div>

      {/* Date / venue bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 16,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 2,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          zIndex: 10,
        }}
      >
        {fmtDate(eventDate)}{venue ? ` \u2022 ${venue}` : ''}
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
