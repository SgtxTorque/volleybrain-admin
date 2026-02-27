import { useState, useEffect, useMemo } from 'react'
import {
  Trophy, ChevronRight, Lock, Calendar, Clock, MapPin,
  Heart, MessageCircle, Camera, Award, Megaphone,
  Plus, Swords, Check
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

// Mock shoutouts for feed (TODO: Wire to real shoutouts table)
const MOCK_SHOUTOUTS = [
  { id: 'mock-s1', from: 'Coach Carlos', category: 'Coachable', icon: '💪', time: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'mock-s2', from: 'Sarah J.', category: 'Team Player', icon: '⭐', time: new Date(Date.now() - 86400000 * 5).toISOString() },
]

// Mock stories (TODO: Wire to highlights data)
const STORIES = [
  { id: 'add', icon: Plus, label: '+Add', isAdd: true },
  { id: 'game', icon: Swords, label: 'Game', hasNew: true },
  { id: 'photo', icon: Camera, label: 'Photo', hasNew: true },
  { id: 'badge', icon: Award, label: 'Badge', hasNew: false },
  { id: 'shout', icon: Megaphone, label: 'Shout', hasNew: false },
  { id: 'team', icon: MessageCircle, label: 'Team', hasNew: false },
]

/**
 * PlayerCenterFeed — Center column (flex-1)
 * Welcome, stories bar, activity feed, trophy case
 * ALL colors via CSS variables (--player-*)
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

  // Build activity feed — merge events, games, badges, mock shoutouts
  const feedItems = useMemo(() => {
    const items = []

    // Upcoming events with RSVP
    upcomingEvents?.slice(0, 3).forEach(event => {
      items.push({ type: 'event', data: event, time: event.event_date, isFuture: true })
    })

    // Game recaps
    gameStats?.slice(0, 3).forEach(gs => {
      items.push({ type: 'game', data: gs, time: gs.event?.event_date || gs.created_at })
    })

    // Badge earned
    badges?.slice(0, 2).forEach(b => {
      items.push({ type: 'badge', data: b, time: b.earned_at || b.created_at })
    })

    // Mock shoutouts
    MOCK_SHOUTOUTS.forEach(s => {
      items.push({ type: 'shoutout', data: s, time: s.time })
    })

    // Sort: future events first, then most recent
    items.sort((a, b) => {
      if (a.isFuture && !b.isFuture) return -1
      if (!a.isFuture && b.isFuture) return 1
      return new Date(b.time || 0) - new Date(a.time || 0)
    })

    return items.slice(0, 10)
  }, [upcomingEvents, gameStats, badges])

  // Motivational welcome message
  const welcomeMessage = useMemo(() => {
    const firstName = viewingPlayer?.first_name || 'Player'
    const nextGame = upcomingEvents?.find(e => e.event_type === 'game')
    if (nextGame && countdownText(nextGame.event_date) === 'Tomorrow') {
      return { main: `Game day tomorrow, ${firstName}!`, sub: `Lock in and get ready` }
    }
    if (nextGame && countdownText(nextGame.event_date) === 'Today') {
      return { main: `It's game day, ${firstName}!`, sub: `Time to show what you've got` }
    }
    if (gamesPlayed > 5) {
      return { main: `Keep grinding, ${firstName}!`, sub: `Level ${level} — ${xpToNext} XP to Level ${level + 1}` }
    }
    return { main: `What's up, ${firstName}!`, sub: `Your season dashboard is ready` }
  }, [viewingPlayer, upcomingEvents, gamesPlayed, level, xpToNext])

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0" style={{ background: 'var(--player-bg)' }}>

      {/* Row 1: Motivational Welcome */}
      <div className="player-fade-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--player-text)' }}>{welcomeMessage.main}</h1>
        <p className="text-sm" style={{ color: 'var(--player-text-muted)' }}>{welcomeMessage.sub}</p>
      </div>

      {/* Row 2: Stories/Highlights Bar */}
      <div className="flex gap-4 overflow-x-auto pb-2 player-fade-up" style={{ scrollbarWidth: 'none' }}>
        {STORIES.map(story => {
          const Icon = story.icon
          return (
            <button key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{
                  background: story.isAdd ? 'var(--player-bg)' : 'var(--player-card)',
                  border: story.hasNew
                    ? '2px solid var(--player-accent)'
                    : story.isAdd
                      ? '2px dashed var(--player-text-muted)'
                      : '2px solid var(--player-border)',
                }}
              >
                <Icon className="w-6 h-6" style={{ color: story.isAdd ? 'var(--player-accent)' : 'var(--player-text-secondary)' }} />
                {story.hasNew && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                    style={{ background: 'var(--player-accent)', border: '2px solid var(--player-bg)' }}
                  />
                )}
              </div>
              <span className="text-[10px] font-bold" style={{ color: 'var(--player-text-muted)' }}>{story.label}</span>
            </button>
          )
        })}
      </div>

      {/* Row 3: Activity Feed */}
      <div className="space-y-3">
        {feedItems.map((item, idx) => (
          <div
            key={`${item.type}-${idx}`}
            className="player-fade-up"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Event Card with RSVP */}
            {item.type === 'event' && (() => {
              const event = item.data
              const isGame = event.event_type === 'game'
              const eventDate = new Date(event.event_date + 'T00:00:00')
              const isToday = eventDate.toDateString() === new Date().toDateString()
              const rsvp = rsvpStatuses[event.id]
              const countdown = countdownText(event.event_date)

              return (
                <div
                  className="rounded-2xl overflow-hidden relative"
                  style={{
                    background: isGame
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.08), var(--player-card))'
                      : 'var(--player-card)',
                    border: isToday ? '1px solid var(--player-accent)' : '1px solid var(--player-border)',
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}
                      >
                        <span className="text-[10px] font-bold uppercase leading-none" style={{ color: 'var(--player-text-muted)' }}>
                          {eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-xl font-black leading-none" style={{ color: 'var(--player-text)' }}>
                          {eventDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{
                              color: isGame ? '#ef4444' : 'var(--player-accent)',
                              background: isGame ? 'rgba(239,68,68,0.1)' : 'var(--player-accent-glow)',
                            }}
                          >
                            {isGame ? 'GAME' : 'PRACTICE'}
                          </span>
                          {isToday && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--player-accent)' }} />
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--player-accent)' }}>Today</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--player-text)' }}>
                          {isGame ? `vs ${event.opponent_name || 'TBD'}` : event.title || 'Team Practice'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--player-text-muted)' }}>
                          {event.event_time && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime12(event.event_time)}</span>
                          )}
                          {event.venue_name && (
                            <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {event.venue_name}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider shrink-0" style={{ color: isToday ? 'var(--player-accent)' : 'var(--player-text-muted)' }}>
                        {countdown}
                      </span>
                    </div>

                    {/* RSVP Buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--player-border)' }}>
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
                            className="flex-1 py-2 rounded-lg text-xs font-bold text-center"
                            style={{
                              background: isActive ? 'var(--player-accent-glow)' : 'var(--player-bg)',
                              color: isActive ? 'var(--player-accent)' : 'var(--player-text-muted)',
                              border: isActive ? '1px solid var(--player-accent)' : '1px solid var(--player-border)',
                            }}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Game Recap Card */}
            {item.type === 'game' && (() => {
              const gs = item.data
              const isWin = gs.event?.game_result === 'win'
              const isLoss = gs.event?.game_result === 'loss'
              const resultColor = isWin ? '#10B981' : isLoss ? '#EF4444' : 'var(--player-text-muted)'

              return (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--player-card)',
                    borderLeft: `3px solid ${resultColor}`,
                    border: '1px solid var(--player-border)',
                    borderLeftColor: resultColor,
                    borderLeftWidth: '3px',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm"
                      style={{ background: `${resultColor}15`, color: resultColor }}
                    >
                      {isWin ? 'W' : isLoss ? 'L' : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--player-text)' }}>
                        vs {gs.event?.opponent_name || 'Opponent'}
                        {gs.event?.our_score != null ? ` — ${gs.event.our_score}-${gs.event.opponent_score}` : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: 'var(--player-text-muted)' }}>YOUR STATS:</span>
                        {[
                          { l: 'K', v: gs.kills || 0 },
                          { l: 'A', v: gs.aces || 0 },
                          { l: 'D', v: gs.digs || 0 },
                          { l: 'B', v: gs.blocks || 0 },
                        ].map(s => (
                          <span key={s.l} className="text-xs font-bold" style={{ color: 'var(--player-text-secondary)' }}>
                            {s.v}{s.l}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--player-text-muted)' }}>{timeAgo(item.time)}</span>
                  </div>
                  {isWin && (
                    <p className="text-xs font-bold mt-2" style={{ color: '#10B981' }}>+85 XP earned</p>
                  )}
                </div>
              )
            })()}

            {/* Badge Earned Card */}
            {item.type === 'badge' && (() => {
              const b = item.data
              return (
                <div
                  className="rounded-2xl p-4 player-pulse-new"
                  style={{
                    background: 'var(--player-card)',
                    border: '1px solid var(--player-border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ boxShadow: '0 0 12px var(--player-accent-glow)' }}
                    >
                      {b.achievement?.icon || '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--player-text)' }}>
                        Badge Earned!
                      </p>
                      <p className="text-xs" style={{ color: 'var(--player-accent)' }}>
                        {b.achievement?.name || 'Achievement'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg" style={{ background: 'var(--player-bg)' }}>
                        <Heart className="w-4 h-4" style={{ color: 'var(--player-text-muted)' }} />
                      </button>
                      <span className="text-[10px]" style={{ color: 'var(--player-text-muted)' }}>{timeAgo(item.time)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Shoutout Card */}
            {item.type === 'shoutout' && (() => {
              const s = item.data
              return (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--player-card)',
                    border: '1px solid var(--player-border)',
                    borderLeftColor: '#ec4899',
                    borderLeftWidth: '3px',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--player-text)' }}>
                        {s.from} gave you a shoutout!
                      </p>
                      <p className="text-xs" style={{ color: '#ec4899' }}>{s.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg" style={{ background: 'var(--player-bg)' }}>
                        <Heart className="w-4 h-4" style={{ color: 'var(--player-text-muted)' }} />
                      </button>
                      <button className="p-1.5 rounded-lg" style={{ background: 'var(--player-bg)' }}>
                        <span className="text-sm">🔥</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: 'var(--player-text-muted)' }}>{timeAgo(s.time)}</p>
                </div>
              )
            })()}
          </div>
        ))}

        {feedItems.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--player-card)', border: '1px solid var(--player-border)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--player-text-muted)' }} />
            <p className="font-bold text-lg" style={{ color: 'var(--player-text-secondary)' }}>Your feed is empty</p>
            <p className="text-sm mt-1" style={{ color: 'var(--player-text-muted)' }}>Play games, earn badges, and get shoutouts to fill your feed</p>
          </div>
        )}
      </div>

      {/* Row 4: Trophy Case */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--player-text)' }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--player-accent)' }} />
            Trophy Case
          </h2>
          {badges.length > 0 && (
            <button onClick={() => onNavigate?.('achievements')} className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--player-accent)' }}>
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {badges.length > 0 ? (
            <>
              {badges.map((b, idx) => {
                const r = RARITY_CONFIG[b.achievement?.rarity] || RARITY_CONFIG.common
                return (
                  <div
                    key={b.id || idx}
                    className="w-[130px] shrink-0 rounded-2xl overflow-hidden relative"
                    style={{
                      height: 180,
                      background: r.bg,
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 0 12px var(--player-accent-glow)',
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
              {/* Locked placeholders to fill the row */}
              {badges.length < 5 && Array.from({ length: 5 - badges.length }).map((_, i) => (
                <div
                  key={`locked-${i}`}
                  className="w-[130px] shrink-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
                  style={{ height: 180, background: 'var(--player-card)', border: '1px solid var(--player-border)' }}
                >
                  <Lock className="w-6 h-6" style={{ color: 'var(--player-text-muted)' }} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--player-text-muted)' }}>Locked</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* All locked placeholders */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`locked-${i}`}
                  className="w-[130px] shrink-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
                  style={{ height: 180, background: 'var(--player-card)', border: '1px solid var(--player-border)' }}
                >
                  <Lock className="w-6 h-6" style={{ color: 'var(--player-text-muted)' }} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--player-text-muted)' }}>Locked</span>
                </div>
              ))}
            </>
          )}
        </div>

        <p className="text-xs text-center mt-1" style={{ color: 'var(--player-text-muted)' }}>
          {badges.length}/20 Badges Earned
        </p>
      </div>
    </main>
  )
}
