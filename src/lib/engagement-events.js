// =============================================================================
// Engagement Events — Auto-post to team wall, progress nudges
// =============================================================================

import { supabase } from './supabase'
import { getLevelTier } from './engagement-constants'

// =============================================================================
// Auto-post: Achievement Unlock → Team Wall
// =============================================================================

export async function postAchievementUnlockToWall({ playerId, playerName, teamId, achievement }) {
  const displayText = `${playerName} just earned the ${achievement.icon || '🏆'} ${achievement.name} badge!`
  const metadata = JSON.stringify({
    type: 'achievement_unlock',
    playerId,
    playerName,
    achievementName: achievement.name,
    achievementIcon: achievement.icon,
    achievementRarity: achievement.rarity,
    achievementCategory: achievement.category,
  })

  const { error } = await supabase.from('team_posts').insert({
    team_id: teamId,
    author_id: playerId,
    post_type: 'milestone',
    title: metadata,
    content: displayText,
    is_pinned: false,
    is_published: true,
  })

  if (error) console.error('[EngagementEvents] achievement post error:', error)
}

// =============================================================================
// Auto-post: Level Up → Team Wall
// =============================================================================

export async function postLevelUpToWall({ playerId, playerName, teamId, newLevel, totalXp }) {
  const tier = getLevelTier(newLevel)

  const displayText = `${playerName} reached Level ${newLevel}! ${tier.name} tier`
  const metadata = JSON.stringify({
    type: 'level_up',
    playerId,
    playerName,
    newLevel,
    totalXp,
    tierName: tier.name,
    tierColor: tier.color,
  })

  const { error } = await supabase.from('team_posts').insert({
    team_id: teamId,
    author_id: playerId,
    post_type: 'milestone',
    title: metadata,
    content: displayText,
    is_pinned: false,
    is_published: true,
  })

  if (error) console.error('[EngagementEvents] level-up post error:', error)
}
