import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Edit, Save, X, Calendar, MapPin, Users, Award, Star, 
  TrendingUp, Activity, Shirt, Check, ClipboardList, Trophy, Lock, Target
} from '../../constants/icons'

// Badge definitions
const PLAYER_BADGES = [
  { id: 'first_practice', name: 'First Practice', icon: '🌟', description: 'Attended first practice', category: 'attendance' },
  { id: 'perfect_attendance', name: 'Perfect Attendance', icon: '⭐', description: 'Never missed a practice', category: 'attendance' },
  { id: 'attendance_streak_5', name: '5 Game Streak', icon: '🔥', description: 'Attended 5 events in a row', category: 'attendance' },
  { id: 'attendance_streak_10', name: '10 Game Streak', icon: '💥', description: 'Attended 10 events in a row', category: 'attendance' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', description: 'Registered in first week', category: 'registration' },
  { id: 'returning_player', name: 'Returning Player', icon: '🏠', description: 'Played multiple seasons', category: 'registration' },
  { id: 'team_player', name: 'Team Player', icon: '🤝', description: 'Great sportsmanship', category: 'coach' },
  { id: 'mvp', name: 'MVP', icon: '🏆', description: 'Most Valuable Player', category: 'coach' },
  { id: 'most_improved', name: 'Most Improved', icon: '📈', description: 'Showed great improvement', category: 'coach' },
  { id: 'hustle_award', name: 'Hustle Award', icon: '💪', description: 'Always gives 100%', category: 'coach' },
  { id: 'first_game', name: 'Game Day', icon: '🎮', description: 'Played first game', category: 'gameplay' },
  { id: 'first_win', name: 'Winner', icon: '🥇', description: 'Won first game', category: 'gameplay' },
  { id: 'tournament_ready', name: 'Tournament Ready', icon: '🎯', description: 'Competed in a tournament', category: 'gameplay' },
]

function PlayerProfilePage({ playerId, roleContext, showToast }) {
  const { organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [player, setPlayer] = useState(null)
  const [teams, setTeams] = useState([])
  const [stats, setStats] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingJersey, setEditingJersey] = useState(false)
  const [jerseyPrefs, setJerseyPrefs] = useState({ pref1: '', pref2: '', pref3: '', size: '' })

  useEffect(() => {
    loadPlayerData()
  }, [playerId])

  async function loadPlayerData() {
    setLoading(true)
    try {
      // First get basic player data
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (playerError) {
        console.error('Player query error:', playerError)
        setLoading(false)
        return
      }

      if (!playerData) {
        console.error('No player found with id:', playerId)
        setLoading(false)
        return
      }

      // Get team_players separately
      const { data: teamPlayersData } = await supabase
        .from('team_players')
        .select('id, team_id, jersey_number, position, teams (id, name, color, season_id)')
        .eq('player_id', playerId)

      // Get season info if player has season_id
      let seasonData = null
      if (playerData.season_id) {
        const { data: season } = await supabase
          .from('seasons')
          .select('id, name, sport_id, sports (name, icon)')
          .eq('id', playerData.season_id)
          .single()
        seasonData = season
      }

      // Combine all data
      const enrichedPlayer = {
        ...playerData,
        seasons: seasonData,
        team_players: teamPlayersData || []
      }

      setPlayer(enrichedPlayer)
      setJerseyPrefs({
        pref1: playerData.jersey_pref_1 || '',
        pref2: playerData.jersey_pref_2 || '',
        pref3: playerData.jersey_pref_3 || '',
        size: playerData.uniform_size_jersey || ''
      })
      setTeams((teamPlayersData || []).map(tp => tp.teams).filter(Boolean))

      // Load badges (table might not exist yet, so handle gracefully)
      try {
        const { data: badgeData } = await supabase
          .from('player_badges')
          .select('badge_id, earned_at')
          .eq('player_id', playerId)

        if (badgeData) {
          const earnedBadges = badgeData.map(b => ({
            ...PLAYER_BADGES.find(pb => pb.id === b.badge_id),
            earned_at: b.earned_at
          })).filter(Boolean)
          setBadges(earnedBadges)
        }
      } catch (err) {
        console.log('Badges table may not exist yet:', err)
        setBadges([])
      }

      // Load attendance stats
      try {
        const { data: attendanceData } = await supabase
          .from('event_rsvps')
          .select('status, schedule_events(event_type)')
          .eq('player_id', playerId)

        if (attendanceData) {
          const attended = attendanceData.filter(r => r.status === 'attending' || r.status === 'attended').length
          const total = attendanceData.length
          setStats({
            attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
            gamesPlayed: attendanceData.filter(r => r.schedule_events?.event_type === 'game').length,
            practicesAttended: attendanceData.filter(r => r.schedule_events?.event_type === 'practice').length
          })
        }
      } catch (err) {
        console.log('Error loading attendance:', err)
        setStats({ attendanceRate: 0, gamesPlayed: 0, practicesAttended: 0 })
      }
    } catch (err) {
      console.error('Error loading player:', err)
    }
    setLoading(false)
  }

  async function saveJerseyPreferences() {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          jersey_pref_1: jerseyPrefs.pref1 ? parseInt(jerseyPrefs.pref1) : null,
          jersey_pref_2: jerseyPrefs.pref2 ? parseInt(jerseyPrefs.pref2) : null,
          jersey_pref_3: jerseyPrefs.pref3 ? parseInt(jerseyPrefs.pref3) : null,
          uniform_size_jersey: jerseyPrefs.size || null
        })
        .eq('id', playerId)

      if (error) throw error
      showToast('Jersey preferences saved!', 'success')
      setEditingJersey(false)
      loadPlayerData()
    } catch (err) {
      showToast('Error saving preferences: ' + err.message, 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">😕</span>
        <h2 className={`text-xl font-bold ${tc.text} mt-4`}>Player Not Found</h2>
      </div>
    )
  }

  const primaryTeam = teams[0]
  const teamColor = primaryTeam?.color || '#EAB308'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Player Card Header */}
      <div 
        className="relative rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${teamColor}40, ${teamColor}10)` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: teamColor, transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full" style={{ background: teamColor, transform: 'translate(-30%, 30%)' }} />
        </div>

        <div className="relative p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {player.photo_url ? (
                <img 
                  src={player.photo_url} 
                  alt={player.first_name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl flex items-center justify-center text-5xl font-bold border-4 border-white shadow-xl"
                  style={{ backgroundColor: `${teamColor}30`, color: teamColor }}
                >
                  {player.first_name?.[0]}{player.last_name?.[0]}
                </div>
              )}
              {player.team_players?.[0]?.jersey_number && (
                <div 
                  className="absolute -bottom-3 -right-3 w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: teamColor }}
                >
                  {player.team_players[0].jersey_number}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className={`text-3xl md:text-4xl font-bold ${tc.text}`}>
                {player.first_name} {player.last_name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                {teams.map(team => (
                  <span 
                    key={team.id}
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: team.color || '#EAB308' }}
                  >
                    {team.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: teamColor }}>{stats?.gamesPlayed || 0}</p>
                <p className={`text-xs ${tc.textMuted}`}>Games</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: teamColor }}>{stats?.attendanceRate || 0}%</p>
                <p className={`text-xs ${tc.textMuted}`}>Attendance</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: teamColor }}>{badges.length}</p>
                <p className={`text-xs ${tc.textMuted}`}>Badges</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
        <div className={`flex border-b ${tc.border}`}>
          {[
            { id: 'overview', label: 'Overview', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'jersey', label: 'Jersey', icon: <Shirt className="w-4 h-4" /> },
            { id: 'badges', label: 'Badges', icon: <Trophy className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 font-medium transition flex items-center justify-center gap-2 text-sm ${
                activeTab === tab.id ? 'border-b-2 text-[var(--accent-primary)]' : `${tc.textMuted} ${tc.hoverBg}`
              }`}
              style={activeTab === tab.id ? { borderColor: teamColor, color: teamColor } : {}}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className={`font-semibold ${tc.text} mb-3`}>Registration Info</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                    <p className={`text-xs ${tc.textMuted}`}>Season</p>
                    <p className={`font-medium ${tc.text}`}>{player.seasons?.name || 'N/A'}</p>
                  </div>
                  <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                    <p className={`text-xs ${tc.textMuted}`}>Sport</p>
                    <p className={`font-medium ${tc.text}`}>{player.seasons?.sports?.icon} {player.seasons?.sports?.name || 'N/A'}</p>
                  </div>
                  <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                    <p className={`text-xs ${tc.textMuted}`}>Status</p>
                    <p className={`font-medium ${player.status === 'active' ? 'text-emerald-500' : tc.text}`}>
                      {player.status === 'active' ? '✓ Active' : player.status}
                    </p>
                  </div>
                  <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                    <p className={`text-xs ${tc.textMuted}`}>Registered</p>
                    <p className={`font-medium ${tc.text}`}>{player.created_at ? new Date(player.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`font-semibold ${tc.text} mb-3`}>Attendance Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
                    <p className="text-3xl font-bold text-emerald-500">{stats?.attendanceRate || 0}%</p>
                    <p className={`text-xs ${tc.textMuted}`}>Overall Rate</p>
                  </div>
                  <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
                    <p className="text-3xl font-bold" style={{ color: teamColor }}>{stats?.practicesAttended || 0}</p>
                    <p className={`text-xs ${tc.textMuted}`}>Practices</p>
                  </div>
                  <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
                    <p className="text-3xl font-bold" style={{ color: teamColor }}>{stats?.gamesPlayed || 0}</p>
                    <p className={`text-xs ${tc.textMuted}`}>Games</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jersey' && (
            <div className="space-y-6">
              <div>
                <h3 className={`font-semibold ${tc.text} mb-3`}>Current Jersey</h3>
                <div className="flex items-center gap-6">
                  <div 
                    className="w-24 h-28 rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden"
                    style={{ backgroundColor: teamColor }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 rounded-b-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
                    <span className="text-4xl font-bold mt-2">{player.team_players?.[0]?.jersey_number || '?'}</span>
                    <span className="text-xs opacity-80 mt-1">{primaryTeam?.name}</span>
                  </div>
                  <div className="flex-1">
                    <p className={tc.text}><span className="font-semibold">Number:</span> #{player.team_players?.[0]?.jersey_number || 'Not assigned'}</p>
                    <p className={tc.text}><span className="font-semibold">Size:</span> {player.uniform_size_jersey || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${tc.text}`}>Your Preferences</h3>
                  {!editingJersey && (
                    <button onClick={() => setEditingJersey(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"><Edit className="w-4 h-4 inline mr-1" />Edit</button>
                  )}
                </div>

                {editingJersey ? (
                  <div className={`${tc.cardBgAlt} rounded-xl p-5 space-y-4`}>
                    <p className={`text-sm ${tc.textMuted}`}>Set your preferred jersey numbers!</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-xs ${tc.textMuted} mb-1`}>1st Choice</label>
                        <input type="number" min="1" max="99" value={jerseyPrefs.pref1} onChange={e => setJerseyPrefs({ ...jerseyPrefs, pref1: e.target.value })} placeholder="1-99" className={`w-full px-3 py-2 rounded-lg border ${tc.input} text-center text-xl font-bold`} />
                      </div>
                      <div>
                        <label className={`block text-xs ${tc.textMuted} mb-1`}>2nd Choice</label>
                        <input type="number" min="1" max="99" value={jerseyPrefs.pref2} onChange={e => setJerseyPrefs({ ...jerseyPrefs, pref2: e.target.value })} placeholder="1-99" className={`w-full px-3 py-2 rounded-lg border ${tc.input} text-center text-xl font-bold`} />
                      </div>
                      <div>
                        <label className={`block text-xs ${tc.textMuted} mb-1`}>3rd Choice</label>
                        <input type="number" min="1" max="99" value={jerseyPrefs.pref3} onChange={e => setJerseyPrefs({ ...jerseyPrefs, pref3: e.target.value })} placeholder="1-99" className={`w-full px-3 py-2 rounded-lg border ${tc.input} text-center text-xl font-bold`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs ${tc.textMuted} mb-1`}>Jersey Size</label>
                      <select value={jerseyPrefs.size} onChange={e => setJerseyPrefs({ ...jerseyPrefs, size: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${tc.input}`}>
                        <option value="">Select size...</option>
                        <optgroup label="Youth"><option value="YXS">Youth XS</option><option value="YS">Youth S</option><option value="YM">Youth M</option><option value="YL">Youth L</option><option value="YXL">Youth XL</option></optgroup>
                        <optgroup label="Adult"><option value="AS">Adult S</option><option value="AM">Adult M</option><option value="AL">Adult L</option><option value="AXL">Adult XL</option><option value="A2XL">Adult 2XL</option></optgroup>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setEditingJersey(false)} className={`flex-1 py-2 rounded-lg ${tc.cardBg} border ${tc.border} ${tc.text}`}>Cancel</button>
                      <button onClick={saveJerseyPreferences} className="flex-1 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold">Save Preferences</button>
                    </div>
                  </div>
                ) : (
                  <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div><p className={`text-xs ${tc.textMuted}`}>1st Choice</p><p className={`text-2xl font-bold ${tc.text}`}>{player.jersey_pref_1 || '—'}</p></div>
                      <div><p className={`text-xs ${tc.textMuted}`}>2nd Choice</p><p className={`text-2xl font-bold ${tc.text}`}>{player.jersey_pref_2 || '—'}</p></div>
                      <div><p className={`text-xs ${tc.textMuted}`}>3rd Choice</p><p className={`text-2xl font-bold ${tc.text}`}>{player.jersey_pref_3 || '—'}</p></div>
                      <div><p className={`text-xs ${tc.textMuted}`}>Size</p><p className={`text-2xl font-bold ${tc.text}`}>{player.uniform_size_jersey || '—'}</p></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div>
                <h3 className={`font-semibold ${tc.text} mb-3`}>Earned Badges ({badges.length})</h3>
                {badges.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges.map(badge => (
                      <div key={badge.id} className={`${tc.cardBgAlt} rounded-xl p-4 text-center hover:scale-105 transition`}>
                        <span className="text-4xl">{badge.icon}</span>
                        <p className={`font-semibold ${tc.text} mt-2`}>{badge.name}</p>
                        <p className={`text-xs ${tc.textMuted}`}>{badge.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`${tc.cardBgAlt} rounded-xl p-8 text-center`}>
                    <Target className="w-16 h-16" />
                    <p className={`${tc.textSecondary} mt-2`}>No badges earned yet</p>
                    <p className={`text-sm ${tc.textMuted}`}>Keep playing to unlock badges!</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className={`font-semibold ${tc.text} mb-3`}>Available Badges</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PLAYER_BADGES.filter(b => !badges.find(eb => eb.id === b.id)).slice(0, 8).map(badge => (
                    <div key={badge.id} className={`${tc.cardBgAlt} rounded-xl p-4 text-center opacity-50`}>
                      <span className="text-4xl grayscale">{badge.icon}</span>
                      <p className={`font-semibold ${tc.textMuted} mt-2`}>{badge.name}</p>
                      <p className={`text-xs ${tc.textMuted}`}>{badge.description}</p>
                      <p className="text-xs text-amber-500 mt-1"><Lock className="w-3 h-3 inline mr-1" />Locked</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================

export { PlayerProfilePage }
