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
// SHARED CARD COMPONENT - iOS Style
// ============================================
function DashCard({ children, className = '', onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl 
        shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
        border border-slate-100
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Card Header with title and menu
function CardHeader({ title, action, onAction, children }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <h3 className="font-semibold text-slate-800 text-[15px]">{title}</h3>
      <div className="flex items-center gap-2">
        {children}
        {action && (
          <button 
            onClick={onAction}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
          >
            {action}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button className="p-1 hover:bg-slate-100 rounded-lg transition">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
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
// PLAYER OVERVIEW WIDGET (Card Grid + Compact List)
// ============================================
function PlayerOverviewWidget({ roster, team, onViewAll, onPlayerClick }) {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'compact'
  
  // Sample achievement badges - in production, fetch from player_achievements
  const badgeIcons = {
    ace_master: { icon: '🏐', color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
    hustle_award: { icon: '💪', color: '#EF4444', bg: 'linear-gradient(135deg, #EF4444, #DC2626)' },
    iron_wall: { icon: '🛡️', color: '#6B7280', bg: 'linear-gradient(135deg, #6B7280, #4B5563)' },
    mvp: { icon: '⭐', color: '#EF4444', bg: 'linear-gradient(135deg, #EF4444, #B91C1C)' },
    team_player: { icon: '🤝', color: '#3B82F6', bg: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
    sharp_shooter: { icon: '🎯', color: '#8B5CF6', bg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
  }

  // Stat categories with colors
  const statCategories = [
    { key: 'kills', label: 'KILLS', color: '#F59E0B' },
    { key: 'assists', label: 'ASSISTS', color: '#3B82F6' },
    { key: 'blocks', label: 'BLOCKS', color: '#8B5CF6' },
    { key: 'digs', label: 'DIGS', color: '#10B981' },
    { key: 'aces', label: 'ACES', color: '#EF4444' },
  ]

  // Calculate overall rating (mock - would come from stats)
  const getOverallRating = (player) => {
    return Math.floor(70 + Math.random() * 20)
  }

  // Get player's highest stat (mock - would come from player_stats)
  const getHighestStat = (player) => {
    const stats = statCategories[Math.floor(Math.random() * statCategories.length)]
    return {
      ...stats,
      value: Math.floor(20 + Math.random() * 130)
    }
  }

  // Get player badges (mock - would come from player_achievements)
  const getPlayerBadges = (player) => {
    const allBadges = Object.keys(badgeIcons)
    const count = 2 + Math.floor(Math.random() * 3)
    return allBadges.slice(0, count)
  }

  // Get accent color for compact view border
  const getBorderColor = (index) => {
    const colors = ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444', '#06B6D4']
    return colors[index % colors.length]
  }

  return (
    <DashCard>
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-[15px]">Player Overview</h3>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'compact' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              List
            </button>
          </div>
          <button 
            onClick={onViewAll}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded-lg transition">
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {roster.length > 0 ? (
          <>
            {/* ═══ GRID VIEW ═══ */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 gap-3">
                {roster.slice(0, 14).map(player => {
                  const overall = getOverallRating(player)
                  const badges = getPlayerBadges(player)
                  
                  return (
                    <div 
                      key={player.id}
                      onClick={() => onPlayerClick?.(player)}
                      className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg"
                    >
                      {/* Player Photo */}
                      <div className="aspect-[4/3] relative">
                        {player.photo_url ? (
                          <img 
                            src={player.photo_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white/30">
                              {player.first_name?.[0]}{player.last_name?.[0]}
                            </span>
                          </div>
                        )}
                        {/* Gradient overlay at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-800 to-transparent" />
                      </div>
                      
                      {/* Player Info */}
                      <div className="px-3 pb-3 -mt-2 relative">
                        <h4 className="font-bold text-white text-sm">
                          {player.first_name} {player.last_name?.[0]}.
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                          #{player.jersey_number || '—'} • {player.position || 'Player'} • Overall <span className="text-white font-bold">{overall}</span>
                        </p>
                        
                        {/* Achievement Badges */}
                        <div className="flex gap-1 mt-2">
                          {badges.map((badgeKey, i) => {
                            const badge = badgeIcons[badgeKey]
                            return (
                              <div 
                                key={i}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-xs shadow-sm"
                                style={{ background: badge.bg }}
                                title={badgeKey.replace('_', ' ')}
                              >
                                {badge.icon}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ═══ COMPACT LIST VIEW ═══ */}
            {viewMode === 'compact' && (
              <div className="space-y-2">
                {roster.slice(0, 14).map((player, index) => {
                  const overall = getOverallRating(player)
                  const topStat = getHighestStat(player)
                  const borderColor = getBorderColor(index)
                  
                  return (
                    <div 
                      key={player.id}
                      onClick={() => onPlayerClick?.(player)}
                      className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg overflow-hidden cursor-pointer hover:brightness-110 transition flex items-center"
                    >
                      {/* Left Color Border */}
                      <div 
                        className="w-1 self-stretch"
                        style={{ backgroundColor: borderColor }}
                      />
                      
                      {/* Player Photo */}
                      <div className="p-3">
                        {player.photo_url ? (
                          <img 
                            src={player.photo_url} 
                            alt="" 
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center">
                            <span className="text-lg font-bold text-white/50">
                              {player.first_name?.[0]}{player.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Player Info */}
                      <div className="flex-1 min-w-0 py-3">
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-bold text-white text-sm tracking-wide">
                            {player.first_name?.[0]}. {player.last_name?.toUpperCase()}
                          </h4>
                          <span className="text-slate-500 text-xs">#{player.jersey_number || '—'}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {player.position || 'Player'} • {team?.name || 'Team'}
                        </p>
                      </div>
                      
                      {/* Top Stat */}
                      <div className="text-center px-4">
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: topStat.color }}
                        >
                          {topStat.value}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wider">
                          {topStat.label}
                        </p>
                      </div>
                      
                      {/* Overall Rating Badge */}
                      <div className="pr-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{overall}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No players on roster yet</p>
            <p className="text-slate-400 text-sm">Players will appear here once added to the team</p>
          </div>
        )}
      </div>
    </DashCard>
  )
}

// ============================================
// RECENT ACHIEVEMENTS WIDGET
// ============================================
function RecentAchievementsWidget({ teamId, onViewAll }) {
  // Sample achievements - in production, fetch from database
  const achievements = [
    { id: 1, name: 'Ace Master', icon: '🏐', color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
    { id: 2, name: 'Hustle Award', icon: '💪', color: '#EF4444', bg: 'linear-gradient(135deg, #EF4444, #DC2626)' },
    { id: 3, name: 'Iron Wall', icon: '🛡️', color: '#6B7280', bg: 'linear-gradient(135deg, #6B7280, #4B5563)' },
    { id: 4, name: 'MVP', icon: '⭐', color: '#EF4444', bg: 'linear-gradient(135deg, #EF4444, #B91C1C)' },
  ]

  return (
    <DashCard>
      <CardHeader title="Recent Achievements" action="View All" onAction={onViewAll} />
      
      <div className="p-4">
        <div className="flex justify-around">
          {achievements.map(achievement => (
            <div key={achievement.id} className="flex flex-col items-center gap-2">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                style={{ background: achievement.bg }}
              >
                {achievement.icon}
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[70px]">
                {achievement.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashCard>
  )
}

// ============================================
// QUICK ACTIONS WIDGET
// ============================================
function QuickActionsWidget({ onNavigate }) {
  const actions = [
    { icon: <Calendar className="w-6 h-6" />, label: 'Schedule', page: 'schedule', color: '#3B82F6' },
    { icon: <Check className="w-6 h-6" />, label: 'Attendance', page: 'attendance', color: '#10B981' },
    { icon: <Target className="w-6 h-6" />, label: 'Game Prep', page: 'gameprep', color: '#F59E0B' },
    { icon: <MessageCircle className="w-6 h-6" />, label: 'Messages', page: 'chats', color: '#8B5CF6' },
  ]

  return (
    <DashCard>
      <CardHeader title="Quick Actions" />
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {actions.map(action => (
            <button
              key={action.page}
              onClick={() => onNavigate?.(action.page)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition group"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
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
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: date.getDate()
    }
  }

  return (
    <DashCard>
      <CardHeader title="Upcoming" action="View All" onAction={onViewAll} />
      
      <div className="divide-y divide-slate-100">
        {events.length > 0 ? (
          events.slice(0, 5).map(event => {
            const { day, date } = formatDate(event.event_date)
            const isGame = event.event_type === 'game'
            
            return (
              <div 
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition"
              >
                <div className="text-center min-w-[45px]">
                  <p className="text-[10px] text-slate-400 font-medium">{day}</p>
                  <p className="text-2xl font-bold text-slate-800">{date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    isGame ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {isGame ? '🏐 Game' : '⚡ Practice'}
                  </span>
                  <p className="text-sm text-slate-600 mt-1">
                    {formatTime12(event.event_time)}
                    {event.venue_name && ` · ${event.venue_name}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No upcoming events</p>
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
  const winRate = stats.totalGames > 0 
    ? Math.round((stats.wins / stats.totalGames) * 100) 
    : 0

  // Recent form (last 5 games)
  const recentForm = stats.recentGames || []

  return (
    <DashCard>
      <CardHeader title="Team Record" />
      
      <div className="p-5">
        {/* Big Record Display */}
        <div className="text-center mb-6">
          <span className="text-5xl font-bold text-slate-800">{stats.wins}</span>
          <span className="text-5xl font-bold text-slate-400 mx-2">-</span>
          <span className="text-5xl font-bold text-slate-800">{stats.losses}</span>
          <p className="text-slate-500 mt-1">{winRate}% Win Rate</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold">W{stats.winStreak || 0}</span>
            </div>
            <p className="text-xs text-slate-500">Current Streak</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-rose-600 mb-1">
              <span className="font-bold">+{stats.pointDiff || 0}</span>
            </div>
            <p className="text-xs text-slate-500">Point Diff</p>
          </div>
        </div>
        
        {/* Recent Form */}
        <div>
          <p className="text-sm text-slate-500 mb-2">Recent Form</p>
          <div className="flex gap-2">
            {recentForm.length > 0 ? (
              recentForm.slice(0, 5).map((game, i) => (
                <div 
                  key={i}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm ${
                    game.won ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  {game.won ? 'W' : 'L'}
                </div>
              ))
            ) : (
              <>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-9 h-9 rounded-lg bg-slate-100 border-2 border-dashed border-slate-200" />
                ))}
              </>
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
  return (
    <DashCard>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-[15px] flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Top Player
        </h3>
        <select 
          value={statCategory}
          className="text-sm text-slate-600 bg-transparent border-none outline-none cursor-pointer"
        >
          <option value="points">Points</option>
          <option value="kills">Kills</option>
          <option value="assists">Assists</option>
        </select>
      </div>
      
      <div className="p-5">
        {topPlayer ? (
          <div className="text-center">
            {topPlayer.photo_url ? (
              <img src={topPlayer.photo_url} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                {topPlayer.first_name?.[0]}{topPlayer.last_name?.[0]}
              </div>
            )}
            <p className="font-semibold text-slate-800">{topPlayer.first_name} {topPlayer.last_name}</p>
            <p className="text-sm text-slate-500">{topPlayer.position || 'Player'}</p>
            <p className="text-2xl font-bold text-amber-500 mt-2">{topPlayer.statValue || 0}</p>
            <p className="text-xs text-slate-500">{statCategory}</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-slate-100 flex items-center justify-center">
              <Award className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm">No stats recorded yet</p>
            <p className="text-xs text-slate-400">Complete games and enter player stats to see leaders</p>
          </div>
        )}
        
        <button 
          onClick={onViewLeaderboards}
          className="w-full mt-4 text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center justify-center gap-1"
        >
          View Leaderboards
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </DashCard>
  )
}

// ============================================
// TEAM SELECTOR (Multiple Teams)
// ============================================
function TeamSelector({ teams, selectedTeam, onSelect }) {
  if (teams.length <= 1) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
      {teams.map(team => (
        <button
          key={team.id}
          onClick={() => onSelect(team)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition flex-shrink-0 ${
            selectedTeam?.id === team.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-200 bg-white hover:border-blue-300'
          }`}
        >
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: team.color || '#6366F1' }}
          >
            {team.name?.charAt(0)}
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-800">{team.name}</p>
            <p className="text-xs text-slate-500">
              {team.coachRole === 'head' ? '👑 Head' : '🏅 Asst'} • {team.playerCount} players
            </p>
          </div>
          {selectedTeam?.id === team.id && (
            <Check className="w-5 h-5 text-blue-500" />
          )}
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
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 bg-amber-100 flex items-center justify-center">
          <VolleyballIcon className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome, Coach!</h2>
        <p className="text-slate-500 mb-6">You haven't been assigned to any teams yet. Contact your league administrator to get assigned.</p>
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

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* ═══════════════════════════════════════════════════
            LEFT COLUMN
            ═══════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Team Header Card */}
          <TeamHeaderCard 
            team={selectedTeam}
            season={selectedSeason}
            playerCount={selectedTeam?.playerCount || 0}
            coachRole={selectedTeam?.coachRole}
            onTeamHub={() => navigateToTeamWall?.(selectedTeam?.id)}
            onChat={() => openTeamChat(selectedTeam?.id)}
          />
          
          {/* Player Overview (Card Grid) */}
          <PlayerOverviewWidget 
            roster={roster}
            team={selectedTeam}
            onViewAll={() => navigateToTeamWall?.(selectedTeam?.id)}
            onPlayerClick={setSelectedPlayer}
          />
          
          {/* Recent Achievements */}
          <RecentAchievementsWidget 
            teamId={selectedTeam?.id}
            onViewAll={() => onNavigate?.('achievements')}
          />
        </div>

        {/* ═══════════════════════════════════════════════════
            MIDDLE COLUMN
            ═══════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <QuickActionsWidget onNavigate={onNavigate} />
          
          {/* Upcoming Events */}
          <UpcomingWidget 
            events={upcomingEvents}
            onViewAll={() => onNavigate?.('schedule')}
            onEventClick={setSelectedEventDetail}
          />
        </div>

        {/* ═══════════════════════════════════════════════════
            RIGHT COLUMN
            ═══════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Team Record */}
          <TeamRecordWidget stats={teamStats} />
          
          {/* Top Player */}
          <TopPlayerWidget 
            topPlayer={topPlayer}
            statCategory="Points"
            onViewLeaderboards={() => onNavigate?.('leaderboards')}
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
