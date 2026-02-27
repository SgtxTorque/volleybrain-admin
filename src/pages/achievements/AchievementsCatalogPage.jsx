import { useState, useEffect, useMemo } from 'react'
import { useThemeClasses, useTheme } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { Search, Filter, Trophy, Star, Target, Shield, Zap, Heart, ChevronDown } from '../../constants/icons'
import { AchievementCard, CallingCardPreview } from './AchievementCard'
import { AchievementDetailModal } from './AchievementDetailModal'

// Category configuration
const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏆' },
  { id: 'offensive', label: 'Offensive', icon: '⚔️', color: '#EF4444' },
  { id: 'defensive', label: 'Defensive', icon: '🛡️', color: '#3B82F6' },
  { id: 'playmaker', label: 'Playmaker', icon: '🎯', color: '#10B981' },
  { id: 'heart', label: 'Heart', icon: '💜', color: '#A855F7' },
  { id: 'elite', label: 'Elite', icon: '⭐', color: '#FFD700' },
]

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
  const tc = useThemeClasses()
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
  }, [achievementsWithProgress, searchQuery, selectedCategory, selectedType, showEarnedOnly, showUnlockedOnly])
  
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
  
  // Category order for display
  const categoryOrder = ['offensive', 'defensive', 'playmaker', 'heart', 'elite']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-3 rounded-full animate-spin" 
               style={{ borderColor: colors.border, borderTopColor: '#EAB308' }} />
          <p className={`mt-4 ${tc.textSecondary}`}>Loading achievements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl ${tc.cardBg} border ${tc.border} text-center`}>
        <p className="text-red-400">Error loading achievements: {error}</p>
        <button 
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${tc.text}`}>
            {isAdminPreview ? `${playerName}'s Achievements` : 'Achievements'}
          </h1>
          <p className={`mt-1 ${tc.textSecondary}`}>
            Unlock badges by completing milestones
          </p>
        </div>
        
        {/* Stats summary */}
        <div className="flex gap-4">
          <div className={`px-4 py-2 rounded-xl ${tc.cardBg} border ${tc.border} text-center`}>
            <p className={`text-2xl font-bold text-emerald-400`}>{stats.earned}</p>
            <p className={`text-xs ${tc.textMuted}`}>Earned</p>
          </div>
          <div className={`px-4 py-2 rounded-xl ${tc.cardBg} border ${tc.border} text-center`}>
            <p className={`text-2xl font-bold text-amber-400`}>{stats.inProgress}</p>
            <p className={`text-xs ${tc.textMuted}`}>In Progress</p>
          </div>
          <div className={`px-4 py-2 rounded-xl ${tc.cardBg} border ${tc.border} text-center`}>
            <p className={`text-2xl font-bold ${tc.text}`}>{stats.total}</p>
            <p className={`text-xs ${tc.textMuted}`}>Total</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border}`}>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-lg
                ${tc.inputBg} ${tc.text} border ${tc.border}
                focus:outline-none focus:border-[var(--accent-primary)]
                placeholder:${tc.textMuted}
              `}
            />
          </div>
          
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all flex items-center gap-1.5
                  ${selectedCategory === cat.id
                    ? 'bg-[var(--accent-primary)] text-white'
                    : `${tc.inputBg} ${tc.text} border ${tc.border} hover:border-[var(--accent-primary)]`
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
          
          {/* Type dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`
              px-3 py-2 rounded-lg text-sm
              ${tc.inputBg} ${tc.text} border ${tc.border}
              focus:outline-none focus:border-[var(--accent-primary)]
            `}
          >
            {TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          
          {/* Toggle filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEarnedOnly(!showEarnedOnly)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${showEarnedOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : `${tc.inputBg} ${tc.textSecondary} border ${tc.border}`
                }
              `}
            >
              Earned Only
            </button>
            <button
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${showUnlockedOnly
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : `${tc.inputBg} ${tc.textSecondary} border ${tc.border}`
                }
              `}
            >
              In Progress
            </button>
          </div>
        </div>
      </div>
      
      {/* Achievement Grid by Category */}
      {filteredAchievements.length === 0 ? (
        <div className={`p-12 rounded-xl ${tc.cardBg} border ${tc.border} text-center`}>
          <Trophy className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
          <p className={`mt-4 text-lg font-medium ${tc.text}`}>No achievements found</p>
          <p className={`mt-1 ${tc.textSecondary}`}>
            {searchQuery ? 'Try a different search term' : 'Adjust your filters to see achievements'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categoryOrder.map(categoryId => {
            const categoryAchievements = groupedAchievements[categoryId]
            if (!categoryAchievements || categoryAchievements.length === 0) return null
            
            const category = CATEGORIES.find(c => c.id === categoryId)
            const earnedInCategory = categoryAchievements.filter(a => a.isEarned).length
            
            return (
              <div key={categoryId}>
                {/* Category header */}
                {selectedCategory === 'all' && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{category?.icon}</span>
                    <h2 className={`text-lg font-bold ${tc.text}`}>{category?.label}</h2>
                    <span className={`text-sm ${tc.textMuted}`}>
                      {earnedInCategory}/{categoryAchievements.length}
                    </span>
                    <div className={`flex-1 h-px bg-gradient-to-r ${isDark ? 'from-zinc-700' : 'from-slate-200'} to-transparent`} />
                  </div>
                )}
                
                {/* Achievements grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
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
  )
}

export default AchievementsCatalogPage
