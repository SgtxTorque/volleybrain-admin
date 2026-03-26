import React from 'react'
import { getContrastText, darken, lighten, hexToRgba, isLightColor } from '../../cardColorUtils'

function fmtDate(d) {
  if (!d) return 'TBD'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtTime(t) {
  if (!t) return 'TBD'
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}

export default function BannerCard({
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

  const eventDate = event?.date || event?.event_date
  const eventTime = event?.time || event?.start_time
  const venue = event?.venue || event?.location || ''

  const frameWidth = isWide ? 320 : 260
  const frameHeight = isWide ? '120%' : 300

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: `linear-gradient(135deg, #0a0a0a 0%, ${darken(teamColor, 0.7)} 100%)`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Geometric photo frame */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -20,
          width: frameWidth,
          height: frameHeight,
          transform: 'skewY(-12deg)',
          overflow: 'hidden',
          borderRadius: '0 0 0 30px',
          zIndex: 2,
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
              objectPosition: 'center top',
              transform: 'skewY(12deg) scale(1.15)',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: hexToRgba(teamColor, 0.2),
            }}
          />
        )}
        {/* Gradient overlay on frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, transparent 40%, ${hexToRgba(teamColor, 0.4)} 100%)`,
          }}
        />
      </div>

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            top: 16,
            left: 24,
            width: 40,
            zIndex: 10,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
          }}
        />
      )}

      {/* Text block */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          zIndex: 10,
        }}
      >
        {/* GAME DAY */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 72,
            lineHeight: 0.82,
            color: '#fff',
            letterSpacing: 2,
          }}
        >
          GAME
          <br />
          DAY
        </div>

        {/* Team name */}
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: teamColor,
            textTransform: 'uppercase',
            marginTop: 6,
            letterSpacing: 1,
          }}
        >
          {teamName || ''}
        </div>

        {/* Opponent */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            marginTop: 3,
          }}
        >
          vs. {event?.opponent_name || event?.opponent || 'TBD'}
        </div>

        {/* Date / Time / Venue */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 10,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: '#555',
            textTransform: 'uppercase',
          }}
        >
          <span>{fmtDate(eventDate)}</span>
          <span>{fmtTime(eventTime)}</span>
          {venue && <span>{venue}</span>}
        </div>
      </div>

      {/* POWERED BY LYNX watermark */}
      <div
        style={{
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
        }}
      >
        POWERED BY LYNX
      </div>
    </div>
  )
}
