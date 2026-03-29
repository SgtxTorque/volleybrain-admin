import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { Search, Trophy } from '../../constants/icons'
import { AchievementCard, CallingCardPreview } from './AchievementCard'
import { AchievementDetailModal } from './AchievementDetailModal'
import PageShell from '../../components/pages/PageShell'
import { ENGAGEMENT_CATEGORIES } from '../../lib/engagement-constants'

// Hardcoded CATEGORIES removed — subcategory chips are now derived dynamically
// from the actual achievement data (see dynamicCategories useMemo below)

// Type filters
const TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'badge', label: 'Badges' },
  { id: 'emblem', label: 'Emblems' },
  { id: 'calling_card', label: 'Calling Cards' },
]

// Rarity order for sorting
const RARITY_ORDER = ['legendary', 'epic', 'rare', 'uncommon', 'common']

export function AchievementsCatalogPage({
  playerId,
  showToast,
  playerName = 'Player',
  isAdminPreview = false,
}) {
  const { organization } = useAuth()
  const { colors, isDark } = useTheme()
  const { selectedSeason } = useSeason()

  // State
  const [achievements, setAchievements] = useState([])
  const [playerAchievements, setPlayerAchievements] = useState([])
  const [playerStats, setPlayerStats] = useState(null)
  const [trackedIds, setTrackedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [showEarnedOnly, setShowEarnedOnly] = useState(false)
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [engagementFilter, setEngagementFilter] = useState(null)

  // Modal
  const [selectedAchievement, setSelectedAchievement] = useState(null)

  // Load data
  useEffect(() => {
    // Load achievements even without playerId (just won't show earned status)
    loadData()
  }, [playerId, selectedSeason?.id])

  async function loadData() {
    setLoading(true)
    setError(null)

    console.log('AchievementsCatalogPage: Loading data...', { playerId, seasonId: selectedSeason?.id })

    try {
      // Load all achievements (always - this is the catalog)
      const { data: allAchievements, error: achErr } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      console.log('AchievementsCatalogPage: Achievements loaded:', { count: allAchievements?.length, error: achErr })

      if (achErr) throw achErr
      setAchievements(allAchievements || [])

      // If no playerId, we can still show the catalog (just no earned/progress data)
      if (!playerId) {
        console.log('AchievementsCatalogPage: No playerId, showing catalog only')
        setLoading(false)
        return
      }

      // Load player's earned achievements
      const { data: earned, error: earnedErr } = await supabase
        .from('player_achievements')
        .select('*, achievement:achievements(*)')
        .eq('player_id', playerId)

      if (earnedErr) throw earnedErr
      setPlayerAchievements(earned || [])

      // Load player's tracked achievements
      const { data: tracked, error: trackedErr } = await supabase
        .from('player_tracked_achievements')
        .select('achievement_id')
        .eq('player_id', playerId)

      if (trackedErr) throw trackedErr
      setTrackedIds(new Set(tracked?.map(t => t.achievement_id) || []))

      // Load player's current season stats (for progress calculation)
      if (selectedSeason?.id) {
        const { data: stats, error: statsErr } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', playerId)
          .eq('season_id', selectedSeason.id)
          .maybeSingle()

        if (!statsErr) {
          setPlayerStats(stats)
        }
      }

    } catch (err) {
      console.error('AchievementsCatalogPage: Error loading achievements:', err)
      setError(err.message)
      showToast?.('Failed to load achievements: ' + err.message, 'error')
    }

    setLoading(false)
  }

  // Calculate progress for each achievement
  const achievementsWithProgress = useMemo(() => {
    const earnedMap = new Map(
      playerAchievements.map(pa => [pa.achievement_id, pa])
    )

    return achievements.map(achievement => {
      const earnedData = earnedMap.get(achievement.id)
      const isEarned = !!earnedData

      let currentValue = 0
      let progress = 0

      if (achievement.stat_key && playerStats) {
        currentValue = playerStats[achievement.stat_key] || 0
        progress = achievement.threshold
          ? Math.min((currentValue / achievement.threshold) * 100, 100)
          : 0
      }

      return {
        ...achievement,
        isEarned,
        earnedData,
        currentValue,
        progress,
        isTracked: trackedIds.has(achievement.id),
      }
    })
  }, [achievements, playerAchievements, playerStats, trackedIds])

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return achievementsWithProgress.filter(a => {
      // V2 engagement category
      if (engagementFilter && a.engagement_category !== engagementFilter) return false

      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = a.name.toLowerCase().includes(query)
        const matchesDesc = a.description?.toLowerCase().includes(query)
        const matchesHowTo = a.how_to_earn.toLowerCase().includes(query)
        if (!matchesName && !matchesDesc && !matchesHowTo) return false
      }

      // Category
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false

      // Type
      if (selectedType !== 'all' && a.type !== selectedType) return false

      // Earned only
      if (showEarnedOnly && !a.isEarned) return false

      // Unlocked only (has progress)
      if (showUnlockedOnly && !a.isEarned && a.progress === 0) return false

      return true
    })
  }, [achievementsWithProgress, searchQuery, selectedCategory, selectedType, showEarnedOnly, showUnlockedOnly, engagementFilter])

  // Group by category for display
  const groupedAchievements = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredAchievements }
    }

    const groups = {}
    filteredAchievements.forEach(a => {
      if (!groups[a.category]) groups[a.category] = []
      groups[a.category].push(a)
    })

    // Sort each group: earned first, then by rarity, then by display_order
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => {
        // Earned first
        if (a.isEarned !== b.isEarned) return a.isEarned ? -1 : 1
        // Then by rarity (legendary first)
        const rarityDiff = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
        if (rarityDiff !== 0) return rarityDiff
        // Then by display order
        return a.display_order - b.display_order
      })
    })

    return groups
  }, [filteredAchievements, selectedCategory])

  // Stats summary
  const stats = useMemo(() => {
    const total = achievements.length
    const earned = playerAchievements.length
    const inProgress = achievementsWithProgress.filter(a => !a.isEarned && a.progress > 0).length
    return { total, earned, inProgress }
  }, [achievements, playerAchievements, achievementsWithProgress])

  // Dynamic subcategory list — scoped to active engagement category
  const dynamicCategories = useMemo(() => {
    const source = engagementFilter
      ? achievements.filter(a => a.engagement_category === engagementFilter)
      : achievements
    return [...new Set(source.map(a => a.category).filter(Boolean))].sort()
  }, [achievements, engagementFilter])

  // Reset subcategory when engagement filter changes (selected may no longer exist)
  useEffect(() => {
    if (selectedCategory !== 'all' && !dynamicCategories.includes(selectedCategory)) {
      setSelectedCategory('all')
    }
  }, [dynamicCategories, selectedCategory])

  // Track/untrack handlers
  async function handleTrack(achievementId) {
    try {
      const { error } = await supabase
        .from('player_tracked_achievements')
        .insert({
          player_id: playerId,
          achievement_id: achievementId,
          display_order: trackedIds.size + 1,
        })

      if (error) throw error

      setTrackedIds(prev => new Set([...prev, achievementId]))
      showToast?.('Achievement tracked!', 'success')
    } catch (err) {
      console.error('Error tracking achievement:', err)
      showToast?.('Failed to track achievement', 'error')
    }
  }

  async function handleUntrack(achievementId) {
    try {
      const { error } = await supabase
        .from('player_tracked_achievements')
        .delete()
        .eq('player_id', playerId)
        .eq('achievement_id', achievementId)

      if (error) throw error

      setTrackedIds(prev => {
        const next = new Set(prev)
        next.delete(achievementId)
        return next
      })
      showToast?.('Achievement untracked', 'success')
    } catch (err) {
      console.error('Error untracking achievement:', err)
      showToast?.('Failed to untrack achievement', 'error')
    }
  }

  // Dynamic category order derived from actual data (sorted alphabetically)
  const categoryOrder = useMemo(() => {
    return Object.keys(groupedAchievements).sort()
  }, [groupedAchievements])

  // Stats summary pills for PageShell actions (kept simple)
  const statsPills = null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-3 border-lynx-sky rounded-full animate-spin"
               style={{ borderTopColor: '#EAB308' }} />
          <p className="mt-4 text-slate-400 text-r-sm">Loading achievements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 rounded-[14px] text-center ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <p className="text-red-400 text-r-sm">Error loading achievements: {error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-lynx-sky text-white rounded-lg text-r-sm font-medium"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <PageShell
      title={isAdminPreview ? `${playerName}'s Achievements` : 'Achievements'}
      breadcrumb="Engagement"
      subtitle="Unlock badges by completing milestones"
      actions={statsPills}
    >
      <div className="space-y-6">
        {/* Navy Hero Header */}
        <div className="bg-lynx-navy rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white italic" style={{ fontFamily: 'var(--v2-font)' }}>
                ACHIEVEMENTS
              </h2>
              <p className="text-sm text-white/50 mt-1">{stats.total} total badges across {dynamicCategories.length} categories</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-[#22C55E]/15 text-center">
                <span className="text-2xl font-black text-[#22C55E]">{stats.earned}</span>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#22C55E]/70">Earned</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#F59E0B]/15 text-center">
                <span className="text-2xl font-black text-[#F59E0B]">{stats.inProgress}</span>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B]/70">In Progress</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/[0.06] text-center">
                <span className="text-2xl font-black text-white/60">{stats.total - stats.earned - stats.inProgress}</span>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Locked</div>
              </div>
            </div>
          </div>
        </div>

        {/* V2 Engagement Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setEngagementFilter(null)}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              !engagementFilter
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC] border border-[#4BB9EC]/30'
                : `${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08]' : 'bg-[#F5F6F8] border border-[#E8ECF2] text-slate-500 hover:bg-[#E8ECF2]'}`
            }`}
          >
            All Badges
          </button>
          {Object.entries(ENGAGEMENT_CATEGORIES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setEngagementFilter(engagementFilter === key ? null : key)}
              className="px-3.5 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                border: `1.5px solid ${engagementFilter === key ? cfg.color : isDark ? 'rgba(255,255,255,0.08)' : '#E8ECF2'}`,
                background: engagementFilter === key ? cfg.color + '15' : isDark ? 'rgba(255,255,255,0.04)' : '#F5F6F8',
                color: engagementFilter === key ? cfg.color : isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Filters — V2 styled */}
        <div className={`p-4 rounded-[14px] ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600' : 'bg-white border-[#E8ECF2] text-[#10284C] placeholder-slate-400'}`}
              />
            </div>

            {/* Category pills — dynamic from data */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                    : `${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]' : 'bg-[#F5F6F8] border border-[#E8ECF2] text-[#10284C] hover:bg-[#E8ECF2]'}`
                }`}
              >
                All
              </button>
              {dynamicCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all capitalize ${
                    selectedCategory === cat
                      ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                      : `${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]' : 'bg-[#F5F6F8] border border-[#E8ECF2] text-[#10284C] hover:bg-[#E8ECF2]'}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Type dropdown — V2 */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'}`}
            >
              {TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>

            {/* Toggle filters — V2 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowEarnedOnly(!showEarnedOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showEarnedOnly
                    ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                    : `${isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-[#F5F6F8] border border-[#E8ECF2]'} text-slate-400`
                }`}
              >
                Earned Only
              </button>
              <button
                onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showUnlockedOnly
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                    : `${isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-[#F5F6F8] border border-[#E8ECF2]'} text-slate-400`
                }`}
              >
                In Progress
              </button>
            </div>
          </div>
        </div>

        {/* Achievement Grid by Category */}
        {filteredAchievements.length === 0 ? (
          <div className={`p-12 rounded-[14px] text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'}`}>
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <p className={`mt-4 text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>No achievements found</p>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {searchQuery ? 'Try a different search term' : 'Adjust your filters to see achievements'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categoryOrder.map(categoryId => {
              const categoryAchievements = groupedAchievements[categoryId]
              if (!categoryAchievements || categoryAchievements.length === 0) return null

              const earnedInCategory = categoryAchievements.filter(a => a.isEarned).length

              return (
                <div key={categoryId}>
                  {/* Category header */}
                  {selectedCategory === 'all' && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-[#4BB9EC]">{categoryId}</span>
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {earnedInCategory}/{categoryAchievements.length}
                      </span>
                      <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-[#E8ECF2]'}`} />
                    </div>
                  )}

                  {/* Achievements grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {categoryAchievements.map(achievement => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        isEarned={achievement.isEarned}
                        earnedData={achievement.earnedData}
                        currentValue={achievement.currentValue}
                        progress={achievement.progress}
                        onClick={() => setSelectedAchievement(achievement)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedAchievement && (
          <AchievementDetailModal
            achievement={selectedAchievement}
            isEarned={selectedAchievement.isEarned}
            earnedData={selectedAchievement.earnedData}
            currentValue={selectedAchievement.currentValue}
            progress={selectedAchievement.progress}
            isTracked={trackedIds.has(selectedAchievement.id)}
            playerId={playerId}
            onClose={() => setSelectedAchievement(null)}
            onTrack={() => handleTrack(selectedAchievement.id)}
            onUntrack={() => handleUntrack(selectedAchievement.id)}
          />
        )}
      </div>
    </PageShell>
  )
}

export default AchievementsCatalogPage
