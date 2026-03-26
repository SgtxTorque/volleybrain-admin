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

export default function SplitCard({
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
  const light = isLightColor(teamColor)
  const panelColor = light ? darken(teamColor, 0.7) : teamColor
  const accentLine = light ? '#fff' : lighten(teamColor, 0.3)

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
      {/* Photo panel (right side) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: isWide ? '55%' : '58%',
          zIndex: 1,
          overflow: 'hidden',
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
              objectPosition: 'center',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, #1a1a2e, ${hexToRgba(teamColor, 0.25)})`,
            }}
          />
        )}
        {/* Edge gradient for blending */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, ${panelColor} 0%, transparent 35%)`,
          }}
        />
      </div>

      {/* Text panel (left side) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: isWide ? '52%' : '55%',
          background: panelColor,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 28,
        }}
      >
        {/* Skewed divider */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: -50,
            bottom: 0,
            width: 100,
            background: panelColor,
            transform: isWide ? 'skewX(-6deg)' : 'skewX(-8deg)',
          }}
        />

        {/* Game Day label */}
        <div
          style={{
            fontFamily: "'Teko', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 6,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 3,
          }}
        >
          Game Day
        </div>

        {/* Team name */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isWide ? 48 : 42,
            lineHeight: 0.92,
            color: '#fff',
            marginTop: 2,
            position: 'relative',
            zIndex: 3,
          }}
        >
          {teamName || ''}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 30,
            height: 3,
            background: accentLine,
            margin: '8px 0',
            position: 'relative',
            zIndex: 3,
          }}
        />

        {/* Opponent */}
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: isWide ? 15 : 14,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 3,
          }}
        >
          vs. {event?.opponent_name || event?.opponent || 'TBD'}
        </div>

        {/* Date / Venue */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
            marginTop: 12,
            lineHeight: 1.8,
            position: 'relative',
            zIndex: 3,
          }}
        >
          <div>{fmtDate(eventDate)} &middot; {fmtTime(eventTime)}</div>
          {venue && <div>{venue}</div>}
        </div>
      </div>

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{
            position: 'absolute',
            bottom: 14,
            left: 28,
            width: 32,
            opacity: 0.35,
            zIndex: 10,
          }}
        />
      )}

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
