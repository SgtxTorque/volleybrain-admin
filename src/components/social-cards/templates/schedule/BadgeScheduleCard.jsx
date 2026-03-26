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

export default function BadgeScheduleCard({
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

  // Build a flat list of items for the 2-col grid (month headers + game entries)
  const gridItems = []
  months.forEach(month => {
    gridItems.push({ type: 'header', month })
    byMonth[month].forEach(g => {
      gridItems.push({ type: 'game', game: g })
    })
  })

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
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top badge area */}
      <div
        style={{
          padding: '20px 0 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Decorative ring */}
        <div
          style={{
            width: 80,
            height: 80,
            border: `2px solid ${hexToRgba(teamColor, 0.2)}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 50 }}
            />
          )}
        </div>

        {/* Team name */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            color: '#fff',
            letterSpacing: 2,
            marginTop: 8,
          }}
        >
          {teamName || ''}
        </div>

        {/* Season */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 3,
            color: teamColor,
            textTransform: 'uppercase',
          }}
        >
          {season?.name || ''}
        </div>
      </div>

      {/* Schedule grid */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '0 16px 8px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 12px',
          }}
        >
          {gridItems.map((item, i) => {
            if (item.type === 'header') {
              return (
                <div
                  key={`mh-${item.month}-${i}`}
                  style={{
                    gridColumn: '1 / -1',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: teamColor,
                    textTransform: 'uppercase',
                    padding: '5px 0 2px',
                    borderBottom: `1px solid ${hexToRgba(teamColor, 0.15)}`,
                  }}
                >
                  {item.month}
                </div>
              )
            }

            const g = item.game
            const opponent = g.opponent_name || g.opponent || g.title || 'TBD'
            const prefix = getPrefix(g)

            return (
              <div
                key={`ge-${g.id || i}`}
                style={{
                  padding: '2px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#bbb',
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
                    marginLeft: 4,
                  }}
                >
                  {fmtShortDate(g.event_date || g.date)}
                </span>
              </div>
            )
          })}
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
