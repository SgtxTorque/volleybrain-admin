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

export default function TakeoverCard({
  event, events, team, organization, season, stats,
  teamColor, teamName, orgName, logoUrl, featuredPlayer,
  format, width, height, sportIcon,
}) {
  const isWide = format === 'wide'
  const hasPhoto = featuredPlayer?.photo_url
  const opponent = event?.opponent_name || event?.opponent || 'TBD'
  const eventDate = event?.event_date || event?.date
  const { dayName, monthDay } = fmtDate(eventDate)
  const formattedTime = fmtTime(event?.event_time || event?.start_time)
  const venue = event?.venue_name || event?.venue || event?.location || 'TBD'

  const gradientOverlay = isWide
    ? `linear-gradient(90deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.9) 30%, ${hexToRgba(teamColor, 0.5)} 55%, transparent 80%)`
    : `linear-gradient(135deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 25%, ${hexToRgba(teamColor, 0.6)} 50%, transparent 75%)`

  return (
    <div style={{
      position: 'relative', width, height,
      overflow: 'hidden', background: '#000',
    }}>
      {/* Photo or fallback */}
      {hasPhoto ? (
        <img src={featuredPlayer.photo_url} alt="" crossOrigin="anonymous" style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'top center',
        }} />
      ) : (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, #0a0a0a 0%, ${darken(teamColor, 0.5)} 100%)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px)',
          }} />
        </>
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: gradientOverlay,
      }} />

      {/* Logo badge */}
      {logoUrl && (
        <img src={logoUrl} alt="" crossOrigin="anonymous" style={{
          position: 'absolute',
          top: 16, ...(isWide ? { left: 20 } : { right: 16 }),
          width: 52, height: 52, objectFit: 'contain',
          zIndex: 10,
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
        }} />
      )}

      {/* Text content */}
      <div style={{
        position: 'absolute', zIndex: 10,
        ...(isWide
          ? { top: '50%', left: 24, transform: 'translateY(-50%)', maxWidth: '50%' }
          : { bottom: 0, left: 0, right: 0, padding: '24px 28px' }),
      }}>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 10, fontWeight: 700,
          letterSpacing: 4, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
        }}>{orgName}</div>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: isWide ? 64 : 52,
          lineHeight: 0.88, letterSpacing: 2,
          color: '#fff',
        }}>{isWide ? 'GAME DAY' : <>GAME<br/>DAY</>}</div>

        <div style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 20, fontWeight: 700,
          color: teamColor,
          textTransform: 'uppercase',
          marginTop: 4,
        }}>{teamName}</div>

        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13, fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          marginTop: 6,
        }}>vs. {opponent}</div>

        <div style={{
          display: 'flex', gap: 14, marginTop: 12,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 11, fontWeight: 700,
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <span>{dayName}, {monthDay}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>{formattedTime}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>{venue}</span>
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: 7, right: 12,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 8, letterSpacing: 3,
        textTransform: 'uppercase',
        color: teamColor, opacity: 0.3, zIndex: 20,
      }}>POWERED BY LYNX</div>
    </div>
  )
}
