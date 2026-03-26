import React from 'react'
import { getContrastText, hexToRgba } from '../../cardColorUtils'

// ============================================
// HEADLINE GAME DAY CARD
// Team color header bar with "GAME DAY".
// Photo in left 45% of body, text in right.
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

export default function HeadlineGDCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const contrast = getContrastText(teamColor)
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const date = fmtDate(event?.event_date)
  const time = fmtTime(event?.event_time)
  const venue = event?.venue_name || 'TBD'
  const photoUrl = featuredPlayer?.photo_url

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header bar */}
      <div style={{
        background: teamColor,
        padding: '16px 24px',
        position: 'relative',
        zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 44,
          color: contrast,
          lineHeight: 0.9,
          letterSpacing: 2,
        }}>
          GAME DAY
        </div>
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              top: '50%',
              right: 16,
              transform: 'translateY(-50%)',
              height: 40,
              opacity: 0.25,
            }}
          />
        )}
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Photo column (left) */}
        <div style={{
          width: '45%',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                }}
              />
              {/* Right-edge fade */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 60%, #0a0a0a 100%)',
              }} />
            </>
          ) : (
            /* No-photo fallback */
            <div style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, #111 0%, ${hexToRgba(teamColor, 0.15)} 100%)`,
            }} />
          )}
        </div>

        {/* Info column (right) */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 20,
        }}>
          {/* Org label */}
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 4,
            color: teamColor,
            textTransform: 'uppercase',
          }}>
            {orgName}
          </div>

          {/* Team name */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            lineHeight: 0.9,
            color: '#fff',
            marginTop: 4,
          }}>
            {teamName}
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: hexToRgba(teamColor, 0.3),
            margin: '10px 0',
          }} />

          {/* VS row */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#555',
            }}>
              VS.
            </span>
            <span style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: '#ccc',
              textTransform: 'uppercase',
            }}>
              {opponent}
            </span>
          </div>

          {/* Date / time / venue */}
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: '#444',
            textTransform: 'uppercase',
            marginTop: 12,
          }}>
            <div>{date} &middot; {time}</div>
            <div style={{ marginTop: 2 }}>{venue}</div>
          </div>
        </div>
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
