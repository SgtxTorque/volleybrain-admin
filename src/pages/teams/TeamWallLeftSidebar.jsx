// =============================================================================
// TeamWallLeftSidebar — team identity, next event hero, upcoming events, quick actions
// Extracted from TeamWallPage.jsx
// =============================================================================

import {
  ArrowLeft, Calendar, ChevronRight, MessageCircle, BarChart3, Trophy
} from '../../constants/icons'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

function getEventDayLabel(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const eventDate = new Date(dateStr); eventDate.setHours(0, 0, 0, 0)
  const diff = Math.round((eventDate - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  return null
}

export default function TeamWallLeftSidebar({
  team, teamInitials, seasonLabel, sportIcon, gameRecord, upcomingEvents,
  nextGame, headCoach, th, onBack, onNavigate, openTeamChat,
}) {
  const { cardBg, innerBg, borderColor, textPrimary, textMuted, successColor, errorColor, warningColor, shadow, labelStyle, isDark, BRAND } = th
  const totalGames = gameRecord.wins + gameRecord.losses
  const winRate = totalGames > 0 ? Math.round((gameRecord.wins / totalGames) * 100) : 0

  return (
    <aside className="hidden lg:flex flex-col gap-4 p-4 xl:p-5 overflow-y-auto tw-hide-scrollbar" style={{ height: '100%' }}>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 self-start transition-all"
        style={{ fontSize: 18, fontWeight: 500, color: BRAND.sky, borderRadius: 10, padding: '4px 8px', marginBottom: -4 }}
        onMouseEnter={e => e.currentTarget.style.background = isDark ? `${BRAND.sky}15` : BRAND.ice}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Team Hero Header */}
      <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow }}>
        <div className="flex flex-col items-center p-5 gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center" style={{ border: `3px solid ${borderColor}` }}>
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: BRAND.ice }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: BRAND.navy }}>{teamInitials}</span>
              </div>
            )}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: textPrimary, textAlign: 'center', lineHeight: 1.3 }}>{team.name}</h1>
          {seasonLabel && <span style={labelStyle}>{sportIcon} {seasonLabel}</span>}

          {/* Season Record */}
          <div className="w-full pt-3 mt-1" style={{ borderTop: `1px solid ${borderColor}` }}>
            <p style={{ ...labelStyle, marginBottom: 8 }}>Season Record</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <span style={{ fontSize: 36, fontWeight: 900, color: successColor, lineHeight: 1 }}>{gameRecord.wins}</span>
                <p style={labelStyle}>W</p>
              </div>
              <span style={{ fontSize: 24, color: textMuted }}>—</span>
              <div className="text-center">
                <span style={{ fontSize: 36, fontWeight: 900, color: errorColor, lineHeight: 1 }}>{gameRecord.losses}</span>
                <p style={labelStyle}>L</p>
              </div>
            </div>
            <p style={{ fontSize: 18, fontWeight: 400, color: textPrimary, textAlign: 'center', marginTop: 4 }}>
              {totalGames > 0 ? `${winRate}%` : 'No games played'}
            </p>
            {totalGames > 0 && (
              <div className="mt-3 w-full rounded-full overflow-hidden" style={{ height: 5, background: isDark ? BRAND.graphite : BRAND.silver }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${winRate}%`, background: 'linear-gradient(90deg, #10B981, #4BB9EC)' }} />
              </div>
            )}
            {gameRecord.recentForm.length > 0 && (
              <div className="mt-3">
                <p style={{ ...labelStyle, marginBottom: 6 }}>Recent Form</p>
                <div className="flex items-center justify-center gap-2">
                  {gameRecord.recentForm.map((result, i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{
                      background: result === 'win' ? successColor : result === 'loss' ? errorColor : warningColor,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Event Hero Card */}
      {nextGame && (() => {
        const isGame = nextGame.event_type === 'game' || nextGame.event_type === 'tournament'
        const bgImage = isGame ? '/images/sports-game.jpg' : '/images/sports-practice.jpg'
        const dayLabel = getEventDayLabel(nextGame.event_date)
        return (
          <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', minHeight: 200, border: `1px solid ${borderColor}`, boxShadow: shadow }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.15) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 200 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 14, fontWeight: 600, background: '#4BB9EC', color: '#fff' }}>
                  {(nextGame.event_type || 'GAME').toUpperCase()}
                </span>
                {dayLabel && <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 14, fontWeight: 600, background: '#F59E0B', color: '#fff' }}>{dayLabel}</span>}
              </div>
              <p style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>{nextGame.event_type === 'practice' ? 'Practice' : 'Game Day'}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{nextGame.opponent ? `vs ${nextGame.opponent}` : nextGame.title || 'Practice'}</p>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {nextGame.event_date && <span>📅 {new Date(nextGame.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>}
                {nextGame.event_time && <span>🕐 {formatTime12(nextGame.event_time)}</span>}
                {nextGame.location && <span>📍 {nextGame.location}</span>}
              </div>
              {nextGame.location && (
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextGame.location || '')}`, '_blank')}
                  style={{ marginTop: 12, padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
                    color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}>
                  📍 Get Directions
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span style={labelStyle}>Upcoming</span>
          <button onClick={() => onNavigate?.('schedule')} className="flex items-center gap-1 transition-all"
            style={{ fontSize: 16, fontWeight: 500, color: BRAND.sky }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Full Calendar <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow, overflow: 'hidden' }}>
          {upcomingEvents.slice(0, 3).map((event, i) => {
            const ed = new Date((event.event_date || '') + 'T00:00:00')
            return (
              <div key={event.id} className="flex items-center gap-3 p-3.5"
                style={{ borderBottom: i < Math.min(upcomingEvents.length, 3) - 1 ? `1px solid ${borderColor}` : 'none' }}>
                <div className="text-center min-w-[36px]">
                  <p style={{ ...labelStyle, color: BRAND.sky, fontSize: 14 }}>{ed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: textPrimary, lineHeight: 1 }}>{ed.getDate()}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: 18, fontWeight: 500, color: textPrimary }} className="truncate">
                    {event.title || event.event_type}{event.opponent ? ` vs ${event.opponent}` : ''}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 500, color: textMuted }}>
                    {event.event_time && formatTime12(event.event_time)}{event.location ? ` · ${event.location}` : ''}
                  </p>
                </div>
              </div>
            )
          })}
          {upcomingEvents.length === 0 && (
            <div className="p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto" style={{ color: textMuted }} />
              <p style={{ fontSize: 16, fontWeight: 500, color: textMuted, marginTop: 8 }}>No upcoming events</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Quick Actions</span>
        <div className="flex flex-col gap-1">
          {[
            { icon: Calendar, label: 'View Schedule', action: () => onNavigate?.('schedule') },
            { icon: MessageCircle, label: 'Team Chat', action: openTeamChat },
            { icon: BarChart3, label: 'Standings', action: () => onNavigate?.('standings') },
            { icon: Trophy, label: 'Achievements', action: () => onNavigate?.('achievements') },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className="flex items-center gap-3 w-full p-2.5 transition-all"
              style={{ borderRadius: 10, fontSize: 18, fontWeight: 500, color: textPrimary }}
              onMouseEnter={e => e.currentTarget.style.background = innerBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <item.icon className="w-[18px] h-[18px]" style={{ color: BRAND.slate }} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
