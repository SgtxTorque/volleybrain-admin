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

export default function ProgramLightCard({
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
  const grouped = groupByMonth(games)
  const months = Object.keys(grouped)
  const totalGames = games.length
  const rowFontSize = totalGames > 20 ? 8 : totalGames > 15 ? 9 : 10
  const dateFontSize = totalGames > 20 ? 7 : totalGames > 15 ? 8 : 9
  const seasonName = season?.name || season?.label || ''

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: '#fafaf8',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `2px solid ${teamColor}`,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: 36,
              height: 36,
              objectFit: 'contain',
            }}
          />
        )}

        {/* Team name */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 22,
            color: '#1a1a2e',
            letterSpacing: 1,
            lineHeight: 1,
          }}
        >
          {teamName || ''}
        </div>

        {/* Season label — pushed to right */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            color: '#999',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginLeft: 'auto',
          }}
        >
          {seasonName}
        </div>
      </div>

      {/* Schedule area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '8px 16px',
        }}
      >
        {months.map((month) => (
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
                padding: '4px 0',
                borderBottom: `1px solid ${hexToRgba(teamColor, 0.2)}`,
                marginTop: 4,
              }}
            >
              {month}
            </div>
            {/* Game rows */}
            {grouped[month].map((e, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '3px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: rowFontSize,
                    fontWeight: 600,
                    color: '#333',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {e.event_type === 'tournament' && (
                    <span style={{ color: teamColor, fontSize: rowFontSize + 2 }}>*</span>
                  )}
                  {getPrefix(e)} {e.opponent_name || e.opponent || 'TBD'}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: dateFontSize,
                    fontWeight: 600,
                    color: '#999',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtShortDate(e.event_date)} {fmtTime(e.start_time)}
                </div>
              </div>
            ))}
          </div>
        ))}

        {games.length === 0 && (
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textAlign: 'center',
              marginTop: 32,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            No games scheduled
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          textAlign: 'center',
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 2,
          color: '#ccc',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        {orgName || 'POWERED BY LYNX'}
      </div>
    </div>
  )
}
