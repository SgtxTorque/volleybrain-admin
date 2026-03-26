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

export default function ProgramLogoCard({
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
  const contrastText = getContrastText(teamColor)
  const contrastBase = contrastText === '#ffffff' ? '#ffffff' : '#000000'

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
      }}
    >
      {/* Hero section (top 40%) — team color with centered logo */}
      <div
        style={{
          position: 'relative',
          height: '40%',
          overflow: 'hidden',
          flexShrink: 0,
          background: teamColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: 60,
              marginBottom: 8,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
            }}
          />
        )}

        {/* Team name */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            color: contrastText,
            letterSpacing: 2,
            lineHeight: 1,
          }}
        >
          {teamName || ''}
        </div>

        {/* Season name */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: hexToRgba(contrastBase, 0.6),
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          {seasonName}
        </div>
      </div>

      {/* Schedule area (bottom 60%) */}
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
                marginTop: 6,
                marginBottom: 3,
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
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  fontSize: rowFontSize,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: rowFontSize,
                    fontWeight: 600,
                    color: '#ccc',
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
                    color: '#555',
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
              color: '#555',
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
