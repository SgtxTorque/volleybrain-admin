import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import { 
  Calendar, MapPin, Clock, Users, ChevronRight, Check, 
  AlertTriangle, Target, MessageCircle, X, DollarSign, Plus, ClipboardList,
  MoreHorizontal, TrendingUp, Star, Award, Play, CheckCircle
} from 'lucide-react'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
    </svg>
  )
}

// Helper function to format time to 12-hour format
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

// ============================================
// SHARED CARD COMPONENT - Glass Style
// ============================================
function DashCard({ children, className = '', onClick }) {
  const { isDark } = useTheme()
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-300 ${
        isDark
          ? 'bg-slate-800/80 backdrop-blur-md border border-white/[0.08] shadow-glass-dark'
          : 'bg-white/80 backdrop-blur-md border border-white/40 shadow-soft-md'
      } ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// Card Header with title and menu
function CardHeader({ title, action, onAction, children }) {
  const { isDark } = useTheme()
  return (
    <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
      <h3 className={`font-semibold text-[15px] ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
      <div className="flex items-center gap-2">
        {children}
        {action && (
          <button
            onClick={onAction}
            className="text-sm text-[var(--accent-primary)] font-medium hover:opacity-80 flex items-center gap-1"
          >
            {action}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
          <MoreHorizontal className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
        </button>
      </div>
    </div>
  )
}

// ============================================
// NEXT GAME HERO CARD
// ============================================
function NextGameHero({ events, team, onEventClick, onSchedule }) {
  const { isDark } = useTheme()
  const nextGame = events?.find(e => e.event_type === 'game')
  const nextEvent = events?.[0]
  const heroEvent = nextGame || nextEvent

  const getCountdown = (dateStr) => {
    if (!dateStr) return ''
    const eventDate = new Date(dateStr + 'T00:00:00')
    const now = new Date()
    const diff = eventDate - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'TODAY'
    if (days === 1) return 'TOMORROW'
    if (days < 0) return 'PAST'
    return `IN ${days} DAYS`
  }

  if (!heroEvent) {
    return (
      <div className={`rounded-2xl p-6 text-center ${
        isDark ? 'bg-slate-800/60 border border-white/[0.08]' : 'bg-white/70 border border-white/40 shadow-soft-md'
      }`}>
        <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />
        <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No upcoming events</p>
        <button onClick={onSchedule} className="mt-3 text-sm text-[var(--accent-primary)] font-medium hover:opacity-80">
          View Schedule
        </button>
      </div>
    )
  }

  const isGame = heroEvent.event_type === 'game'
  const countdown = getCountdown(heroEvent.event_date)
  const teamColor = team?.color || '#6366F1'

  return (
    <div
      onClick={() => onEventClick?.(heroEvent)}
      className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg"
      style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}dd)` }}
    >
      <div className="relative px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-bold tracking-wider mb-3">
              {isGame ? 'NEXT MATCH' : 'NEXT EVENT'}
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {isGame && heroEvent.opponent ? `vs ${heroEvent.opponent}` : heroEvent.title || heroEvent.event_type}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-white/80 text-sm">
              {heroEvent.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(heroEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              )}
              {heroEvent.event_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime12(heroEvent.event_time)}
                </span>
              )}
              {heroEvent.venue_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {heroEvent.venue_name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black text-white ${countdown === 'TODAY' ? 'animate-pulse' : ''}`}>
              {countdown}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// EVENT DETAIL MODAL
// ============================================
function EventDetailModal({ event, team, onClose }) {
  if (!event) return null
  const eventDate = event.event_date ? new Date(event.event_date + 'T00:00:00') : null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: team?.color || '#6366F1' }}>
              {event.event_type === 'practice' ? <VolleyballIcon className="w-6 h-6" /> : '🏐'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{event.title || event.event_type}</h2>
              <p className="text-slate-500">{team?.name}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-800">{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className="text-slate-500">{formatTime12(event.event_time)}</p>}
            </div>
          </div>

          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-800">{event.venue_name || event.location}</p>
                {event.venue_address && <p className="text-sm text-slate-500">{event.venue_address}</p>}
              </div>
            </div>
          )}

          {event.opponent && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-400" />
              <p className="text-slate-800">vs {event.opponent}</p>
            </div>
          )}

          {event.notes && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">{event.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TEAM HEADER CARD - Like Season Card
// ============================================
function TeamHeaderCard({ team, season, playerCount, coachRole, onTeamHub, onChat }) {
  return (
    <DashCard className="overflow-hidden">
      {/* Header with team color */}
      <div 
        className="relative px-5 py-5"
        style={{ backgroundColor: team?.color || '#F59E0B' }}
      >
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <VolleyballIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">{season?.name || 'Spring 2026'}</p>
              <h2 className="text-2xl font-bold text-white">{team?.name || 'My Team'}</h2>
              <p className="text-white/80">
                {coachRole === 'head' ? '👑 Head Coach' : '🏅 Assistant Coach'} • {playerCount} players
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onTeamHub}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-white transition"
            >
              Team Hub
            </button>
            <button
              onClick={onChat}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-semibold transition flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          </div>
        </div>
      </div>
    </DashCard>
  )
}

// ============================================
// ROSTER WIDGET
// ============================================
function RosterWidget({ roster, onViewAll, onPlayerClick }) {
  const { isDark } = useTheme()
  return (
    <DashCard>
      <CardHeader title={`Roster (${roster.length})`} action="View All" onAction={onViewAll} />

      <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
        {roster.length > 0 ? (
          roster.slice(0, 6).map(player => (
            <div
              key={player.id}
              onClick={() => onPlayerClick?.(player)}
              className={`px-5 py-3 flex items-center gap-3 cursor-pointer transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
            >
              <div className={`text-xs font-bold w-7 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {player.jersey_number ? `#${player.jersey_number}` : '—'}
              </div>
              {player.photo_url ? (
                <img src={player.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  {player.first_name?.[0]}{player.last_name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{player.first_name} {player.last_name}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{player.position || 'Player'}</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>No players on roster yet</p>
          </div>
        )}
      </div>
    </DashCard>
  )
}

// ============================================
// QUICK ACTIONS WIDGET
// ============================================
function QuickActionsWidget({ onNavigate }) {
  const { isDark } = useTheme()
  const actions = [
    { icon: <Calendar className="w-5 h-5" />, label: 'Schedule', page: 'schedule', color: '#3B82F6' },
    { icon: <Check className="w-5 h-5" />, label: 'Attendance', page: 'attendance', color: '#10B981' },
    { icon: <Target className="w-5 h-5" />, label: 'Game Prep', page: 'gameprep', color: '#F59E0B' },
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Messages', page: 'chats', color: '#8B5CF6' },
  ]

  return (
    <DashCard>
      <CardHeader title="Quick Actions" />
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {actions.map(action => (
            <button
              key={action.page}
              onClick={() => onNavigate?.(action.page)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition group ${
                isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: action.color }}>
                {action.icon}
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </DashCard>
  )
}

// ============================================
// UPCOMING EVENTS WIDGET
// ============================================
function UpcomingWidget({ events, onViewAll, onEventClick }) {
  const { isDark } = useTheme()
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: date.getDate()
    }
  }

  return (
    <DashCard>
      <CardHeader title="Upcoming Schedule" action="View All" onAction={onViewAll} />
      <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
        {events.length > 0 ? (
          events.slice(0, 5).map(event => {
            const { day, date } = formatDate(event.event_date)
            const isGame = event.event_type === 'game'
            return (
              <div key={event.id} onClick={() => onEventClick?.(event)}
                className={`px-5 py-3 flex items-center gap-4 cursor-pointer transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}>
                <div className="text-center min-w-[40px]">
                  <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{day}</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    isGame
                      ? (isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-700')
                      : (isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-700')
                  }`}>
                    {isGame ? '🏐 Game' : '⚡ Practice'}
                  </span>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {formatTime12(event.event_time)}{event.venue_name && ` · ${event.venue_name}`}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center">
            <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>No upcoming events</p>
          </div>
        )}
      </div>
    </DashCard>
  )
}

// ============================================
// TEAM RECORD WIDGET
// ============================================
function TeamRecordWidget({ stats }) {
  const { isDark } = useTheme()
  const winRate = stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0
  const recentForm = stats.recentGames || []

  return (
    <DashCard>
      <CardHeader title="Team Record" />
      <div className="p-5">
        <div className="text-center mb-4">
          <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.wins}</span>
          <span className={`text-4xl font-bold mx-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>-</span>
          <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.losses}</span>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{winRate}% Win Rate</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
            <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold text-sm">W{stats.winStreak || 0}</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Streak</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
            <div className="flex items-center justify-center gap-1 text-rose-500 mb-1">
              <span className="font-bold text-sm">+{stats.pointDiff || 0}</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pt Diff</p>
          </div>
        </div>
        <div>
          <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Recent Form</p>
          <div className="flex gap-1.5">
            {recentForm.length > 0 ? (
              recentForm.slice(0, 5).map((game, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${game.won ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  {game.won ? 'W' : 'L'}
                </div>
              ))
            ) : (
              [1,2,3,4,5].map(i => (
                <div key={i} className={`w-8 h-8 rounded-lg border-2 border-dashed ${isDark ? 'border-slate-600' : 'border-slate-200'}`} />
              ))
            )}
          </div>
        </div>
      </div>
    </DashCard>
  )
}

// ============================================
// TOP PLAYER WIDGET
// ============================================
function TopPlayerWidget({ topPlayer, statCategory, onViewLeaderboards }) {
  const { isDark } = useTheme()
  return (
    <DashCard>
      <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <h3 className={`font-semibold text-[15px] flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <Star className="w-4 h-4 text-amber-500" /> Top Player
        </h3>
      </div>
      <div className="p-5">
        {topPlayer ? (
          <div className="text-center">
            {topPlayer.photo_url ? (
              <img src={topPlayer.photo_url} alt="" className="w-14 h-14 rounded-full mx-auto mb-2 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full mx-auto mb-2 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                {topPlayer.first_name?.[0]}{topPlayer.last_name?.[0]}
              </div>
            )}
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{topPlayer.first_name} {topPlayer.last_name}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{topPlayer.position || 'Player'}</p>
            <p className="text-2xl font-bold text-amber-500 mt-2">{topPlayer.statValue || 0}</p>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className={`w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <Award className={`w-7 h-7 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No stats yet</p>
          </div>
        )}
        <button onClick={onViewLeaderboards}
          className="w-full mt-3 text-sm text-[var(--accent-primary)] font-medium hover:opacity-80 flex items-center justify-center gap-1">
          View Leaderboards <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </DashCard>
  )
}

// ============================================
// TEAM SELECTOR (Multiple Teams)
// ============================================
function TeamSelector({ teams, selectedTeam, onSelect }) {
  const { isDark } = useTheme()
  if (teams.length <= 1) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
      {teams.map(team => (
        <button
          key={team.id}
          onClick={() => onSelect(team)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition flex-shrink-0 ${
            selectedTeam?.id === team.id
              ? (isDark ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-blue-500 bg-blue-50')
              : (isDark ? 'border-white/[0.08] bg-slate-800/60 hover:border-white/[0.15]' : 'border-slate-200 bg-white hover:border-blue-300')
          }`}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.color || '#6366F1' }}>
            {team.name?.charAt(0)}
          </div>
          <div className="text-left">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{team.name}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {team.coachRole === 'head' ? '👑 Head' : '🏅 Asst'} · {team.playerCount} players
            </p>
          </div>
          {selectedTeam?.id === team.id && <Check className="w-5 h-5 text-[var(--accent-primary)]" />}
        </button>
      ))}
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
  const { isDark, accent } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [roster, setRoster] = useState([])
  const [teamStats, setTeamStats] = useState({
    wins: 0,
    losses: 0,
    totalGames: 0,
    winStreak: 0,
    pointDiff: 0,
    recentGames: []
  })
  const [topPlayer, setTopPlayer] = useState(null)
  const [selectedEventDetail, setSelectedEventDetail] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  const coachName = profile?.full_name?.split(' ')[0] || 'Coach'
  const coachTeamAssignments = roleContext?.coachInfo?.team_coaches || []

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

      // Load team details
      const { data: teamData } = await supabase
        .from('teams')
        .select('*, seasons(name, sports(name, icon))')
        .in('id', teamIds)

      // Get player counts
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
      
      // Sort: head coaches first
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
        .select(`*, players (id, first_name, last_name, photo_url, jersey_number, position)`)
        .eq('team_id', team.id)
      
      setRoster(players?.map(p => p.players).filter(Boolean) || [])

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

      // Load team record from games
      const { data: games } = await supabase
        .from('games')
        .select('team_score, opponent_score, status, date')
        .eq('team_id', team.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })

      let wins = 0, losses = 0, pointDiff = 0, winStreak = 0
      const recentGames = []
      
      games?.forEach((g, i) => {
        const won = g.team_score > g.opponent_score
        if (won) wins++
        else losses++
        pointDiff += (g.team_score || 0) - (g.opponent_score || 0)
        
        if (i < 5) recentGames.push({ won })
        
        // Calculate current win streak
        if (i === 0 && won) winStreak = 1
        else if (i > 0 && won && recentGames[i-1]?.won) winStreak++
      })

      setTeamStats({
        wins,
        losses,
        totalGames: (games?.length || 0),
        winStreak,
        pointDiff,
        recentGames
      })

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
          <VolleyballIcon className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Welcome, Coach!</h2>
        <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>You haven't been assigned to any teams yet. Contact your league administrator to get assigned.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Selector */}
      <TeamSelector
        teams={teams}
        selectedTeam={selectedTeam}
        onSelect={handleTeamSelect}
      />

      {/* Hero: Next Game / Event */}
      <NextGameHero
        events={upcomingEvents}
        team={selectedTeam}
        onEventClick={setSelectedEventDetail}
        onSchedule={() => onNavigate?.('schedule')}
      />

      {/* 2-Column Sideline HQ Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Roster (always visible) */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <TeamHeaderCard
            team={selectedTeam}
            season={selectedSeason}
            playerCount={selectedTeam?.playerCount || 0}
            coachRole={selectedTeam?.coachRole}
            onTeamHub={() => navigateToTeamWall?.(selectedTeam?.id)}
            onChat={() => openTeamChat(selectedTeam?.id)}
          />
          <RosterWidget
            roster={roster}
            onViewAll={() => navigateToTeamWall?.(selectedTeam?.id)}
            onPlayerClick={setSelectedPlayer}
          />
        </div>

        {/* RIGHT: Actions + Record + Events */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <QuickActionsWidget onNavigate={onNavigate} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamRecordWidget stats={teamStats} />
            <TopPlayerWidget
              topPlayer={topPlayer}
              statCategory="Points"
              onViewLeaderboards={() => onNavigate?.('leaderboards')}
            />
          </div>
          <UpcomingWidget
            events={upcomingEvents}
            onViewAll={() => onNavigate?.('schedule')}
            onEventClick={setSelectedEventDetail}
          />
        </div>
      </div>

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
    </div>
  )
}

export { CoachDashboard }
