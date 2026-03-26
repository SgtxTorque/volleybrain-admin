import React from 'react'
import { getContrastText, hexToRgba } from '../../cardColorUtils'

// ============================================
// SCOREBOARD GAME DAY CARD
// Typography-driven, no photo. Team color background.
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

export default function ScoreboardGDCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const contrast = getContrastText(teamColor)
  const contrastBase = contrast === '#ffffff' ? '#ffffff' : '#000000'
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const date = fmtDate(event?.event_date)
  const time = fmtTime(event?.event_time)
  const venue = event?.venue_name || 'TBD'

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: teamColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px)',
      }} />

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{
            width: 60,
            opacity: 0.3,
            marginBottom: 12,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}

      {/* Team name */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: format === 'wide' ? 64 : 56,
        lineHeight: 0.9,
        color: contrast,
        letterSpacing: 3,
        position: 'relative',
        zIndex: 1,
      }}>
        {teamName}
      </div>

      {/* VS divider */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 4,
        color: hexToRgba(contrastBase, 0.4),
        margin: '8px 0',
        position: 'relative',
        zIndex: 1,
      }}>
        VS
      </div>

      {/* Opponent name */}
      <div style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: format === 'wide' ? 28 : 22,
        fontWeight: 600,
        color: hexToRgba(contrastBase, 0.8),
        textTransform: 'uppercase',
        position: 'relative',
        zIndex: 1,
      }}>
        {opponent}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '14px 24px',
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        justifyContent: 'center',
        gap: 20,
        zIndex: 1,
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: hexToRgba(contrastBase, 0.5),
          textTransform: 'uppercase',
        }}>
          {date}
        </span>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: hexToRgba(contrastBase, 0.5),
          textTransform: 'uppercase',
        }}>
          {time}
        </span>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: hexToRgba(contrastBase, 0.5),
          textTransform: 'uppercase',
        }}>
          {venue}
        </span>
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
