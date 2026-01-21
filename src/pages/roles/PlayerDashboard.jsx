import { useState, useEffect } from 'react'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Calendar, Users, Target } from '../../constants/icons'
import { VolleyballIcon } from '../../constants/icons'
import { formatTime12 } from '../schedule'

function PlayerDashboard({ roleContext, navigateToTeamWall, onNavigate }) {
  const tc = useThemeClasses()
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (roleContext?.playerInfo) {
      loadPlayerData()
    } else {
      setLoading(false)
    }
  }, [roleContext])

  async function loadPlayerData() {
    try {
      const teamIds = roleContext.playerInfo.team_players?.map(tp => tp.team_id).filter(Boolean) || []
      
      if (teamIds.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase
          .from('schedule_events')
          .select('*, teams(name, color)')
          .in('team_id', teamIds)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5)
        setUpcomingEvents(events || [])
      }
    } catch (err) {
      console.error('Error loading player data:', err)
    }
    setLoading(false)
  }
  
  if (!roleContext?.playerInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <VolleyballIcon className="w-16 h-16 mb-4" />
        <h2 className={`text-xl font-bold ${tc.text} mb-2`}>No Player Profile</h2>
        <p className={tc.textSecondary}>Your account isn't linked to a player profile.</p>
      </div>
    )
  }

  const player = roleContext.playerInfo
  const teams = player.team_players || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className={`text-3xl font-bold ${tc.text}`}>Hey {player.first_name}!</h1>
        <VolleyballIcon className="w-8 h-8 text-[var(--accent-primary)]" />
      </div>
      <p className={tc.textSecondary}>Ready to play?</p>

      {/* My Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(tp => (
          <button
            key={tp.team_id}
            onClick={() => navigateToTeamWall(tp.team_id)}
            className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6 text-left hover:border-[var(--accent-primary)]/30 hover:scale-[1.02] transition`}
            style={{ borderLeftWidth: 4, borderLeftColor: tp.teams?.color }}
          >
            <h3 className={`text-xl font-bold ${tc.text}`}>{tp.teams?.name}</h3>
            <p className={tc.textSecondary}>View team wall →</p>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button 
          onClick={() => onNavigate('schedule')}
          className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border} ${tc.hoverBg} transition flex items-center gap-3`}
        >
          <Calendar className="w-8 h-8" />
          <div className="text-left">
            <p className={`font-medium ${tc.text}`}>Schedule</p>
            <p className={`text-xs ${tc.textMuted}`}>All events</p>
          </div>
        </button>
        {teams[0] && (
          <button 
            onClick={() => navigateToTeamWall(teams[0].team_id)}
            className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border} ${tc.hoverBg} transition flex items-center gap-3`}
          >
            <Users className="w-7 h-7" />
            <div className="text-left">
              <p className={`font-medium ${tc.text}`}>My Team</p>
              <p className={`text-xs ${tc.textMuted}`}>Roster & info</p>
            </div>
          </button>
        )}
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <h2 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
            <Calendar className="w-5 h-5" /> Coming Up
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map(event => {
              const eventDate = new Date(event.event_date)
              const isToday = eventDate.toDateString() === new Date().toDateString()
              
              return (
                <div 
                  key={event.id}
                  className={`flex items-center gap-4 p-3 rounded-xl ${tc.cardBgAlt}`}
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold"
                    style={{ 
                      background: `${event.teams?.color || '#EAB308'}20`,
                      color: event.teams?.color || '#EAB308'
                    }}
                  >
                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-sm">{eventDate.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${tc.text}`}>
                        {event.event_type === 'practice' && 'practice'}
                        {event.event_type === 'game' && '🏆'}
                        {event.event_type === 'tournament' && <Target className="w-4 h-4 inline" />}
                        {' '}{event.title || event.event_type}
                      </span>
                      {isToday && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Today!</span>}
                    </div>
                    <p className={`text-sm ${tc.textSecondary}`}>
                      {event.event_time && formatTime12(event.event_time)}
                      {event.venue_name && ` • ${event.venue_name}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export { PlayerDashboard }
