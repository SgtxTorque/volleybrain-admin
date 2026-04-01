import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { sanitizeText } from '../../lib/validation'
import { PlayerCardExpanded } from '../../components/players'
import {
  Calendar, MapPin, X, Swords, Shield, Send,
} from '../../constants/icons'
import { formatTime12, countdownText } from '../../lib/date-helpers'
import GiveShoutoutModal from '../../components/engagement/GiveShoutoutModal'
import {
  HeroCard, AttentionStrip, BodyTabs, WeeklyLoad, ThePlaybook,
  MascotNudge, V2DashboardLayout,
} from '../../components/v2'
import TeamSwitcher from '../../components/v2/coach/TeamSwitcher'
import GameDayCard from '../../components/v2/coach/GameDayCard'
import ShoutoutCard from '../../components/v2/coach/ShoutoutCard'
import CoachRosterTab from '../../components/v2/coach/CoachRosterTab'
import CoachScheduleTab from '../../components/v2/coach/CoachScheduleTab'
import CoachStatsTab from '../../components/v2/coach/CoachStatsTab'
import CoachGamePrepTab from '../../components/v2/coach/CoachGamePrepTab'
import CoachEngagementTab from '../../components/v2/coach/CoachEngagementTab'
import { CoachLevelCard, CoachActivityCard, CoachBadgesCard, TeamPulseCard } from '../../components/v2/coach/CoachEngagementColumn'
import { getLevelFromXP, getLevelTier } from '../../lib/engagement-constants'

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
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-r-2xl font-bold ${isDark ? 'bg-lynx-graphite text-lynx-sky border border-lynx-border-dark' : 'bg-lynx-ice text-lynx-sky border border-lynx-sky/20'}`}>
              {event.event_type === 'game' ? '🏐' : '⚡'}
            </div>
            <div>
              <h2 className={`text-r-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.title || event.event_type}</h2>
              <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{team?.name}</p>
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
              {event.event_time && <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatTime12(event.event_time)}</p>}
            </div>
          </div>
          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-lynx-sky" />
              <div>
                <p className={`${isDark ? 'text-white' : 'text-slate-900'}`}>{event.venue_name || event.location}</p>
                {event.venue_address && <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event.venue_address}</p>}
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
            <div className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-brand-off-white border border-slate-100'}`}>
              <p className={`text-r-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{event.notes}</p>
            </div>
          )}
        </div>
        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-medium ${isDark ? 'border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-600 hover:bg-brand-off-white'}`}>Close</button>
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
              <h2 className={`text-r-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Message Parents</h2>
              <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Send to {team?.name} parents</p>
            </div>
            <button onClick={onClose} className={`ml-auto p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`text-r-sm font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Subject</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Practice time change tomorrow" className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500' : 'bg-brand-off-white border border-lynx-silver text-slate-900 placeholder-slate-400'}`} />
          </div>
          <div>
            <label className={`text-r-sm font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message to parents..." rows={4} className={`w-full px-4 py-3 rounded-xl resize-none ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500' : 'bg-brand-off-white border border-lynx-silver text-slate-900 placeholder-slate-400'}`} />
          </div>
          <div>
            <label className={`text-r-sm font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Priority</label>
            <div className="flex gap-2">
              <button onClick={() => setPriority('normal')} className={`px-4 py-2 rounded-lg text-r-base font-semibold ${priority === 'normal' ? (isDark ? 'bg-lynx-sky/10 border border-lynx-sky/30 text-lynx-sky' : 'bg-lynx-ice border border-lynx-sky/30 text-lynx-sky') : (isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-brand-off-white border border-lynx-silver text-slate-500')}`}>Normal</button>
              <button onClick={() => setPriority('urgent')} className={`px-4 py-2 rounded-lg text-r-base font-semibold ${priority === 'urgent' ? (isDark ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-red-50 border border-red-300 text-red-600') : (isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-brand-off-white border border-lynx-silver text-slate-500')}`}>Urgent</button>
            </div>
          </div>
        </div>
        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} flex gap-3`}>
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-medium ${isDark ? 'border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-600 hover:bg-brand-off-white'}`}>Cancel</button>
          <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="flex-1 py-3 rounded-xl font-bold text-white bg-lynx-sky hover:bg-lynx-deep disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COACH DASHBOARD — Thin Shell
// ============================================
function CoachDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate, onPlayerSelect, activeView, availableViews = [], onSwitchRole }) {
  const { profile, user } = useAuth()
  const { selectedSeason, seasons: availableSeasons, selectSeason } = useSeason()
  const { selectedSport } = useSport()
  const { isDark, toggleTheme } = useTheme()

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
  const [evalData, setEvalData] = useState([])
  const [activeTab, setActiveTab] = useState('roster')

  // Engagement column state
  const [coachBadges, setCoachBadges] = useState([])
  const [totalAchievements, setTotalAchievements] = useState(0)
  const [gamesWithStats, setGamesWithStats] = useState(0)

  const coachName = profile?.full_name?.split(' ')[0] || 'Coach'
  const coachTeamAssignments = roleContext?.coachInfo?.team_coaches || []

  // Derive coach-scoped seasons from their teams' season_ids
  const coachSeasonIds = useMemo(() => {
    const ids = new Set()
    for (const tc of coachTeamAssignments) {
      if (tc.teams?.season_id) ids.add(tc.teams.season_id)
    }
    return ids
  }, [coachTeamAssignments])
  const coachSeasons = useMemo(() =>
    availableSeasons.filter(s => coachSeasonIds.has(s.id)),
    [availableSeasons, coachSeasonIds]
  )

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
      const { data: players } = await supabase.from('team_players').select('*, players (id, first_name, last_name, photo_url, jersey_number, position, parent_name, parent_phone, parent_email)').eq('team_id', team.id)
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
        if (i < 5) recentForm.push(g.game_result === 'win' ? 'W' : 'L')
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

      // 11. Player skill evaluations (Stats & Evals tab)
      try {
        if (playerIds.length > 0) {
          const { data: ratings } = await supabase
            .from('player_skill_ratings')
            .select('player_id, overall_rating, serve, pass, attack, block, dig, set_skill, created_at')
            .in('player_id', playerIds)
            .order('created_at', { ascending: false })
          // Group by player_id, keep most recent eval per player
          const latestByPlayer = {}
          for (const r of (ratings || [])) {
            if (!latestByPlayer[r.player_id]) latestByPlayer[r.player_id] = r
          }
          setEvalData(Object.values(latestByPlayer))
        } else { setEvalData([]) }
      } catch { setEvalData([]) }

      // 12. Coach badges for engagement column
      try {
        const { data: badgeData } = await supabase
          .from('player_achievements')
          .select('id, earned_at, achievement:achievement_id(id, name, icon, icon_url, badge_image_url, rarity)')
          .eq('player_id', user?.id)
          .order('earned_at', { ascending: false })
          .limit(10)
        setCoachBadges((badgeData || []).map(b => ({
          name: b.achievement?.name,
          icon: b.achievement?.icon,
          imageUrl: b.achievement?.badge_image_url || b.achievement?.icon_url,
        })))
        // Total achievement count
        const { count: totalAch } = await supabase
          .from('achievements')
          .select('*', { count: 'exact', head: true })
        setTotalAchievements(totalAch || 0)
      } catch { setCoachBadges([]); setTotalAchievements(0) }

      // 13. Games with stats entered this week
      try {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const { count: statsCount } = await supabase
          .from('schedule_events')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .eq('event_type', 'game')
          .eq('stats_entered', true)
          .gte('event_date', weekAgo.toISOString().split('T')[0])
        setGamesWithStats(statsCount || 0)
      } catch { setGamesWithStats(0) }

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

  // Needs Attention items — typed for CoachActionItemsCard mobile-tone copy
  const needsAttentionItems = []
  if (pendingStats > 0) needsAttentionItems.push({ type: 'pending_stats', count: pendingStats, page: 'gameprep' })
  const nextEventRsvp = nextEvent && rsvpCounts[nextEvent.id]
  const notResponded = nextEvent ? Math.max(0, roster.length - (nextEventRsvp?.total || 0)) : 0
  if (notResponded > 0) needsAttentionItems.push({ type: 'pending_rsvps', count: notResponded, page: 'schedule' })

  // Players missing jersey numbers
  const missingJersey = roster.filter(p => !p.jersey_number).length
  if (missingJersey > 0) needsAttentionItems.push({
    type: 'missing_jerseys', count: missingJersey, text: `${missingJersey} player${missingJersey > 1 ? 's' : ''} need jersey numbers assigned`, page: 'teams'
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

  // (Old coachWidgets grid array removed — v2 uses fixed layout)

  // ── Loading State ──
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`} style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 text-r-base tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ── No Teams State ──
  if (teams.length === 0) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`} style={{ minHeight: '60vh' }}>
        <div className="text-center px-6">
          <div className={`w-20 h-20 rounded-xl mx-auto mb-r-4 flex items-center justify-center ${isDark ? 'bg-lynx-sky/10 border border-lynx-sky/20' : 'bg-lynx-ice border border-lynx-sky/20'}`}>
            <Shield className="w-10 h-10 text-lynx-sky" />
          </div>
          <h2 className={`text-r-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Teams Assigned</h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact your league administrator to get started.</p>
        </div>
      </div>
    )
  }

  // ── Coach greeting logic (extracted from CoachHeroCarousel state machine) ──
  const getCoachGreeting = () => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const todayStr = new Date().toISOString().split('T')[0]
    const todayGame = upcomingEvents.find(e => e.event_type === 'game' && e.event_date === todayStr)
    const todayPractice = upcomingEvents.find(e => (e.event_type === 'practice' || e.event_type === 'training') && e.event_date === todayStr)

    if (todayGame) return `Game day, ${coachName}! Let's go.`
    if (todayPractice) return `Practice day, ${coachName}. Let's get after it.`
    if (nextGame) return `${timeGreeting}, ${coachName}. Game coming up.`
    return `${timeGreeting}, ${coachName}.`
  }

  const getCoachSubLine = () => {
    const parts = [selectedTeam?.name || 'Your Team']
    if (selectedSeason?.name) parts.push(selectedSeason.name)
    parts.push(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    return parts.join(' · ')
  }

  // Next game countdown
  const getGameCountdown = () => {
    if (!nextGame?.event_date) return null
    try {
      return countdownText(nextGame.event_date, nextGame.event_time)
    } catch { return null }
  }

  const nextGameRsvp = nextGame ? rsvpCounts[nextGame.id] : null
  const attentionCount = needsAttentionItems.length

  // ── Engagement column computed data ──
  const coachXp = (teamRecord.wins * 100) + (roster.length * 10) + (weeklyShoutouts * 10) + (evalData.length * 25)
  const coachLevelInfo = getLevelFromXP(coachXp)
  const coachTier = getLevelTier(coachLevelInfo.level)

  // Team pulse — heuristic based on RSVP activity
  const teamPulse = useMemo(() => {
    // Active: has RSVP in any upcoming event; Drifting: has profile but no RSVP; Inactive: none
    const playerIdsWithRsvp = new Set()
    Object.values(rsvpCounts).forEach(rsvps => {
      // rsvpCounts is aggregated, not per-player — use a simpler heuristic
    })
    // Simple heuristic: players who have position + jersey = active, missing one = drifting, missing both = inactive
    let active = 0, drifting = 0, inactive = 0
    roster.forEach(p => {
      const hasPosition = !!p.position
      const hasJersey = !!p.jersey_number
      if (hasPosition && hasJersey) active++
      else if (hasPosition || hasJersey) drifting++
      else inactive++
    })
    return { active, drifting, inactive }
  }, [roster])

  // Next badge hint
  const nextBadgeHint = weeklyShoutouts < 5
    ? `${5 - weeklyShoutouts} more shoutout${5 - weeklyShoutouts !== 1 ? 's' : ''} for Hype Coach`
    : evalData.length < 10
      ? `${10 - evalData.length} more eval${10 - evalData.length !== 1 ? 's' : ''} for Scout Master`
      : null

  // ── Main Render ──
  return (
    <>
      <V2DashboardLayout
        engagementContent={
          <>
            <CoachLevelCard
              levelInfo={coachLevelInfo}
              tierName={coachTier.name}
              xp={coachXp}
              onNavigateAchievements={() => onNavigate?.('achievements')}
            />
            <CoachActivityCard
              shoutouts={weeklyShoutouts}
              challenges={weeklyEngagement.challenges}
              statsEntered={gamesWithStats}
              evalsDone={evalData.length}
              nextBadgeHint={nextBadgeHint}
            />
            <CoachBadgesCard
              earnedCount={coachBadges.length}
              totalCount={totalAchievements}
              badges={coachBadges}
              onNavigateAchievements={() => onNavigate?.('achievements')}
            />
            <TeamPulseCard
              active={teamPulse.active}
              drifting={teamPulse.drifting}
              inactive={teamPulse.inactive}
            />
          </>
        }
        mainContent={
          <>
            {/* HERO CARD */}
            <HeroCard
              orgLine={selectedTeam?.name || 'Your Team'}
              greeting={getCoachGreeting()}
              subLine={getCoachSubLine()}
              stats={[
                { value: roster.length, label: 'Roster' },
                { value: avgAttendanceLast3 != null ? `${avgAttendanceLast3}%` : '—', label: 'Attendance' },
                { value: `${teamRecord.wins}-${teamRecord.losses}`, label: 'Record' },
                { value: notResponded || 0, label: 'No RSVP', color: notResponded > 0 ? 'red' : undefined },
              ]}
            />

            {/* TEAM SWITCHER */}
            <TeamSwitcher
              teams={teams}
              selectedTeamId={selectedTeam?.id}
              onTeamSelect={handleTeamSelect}
            />

            {/* MASCOT NUDGE */}
            {notResponded > 0 && (
              <MascotNudge
                message={<>Hey {coachName}! <strong>{notResponded} player{notResponded !== 1 ? 's' : ''}</strong> haven&apos;t RSVP&apos;d for the next event. Want to send a nudge?</>}
                primaryAction={{ label: 'Send reminders', onClick: () => setShowCoachBlast(true) }}
                secondaryAction={{ label: 'Not now', onClick: () => {} }}
              />
            )}

            {/* ATTENTION STRIP */}
            {attentionCount > 0 && (
              <AttentionStrip
                message={`${attentionCount} item${attentionCount !== 1 ? 's' : ''} need${attentionCount === 1 ? 's' : ''} your attention`}
                ctaLabel="REVIEW →"
                onClick={() => onNavigate?.('schedule')}
              />
            )}

            {/* BODY TABS */}
            <BodyTabs
              tabs={[
                { id: 'roster', label: 'Roster' },
                { id: 'schedule', label: 'Schedule' },
                { id: 'stats', label: 'Stats & Evals' },
                { id: 'gameprep', label: 'Game Prep' },
                { id: 'engagement', label: 'Engagement' },
              ]}
              activeTabId={activeTab}
              onTabChange={setActiveTab}
              footerLink={activeTab === 'roster' ? { label: `View full roster (${roster.length}) →`, onClick: () => onNavigate?.('teams') } : undefined}
            >
              {activeTab === 'roster' && (
                <CoachRosterTab roster={roster} rsvpCounts={rsvpCounts} nextEventId={nextEvent?.id} onPlayerClick={(player) => onNavigate?.(`player-${player.id}`)} />
              )}
              {activeTab === 'schedule' && (
                <CoachScheduleTab upcomingEvents={upcomingEvents} rsvpCounts={rsvpCounts} rosterSize={roster.length} onEventClick={setSelectedEventDetail} onNavigate={onNavigate} />
              )}
              {activeTab === 'stats' && (
                <CoachStatsTab topPlayers={topPlayers} roster={roster} evalData={evalData} onPlayerClick={(player) => onNavigate?.(`player-${player.id}`)} />
              )}
              {activeTab === 'gameprep' && (
                <CoachGamePrepTab checklistState={checklistState} onToggleItem={handleToggleManualChecklist} nextEvent={nextEvent} onNavigate={onNavigate} />
              )}
              {activeTab === 'engagement' && (
                <CoachEngagementTab
                  activeChallenges={activeChallenges}
                  weeklyShoutouts={weeklyShoutouts}
                  weeklyEngagement={weeklyEngagement}
                  onGiveShoutout={() => setShowShoutoutModal(true)}
                  onCreateChallenge={() => onNavigate?.('teams')}
                  onNavigate={onNavigate}
                />
              )}
            </BodyTabs>
          </>
        }

        sideContent={
          <>
            {/* GAME DAY CARD */}
            {nextGame && (
              <GameDayCard
                overline="Next Game"
                countdownText={getGameCountdown() ? `⏱ ${getGameCountdown()}` : undefined}
                matchup={`${selectedTeam?.name || 'Your Team'} vs. ${nextGame.opponent_name || 'TBD'}`}
                details={`${new Date(nextGame.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · ${nextGame.location || 'TBD'} · ${nextGame.event_time ? formatTime12(nextGame.event_time) : ''}`}
                confirmed={nextGameRsvp?.going || 0}
                pending={Math.max(0, roster.length - (nextGameRsvp?.total || 0))}
                seasonRecord={`${teamRecord.wins}-${teamRecord.losses}`}
                ctaLabel="Start Game Day Mode →"
                onCtaClick={() => onNavigate?.('gameprep')}
              />
            )}

            {/* WEEKLY LOAD */}
            <WeeklyLoad
              title="This Week"
              dateRange={selectedTeam?.name || 'Team Schedule'}
              events={(() => {
                const now = new Date()
                const endOfWeek = new Date(now)
                endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
                return (upcomingEvents || [])
                  .filter(evt => new Date(evt.event_date) <= endOfWeek)
                  .slice(0, 7)
                  .map(evt => ({
                    dayName: new Date(evt.event_date).toLocaleDateString('en-US', { weekday: 'short' }),
                    dayNum: new Date(evt.event_date).getDate(),
                    isToday: new Date(evt.event_date).toDateString() === new Date().toDateString(),
                    title: evt.title || evt.event_type?.replace('_', ' ') || 'Event',
                    meta: `${evt.location || 'TBD'} · ${evt.event_time ? formatTime12(evt.event_time) : ''}`,
                  }))
              })()}
            />

            {/* THE PLAYBOOK */}
            <ThePlaybook
              actions={[
                { emoji: '📋', label: 'Attendance', onClick: () => onNavigate?.('attendance'), isPrimary: true },
                { emoji: '⚡', label: 'Lineup', onClick: () => onNavigate?.('gameprep') },
                { emoji: '⭐', label: 'Shoutout', onClick: () => setShowShoutoutModal(true) },
                { emoji: '📊', label: 'Enter Stats', onClick: () => onNavigate?.('gameprep') },
                { emoji: '💬', label: 'Message', onClick: () => setShowCoachBlast(true) },
                { emoji: '🏆', label: 'Challenge', onClick: () => onNavigate?.('teams') },
              ]}
            />

            {/* SHOUTOUT CARD */}
            <ShoutoutCard
              quote={weeklyShoutouts > 0 ? `${weeklyShoutouts} shoutout${weeklyShoutouts !== 1 ? 's' : ''} given this week — keep the energy going!` : null}
              fromLabel={weeklyShoutouts > 0 ? `— ${coachName}` : undefined}
            />
          </>
        }
      />

      {/* Modals — DO NOT DELETE */}
      {selectedEventDetail && (
        <EventDetailModal event={selectedEventDetail} team={selectedTeam} onClose={() => setSelectedEventDetail(null)} />
      )}
      {selectedPlayer && (
        <PlayerCardExpanded
          player={selectedPlayer} visible={!!selectedPlayer} onClose={() => setSelectedPlayer(null)}
          context="coach_dashboard" viewerRole="coach" seasonId={selectedSeason?.id}
          sport={selectedSport?.name || ''} isOwnChild={false}
        />
      )}
      {showCoachBlast && selectedTeam && (
        <CoachBlastModal team={selectedTeam} onClose={() => setShowCoachBlast(false)} showToast={showToast} />
      )}
      {showShoutoutModal && selectedTeam && (
        <GiveShoutoutModal
          visible={showShoutoutModal}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          onClose={() => setShowShoutoutModal(false)}
          onSuccess={() => { setShowShoutoutModal(false); showToast?.('Shoutout sent!', 'success') }}
          showToast={showToast}
        />
      )}
    </>
  )
}

export { CoachDashboard }
