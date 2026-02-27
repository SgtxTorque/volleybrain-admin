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

// ── Helpers ──
function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return hour12 + ':' + minutes + ' ' + ampm
  } catch { return timeStr }
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

// ── Event Detail Modal ──
function EventDetailModal({ event, team, onClose }) {
  if (!event) return null
  const eventDate = event.event_date ? new Date(event.event_date + 'T00:00:00') : null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl shadow-xl bg-white border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl" style={{ backgroundColor: team?.color || '#3B82F6' }}>
              {event.event_type === 'game' ? '🏐' : '⚡'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{event.title || event.event_type}</h2>
              <p className="text-slate-500 text-sm">{team?.name}</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-slate-900">{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className="text-slate-500 text-sm">{formatTime12(event.event_time)}</p>}
            </div>
          </div>
          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-slate-900">{event.venue_name || event.location}</p>
                {event.venue_address && <p className="text-sm text-slate-500">{event.venue_address}</p>}
              </div>
            </div>
          )}
          {event.opponent_name && (
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-amber-500" />
              <p className="text-slate-900">vs {event.opponent_name}</p>
            </div>
          )}
          {event.notes && (
            <div className="rounded-xl p-4 bg-slate-50 border border-slate-100">
              <p className="text-sm text-slate-600">{event.notes}</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-3 rounded-xl font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Coach Blast Modal ──
function CoachBlastModal({ team, onClose, showToast }) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl shadow-xl bg-white border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 border border-purple-100">
              <Send className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Message Parents</h2>
              <p className="text-sm text-slate-500">Send to {team?.name} parents</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5 text-slate-500">Subject</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Practice time change tomorrow" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5 text-slate-500">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message to parents..." rows={4} className="w-full px-4 py-3 rounded-xl resize-none bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5 text-slate-500">Priority</label>
            <div className="flex gap-2">
              <button onClick={() => setPriority('normal')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${priority === 'normal' ? 'bg-blue-50 border border-blue-300 text-blue-600' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>Normal</button>
              <button onClick={() => setPriority('urgent')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${priority === 'urgent' ? 'bg-red-50 border border-red-300 text-red-600' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>Urgent</button>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Warmup Timer Modal ──
function WarmupTimerModal({ onClose }) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={!running ? onClose : undefined}>
      <div className={`w-full max-w-sm text-center rounded-xl shadow-xl bg-white border border-slate-200 ${isFinished ? 'ring-2 ring-emerald-500/40' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-center gap-3">
            <Timer className={`w-6 h-6 ${isFinished ? 'text-emerald-500' : 'text-amber-500'}`} />
            <h2 className="text-xl font-bold text-slate-900">{isFinished ? 'Time!' : 'Warmup Timer'}</h2>
          </div>
        </div>
        <div className="p-8">
          {totalSeconds === 0 ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-slate-500">Select Duration</p>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 20].map(mins => (
                  <button key={mins} onClick={() => startTimer(mins)} className="py-5 rounded-xl font-black text-2xl bg-amber-50 border border-amber-200 text-slate-900 hover:bg-amber-100">
                    {mins}<span className="text-sm ml-1 text-slate-400">MIN</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="8" />
                  <circle cx="100" cy="100" r="90" fill="none" stroke={isFinished ? '#10b981' : '#f59e0b'} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-5xl font-black ${isFinished ? 'text-emerald-500' : 'text-slate-900'}`}>
                    {isFinished ? 'DONE' : `${minutes}:${secs.toString().padStart(2, '0')}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {running ? (
                  <button onClick={() => setRunning(false)} className="flex-1 py-3 rounded-xl font-bold bg-red-50 border border-red-200 text-red-600">Pause</button>
                ) : seconds > 0 ? (
                  <button onClick={() => setRunning(true)} className="flex-1 py-3 rounded-xl font-bold bg-emerald-50 border border-emerald-200 text-emerald-600">Resume</button>
                ) : null}
                <button onClick={resetTimer} className="flex-1 py-3 rounded-xl font-bold border border-slate-200 text-slate-600">Reset</button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900">Close</button>
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

      const { data: needsStats } = await supabase.from('schedule_events').select('id', { count: 'exact', head: true }).eq('team_id', team.id).eq('event_type', 'game').eq('game_status', 'completed').eq('stats_entered', false)
      setPendingStats(needsStats || 0)

      const playerIds = rosterData.map(p => p.id)
      if (playerIds.length > 0 && selectedSeason?.id) {
        const { data: seasonStats } = await supabase.from('player_season_stats').select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points, games_played').in('player_id', playerIds).eq('season_id', selectedSeason.id).order('total_points', { ascending: false }).limit(5)
        setTopPlayers(seasonStats || [])
      } else { setTopPlayers([]) }
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

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm tracking-wide text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ── No Teams State ──
  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50" style={{ minHeight: '60vh' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-xl mx-auto mb-6 flex items-center justify-center bg-blue-50 border border-blue-100">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900">No Teams Assigned</h2>
          <p className="text-slate-500">Contact your league administrator to get started.</p>
        </div>
      </div>
    )
  }

  // ── Main Render: 3-Column Layout ──
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
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
        onPlayerSelect={setSelectedPlayer}
        onEventSelect={setSelectedEventDetail}
      />

      <CoachRosterPanel
        roster={roster}
        selectedTeam={selectedTeam}
        teamRecord={teamRecord}
        winRate={winRate}
        topPlayers={topPlayers}
        upcomingEvents={upcomingEvents}
        rsvpCounts={rsvpCounts}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        onPlayerSelect={setSelectedPlayer}
      />

      {/* Modals */}
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
    </div>
  )
}

export { CoachDashboard }
