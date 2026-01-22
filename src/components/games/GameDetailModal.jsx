import { useState, useEffect } from 'react'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  X, Calendar, Clock, MapPin, Users, Award, BarChart3, 
  FileText, ChevronRight, Trophy, Shield, Target, Zap 
} from 'lucide-react'

// ============================================
// GAME DETAIL MODAL
// Shows full breakdown of a completed game
// ============================================

export function GameDetailModal({ game, team, onClose, onEditStats, isAdmin = false }) {
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('summary')
  const [attendance, setAttendance] = useState([])
  const [badges, setBadges] = useState([])
  const [playerStats, setPlayerStats] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadGameDetails()
  }, [game?.id])
  
  async function loadGameDetails() {
    if (!game?.id) return
    setLoading(true)
    
    try {
      // Load attendance with player info
      const { data: attendanceData } = await supabase
        .from('event_attendance')
        .select(`
          *,
          player:players(id, first_name, last_name, jersey_number, position)
        `)
        .eq('event_id', game.id)
      
      setAttendance(attendanceData || [])
      
      // Load badges awarded for this game
      const { data: badgesData } = await supabase
        .from('player_badges')
        .select(`
          *,
          player:players(id, first_name, last_name, jersey_number)
        `)
        .eq('event_id', game.id)
      
      setBadges(badgesData || [])
      
      // Load player stats for this game
      const { data: statsData } = await supabase
        .from('game_player_stats')
        .select(`
          *,
          player:players(id, first_name, last_name, jersey_number, position)
        `)
        .eq('game_id', game.id)
        .order('kills', { ascending: false })
      
      setPlayerStats(statsData || [])
      
    } catch (err) {
      console.error('Error loading game details:', err)
    }
    
    setLoading(false)
  }
  
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  function formatTime(timeStr) {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }
  
  const badgeIcons = {
    game_mvp: '🏆',
    defensive_player: '🛡️',
    best_server: '🎯',
    team_spirit: '💪',
    most_improved: '📈',
    clutch_player: '⭐',
    first_game: '🌟'
  }
  
  const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length
  
  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'attendance', label: `Attendance (${presentCount})`, icon: Users },
    { id: 'badges', label: `Badges (${badges.length})`, icon: Award },
    { id: 'stats', label: 'Player Stats', icon: BarChart3 }
  ]
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`${tc.cardBg} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative overflow-hidden`}>
          {/* Background gradient based on result */}
          <div className={`absolute inset-0 ${
            game.game_result === 'win' ? 'bg-gradient-to-br from-emerald-600/30 to-emerald-900/30' :
            game.game_result === 'loss' ? 'bg-gradient-to-br from-red-600/30 to-red-900/30' :
            'bg-gradient-to-br from-amber-600/30 to-amber-900/30'
          }`} />
          
          <div className="relative p-6">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            {/* Result badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                game.game_result === 'win' ? 'bg-emerald-500 text-white' :
                game.game_result === 'loss' ? 'bg-red-500 text-white' :
                'bg-amber-500 text-black'
              }`}>
                {game.game_result === 'win' ? '🏆 VICTORY' : 
                 game.game_result === 'loss' ? 'DEFEAT' : 'TIE'}
              </span>
            </div>
            
            {/* Teams & Score */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{team?.name}</h2>
                <p className="text-white/70">vs {game.opponent_name || 'TBD'}</p>
              </div>
              
              <div className="text-right">
                {/* Set-based score */}
                {game.set_scores && game.our_sets_won !== undefined ? (
                  <>
                    <p className="text-5xl font-black text-white">
                      {game.our_sets_won} - {game.opponent_sets_won}
                    </p>
                    <p className="text-white/70 text-lg">
                      {game.set_scores
                        .filter(s => s && (s.our > 0 || s.their > 0))
                        .map(s => `${s.our}-${s.their}`)
                        .join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="text-5xl font-black text-white">
                    {game.our_score} - {game.opponent_score}
                  </p>
                )}
              </div>
            </div>
            
            {/* Game info */}
            <div className="flex flex-wrap gap-4 mt-4 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(game.event_date)}
              </span>
              {game.event_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(game.event_time)}
                </span>
              )}
              {game.location_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {game.location_name}
                </span>
              )}
              {game.location_type && (
                <span className="flex items-center gap-1">
                  {game.location_type === 'home' ? '🏠' : '✈️'}
                  {game.location_type === 'home' ? 'Home' : 'Away'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className={`flex border-b ${tc.border} px-4`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition border-b-2 -mb-px ${
                activeTab === tab.id 
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : `border-transparent ${tc.textMuted} hover:text-white`
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-700 rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Set-by-set breakdown (volleyball) */}
                  {game.set_scores && game.set_scores.length > 0 && (
                    <div>
                      <h3 className={`font-semibold ${tc.text} mb-3`}>Set-by-Set Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {game.set_scores.map((set, idx) => {
                          if (!set || (set.our === 0 && set.their === 0)) return null
                          const weWon = set.our > set.their
                          return (
                            <div 
                              key={idx}
                              className={`p-4 rounded-xl border ${
                                weWon ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                              }`}
                            >
                              <p className={`text-sm ${tc.textMuted} mb-1`}>Set {idx + 1}</p>
                              <p className={`text-2xl font-bold ${weWon ? 'text-emerald-400' : 'text-red-400'}`}>
                                {set.our} - {set.their}
                              </p>
                              <p className={`text-xs ${tc.textMuted}`}>
                                {weWon ? '✓ Won' : '✗ Lost'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                      <p className={`text-xs ${tc.textMuted} mb-1`}>Total Points</p>
                      <p className={`text-2xl font-bold ${tc.text}`}>{game.our_score}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                      <p className={`text-xs ${tc.textMuted} mb-1`}>Opp Points</p>
                      <p className={`text-2xl font-bold ${tc.text}`}>{game.opponent_score}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                      <p className={`text-xs ${tc.textMuted} mb-1`}>Point Diff</p>
                      <p className={`text-2xl font-bold ${
                        (game.point_differential || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {(game.point_differential || 0) >= 0 ? '+' : ''}{game.point_differential || (game.our_score - game.opponent_score)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                      <p className={`text-xs ${tc.textMuted} mb-1`}>Players</p>
                      <p className={`text-2xl font-bold ${tc.text}`}>{presentCount}</p>
                    </div>
                  </div>
                  
                  {/* Game Notes */}
                  {game.notes && (
                    <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                      <h4 className={`font-semibold ${tc.text} mb-2`}>📝 Game Notes</h4>
                      <p className={tc.textMuted}>{game.notes}</p>
                    </div>
                  )}
                  
                  {/* Badges Summary */}
                  {badges.length > 0 && (
                    <div>
                      <h3 className={`font-semibold ${tc.text} mb-3`}>🏅 Badges Awarded</h3>
                      <div className="flex flex-wrap gap-2">
                        {badges.map((badge, idx) => (
                          <div key={idx} className="px-3 py-2 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30">
                            <span className="mr-2">{badgeIcons[badge.badge_id] || '🏅'}</span>
                            <span className="text-[var(--accent-primary)] font-medium">
                              {badge.player?.first_name} {badge.player?.last_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  {attendance.length > 0 ? (
                    attendance.map(record => (
                      <div 
                        key={record.id}
                        className={`p-4 rounded-xl flex items-center justify-between ${
                          record.status === 'present' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                          record.status === 'late' ? 'bg-amber-500/10 border border-amber-500/30' :
                          'bg-red-500/10 border border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                            {record.player?.jersey_number || '?'}
                          </div>
                          <div>
                            <p className={`font-medium ${tc.text}`}>
                              {record.player?.first_name} {record.player?.last_name}
                            </p>
                            <p className={`text-xs ${tc.textMuted}`}>{record.player?.position || 'Player'}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          record.status === 'present' ? 'bg-emerald-500 text-white' :
                          record.status === 'late' ? 'bg-amber-500 text-black' :
                          'bg-red-500 text-white'
                        }`}>
                          {record.status === 'present' ? '✓ Present' : 
                           record.status === 'late' ? '⏰ Late' : '✗ Absent'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className={`w-12 h-12 ${tc.textMuted} mx-auto mb-3`} />
                      <p className={tc.textMuted}>No attendance records</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <div className="space-y-3">
                  {badges.length > 0 ? (
                    badges.map((badge, idx) => (
                      <div key={idx} className={`p-4 rounded-xl ${tc.cardBgAlt} flex items-center gap-4`}>
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
                          {badgeIcons[badge.badge_id] || '🏅'}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${tc.text}`}>
                            #{badge.player?.jersey_number} {badge.player?.first_name} {badge.player?.last_name}
                          </p>
                          <p className="text-[var(--accent-primary)] text-sm">
                            {badge.badge_id?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Award className={`w-12 h-12 ${tc.textMuted} mx-auto mb-3`} />
                      <p className={tc.textMuted}>No badges awarded for this game</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div>
                  {playerStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`text-xs ${tc.textMuted} border-b ${tc.border}`}>
                            <th className="text-left py-3 px-2">Player</th>
                            <th className="text-center py-3 px-2">K</th>
                            <th className="text-center py-3 px-2">A</th>
                            <th className="text-center py-3 px-2">Aces</th>
                            <th className="text-center py-3 px-2">Digs</th>
                            <th className="text-center py-3 px-2">Blks</th>
                            <th className="text-center py-3 px-2">Err</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerStats.map(stat => (
                            <tr key={stat.id} className={`border-b ${tc.border}`}>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">
                                    {stat.player?.jersey_number}
                                  </span>
                                  <span className={`font-medium ${tc.text}`}>
                                    {stat.player?.first_name} {stat.player?.last_name?.charAt(0)}.
                                  </span>
                                </div>
                              </td>
                              <td className={`text-center py-3 px-2 font-semibold ${stat.kills > 0 ? 'text-emerald-400' : tc.textMuted}`}>
                                {stat.kills || 0}
                              </td>
                              <td className={`text-center py-3 px-2 ${stat.assists > 0 ? 'text-blue-400' : tc.textMuted}`}>
                                {stat.assists || 0}
                              </td>
                              <td className={`text-center py-3 px-2 ${stat.aces > 0 ? 'text-purple-400' : tc.textMuted}`}>
                                {stat.aces || 0}
                              </td>
                              <td className={`text-center py-3 px-2 ${stat.digs > 0 ? 'text-amber-400' : tc.textMuted}`}>
                                {stat.digs || 0}
                              </td>
                              <td className={`text-center py-3 px-2 ${stat.blocks > 0 ? 'text-cyan-400' : tc.textMuted}`}>
                                {stat.blocks || 0}
                              </td>
                              <td className={`text-center py-3 px-2 ${stat.errors > 0 ? 'text-red-400' : tc.textMuted}`}>
                                {stat.errors || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className={`w-12 h-12 ${tc.textMuted} mx-auto mb-3`} />
                      <p className={tc.text} >No player stats recorded</p>
                      <p className={`text-sm ${tc.textMuted} mt-1`}>Stats can be entered after games</p>
                      {isAdmin && onEditStats && (
                        <button
                          onClick={() => onEditStats(game)}
                          className="mt-4 px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 transition"
                        >
                          + Enter Stats
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Add stats button for admins */}
                  {isAdmin && onEditStats && playerStats.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <button
                        onClick={() => onEditStats(game)}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition"
                      >
                        ✏️ Edit Player Stats
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameDetailModal
