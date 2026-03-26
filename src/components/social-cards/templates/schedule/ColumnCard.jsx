import React from 'react'
import { getContrastText, darken, lighten, hexToRgba, isLightColor } from '../../cardColorUtils'

// ---- Shared schedule data helpers ----
function getGameEvents(events) {
  return (events || [])
    .filter(e => e.event_type === 'game' || e.event_type === 'tournament')
    .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''))
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
function fmtDate(d) {
  if (!d) return 'TBD'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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

/**
 * Distribute month groups into N columns as evenly as possible by game count.
 * Preserves month order.
 */
function distributeToColumns(grouped, months, numCols) {
  const columns = Array.from({ length: numCols }, () => [])
  const colCounts = Array(numCols).fill(0)

  months.forEach((month) => {
    // Find the column with the fewest games so far
    let minIdx = 0
    for (let i = 1; i < numCols; i++) {
      if (colCounts[i] < colCounts[minIdx]) minIdx = i
    }
    columns[minIdx].push(month)
    colCounts[minIdx] += grouped[month].length + 1 // +1 for the header
  })

  return columns
}

export default function ColumnCard({
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
  const games = getGameEvents(events)
  const grouped = groupByMonth(games)
  const months = Object.keys(grouped)
  const columns = distributeToColumns(grouped, months, 3)
  const seasonName = season?.name || season?.label || ''
  const contrastText = getContrastText(teamColor)
  const contrastBase = contrastText === '#ffffff' ? '#ffffff' : '#000000'

  // Extract season year from the name or first event
  const seasonYear = (() => {
    const yearMatch = seasonName.match(/\d{4}/)
    if (yearMatch) return yearMatch[0]
    if (games.length > 0 && games[0].event_date) {
      return new Date(games[0].event_date + 'T00:00:00').getFullYear().toString()
    }
    return new Date().getFullYear().toString()
  })()

  const leftPanelWidth = isWide ? '25%' : '30%'

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
      {/* Left identity panel */}
      <div
        style={{
          width: leftPanelWidth,
          background: teamColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            style={{
              width: 50,
              marginBottom: 10,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
            }}
          />
        )}

        {/* Season year */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 48,
            color: contrastText,
            lineHeight: 0.85,
          }}
        >
          {seasonYear}
        </div>

        {/* Team name */}
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: hexToRgba(contrastBase, 0.7),
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          {teamName || ''}
        </div>

        {/* Org name */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 8,
            fontWeight: 700,
            color: hexToRgba(contrastBase, 0.4),
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          {orgName || ''}
        </div>
      </div>

      {/* Schedule grid (right) — 3 columns */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 1,
          padding: '12px 16px',
          overflow: 'hidden',
        }}
      >
        {columns.map((colMonths, colIdx) => (
          <div
            key={colIdx}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              overflow: 'hidden',
            }}
          >
            {colMonths.map((month) => (
              <div key={month}>
                {/* Column month header */}
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: teamColor,
                    textTransform: 'uppercase',
                    padding: '4px 0',
                    borderBottom: `1px solid ${hexToRgba(teamColor, 0.2)}`,
                  }}
                >
                  {month}
                </div>
                {/* Game rows */}
                {grouped[month].map((e, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '2px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      fontSize: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 8,
                        fontWeight: 600,
                        color: '#aaa',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {e.event_type === 'tournament' && (
                        <span style={{ color: teamColor, fontSize: 10 }}>*</span>
                      )}
                      {getPrefix(e)} {e.opponent_name || e.opponent || 'TBD'}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 7,
                        color: '#555',
                      }}
                    >
                      {fmtShortDate(e.event_date)} {fmtTime(e.start_time)}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {colMonths.length === 0 && (
              <div style={{ flex: 1 }} />
            )}
          </div>
        ))}
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
