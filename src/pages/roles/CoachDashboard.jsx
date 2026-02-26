import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { sanitizeText } from '../../lib/validation'
import { PlayerCardExpanded } from '../../components/players'
import {
  Calendar, MapPin, Clock, Users, ChevronRight, Check,
  Target, MessageCircle, X, ClipboardList,
  TrendingUp, Star, Award, Zap, Shield, Crosshair,
  Swords, Crown, Activity, Trophy, Bell,
  Send, Timer, Megaphone, UserCheck, UserX
} from '../../constants/icons'

// ============================================
// HELPER FUNCTIONS
// ============================================
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

// ============================================
// EVENT DETAIL MODAL
// ============================================
function EventDetailModal({ event, team, onClose, isDark }) {
  if (!event) return null
  const eventDate = event.event_date ? new Date(event.event_date + 'T00:00:00') : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl ${
          isDark ? 'bg-slate-800 border border-white/[0.08]' : 'bg-white border border-slate-200'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: team?.color || '#3B82F6' }}
            >
              {event.event_type === 'game' ? '🏐' : '⚡'}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.title || event.event_type}</h2>
              <p className="text-slate-500 text-sm">{team?.name}</p>
            </div>
            <button onClick={onClose} className={`ml-auto p-2 rounded-lg transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className={isDark ? 'text-white' : 'text-slate-900'}>{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className="text-slate-500 text-sm">{formatTime12(event.event_time)}</p>}
            </div>
          </div>

          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              <div>
                <p className={isDark ? 'text-white' : 'text-slate-900'}>{event.venue_name || event.location}</p>
                {event.venue_address && <p className="text-sm text-slate-500">{event.venue_address}</p>}
              </div>
            </div>
          )}

          {event.opponent_name && (
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-amber-500" />
              <p className={isDark ? 'text-white' : 'text-slate-900'}>vs {event.opponent_name}</p>
            </div>
          )}

          {event.notes && (
            <div className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-slate-100'}`}>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{event.notes}</p>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-medium transition ${
            isDark ? 'border border-white/[0.08] text-slate-300 hover:bg-white/[0.03]' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COACH DASHBOARD
// ============================================
function CoachDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate, onPlayerSelect }) {
  const { profile, user } = useAuth()
  const { selectedSeason } = useSeason()
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

  const coachName = profile?.full_name?.split(' ')[0] || 'Coach'
  const coachTeamAssignments = roleContext?.coachInfo?.team_coaches || []

  // Card styling helpers
  const cardClass = isDark
    ? 'bg-slate-800 border border-white/[0.08] rounded-2xl'
    : 'bg-white border border-slate-200 rounded-2xl shadow-sm'
  const cardHoverClass = 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'
  const sectionLabel = `text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-400'}`
  const textPrimary = isDark ? 'text-white' : 'text-slate-900'
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500'
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400'
  const dividerClass = isDark ? 'border-white/[0.06]' : 'border-slate-100'

  // ── Data Loading ──
  useEffect(() => {
    loadCoachData()
  }, [coachTeamAssignments?.length, selectedSeason?.id])

  async function loadCoachData() {
    setLoading(true)
    try {
      const teamIds = coachTeamAssignments.map(tc => tc.team_id).filter(Boolean)
      if (teamIds.length === 0) {
        setTeams([])
        setLoading(false)
        return
      }

      const { data: teamData } = await supabase
        .from('teams')
        .select('*, seasons(name, sports(name, icon))')
        .in('id', teamIds)

      const teamsWithCounts = []
      for (const team of (teamData || [])) {
        const { count } = await supabase
          .from('team_players')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)

        const assignment = coachTeamAssignments.find(a => a.team_id === team.id)
        teamsWithCounts.push({
          ...team,
          playerCount: count || 0,
          coachRole: assignment?.role || 'coach'
        })
      }

      teamsWithCounts.sort((a, b) => {
        if (a.coachRole === 'head' && b.coachRole !== 'head') return -1
        if (b.coachRole === 'head' && a.coachRole !== 'head') return 1
        return 0
      })

      setTeams(teamsWithCounts)

      if (teamsWithCounts.length > 0) {
        const teamToSelect = selectedTeam
          ? teamsWithCounts.find(t => t.id === selectedTeam.id) || teamsWithCounts[0]
          : teamsWithCounts[0]
        setSelectedTeam(teamToSelect)
        await loadTeamData(teamToSelect)
      }
    } catch (err) {
      console.error('Error loading coach data:', err)
      setTeams([])
    }
    setLoading(false)
  }

  async function loadTeamData(team) {
    if (!team) return

    try {
      // Load roster
      const { data: players } = await supabase
        .from('team_players')
        .select('*, players (id, first_name, last_name, photo_url, jersey_number, position)')
        .eq('team_id', team.id)

      const rosterData = players?.map(p => p.players).filter(Boolean) || []
      setRoster(rosterData)

      // Load upcoming events
      const today = new Date().toISOString().split('T')[0]
      const { data: events } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', team.id)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(10)

      setUpcomingEvents(events || [])

      // Load RSVP counts for upcoming events
      const eventIds = (events || []).map(e => e.id)
      if (eventIds.length > 0) {
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select('event_id, status')
          .in('event_id', eventIds)

        const rsvpMap = {}
        for (const rsvp of (rsvps || [])) {
          if (!rsvpMap[rsvp.event_id]) {
            rsvpMap[rsvp.event_id] = { going: 0, maybe: 0, declined: 0, total: 0 }
          }
          const s = rsvp.status?.toLowerCase()
          if (s === 'going' || s === 'yes') rsvpMap[rsvp.event_id].going++
          else if (s === 'maybe') rsvpMap[rsvp.event_id].maybe++
          else rsvpMap[rsvp.event_id].declined++
          rsvpMap[rsvp.event_id].total++
        }
        setRsvpCounts(rsvpMap)
      } else {
        setRsvpCounts({})
      }

      // Load team record from schedule_events (not legacy games table)
      const { data: completedGames } = await supabase
        .from('schedule_events')
        .select('game_result, our_score, opponent_score, event_date')
        .eq('team_id', team.id)
        .eq('event_type', 'game')
        .eq('game_status', 'completed')
        .order('event_date', { ascending: false })

      let wins = 0, losses = 0
      const recentForm = []

      completedGames?.forEach((g, i) => {
        if (g.game_result === 'win') wins++
        else if (g.game_result === 'loss') losses++
        if (i < 5) recentForm.push({ result: g.game_result })
      })

      setTeamRecord({ wins, losses, recentForm })

      // Count games needing stats
      const { data: needsStats } = await supabase
        .from('schedule_events')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.id)
        .eq('event_type', 'game')
        .eq('game_status', 'completed')
        .eq('stats_entered', false)

      setPendingStats(needsStats || 0)

      // Load top performers from player_season_stats
      const playerIds = rosterData.map(p => p.id)
      if (playerIds.length > 0 && selectedSeason?.id) {
        const { data: seasonStats } = await supabase
          .from('player_season_stats')
          .select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points, games_played')
          .in('player_id', playerIds)
          .eq('season_id', selectedSeason.id)
          .order('total_points', { ascending: false })
          .limit(5)

        setTopPlayers(seasonStats || [])
      } else {
        setTopPlayers([])
      }
    } catch (err) {
      console.error('Error loading team data:', err)
    }
  }

  function handleTeamSelect(team) {
    setSelectedTeam(team)
    loadTeamData(team)
  }

  function openTeamChat(teamId) {
    sessionStorage.setItem('openTeamChat', teamId)
    onNavigate?.('chats')
  }

  // ── Derived Values ──
  const nextEvent = upcomingEvents[0] || null
  const nextGame = upcomingEvents.find(e => e.event_type === 'game') || null
  const winRate = (teamRecord.wins + teamRecord.losses) > 0
    ? Math.round((teamRecord.wins / (teamRecord.wins + teamRecord.losses)) * 100)
    : 0

  // ── Loading State ──
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 text-sm tracking-wide ${textSecondary}`}>
            Loading dashboard...
          </p>
        </div>
      </div>
    )
  }

  // ── No Teams State ──
  if (teams.length === 0) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} style={{ minHeight: '60vh' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
          }`}>
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>
            No Teams Assigned
          </h2>
          <p className={textSecondary}>Contact your league administrator to get started.</p>
        </div>
      </div>
    )
  }

  // ── Main Render ──
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* TEAM SELECTOR */}
        {teams.length > 1 && (
          <div>
            <p className={`${sectionLabel} mb-2`}>SELECT TEAM</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                    selectedTeam?.id === team.id
                      ? isDark
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-blue-300 bg-blue-50'
                      : isDark
                        ? 'border-white/[0.08] bg-slate-800 hover:border-white/[0.15]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: team.color || '#3B82F6' }}
                  >
                    {team.name?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold text-sm ${textPrimary}`}>{team.name}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {team.coachRole === 'head' ? 'Head Coach' : 'Assistant'} · {team.playerCount} players
                    </p>
                  </div>
                  {selectedTeam?.id === team.id && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* HERO CARD — Next Game / Season Record */}
        {nextGame ? (
          <div
            className="relative rounded-2xl overflow-hidden p-6 cursor-pointer transition-transform hover:scale-[1.005]"
            style={{
              background: `linear-gradient(135deg, ${selectedTeam?.color || '#3B82F6'}dd, ${selectedTeam?.color || '#3B82F6'}88, ${isDark ? 'rgba(15,23,42,0.95)' : 'rgba(30,41,59,0.95)'})`,
            }}
            onClick={() => onNavigate?.('gameprep')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white/90">
                  {countdownText(nextGame.event_date) === 'TODAY' ? '🔴 Live Today' : 'Upcoming Game'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-white/60 text-sm font-medium">{selectedTeam?.name}</p>
                  <p className="text-4xl font-black text-white tracking-tight">
                    vs {nextGame.opponent_name || 'TBD'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">
                    {countdownText(nextGame.event_date)}
                  </p>
                  <p className="text-white/60 text-sm">
                    {nextGame.event_time ? formatTime12(nextGame.event_time) : ''}
                    {nextGame.venue_name ? ` · ${nextGame.venue_name}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${cardClass} p-6`}>
            <p className={`${sectionLabel} mb-2`}>SEASON RECORD</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-emerald-500">{teamRecord.wins}</span>
              <span className={`text-3xl font-bold ${textMuted}`}>-</span>
              <span className="text-5xl font-black text-red-500">{teamRecord.losses}</span>
              <span className={`text-sm ml-2 ${textSecondary}`}>{winRate}% win rate</span>
            </div>
            <p className={`text-sm mt-2 ${textSecondary}`}>{selectedTeam?.name} · {selectedSeason?.name}</p>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className={sectionLabel}>{selectedSeason?.name || 'Active Season'}</p>
            <h1 className={`text-3xl font-black tracking-tight ${textPrimary}`}>
              {selectedTeam?.name || 'Dashboard'}
            </h1>
            <p className={`text-sm mt-0.5 ${textSecondary}`}>
              {selectedTeam?.coachRole === 'head' ? 'Head Coach' : 'Assistant Coach'} · {coachName}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                isDark
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/15'
                  : 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Team Hub
            </button>
            <button
              onClick={() => openTeamChat(selectedTeam?.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                isDark
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
                  : 'bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          </div>
        </div>

        {/* 3-COLUMN LAYOUT */}
        <div className="flex gap-6">

          {/* LEFT SIDEBAR — 280px */}
          <div className="hidden lg:block w-[280px] shrink-0 space-y-4">

            {/* Squad Quick Stats */}
            <div className={cardClass}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: selectedTeam?.color || '#3B82F6' }}>
                    {selectedTeam?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${textPrimary}`}>{selectedTeam?.name}</p>
                    <p className={`text-xs ${textMuted}`}>{selectedTeam?.coachRole === 'head' ? 'Head Coach' : 'Assistant'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`text-center p-2 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <p className={`text-lg font-black ${textPrimary}`}>{roster.length}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Players</p>
                  </div>
                  <div className={`text-center p-2 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <p className="text-lg font-black text-emerald-500">{teamRecord.wins}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Wins</p>
                  </div>
                  <div className={`text-center p-2 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <p className="text-lg font-black text-red-500">{teamRecord.losses}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Losses</p>
                  </div>
                </div>
              </div>

              {/* Recent Form */}
              <div className={`px-4 pb-4 pt-2 border-t ${dividerClass}`}>
                <p className={`${sectionLabel} mb-2`}>Recent Form</p>
                <div className="flex gap-1.5">
                  {teamRecord.recentForm.length > 0 ? (
                    teamRecord.recentForm.map((g, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          g.result === 'win'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                            : g.result === 'loss'
                              ? 'bg-red-500/15 text-red-500 border border-red-500/25'
                              : isDark ? 'bg-white/[0.05] text-slate-400 border border-white/[0.08]' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {g.result === 'win' ? 'W' : g.result === 'loss' ? 'L' : 'T'}
                      </div>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`w-7 h-7 rounded-lg border border-dashed ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={cardClass}>
              <div className="p-4">
                <p className={`${sectionLabel} mb-3`}>Quick Actions</p>
                <div className="space-y-1">
                  {[
                    {
                      icon: Check, label: 'Take Attendance', color: '#10B981',
                      onClick: () => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') }
                    },
                    {
                      icon: Send, label: 'Message Parents', color: '#8B5CF6',
                      onClick: () => setShowCoachBlast(true)
                    },
                    {
                      icon: Timer, label: 'Start Warmup', color: '#F59E0B',
                      onClick: () => setShowWarmupTimer(true)
                    },
                    {
                      icon: Users, label: 'Team Hub', color: '#3B82F6',
                      onClick: () => navigateToTeamWall?.(selectedTeam?.id)
                    },
                    {
                      icon: MessageCircle, label: 'Team Chat', color: '#06B6D4',
                      onClick: () => openTeamChat(selectedTeam?.id)
                    },
                  ].map(action => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                          isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: action.color + '15' }}>
                          <Icon className="w-4 h-4" style={{ color: action.color }} />
                        </div>
                        <span className={`text-sm font-medium ${textPrimary}`}>{action.label}</span>
                        <ChevronRight className={`w-4 h-4 ml-auto ${textMuted}`} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER CONTENT — flex-1 */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* 4 Stat Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Squad Status */}
              <div className={`${cardClass} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className={sectionLabel}>Squad</span>
                </div>
                <p className={`text-3xl font-black ${textPrimary}`}>{roster.length}</p>
                <p className={`text-xs mt-1 ${textMuted}`}>Active players</p>
              </div>

              {/* Next Event */}
              <div className={`${cardClass} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span className={sectionLabel}>Next Up</span>
                </div>
                {nextEvent ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl font-black ${textPrimary}`}>{countdownText(nextEvent.event_date)}</p>
                      {countdownText(nextEvent.event_date) === 'TODAY' && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    <p className={`text-xs mt-1 truncate ${textMuted}`}>
                      {nextEvent.event_type === 'game' ? `vs ${nextEvent.opponent_name || 'TBD'}` : 'Practice'}
                      {nextEvent.event_time ? ` · ${formatTime12(nextEvent.event_time)}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <p className={`text-2xl font-black ${textMuted}`}>—</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>No upcoming events</p>
                  </>
                )}
              </div>

              {/* Recent Form */}
              <div className={`${cardClass} p-4 hidden lg:block`}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className={sectionLabel}>Form</span>
                </div>
                <div className="flex gap-1.5 mt-1">
                  {teamRecord.recentForm.length > 0 ? (
                    teamRecord.recentForm.map((g, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          g.result === 'win'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : g.result === 'loss'
                              ? 'bg-red-500/15 text-red-500'
                              : isDark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {g.result === 'win' ? 'W' : g.result === 'loss' ? 'L' : 'T'}
                      </div>
                    ))
                  ) : (
                    [1, 2, 3].map(i => (
                      <div key={i} className={`w-7 h-7 rounded-lg border border-dashed ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                    ))
                  )}
                </div>
                <p className={`text-xs mt-2 ${textMuted}`}>Last {teamRecord.recentForm.length || 0} games</p>
              </div>

              {/* Season Record */}
              <div className={`${cardClass} p-4 hidden lg:block`}>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className={sectionLabel}>Record</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-500">{teamRecord.wins}</span>
                  <span className={`text-xl font-bold mx-1 ${textMuted}`}>-</span>
                  <span className="text-3xl font-black text-red-500">{teamRecord.losses}</span>
                </div>
                <p className={`text-xs mt-1 ${textMuted}`}>{winRate}% win rate</p>
              </div>
            </div>

            {/* Tactical Command — Lineup + Game Day */}
            <div className={cardClass}>
              <div className={`flex items-center gap-3 p-5 border-b ${dividerClass}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <Crosshair className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${textPrimary}`}>Game Day Tools</h2>
                  <p className={`text-xs ${textMuted}`}>Lineups, scoring, and stats</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                {/* Lineup Builder Card */}
                <button
                  onClick={() => onNavigate?.('gameprep')}
                  className={`${cardClass} ${cardHoverClass} p-5 text-left`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'
                    }`}>
                      <ClipboardList className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${textPrimary}`}>Lineup Builder</h3>
                      <p className={`text-xs ${textMuted}`}>Build & manage lineups</p>
                    </div>
                  </div>
                  {nextGame ? (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isDark ? 'bg-indigo-500/[0.06] border border-indigo-500/10' : 'bg-indigo-50 border border-indigo-100'
                    }`}>
                      <Swords className="w-4 h-4 text-indigo-500" />
                      <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Next: vs {nextGame.opponent_name || 'TBD'} · {countdownText(nextGame.event_date)}
                      </span>
                    </div>
                  ) : (
                    <p className={`text-xs ${textMuted}`}>No upcoming games</p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-indigo-500 text-sm font-semibold">
                    <span>Open Builder</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Game Day Hub Card */}
                <button
                  onClick={() => onNavigate?.('gameprep')}
                  className={`${cardClass} ${cardHoverClass} p-5 text-left`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'
                    }`}>
                      <Zap className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${textPrimary}`}>Game Day Hub</h3>
                      <p className={`text-xs ${textMuted}`}>Live scoring & stats</p>
                    </div>
                  </div>
                  {nextGame && countdownText(nextGame.event_date) === 'TODAY' ? (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-500 font-semibold">Game Day — vs {nextGame.opponent_name || 'TBD'}</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isDark ? 'bg-amber-500/[0.06] border border-amber-500/10' : 'bg-amber-50 border border-amber-100'
                    }`}>
                      <Clock className="w-4 h-4 text-amber-500/60" />
                      <span className={`text-xs ${textSecondary}`}>Score games, track stats, manage rotations</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-amber-500 text-sm font-semibold">
                    <span>Enter Hub</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Stats pending alert */}
              {pendingStats > 0 && (
                <div className={`mx-5 mb-5 flex items-center gap-3 px-4 py-3 rounded-xl ${
                  isDark ? 'bg-amber-500/[0.08] border border-amber-500/15' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <Bell className="w-5 h-5 text-amber-500" />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{pendingStats} game{pendingStats > 1 ? 's' : ''} need stats</p>
                    <p className={`text-xs ${isDark ? 'text-amber-500/60' : 'text-amber-600/70'}`}>Stats power leaderboards, badges, and parent views</p>
                  </div>
                  <button
                    onClick={() => onNavigate?.('gameprep')}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition"
                  >
                    Enter Stats
                  </button>
                </div>
              )}
            </div>

            {/* Quick Attendance Panel */}
            {nextEvent && (
              <QuickAttendancePanel
                event={nextEvent}
                team={selectedTeam}
                roster={roster}
                userId={user?.id}
                showToast={showToast}
                isDark={isDark}
                cardClass={cardClass}
                sectionLabel={sectionLabel}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                dividerClass={dividerClass}
              />
            )}

            {/* Quick Actions — Mobile / Tablet only (replaces sidebar) */}
            <div className="lg:hidden">
              <p className={`${sectionLabel} mb-3`}>Quick Actions</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') }}
                  className={`${cardClass} ${cardHoverClass} flex items-center gap-4 p-4 text-left`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'
                  }`}>
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold ${textPrimary}`}>Take Attendance</h3>
                    <p className={`text-xs truncate ${textMuted}`}>
                      {nextEvent ? `${nextEvent.event_type === 'game' ? 'Game' : 'Practice'} · ${formatDateShort(nextEvent.event_date)}` : 'No upcoming events'}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${textMuted}`} />
                </button>

                <button
                  onClick={() => setShowCoachBlast(true)}
                  className={`${cardClass} ${cardHoverClass} flex items-center gap-4 p-4 text-left`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'
                  }`}>
                    <Send className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold ${textPrimary}`}>Message Parents</h3>
                    <p className={`text-xs truncate ${textMuted}`}>Send announcement to {selectedTeam?.name}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${textMuted}`} />
                </button>

                <button
                  onClick={() => setShowWarmupTimer(true)}
                  className={`${cardClass} ${cardHoverClass} flex items-center gap-4 p-4 text-left`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'
                  }`}>
                    <Timer className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold ${textPrimary}`}>Start Warmup</h3>
                    <p className={`text-xs ${textMuted}`}>Countdown timer for drills</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${textMuted}`} />
                </button>
              </div>
            </div>

            {/* Quick Ops Grid */}
            <div>
              <p className={`${sectionLabel} mb-3`}>Quick Links</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Calendar, label: 'Schedule', page: 'schedule', color: '#3B82F6', desc: 'Events & games' },
                  { icon: Check, label: 'Attendance', page: 'attendance', color: '#10B981', desc: 'Track check-ins' },
                  { icon: Target, label: 'Game Prep', page: 'gameprep', color: '#F59E0B', desc: 'Lineups & scores' },
                  { icon: MessageCircle, label: 'Messages', page: 'chats', color: '#8B5CF6', desc: 'Team comms' },
                ].map(action => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.page}
                      onClick={() => onNavigate?.(action.page)}
                      className={`${cardClass} ${cardHoverClass} p-4 text-left`}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: action.color + '15' }}>
                          <Icon className="w-4.5 h-4.5" style={{ color: action.color }} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${textPrimary}`}>{action.label}</p>
                          <p className={`text-xs ${textMuted}`}>{action.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Roster Quick View */}
            <div className={cardClass}>
              <div className={`flex items-center justify-between p-5 border-b ${dividerClass}`}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className={sectionLabel}>Squad Roster</span>
                </div>
                <button
                  onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
                  className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:text-blue-600 transition"
                >
                  Full Roster <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4">
                {roster.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {roster.slice(0, 16).map(player => (
                      <div
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className="text-center cursor-pointer group"
                      >
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt=""
                            className={`w-14 h-14 rounded-xl mx-auto object-cover border-2 transition ${
                              isDark ? 'border-transparent group-hover:border-blue-500/40' : 'border-transparent group-hover:border-blue-300'
                            }`}
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-sm font-bold border-2 transition ${
                            isDark
                              ? 'bg-blue-500/10 text-blue-400 border-transparent group-hover:border-blue-500/40'
                              : 'bg-blue-50 text-blue-600 border-transparent group-hover:border-blue-300'
                          }`}>
                            {player.first_name?.[0]}{player.last_name?.[0]}
                          </div>
                        )}
                        <p className={`text-xs mt-1.5 font-medium truncate ${textSecondary}`}>
                          #{player.jersey_number || '—'}
                        </p>
                        <p className={`text-[10px] truncate ${textMuted}`}>
                          {player.first_name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Users className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
                    <p className={`text-sm ${textSecondary}`}>No players on roster</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR — 300px */}
          <div className="hidden lg:block w-[300px] shrink-0 space-y-4">

            {/* Attendance Preview */}
            {nextEvent && (
              <div className={cardClass}>
                <div className={`p-4 border-b ${dividerClass}`}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span className={sectionLabel}>Attendance</span>
                  </div>
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    {nextEvent.event_type === 'game' ? `Game vs ${nextEvent.opponent_name || 'TBD'}` : 'Practice'}
                    {nextEvent.event_time ? ` · ${formatTime12(nextEvent.event_time)}` : ''}
                  </p>
                </div>
                <div className="p-4">
                  {rsvpCounts[nextEvent.id] ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${textSecondary}`}>Confirmed</span>
                        <span className="text-xs font-bold text-emerald-500">{rsvpCounts[nextEvent.id].going}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${textSecondary}`}>Maybe</span>
                        <span className="text-xs font-bold text-amber-500">{rsvpCounts[nextEvent.id].maybe}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${textSecondary}`}>Declined</span>
                        <span className="text-xs font-bold text-red-500">{rsvpCounts[nextEvent.id].declined}</span>
                      </div>
                      <div className={`flex items-center justify-between pt-2 mt-2 border-t ${dividerClass}`}>
                        <span className={`text-xs font-medium ${textSecondary}`}>Not responded</span>
                        <span className={`text-xs font-bold ${textMuted}`}>{Math.max(0, roster.length - rsvpCounts[nextEvent.id].total)}</span>
                      </div>
                      {/* Progress bar */}
                      <div className={`w-full h-2 rounded-full mt-1 ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${roster.length > 0 ? (rsvpCounts[nextEvent.id].going / roster.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className={`text-xs ${textMuted}`}>No RSVPs yet</p>
                      <p className={`text-xs ${textMuted}`}>0 / {roster.length} responded</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Player Pulse */}
            <div className={cardClass}>
              <div className={`flex items-center justify-between p-4 border-b ${dividerClass}`}>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className={sectionLabel}>Top Players</span>
                </div>
                <button
                  onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
                  className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:text-blue-600 transition"
                >
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3">
                {topPlayers.length > 0 ? (
                  <div className="space-y-1">
                    {topPlayers.map((stat, i) => {
                      const player = roster.find(p => p.id === stat.player_id)
                      if (!player) return null
                      const ppg = stat.games_played > 0 ? (stat.total_points / stat.games_played).toFixed(1) : '0'

                      return (
                        <div
                          key={stat.player_id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition ${
                            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <span className={`text-sm font-black w-5 text-center ${
                            i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : textMuted
                          }`}>
                            {i + 1}
                          </span>

                          {player.photo_url ? (
                            <img src={player.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {player.first_name?.[0]}{player.last_name?.[0]}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${textPrimary}`}>
                              {player.first_name} {player.last_name?.[0]}.
                            </p>
                            <p className={`text-[10px] ${textMuted}`}>
                              #{player.jersey_number || '—'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-[10px]">
                            <div className="text-center">
                              <p className="font-bold text-red-500">{stat.total_kills || 0}</p>
                              <p className={textMuted}>K</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-emerald-500">{stat.total_aces || 0}</p>
                              <p className={textMuted}>A</p>
                            </div>
                            <div className={`text-center px-1.5 py-0.5 rounded-lg ${isDark ? 'bg-amber-500/[0.08]' : 'bg-amber-50'}`}>
                              <p className="font-bold text-amber-500">{ppg}</p>
                              <p className={textMuted}>PPG</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Award className={`w-10 h-10 mx-auto mb-2 ${textMuted}`} />
                    <p className={`text-sm font-medium ${textSecondary}`}>No stats recorded yet</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>Complete games and enter stats</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className={cardClass}>
              <div className={`flex items-center justify-between p-4 border-b ${dividerClass}`}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className={sectionLabel}>Upcoming</span>
                </div>
                <button
                  onClick={() => onNavigate?.('schedule')}
                  className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:text-blue-600 transition"
                >
                  Schedule <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className={`divide-y ${dividerClass}`}>
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 5).map(event => {
                    const isGame = event.event_type === 'game'
                    const isToday = countdownText(event.event_date) === 'TODAY'

                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEventDetail(event)}
                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition ${
                          isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-center min-w-[36px]">
                          <p className={`text-[10px] font-semibold uppercase ${textMuted}`}>
                            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className={`text-lg font-black ${isToday ? 'text-red-500' : textPrimary}`}>
                            {new Date(event.event_date + 'T00:00:00').getDate()}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isGame
                              ? 'text-red-500 bg-red-500/10'
                              : 'text-blue-500 bg-blue-500/10'
                          }`}>
                            {isGame ? 'GAME' : 'PRACTICE'}
                          </span>
                          <p className={`text-xs mt-0.5 truncate ${textSecondary}`}>
                            {isGame && event.opponent_name ? `vs ${event.opponent_name}` : ''}
                            {event.event_time ? (isGame && event.opponent_name ? ' · ' : '') + formatTime12(event.event_time) : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          {rsvpCounts[event.id] && (
                            <span className="text-[10px] font-bold text-emerald-500">{rsvpCounts[event.id].going}✓</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className={`w-10 h-10 mx-auto mb-2 ${textMuted}`} />
                    <p className={`text-sm ${textSecondary}`}>No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {selectedEventDetail && (
        <EventDetailModal
          event={selectedEventDetail}
          team={selectedTeam}
          onClose={() => setSelectedEventDetail(null)}
          isDark={isDark}
        />
      )}

      {selectedPlayer && (
        <PlayerCardExpanded
          player={selectedPlayer}
          visible={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          context="coach_dashboard"
          viewerRole="coach"
          seasonId={selectedSeason?.id}
          sport={selectedSport?.name || 'volleyball'}
          isOwnChild={false}
        />
      )}

      {showCoachBlast && selectedTeam && (
        <CoachBlastModal
          team={selectedTeam}
          onClose={() => setShowCoachBlast(false)}
          showToast={showToast}
          isDark={isDark}
        />
      )}

      {showWarmupTimer && (
        <WarmupTimerModal onClose={() => setShowWarmupTimer(false)} isDark={isDark} />
      )}
    </div>
  )
}

// ============================================
// COACH BLAST MODAL
// ============================================
function CoachBlastModal({ team, onClose, showToast, isDark }) {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const cleanTitle = sanitizeText(title)
    const cleanBody = sanitizeText(body)
    if (!cleanTitle || !cleanBody) {
      showToast?.('Please fill in title and message', 'error')
      return
    }
    if (cleanTitle.length > 200) {
      showToast?.('Title must be 200 characters or less', 'error')
      return
    }

    setSending(true)
    try {
      const { data: blast, error } = await supabase
        .from('messages')
        .insert({
          season_id: selectedSeason?.id,
          sender_id: user?.id,
          title: cleanTitle,
          body: cleanBody,
          message_type: 'announcement',
          priority,
          target_type: 'team',
          target_team_id: team.id
        })
        .select()
        .single()

      if (error) throw error

      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('players(id, first_name, last_name, parent_name, parent_email)')
        .eq('team_id', team.id)

      const recipients = (teamPlayers || []).map(tp => ({
        message_id: blast.id,
        recipient_type: 'parent',
        recipient_id: tp.players?.id,
        recipient_name: tp.players?.parent_name || `${tp.players?.first_name} ${tp.players?.last_name}'s Parent`,
        recipient_email: tp.players?.parent_email
      })).filter(r => r.recipient_id)

      if (recipients.length > 0) {
        await supabase.from('message_recipients').insert(recipients)
      }

      showToast?.(`Message sent to ${recipients.length} parents!`, 'success')
      onClose()
    } catch (err) {
      console.error('Error sending blast:', err)
      showToast?.('Error sending message', 'error')
    }
    setSending(false)
  }

  const inputClass = isDark
    ? 'bg-slate-700/50 border border-white/[0.08] text-white placeholder-slate-500'
    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl shadow-xl ${
          isDark ? 'bg-slate-800 border border-white/[0.08]' : 'bg-white border border-slate-200'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'
            }`}>
              <Send className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Message Parents</h2>
              <p className="text-sm text-slate-500">Send to {team?.name} parents</p>
            </div>
            <button onClick={onClose} className={`ml-auto p-2 rounded-lg transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Subject</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Practice time change tomorrow"
              className={`w-full px-4 py-3 rounded-xl ${inputClass}`}
            />
          </div>

          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message to parents..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl resize-none ${inputClass}`}
            />
          </div>

          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Priority</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPriority('normal')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  priority === 'normal'
                    ? isDark ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' : 'bg-blue-50 border border-blue-300 text-blue-600'
                    : isDark ? 'bg-slate-700/50 border border-white/[0.08] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setPriority('urgent')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  priority === 'urgent'
                    ? isDark ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-red-50 border border-red-300 text-red-600'
                    : isDark ? 'bg-slate-700/50 border border-white/[0.08] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
                }`}
              >
                Urgent
              </button>
            </div>
          </div>
        </div>

        <div className={`p-6 border-t flex gap-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-medium transition ${
              isDark ? 'border border-white/[0.08] text-slate-300 hover:bg-white/[0.03]' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// WARMUP TIMER MODAL
// ============================================
function WarmupTimerModal({ onClose, isDark }) {
  const [seconds, setSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || seconds <= 0) return
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, seconds > 0])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0
  const isFinished = totalSeconds > 0 && seconds === 0 && !running

  function startTimer(mins) {
    setTotalSeconds(mins * 60)
    setSeconds(mins * 60)
    setRunning(true)
  }

  function resetTimer() {
    setRunning(false)
    setSeconds(0)
    setTotalSeconds(0)
  }

  const circumference = 2 * Math.PI * 90

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={!running ? onClose : undefined}>
      <div
        className={`w-full max-w-sm text-center rounded-2xl shadow-xl ${
          isDark ? 'bg-slate-800 border border-white/[0.08]' : 'bg-white border border-slate-200'
        } ${isFinished ? 'ring-2 ring-emerald-500/40' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center justify-center gap-3">
            <Timer className={`w-6 h-6 ${isFinished ? 'text-emerald-500' : 'text-amber-500'}`} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isFinished ? 'Time!' : 'Warmup Timer'}
            </h2>
          </div>
        </div>

        <div className="p-8">
          {totalSeconds === 0 ? (
            <div className="space-y-4">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select Duration</p>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 20].map(mins => (
                  <button
                    key={mins}
                    onClick={() => startTimer(mins)}
                    className={`py-5 rounded-xl font-black text-2xl transition hover:scale-105 ${
                      isDark
                        ? 'bg-amber-500/10 border border-amber-500/20 text-white hover:bg-amber-500/15'
                        : 'bg-amber-50 border border-amber-200 text-slate-900 hover:bg-amber-100'
                    }`}
                  >
                    {mins}<span className={`text-sm ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>MIN</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="8" />
                  <circle
                    cx="100" cy="100" r="90" fill="none"
                    stroke={isFinished ? '#10b981' : '#f59e0b'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-5xl font-black ${
                    isFinished ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isFinished ? 'DONE' : `${minutes}:${secs.toString().padStart(2, '0')}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {running ? (
                  <button
                    onClick={() => setRunning(false)}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${
                      isDark ? 'bg-red-500/15 border border-red-500/25 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'
                    }`}
                  >
                    Pause
                  </button>
                ) : seconds > 0 ? (
                  <button
                    onClick={() => setRunning(true)}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${
                      isDark ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                    }`}
                  >
                    Resume
                  </button>
                ) : null}
                <button
                  onClick={resetTimer}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    isDark ? 'border border-white/[0.08] text-slate-300' : 'border border-slate-200 text-slate-600'
                  }`}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// QUICK ATTENDANCE PANEL
// ============================================
function QuickAttendancePanel({ event, team, roster, userId, showToast, isDark, cardClass, sectionLabel, textPrimary, textSecondary, textMuted, dividerClass }) {
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
      for (const r of (data || [])) {
        map[r.player_id] = r.status
      }
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
        await supabase
          .from('event_rsvps')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('event_rsvps')
          .insert({
            event_id: event.id,
            player_id: playerId,
            status,
            responded_by: userId
          })
      }
    } catch (err) {
      setAttendance(a => ({ ...a, [playerId]: prev }))
      showToast?.('Error updating attendance', 'error')
    }
  }

  const presentCount = Object.values(attendance).filter(s => s === 'yes' || s === 'going').length
  const absentCount = Object.values(attendance).filter(s => s === 'no' || s === 'not_going').length
  const unmarkedCount = roster.length - presentCount - absentCount

  return (
    <div className={`${cardClass} ${isToday ? 'ring-1 ring-emerald-500/25' : ''}`}>
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'
        }`}>
          <UserCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={sectionLabel}>Quick Attendance</span>
            {isToday && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                TODAY
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${textMuted}`}>
            {event.event_type === 'game' ? `Game vs ${event.opponent_name || 'TBD'}` : 'Practice'}
            {event.event_time ? ` · ${formatTime12(event.event_time)}` : ''}
            {expanded && loaded ? ` — ${presentCount}✓ ${absentCount}✗ ${unmarkedCount > 0 ? `${unmarkedCount} unmarked` : ''}` : ''}
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 transition-transform ${textMuted} ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className={`px-5 pb-5 border-t ${dividerClass}`}>
          {loading ? (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className={`text-xs mt-2 ${textMuted}`}>Loading...</p>
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
                    <span className={`text-xs ${textMuted}`}>{unmarkedCount} Unmarked</span>
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
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      isDark
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                    }`}
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
                    <div key={player.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg transition ${
                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                    }`}>
                      {player.photo_url ? (
                        <img src={player.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${textPrimary}`}>
                          {player.first_name} {player.last_name}
                        </p>
                        <p className={`text-[10px] ${textMuted}`}>
                          #{player.jersey_number || '—'} · {player.position || 'Player'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markPlayer(player.id, 'yes')}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                            isPresent
                              ? 'bg-emerald-500/20 border border-emerald-500/40'
                              : isDark ? 'bg-slate-700/50 border border-white/[0.08]' : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${isPresent ? 'text-emerald-500' : textMuted}`} />
                        </button>
                        <button
                          onClick={() => markPlayer(player.id, 'no')}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                            isAbsent
                              ? 'bg-red-500/20 border border-red-500/40'
                              : isDark ? 'bg-slate-700/50 border border-white/[0.08]' : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <X className={`w-4 h-4 ${isAbsent ? 'text-red-500' : textMuted}`} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {roster.length === 0 && (
                <div className="py-6 text-center">
                  <Users className={`w-8 h-8 mx-auto mb-2 ${textMuted}`} />
                  <p className={`text-xs ${textMuted}`}>No players on roster</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export { CoachDashboard }
