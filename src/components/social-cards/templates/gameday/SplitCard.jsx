import { getContrastText, darken, lighten, hexToRgba, isLightColor } from '../../cardColorUtils'

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

export default function SplitCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const isWide = format === 'wide'
  const hasPhoto = featuredPlayer?.photo_url
  const isLight = isLightColor(teamColor)
  const panelBg = isLight ? '#111' : teamColor
  const textColor = isLight ? '#fff' : getContrastText(teamColor)
  const accentColor = isLight ? teamColor : 'rgba(255,255,255,0.8)'
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const eventDate = event?.event_date || event?.date
  const { dayName, monthDay } = fmtDate(eventDate)
  const formattedTime = fmtTime(event?.event_time || event?.start_time)
  const venue = event?.venue_name || event?.venue || event?.location || 'TBD'

  return (
    <div style={{
      position: 'relative', width, height,
      overflow: 'hidden', background: '#000',
    }}>
      {/* Photo panel (right side) */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '60%', zIndex: 1, overflow: 'hidden',
      }}>
        {hasPhoto ? (
          <>
            <img src={featuredPlayer.photo_url} alt="" crossOrigin="anonymous" style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(90deg, ${panelBg} 0%, transparent 35%)`,
            }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, ${darken(teamColor, 0.3)} 0%, ${darken(teamColor, 0.6)} 100%)`,
            }} />
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.08,
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.1) 15px, rgba(255,255,255,0.1) 17px)',
            }} />
          </div>
        )}
      </div>

      {/* Left text panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '48%', background: panelBg,
        zIndex: 2, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: 28,
      }}>
        {/* Skewed edge */}
        <div style={{
          position: 'absolute', top: 0, right: -50, bottom: 0,
          width: 100, background: panelBg,
          transform: isWide ? 'skewX(-6deg)' : 'skewX(-8deg)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontFamily: "'Teko', sans-serif",
            fontSize: 13, fontWeight: 600,
            letterSpacing: 6, textTransform: 'uppercase',
            color: accentColor, opacity: isLight ? 1 : 0.6,
          }}>GAME DAY</div>

          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isWide ? 48 : 44, lineHeight: 0.92,
            color: textColor, marginTop: 2,
          }}>{teamName.toUpperCase()}</div>

          <div style={{
            width: 30, height: 3,
            background: accentColor,
            margin: '10px 0',
          }} />

          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 15, fontWeight: 600,
            color: isLight ? '#ccc' : 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase',
          }}>vs. {opponent}</div>

          <div style={{
            marginTop: 14, display: 'flex', flexDirection: 'column', gap: 3,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase',
            color: isLight ? '#666' : 'rgba(255,255,255,0.45)',
          }}>
            <span>{dayName}, {monthDay} · {formattedTime}</span>
            <span>{venue}</span>
          </div>
        </div>
      </div>

      {/* Logo */}
      {logoUrl && (
        <img src={logoUrl} alt="" crossOrigin="anonymous" style={{
          position: 'absolute', bottom: 14, left: 28,
          width: 34, opacity: 0.35, zIndex: 10,
        }} />
      )}

      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: 7, right: 10,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 8, letterSpacing: 3,
        textTransform: 'uppercase',
        opacity: 0.3, zIndex: 20, color: teamColor,
      }}>POWERED BY LYNX</div>
    </div>
  )
}
