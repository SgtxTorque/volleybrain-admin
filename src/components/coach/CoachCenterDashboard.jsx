import { useState, useEffect } from 'react'
import {
  Users, Crosshair, ClipboardList,
  Swords, Zap, Clock, ChevronRight, Bell, Check, Send, Timer,
  UserCheck, X, BarChart3, MessageCircle, ChevronDown
} from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import CoachGameDayHero from './CoachGameDayHero'
import { useTheme } from '../../contexts/ThemeContext'
import FeedPost from '../../pages/teams/FeedPost'
import { HUB_STYLES, adjustBrightness } from '../../constants/hubStyles'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return hour12 + ':' + minutes + ' ' + ampm
  } catch {
    return timeStr
  }
}

function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  if (diff < 0) return `${Math.abs(diff)}d ago`
  if (diff <= 7) return `${diff}d`
  return `${Math.ceil(diff / 7)}w`
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Quick Attendance Panel ──
function QuickAttendancePanel({ event, team, roster, userId, showToast }) {
  const { isDark } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const isToday = countdownText(event.event_date) === 'TODAY'

  async function loadAttendance() {
    if (loaded) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('event_rsvps')
        .select('player_id, status')
        .eq('event_id', event.id)
      const map = {}
      for (const r of (data || [])) { map[r.player_id] = r.status }
      setAttendance(map)
      setLoaded(true)
    } catch (err) {
      console.error('Error loading attendance:', err)
    }
    setLoading(false)
  }

  function handleExpand() {
    if (!expanded) loadAttendance()
    setExpanded(!expanded)
  }

  async function markPlayer(playerId, status) {
    const prev = attendance[playerId]
    setAttendance(a => ({ ...a, [playerId]: status }))
    try {
      const { data: existing } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('event_id', event.id)
        .eq('player_id', playerId)
        .maybeSingle()
      if (existing) {
        await supabase.from('event_rsvps').update({ status, updated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('event_rsvps').insert({ event_id: event.id, player_id: playerId, status, responded_by: userId })
      }
    } catch {
      setAttendance(a => ({ ...a, [playerId]: prev }))
      showToast?.('Error updating attendance', 'error')
    }
  }

  const presentCount = Object.values(attendance).filter(s => s === 'yes' || s === 'going').length
  const absentCount = Object.values(attendance).filter(s => s === 'no' || s === 'not_going').length
  const unmarkedCount = roster.length - presentCount - absentCount

  return (
    <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm ${isToday ? 'ring-1 ring-emerald-500/25' : ''}`}>
      <button onClick={handleExpand} className="w-full flex items-center gap-4 p-5 text-left">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
          <UserCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Quick Attendance</span>
            {isToday && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                TODAY
              </span>
            )}
          </div>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            {event.event_type === 'game' ? `Game vs ${event.opponent_name || 'TBD'}` : 'Practice'}
            {event.event_time ? ` · ${formatTime12(event.event_time)}` : ''}
            {expanded && loaded ? ` — ${presentCount}✓ ${absentCount}✗ ${unmarkedCount > 0 ? `${unmarkedCount} unmarked` : ''}` : ''}
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          {loading ? (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Loading...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 py-3 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500">{presentCount} Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-red-500">{absentCount} Absent</span>
                </div>
                {unmarkedCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{unmarkedCount} Unmarked</span>
                  </div>
                )}
                <div className="ml-auto">
                  <button
                    onClick={() => {
                      const all = {}
                      roster.forEach(p => { all[p.id] = 'yes' })
                      setAttendance(all)
                      roster.forEach(p => markPlayer(p.id, 'yes'))
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                  >
                    ALL PRESENT
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {roster.map(player => {
                  const status = attendance[player.id]
                  const isPresent = status === 'yes' || status === 'going'
                  const isAbsent = status === 'no' || status === 'not_going'
                  return (
                    <div key={player.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'}`}>
                      {player.photo_url ? (
                        <img src={player.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-blue-50 text-blue-600">
                          {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{player.first_name} {player.last_name}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>#{player.jersey_number || '—'} · {player.position || 'Player'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markPlayer(player.id, 'yes')}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isPresent ? 'bg-emerald-500/20 border border-emerald-500/40' : isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-lynx-cloud border border-lynx-silver'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${isPresent ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                          onClick={() => markPlayer(player.id, 'no')}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isAbsent ? 'bg-red-500/20 border border-red-500/40' : isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-lynx-cloud border border-lynx-silver'
                          }`}
                        >
                          <X className={`w-4 h-4 ${isAbsent ? 'text-red-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {roster.length === 0 && (
                <div className="py-6 text-center">
                  <Users className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No players on roster</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * CoachCenterDashboard — Center column (flex-1) of Coach Dashboard
 * Welcome message, hero card, game day tools, attendance
 */
export default function CoachCenterDashboard({
  teams,
  selectedTeam,
  onTeamSelect,
  nextGame,
  nextEvent,
  teamRecord,
  winRate,
  selectedSeason,
  availableSeasons,
  selectSeason,
  coachName,
  roster,
  pendingStats,
  onNavigate,
  navigateToTeamWall,
  userId,
  showToast,
  onShowCoachBlast,
  onShowWarmupTimer,
  onPlayerSelect,
  onEventSelect,
  topPlayers,
  openTeamChat,
}) {
  const { isDark } = useTheme()
  const g = selectedTeam?.color || '#6366F1'
  const gb = adjustBrightness(g, 20)
  const [latestPost, setLatestPost] = useState(null)
  const [recentMessages, setRecentMessages] = useState([])
  const [chatChannelId, setChatChannelId] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)

  // Fetch Team Hub + Chat preview data
  useEffect(() => {
    if (!selectedTeam?.id) return
    let cancelled = false

    async function fetchPreviews() {
      // Latest team post
      try {
        const { data: post } = await supabase
          .from('team_posts')
          .select('*, profiles:author_id(full_name, avatar_url)')
          .eq('team_id', selectedTeam.id)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled) setLatestPost(post)
      } catch { if (!cancelled) setLatestPost(null) }

      // Team chat — find channel, then last 3 messages
      try {
        const { data: channel } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('team_id', selectedTeam.id)
          .limit(1)
          .maybeSingle()

        if (channel && !cancelled) {
          setChatChannelId(channel.id)
          const { data: msgs } = await supabase
            .from('chat_messages')
            .select('*, profiles:sender_id(full_name, avatar_url)')
            .eq('channel_id', channel.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(5)
          if (!cancelled) setRecentMessages((msgs || []).reverse())
        } else if (!cancelled) {
          setRecentMessages([])
        }
      } catch { if (!cancelled) setRecentMessages([]) }
    }

    fetchPreviews()
    return () => { cancelled = true }
  }, [selectedTeam?.id])

  // Aggregate season totals from available player stats
  // TODO: Wire to full team season stats query (currently aggregates from top players data)
  const seasonTotals = (() => {
    const t = { points: 0, kills: 0, aces: 0, digs: 0, assists: 0, blocks: 0, games: 0 }
    topPlayers?.forEach(s => {
      t.points += s.total_points || 0
      t.kills += s.total_kills || 0
      t.aces += s.total_aces || 0
      t.digs += s.total_digs || 0
      t.assists += s.total_assists || 0
      t.blocks += s.total_blocks || 0
      t.games = Math.max(t.games, s.games_played || 0)
    })
    return [
      { label: 'Points', value: t.points },
      { label: 'Kills', value: t.kills },
      { label: 'Aces', value: t.aces },
      { label: 'Digs', value: t.digs },
      { label: 'Assists', value: t.assists },
      { label: 'Blocks', value: t.blocks },
      { label: 'Games', value: t.games },
    ]
  })()

  async function handleSendChatMessage(e) {
    e?.preventDefault()
    if (!chatInput.trim() || sendingChat || !chatChannelId) return
    setSendingChat(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: chatChannelId,
          sender_id: userId,
          content: chatInput.trim(),
          message_type: 'text',
        })
        .select('*, profiles:sender_id(full_name, avatar_url)')
        .single()
      if (error) throw error
      setRecentMessages(prev => [...prev, data])
      setChatInput('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
    setSendingChat(false)
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">

      {/* Welcome + Season Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome back, {coachName}</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{selectedTeam?.name} · {selectedSeason?.name}</p>
        </div>
        {availableSeasons?.length > 1 && (
          <div className="relative">
            <select
              value={selectedSeason?.id || ''}
              onChange={e => {
                const season = availableSeasons.find(s => s.id === e.target.value)
                if (season) selectSeason?.(season)
              }}
              className={`appearance-none pl-3 pr-8 py-2 rounded-xl ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'} ${isDark ? 'hover:border-white/[0.12]' : 'hover:border-slate-300'} cursor-pointer`}
            >
              {availableSeasons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none`} />
          </div>
        )}
      </div>

      {/* Team Selector (multi-team) */}
      {teams.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-2 px-2">
          {teams.map(team => {
            const isSelected = selectedTeam?.id === team.id
            return (
              <button
                key={team.id}
                onClick={() => onTeamSelect?.(team)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border whitespace-nowrap flex-shrink-0 ${
                  isSelected
                    ? 'border-transparent text-white'
                    : isDark ? 'border-white/[0.06] bg-lynx-charcoal hover:border-white/[0.12]' : 'border-lynx-silver bg-white hover:border-slate-300'
                }`}
                style={isSelected ? { backgroundColor: team.color || '#3B82F6' } : undefined}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isSelected ? 'bg-white/20 text-white' : 'text-white'
                  }`}
                  style={!isSelected ? { backgroundColor: team.color || '#3B82F6' } : undefined}
                >
                  {team.name?.charAt(0)}
                </div>
                <div className="text-left">
                  <p className={`font-semibold text-sm ${isSelected ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{team.name}</p>
                  <p className={`text-sm ${isSelected ? 'text-white/70' : isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                    {team.coachRole === 'head' ? 'Head Coach' : 'Assistant'} · {team.playerCount} players
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-white/80" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Row 1: Game Day Hero */}
      <CoachGameDayHero
        nextGame={nextGame}
        nextEvent={nextEvent}
        selectedTeam={selectedTeam}
        teamRecord={teamRecord}
        winRate={winRate}
        selectedSeason={selectedSeason}
        onNavigate={onNavigate}
        onShowWarmupTimer={onShowWarmupTimer}
      />

      {/* Row 2: Game Day Tools */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm`}>
        <div className={`flex items-center gap-3 p-5 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Crosshair className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Game Day Tools</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Lineups, scoring, and stats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {/* Lineup Builder */}
          <button
            onClick={() => onNavigate?.('gameprep')}
            className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-5 text-left hover:shadow-md`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                <ClipboardList className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Lineup Builder</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Build & manage lineups</p>
              </div>
            </div>
            {nextGame ? (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                <Swords className="w-4 h-4 text-indigo-500" />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Next: vs {nextGame.opponent_name || 'TBD'} · {countdownText(nextGame.event_date)}
                </span>
              </div>
            ) : (
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No upcoming games</p>
            )}
            <div className="flex items-center gap-1 mt-3 text-indigo-500 text-sm font-semibold">
              <span>Open Builder</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Game Day Hub */}
          <button
            onClick={() => onNavigate?.('gameprep')}
            className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-5 text-left hover:shadow-md`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Game Day Hub</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Live scoring & stats</p>
              </div>
            </div>
            {nextGame && countdownText(nextGame.event_date) === 'TODAY' ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-500 font-semibold">Game Day — vs {nextGame.opponent_name || 'TBD'}</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                <Clock className="w-4 h-4 text-amber-500/60" />
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Score games, track stats, manage rotations</span>
              </div>
            )}
            <div className="flex items-center gap-1 mt-3 text-amber-500 text-sm font-semibold">
              <span>Enter Hub</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Pending Stats Alert */}
        {pendingStats > 0 && (
          <div className="mx-5 mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Bell className="w-5 h-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-700">{pendingStats} game{pendingStats > 1 ? 's' : ''} need stats</p>
              <p className="text-sm text-amber-600/70">Stats power leaderboards, badges, and parent views</p>
            </div>
            <button
              onClick={() => onNavigate?.('gameprep')}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600"
            >
              Enter Stats
            </button>
          </div>
        )}
      </div>

      {/* Row 3: Season Totals */}
      <button
        onClick={() => onNavigate?.('leaderboards')}
        className={`w-full ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-5 text-left hover:shadow-md group`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Season Totals</h3>
          </div>
          <span className="text-xs font-semibold text-[#2C5F7C] group-hover:opacity-80">
            View Full Stats →
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {seasonTotals.map(stat => (
            <div key={stat.label} className={`flex-1 min-w-[70px] text-center py-2 px-1 rounded-xl ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
              <p className={`text-xs uppercase tracking-wide font-bold ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </button>

      {/* Row 4: Team Hub + Chat Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Hub Preview */}
        <div className={` ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Team Hub</h3>
            </div>
            <button onClick={() => navigateToTeamWall?.(selectedTeam?.id)} className="text-xs text-[#2C5F7C] font-semibold hover:opacity-80">
              Go To Team Page →
            </button>
          </div>
          <div className={!isDark ? 'tw-light' : ''}>
            <style>{HUB_STYLES}</style>
            {latestPost ? (
              <FeedPost
                post={latestPost}
                g={g}
                gb={gb}
                i={0}
                isDark={isDark}
                isAdminOrCoach={true}
                currentUserId={userId}
                onDelete={() => {}}
                onTogglePin={() => {}}
                onEdit={() => {}}
                onCommentCountChange={(postId, count) => {
                  setLatestPost(prev => prev ? { ...prev, comment_count: count } : prev)
                }}
                onReactionCountChange={(postId, count) => {
                  setLatestPost(prev => prev ? { ...prev, reaction_count: count } : prev)
                }}
              />
            ) : (
              <div className="text-center py-4 px-5">
                <Users className={`w-8 h-8 mx-auto mb-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No posts yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Chat Preview */}
        <div className={` ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Team Chat</h3>
            </div>
            <button onClick={() => openTeamChat?.(selectedTeam?.id)} className="text-xs text-[#2C5F7C] font-semibold hover:opacity-80">
              Go to Chat →
            </button>
          </div>
          <div className="p-4">
            {recentMessages.length > 0 ? (
              <div className="space-y-2.5">
                {recentMessages.map((msg) => {
                  const isOwn = msg.sender_id === userId
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                      {!isOwn && (
                        msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className={`w-7 h-7 rounded-full ${isDark ? 'bg-white/10' : 'bg-emerald-50'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-emerald-600'}`}>
                              {msg.profiles?.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )
                      )}
                      <div className="max-w-[75%]">
                        {!isOwn && (
                          <p className={`text-[10px] font-semibold mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {msg.profiles?.full_name?.split(' ')[0]}
                          </p>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}
                          style={isOwn ? {
                            background: isDark
                              ? `linear-gradient(135deg, ${g}, ${gb})`
                              : `${g}18`,
                            color: isDark ? 'white' : '#1a1a1a',
                            boxShadow: isDark ? `0 4px 16px ${g}25` : `0 2px 12px ${g}10`,
                          } : {
                            background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
                            color: isDark ? 'white' : '#1a1a1a',
                            border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)',
                          }}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-0.5 ${isOwn ? 'opacity-60' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <MessageCircle className={`w-8 h-8 mx-auto mb-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No messages yet</p>
              </div>
            )}

            {/* Inline Chat Input */}
            <form onSubmit={handleSendChatMessage} className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} flex items-center gap-2`}>
              <div className="flex-1 flex items-center px-3 py-2 rounded-xl"
                style={{
                  background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
                  border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.05)',
                }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? 'white' : '#1a1a1a' }}
                />
              </div>
              <button
                type="submit"
                disabled={!chatInput.trim() || sendingChat}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-20"
                style={{
                  background: chatInput.trim() ? g : 'transparent',
                  color: chatInput.trim() ? 'white' : (isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)'),
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Row 5: Quick Attendance */}
      {nextEvent && (
        <QuickAttendancePanel
          event={nextEvent}
          team={selectedTeam}
          roster={roster}
          userId={userId}
          showToast={showToast}
        />
      )}

      {/* Row 4: Quick Actions (mobile only — replaces sidebar) */}
      <div className="lg:hidden">
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') }}
            className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm flex items-center gap-4 p-4 text-left hover:shadow-md`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Take Attendance</h3>
              <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                {nextEvent ? `${nextEvent.event_type === 'game' ? 'Game' : 'Practice'} · ${formatDateShort(nextEvent.event_date)}` : 'No upcoming events'}
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>

          <button
            onClick={() => onShowCoachBlast?.()}
            className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm flex items-center gap-4 p-4 text-left hover:shadow-md`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'}`}>
              <Send className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Message Parents</h3>
              <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Send announcement to {selectedTeam?.name}</p>
            </div>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>

          <button
            onClick={() => onShowWarmupTimer?.()}
            className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm flex items-center gap-4 p-4 text-left hover:shadow-md`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
              <Timer className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Start Warmup</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Countdown timer for drills</p>
            </div>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>
        </div>
      </div>

    </main>
  )
}
