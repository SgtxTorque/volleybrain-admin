import { useState, useEffect } from 'react'
import {
  Users, MessageCircle, ChevronRight, Calendar,
  Clock, MapPin, Heart, Send, Activity
} from '../../constants/icons'
import { supabase } from '../../lib/supabase'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const mins = Math.floor((now - d) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return (hr % 12 || 12) + ':' + m + ' ' + (hr >= 12 ? 'PM' : 'AM')
}

// Mock shoutouts for the wall preview (TODO: Wire to real shoutouts table)
const MOCK_SHOUTOUTS_WALL = [
  { id: 'ms1', from: 'Coach Carlos', category: 'Coachable', icon: '💪' },
  { id: 'ms2', from: 'Sarah J.', category: 'Team Player', icon: '⭐' },
  { id: 'ms3', from: 'Emma K.', category: 'Hustle', icon: '🔥' },
]

// Mock team activity (TODO: Wire to real activity feed)
const MOCK_TEAM_ACTIVITY = [
  { id: 'ta1', text: 'Sarah earned Kill Leader badge', icon: '🏆', time: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 'ta2', text: 'Maya reached Level 5', icon: '⚡', time: new Date(Date.now() - 3600000 * 8).toISOString() },
  { id: 'ta3', text: 'Coach posted in Team Hub', icon: '📢', time: new Date(Date.now() - 86400000).toISOString() },
  { id: 'ta4', text: 'Won vs Banks Academy 3-1', icon: '🏐', time: new Date(Date.now() - 86400000 * 2).toISOString() },
]

/**
 * PlayerSocialPanel — Right 300px column
 * Teammates, chat preview, shoutouts, team activity, upcoming events
 * ALL colors via CSS variables (--player-*)
 */
export default function PlayerSocialPanel({
  viewingPlayer,
  primaryTeam,
  upcomingEvents,
  onNavigate,
  navigateToTeamWall,
  openTeamChat,
}) {
  const [teammates, setTeammates] = useState([])
  const [chatMessages, setChatMessages] = useState([])

  // Fetch teammates and chat preview
  useEffect(() => {
    if (!primaryTeam?.id) return
    let cancelled = false

    async function fetchData() {
      // Teammates from team_players
      try {
        const { data: players } = await supabase
          .from('team_players')
          .select('*, players(id, first_name, last_name, photo_url, jersey_number, position)')
          .eq('team_id', primaryTeam.id)
          .limit(8)
        if (!cancelled) {
          const mates = (players || [])
            .map(p => p.players)
            .filter(p => p && p.id !== viewingPlayer?.id)
            .slice(0, 7)
          // Add mock online status (TODO: Wire to real last_seen data)
          setTeammates(mates.map((m, i) => ({
            ...m,
            isOnline: i < 3, // First 3 "online" as mock
          })))
        }
      } catch { if (!cancelled) setTeammates([]) }

      // Team chat messages
      try {
        const { data: channel } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('team_id', primaryTeam.id)
          .limit(1)
          .maybeSingle()

        if (channel && !cancelled) {
          const { data: msgs } = await supabase
            .from('chat_messages')
            .select('*, profiles:sender_id(full_name, avatar_url)')
            .eq('channel_id', channel.id)
            .order('created_at', { ascending: false })
            .limit(4)
          if (!cancelled) setChatMessages(msgs || [])
        }
      } catch { if (!cancelled) setChatMessages([]) }
    }

    fetchData()
    return () => { cancelled = true }
  }, [primaryTeam?.id, viewingPlayer?.id])

  // If no real chat messages, use mock data
  const displayMessages = chatMessages.length > 0 ? chatMessages : [
    { id: 'mock1', content: 'Great practice today!', profiles: { full_name: 'Coach Carlos' }, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'mock2', content: 'See everyone tomorrow at 5pm', profiles: { full_name: 'Sarah J.' }, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'mock3', content: 'Lets gooo', profiles: { full_name: 'Maya R.' }, created_at: new Date(Date.now() - 10800000).toISOString() },
  ]

  return (
    <aside
      className="hidden lg:flex w-[330px] shrink-0 flex-col overflow-y-auto h-full p-4 space-y-4"
      style={{ background: 'var(--player-card)', borderLeft: '1px solid var(--player-border)' }}
    >

      {/* 1. Teammates */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--player-text-muted)' }}>Teammates</h3>
        <div className="flex flex-wrap gap-3">
          {teammates.length > 0 ? teammates.map(mate => (
            <div key={mate.id} className="flex flex-col items-center gap-1 w-[60px]">
              <div className="relative">
                {mate.photo_url ? (
                  <img
                    src={mate.photo_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: '2px solid var(--player-border)' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--player-bg)', color: 'var(--player-text-secondary)', border: '2px solid var(--player-border)' }}
                  >
                    {mate.first_name?.[0]}{mate.last_name?.[0]}
                  </div>
                )}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                  style={{
                    background: mate.isOnline ? '#10B981' : 'var(--player-text-muted)',
                    border: '2px solid var(--player-card)',
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold truncate w-full text-center" style={{ color: 'var(--player-text-secondary)' }}>
                {mate.first_name}
              </span>
            </div>
          )) : (
            <p className="text-xs" style={{ color: 'var(--player-text-muted)' }}>No teammates yet</p>
          )}
        </div>
      </div>

      {/* 2. Team Chat Preview */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}>
        <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid var(--player-border)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--player-text-muted)' }}>Team Chat</h3>
          <button
            onClick={() => openTeamChat?.(primaryTeam?.id)}
            className="text-[10px] font-bold hover:opacity-80"
            style={{ color: 'var(--player-accent)' }}
          >
            Open Chat →
          </button>
        </div>
        <div className="p-3 space-y-2.5">
          {displayMessages.slice(0, 3).map(msg => (
            <div key={msg.id} className="flex items-start gap-2">
              {msg.profiles?.avatar_url ? (
                <img src={msg.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: 'var(--player-card)', color: 'var(--player-text-secondary)' }}
                >
                  {msg.profiles?.full_name?.[0] || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="rounded-lg px-2.5 py-1.5" style={{ background: 'var(--player-card)' }}>
                  <span className="text-[10px] font-bold block" style={{ color: 'var(--player-accent)' }}>
                    {msg.profiles?.full_name?.split(' ')[0]}
                  </span>
                  <p className="text-xs truncate" style={{ color: 'var(--player-text-secondary)' }}>{msg.content}</p>
                </div>
                <span className="text-[9px] ml-1" style={{ color: 'var(--player-text-muted)' }}>{timeAgo(msg.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Quick reply */}
        <div className="px-3 pb-3">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--player-card)', border: '1px solid var(--player-border)' }}
          >
            <input
              type="text"
              placeholder="Say something..."
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: 'var(--player-text)', '::placeholder': { color: 'var(--player-text-muted)' } }}
              onFocus={() => openTeamChat?.(primaryTeam?.id)}
              readOnly
            />
            <Send className="w-4 h-4" style={{ color: 'var(--player-text-muted)' }} />
          </div>
        </div>
      </div>

      {/* 3. Shoutout Wall Preview */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--player-text-muted)' }}>Shoutouts</h3>
          <button onClick={() => onNavigate?.('achievements')} className="text-[10px] font-bold hover:opacity-80" style={{ color: 'var(--player-accent)' }}>
            View All →
          </button>
        </div>
        <div className="space-y-2">
          {MOCK_SHOUTOUTS_WALL.map(s => (
            <div
              key={s.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl"
              style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}
            >
              <span className="text-lg">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--player-text)' }}>{s.category}</p>
                <p className="text-[10px]" style={{ color: 'var(--player-text-muted)' }}>from {s.from}</p>
              </div>
              <Heart className="w-3.5 h-3.5" style={{ color: 'var(--player-text-muted)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Team Activity */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--player-text-muted)' }}>
            <Activity className="w-3 h-3" style={{ color: 'var(--player-accent)' }} />
            Team Activity
          </h3>
        </div>
        <div className="space-y-1">
          {MOCK_TEAM_ACTIVITY.map(item => (
            <div key={item.id} className="flex items-start gap-2.5 py-2 px-2.5 rounded-lg">
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-tight" style={{ color: 'var(--player-text-secondary)' }}>{item.text}</p>
                <p className="text-[9px] mt-0.5" style={{ color: 'var(--player-text-muted)' }}>{timeAgo(item.time)}</p>
              </div>
            </div>
          ))}
        </div>

        {primaryTeam && (
          <button
            onClick={() => navigateToTeamWall?.(primaryTeam.id)}
            className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold text-center uppercase tracking-wider"
            style={{
              background: 'var(--player-accent-glow)',
              color: 'var(--player-accent)',
              border: '1px solid var(--player-accent)',
            }}
          >
            Enter Team Wall <ChevronRight className="w-3 h-3 inline ml-1" />
          </button>
        )}
      </div>

      {/* 5. Upcoming Events Mini */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--player-text-muted)' }}>Upcoming</h3>
        <div className="space-y-2">
          {upcomingEvents?.slice(0, 2).map(event => {
            const isGame = event.event_type === 'game'
            const eventDate = new Date(event.event_date + 'T00:00:00')
            return (
              <div
                key={event.id}
                className="rounded-xl p-3 cursor-pointer"
                onClick={() => onNavigate?.('schedule')}
                style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[32px]">
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--player-text-muted)' }}>
                      {eventDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-black" style={{ color: 'var(--player-text)' }}>
                      {eventDate.getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block"
                      style={{
                        color: isGame ? '#ef4444' : 'var(--player-accent)',
                        background: isGame ? 'rgba(239,68,68,0.1)' : 'var(--player-accent-glow)',
                      }}
                    >
                      {isGame ? 'GAME' : 'PRACTICE'}
                    </span>
                    <p className="text-xs font-semibold truncate mt-0.5" style={{ color: 'var(--player-text-secondary)' }}>
                      {isGame ? `vs ${event.opponent_name || 'TBD'}` : event.title || 'Practice'}
                    </p>
                    {event.event_time && (
                      <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--player-text-muted)' }}>
                        <Clock className="w-2.5 h-2.5" /> {formatTime12(event.event_time)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {(!upcomingEvents || upcomingEvents.length === 0) && (
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}>
              <Calendar className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--player-text-muted)' }} />
              <p className="text-[10px]" style={{ color: 'var(--player-text-muted)' }}>No upcoming events</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
