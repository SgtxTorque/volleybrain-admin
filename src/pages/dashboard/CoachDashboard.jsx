import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import { 
  Calendar, MapPin, Clock, Users, ChevronRight, Check, 
  AlertTriangle, Target, MessageCircle, X, DollarSign, Plus, ClipboardList
} from '../../constants/icons'

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
// EVENT DETAIL MODAL (Coach View)
// ============================================
function EventDetailModal({ event, team, onClose }) {
  const tc = useThemeClasses()
  if (!event) return null

  const eventDate = event.event_date ? new Date(event.event_date + 'T00:00:00') : null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${tc.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white`} style={{ backgroundColor: team?.color || '#6366F1' }}>
              {event.event_type === 'practice' ? <VolleyballIcon className="w-6 h-6" /> : 
               event.event_type === 'game' ? '🏐' : '📅'}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${tc.text}`}>{event.title || event.event_type}</h2>
              <p className={tc.textMuted}>{team?.name}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <Calendar className={`w-5 h-5 ${tc.textMuted}`} />
            <div>
              <p className={tc.text}>{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className={tc.textSecondary}>{formatTime12(event.event_time)}</p>}
            </div>
          </div>

          {/* Location */}
          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 ${tc.textMuted}`} />
              <div>
                <p className={tc.text}>{event.venue_name || event.location}</p>
                {event.venue_address && <p className={`text-sm ${tc.textSecondary}`}>{event.venue_address}</p>}
              </div>
            </div>
          )}

          {/* Opponent (for games) */}
          {event.opponent && (
            <div className="flex items-center gap-3">
              <Users className={`w-5 h-5 ${tc.textMuted}`} />
              <p className={tc.text}>vs {event.opponent}</p>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
              <p className={`text-sm ${tc.textSecondary}`}>{event.notes}</p>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl border ${tc.border} ${tc.text} font-medium`}>
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
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [todayEvents, setTodayEvents] = useState([])
  const [roster, setRoster] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [selectedEventDetail, setSelectedEventDetail] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  // Get coach's name from profile
  const coachName = profile?.full_name?.split(' ')[0] || 'Coach'
  
  // Get coach teams from roleContext - this is the key data source
  const coachTeamAssignments = roleContext?.coachInfo?.team_coaches || []

  useEffect(() => {
    loadCoachData()
  }, [coachTeamAssignments?.length, selectedSeason?.id])

  async function loadCoachData() {
    setLoading(true)
    try {
      // Get team IDs from coach assignments
      const teamIds = coachTeamAssignments.map(tc => tc.team_id).filter(Boolean)
      
      if (teamIds.length === 0) {
        // No teams assigned - show empty state
        setTeams([])
        setLoading(false)
        return
      }

      // Load team details
      let teamData = []
      try {
        const { data } = await supabase
          .from('teams')
          .select('*, seasons(name, sports(name, icon))')
          .in('id', teamIds)
        teamData = data || []
      } catch (err) {
        console.log('Could not load teams with joins, trying simple query')
        const { data } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds)
        teamData = data || []
      }
      
      // Get player counts for each team separately (avoid complex joins)
      const teamsWithCounts = []
      for (const team of teamData) {
        try {
          const { count } = await supabase
            .from('team_players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
          
          // Find the coach assignment to get role (head/assistant)
          const assignment = coachTeamAssignments.find(a => a.team_id === team.id)
          
          teamsWithCounts.push({ 
            ...team, 
            playerCount: count || 0,
            coachRole: assignment?.role || 'coach'
          })
        } catch (err) {
          teamsWithCounts.push({ ...team, playerCount: 0, coachRole: 'coach' })
        }
      }
      
      // Sort: head coaches first, then assistants
      teamsWithCounts.sort((a, b) => {
        if (a.coachRole === 'head' && b.coachRole !== 'head') return -1
        if (b.coachRole === 'head' && a.coachRole !== 'head') return 1
        return 0
      })
      
      setTeams(teamsWithCounts)
      
      // Set first team as selected if none selected
      if (teamsWithCounts.length > 0) {
        const teamToSelect = selectedTeam ? teamsWithCounts.find(t => t.id === selectedTeam.id) || teamsWithCounts[0] : teamsWithCounts[0]
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
      // Load roster for this team
      try {
        const { data: players } = await supabase
          .from('team_players')
          .select(`
            *,
            players (
              id, first_name, last_name, photo_url, jersey_number, position,
              parent_name, parent_email, parent_phone
            )
          `)
          .eq('team_id', team.id)
        
        setRoster(players?.map(p => p.players).filter(Boolean) || [])
      } catch (err) {
        console.log('Could not load roster:', err)
        setRoster([])
      }

      // Load upcoming events from schedule_events table
      const today = new Date().toISOString().split('T')[0]
      try {
        const { data: events } = await supabase
          .from('schedule_events')
          .select('*')
          .eq('team_id', team.id)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .order('event_time', { ascending: true })
          .limit(10)
        
        setUpcomingEvents(events || [])
        
        // Filter today's events
        setTodayEvents((events || []).filter(e => e.event_date === today))
      } catch (err) {
        console.log('Could not load schedule:', err)
        setUpcomingEvents([])
        setTodayEvents([])
      }

      // Load recent team posts
      try {
        const { data: posts } = await supabase
          .from('team_posts')
          .select('*')
          .eq('team_id', team.id)
          .order('created_at', { ascending: false })
          .limit(5)
        
        setRecentPosts(posts || [])
      } catch (err) {
        console.log('Could not load posts:', err)
        setRecentPosts([])
      }

    } catch (err) {
      console.error('Error loading team data:', err)
    }
  }

  // When selected team changes, reload data
  function handleTeamSelect(team) {
    setSelectedTeam(team)
    loadTeamData(team)
  }

  // Navigate to team chat
  function openTeamChat(teamId) {
    sessionStorage.setItem('openTeamChat', teamId)
    onNavigate?.('messages')
  }

  // Get sport info from first team
  const primarySport = teams[0]?.seasons?.sports

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  // No teams assigned
  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <VolleyballIcon className="w-20 h-20 text-[var(--accent-primary)] mb-4" />
          <h2 className={`text-2xl font-bold ${tc.text} mb-2`}>Welcome, Coach!</h2>
          <p className={tc.textSecondary}>You haven't been assigned to any teams yet.</p>
          <p className={`${tc.textMuted} mb-6`}>Contact your league administrator to get assigned to a team.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Coach's Name and Sport/Season Context */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {primarySport && (
              <span className="text-2xl">{primarySport.icon}</span>
            )}
            <span className={`text-sm ${tc.textMuted}`}>
              {primarySport?.name || 'Sports'} • {selectedSeason?.name || 'Current Season'}
            </span>
          </div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>Welcome back, Coach {coachName}! 🏐</h1>
          <p className={tc.textSecondary}>
            {teams.length === 1 
              ? `Managing ${selectedTeam?.name}`
              : `Managing ${teams.length} teams`
            }
          </p>
        </div>
      </div>

      {/* Team Selector (if coaching multiple teams) */}
      {teams.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => handleTeamSelect(team)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition flex-shrink-0 ${
                selectedTeam?.id === team.id 
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' 
                  : `${tc.border} ${tc.cardBg} hover:border-[var(--accent-primary)]/50`
              }`}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: team.color || '#6366F1' }}
              >
                {team.name?.charAt(0)}
              </div>
              <div className="text-left">
                <p className={`font-medium ${tc.text}`}>{team.name}</p>
                <p className={`text-xs ${tc.textMuted}`}>
                  {team.coachRole === 'head' ? '👑 Head' : '🏅 Asst'} • {team.playerCount} players
                </p>
              </div>
              {selectedTeam?.id === team.id && (
                <Check className="w-5 h-5 text-[var(--accent-primary)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Today's Events Banner */}
      {todayEvents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📅</span>
              <div>
                <p className={`font-semibold ${tc.text}`}>Today's {todayEvents.length === 1 ? 'Event' : 'Events'}</p>
                <p className={`text-sm ${tc.textSecondary}`}>
                  {todayEvents[0].event_type === 'game' ? '🏐 Game' : '🏋️ Practice'} at {formatTime12(todayEvents[0].event_time)}
                  {todayEvents[0].venue_name && ` • ${todayEvents[0].venue_name}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedEventDetail(todayEvents[0])}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:brightness-110 transition"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Team Info & Roster (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Card */}
          {selectedTeam && (
            <div 
              className="rounded-2xl p-6 text-white"
              style={{ backgroundColor: selectedTeam.color || '#6366F1' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                    <VolleyballIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">{selectedTeam.seasons?.name || selectedSeason?.name}</p>
                    <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
                    <p className="text-white/80">
                      {selectedTeam.coachRole === 'head' ? '👑 Head Coach' : '🏅 Assistant Coach'} • {selectedTeam.playerCount} players
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigateToTeamWall?.(selectedTeam.id)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition"
                  >
                    Team Hub
                  </button>
                  <button
                    onClick={() => openTeamChat(selectedTeam.id)}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-semibold transition flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Roster Preview */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
            <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
              <h2 className={`font-semibold ${tc.text} flex items-center gap-2`}>
                <Users className="w-5 h-5" /> Roster ({roster.length})
              </h2>
              <button 
                onClick={() => onNavigate?.('players')}
                className="text-sm text-[var(--accent-primary)] hover:underline"
              >
                View All →
              </button>
            </div>
            {roster.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {roster.slice(0, 6).map(player => (
                  <div 
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition"
                  >
                    {player.photo_url ? (
                      <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-bold">
                        {player.first_name?.[0]}{player.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${tc.text}`}>{player.first_name} {player.last_name}</p>
                      <p className={`text-sm ${tc.textMuted}`}>
                        {player.jersey_number && `#${player.jersey_number} • `}
                        {player.position || 'Player'}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${tc.textMuted}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
                <p className={`${tc.textMuted} mt-4`}>No players on roster yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Schedule */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
            <h3 className={`font-semibold ${tc.text} mb-4`}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate?.('schedule')}
                className={`${tc.cardBgAlt} rounded-xl p-4 text-center hover:scale-[1.02] transition`}
              >
                <Calendar className={`w-6 h-6 mx-auto mb-2 ${tc.textMuted}`} />
                <p className={`text-sm font-medium ${tc.text}`}>Schedule</p>
              </button>
              <button
                onClick={() => onNavigate?.('attendance')}
                className={`${tc.cardBgAlt} rounded-xl p-4 text-center hover:scale-[1.02] transition`}
              >
                <Check className={`w-6 h-6 mx-auto mb-2 ${tc.textMuted}`} />
                <p className={`text-sm font-medium ${tc.text}`}>Attendance</p>
              </button>
              <button
                onClick={() => onNavigate?.('gameprep')}
                className={`${tc.cardBgAlt} rounded-xl p-4 text-center hover:scale-[1.02] transition`}
              >
                <Target className={`w-6 h-6 mx-auto mb-2 ${tc.textMuted}`} />
                <p className={`text-sm font-medium ${tc.text}`}>Game Prep</p>
              </button>
              <button
                onClick={() => onNavigate?.('messages')}
                className={`${tc.cardBgAlt} rounded-xl p-4 text-center hover:scale-[1.02] transition`}
              >
                <MessageCircle className={`w-6 h-6 mx-auto mb-2 ${tc.textMuted}`} />
                <p className={`text-sm font-medium ${tc.text}`}>Messages</p>
              </button>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
            <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
              <h3 className={`font-semibold ${tc.text}`}>📅 Upcoming</h3>
              <button 
                onClick={() => onNavigate?.('schedule')}
                className="text-sm text-[var(--accent-primary)] hover:underline"
              >
                View All →
              </button>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {upcomingEvents.slice(0, 5).map(event => {
                  const eventDate = new Date(event.event_date + 'T00:00:00')
                  return (
                    <div 
                      key={event.id}
                      onClick={() => setSelectedEventDetail(event)}
                      className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition"
                    >
                      <div className="text-center min-w-[45px]">
                        <p className={`text-xs ${tc.textMuted} uppercase`}>
                          {eventDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className={`text-xl font-bold ${tc.text}`}>{eventDate.getDate()}</p>
                      </div>
                      <div className="flex-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          event.event_type === 'game' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {event.event_type === 'game' ? '🏐 Game' : '🏋️ Practice'}
                        </span>
                        <p className={`text-sm ${tc.textSecondary} mt-1`}>
                          {formatTime12(event.event_time)}
                          {event.venue_name && ` • ${event.venue_name}`}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${tc.textMuted}`} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Calendar className={`w-10 h-10 mx-auto ${tc.textMuted}`} />
                <p className={`${tc.textMuted} mt-2 text-sm`}>No upcoming events</p>
              </div>
            )}
          </div>

          {/* Team Stats Summary */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
            <h3 className={`font-semibold ${tc.text} mb-4`}>📊 Team Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-400">{roster.length}</p>
                <p className={`text-xs ${tc.textMuted}`}>Players</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                <p className="text-2xl font-bold text-emerald-400">{upcomingEvents.length}</p>
                <p className={`text-xs ${tc.textMuted}`}>Upcoming</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-500/10">
                <p className="text-2xl font-bold text-amber-400">
                  {upcomingEvents.filter(e => e.event_type === 'game').length}
                </p>
                <p className={`text-xs ${tc.textMuted}`}>Games</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-500/10">
                <p className="text-2xl font-bold text-purple-400">
                  {upcomingEvents.filter(e => e.event_type === 'practice').length}
                </p>
                <p className={`text-xs ${tc.textMuted}`}>Practices</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Team Posts */}
      {recentPosts.length > 0 && (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
          <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
            <h2 className={`font-semibold ${tc.text}`}>📰 Recent Team Posts</h2>
            <button 
              onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-gray-700/50">
            {recentPosts.map(post => (
              <div 
                key={post.id}
                onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
                className="p-4 cursor-pointer hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs ${tc.textMuted}`}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  {post.is_pinned && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">📌 Pinned</span>
                  )}
                </div>
                {post.title && <p className={`font-medium ${tc.text}`}>{post.title}</p>}
                <p className={`text-sm ${tc.textSecondary} line-clamp-2`}>{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
