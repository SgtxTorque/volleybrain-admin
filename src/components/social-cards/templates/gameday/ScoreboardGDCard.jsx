import { getContrastText, darken, hexToRgba, isLightColor } from '../../cardColorUtils'

function fmtDate(d) {
  if (!d) return 'TBD'
  const dt = new Date(d + 'T00:00:00')
  const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return { dayName, monthDay }
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
  const isWide = format === 'wide'
  const isLight = isLightColor(teamColor)
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const eventDate = event?.event_date || event?.date
  const { dayName, monthDay } = fmtDate(eventDate)
  const formattedTime = fmtTime(event?.event_time || event?.start_time)
  const venue = event?.venue_name || event?.venue || event?.location || 'TBD'

  // Light team colors (like gold) get dark bg; dark team colors get light bg
  const bgColor = isLight ? '#0a0a0a' : '#0a0a0a'
  const nameColor = teamColor

  return (
    <div style={{
      position: 'relative', width, height,
      overflow: 'hidden', background: bgColor,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center',
    }}>
      {/* Top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4, background: teamColor, zIndex: 2,
      }} />

      {/* Logo watermark behind text */}
      {logoUrl && (
        <img src={logoUrl} alt="" crossOrigin="anonymous" style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 220, height: 220,
          objectFit: 'contain', opacity: 0.06, zIndex: 1,
        }} />
      )}

      {/* GAME DAY label */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 13, fontWeight: 700,
        letterSpacing: 8, textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        marginBottom: 10, position: 'relative', zIndex: 2,
      }}>GAME DAY</div>

      {/* TEAM NAME - THE HERO */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: isWide ? 84 : 72,
        lineHeight: 0.85, letterSpacing: 3,
        color: nameColor,
        position: 'relative', zIndex: 2,
        whiteSpace: 'pre-line',
      }}>{teamName.replace(/\s+/g, '\n').toUpperCase()}</div>

      {/* VS. OPPONENT */}
      <div style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: 20, fontWeight: 500,
        textTransform: 'uppercase',
        color: '#ccc',
        marginTop: 8, position: 'relative', zIndex: 2,
      }}>
        <span style={{ fontSize: 13, opacity: 0.4, marginRight: 6 }}>VS.</span>
        {opponent}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 24px',
        background: teamColor,
        display: 'flex', justifyContent: 'center', gap: 20,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 12, fontWeight: 700,
        letterSpacing: 2, textTransform: 'uppercase',
        color: getContrastText(teamColor),
        zIndex: 2,
      }}>
        <span>{dayName}, {monthDay}</span>
        <span style={{ opacity: 0.3 }}>·</span>
        <span>{formattedTime}</span>
        <span style={{ opacity: 0.3 }}>·</span>
        <span>{venue}</span>
      </div>

      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: 48, right: 12,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 8, letterSpacing: 3,
        textTransform: 'uppercase',
        color: teamColor, opacity: 0.25, zIndex: 20,
      }}>POWERED BY LYNX</div>
    </div>
  )
}
