import React from 'react'
import { darken, hexToRgba } from '../../cardColorUtils'

// ---- shared helpers ----
function getGameEvents(events) {
  return (events || []).filter(e => e.event_type === 'game' || e.event_type === 'tournament').sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''))
}
function groupByMonth(games) {
  const byMonth = {}
  games.forEach(e => {
    const month = new Date(e.event_date + 'T00:00').toLocaleString('en', { month: 'long' }).toUpperCase()
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(e)
  })
  return byMonth
}
function fmtShortDate(d) {
  if (!d) return 'TBD'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtTime(t) {
  if (!t) return 'TBD'
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}
function getPrefix(e) { return e.location_type === 'away' ? '@' : 'vs.' }

export default function SplitScheduleCard({
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
  const games = getGameEvents(events)
  const byMonth = groupByMonth(games)
  const months = Object.keys(byMonth)
  const hasPhoto = featuredPlayer?.photo_url

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: '#0a0a0a',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
      }}
    >
      {/* Photo panel (left) */}
      <div
        style={{
          width: '42%',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {hasPhoto ? (
          <>
            <img
              src={featuredPlayer.photo_url}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            {/* Right-edge gradient fade */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent 50%, #0a0a0a 100%)',
              }}
            />
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${teamColor}, ${darken(teamColor, 0.6)})`,
            }}
          />
        )}

        {/* Logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 32,
              opacity: 0.7,
              zIndex: 5,
            }}
          />
        )}

        {/* Team name overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24,
              color: '#fff',
              letterSpacing: 1,
            }}
          >
            {teamName || ''}
          </div>
        </div>
      </div>

      {/* Schedule panel (right) */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Season header */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 3,
            color: teamColor,
            textTransform: 'uppercase',
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          {season?.name || ''}
        </div>

        {/* Schedule list */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {months.map(month => (
            <div key={month}>
              {/* Month header */}
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: teamColor,
                  textTransform: 'uppercase',
                  marginTop: 6,
                  marginBottom: 2,
                }}
              >
                {month}
              </div>

              {/* Game rows */}
              {byMonth[month].map((g, i) => {
                const opponent = g.opponent_name || g.opponent || g.title || 'TBD'
                const prefix = getPrefix(g)
                const gameTime = g.start_time || g.time
                const gameDate = g.event_date || g.date

                return (
                  <div
                    key={g.id || `${month}-${i}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 9,
                        fontWeight: 600,
                        color: '#ccc',
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prefix} {opponent}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 8,
                        fontWeight: 600,
                        color: '#555',
                        flexShrink: 0,
                        marginLeft: 6,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtShortDate(gameDate)} {gameTime ? `\u00B7 ${fmtTime(gameTime)}` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
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
