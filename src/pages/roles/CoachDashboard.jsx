import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import {
  Calendar, MapPin, Clock, Users, ChevronRight, Check,
  Target, MessageCircle, X, ClipboardList,
  TrendingUp, Star, Award, Zap, Shield, Crosshair,
  Swords, Crown, Activity, Trophy, Bell,
  Send, Timer, Megaphone
} from '../../constants/icons'

// ============================================
// CSS STYLES — Tactical Command Center
// ============================================
const tcStyles = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');

.tc-wrap{
  min-height:100vh;
  background:#0a0a0f;
  color:#e2e8f0;
  position:relative;
  overflow-x:hidden;
}
/* Blueprint grid */
.tc-wrap::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background-image:
    linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px);
  background-size:40px 40px;
  z-index:0;
}
.tc-wrap>*{position:relative;z-index:1;}

/* Scanlines overlay */
.tc-scanlines::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);
  z-index:2;
}

/* Animations */
@keyframes tcFadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes tcPulse{0%,100%{opacity:1;}50%{opacity:.6;}}
@keyframes tcGlow{0%,100%{box-shadow:0 0 8px rgba(59,130,246,0.2);}50%{box-shadow:0 0 20px rgba(59,130,246,0.4);}}
@keyframes tcSlideIn{from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);}}
@keyframes tcCountdown{0%{transform:scale(1);}50%{transform:scale(1.05);}100%{transform:scale(1);}}
@keyframes tcLivePulse{0%,100%{background:rgba(239,68,68,0.8);}50%{background:rgba(239,68,68,0.4);}}

.tc-fadeIn{animation:tcFadeIn .5s ease-out both;}
.tc-fadeIn-1{animation-delay:.1s;}
.tc-fadeIn-2{animation-delay:.2s;}
.tc-fadeIn-3{animation-delay:.3s;}
.tc-fadeIn-4{animation-delay:.4s;}
.tc-fadeIn-5{animation-delay:.5s;}

/* Card base */
.tc-card{
  background:rgba(15,20,35,0.7);
  border:1px solid rgba(59,130,246,0.12);
  border-radius:1rem;
  backdrop-filter:blur(12px);
  transition:all .3s ease;
}
.tc-card:hover{
  border-color:rgba(59,130,246,0.25);
  box-shadow:0 0 30px rgba(59,130,246,0.08);
}
.tc-card-glow{
  box-shadow:0 0 20px rgba(59,130,246,0.1),inset 0 1px 0 rgba(255,255,255,0.03);
}

/* Command widget */
.tc-widget{
  background:rgba(15,20,35,0.6);
  border:1px solid rgba(59,130,246,0.1);
  border-radius:1rem;
  padding:1.25rem;
  position:relative;
  overflow:hidden;
}
.tc-widget::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent);
}

/* Section headers */
.tc-section-title{
  font-family:'Bebas Neue',sans-serif;
  letter-spacing:0.15em;
  font-size:1.1rem;
  color:rgba(148,163,184,0.8);
  text-transform:uppercase;
  display:flex;align-items:center;gap:0.5rem;
}

/* Tactical label */
.tc-label{
  font-family:'Rajdhani',sans-serif;
  font-weight:600;
  font-size:0.7rem;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color:rgba(100,116,139,0.8);
}

/* Action card hero */
.tc-hero-card{
  background:linear-gradient(135deg,rgba(15,20,35,0.9),rgba(25,35,60,0.9));
  border:1px solid rgba(59,130,246,0.15);
  border-radius:1.25rem;
  padding:2rem;
  cursor:pointer;
  transition:all .3s ease;
  position:relative;
  overflow:hidden;
}
.tc-hero-card:hover{
  border-color:rgba(59,130,246,0.4);
  box-shadow:0 0 40px rgba(59,130,246,0.15);
  transform:translateY(-2px);
}
.tc-hero-card::after{
  content:'';position:absolute;top:0;right:0;width:120px;height:120px;
  background:radial-gradient(circle,rgba(59,130,246,0.08),transparent 70%);
  pointer-events:none;
}

/* Player pulse card */
.tc-player-row{
  display:flex;align-items:center;gap:0.75rem;
  padding:0.75rem;border-radius:0.75rem;
  transition:all .2s ease;cursor:pointer;
  border:1px solid transparent;
}
.tc-player-row:hover{
  background:rgba(59,130,246,0.06);
  border-color:rgba(59,130,246,0.12);
}

/* Form indicator dots */
.tc-form-dot{
  width:28px;height:28px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:0.7rem;
  transition:all .2s ease;
}

/* Team selector button */
.tc-team-btn{
  display:flex;align-items:center;gap:0.75rem;
  padding:0.75rem 1.25rem;border-radius:0.75rem;
  border:1px solid rgba(59,130,246,0.1);
  background:rgba(15,20,35,0.5);
  cursor:pointer;transition:all .2s ease;
  white-space:nowrap;flex-shrink:0;
}
.tc-team-btn:hover{border-color:rgba(59,130,246,0.3);}
.tc-team-btn.active{
  border-color:rgba(59,130,246,0.5);
  background:rgba(59,130,246,0.1);
  box-shadow:0 0 20px rgba(59,130,246,0.1);
}
`

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
// EVENT DETAIL MODAL — Tactical Style
// ============================================
function EventDetailModal({ event, team, onClose }) {
  if (!event) return null
  const eventDate = event.event_date ? new Date(event.event_date + 'T00:00:00') : null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="tc-card w-full max-w-lg max-h-[80vh] overflow-y-auto"
        style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(59,130,246,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-blue-500/10">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: team?.color || '#3B82F6' }}
            >
              {event.event_type === 'game' ? '🏐' : '⚡'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{event.title || event.event_type}</h2>
              <p className="text-slate-400 text-sm">{team?.name}</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-white/5 transition">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white">{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className="text-slate-400 text-sm">{formatTime12(event.event_time)}</p>}
            </div>
          </div>

          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white">{event.venue_name || event.location}</p>
                {event.venue_address && <p className="text-sm text-slate-400">{event.venue_address}</p>}
              </div>
            </div>
          )}

          {event.opponent_name && (
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-amber-400" />
              <p className="text-white">vs {event.opponent_name}</p>
            </div>
          )}

          {event.notes && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <p className="text-sm text-slate-300">{event.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-blue-500/10">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-blue-500/20 text-slate-300 font-medium hover:bg-blue-500/5 transition">
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
      <div className="tc-wrap flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <style>{tcStyles}</style>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-4 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em' }}>
            INITIALIZING COMMAND CENTER...
          </p>
        </div>
      </div>
    )
  }

  // ── No Teams State ──
  if (teams.length === 0) {
    return (
      <div className="tc-wrap flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <style>{tcStyles}</style>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}>
            AWAITING ASSIGNMENT
          </h2>
          <p className="text-slate-400">No teams assigned yet. Contact your league administrator to get started.</p>
        </div>
      </div>
    )
  }

  // ── Main Render ──
  return (
    <div className="tc-wrap tc-scanlines">
      <style>{tcStyles}</style>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ═══════════════════════════════════════════
            TEAM SELECTOR — "OPERATION SELECT"
            ═══════════════════════════════════════════ */}
        {teams.length > 1 && (
          <div className="tc-fadeIn">
            <p className="tc-label mb-2">OPERATION SELECT</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team)}
                  className={`tc-team-btn ${selectedTeam?.id === team.id ? 'active' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: team.color || '#3B82F6' }}
                  >
                    {team.name?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white text-sm">{team.name}</p>
                    <p className="text-xs text-slate-500">
                      {team.coachRole === 'head' ? 'HEAD' : 'ASST'} · {team.playerCount} operators
                    </p>
                  </div>
                  {selectedTeam?.id === team.id && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TACTICAL HEADER
            ═══════════════════════════════════════════ */}
        <div className="tc-fadeIn flex items-center justify-between">
          <div>
            <p className="tc-label">{selectedSeason?.name || 'ACTIVE SEASON'}</p>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
              {selectedTeam?.name || 'COMMAND CENTER'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {selectedTeam?.coachRole === 'head' ? 'Head Coach' : 'Assistant Coach'} · {coachName}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd' }}
            >
              Team Hub
            </button>
            <button
              onClick={() => openTeamChat(selectedTeam?.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}
            >
              <MessageCircle className="w-4 h-4" />
              Comms
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            4 COMMAND WIDGETS
            ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Squad Status */}
          <div className="tc-widget tc-fadeIn tc-fadeIn-1">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="tc-label">SQUAD STATUS</span>
            </div>
            <p className="text-3xl font-black text-white">{roster.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active operators on roster</p>
          </div>

          {/* Next Objective */}
          <div className="tc-widget tc-fadeIn tc-fadeIn-2">
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span className="tc-label">NEXT OBJECTIVE</span>
            </div>
            {nextEvent ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">{countdownText(nextEvent.event_date)}</p>
                  {countdownText(nextEvent.event_date) === 'TODAY' && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {nextEvent.event_type === 'game' ? `vs ${nextEvent.opponent_name || 'TBD'}` : 'Practice'}
                  {nextEvent.event_time ? ` · ${formatTime12(nextEvent.event_time)}` : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-slate-600">—</p>
                <p className="text-xs text-slate-500 mt-1">No upcoming events</p>
              </>
            )}
          </div>

          {/* Recent Form */}
          <div className="tc-widget tc-fadeIn tc-fadeIn-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="tc-label">RECENT FORM</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {teamRecord.recentForm.length > 0 ? (
                teamRecord.recentForm.map((g, i) => (
                  <div
                    key={i}
                    className="tc-form-dot"
                    style={{
                      background: g.result === 'win' ? 'rgba(16,185,129,0.2)' : g.result === 'loss' ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.2)',
                      color: g.result === 'win' ? '#34d399' : g.result === 'loss' ? '#f87171' : '#94a3b8',
                      border: `1px solid ${g.result === 'win' ? 'rgba(16,185,129,0.3)' : g.result === 'loss' ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.2)'}`
                    }}
                  >
                    {g.result === 'win' ? 'W' : g.result === 'loss' ? 'L' : 'T'}
                  </div>
                ))
              ) : (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="tc-form-dot" style={{ border: '1px dashed rgba(100,116,139,0.2)', color: 'transparent' }}>—</div>
                ))
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Last {teamRecord.recentForm.length || 0} games</p>
          </div>

          {/* Season Record */}
          <div className="tc-widget tc-fadeIn tc-fadeIn-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="tc-label">SEASON RECORD</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-400">{teamRecord.wins}</span>
              <span className="text-xl text-slate-600 font-bold mx-1">-</span>
              <span className="text-3xl font-black text-red-400">{teamRecord.losses}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{winRate}% win rate</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            BLUEPRINT HERO — TACTICAL COMMAND
            ═══════════════════════════════════════════ */}
        <div className="tc-fadeIn tc-fadeIn-2">
          <div className="tc-card p-6" style={{ background: 'linear-gradient(135deg, rgba(15,20,35,0.8), rgba(20,30,55,0.8))' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Crosshair className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.08em' }}>
                  TACTICAL COMMAND
                </h2>
                <p className="text-xs text-slate-500">Mission-critical operations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lineup Builder Card */}
              <div
                className="tc-hero-card"
                onClick={() => onNavigate?.('gameprep')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <ClipboardList className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                      LINEUP BUILDER
                    </h3>
                    <p className="text-xs text-slate-400">Build & manage lineups</p>
                  </div>
                </div>
                {nextGame ? (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <Swords className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-300">
                      Next: vs {nextGame.opponent_name || 'TBD'} · {countdownText(nextGame.event_date)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">No upcoming games</p>
                )}
                <div className="flex items-center gap-1 mt-3 text-indigo-400 text-sm font-semibold">
                  <span>Open Builder</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Game Day Hub Card */}
              <div
                className="tc-hero-card"
                onClick={() => onNavigate?.('gameprep')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                      GAME DAY HUB
                    </h3>
                    <p className="text-xs text-slate-400">Live scoring & stats</p>
                  </div>
                </div>
                {nextGame && countdownText(nextGame.event_date) === 'TODAY' ? (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                    <span className="text-xs text-red-300 font-semibold">GAME DAY — vs {nextGame.opponent_name || 'TBD'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)' }}>
                    <Clock className="w-4 h-4 text-amber-500/60" />
                    <span className="text-xs text-slate-400">Score games, track stats, manage rotations</span>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-3 text-amber-400 text-sm font-semibold">
                  <span>Enter Hub</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Stats pending alert */}
            {pendingStats > 0 && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <Bell className="w-5 h-5 text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-300">{pendingStats} game{pendingStats > 1 ? 's' : ''} need stats</p>
                  <p className="text-xs text-amber-500/60">Stats power leaderboards, badges, and parent views</p>
                </div>
                <button
                  onClick={() => onNavigate?.('gameprep')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-black transition"
                  style={{ background: '#f59e0b' }}
                >
                  Enter Stats
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            QUICK ACTIONS — Primary Coach Actions
            ═══════════════════════════════════════════ */}
        <div className="tc-fadeIn tc-fadeIn-3">
          <p className="tc-label mb-3">QUICK ACTIONS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Take Attendance */}
            <button
              onClick={() => {
                sessionStorage.setItem('attendanceTeamId', selectedTeam?.id)
                onNavigate?.('attendance')
              }}
              className="tc-hero-card flex items-center gap-4 text-left"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                  TAKE ATTENDANCE
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {nextEvent ? `${nextEvent.event_type === 'game' ? 'Game' : 'Practice'} · ${formatDateShort(nextEvent.event_date)}` : 'No upcoming events'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400/50 flex-shrink-0" />
            </button>

            {/* Message Parents */}
            <button
              onClick={() => setShowCoachBlast(true)}
              className="tc-hero-card flex items-center gap-4 text-left"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Send className="w-7 h-7 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                  MESSAGE PARENTS
                </h3>
                <p className="text-xs text-slate-400 truncate">Send announcement to {selectedTeam?.name}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-400/50 flex-shrink-0" />
            </button>

            {/* Start Warmup */}
            <button
              onClick={() => setShowWarmupTimer(true)}
              className="tc-hero-card flex items-center gap-4 text-left"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Timer className="w-7 h-7 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                  START WARMUP
                </h3>
                <p className="text-xs text-slate-400">Countdown timer for drills</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400/50 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            TWO-COLUMN: Player Pulse + Upcoming Ops
            ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Player Pulse ── */}
          <div className="tc-card tc-fadeIn tc-fadeIn-3">
            <div className="flex items-center justify-between p-5 border-b border-blue-500/10">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="tc-section-title">PLAYER PULSE</span>
              </div>
              <button
                onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
                className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300 transition"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              {topPlayers.length > 0 ? (
                <div className="space-y-1">
                  {topPlayers.map((stat, i) => {
                    const player = roster.find(p => p.id === stat.player_id)
                    if (!player) return null
                    const ppg = stat.games_played > 0 ? (stat.total_points / stat.games_played).toFixed(1) : '0'

                    return (
                      <div
                        key={stat.player_id}
                        className="tc-player-row"
                        onClick={() => setSelectedPlayer(player)}
                        style={{ animationDelay: `${0.1 * i}s` }}
                      >
                        {/* Rank */}
                        <span className={`text-lg font-black w-6 text-center ${
                          i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-600'
                        }`}>
                          {i + 1}
                        </span>

                        {/* Photo */}
                        {player.photo_url ? (
                          <img src={player.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                            {player.first_name?.[0]}{player.last_name?.[0]}
                          </div>
                        )}

                        {/* Name + Position */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {player.first_name} {player.last_name?.[0]}.
                          </p>
                          <p className="text-xs text-slate-500">
                            #{player.jersey_number || '—'} · {player.position || 'Player'}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs">
                          <div className="text-center">
                            <p className="font-bold text-red-400">{stat.total_kills || 0}</p>
                            <p className="text-slate-600">K</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-emerald-400">{stat.total_aces || 0}</p>
                            <p className="text-slate-600">A</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-amber-400">{stat.total_digs || 0}</p>
                            <p className="text-slate-600">D</p>
                          </div>
                          <div className="text-center px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)' }}>
                            <p className="font-bold text-amber-300">{ppg}</p>
                            <p className="text-slate-600">PPG</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Award className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No stats recorded yet</p>
                  <p className="text-xs text-slate-600 mt-1">Complete games and enter player stats</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Upcoming Operations ── */}
          <div className="tc-card tc-fadeIn tc-fadeIn-4">
            <div className="flex items-center justify-between p-5 border-b border-blue-500/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="tc-section-title">UPCOMING OPERATIONS</span>
              </div>
              <button
                onClick={() => onNavigate?.('schedule')}
                className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300 transition"
              >
                Schedule <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-blue-500/5">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 6).map(event => {
                  const isGame = event.event_type === 'game'
                  const isToday = countdownText(event.event_date) === 'TODAY'
                  const isTomorrow = countdownText(event.event_date) === 'TOMORROW'

                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEventDetail(event)}
                      className="px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-blue-500/5 transition"
                    >
                      {/* Date column */}
                      <div className="text-center min-w-[44px]">
                        <p className="text-[10px] text-slate-600 font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                        </p>
                        <p className={`text-xl font-black ${isToday ? 'text-red-400' : isTomorrow ? 'text-amber-400' : 'text-white'}`}>
                          {new Date(event.event_date + 'T00:00:00').getDate()}
                        </p>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            isGame
                              ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                              : 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                          }`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {isGame ? 'GAME' : 'PRACTICE'}
                          </span>
                          {isToday && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mt-1 truncate">
                          {isGame && event.opponent_name ? `vs ${event.opponent_name}` : ''}
                          {event.event_time ? (isGame && event.opponent_name ? ' · ' : '') + formatTime12(event.event_time) : ''}
                          {event.venue_name ? ` · ${event.venue_name}` : ''}
                        </p>
                      </div>

                      {/* RSVP + Countdown */}
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold ${
                          isToday ? 'text-red-400' : isTomorrow ? 'text-amber-400' : 'text-slate-500'
                        }`}>
                          {countdownText(event.event_date)}
                        </span>
                        {rsvpCounts[event.id] ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-400">{rsvpCounts[event.id].going}✓</span>
                            {rsvpCounts[event.id].maybe > 0 && (
                              <span className="text-[10px] font-bold text-amber-400">{rsvpCounts[event.id].maybe}?</span>
                            )}
                            <span className="text-[10px] text-slate-600">/{roster.length}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">0/{roster.length} RSVP</span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-10 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            QUICK OPS — Action Grid
            ═══════════════════════════════════════════ */}
        <div className="tc-fadeIn tc-fadeIn-5">
          <p className="tc-label mb-3">QUICK OPS</p>
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
                  className="tc-card p-4 text-left hover:border-opacity-40 transition group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition"
                      style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                      <Icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{action.label}</p>
                      <p className="text-xs text-slate-600">{action.desc}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Roster Quick View ── */}
        <div className="tc-card tc-fadeIn tc-fadeIn-5">
          <div className="flex items-center justify-between p-5 border-b border-blue-500/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="tc-section-title">SQUAD ROSTER</span>
            </div>
            <button
              onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
              className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300 transition"
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
                        className="w-14 h-14 rounded-xl mx-auto object-cover border-2 border-transparent group-hover:border-blue-500/40 transition"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-sm font-bold border-2 border-transparent group-hover:border-blue-500/40 transition"
                        style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                        {player.first_name?.[0]}{player.last_name?.[0]}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5 font-medium truncate">
                      #{player.jersey_number || '—'}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate">
                      {player.first_name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">No players on roster</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════ */}

      {/* Event Detail Modal */}
      {selectedEventDetail && (
        <EventDetailModal
          event={selectedEventDetail}
          team={selectedTeam}
          onClose={() => setSelectedEventDetail(null)}
        />
      )}

      {/* Player Card Modal */}
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

      {/* Coach Blast Modal */}
      {showCoachBlast && selectedTeam && (
        <CoachBlastModal
          team={selectedTeam}
          onClose={() => setShowCoachBlast(false)}
          showToast={showToast}
        />
      )}

      {/* Warmup Timer Modal */}
      {showWarmupTimer && (
        <WarmupTimerModal onClose={() => setShowWarmupTimer(false)} />
      )}
    </div>
  )
}

// ============================================
// COACH BLAST MODAL — Quick message to team parents
// ============================================
function CoachBlastModal({ team, onClose, showToast }) {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      showToast?.('Please fill in title and message', 'error')
      return
    }

    setSending(true)
    try {
      const { data: blast, error } = await supabase
        .from('messages')
        .insert({
          season_id: selectedSeason?.id,
          sender_id: user?.id,
          title: title.trim(),
          body: body.trim(),
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="tc-card w-full max-w-lg"
        style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(139,92,246,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Send className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                MESSAGE PARENTS
              </h2>
              <p className="text-sm text-slate-400">Send to {team?.name} parents</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-white/5 transition">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="tc-label block mb-1.5">SUBJECT</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Practice time change tomorrow"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600"
              style={{ background: 'rgba(15,20,35,0.8)', border: '1px solid rgba(59,130,246,0.15)' }}
            />
          </div>

          <div>
            <label className="tc-label block mb-1.5">MESSAGE</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message to parents..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 resize-none"
              style={{ background: 'rgba(15,20,35,0.8)', border: '1px solid rgba(59,130,246,0.15)' }}
            />
          </div>

          <div>
            <label className="tc-label block mb-1.5">PRIORITY</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPriority('normal')}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  background: priority === 'normal' ? 'rgba(59,130,246,0.2)' : 'rgba(15,20,35,0.5)',
                  border: `1px solid ${priority === 'normal' ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.1)'}`,
                  color: priority === 'normal' ? '#93c5fd' : '#64748b'
                }}
              >
                Normal
              </button>
              <button
                onClick={() => setPriority('urgent')}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  background: priority === 'urgent' ? 'rgba(239,68,68,0.2)' : 'rgba(15,20,35,0.5)',
                  border: `1px solid ${priority === 'urgent' ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.1)'}`,
                  color: priority === 'urgent' ? '#f87171' : '#64748b'
                }}
              >
                🚨 Urgent
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-slate-300 font-medium transition"
            style={{ border: '1px solid rgba(59,130,246,0.15)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-white transition disabled:opacity-50"
            style={{ background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,0.4)' }}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// WARMUP TIMER MODAL — Countdown for drills
// ============================================
function WarmupTimerModal({ onClose }) {
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={!running ? onClose : undefined}>
      <div
        className="tc-card w-full max-w-sm text-center"
        style={{ background: 'rgba(15,20,35,0.95)', border: `1px solid ${isFinished ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.2)'}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
          <div className="flex items-center justify-center gap-3">
            <Timer className={`w-6 h-6 ${isFinished ? 'text-emerald-400' : 'text-amber-400'}`} />
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}>
              {isFinished ? 'TIME!' : 'WARMUP TIMER'}
            </h2>
          </div>
        </div>

        <div className="p-8">
          {totalSeconds === 0 ? (
            <div className="space-y-4">
              <p className="tc-label mb-4">SELECT DURATION</p>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 20].map(mins => (
                  <button
                    key={mins}
                    onClick={() => startTimer(mins)}
                    className="py-5 rounded-xl text-white font-black text-2xl transition hover:scale-105"
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '0.05em',
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}
                  >
                    {mins}<span className="text-sm text-slate-500 ml-1">MIN</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Progress ring */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="8" />
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
                  <span className={`text-5xl font-black ${isFinished ? 'text-emerald-400' : 'text-white'}`}
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                    {isFinished ? 'DONE' : `${minutes}:${secs.toString().padStart(2, '0')}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {running ? (
                  <button
                    onClick={() => setRunning(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-white transition"
                    style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    Pause
                  </button>
                ) : seconds > 0 ? (
                  <button
                    onClick={() => setRunning(true)}
                    className="flex-1 py-3 rounded-xl font-bold text-white transition"
                    style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    Resume
                  </button>
                ) : null}
                <button
                  onClick={resetTimer}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-300 transition"
                  style={{ border: '1px solid rgba(59,130,246,0.15)' }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-slate-400 text-sm font-medium transition hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export { CoachDashboard }
