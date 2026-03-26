import React from 'react'
import { hexToRgba } from '../../cardColorUtils'

// ============================================
// BADGE GAME DAY CARD
// Radial glow background. Logo centered large. No photo.
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

export default function BadgeGDCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const date = fmtDate(event?.event_date)
  const time = fmtTime(event?.event_time)
  const venue = event?.venue_name || 'TBD'
  const ringSize = format === 'wide' ? 200 : 180
  const logoSize = format === 'wide' ? 100 : 90

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: `radial-gradient(circle at 50% 45%, ${hexToRgba(teamColor, 0.2)} 0%, #0a0a0a 70%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      {/* Decorative ring */}
      <div style={{
        position: 'absolute',
        width: ringSize,
        height: ringSize,
        border: `2px solid ${hexToRgba(teamColor, 0.15)}`,
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -55%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{
            width: logoSize,
            marginBottom: 16,
            filter: `drop-shadow(0 4px 20px ${hexToRgba(teamColor, 0.4)})`,
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}

      {/* GAME DAY */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: format === 'wide' ? 48 : 40,
        color: '#fff',
        letterSpacing: 3,
        lineHeight: 0.9,
        position: 'relative',
        zIndex: 1,
      }}>
        GAME DAY
      </div>

      {/* Team name */}
      <div style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: 14,
        fontWeight: 700,
        color: teamColor,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 4,
        position: 'relative',
        zIndex: 1,
      }}>
        {teamName}
      </div>

      {/* Opponent */}
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
        position: 'relative',
        zIndex: 1,
      }}>
        vs. {opponent}
      </div>

      {/* Date / time / venue */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.5,
        color: '#555',
        textTransform: 'uppercase',
        marginTop: 12,
        position: 'relative',
        zIndex: 1,
        lineHeight: 1.8,
      }}>
        <div>{date} &middot; {time}</div>
        <div>{venue}</div>
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
