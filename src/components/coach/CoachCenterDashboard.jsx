import { useState } from 'react'
import {
  Users, Crosshair, ClipboardList,
  Swords, Zap, Clock, ChevronRight, Bell, Check, Send, Timer,
  UserCheck, X
} from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import CoachGameDayHero from './CoachGameDayHero'

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

// ── Quick Attendance Panel ──
function QuickAttendancePanel({ event, team, roster, userId, showToast }) {
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
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${isToday ? 'ring-1 ring-emerald-500/25' : ''}`}>
      <button onClick={handleExpand} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 border border-emerald-100">
          <UserCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Attendance</span>
            {isToday && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                TODAY
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 text-slate-400">
            {event.event_type === 'game' ? `Game vs ${event.opponent_name || 'TBD'}` : 'Practice'}
            {event.event_time ? ` · ${formatTime12(event.event_time)}` : ''}
            {expanded && loaded ? ` — ${presentCount}✓ ${absentCount}✗ ${unmarkedCount > 0 ? `${unmarkedCount} unmarked` : ''}` : ''}
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 text-slate-400 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {loading ? (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs mt-2 text-slate-400">Loading...</p>
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
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-400">{unmarkedCount} Unmarked</span>
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
                    <div key={player.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-blue-50 text-blue-600">
                          {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-slate-900">{player.first_name} {player.last_name}</p>
                        <p className="text-[10px] text-slate-400">#{player.jersey_number || '—'} · {player.position || 'Player'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markPlayer(player.id, 'yes')}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isPresent ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${isPresent ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                          onClick={() => markPlayer(player.id, 'no')}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isAbsent ? 'bg-red-500/20 border border-red-500/40' : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <X className={`w-4 h-4 ${isAbsent ? 'text-red-500' : 'text-slate-400'}`} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {roster.length === 0 && (
                <div className="py-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs text-slate-400">No players on roster</p>
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
}) {
  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">

      {/* Team Selector (multi-team) */}
      {teams.length > 1 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Team</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => onTeamSelect?.(team)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border whitespace-nowrap flex-shrink-0 ${
                  selectedTeam?.id === team.id
                    ? 'border-blue-300 bg-blue-50'
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
                  <p className="font-semibold text-sm text-slate-900">{team.name}</p>
                  <p className="text-xs text-slate-400">
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

      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {coachName}</h1>
        <p className="text-sm text-slate-500">{selectedTeam?.name} · {selectedSeason?.name}</p>
      </div>

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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
            <Crosshair className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Game Day Tools</h2>
            <p className="text-xs text-slate-400">Lineups, scoring, and stats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {/* Lineup Builder */}
          <button
            onClick={() => onNavigate?.('gameprep')}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 text-left hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
                <ClipboardList className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Lineup Builder</h3>
                <p className="text-xs text-slate-400">Build & manage lineups</p>
              </div>
            </div>
            {nextGame ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
                <Swords className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-slate-600">
                  Next: vs {nextGame.opponent_name || 'TBD'} · {countdownText(nextGame.event_date)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No upcoming games</p>
            )}
            <div className="flex items-center gap-1 mt-3 text-indigo-500 text-sm font-semibold">
              <span>Open Builder</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Game Day Hub */}
          <button
            onClick={() => onNavigate?.('gameprep')}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 text-left hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-100">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Game Day Hub</h3>
                <p className="text-xs text-slate-400">Live scoring & stats</p>
              </div>
            </div>
            {nextGame && countdownText(nextGame.event_date) === 'TODAY' ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-500 font-semibold">Game Day — vs {nextGame.opponent_name || 'TBD'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                <Clock className="w-4 h-4 text-amber-500/60" />
                <span className="text-xs text-slate-500">Score games, track stats, manage rotations</span>
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
              <p className="text-xs text-amber-600/70">Stats power leaderboards, badges, and parent views</p>
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

      {/* Row 3: Quick Attendance */}
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
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4 p-4 text-left hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 border border-emerald-100">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Take Attendance</h3>
              <p className="text-xs truncate text-slate-400">
                {nextEvent ? `${nextEvent.event_type === 'game' ? 'Game' : 'Practice'} · ${formatDateShort(nextEvent.event_date)}` : 'No upcoming events'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0 text-slate-400" />
          </button>

          <button
            onClick={() => onShowCoachBlast?.()}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4 p-4 text-left hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-50 border border-purple-100">
              <Send className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Message Parents</h3>
              <p className="text-xs truncate text-slate-400">Send announcement to {selectedTeam?.name}</p>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0 text-slate-400" />
          </button>

          <button
            onClick={() => onShowWarmupTimer?.()}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4 p-4 text-left hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 border border-amber-100">
              <Timer className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Start Warmup</h3>
              <p className="text-xs text-slate-400">Countdown timer for drills</p>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0 text-slate-400" />
          </button>
        </div>
      </div>

    </main>
  )
}
