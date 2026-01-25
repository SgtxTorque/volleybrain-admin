// ═══════════════════════════════════════════════════════════════════════════════
// ChildAchievementsWidget.jsx
// Location: src/components/widgets/parent/ChildAchievementsWidget.jsx
// 
// This widget shows achievements for parent's children in the ParentDashboard
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useThemeClasses } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import { Trophy, ChevronRight, Star } from '../../../constants/icons'

export default function ChildAchievementsWidget({ children, onViewAchievements }) {
  const tc = useThemeClasses()
  const [achievementData, setAchievementData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (children?.length > 0) {
      loadChildAchievements()
    } else {
      setLoading(false)
    }
  }, [children])
  
  async function loadChildAchievements() {
    setLoading(true)
    try {
      const playerIds = children.map(c => c.id)
      
      // Get recent achievements for all children
      const { data: achievements, error } = await supabase
        .from('player_achievements')
        .select(`
          *,
          achievement:achievements(id, name, icon, rarity, color_primary)
        `)
        .in('player_id', playerIds)
        .order('earned_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      // Group achievements by player
      const grouped = {}
      children.forEach(child => {
        grouped[child.id] = {
          player: child,
          achievements: [],
          totalCount: 0
        }
      })
      
      // Count total achievements per player
      const { data: counts } = await supabase
        .from('player_achievements')
        .select('player_id')
        .in('player_id', playerIds)
      
      if (counts) {
        counts.forEach(c => {
          if (grouped[c.player_id]) {
            grouped[c.player_id].totalCount++
          }
        })
      }
      
      // Add recent achievements to each player
      achievements?.forEach(a => {
        if (grouped[a.player_id]) {
          grouped[a.player_id].achievements.push(a)
        }
      })
      
      setAchievementData(Object.values(grouped))
    } catch (err) {
      console.error('Error loading child achievements:', err)
    }
    setLoading(false)
  }
  
  if (loading) {
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-zinc-700 rounded w-1/3" />
          <div className="h-20 bg-zinc-700/50 rounded" />
        </div>
      </div>
    )
  }
  
  if (!children || children.length === 0) {
    return null
  }
  
  // Check if any child has achievements
  const hasAnyAchievements = achievementData.some(d => d.totalCount > 0)

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className={`font-semibold ${tc.text}`}>Achievements</h3>
        </div>
        <button
          onClick={onViewAchievements}
          className="text-sm text-[var(--accent-primary)] hover:underline flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {hasAnyAchievements ? (
          <div className="space-y-4">
            {achievementData.map(({ player, achievements, totalCount }) => (
              <div key={player.id} className={`${tc.cardBgAlt} rounded-xl p-3`}>
                {/* Player header */}
                <div className="flex items-center gap-3 mb-3">
                  {player.photo_url ? (
                    <img 
                      src={player.photo_url} 
                      alt={player.first_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                      {player.first_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${tc.text}`}>{player.first_name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{totalCount} achievement{totalCount !== 1 ? 's' : ''}</p>
                  </div>
                  {totalCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">{totalCount}</span>
                    </div>
                  )}
                </div>
                
                {/* Recent badges */}
                {achievements.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {achievements.slice(0, 5).map(a => (
                      <div 
                        key={a.id}
                        className="flex-shrink-0 w-12 h-14 rounded-lg flex flex-col items-center justify-center"
                        style={{
                          background: `linear-gradient(145deg, ${a.achievement?.color_primary}30 0%, ${a.achievement?.color_primary}50 100%)`,
                          border: `1px solid ${a.achievement?.color_primary}60`,
                        }}
                        title={a.achievement?.name}
                      >
                        <span className="text-lg">{a.achievement?.icon}</span>
                        <div 
                          className="w-1.5 h-1.5 rounded-full mt-1"
                          style={{
                            background: a.achievement?.rarity === 'legendary' ? '#FFD700' :
                                       a.achievement?.rarity === 'epic' ? '#A855F7' :
                                       a.achievement?.rarity === 'rare' ? '#3B82F6' :
                                       a.achievement?.rarity === 'uncommon' ? '#10B981' :
                                       '#71717a'
                          }}
                        />
                      </div>
                    ))}
                    {totalCount > 5 && (
                      <div 
                        className={`flex-shrink-0 w-12 h-14 rounded-lg flex items-center justify-center ${tc.cardBg} border ${tc.border}`}
                      >
                        <span className={`text-xs font-bold ${tc.textMuted}`}>+{totalCount - 5}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={`text-xs ${tc.textMuted}`}>No achievements yet - keep playing!</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Trophy className={`w-10 h-10 mx-auto ${tc.textMuted} mb-2`} />
            <p className={`text-sm ${tc.textMuted}`}>No achievements earned yet</p>
            <p className={`text-xs ${tc.textMuted} mt-1`}>
              Achievements are unlocked by hitting stat milestones
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
