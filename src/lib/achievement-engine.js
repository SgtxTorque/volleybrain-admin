// =============================================================================
// Achievement Engine — Check & unlock achievements, XP, progress
// =============================================================================

import { supabase } from './supabase'
import { getLevelFromXP, XP_BY_RARITY } from './engagement-constants'

// =============================================================================
// Core: Check and unlock achievements after game stats
// =============================================================================

export async function checkAndUnlockAchievements(playerId, teamId, organizationId) {
  try {
    const allStats = await gatherAllStats(playerId, organizationId)

    // Get all active achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)

    if (!achievements || achievements.length === 0) return []

    // Get already earned
    const { data: earned } = await supabase
      .from('player_achievements')
      .select('achievement_id')
      .eq('player_id', playerId)

    const earnedSet = new Set((earned || []).map(e => e.achievement_id))
    const now = new Date().toISOString()
    const newUnlocks = []

    for (const ach of achievements) {
      if (earnedSet.has(ach.id)) continue
      if (ach.threshold == null || ach.threshold <= 0) continue
      if (!ach.stat_key) continue

      const currentValue = allStats[ach.stat_key] ?? 0
      if (currentValue >= ach.threshold) {
        newUnlocks.push({
          player_id: playerId,
          achievement_id: ach.id,
          earned_at: now,
          stat_value_at_unlock: currentValue,
        })
      }
    }

    if (newUnlocks.length > 0) {
      await supabase
        .from('player_achievements')
        .upsert(newUnlocks, { onConflict: 'player_id,achievement_id', ignoreDuplicates: true })

      // Award XP for each unlock
      for (const unlock of newUnlocks) {
        const ach = achievements.find(a => a.id === unlock.achievement_id)
        if (ach) {
          await awardAchievementXP(playerId, organizationId, ach)
        }
      }
    }

    // Update progress for all achievements
    const progressRows = achievements
      .filter(ach => ach.stat_key && ach.threshold)
      .map(ach => ({
        player_id: playerId,
        achievement_id: ach.id,
        current_value: allStats[ach.stat_key] ?? 0,
        target_value: ach.threshold ?? 0,
        last_updated_at: now,
      }))

    if (progressRows.length > 0) {
      await supabase
        .from('player_achievement_progress')
        .upsert(progressRows, { onConflict: 'player_id,achievement_id' })
    }

    return newUnlocks
  } catch (err) {
    console.error('[AchievementEngine] checkAndUnlockAchievements error:', err)
    return []
  }
}

// =============================================================================
// Gather all stats for a player
// =============================================================================

async function gatherAllStats(playerId, organizationId) {
  const stats = {}

  try {
    // Season stats from game_stats
    const { data: gameStats } = await supabase
      .from('game_stats')
      .select('*')
      .eq('player_id', playerId)

    if (gameStats) {
      const totals = {}
      for (const gs of gameStats) {
        for (const [key, val] of Object.entries(gs)) {
          if (typeof val === 'number' && key !== 'id' && key !== 'game_id') {
            totals[key] = (totals[key] || 0) + val
          }
        }
      }
      Object.assign(stats, totals)
      stats.games_played = gameStats.length
    }

    // Shoutout counts
    const { count: shoutoutsReceived } = await supabase
      .from('shoutouts')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', playerId)

    const { count: shoutoutsGiven } = await supabase
      .from('shoutouts')
      .select('id', { count: 'exact', head: true })
      .eq('giver_id', playerId)

    stats.shoutouts_received = shoutoutsReceived || 0
    stats.shoutouts_given = shoutoutsGiven || 0

    // Attendance
    const { count: attendance } = await supabase
      .from('event_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('status', 'yes')

    stats.total_attendance = attendance || 0
  } catch (err) {
    console.error('[AchievementEngine] gatherAllStats error:', err)
  }

  return stats
}

// =============================================================================
// Award XP when achievement unlocked
// =============================================================================

async function awardAchievementXP(playerId, organizationId, achievement) {
  const xpAmount = XP_BY_RARITY[achievement.rarity] || XP_BY_RARITY.common

  await supabase.from('xp_ledger').insert({
    player_id: playerId,
    organization_id: organizationId,
    xp_amount: xpAmount,
    source_type: 'achievement',
    source_id: achievement.id,
    description: `Unlocked "${achievement.name}" (+${xpAmount} XP)`,
  })

  // Update profile XP
  const { data: prof } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', playerId)
    .single()

  const currentXP = prof?.total_xp || 0
  const newXP = currentXP + xpAmount
  const { level } = getLevelFromXP(newXP)

  await supabase
    .from('profiles')
    .update({ total_xp: newXP, player_level: level })
    .eq('id', playerId)
}

// =============================================================================
// Get unseen achievements (for celebration modal)
// =============================================================================

export async function getUnseenAchievements(playerId) {
  try {
    // Get the last seen timestamp from localStorage
    const lastSeen = localStorage.getItem(`ach_seen_${playerId}`) || '1970-01-01T00:00:00Z'

    const { data } = await supabase
      .from('player_achievements')
      .select('*, achievements(*)')
      .eq('player_id', playerId)
      .gt('earned_at', lastSeen)
      .order('earned_at', { ascending: false })

    return (data || []).map(pa => ({
      ...pa,
      achievements: pa.achievements,
    }))
  } catch (err) {
    console.error('[AchievementEngine] getUnseenAchievements error:', err)
    return []
  }
}

export function markAchievementsSeen(playerId) {
  localStorage.setItem(`ach_seen_${playerId}`, new Date().toISOString())
}

// =============================================================================
// Get tracked progress for a player
// =============================================================================

export async function getTrackedProgress(playerId) {
  try {
    const { data } = await supabase
      .from('player_achievement_progress')
      .select('*, achievements(*)')
      .eq('player_id', playerId)
      .order('last_updated_at', { ascending: false })

    return data || []
  } catch (err) {
    console.error('[AchievementEngine] getTrackedProgress error:', err)
    return []
  }
}

// =============================================================================
// Fetch player XP and level
// =============================================================================

export async function fetchPlayerXP(playerId) {
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('total_xp, player_level')
      .eq('id', playerId)
      .single()

    const totalXp = prof?.total_xp || 0
    const levelData = getLevelFromXP(totalXp)

    return {
      totalXp,
      ...levelData,
    }
  } catch (err) {
    console.error('[AchievementEngine] fetchPlayerXP error:', err)
    return { totalXp: 0, level: 1, currentXp: 0, nextLevelXp: 100, progress: 0 }
  }
}

// =============================================================================
// Get progress nudges (achievements at 80%+ completion)
// =============================================================================

export async function getProgressNudges(playerId, allStats) {
  try {
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)

    if (!achievements) return []

    const { data: earned } = await supabase
      .from('player_achievements')
      .select('achievement_id')
      .eq('player_id', playerId)

    const earnedSet = new Set((earned || []).map(e => e.achievement_id))
    const nudges = []

    for (const ach of achievements) {
      if (earnedSet.has(ach.id)) continue
      if (ach.threshold == null || ach.threshold <= 0) continue
      if (!ach.stat_key) continue

      const current = allStats[ach.stat_key] ?? 0
      const pct = (current / ach.threshold) * 100

      if (pct >= 80 && pct < 100) {
        nudges.push({
          achievementId: ach.id,
          achievementName: ach.name,
          achievementIcon: ach.icon,
          currentValue: current,
          targetValue: ach.threshold,
          pct: Math.round(pct),
        })
      }
    }

    return nudges.sort((a, b) => b.pct - a.pct)
  } catch (err) {
    console.error('[AchievementEngine] getProgressNudges error:', err)
    return []
  }
}
