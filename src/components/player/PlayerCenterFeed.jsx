import { useState, useEffect, useMemo } from 'react'
import {
  Trophy, ChevronRight, Lock, Calendar, Clock, MapPin,
  Heart, MessageCircle, Camera, Award, Megaphone,
  Plus, Check
} from '../../constants/icons'
import { supabase } from '../../lib/supabase'

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return (hr % 12 || 12) + ':' + m + ' ' + (hr >= 12 ? 'PM' : 'AM')
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const mins = Math.floor((now - d) / 60000)
  if (mins < 0) {
    const days = Math.ceil(Math.abs(mins) / 1440)
    return days === 1 ? 'Tomorrow' : `In ${days} days`
  }
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  const diffMs = d - now
  if (diffMs < 0) return 'Today'
  const days = Math.ceil(diffMs / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

const RARITY_CONFIG = {
  legendary: { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', label: 'Legendary' },
  epic: { bg: 'linear-gradient(135deg, #A855F7, #7C3AED)', label: 'Epic' },
  rare: { bg: 'linear-gradient(135deg, #3B82F6, #2563EB)', label: 'Rare' },
  common: { bg: 'linear-gradient(135deg, #6B7280, #4B5563)', label: 'Common' },
}

/**
 * PlayerCenterFeed — Center column (flex-1), mobile scroll parity
 * Sections: NextUp · LastGameStats · ActiveChallenge · TheDrop ·
 * ChatPeek · QuickProps · TrophyCase · Events · ClosingMascot
 * Dark theme: #0D1B3E bg, #10284C cards
 */
export default function PlayerCenterFeed({
  viewingPlayer,
  displayName,
  primaryTeam,
  level,
  xp,
  xpToNext,
  gamesPlayed,
  seasonStats,
  gameStats,
  badges,
  upcomingEvents,
  overallRating,
  onNavigate,
  navigateToTeamWall,
  userId,
  showToast,
}) {
  const [rsvpStatuses, setRsvpStatuses] = useState({})

  // Load RSVP statuses for upcoming events
  useEffect(() => {
    if (!viewingPlayer?.id || !upcomingEvents?.length) return
    let cancelled = false

    async function loadRsvps() {
      try {
        const eventIds = upcomingEvents.map(e => e.id)
        const { data } = await supabase
          .from('event_rsvps')
          .select('event_id, status')
          .eq('player_id', viewingPlayer.id)
          .in('event_id', eventIds)
        if (!cancelled && data) {
          const map = {}
          data.forEach(r => { map[r.event_id] = r.status })
          setRsvpStatuses(map)
        }
      } catch { /* silently degrade */ }
    }

    loadRsvps()
    return () => { cancelled = true }
  }, [viewingPlayer?.id, upcomingEvents?.length])

  async function handleRsvp(eventId, status) {
    if (!viewingPlayer?.id) return
    const prev = rsvpStatuses[eventId]
    setRsvpStatuses(s => ({ ...s, [eventId]: status }))
    try {
      const { data: existing } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('player_id', viewingPlayer.id)
        .maybeSingle()
      if (existing) {
        await supabase.from('event_rsvps').update({ status, updated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('event_rsvps').insert({ event_id: eventId, player_id: viewingPlayer.id, status, responded_by: userId })
      }
    } catch {
      setRsvpStatuses(s => ({ ...s, [eventId]: prev }))
      showToast?.('Error updating RSVP', 'error')
    }
  }

  // Motivational welcome
  const welcomeMessage = useMemo(() => {
    const firstName = viewingPlayer?.first_name || 'Player'
    const nextGame = upcomingEvents?.find(e => e.event_type === 'game')
    if (nextGame && countdownText(nextGame.event_date) === 'Tomorrow') {
      return { main: `Game day tomorrow, ${firstName}!`, sub: 'Lock in and get ready' }
    }
    if (nextGame && countdownText(nextGame.event_date) === 'Today') {
      return { main: `It's game day, ${firstName}!`, sub: 'Time to show what you\'ve got' }
    }
    if (gamesPlayed > 5) {
      return { main: `Keep grinding, ${firstName}!`, sub: `Level ${level} — ${xpToNext} XP to Level ${level + 1}` }
    }
    return { main: `What's up, ${firstName}!`, sub: 'Your season dashboard is ready' }
  }, [viewingPlayer, upcomingEvents, gamesPlayed, level, xpToNext])

  const nextEvent = upcomingEvents?.[0] || null
  const lastGame = gameStats?.[0] || null
  const streak = gamesPlayed > 0 ? Math.min(gamesPlayed * 2 + 3, 30) : 0

  // TheDrop items: recent badges + mock shoutouts/stats
  const dropItems = useMemo(() => {
    const items = []
    badges?.slice(0, 2).forEach(b => {
      items.push({ type: 'badge', icon: b.achievement?.icon || '🏆', title: `You earned ${b.achievement?.name || 'a badge'}!`, sub: timeAgo(b.awarded_at || b.created_at) })
    })
    if (items.length < 3) {
      items.push({ type: 'shoutout', icon: '💪', title: 'Coach Carlos gave you a shoutout!', sub: 'Coachable · 2d ago' })
    }
    if (items.length < 3) {
      items.push({ type: 'stats', icon: '📊', title: 'Your kill rate is up 12% this week', sub: 'Season stats updated' })
    }
    return items
  }, [badges])

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: '#0D1B3E' }}>
      {/* ── Dark Header Band ── */}
      <div className="px-8 pt-6 pb-6 shrink-0">
        <p className="text-[10px] font-bold tracking-[2px] uppercase mb-1" style={{ color: 'rgba(75,185,236,0.50)' }}>Player Dashboard</p>
        <h1 className="text-[28px] font-black leading-none tracking-wide" style={{ color: '#fff' }}>
          {welcomeMessage.main}
        </h1>
        <p className="text-[13px] font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {welcomeMessage.sub}
        </p>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

        {/* ── 1. NEXT UP Card (matches mobile NextUpCard — pulsing green dot + RSVP) ── */}
        {nextEvent ? (() => {
          const isGame = nextEvent.event_type === 'game'
          const eventDate = new Date(nextEvent.event_date + 'T00:00:00')
          const rsvp = rsvpStatuses[nextEvent.id]

          return (
            <div
              className="rounded-[18px] p-4 relative"
              style={{ background: '#10284C', border: '1px solid rgba(75,185,236,0.15)' }}
            >
              {/* Header: NEXT UP + RSVP buttons */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
                  <span className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: '#4BB9EC' }}>Next Up</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { status: 'going', label: "I'M READY", activeLabel: 'GOING', activeBg: '#22C55E' },
                    { status: 'not_going', label: "CAN'T MAKE IT", activeLabel: "CAN'T", activeBg: 'transparent' },
                  ].map(opt => {
                    const isActive = rsvp === opt.status
                    return (
                      <button
                        key={opt.status}
                        onClick={() => handleRsvp(nextEvent.id, opt.status)}
                        className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold tracking-[0.5px] transition"
                        style={{
                          background: isActive ? opt.activeBg : (opt.status === 'going' ? '#4BB9EC' : 'transparent'),
                          color: isActive
                            ? (opt.status === 'not_going' ? 'rgba(255,255,255,0.30)' : '#0D1B3E')
                            : (opt.status === 'going' ? '#0D1B3E' : 'rgba(255,255,255,0.30)'),
                          border: opt.status === 'not_going' ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                        }}
                      >
                        {isActive ? opt.activeLabel : opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Event info */}
              <h3 className="text-xl font-extrabold mb-1" style={{ color: '#fff' }}>
                {isGame ? `vs ${nextEvent.opponent_name || 'TBD'}` : nextEvent.title || 'Team Practice'}
              </h3>
              <p className="text-[13px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                {nextEvent.event_time ? ` · ${formatTime12(nextEvent.event_time)}` : ''}
              </p>
              {nextEvent.venue_name && (
                <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  {nextEvent.venue_name}
                </p>
              )}
              {streak >= 2 && (
                <p className="text-[11px] font-semibold mt-2" style={{ color: '#FFD700' }}>
                  🔥 {streak}-game streak — keep it alive!
                </p>
              )}
            </div>
          )
        })() : (
          <div className="text-center py-4">
            <span className="text-[28px] block mb-1.5" style={{ opacity: 0.4 }}>📅</span>
            <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.40)' }}>No upcoming events</p>
          </div>
        )}

        {/* ── 2. LAST GAME STATS (matches mobile — 4-col stat grid, 22px display numbers) ── */}
        {lastGame && (
          <div
            className="rounded-[18px] p-4"
            style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[1.2px] mb-3.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Last Game Highlights
            </p>
            <div className="flex gap-2">
              {[
                { label: 'Kills', value: lastGame.kills || 0 },
                { label: 'Aces', value: lastGame.aces || 0 },
                { label: 'Digs', value: lastGame.digs || 0 },
                { label: 'Blocks', value: lastGame.blocks || 0 },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="flex-1 py-3 rounded-xl text-center player-fade-up"
                  style={{ background: 'rgba(255,255,255,0.03)', animationDelay: `${i * 0.1}s` }}
                >
                  <p className="text-[22px] font-black leading-none" style={{ color: '#fff' }}>{stat.value}</p>
                  <p className="text-[9px] font-semibold uppercase mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
            {/* Personal best callout */}
            {lastGame.kills > 0 && gamesPlayed > 1 && lastGame.kills > (seasonStats?.total_kills || 0) / Math.max(gamesPlayed, 1) * 1.5 && (
              <p className="text-xs font-bold text-center mt-3" style={{ color: '#FFD700' }}>
                New personal best in Kills!
              </p>
            )}
          </div>
        )}

        {/* ── 3. ACTIVE CHALLENGE Card (matches mobile — gold bordered, progress bar) ── */}
        {gamesPlayed > 0 && (
          <div
            className="rounded-[18px] p-4"
            style={{ background: '#10284C', border: '1px solid rgba(255,215,0,0.20)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">⚡</span>
              <span className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: '#FFD700' }}>Active Challenge</span>
              <span className="flex-1" />
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>3d left</span>
            </div>
            <p className="text-sm font-semibold truncate mb-2.5" style={{ color: '#fff' }}>
              Hit 10 aces this week
            </p>
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full" style={{ width: '40%', background: '#FFD700' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>4/10 aces</span>
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,215,0,0.40)' }}>+150 XP</span>
            </div>
          </div>
        )}

        {/* ── 4. THE DROP (matches mobile — staggered notification cards) ── */}
        {dropItems.length > 0 && (
          <div className="space-y-2">
            {dropItems.map((item, i) => {
              const isBadge = item.type === 'badge'
              const isShoutout = item.type === 'shoutout'
              return (
                <div
                  key={i}
                  className="rounded-[18px] p-3.5 flex items-start gap-3 player-fade-up"
                  style={{
                    background: isBadge ? 'rgba(255,215,0,0.06)' : isShoutout ? 'rgba(168,85,247,0.08)' : '#10284C',
                    border: `1px solid ${isBadge ? 'rgba(255,215,0,0.20)' : isShoutout ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(75,185,236,0.12)' }}
                  >
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.80)' }}>
                      {item.title}
                    </p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── 5. CHAT PEEK (matches mobile — flat horizontal row) ── */}
        <button
          onClick={() => primaryTeam && navigateToTeamWall?.(primaryTeam.id)}
          className="w-full flex items-center gap-2.5 py-3 hover:opacity-80 transition"
        >
          <span className="text-lg" style={{ opacity: 0.4 }}>💬</span>
          <span className="text-xs font-semibold truncate flex-1 text-left" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Open team chat
          </span>
          <span className="text-lg" style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        </button>

        {/* ── 6. QUICK PROPS ROW (matches mobile — gold CTA) ── */}
        <button
          onClick={() => onNavigate?.('achievements')}
          className="w-full flex items-center gap-2.5 rounded-xl px-4 py-3 hover:brightness-110 transition"
          style={{
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.15)',
          }}
        >
          <span className="text-lg">⭐</span>
          <span className="text-xs font-bold flex-1 text-left" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Who balled out today? Give props ›
          </span>
        </button>

        {/* ── 7. TROPHY CASE (rarity-gradient badge cards) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: 'rgba(255,255,255,0.15)' }}>Trophy Case</p>
            {badges.length > 0 && (
              <button onClick={() => onNavigate?.('achievements')} className="text-[10px] font-bold hover:opacity-80 flex items-center gap-1" style={{ color: '#4BB9EC' }}>
                View All <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {badges.length > 0 ? (
              <>
                {badges.slice(0, 5).map((b, idx) => {
                  const r = RARITY_CONFIG[b.achievement?.rarity] || RARITY_CONFIG.common
                  return (
                    <div
                      key={b.id || idx}
                      className="w-[120px] shrink-0 rounded-[18px] overflow-hidden relative"
                      style={{
                        height: 160,
                        background: r.bg,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      <div
                        className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.8)' }}
                      >
                        {r.label}
                      </div>
                      <div className="flex items-center justify-center h-[55%]">
                        <span className="text-4xl drop-shadow-lg">{b.achievement?.icon || '🏆'}</span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-2.5" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                        <p className="text-white font-bold text-xs leading-tight">{b.achievement?.name || 'Achievement'}</p>
                      </div>
                    </div>
                  )
                })}
                {badges.length < 5 && Array.from({ length: 5 - badges.length }).map((_, i) => (
                  <div
                    key={`locked-${i}`}
                    className="w-[120px] shrink-0 rounded-[18px] flex flex-col items-center justify-center gap-2"
                    style={{ height: 160, background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Lock className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.15)' }}>Locked</span>
                  </div>
                ))}
              </>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`locked-${i}`}
                  className="w-[120px] shrink-0 rounded-[18px] flex flex-col items-center justify-center gap-2"
                  style={{ height: 160, background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Lock className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.15)' }}>Locked</span>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
            {badges.length}/20 Badges Earned
          </p>
        </div>

        {/* ── 8. Upcoming Events (remaining after NextUp) ── */}
        {upcomingEvents?.slice(1, 3).map(event => {
          const isGame = event.event_type === 'game'
          const eventDate = new Date(event.event_date + 'T00:00:00')
          const isToday = eventDate.toDateString() === new Date().toDateString()
          const rsvp = rsvpStatuses[event.id]

          return (
            <div
              key={event.id}
              className="rounded-[18px] p-4"
              style={{
                background: isGame ? 'linear-gradient(135deg, rgba(239,68,68,0.08), #10284C)' : '#10284C',
                border: isToday ? '1px solid #4BB9EC' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-[18px] flex flex-col items-center justify-center shrink-0"
                  style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-[10px] font-bold uppercase leading-none" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    {eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-xl font-black leading-none" style={{ color: '#fff' }}>
                    {eventDate.getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{
                        color: isGame ? '#ef4444' : '#4BB9EC',
                        background: isGame ? 'rgba(239,68,68,0.1)' : 'rgba(75,185,236,0.10)',
                      }}
                    >
                      {isGame ? 'GAME' : 'PRACTICE'}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>
                    {isGame ? `vs ${event.opponent_name || 'TBD'}` : event.title || 'Team Practice'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    {event.event_time && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime12(event.event_time)}</span>
                    )}
                    {event.venue_name && (
                      <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {event.venue_name}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider shrink-0" style={{ color: isToday ? '#4BB9EC' : 'rgba(255,255,255,0.30)' }}>
                  {countdownText(event.event_date)}
                </span>
              </div>

              {/* RSVP Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { status: 'going', label: 'Going', icon: '✓' },
                  { status: 'maybe', label: 'Maybe', icon: '?' },
                  { status: 'not_going', label: "Can't", icon: '✗' },
                ].map(opt => {
                  const isActive = rsvp === opt.status
                  return (
                    <button
                      key={opt.status}
                      onClick={() => handleRsvp(event.id, opt.status)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-center transition"
                      style={{
                        background: isActive ? 'rgba(75,185,236,0.15)' : '#0D1B3E',
                        color: isActive ? '#4BB9EC' : 'rgba(255,255,255,0.30)',
                        border: isActive ? '1px solid #4BB9EC' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* ── 9. CLOSING MASCOT (matches mobile ClosingMascot — 🐱 + XP motivation) ── */}
        <div className="text-center pt-2 pb-6">
          <span className="text-4xl block mb-2.5" style={{ opacity: 0.5 }}>🐱</span>
          <p className="text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {xpToNext} XP to Level {level + 1}
          </p>
          <p className="text-xs font-medium mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
            {gamesPlayed > 0 ? 'Keep grinding — every play counts' : 'Play your first game to start leveling up'}
          </p>
        </div>

      </div>
    </div>
  )
}
