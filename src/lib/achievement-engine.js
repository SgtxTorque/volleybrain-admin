// =============================================================================
// Achievement Engine — Progress, Unseen Detection, XP Awards (Web)
// =============================================================================

import { supabase } from './supabase'
import { getLevelFromXP } from './engagement-constants'

// =============================================================================
// Fetch unseen achievements (simpler web version using localStorage)
// =============================================================================

const LAST_SEEN_KEY = 'vb_achievement_last_seen_'

export async function getUnseenAchievements(playerId) {
  try {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY + playerId) || '1970-01-01T00:00:00Z'

    const { data } = await supabase
      .from('player_achievements')
      .select('*, achievements(*)')
      .eq('player_id', playerId)
      .gt('earned_at', lastSeen)
      .order('earned_at', { ascending: true })

    if (!data || data.length === 0) return []

    return data.map((d) => ({
      ...d,
      achievements: d.achievements,
    }))
  } catch (err) {
    console.error('getUnseenAchievements error:', err)
    return []
  }
}

export function markAchievementsSeen(playerId) {
  localStorage.setItem(LAST_SEEN_KEY + playerId, new Date().toISOString())
}

// =============================================================================
// Fetch player XP and level
// =============================================================================

export async function fetchPlayerXP(playerId) {
  try {
    // Try profiles.id directly first
    const { data } = await supabase
      .from('profiles')
      .select('total_xp, player_level')
      .eq('id', playerId)
      .single()

    if (data) {
      const totalXp = data.total_xp || 0
      const levelInfo = getLevelFromXP(totalXp)
      return {
        totalXp,
        level: levelInfo.level,
        progress: levelInfo.progress,
        nextLevelXp: levelInfo.nextLevelXp,
      }
    }

    // If not a profile, try resolving from players table
    const { data: player } = await supabase
      .from('players')
      .select('parent_account_id')
      .eq('id', playerId)
      .maybeSingle()

    if (player?.parent_account_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('total_xp, player_level')
        .eq('id', player.parent_account_id)
        .single()

      if (prof) {
        const totalXp = prof.total_xp || 0
        const levelInfo = getLevelFromXP(totalXp)
        return {
          totalXp,
          level: levelInfo.level,
          progress: levelInfo.progress,
          nextLevelXp: levelInfo.nextLevelXp,
        }
      }
    }

    return { totalXp: 0, level: 1, progress: 0, nextLevelXp: 100 }
  } catch {
    return { totalXp: 0, level: 1, progress: 0, nextLevelXp: 100 }
  }
}

// =============================================================================
// Fetch achievements for a player with earned status
// =============================================================================

export async function fetchPlayerAchievements(playerId) {
  try {
    const [{ data: achievements }, { data: earned }] = await Promise.all([
      supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('player_achievements')
        .select('achievement_id, earned_at, stat_value_at_unlock')
        .eq('player_id', playerId),
    ])

    if (!achievements) return []

    const earnedMap = {}
    for (const e of earned || []) {
      earnedMap[e.achievement_id] = {
        earned_at: e.earned_at,
        stat_value_at_unlock: e.stat_value_at_unlock,
      }
    }

    return achievements.map((a) => ({
      ...a,
      earned: !!earnedMap[a.id],
      earned_at: earnedMap[a.id]?.earned_at || null,
      stat_value_at_unlock: earnedMap[a.id]?.stat_value_at_unlock || null,
    }))
  } catch (err) {
    console.error('fetchPlayerAchievements error:', err)
    return []
  }
}

// =============================================================================
// Fetch achievement progress
// =============================================================================

export async function fetchAchievementProgress(playerId) {
  try {
    const { data } = await supabase
      .from('player_achievement_progress')
      .select('*, achievements(*)')
      .eq('player_id', playerId)

    if (!data) return []

    return data.map((d) => ({
      achievement_id: d.achievement_id,
      current_value: d.current_value || 0,
      target_value: d.target_value || 1,
      pct: d.target_value > 0 ? Math.min((d.current_value / d.target_value) * 100, 100) : 0,
      achievement: d.achievements,
    }))
  } catch (err) {
    console.error('fetchAchievementProgress error:', err)
    return []
  }
}
