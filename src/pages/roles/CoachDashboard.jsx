import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { sanitizeText } from '../../lib/validation'
import { PlayerCardExpanded } from '../../components/players'
import {
  Calendar, MapPin, Clock, Users, ChevronRight, Check, X,
  Target, MessageCircle, Swords, Shield, Send, Timer
} from '../../constants/icons'

import CoachLeftSidebar from '../../components/coach/CoachLeftSidebar'
import CoachCenterDashboard from '../../components/coach/CoachCenterDashboard'
import CoachRosterPanel from '../../components/coach/CoachRosterPanel'
import GiveShoutoutModal from '../../components/engagement/GiveShoutoutModal'
import { formatTime12, countdownText } from '../../lib/date-helpers'

// ── Event Detail Modal ──
function EventDetailModal({ event, team, onClose }) {
  const { isDark } = useTheme()
  if (!event) return null
  const eventDate = event.event_date ? new Date(event.event_date + 'T00:00:00') : null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl shadow-xl ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'}`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${isDark ? 'bg-lynx-graphite text-lynx-sky border border-lynx-border-dark' : 'bg-lynx-ice text-lynx-sky border border-lynx-sky/20'}`}>
              {event.event_type === 'game' ? '🏐' : '⚡'}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.title || event.event_type}</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{team?.name}</p>
            </div>
            <button onClick={onClose} className={`ml-auto p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-lynx-sky" />
            <div>
              <p className={`${isDark ? 'text-white' : 'text-slate-900'}`}>{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatTime12(event.event_time)}</p>}
            </div>
          </div>
          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-lynx-sky" />
              <div>
                <p className={`${isDark ? 'text-white' : 'text-slate-900'}`}>{event.venue_name || event.location}</p>
                {event.venue_address && <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event.venue_address}</p>}
              </div>
            </div>
          )}
          {event.opponent_name && (
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-amber-500" />
              <p className={`${isDark ? 'text-white' : 'text-slate-900'}`}>vs {event.opponent_name}</p>
            </div>
          )}
          {event.notes && (
            <div className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-lynx-cloud border border-slate-100'}`}>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{event.notes}</p>
            </div>
          )}
        </div>
        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-medium ${isDark ? 'border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-600 hover:bg-lynx-cloud'}`}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Coach Blast Modal ──
function CoachBlastModal({ team, onClose, showToast }) {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const cleanTitle = sanitizeText(title)
    const cleanBody = sanitizeText(body)
    if (!cleanTitle || !cleanBody) { showToast?.('Please fill in title and message', 'error'); return }
    if (cleanTitle.length > 200) { showToast?.('Title must be 200 characters or less', 'error'); return }
    setSending(true)
    try {
      const { data: blast, error } = await supabase
        .from('messages')
        .insert({ season_id: selectedSeason?.id, sender_id: user?.id, title: cleanTitle, body: cleanBody, message_type: 'announcement', priority, target_type: 'team', target_team_id: team.id })
        .select().single()
      if (error) throw error
      const { data: teamPlayers } = await supabase.from('team_players').select('players(id, first_name, last_name, parent_name, parent_email)').eq('team_id', team.id)
      const recipients = (teamPlayers || []).map(tp => ({
        message_id: blast.id, recipient_type: 'parent', recipient_id: tp.players?.id,
        recipient_name: tp.players?.parent_name || `${tp.players?.first_name} ${tp.players?.last_name}'s Parent`,
        recipient_email: tp.players?.parent_email
      })).filter(r => r.recipient_id)
      if (recipients.length > 0) await supabase.from('message_recipients').insert(recipients)
      showToast?.(`Message sent to ${recipients.length} parents!`, 'success')
      onClose()
    } catch (err) {
      console.error('Error sending blast:', err)
      showToast?.('Error sending message', 'error')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-xl shadow-xl ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'}`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-lynx-sky/10 border border-lynx-sky/20' : 'bg-lynx-ice border border-lynx-sky/20'}`}>
              <Send className="w-6 h-6 text-lynx-sky" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Message Parents</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Send to {team?.name} parents</p>
            </div>
            <button onClick={onClose} className={`ml-auto p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Subject</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Practice time change tomorrow" className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500' : 'bg-lynx-cloud border border-lynx-silver text-slate-900 placeholder-slate-400'}`} />
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message to parents..." rows={4} className={`w-full px-4 py-3 rounded-xl resize-none ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500' : 'bg-lynx-cloud border border-lynx-silver text-slate-900 placeholder-slate-400'}`} />
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Priority</label>
            <div className="flex gap-2">
              <button onClick={() => setPriority('normal')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${priority === 'normal' ? (isDark ? 'bg-lynx-sky/10 border border-lynx-sky/30 text-lynx-sky' : 'bg-lynx-ice border border-lynx-sky/30 text-lynx-sky') : (isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-lynx-cloud border border-lynx-silver text-slate-500')}`}>Normal</button>
              <button onClick={() => setPriority('urgent')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${priority === 'urgent' ? (isDark ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-red-50 border border-red-300 text-red-600') : (isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-lynx-cloud border border-lynx-silver text-slate-500')}`}>Urgent</button>
            </div>
          </div>
        </div>
        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} flex gap-3`}>
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-medium ${isDark ? 'border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-600 hover:bg-lynx-cloud'}`}>Cancel</button>
          <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="flex-1 py-3 rounded-xl font-bold text-white bg-lynx-sky hover:bg-lynx-deep disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Warmup Timer Modal ──
function WarmupTimerModal({ onClose }) {
  const { isDark } = useTheme()
  const [seconds, setSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || seconds <= 0) return
    const interval = setInterval(() => {
      setSeconds(prev => { if (prev <= 1) { setRunning(false); return 0 }; return prev - 1 })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, seconds > 0])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0
  const isFinished = totalSeconds > 0 && seconds === 0 && !running
  const circumference = 2 * Math.PI * 90

  function startTimer(mins) { setTotalSeconds(mins * 60); setSeconds(mins * 60); setRunning(true) }
  function resetTimer() { setRunning(false); setSeconds(0); setTotalSeconds(0) }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={!running ? onClose : undefined}>
      <div className={`w-full max-w-sm text-center rounded-xl shadow-xl ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} ${isFinished ? 'ring-2 ring-emerald-500/40' : ''}`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center justify-center gap-3">
            <Timer className={`w-6 h-6 ${isFinished ? 'text-emerald-500' : 'text-amber-500'}`} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isFinished ? 'Time!' : 'Warmup Timer'}</h2>
          </div>
        </div>
        <div className="p-8">
          {totalSeconds === 0 ? (
            <div className="space-y-4">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select Duration</p>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 20].map(mins => (
                  <button key={mins} onClick={() => startTimer(mins)} className={`py-5 rounded-xl font-black text-2xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20 text-white hover:bg-amber-500/20' : 'bg-amber-50 border border-amber-200 text-slate-900 hover:bg-amber-100'}`}>
                    {mins}<span className={`text-sm ml-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>MIN</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="8" />
                  <circle cx="100" cy="100" r="90" fill="none" stroke={isFinished ? '#10b981' : '#f59e0b'} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-5xl font-black ${isFinished ? 'text-emerald-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                    {isFinished ? 'DONE' : `${minutes}:${secs.toString().padStart(2, '0')}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {running ? (
                  <button onClick={() => setRunning(false)} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>Pause</button>
                ) : seconds > 0 ? (
                  <button onClick={() => setRunning(true)} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>Resume</button>
                ) : null}
                <button onClick={resetTimer} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'border border-white/[0.06] text-slate-300' : 'border border-lynx-silver text-slate-600'}`}>Reset</button>
              </div>
            </div>
          )}
        </div>
        <div className={`p-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <button onClick={onClose} className={`w-full py-2.5 rounded-xl text-sm font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COACH DASHBOARD — Thin Shell
// ============================================
function CoachDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate, onPlayerSelect }) {
  const { profile, user } = useAuth()
  const { selectedSeason, seasons: availableSeasons, selectSeason } = useSeason()
  const { selectedSport } = useSport()
  const { isDark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [roster, setRoster] = useState([])
  const [teamRecord, setTeamRecord] = useState({ wins: 0, losses: 0, recentForm: [] })
  const [topPlayers, setTopPlayers] = useState([])
  const [selectedEventDetail, setSelectedEventDetail] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [pendingStats, setPendingStats] = useState(0)
  const [rsvpCounts, setRsvpCounts] = useState({})
  const [showCoachBlast, setShowCoachBlast] = useState(false)
  const [showWarmupTimer, setShowWarmupTimer] = useState(false)

  // V2 new state
  const [weeklyShoutouts, setWeeklyShoutouts] = useState(0)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [lineupCount, setLineupCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [checklistState, setChecklistState] = useState({
    lineupSet: false,
    rsvpsReviewed: false,
    lastGameStatsEntered: false,
    parentReminderSent: false, // manual only for now
  })
  const [showShoutoutModal, setShowShoutoutModal] = useState(false)

  // V2.1 Performance grid data
  const [scoringTrend, setScoringTrend] = useState([])
  const [statLeaders, setStatLeaders] = useState({})
  const [topPlayerTrend, setTopPlayerTrend] = useState(null)
  const [developmentData, setDevelopmentData] = useState(null)

  // V2.1 Command strip data
  const [avgAttendanceLast3, setAvgAttendanceLast3] = useState(null)
  const [weeklyEngagement, setWeeklyEngagement] = useState({ shoutouts: 0, challenges: 0, posts: 0 })
  const [rosterIssues, setRosterIssues] = useState(0)
  const [lineupSetForNextGame, setLineupSetForNextGame] = useState(false)
  const [lineupsSet, setLineupsSet] = useState(0)
  const [upcomingGamesCount, setUpcomingGamesCount] = useState(0)

  // V2.1 Workflow button badges
  const [newPlayersCount, setNewPlayersCount] = useState(0)

  const coachName = profile?.full_name?.split(' ')[0] || 'Coach'
  const coachTeamAssignments = roleContext?.coachInfo?.team_coaches || []

  // ── Data Loading ──
  useEffect(() => { loadCoachData() }, [coachTeamAssignments?.length, selectedSeason?.id])

  async function loadCoachData() {
    setLoading(true)
    try {
      const teamIds = coachTeamAssignments.map(tc => tc.team_id).filter(Boolean)
      if (teamIds.length === 0) { setTeams([]); setLoading(false); return }

      const { data: teamData } = await supabase.from('teams').select('*, seasons(name, sports(name, icon))').in('id', teamIds)
      const teamsWithCounts = []
      for (const team of (teamData || [])) {
        const { count } = await supabase.from('team_players').select('*', { count: 'exact', head: true }).eq('team_id', team.id)
        const assignment = coachTeamAssignments.find(a => a.team_id === team.id)
        teamsWithCounts.push({ ...team, playerCount: count || 0, coachRole: assignment?.role || 'coach' })
      }
      teamsWithCounts.sort((a, b) => {
        if (a.coachRole === 'head' && b.coachRole !== 'head') return -1
        if (b.coachRole === 'head' && a.coachRole !== 'head') return 1
        return 0
      })
      setTeams(teamsWithCounts)
      if (teamsWithCounts.length > 0) {
        const teamToSelect = selectedTeam ? teamsWithCounts.find(t => t.id === selectedTeam.id) || teamsWithCounts[0] : teamsWithCounts[0]
        setSelectedTeam(teamToSelect)
        await loadTeamData(teamToSelect)
      }
    } catch (err) { console.error('Error loading coach data:', err); setTeams([]) }
    setLoading(false)
  }

  async function loadTeamData(team) {
    if (!team) return
    try {
      const { data: players } = await supabase.from('team_players').select('*, players (id, first_name, last_name, photo_url, jersey_number, position)').eq('team_id', team.id)
      const rosterData = players?.map(p => p.players).filter(Boolean) || []
      setRoster(rosterData)

      const today = new Date().toISOString().split('T')[0]
      const { data: events } = await supabase.from('schedule_events').select('*').eq('team_id', team.id).gte('event_date', today).order('event_date', { ascending: true }).order('event_time', { ascending: true }).limit(10)
      setUpcomingEvents(events || [])

      const eventIds = (events || []).map(e => e.id)
      if (eventIds.length > 0) {
        const { data: rsvps } = await supabase.from('event_rsvps').select('event_id, status').in('event_id', eventIds)
        const rsvpMap = {}
        for (const rsvp of (rsvps || [])) {
          if (!rsvpMap[rsvp.event_id]) rsvpMap[rsvp.event_id] = { going: 0, maybe: 0, declined: 0, total: 0 }
          const s = rsvp.status?.toLowerCase()
          if (s === 'going' || s === 'yes') rsvpMap[rsvp.event_id].going++
          else if (s === 'maybe') rsvpMap[rsvp.event_id].maybe++
          else rsvpMap[rsvp.event_id].declined++
          rsvpMap[rsvp.event_id].total++
        }
        setRsvpCounts(rsvpMap)
      } else { setRsvpCounts({}) }

      const { data: completedGames } = await supabase.from('schedule_events').select('game_result, our_score, opponent_score, event_date').eq('team_id', team.id).eq('event_type', 'game').eq('game_status', 'completed').order('event_date', { ascending: false })
      let wins = 0, losses = 0
      const recentForm = []
      completedGames?.forEach((g, i) => {
        if (g.game_result === 'win') wins++
        else if (g.game_result === 'loss') losses++
        if (i < 5) recentForm.push({ result: g.game_result })
      })
      setTeamRecord({ wins, losses, recentForm })

      const { count: needsStatsCount } = await supabase.from('schedule_events').select('*', { count: 'exact', head: true }).eq('team_id', team.id).eq('event_type', 'game').eq('game_status', 'completed').eq('stats_entered', false)
      setPendingStats(needsStatsCount || 0)

      const playerIds = rosterData.map(p => p.id)
      if (playerIds.length > 0 && selectedSeason?.id) {
        const { data: seasonStats } = await supabase.from('player_season_stats').select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points, games_played').in('player_id', playerIds).eq('season_id', selectedSeason.id).order('total_points', { ascending: false }).limit(5)
        setTopPlayers(seasonStats || [])
      } else { setTopPlayers([]) }

      // V2: Weekly shoutout count
      try {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const { count: shoutoutCount } = await supabase
          .from('shoutouts')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .gte('created_at', weekAgo.toISOString())
        setWeeklyShoutouts(shoutoutCount || 0)
      } catch { setWeeklyShoutouts(0) }

      // V2: Active challenges with participant progress
      try {
        const { data: challenges } = await supabase
          .from('coach_challenges')
          .select('id, title, description, challenge_type, target_value, starts_at, ends_at, status, xp_reward')
          .eq('team_id', team.id)
          .eq('status', 'active')
          .order('ends_at', { ascending: true })
          .limit(3)

        const challengesWithProgress = []
        for (const ch of (challenges || [])) {
          const { data: participants } = await supabase
            .from('challenge_participants')
            .select('player_id, current_value, completed')
            .eq('challenge_id', ch.id)
          const completedCount = (participants || []).filter(p => p.completed).length
          const totalParticipants = (participants || []).length
          challengesWithProgress.push({ ...ch, completedCount, totalParticipants })
        }
        setActiveChallenges(challengesWithProgress)
      } catch { setActiveChallenges([]) }

      // V2: Unread messages count (simplified — count messages in team channel since 24h ago)
      try {
        const { data: channel } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('team_id', team.id)
          .limit(1)
          .maybeSingle()
        if (channel) {
          const dayAgo = new Date()
          dayAgo.setDate(dayAgo.getDate() - 1)
          const { count: msgCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id)
            .eq('is_deleted', false)
            .gte('created_at', dayAgo.toISOString())
          setUnreadMessages(msgCount || 0)
        } else { setUnreadMessages(0) }
      } catch { setUnreadMessages(0) }

      // ── V2.1 Queries ──

      // 1. Scoring trend — completed games with scores (Performance Grid cards 1 + 3)
      try {
        const { data: scoringGames } = await supabase
          .from('schedule_events')
          .select('event_date, our_score, opponent_score, opponent_name, our_sets_won, opponent_sets_won')
          .eq('team_id', team.id)
          .eq('game_status', 'completed')
          .not('our_score', 'is', null)
          .order('event_date', { ascending: true })
        setScoringTrend(scoringGames || [])
      } catch { setScoringTrend([]) }

      // 2. Stat leaders — max per category (Performance Grid card 5)
      try {
        if (playerIds.length > 0 && selectedSeason?.id) {
          const { data: allStats } = await supabase
            .from('player_season_stats')
            .select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists')
            .in('player_id', playerIds)
            .eq('season_id', selectedSeason.id)

          const categories = ['kills', 'aces', 'digs', 'blocks', 'assists']
          const columnMap = { kills: 'total_kills', aces: 'total_aces', digs: 'total_digs', blocks: 'total_blocks', assists: 'total_assists' }
          const leaders = {}
          for (const cat of categories) {
            const col = columnMap[cat]
            const sorted = (allStats || []).sort((a, b) => (b[col] || 0) - (a[col] || 0))
            if (sorted.length > 0 && sorted[0][col] > 0) {
              const player = rosterData.find(r => r.id === sorted[0].player_id)
              leaders[cat] = {
                name: player ? `${player.first_name || ''} ${(player.last_name || '')[0]}.` : '—',
                value: sorted[0][col],
                max: sorted[0][col]
              }
            }
          }
          setStatLeaders(leaders)
        } else { setStatLeaders({}) }
      } catch { setStatLeaders({}) }

      // 3. Top player trend — early vs late game stats (Performance Grid card 4)
      try {
        const seasonStats = topPlayers || []
        if (seasonStats.length > 0) {
          const topPlayerId = seasonStats[0].player_id
          const { data: gameStats } = await supabase
            .from('player_game_stats')
            .select('kills, aces, points_scored, created_at')
            .eq('player_id', topPlayerId)
            .order('created_at', { ascending: true })

          if (gameStats && gameStats.length >= 4) {
            const half = Math.floor(gameStats.length / 2)
            const early = gameStats.slice(0, half)
            const late = gameStats.slice(half)
            const avg = (arr, key) => arr.reduce((s, g) => s + (g[key] || 0), 0) / arr.length
            setTopPlayerTrend({
              kills: avg(late, 'kills') - avg(early, 'kills'),
              aces: avg(late, 'aces') - avg(early, 'aces'),
              points: avg(late, 'points_scored') - avg(early, 'points_scored'),
            })
          } else { setTopPlayerTrend(null) }
        } else { setTopPlayerTrend(null) }
      } catch { setTopPlayerTrend(null) }

      // 4. Player development — per-game team averages (Performance Grid card 6)
      try {
        if (playerIds.length > 0) {
          const { data: allGameStats } = await supabase
            .from('player_game_stats')
            .select('kills, aces, points_scored, game_result_id, created_at')
            .in('player_id', playerIds)
            .order('created_at', { ascending: true })

          if (allGameStats && allGameStats.length > 0) {
            const byGame = {}
            for (const s of allGameStats) {
              const key = s.game_result_id || s.created_at
              if (!byGame[key]) byGame[key] = { kills: 0, aces: 0, points: 0 }
              byGame[key].kills += s.kills || 0
              byGame[key].aces += s.aces || 0
              byGame[key].points += s.points_scored || 0
            }
            const gameArr = Object.values(byGame)
            if (gameArr.length >= 4) {
              const half = Math.floor(gameArr.length / 2)
              const earlyGames = gameArr.slice(0, half)
              const recentGames = gameArr.slice(half)
              const avg = (arr, key) => arr.reduce((s, g) => s + g[key], 0) / arr.length
              setDevelopmentData({
                early: { kills: avg(earlyGames, 'kills'), aces: avg(earlyGames, 'aces'), points: avg(earlyGames, 'points') },
                recent: { kills: avg(recentGames, 'kills'), aces: avg(recentGames, 'aces'), points: avg(recentGames, 'points') },
              })
            } else { setDevelopmentData(null) }
          } else { setDevelopmentData(null) }
        } else { setDevelopmentData(null) }
      } catch { setDevelopmentData(null) }

      // 5. Average attendance over last 3 events (Command Strip)
      try {
        const { data: recentEvents } = await supabase
          .from('schedule_events')
          .select('id')
          .eq('team_id', team.id)
          .lt('event_date', today)
          .order('event_date', { ascending: false })
          .limit(3)

        if (recentEvents && recentEvents.length > 0) {
          const eventIds = recentEvents.map(e => e.id)
          const { data: attendance } = await supabase
            .from('event_rsvps')
            .select('event_id, status')
            .in('event_id', eventIds)

          const totalPresent = attendance?.filter(a => {
            const s = a.status?.toLowerCase()
            return s === 'going' || s === 'yes' || s === 'present'
          }).length || 0
          const rosterSize = rosterData.length || 1
          const expectedTotal = rosterSize * recentEvents.length
          setAvgAttendanceLast3(expectedTotal > 0 ? Math.round((totalPresent / expectedTotal) * 100) : null)
        } else { setAvgAttendanceLast3(null) }
      } catch { setAvgAttendanceLast3(null) }

      // 6. Weekly engagement composite (Command Strip)
      try {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekStr = weekAgo.toISOString()

        const [shoutRes, postRes] = await Promise.all([
          supabase.from('shoutouts').select('*', { count: 'exact', head: true })
            .eq('team_id', team.id).gte('created_at', weekStr),
          supabase.from('team_posts').select('*', { count: 'exact', head: true })
            .eq('team_id', team.id).gte('created_at', weekStr),
        ])

        const { count: challengeCount } = await supabase
          .from('coach_challenges')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .eq('status', 'active')

        setWeeklyEngagement({
          shoutouts: shoutRes.count || 0,
          challenges: challengeCount || 0,
          posts: postRes.count || 0,
        })
      } catch { setWeeklyEngagement({ shoutouts: 0, challenges: 0, posts: 0 }) }

      // 7. Roster issues — missing jersey or position (Command Strip + Workflow)
      const missingJersey = rosterData.filter(p => !p.jersey_number).length
      const missingPosition = rosterData.filter(p => !p.position).length
      setRosterIssues(missingJersey + missingPosition)

      // 8. New players in last 7 days (Workflow Buttons)
      try {
        const weekAgoDate = new Date()
        weekAgoDate.setDate(weekAgoDate.getDate() - 7)
        const { data: tpWithDates } = await supabase
          .from('team_players')
          .select('joined_at')
          .eq('team_id', team.id)
          .gte('joined_at', weekAgoDate.toISOString())
        setNewPlayersCount(tpWithDates?.length || 0)
      } catch { setNewPlayersCount(0) }

      // 9. Lineup check for next game (Command Strip)
      const nextGameEvent = (events || []).find(e => e.event_type === 'game')
      if (nextGameEvent) {
        try {
          const { count: nextLineupCount } = await supabase
            .from('game_lineups')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', nextGameEvent.id)
            .eq('team_id', team.id)
          setLineupSetForNextGame((nextLineupCount || 0) > 0)
          setLineupCount(nextLineupCount || 0)
        } catch { setLineupSetForNextGame(false); setLineupCount(0) }
      } else { setLineupSetForNextGame(false); setLineupCount(0) }

      // 10. Lineups set for upcoming games (Command Strip)
      const upcomingGameEvents = (events || []).filter(e => e.event_type === 'game')
      setUpcomingGamesCount(upcomingGameEvents.length)
      if (upcomingGameEvents.length > 0) {
        try {
          const gameEventIds = upcomingGameEvents.map(e => e.id)
          const { data: allLineups } = await supabase
            .from('game_lineups')
            .select('event_id')
            .in('event_id', gameEventIds)
            .eq('team_id', team.id)
          const gamesWithLineups = new Set((allLineups || []).map(l => l.event_id))
          setLineupsSet(gamesWithLineups.size)
        } catch { setLineupsSet(0) }
      } else { setLineupsSet(0) }

    } catch (err) { console.error('Error loading team data:', err) }
  }

  function handleTeamSelect(team) { setSelectedTeam(team); loadTeamData(team) }
  function openTeamChat(teamId) { sessionStorage.setItem('openTeamChat', teamId); onNavigate?.('chats') }

  // ── Derived Values ──
  const nextEvent = upcomingEvents[0] || null
  const nextGame = upcomingEvents.find(e => e.event_type === 'game') || null
  const winRate = (teamRecord.wins + teamRecord.losses) > 0 ? Math.round((teamRecord.wins / (teamRecord.wins + teamRecord.losses)) * 100) : 0

  // Coach-level stats (across all teams)
  const totalPlayersAcrossTeams = teams.reduce((sum, t) => sum + (t.playerCount || 0), 0)
  const teamsCount = teams.length

  // Needs Attention items
  const needsAttentionItems = []
  if (pendingStats > 0) needsAttentionItems.push({ label: `${pendingStats} game${pendingStats > 1 ? 's' : ''} need stats`, action: () => onNavigate?.('gameprep'), color: '#F59E0B' })
  const nextEventRsvp = nextEvent && rsvpCounts[nextEvent.id]
  const notResponded = nextEvent ? Math.max(0, roster.length - (nextEventRsvp?.total || 0)) : 0
  if (notResponded > 0) needsAttentionItems.push({ label: `${notResponded} pending RSVPs`, action: () => onNavigate?.('schedule'), color: '#8B5CF6' })

  // V2: Players missing jersey numbers
  const missingJersey = roster.filter(p => !p.jersey_number).length
  if (missingJersey > 0) needsAttentionItems.push({
    label: `${missingJersey} player${missingJersey > 1 ? 's' : ''} need jersey #`,
    action: () => navigateToTeamWall?.(selectedTeam?.id),
    color: '#F59E0B'
  })

  // V2: Checklist auto-computation
  useEffect(() => {
    if (!selectedTeam || !nextEvent) return
    let cancelled = false

    async function computeChecklist() {
      const nextRsvp = rsvpCounts[nextEvent?.id]
      const rsvpPercent = roster.length > 0
        ? ((nextRsvp?.total || 0) / roster.length) * 100
        : 0

      // Check if lineup is set for next game
      let lineupSet = false
      if (nextEvent?.event_type === 'game') {
        try {
          const { count } = await supabase
            .from('game_lineups')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', nextEvent.id)
            .eq('team_id', selectedTeam.id)
          lineupSet = (count || 0) > 0
        } catch { lineupSet = false }
      }

      if (!cancelled) {
        setChecklistState(prev => ({
          ...prev,
          lineupSet,
          rsvpsReviewed: rsvpPercent >= 80,
          lastGameStatsEntered: pendingStats === 0,
          // parentReminderSent: manual only, stays as local state
        }))
      }
    }

    computeChecklist()
    return () => { cancelled = true }
  }, [nextEvent?.id, rsvpCounts, roster.length, pendingStats, selectedTeam?.id])

  function handleToggleManualChecklist(key) {
    setChecklistState(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`} style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 text-sm tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ── No Teams State ──
  if (teams.length === 0) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`} style={{ minHeight: '60vh' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className={`w-20 h-20 rounded-xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-lynx-sky/10 border border-lynx-sky/20' : 'bg-lynx-ice border border-lynx-sky/20'}`}>
            <Shield className="w-10 h-10 text-lynx-sky" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Teams Assigned</h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact your league administrator to get started.</p>
        </div>
      </div>
    )
  }

  // ── Main Render: 3-Column Layout ──
  return (
    <div className={`flex h-[calc(100vh-4rem)] overflow-hidden ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      <CoachLeftSidebar
        selectedTeam={selectedTeam}
        coachName={coachName}
        totalPlayers={totalPlayersAcrossTeams}
        teamsCount={teamsCount}
        winRate={winRate}
        needsAttentionItems={needsAttentionItems}
        selectedSeason={selectedSeason}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        openTeamChat={openTeamChat}
        onShowCoachBlast={() => setShowCoachBlast(true)}
        onShowWarmupTimer={() => setShowWarmupTimer(true)}
        onShowShoutout={() => setShowShoutoutModal(true)}
      />

      <CoachCenterDashboard
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamSelect={handleTeamSelect}
        nextGame={nextGame}
        nextEvent={nextEvent}
        teamRecord={teamRecord}
        winRate={winRate}
        selectedSeason={selectedSeason}
        availableSeasons={availableSeasons}
        selectSeason={selectSeason}
        coachName={coachName}
        roster={roster}
        topPlayers={topPlayers}
        pendingStats={pendingStats}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        openTeamChat={openTeamChat}
        userId={user?.id}
        showToast={showToast}
        onShowCoachBlast={() => setShowCoachBlast(true)}
        onShowWarmupTimer={() => setShowWarmupTimer(true)}
        onShowShoutout={() => setShowShoutoutModal(true)}
        onPlayerSelect={setSelectedPlayer}
        onEventSelect={setSelectedEventDetail}
        rsvpCounts={rsvpCounts}
        weeklyShoutouts={weeklyShoutouts}
        unreadMessages={unreadMessages}
        lineupCount={lineupCount}
        checklistState={checklistState}
        onToggleManualChecklist={handleToggleManualChecklist}
        // V2.1 Command Strip props
        lineupSetForNextGame={lineupSetForNextGame}
        rsvpPercentNextGame={nextEvent ? (rsvpCounts[nextEvent.id]?.total || 0) / Math.max(roster.length, 1) * 100 : 0}
        avgAttendanceLast3={avgAttendanceLast3}
        weeklyEngagement={weeklyEngagement}
        rosterIssues={rosterIssues}
        lineupsSet={lineupsSet}
        upcomingGamesCount={upcomingGamesCount}
        // V2.1 Workflow Button badges
        gameDayBadge={(() => {
          const now = new Date()
          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
          return upcomingEvents.filter(e => {
            if (e.event_type !== 'game' || e.game_status === 'completed') return false
            const d = new Date(e.event_date + 'T00:00:00')
            return d.toDateString() === now.toDateString() || d.toDateString() === tomorrow.toDateString()
          }).length
        })()}
        practiceBadge={upcomingEvents.filter(e => {
          if (e.event_type === 'game') return false
          const r = rsvpCounts[e.id]
          return roster.length > 0 && (!r || (r.going / roster.length) < 0.5)
        }).length}
        rosterBadge={newPlayersCount + rosterIssues}
        scheduleBadge={upcomingEvents.filter(e => {
          const r = rsvpCounts[e.id]
          return roster.length > 0 && (!r || (r.going / roster.length) < 0.5)
        }).length}
        // V2.1 Performance Grid data
        scoringTrend={scoringTrend}
        topPlayerTrend={topPlayerTrend}
        statLeaders={statLeaders}
        developmentData={developmentData}
      />

      <CoachRosterPanel
        roster={roster}
        selectedTeam={selectedTeam}
        teamRecord={teamRecord}
        winRate={winRate}
        topPlayers={topPlayers}
        upcomingEvents={upcomingEvents}
        rsvpCounts={rsvpCounts}
        activeChallenges={activeChallenges}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        onPlayerSelect={setSelectedPlayer}
        onEventSelect={setSelectedEventDetail}
      />

      {/* Modals — DO NOT DELETE */}
      {selectedEventDetail && (
        <EventDetailModal event={selectedEventDetail} team={selectedTeam} onClose={() => setSelectedEventDetail(null)} />
      )}
      {selectedPlayer && (
        <PlayerCardExpanded
          player={selectedPlayer} visible={!!selectedPlayer} onClose={() => setSelectedPlayer(null)}
          context="coach_dashboard" viewerRole="coach" seasonId={selectedSeason?.id}
          sport={selectedSport?.name || 'volleyball'} isOwnChild={false}
        />
      )}
      {showCoachBlast && selectedTeam && (
        <CoachBlastModal team={selectedTeam} onClose={() => setShowCoachBlast(false)} showToast={showToast} />
      )}
      {showWarmupTimer && (
        <WarmupTimerModal onClose={() => setShowWarmupTimer(false)} />
      )}
      {showShoutoutModal && selectedTeam && (
        <GiveShoutoutModal
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          onClose={() => setShowShoutoutModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}

export { CoachDashboard }
