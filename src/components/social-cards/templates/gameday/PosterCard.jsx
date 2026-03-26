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

export default function PosterCard({
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
            objectPosition: 'top',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 35%, ${hexToRgba(teamColor, 0.25)} 0%, #0a0a0a 70%)`,
          }}
        />
      )}

      {/* Dark vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 35%, transparent 20%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 85%)',
          zIndex: 2,
        }}
      />

      {/* Team color tint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 35%, transparent 30%, ${hexToRgba(teamColor, 0.12)} 60%, ${hexToRgba(teamColor, 0.25)} 100%)`,
          zIndex: 3,
        }}
      />

      {/* Ghost "GAME DAY" text */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 52,
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: 6,
          zIndex: 10,
        }}
      >
        GAME DAY
      </div>

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 38,
            opacity: 0.5,
            zIndex: 10,
          }}
        />
      )}

      {/* Bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 24px',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {/* Team name */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 32,
            color: teamColor,
            letterSpacing: 2,
          }}
        >
          {teamName || ''}
        </div>

        {/* Opponent */}
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 14,
            color: '#ccc',
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          vs. {event?.opponent_name || event?.opponent || 'TBD'}
        </div>

        {/* Date / Time / Venue */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#666',
            marginTop: 6,
            textTransform: 'uppercase',
          }}
        >
          {fmtDate(eventDate)} &middot; {fmtTime(eventTime)}
          {venue && <> &middot; {venue}</>}
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
