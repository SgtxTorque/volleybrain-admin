import React from 'react'
import { hexToRgba } from '../../cardColorUtils'

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

export default function MinimalScheduleCard({
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

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 4,
          background: teamColor,
          flexShrink: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      >
        {/* Left: Logo + Team name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 28, height: 28 }}
            />
          )}
          <div
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: '#222',
              textTransform: 'uppercase',
            }}
          >
            {teamName || ''}
          </div>
        </div>

        {/* Right: Season name */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            color: '#999',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {season?.name || ''}
        </div>
      </div>

      {/* Schedule rows */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '4px 20px',
        }}
      >
        {months.map(month => (
          <div key={month}>
            {/* Month header */}
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 2,
                color: teamColor,
                textTransform: 'uppercase',
                padding: '6px 0 2px',
                borderBottom: `1px solid ${hexToRgba(teamColor, 0.15)}`,
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
              const venue = g.venue || g.location || ''

              return (
                <div
                  key={g.id || `${month}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {/* Date pill */}
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      background: hexToRgba(teamColor, 0.08),
                      borderRadius: 3,
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 9,
                      fontWeight: 700,
                      color: teamColor,
                      marginRight: 10,
                      minWidth: 55,
                      textAlign: 'center',
                    }}
                  >
                    {fmtShortDate(gameDate)}
                  </span>

                  {/* Opponent */}
                  <span
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#333',
                      textTransform: 'uppercase',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {prefix} {opponent}
                  </span>

                  {/* Time */}
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 9,
                      fontWeight: 600,
                      color: '#999',
                      marginLeft: 'auto',
                      flexShrink: 0,
                    }}
                  >
                    {fmtTime(gameTime)}
                  </span>

                  {/* Venue */}
                  {venue && (
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 8,
                        color: '#bbb',
                        marginLeft: 8,
                        maxWidth: 100,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {venue}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '6px 20px',
          textAlign: 'center',
          borderTop: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#ccc',
            textTransform: 'uppercase',
          }}
        >
          {orgName || 'Powered by Lynx'}
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
