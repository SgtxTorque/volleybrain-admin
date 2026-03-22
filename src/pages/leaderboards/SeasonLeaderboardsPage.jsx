import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

// ============================================
// INLINE ICONS
// ============================================
const TrophyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
)

const MedalIcon = ({ className, color }) => (
  <svg className={className} viewBox="0 0 24 24" fill={color || 'currentColor'}>
    <circle cx="12" cy="13" r="8" fill={color} opacity="0.2"/>
    <circle cx="12" cy="13" r="6" fill={color}/>
    <path d="M9 2h6l-3 6-3-6z" fill={color}/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">1</text>
  </svg>
)

const FilterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const ChevronRightIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

// ============================================
// LEADERBOARD CATEGORIES
// ============================================
const LEADERBOARD_CATEGORIES = [
  {
    id: 'points',
    label: 'Points Leaders',
    statKey: 'total_points',
    perGameKey: 'points_per_game',
    icon: '⭐',
    color: '#F59E0B',
    description: 'Total points scored'
  },
  {
    id: 'aces',
    label: 'Ace Leaders',
    statKey: 'total_aces',
    perGameKey: 'aces_per_game',
    icon: '🏐',
    color: '#10B981',
    description: 'Service aces'
  },
  {
    id: 'kills',
    label: 'Kill Leaders',
    statKey: 'total_kills',
    perGameKey: 'kills_per_game',
    icon: '💥',
    color: '#EF4444',
    description: 'Attack kills'
  },
  {
    id: 'blocks',
    label: 'Block Leaders',
    statKey: 'total_blocks',
    perGameKey: 'blocks_per_game',
    icon: '🛡️',
    color: '#6366F1',
    description: 'Total blocks'
  },
  {
    id: 'digs',
    label: 'Dig Leaders',
    statKey: 'total_digs',
    perGameKey: 'digs_per_game',
    icon: '🏃',
    color: '#4BB9EC',
    description: 'Defensive digs'
  },
  {
    id: 'assists',
    label: 'Assist Leaders',
    statKey: 'total_assists',
    perGameKey: 'assists_per_game',
    icon: '🙌',
    color: '#8B5CF6',
    description: 'Setting assists'
  },
  {
    id: 'hitting',
    label: 'Hitting %',
    statKey: 'hitting_percentage',
    isPercentage: true,
    icon: '🎯',
    color: '#EC4899',
    description: 'Attack efficiency'
  },
  {
    id: 'serving',
    label: 'Serve %',
    statKey: 'serve_percentage',
    isPercentage: true,
    icon: '✅',
    color: '#14B8A6',
    description: 'Serve success rate'
  },
]

// ============================================
// RANK BADGE COMPONENT
// ============================================
function RankBadge({ rank }) {
  const { isDark } = useTheme()
  if (rank === 1) {
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-900/30' : 'shadow-amber-200'}`}>
        <span className="text-white font-bold text-r-lg">🥇</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg ${isDark ? 'shadow-slate-900/30' : 'shadow-slate-200'}`}>
        <span className="text-white font-bold text-r-lg">🥈</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg ${isDark ? 'shadow-orange-900/30' : 'shadow-orange-200'}`}>
        <span className="text-white font-bold text-r-lg">🥉</span>
      </div>
    )
  }

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
      <span className="font-bold text-slate-400">{rank}</span>
    </div>
  )
}

// ============================================
// LEADERBOARD ROW COMPONENT
// ============================================
function LeaderboardRow({ player, rank, statValue, isPercentage, color, onClick, isHighlighted }) {
  const { isDark } = useTheme()
  const displayValue = isPercentage
    ? `${(statValue * 100).toFixed(1)}%`
    : statValue

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl transition cursor-pointer ${
        rank <= 3
          ? `${isDark ? 'bg-gradient-to-r from-lynx-charcoal to-lynx-charcoal/80' : 'bg-gradient-to-r from-white to-slate-50'} border-2 ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} shadow-sm hover:shadow-md`
          : `${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} ${isDark ? 'hover:bg-white/[0.04]' : 'hover:border-slate-300'}`
      } ${isHighlighted ? 'ring-2 ring-lynx-sky' : ''}`}
    >
      {/* Rank */}
      <RankBadge rank={rank} />

      {/* Player photo */}
      {player.photo_url ? (
        <img src={player.photo_url} className="w-12 h-12 rounded-xl object-cover" />
      ) : (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <span className="font-bold text-slate-400">{player.jersey_number || '?'}</span>
        </div>
      )}

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate text-r-sm`}>
          {player.first_name} {player.last_name}
        </p>
        <p className="text-r-sm text-slate-400">
          #{player.jersey_number} · {player.team_name || 'Team'}
        </p>
      </div>

      {/* Stat value */}
      <div className="text-right">
        <p
          className="text-r-2xl font-bold"
          style={{ color }}
        >
          {displayValue}
        </p>
        <p className="text-r-xs text-slate-400">
          {player.games_played || 0} games
        </p>
      </div>

      <ChevronRightIcon className="w-5 h-5 text-slate-400" />
    </div>
  )
}

// ============================================
// CATEGORY TAB COMPONENT
// ============================================
function CategoryTab({ category, isActive, onClick }) {
  const { isDark } = useTheme()
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-r-sm font-medium transition whitespace-nowrap ${
        isActive
          ? 'text-white shadow-lg'
          : `${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} ${isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-600 hover:bg-slate-100'}`
      }`}
      style={isActive ? { backgroundColor: category.color } : {}}
    >
      <span className="text-lg">{category.icon}</span>
      <span>{category.label}</span>
    </button>
  )
}

// ============================================
// MINI LEADERBOARD CARD
// ============================================
function MiniLeaderboardCard({ category, leaders, onViewAll, onPlayerClick }) {
  const { isDark } = useTheme()
  const topThree = leaders.slice(0, 3)

  return (
    <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px] overflow-hidden hover:shadow-lg transition`}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: `${category.color}15` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-r-2xl">{category.icon}</span>
          <div>
            <h3 className={`font-semibold text-r-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{category.label}</h3>
            <p className="text-r-xs text-slate-400">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Top 3 */}
      <div className="p-4 space-y-3">
        {topThree.length === 0 ? (
          <div className="text-center py-4 text-slate-400">
            <p className="text-r-sm">No data yet</p>
          </div>
        ) : (
          topThree.map((entry, idx) => (
            <div
              key={entry.player_id}
              onClick={() => onPlayerClick?.(entry)}
              className={`flex items-center gap-3 cursor-pointer ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'} rounded-lg p-2 -mx-2 transition`}
            >
              <RankBadge rank={idx + 1} />

              {entry.player?.photo_url ? (
                <img src={entry.player.photo_url} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-r-xs font-bold ${isDark ? 'bg-slate-700' : 'bg-slate-200'} text-slate-400`}>
                  {entry.player?.jersey_number || '?'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'} text-r-sm truncate`}>
                  {entry.player?.first_name} {entry.player?.last_name?.charAt(0)}.
                </p>
              </div>

              <p
                className="font-bold text-r-sm"
                style={{ color: category.color }}
              >
                {category.isPercentage
                  ? `${(entry[category.statKey] * 100).toFixed(0)}%`
                  : entry[category.statKey]
                }
              </p>
            </div>
          ))
        )}
      </div>

      {/* View all */}
      {leaders.length > 3 && (
        <button
          onClick={onViewAll}
          className={`w-full py-3 text-r-sm font-medium text-lynx-sky ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-sky-50'} transition border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}
        >
          View All Rankings
        </button>
      )}
    </div>
  )
}

// ============================================
// MAIN LEADERBOARDS PAGE
// ============================================
function SeasonLeaderboardsPage({ onPlayerClick, showToast }) {
  const { isDark } = useTheme()
  const { selectedSeason } = useSeason()

  const [leaderboardData, setLeaderboardData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'full'
  const [filterTeam, setFilterTeam] = useState(null)
  const [teams, setTeams] = useState([])

  useEffect(() => {
    loadLeaderboards()
    loadTeams()
  }, [selectedSeason?.id])

  // "All Seasons" sentinel — leaderboards are season-scoped
  if (isAllSeasons(selectedSeason)) {
    return (
      <PageShell title="Season Leaderboards" breadcrumb="Game Day">
        <SeasonFilterBar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', color: 'var(--v2-text-secondary, #64748B)' }}>
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Select a specific season above to view leaderboards.</p>
        </div>
      </PageShell>
    )
  }

  async function loadTeams() {
    if (isAllSeasons(selectedSeason)) return
    if (!selectedSeason?.id) return

    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .eq('season_id', selectedSeason.id)
      .order('name')

    setTeams(data || [])
  }

  async function loadLeaderboards() {
    if (isAllSeasons(selectedSeason)) return
    if (!selectedSeason?.id) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // Load all player season stats with player info
      const { data: stats } = await supabase
        .from('player_season_stats')
        .select(`
          *,
          player:players(id, first_name, last_name, jersey_number, photo_url, position),
          team:teams(id, name)
        `)
        .eq('season_id', selectedSeason.id)
        .gt('games_played', 0)

      // Process stats for each category
      const processed = {}

      LEADERBOARD_CATEGORIES.forEach(cat => {
        let filtered = (stats || [])
          .map(s => ({
            ...s,
            player: s.player,
            team_name: s.team?.name
          }))
          .filter(s => s[cat.statKey] !== null && s[cat.statKey] !== undefined)

        // For percentages, filter out low sample sizes
        if (cat.isPercentage) {
          filtered = filtered.filter(s => s.games_played >= 3)
        }

        // Sort descending
        filtered.sort((a, b) => (b[cat.statKey] || 0) - (a[cat.statKey] || 0))

        processed[cat.id] = filtered
      })

      setLeaderboardData(processed)

    } catch (err) {
      console.error('Error loading leaderboards:', err)
    }

    setLoading(false)
  }

  function getFilteredLeaders(categoryId) {
    let leaders = leaderboardData[categoryId] || []

    if (filterTeam) {
      leaders = leaders.filter(l => l.team_id === filterTeam)
    }

    return leaders
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full" />
      </div>
    )
  }

  const actionsContent = (
    <>
      {/* Team filter */}
      <div className="flex items-center gap-2">
        <FilterIcon className="w-4 h-4 text-slate-400" />
        <select
          value={filterTeam || ''}
          onChange={(e) => setFilterTeam(e.target.value || null)}
          className={`px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
        >
          <option value="">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* View toggle */}
      <div className={`flex rounded-xl p-1 border ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-100 border-slate-200'}`}>
        <button
          onClick={() => { setViewMode('grid'); setSelectedCategory(null); }}
          className={`px-3 py-1.5 rounded-lg text-r-sm font-medium transition ${
            viewMode === 'grid' ? 'bg-lynx-sky/20 text-lynx-sky' : 'text-slate-400'
          }`}
        >
          Grid
        </button>
        <button
          onClick={() => setViewMode('full')}
          className={`px-3 py-1.5 rounded-lg text-r-sm font-medium transition ${
            viewMode === 'full' ? 'bg-lynx-sky/20 text-lynx-sky' : 'text-slate-400'
          }`}
        >
          Full List
        </button>
      </div>
    </>
  )

  return (
    <PageShell
      title="Season Leaderboards"
      breadcrumb="Game Day"
      subtitle={selectedSeason?.name || 'No season selected'}
      actions={actionsContent}
    >
      {/* Category tabs (full view) */}
      {viewMode === 'full' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {LEADERBOARD_CATEGORIES.map(cat => (
            <CategoryTab
              key={cat.id}
              category={cat}
              isActive={selectedCategory?.id === cat.id}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {LEADERBOARD_CATEGORIES.map(cat => (
            <MiniLeaderboardCard
              key={cat.id}
              category={cat}
              leaders={getFilteredLeaders(cat.id)}
              onViewAll={() => {
                setSelectedCategory(cat)
                setViewMode('full')
              }}
              onPlayerClick={(entry) => onPlayerClick?.(entry.player_id, entry.team_id)}
            />
          ))}
        </div>
      )}

      {/* Full List View */}
      {viewMode === 'full' && selectedCategory && (
        <div className="space-y-4">
          {/* Category header */}
          <div
            className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-[14px] p-6 border-2`}
            style={{ borderColor: selectedCategory.color }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-r-3xl"
                style={{ backgroundColor: `${selectedCategory.color}20` }}
              >
                {selectedCategory.icon}
              </div>
              <div>
                <h2 className={`text-r-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedCategory.label}</h2>
                <p className="text-slate-400 text-r-sm">{selectedCategory.description}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-r-3xl font-bold" style={{ color: selectedCategory.color }}>
                  {getFilteredLeaders(selectedCategory.id).length}
                </p>
                <p className="text-r-sm text-slate-400">players ranked</p>
              </div>
            </div>
          </div>

          {/* Rankings list */}
          <div className="space-y-2">
            {getFilteredLeaders(selectedCategory.id).length === 0 ? (
              <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px] p-12 text-center`}>
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-7 h-7 text-slate-400" />
                </div>
                <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium text-r-sm`}>No rankings available</p>
                <p className="text-r-sm text-slate-400 mt-1">Stats need to be recorded first</p>
              </div>
            ) : (
              getFilteredLeaders(selectedCategory.id).map((entry, idx) => (
                <LeaderboardRow
                  key={entry.player_id}
                  player={{
                    ...entry.player,
                    team_name: entry.team_name,
                    games_played: entry.games_played
                  }}
                  rank={idx + 1}
                  statValue={entry[selectedCategory.statKey]}
                  isPercentage={selectedCategory.isPercentage}
                  color={selectedCategory.color}
                  onClick={() => onPlayerClick?.(entry.player_id, entry.team_id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* No category selected in full view */}
      {viewMode === 'full' && !selectedCategory && (
        <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px] p-12 text-center`}>
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <TrophyIcon className="w-7 h-7 text-amber-400" />
          </div>
          <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium text-r-sm`}>Select a category above to view rankings</p>
        </div>
      )}

      {/* Top Performers Summary */}
      {viewMode === 'grid' && (
        <div className="mt-8 bg-gradient-to-r from-lynx-navy to-lynx-charcoal rounded-[14px] p-6 text-white">
          <h3 className="text-r-xl font-bold mb-4 flex items-center gap-2">
            <TrophyIcon className="w-6 h-6" />
            Season MVPs
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Most Points */}
            {leaderboardData.points?.[0] && (
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-r-sm">Most Points</p>
                <div className="flex items-center gap-3 mt-2">
                  {leaderboardData.points[0].player?.photo_url ? (
                    <img src={leaderboardData.points[0].player.photo_url} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                      {leaderboardData.points[0].player?.jersey_number}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-r-sm">
                      {leaderboardData.points[0].player?.first_name} {leaderboardData.points[0].player?.last_name?.charAt(0)}.
                    </p>
                    <p className="text-white/70 text-r-sm">{leaderboardData.points[0].total_points} pts</p>
                  </div>
                </div>
              </div>
            )}

            {/* Most Aces */}
            {leaderboardData.aces?.[0] && (
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-r-sm">Most Aces</p>
                <div className="flex items-center gap-3 mt-2">
                  {leaderboardData.aces[0].player?.photo_url ? (
                    <img src={leaderboardData.aces[0].player.photo_url} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                      {leaderboardData.aces[0].player?.jersey_number}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-r-sm">
                      {leaderboardData.aces[0].player?.first_name} {leaderboardData.aces[0].player?.last_name?.charAt(0)}.
                    </p>
                    <p className="text-white/70 text-r-sm">{leaderboardData.aces[0].total_aces} aces</p>
                  </div>
                </div>
              </div>
            )}

            {/* Most Kills */}
            {leaderboardData.kills?.[0] && (
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-r-sm">Most Kills</p>
                <div className="flex items-center gap-3 mt-2">
                  {leaderboardData.kills[0].player?.photo_url ? (
                    <img src={leaderboardData.kills[0].player.photo_url} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                      {leaderboardData.kills[0].player?.jersey_number}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-r-sm">
                      {leaderboardData.kills[0].player?.first_name} {leaderboardData.kills[0].player?.last_name?.charAt(0)}.
                    </p>
                    <p className="text-white/70 text-r-sm">{leaderboardData.kills[0].total_kills} kills</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}

export { SeasonLeaderboardsPage, LEADERBOARD_CATEGORIES }
