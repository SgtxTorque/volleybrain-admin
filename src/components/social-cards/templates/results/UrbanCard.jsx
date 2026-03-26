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

export default function UrbanCard({
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
  const photoWidth = isWide ? 250 : 200

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0B1628, #162D50)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Geometric accent shapes */}
      {/* Shape 1 */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: 180,
          width: 200,
          height: 200,
          border: `2px solid ${hexToRgba(teamColor, 0.08)}`,
          transform: 'rotate(35deg)',
          borderRadius: 4,
          zIndex: 1,
        }}
      />
      {/* Shape 2 */}
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          left: 100,
          width: 160,
          height: 160,
          border: `2px solid ${hexToRgba(teamColor, 0.06)}`,
          transform: 'rotate(20deg)',
          borderRadius: 4,
          zIndex: 1,
        }}
      />
      {/* Accent dot 1 */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 60,
          width: 6,
          height: 6,
          background: teamColor,
          opacity: 0.2,
          borderRadius: '50%',
          zIndex: 1,
        }}
      />
      {/* Accent dot 2 */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          right: 140,
          width: 6,
          height: 6,
          background: teamColor,
          opacity: 0.2,
          borderRadius: '50%',
          zIndex: 1,
        }}
      />
      {/* Accent dot 3 */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          right: 60,
          width: 6,
          height: 6,
          background: teamColor,
          opacity: 0.2,
          borderRadius: '50%',
          zIndex: 1,
        }}
      />

      {/* Score area (left) */}
      <div
        style={{
          position: 'absolute',
          left: 28,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      >
        {/* FINAL label */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 16,
            letterSpacing: 5,
            color: 'rgba(255,255,255,0.3)',
            marginBottom: 10,
          }}
        >
          FINAL
        </div>

        {/* Our team card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 8,
            minWidth: 220,
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: hexToRgba(teamColor, 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 14,
                color: teamColor,
              }}
            >
              {(teamName || '?')[0]}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 12,
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
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {orgName || ''}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 44,
              color: isWin ? teamColor : '#555',
              lineHeight: 1,
            }}
          >
            {ourScore}
          </div>
        </div>

        {/* Opponent card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 220,
          }}
        >
          <OpponentLogo name={opponentName} size={32} color="rgba(255,255,255,0.4)" />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 12,
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
                color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              OPPONENT
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 44,
              color: isWin ? '#555' : teamColor,
              lineHeight: 1,
            }}
          >
            {oppScore}
          </div>
        </div>

        {/* Date / venue */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#334',
            textTransform: 'uppercase',
            marginTop: 10,
          }}
        >
          {fmtDate(eventDate)}{venue ? ` \u2022 ${venue}` : ''}
        </div>
      </div>

      {/* Framed photo (right) */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 16,
          bottom: 16,
          width: photoWidth,
          zIndex: 5,
        }}
      >
        {/* Decorative border frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `2px solid ${hexToRgba(teamColor, 0.25)}`,
            borderRadius: 10,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        {/* Inner photo */}
        <div
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {hasPhoto ? (
            <img
              src={featuredPlayer.photo_url}
              alt=""
              crossOrigin="anonymous"
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
                background: `linear-gradient(180deg, #0B1628, ${hexToRgba(teamColor, 0.2)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: hexToRgba(teamColor, 0.1),
                  boxShadow: `0 0 40px ${hexToRgba(teamColor, 0.15)}`,
                }}
              />
            </div>
          )}
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
