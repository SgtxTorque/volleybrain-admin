import { useState, useEffect, useMemo } from 'react'
import { ChevronDown } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'

// ── Helpers (from mobile CoachHomeScroll) ──────────────────────────

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtTime(timeStr) {
  if (!timeStr) return ''
  try {
    const [h, m] = timeStr.split(':')
    const hr = parseInt(h, 10)
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
  } catch { return '' }
}

function isWithin48Hours(eventDate) {
  const now = new Date()
  const evt = new Date(eventDate + 'T23:59:59')
  const diff = evt.getTime() - now.getTime()
  return diff >= 0 && diff <= 48 * 60 * 60 * 1000
}

function relativeTime(dateStr) {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHrs < 1) return 'Just now'
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return `${Math.floor(diffDays / 7)}w ago`
  } catch { return '' }
}

function buildClosingMessage(nextEvent, teamRecord) {
  const today = new Date().toISOString().split('T')[0]
  if (nextEvent?.event_date === today && nextEvent.event_type === 'game')
    return 'Trust the preparation. Your team is ready.'
  if (nextEvent?.event_date === today && nextEvent.event_type === 'practice')
    return 'Good practice makes good habits. Set the tone today.'
  if (teamRecord && teamRecord.wins > teamRecord.losses)
    return 'Momentum is on your side. Keep building.'
  if (!nextEvent || nextEvent.event_date !== today)
    return 'Recovery matters too. Let them rest.'
  return 'Go make them better today.'
}

function postIcon(type) {
  if (type === 'shoutout') return '\u{1F3AF}'
  if (type === 'photo' || type === 'gallery') return '\u{1F4F8}'
  if (type === 'announcement') return '\u{1F4E3}'
  return '\u{1F4AC}'
}

// ── Main Component ────────────────────────────────────────────────

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
  onShowShoutout,
  onPlayerSelect,
  onEventSelect,
  topPlayers,
  openTeamChat,
  rsvpCounts,
  weeklyShoutouts,
  unreadMessages,
  lineupCount,
  checklistState,
  onToggleManualChecklist,
  // V2.1 Command Strip props
  lineupSetForNextGame,
  rsvpPercentNextGame,
  avgAttendanceLast3,
  weeklyEngagement,
  rosterIssues,
  lineupsSet,
  upcomingGamesCount,
  // V2.1 Workflow Button badges
  gameDayBadge,
  practiceBadge,
  rosterBadge,
  scheduleBadge,
  // V2.1 Performance Grid data
  scoringTrend,
  topPlayerTrend,
  statLeaders,
  developmentData,
}) {
  const { isDark } = useTheme()
  const sectionHeader = isDark ? 'brand-section-header-dark' : 'brand-section-header'

  // ── Team Hub preview posts ──
  const [hubPosts, setHubPosts] = useState([])

  useEffect(() => {
    if (!selectedTeam?.id) return
    let cancelled = false
    async function fetchPosts() {
      try {
        const { data } = await supabase
          .from('team_posts')
          .select('id, content, post_type, created_at, profiles:author_id(full_name)')
          .eq('team_id', selectedTeam.id)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(2)
        if (!cancelled && data) {
          setHubPosts(data.map(p => ({
            id: p.id,
            content: p.content || '',
            post_type: p.post_type || 'update',
            author_name: p.profiles?.full_name || 'Coach',
            author_initial: (p.profiles?.full_name || 'C').charAt(0).toUpperCase(),
            created_at: p.created_at,
          })))
        }
      } catch { if (!cancelled) setHubPosts([]) }
    }
    fetchPosts()
    return () => { cancelled = true }
  }, [selectedTeam?.id])

  // ── Briefing message (from mobile buildBriefingMessage) ──
  const briefingMessage = useMemo(() => {
    if (!selectedTeam) return 'Welcome to your coaching hub.'
    const today = new Date().toISOString().split('T')[0]

    if (nextEvent?.event_date === today) {
      const time = fmtTime(nextEvent.event_time)
      if (nextEvent.event_type === 'game' && nextEvent.opponent_name)
        return `Game day. ${selectedTeam.name} vs ${nextEvent.opponent_name}${time ? ` at ${time}` : ''}.`
      if (nextEvent.event_type === 'practice')
        return `Practice${time ? ` at ${time}` : ''} for ${selectedTeam.name}.`
      return `${selectedTeam.name} has an event${time ? ` at ${time}` : ''} today.`
    }

    if (nextEvent) {
      try {
        const dayName = new Date(nextEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
        const type = nextEvent.event_type === 'game' ? 'game' : nextEvent.event_type === 'practice' ? 'practice' : 'event'
        return `${selectedTeam.name} is ${teamRecord.wins}-${teamRecord.losses} this season. Next up: ${dayName}'s ${type}.`
      } catch {
        return `${selectedTeam.name} is ${teamRecord.wins}-${teamRecord.losses} this season.`
      }
    }

    return `${selectedTeam.name} is ${teamRecord.wins}-${teamRecord.losses} this season.`
  }, [selectedTeam, nextEvent, teamRecord])

  // ── Leaderboard data (kills + aces top 3) ──
  const killsLeaders = useMemo(() => {
    return (topPlayers || [])
      .filter(p => (p.total_kills || 0) > 0)
      .sort((a, b) => (b.total_kills || 0) - (a.total_kills || 0))
      .slice(0, 3)
      .map(p => {
        const player = roster.find(r => r.id === p.player_id)
        return {
          name: player ? `${player.first_name} ${(player.last_name || '')[0]}.` : 'Unknown',
          value: p.total_kills || 0,
        }
      })
  }, [topPlayers, roster])

  const acesLeaders = useMemo(() => {
    return (topPlayers || [])
      .filter(p => (p.total_aces || 0) > 0)
      .sort((a, b) => (b.total_aces || 0) - (a.total_aces || 0))
      .slice(0, 3)
      .map(p => {
        const player = roster.find(r => r.id === p.player_id)
        return {
          name: player ? `${player.first_name} ${(player.last_name || '')[0]}.` : 'Unknown',
          value: p.total_aces || 0,
        }
      })
  }, [topPlayers, roster])

  // ── Player dots for Team Health ──
  const playerDots = useMemo(() => {
    return roster.map(p => {
      if (!p.jersey_number && !p.position) return 'critical'
      if (!p.jersey_number || !p.position) return 'warning'
      return 'good'
    })
  }, [roster])

  // ── RSVP for next event ──
  const nextEventRsvp = nextEvent ? rsvpCounts[nextEvent.id] : null
  const rsvpConfirmed = nextEventRsvp?.going || 0
  const rsvpTotal = nextEventRsvp?.total || 0
  const rsvpPercent = roster.length > 0 ? (rsvpConfirmed / roster.length) * 100 : 0

  // ── Derived values ──
  const gamesPlayed = teamRecord.wins + teamRecord.losses
  const winRatePercent = gamesPlayed > 0 ? Math.round((teamRecord.wins / gamesPlayed) * 100) : 0
  const attRate = avgAttendanceLast3 ?? 0
  const attentionCount = roster.filter(p => !p.jersey_number || !p.position).length
  const isEventDay = !!nextEvent && isWithin48Hours(nextEvent.event_date)

  // ── Checklist ──
  const checklistItems = [
    { label: 'Lineup set', done: checklistState.lineupSet },
    { label: 'RSVPs', done: checklistState.rsvpsReviewed },
    { label: 'Last game stats', done: checklistState.lastGameStatsEntered },
  ]
  const doneCount = checklistItems.filter(i => i.done).length
  const allChecklistDone = doneCount === checklistItems.length

  const dayLabel = (() => {
    if (!nextEvent?.event_date) return 'the event'
    try {
      const d = new Date(nextEvent.event_date + 'T00:00:00')
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
      if (d.getTime() === today.getTime()) return 'today'
      if (d.getTime() === tomorrow.getTime()) return 'tomorrow'
      return d.toLocaleDateString('en-US', { weekday: 'long' })
    } catch { return 'the event' }
  })()

  // ── Quick actions ──
  const quickActions = [
    { icon: '\u{1F4E3}', label: 'Send a Blast', action: () => onShowCoachBlast?.(), badgeKey: null },
    { icon: '\u{1F4DD}', label: 'Build a Lineup', action: () => onNavigate?.('gameprep'), badgeKey: null },
    { icon: '\u{1F31F}', label: 'Give a Shoutout', action: () => onShowShoutout?.(), badgeKey: null },
    { icon: '\u{1F4CA}', label: 'Review Stats', action: () => onNavigate?.('gameprep'), badgeKey: 'stats' },
    { icon: '\u{1F465}', label: 'Manage Roster', action: () => navigateToTeamWall?.(selectedTeam?.id), badgeKey: 'roster' },
    { icon: '\u{1F3AF}', label: 'Create a Challenge', action: () => navigateToTeamWall?.(selectedTeam?.id), badgeKey: null },
  ]

  const getBadge = (key) => {
    if (key === 'stats' && pendingStats > 0) return { show: true, color: 'bg-red-500' }
    if (key === 'roster' && rosterIssues > 0) return { show: true, color: 'bg-amber-500' }
    return { show: false, color: '' }
  }

  // ── Render ──
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-lynx-midnight' : 'bg-[#F6F8FB]'}`}>
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

          {/* ─── 1. WELCOME BRIEFING (Tier 3 ambient) ──────────── */}
          <div className="text-center pt-2 pb-2">
            <p className="text-4xl mb-2">{'\u{1F431}'}</p>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-brand-navy'}`}>
              {getTimeGreeting()}, Coach
            </h1>
            <p className={`text-base font-semibold mt-2 leading-relaxed px-8 ${isDark ? 'text-slate-300' : 'text-brand-navy'}`}>
              {briefingMessage}
            </p>
          </div>

          {/* ─── 2. TEAM SELECTOR PILLS ────────────────────────── */}
          {teams.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {teams.map(team => {
                const isActive = selectedTeam?.id === team.id
                return (
                  <button
                    key={team.id}
                    onClick={() => onTeamSelect?.(team)}
                    className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-brand-sky-blue border-brand-sky-blue text-white'
                        : isDark
                          ? 'bg-lynx-charcoal border-lynx-border-dark text-slate-300 hover:border-slate-500'
                          : 'bg-brand-off-white border-brand-border text-brand-navy hover:border-slate-300'
                    }`}
                  >
                    {team.name}
                  </button>
                )
              })}
              {/* Season selector */}
              {availableSeasons?.length > 1 && (
                <div className="relative flex-shrink-0 ml-auto">
                  <select
                    value={selectedSeason?.id || ''}
                    onChange={e => {
                      const season = availableSeasons.find(s => s.id === e.target.value)
                      if (season) selectSeason?.(season)
                    }}
                    className={`appearance-none pl-3 pr-8 py-2 rounded-full border text-sm font-semibold cursor-pointer ${
                      isDark
                        ? 'bg-lynx-charcoal border-lynx-border-dark text-slate-300'
                        : 'bg-brand-off-white border-brand-border text-brand-navy'
                    }`}
                  >
                    {availableSeasons.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-brand-text-faint'}`} />
                </div>
              )}
            </div>
          )}

          {/* ─── 3. PREP CHECKLIST (event days only) ───────────── */}
          {isEventDay && (
            <div className="px-1">
              {allChecklistDone ? (
                <p className="text-sm font-medium text-green-500 text-center">
                  All set for {dayLabel}. Trust the preparation. {'\u2713'}
                </p>
              ) : (
                <button onClick={() => onNavigate?.('schedule')} className="text-left w-full group">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {checklistItems.map((item, i) => (
                      <span key={i} className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>
                        <span className={item.done ? 'text-green-500' : 'text-red-500'}>
                          {item.done ? '\u2713' : '\u2717'}
                        </span>
                        {' '}{item.label}{i < checklistItems.length - 1 ? '  ' : ''}
                      </span>
                    ))}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-brand-text-muted'} group-hover:text-brand-sky-blue`}>
                    {doneCount} of {checklistItems.length} ready for {dayLabel} {'\u2192'}
                  </p>
                </button>
              )}
            </div>
          )}

          {/* ─── 4. GAME PLAN CARD (Tier 1 — within 48h) ──────── */}
          {nextEvent && isWithin48Hours(nextEvent.event_date) && (
            <div className={`rounded-2xl p-5 shadow-lg ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-[#0D1B3E]'}`}>
              {/* Header line */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                    {nextEvent.event_type === 'game' ? 'GAME DAY' : 'PRACTICE'}
                    {nextEvent.event_time ? ` \u00B7 ${fmtTime(nextEvent.event_time)}` : ''}
                  </span>
                </div>
                <span className="text-2xl">{'\u{1F3D0}'}</span>
              </div>

              {/* Team name */}
              <h2 className="text-2xl font-black text-white tracking-wide">{selectedTeam?.name}</h2>

              {/* Opponent (game only) */}
              {nextEvent.event_type === 'game' && nextEvent.opponent_name && (
                <p className="text-base font-semibold text-white/80 mt-0.5">vs {nextEvent.opponent_name}</p>
              )}

              {/* Location */}
              {(nextEvent.venue_name || nextEvent.location) && (
                <p className="text-sm text-white/50 mt-2">{'\u{1F4CD}'} {nextEvent.venue_name || nextEvent.location}</p>
              )}

              {/* Quick action pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(nextEvent.event_type === 'game'
                  ? [
                    { label: 'Roster', action: () => navigateToTeamWall?.(selectedTeam?.id) },
                    { label: 'Lineup', action: () => onNavigate?.('gameprep') },
                    { label: 'Stats', action: () => onNavigate?.('gameprep') },
                    { label: 'Attend.', action: () => onNavigate?.('attendance') },
                  ]
                  : [
                    { label: 'Roster', action: () => navigateToTeamWall?.(selectedTeam?.id) },
                    { label: 'Attend.', action: () => onNavigate?.('attendance') },
                  ]
                ).map((pill, i) => (
                  <button
                    key={i}
                    onClick={pill.action}
                    className="px-3 py-1.5 rounded-xl bg-[#F6F8FB] text-[11px] font-semibold text-brand-navy hover:bg-white transition-colors"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* RSVP summary */}
              {nextEventRsvp && (
                <p className="text-sm text-white/70 mt-3">
                  {rsvpConfirmed}/{roster.length} confirmed
                  {roster.length - rsvpTotal > 0 && (
                    <span className="text-amber-400"> {'\u00B7'} {roster.length - rsvpTotal} not responded</span>
                  )}
                </p>
              )}

              {/* START GAME DAY MODE (game only) */}
              {nextEvent.event_type === 'game' && (
                <button
                  onClick={() => onNavigate?.('command-center')}
                  className="w-full mt-4 py-3.5 rounded-xl bg-brand-sky-blue text-white text-base font-black tracking-wide uppercase hover:bg-lynx-deep transition-colors"
                >
                  START GAME DAY MODE
                </button>
              )}
            </div>
          )}

          {/* ─── 5. QUICK ACTIONS (action rows with badges) ────── */}
          <div className={`rounded-2xl py-1.5 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-brand-off-white'}`}>
            {quickActions.map((action, i) => {
              const badge = getBadge(action.badgeKey)
              return (
                <button
                  key={i}
                  onClick={action.action}
                  className={`w-full flex items-center px-4 py-3.5 transition-colors ${
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                  } ${
                    i < quickActions.length - 1
                      ? (isDark ? 'border-b border-white/[0.06]' : 'border-b border-brand-border')
                      : ''
                  }`}
                >
                  <span className="text-2xl relative">
                    {action.icon}
                    {badge.show && (
                      <span className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ${badge.color}`} />
                    )}
                  </span>
                  <span className={`flex-1 text-left ml-3 text-[15px] font-semibold ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>
                    {action.label}
                  </span>
                  <span className={`text-base ${isDark ? 'text-slate-600' : 'text-brand-text-faint'}`}>{'\u2192'}</span>
                </button>
              )
            })}
          </div>

          {/* ─── 6. ENGAGEMENT NUDGE (Tier 3 ambient) ──────────── */}
          <button onClick={() => onShowShoutout?.()} className="w-full text-left px-1">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-brand-text-muted'} hover:text-brand-sky-blue transition-colors`}>
              Who{'\u2019'}s been putting in work? Give a shoutout. {'\u2192'}
            </p>
          </button>

          {/* ─── 7. TEAM HEALTH CARD (Tier 1.5 — dots + bars) ──── */}
          <button
            onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
            className={`w-full text-left rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
              isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-[#F8FAFC] border-brand-border'
            }`}
          >
            <p className={`${sectionHeader} mb-3.5`}>TEAM HEALTH</p>

            {/* Player dots row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-1 flex-1">
                {playerDots.map((color, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      color === 'good' ? 'bg-green-500' : color === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs ml-3 ${isDark ? 'text-slate-400' : 'text-brand-text-muted'}`}>
                {roster.length} Players
              </span>
            </div>

            {/* Attendance + RSVP bars side by side */}
            <div className="grid grid-cols-2 gap-4 mb-3.5">
              {/* Attendance */}
              <div>
                <p className={`${sectionHeader} mb-1.5`}>ATTENDANCE</p>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-brand-warm-gray'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      attRate >= 90 ? 'bg-green-500' : attRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${attRate}%` }}
                  />
                </div>
                <p className={`text-xl font-bold mt-1 ${
                  attRate >= 90 ? 'text-green-500' : attRate >= 70 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {avgAttendanceLast3 !== null ? `${attRate}%` : '--'}
                </p>
              </div>

              {/* RSVP */}
              <div>
                <p className={`${sectionHeader} mb-1.5`}>RSVP</p>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-brand-warm-gray'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      rsvpConfirmed === 0 && roster.length > 0 ? 'bg-red-500' : 'bg-brand-sky-blue'
                    }`}
                    style={{ width: `${rsvpPercent}%` }}
                  />
                </div>
                <p className={`text-xl font-bold mt-1 ${
                  rsvpConfirmed === 0 && roster.length > 0 ? 'text-red-500' : 'text-brand-sky-blue'
                }`}>
                  {nextEventRsvp ? `${rsvpConfirmed}/${roster.length}` : '--'}
                </p>
              </div>
            </div>

            {/* Attention row */}
            {attentionCount > 0 ? (
              <div className={`pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-brand-border'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>
                  {'\u{1F534}'} {attentionCount} need attention {'\u2192'}
                </p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-green-500 mt-1">{'\u2713'} All clear</p>
            )}
          </button>

          {/* ─── 8. SEASON & LEADERBOARD CARD (Tier 1.5) ──────── */}
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-brand-border'}`}>
            {/* Record header */}
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-4xl font-black leading-none">
                <span className="text-green-500">{teamRecord.wins}</span>
                <span className={isDark ? 'text-slate-600' : 'text-brand-text-faint'}> {'\u2014'} </span>
                <span className="text-red-500">{teamRecord.losses}</span>
              </p>
              <span className={`text-xs font-semibold uppercase text-right max-w-[50%] ${isDark ? 'text-slate-400' : 'text-brand-text-muted'}`}>
                {selectedTeam?.name?.toUpperCase()}
              </span>
            </div>

            {/* Win rate bar */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-brand-warm-gray'}`}>
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${winRatePercent}%` }} />
              </div>
              <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-brand-text-muted'}`}>{winRatePercent}%</span>
            </div>

            {/* Leaderboard bar charts */}
            {(killsLeaders.length > 0 || acesLeaders.length > 0) ? (
              <div className="mt-4 space-y-4">
                {/* Kills */}
                {killsLeaders.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={sectionHeader}>KILLS</span>
                      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-brand-border'}`} />
                    </div>
                    {killsLeaders.map((p, i) => {
                      const maxVal = killsLeaders[0]?.value || 1
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`text-sm font-semibold w-[30%] truncate ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>{p.name}</span>
                          <div className={`flex-1 h-3.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-brand-warm-gray'}`}>
                            <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${(p.value / maxVal) * 100}%` }} />
                          </div>
                          <span className={`text-sm font-bold w-8 text-right ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>{p.value}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Aces */}
                {acesLeaders.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={sectionHeader}>ACES</span>
                      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-brand-border'}`} />
                    </div>
                    {acesLeaders.map((p, i) => {
                      const maxVal = acesLeaders[0]?.value || 1
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`text-sm font-semibold w-[30%] truncate ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>{p.name}</span>
                          <div className={`flex-1 h-3.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-brand-warm-gray'}`}>
                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(p.value / maxVal) * 100}%` }} />
                          </div>
                          <span className={`text-sm font-bold w-8 text-right ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>{p.value}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* View Leaderboard link */}
                <div className="text-right">
                  <button onClick={() => onNavigate?.('leaderboards')} className="text-xs font-semibold text-brand-sky-blue hover:text-lynx-deep">
                    View Leaderboard {'\u2192'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-brand-text-muted'}`}>No game stats yet this season.</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-brand-text-faint'}`}>Play your first game to see leaderboards.</p>
              </div>
            )}
          </div>

          {/* ─── 9. ACTION ITEMS (Tier 2 — compact lines) ──────── */}
          {pendingStats > 0 && (
            <div>
              <p className={`${sectionHeader} px-1 mb-2`}>ACTION ITEMS</p>
              <button
                onClick={() => onNavigate?.('gameprep')}
                className={`w-full text-left px-1 py-2 text-sm hover:text-brand-sky-blue transition-colors ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}
              >
                {'\u{1F4CA}'} {pendingStats} game{pendingStats > 1 ? 's' : ''} need stats entered {'\u2192'}
              </button>
            </div>
          )}

          {/* ─── 10. TEAM HUB PREVIEW (Tier 1.5 — social feed) ── */}
          <div className={`rounded-2xl border p-4 shadow-sm ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-brand-warm-gray'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={sectionHeader}>TEAM HUB</p>
              <button onClick={() => navigateToTeamWall?.(selectedTeam?.id)} className="text-xs font-semibold text-brand-sky-blue hover:text-lynx-deep">
                View All {'\u2192'}
              </button>
            </div>

            {hubPosts.length === 0 ? (
              <button onClick={() => navigateToTeamWall?.(selectedTeam?.id)} className="w-full text-left">
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-brand-text-muted'}`}>
                  Your team wall is quiet. Post something to get things going. {'\u2192'}
                </p>
              </button>
            ) : (
              hubPosts.map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
                  className={`w-full flex items-start gap-2.5 py-2 text-left ${
                    i > 0 ? (isDark ? 'border-t border-white/[0.06]' : 'border-t border-brand-border') : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-sky-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{post.author_initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug line-clamp-2 ${isDark ? 'text-slate-200' : 'text-brand-navy'}`}>
                      {postIcon(post.post_type)} {post.content}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-brand-text-muted'}`}>
                      {post.author_name} {'\u00B7'} {relativeTime(post.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* ─── 11. RECENT ACTIVITY (Tier 2 — 2 items max) ────── */}
          <div>
            <p className={`${sectionHeader} px-1 mb-2`}>RECENT</p>
            <button onClick={() => onNavigate?.('schedule')} className="w-full text-left px-1">
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-brand-text-muted'} hover:text-brand-sky-blue transition-colors`}>
                Quiet week. Time to stir things up? {'\u2192'}
              </p>
            </button>
          </div>

          {/* ─── 12. CLOSING (Tier 3 ambient) ──────────────────── */}
          <div className="text-center py-6">
            <p className="text-4xl opacity-30 mb-2">{'\u{1F431}'}</p>
            <p className={`text-sm px-10 ${isDark ? 'text-slate-600' : 'text-brand-text-faint'}`}>
              {buildClosingMessage(nextEvent, teamRecord)}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
