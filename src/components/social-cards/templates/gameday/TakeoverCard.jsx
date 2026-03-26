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

export default function TakeoverCard({
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

  const gradientOverlay = isWide
    ? `linear-gradient(90deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.9) 30%, ${hexToRgba(teamColor, 0.5)} 55%, transparent 80%)`
    : `linear-gradient(135deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 25%, ${hexToRgba(teamColor, 0.55)} 50%, transparent 75%)`

  const noPhotoGradient = `linear-gradient(135deg, #0a0a0a, ${hexToRgba(teamColor, 0.3)})`

  const eventDate = event?.date || event?.event_date
  const eventTime = event?.time || event?.start_time
  const venue = event?.venue || event?.location || ''

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: '#000',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Photo or fallback */}
      {hasPhoto ? (
        <img
          src={featuredPlayer.photo_url}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: noPhotoGradient,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: gradientOverlay,
          zIndex: 2,
        }}
      />

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 14,
            ...(isWide ? { left: 20 } : { right: 14 }),
            width: 44,
            zIndex: 10,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
          }}
        />
      )}

      {/* Text block */}
      <div
        style={{
          position: 'absolute',
          zIndex: 10,
          ...(isWide
            ? {
                top: '50%',
                left: 24,
                transform: 'translateY(-50%)',
                maxWidth: '50%',
              }
            : {
                bottom: 0,
                left: 0,
                right: 0,
                padding: 24,
              }),
        }}
      >
        {/* Org name */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 4,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
          }}
        >
          {orgName || ''}
        </div>

        {/* GAME DAY */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isWide ? 56 : 52,
            lineHeight: 0.88,
            color: '#fff',
            letterSpacing: 2,
          }}
        >
          {isWide ? 'GAME DAY' : (
            <>
              GAME
              <br />
              DAY
            </>
          )}
        </div>

        {/* Team name */}
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: teamColor,
            textTransform: 'uppercase',
            marginTop: 4,
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
            color: 'rgba(255,255,255,0.7)',
            marginTop: 6,
          }}
        >
          vs. {event?.opponent_name || event?.opponent || 'TBD'}
        </div>

        {/* Date / Time / Venue */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 10,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.4)',
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
