import React from 'react'
import { hexToRgba } from '../../cardColorUtils'

// ============================================
// MINIMAL GAME DAY CARD
// Light background, clean, typography-driven.
// Team color as accent only.
// ============================================

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

export default function MinimalGDCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const date = fmtDate(event?.event_date)
  const time = fmtTime(event?.event_time)
  const venue = event?.venue_name || 'TBD'
  const padLR = format === 'wide' ? 36 : 28

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: '#fafaf5',
      padding: format === 'wide' ? '28px 36px' : '28px',
    }}>
      {/* Left edge stripe */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        background: teamColor,
      }} />

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 36,
            opacity: 0.15,
          }}
        />
      )}

      {/* Content */}
      <div>
        {/* GAME DAY label */}
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 5,
          color: teamColor,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          GAME DAY
        </div>

        {/* Team name */}
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: format === 'wide' ? 52 : 44,
          lineHeight: 0.9,
          color: '#1a1a2e',
          letterSpacing: 1,
        }}>
          {teamName}
        </div>

        {/* Accent line */}
        <div style={{
          width: 40,
          height: 3,
          background: teamColor,
          margin: '10px 0',
        }} />

        {/* vs. Opponent */}
        <div style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: '#555',
          textTransform: 'uppercase',
        }}>
          vs. {opponent}
        </div>

        {/* Date / time / venue */}
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: '#999',
          textTransform: 'uppercase',
          marginTop: 16,
          lineHeight: 2,
        }}>
          <div>{date} &middot; {time}</div>
          <div>{venue}</div>
        </div>
      </div>

      {/* Sport icon + org name */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: padLR,
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        color: '#bbb',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {sportIcon && <span>{sportIcon}</span>}
        <span>{orgName}</span>
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
