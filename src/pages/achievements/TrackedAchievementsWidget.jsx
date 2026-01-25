import { useState, useEffect } from 'react'
import { useThemeClasses, useTheme } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { Target, ChevronRight, Star, Trophy } from '../../constants/icons'
import { AchievementCard } from './AchievementCard'

/**
 * TrackedAchievementsWidget
 * Shows 3-5 achievements the player is tracking on their dashboard
 * Displays progress bars and allows quick access to full catalog
 */
export function TrackedAchievementsWidget({ 
  playerId, 
  onViewAll,
  maxItems = 3,
}) {
  const tc = useThemeClasses()
  const { colors } = useTheme()
  const { selectedSeason } = useSeason()
  
  const [trackedAchievements, setTrackedAchievements] = useState([])
  const [playerStats, setPlayerStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (playerId) {
      loadTrackedAchievements()
    }
  }, [playerId, selectedSeason?.id])
  
  async function loadTrackedAchievements() {
    setLoading(true)
    try {
      // Load tracked achievements with full achievement data
      const { data: tracked, error: trackedErr } = await supabase
        .from('player_tracked_achievements')
        .select('*, achievement:achievements(*)')
        .eq('player_id', playerId)
        .order('display_order', { ascending: true })
        .limit(maxItems)
      
      if (trackedErr) throw trackedErr
      
      // Load player's current season stats
      if (selectedSeason?.id) {
        const { data: stats } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', playerId)
          .eq('season_id', selectedSeason.id)
          .maybeSingle()
        
        setPlayerStats(stats)
      }
      
      setTrackedAchievements(tracked || [])
    } catch (err) {
      console.error('Error loading tracked achievements:', err)
    }
    setLoading(false)
  }
  
  // Calculate progress for each tracked achievement
  const achievementsWithProgress = trackedAchievements.map(t => {
    const achievement = t.achievement
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
      currentValue,
      progress,
    }
  })
  
  if (loading) {
    return (
      <div className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-zinc-700 rounded w-1/3" />
          <div className="h-16 bg-zinc-700/50 rounded" />
          <div className="h-16 bg-zinc-700/50 rounded" />
        </div>
      </div>
    )
  }
  
  if (trackedAchievements.length === 0) {
    return (
      <div className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className={`font-semibold ${tc.text}`}>Tracking</h3>
          </div>
        </div>
        
        <div className="text-center py-6">
          <Star className={`w-8 h-8 mx-auto ${tc.textMuted}`} />
          <p className={`mt-2 text-sm ${tc.textSecondary}`}>
            No achievements tracked
          </p>
          <button
            onClick={onViewAll}
            className="mt-3 text-sm text-[var(--accent-primary)] hover:underline"
          >
            Browse achievements →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className={`font-semibold ${tc.text}`}>Tracking</h3>
        </div>
        <button
          onClick={onViewAll}
          className={`text-xs ${tc.textSecondary} hover:text-[var(--accent-primary)] flex items-center gap-1`}
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Tracked achievements list */}
      <div className="space-y-3">
        {achievementsWithProgress.map(achievement => (
          <TrackedAchievementItem
            key={achievement.id}
            achievement={achievement}
            onClick={onViewAll}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * TrackedAchievementItem
 * Single tracked achievement with progress bar
 */
function TrackedAchievementItem({ achievement, onClick }) {
  const tc = useThemeClasses()
  
  const remaining = achievement.threshold 
    ? achievement.threshold - achievement.currentValue 
    : null
  
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg cursor-pointer transition-all
        ${tc.inputBg} border ${tc.border}
        hover:border-[var(--accent-primary)]/50
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(145deg, ${achievement.color_primary}30 0%, ${achievement.color_secondary}50 100%)`,
            border: `1px solid ${achievement.color_primary}50`,
          }}
        >
          <span className="text-xl">{achievement.icon}</span>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${tc.text} truncate`}>
            {achievement.name}
          </p>
          
          {achievement.threshold ? (
            <div className="mt-1.5">
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${achievement.progress}%`,
                      background: `linear-gradient(90deg, ${achievement.color_primary} 0%, ${achievement.color_secondary} 100%)`,
                    }}
                  />
                </div>
                <span className={`text-xs font-mono ${tc.textMuted}`}>
                  {achievement.currentValue}/{achievement.threshold}
                </span>
              </div>
            </div>
          ) : (
            <p className={`text-xs ${tc.textMuted} mt-1`}>
              Special Achievement
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * RecentAchievementsWidget
 * Shows recently earned achievements (for celebration/discovery)
 */
export function RecentAchievementsWidget({ 
  playerId, 
  onViewAll,
  maxItems = 4,
}) {
  const tc = useThemeClasses()
  const [recentAchievements, setRecentAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (playerId) {
      loadRecentAchievements()
    }
  }, [playerId])
  
  async function loadRecentAchievements() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('player_achievements')
        .select('*, achievement:achievements(*)')
        .eq('player_id', playerId)
        .order('earned_at', { ascending: false })
        .limit(maxItems)
      
      if (error) throw error
      setRecentAchievements(data || [])
    } catch (err) {
      console.error('Error loading recent achievements:', err)
    }
    setLoading(false)
  }
  
  if (loading) {
    return (
      <div className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-zinc-700 rounded w-1/3" />
          <div className="flex gap-2">
            <div className="w-16 h-20 bg-zinc-700/50 rounded" />
            <div className="w-16 h-20 bg-zinc-700/50 rounded" />
            <div className="w-16 h-20 bg-zinc-700/50 rounded" />
          </div>
        </div>
      </div>
    )
  }
  
  if (recentAchievements.length === 0) {
    return (
      <div className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className={`font-semibold ${tc.text}`}>Achievements</h3>
          </div>
        </div>
        
        <div className="text-center py-4">
          <p className={`text-sm ${tc.textSecondary}`}>
            No achievements yet
          </p>
          <button
            onClick={onViewAll}
            className="mt-2 text-sm text-[var(--accent-primary)] hover:underline"
          >
            View all achievements →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-xl ${tc.cardBg} border ${tc.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className={`font-semibold ${tc.text}`}>Achievements</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400`}>
            {recentAchievements.length} earned
          </span>
        </div>
        <button
          onClick={onViewAll}
          className={`text-xs ${tc.textSecondary} hover:text-[var(--accent-primary)] flex items-center gap-1`}
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Achievement cards */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {recentAchievements.map(pa => (
          <AchievementCard
            key={pa.id}
            achievement={pa.achievement}
            isEarned={true}
            earnedData={pa}
            size="compact"
            onClick={onViewAll}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * AchievementsSummaryBar
 * Compact summary for headers/profiles
 */
export function AchievementsSummaryBar({ playerId, onClick }) {
  const tc = useThemeClasses()
  const [stats, setStats] = useState({ earned: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (playerId) {
      loadStats()
    }
  }, [playerId])
  
  async function loadStats() {
    try {
      // Get total achievements
      const { count: total } = await supabase
        .from('achievements')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      // Get player's earned count
      const { count: earned } = await supabase
        .from('player_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', playerId)
      
      setStats({ earned: earned || 0, total: total || 0 })
    } catch (err) {
      console.error('Error loading achievement stats:', err)
    }
    setLoading(false)
  }
  
  const percentage = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${tc.inputBg} border ${tc.border}
        hover:border-[var(--accent-primary)]/50 transition-all
      `}
    >
      <Trophy className="w-4 h-4 text-amber-400" />
      <span className={`text-sm font-medium ${tc.text}`}>
        {loading ? '...' : `${stats.earned}/${stats.total}`}
      </span>
      <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  )
}

export default TrackedAchievementsWidget
