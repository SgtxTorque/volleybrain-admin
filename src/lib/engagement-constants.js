// =============================================================================
// Engagement System — Constants
// =============================================================================

/** V2 XP level thresholds — 30 levels, exponential curve
 *  xpRequired = XP needed for THIS level (delta)
 *  cumulative = total XP to reach this level
 *  See: LYNX-ENGAGEMENT-SYSTEM-V2.md Section 3.3 */
export const XP_LEVELS = [
  { level: 1,  xpRequired: 0,     cumulative: 0,      tier: 'Rookie' },
  { level: 2,  xpRequired: 100,   cumulative: 100,    tier: 'Rookie' },
  { level: 3,  xpRequired: 150,   cumulative: 250,    tier: 'Rookie' },
  { level: 4,  xpRequired: 200,   cumulative: 450,    tier: 'Rookie' },
  { level: 5,  xpRequired: 250,   cumulative: 700,    tier: 'Bronze' },
  { level: 6,  xpRequired: 300,   cumulative: 1000,   tier: 'Bronze' },
  { level: 7,  xpRequired: 400,   cumulative: 1400,   tier: 'Bronze' },
  { level: 8,  xpRequired: 500,   cumulative: 1900,   tier: 'Bronze' },
  { level: 9,  xpRequired: 600,   cumulative: 2500,   tier: 'Silver' },
  { level: 10, xpRequired: 700,   cumulative: 3200,   tier: 'Silver' },
  { level: 11, xpRequired: 800,   cumulative: 4000,   tier: 'Silver' },
  { level: 12, xpRequired: 900,   cumulative: 4900,   tier: 'Silver' },
  { level: 13, xpRequired: 1100,  cumulative: 6000,   tier: 'Gold' },
  { level: 14, xpRequired: 1300,  cumulative: 7300,   tier: 'Gold' },
  { level: 15, xpRequired: 1500,  cumulative: 8800,   tier: 'Gold' },
  { level: 16, xpRequired: 1700,  cumulative: 10500,  tier: 'Gold' },
  { level: 17, xpRequired: 2000,  cumulative: 12500,  tier: 'Platinum' },
  { level: 18, xpRequired: 2300,  cumulative: 14800,  tier: 'Platinum' },
  { level: 19, xpRequired: 2700,  cumulative: 17500,  tier: 'Platinum' },
  { level: 20, xpRequired: 3000,  cumulative: 20500,  tier: 'Platinum' },
  { level: 21, xpRequired: 3500,  cumulative: 24000,  tier: 'Diamond' },
  { level: 22, xpRequired: 4000,  cumulative: 28000,  tier: 'Diamond' },
  { level: 23, xpRequired: 4500,  cumulative: 32500,  tier: 'Diamond' },
  { level: 24, xpRequired: 5000,  cumulative: 37500,  tier: 'Diamond' },
  { level: 25, xpRequired: 5500,  cumulative: 43000,  tier: 'Legend' },
  { level: 26, xpRequired: 6000,  cumulative: 49000,  tier: 'Legend' },
  { level: 27, xpRequired: 7000,  cumulative: 56000,  tier: 'Legend' },
  { level: 28, xpRequired: 8000,  cumulative: 64000,  tier: 'Legend' },
  { level: 29, xpRequired: 9000,  cumulative: 73000,  tier: 'Legend' },
  { level: 30, xpRequired: 10000, cumulative: 83000,  tier: 'Legend' },
]

export const MAX_LEVEL = 30

/** XP awarded by rarity tier */
export const XP_BY_RARITY = {
  common: 25,
  uncommon: 50,
  rare: 100,
  epic: 200,
  legendary: 500,
}

/** XP awarded for engagement actions */
export const XP_BY_SOURCE = {
  shoutout_given: 10,
  shoutout_received: 15,
  challenge_completed: 50,
  challenge_won: 100,
  game_played: 10,
  practice_attended: 5,
}

/** V2 level tier visual config — 7 tiers */
export const LEVEL_TIERS = [
  { min: 1,  max: 4,  name: 'Rookie',   color: '#94A3B8', bgColor: '#94A3B820' },
  { min: 5,  max: 8,  name: 'Bronze',   color: '#CD7F32', bgColor: '#CD7F3220' },
  { min: 9,  max: 12, name: 'Silver',   color: '#C0C0C0', bgColor: '#C0C0C020' },
  { min: 13, max: 16, name: 'Gold',     color: '#FFD700', bgColor: '#FFD70020' },
  { min: 17, max: 20, name: 'Platinum', color: '#E5E4E2', bgColor: '#E5E4E220' },
  { min: 21, max: 24, name: 'Diamond',  color: '#B9F2FF', bgColor: '#B9F2FF20' },
  { min: 25, max: 30, name: 'Legend',   color: '#FF6B35', bgColor: '#FF6B3520' },
]

/** Rarity display config for achievements */
export const RARITY_CONFIG = {
  common: { bg: '#94A3B820', text: '#94A3B8', label: 'Common', glowColor: '#94A3B8' },
  uncommon: { bg: '#10B98120', text: '#10B981', label: 'Uncommon', glowColor: '#10B981' },
  rare: { bg: '#3B82F620', text: '#3B82F6', label: 'Rare', glowColor: '#3B82F6' },
  epic: { bg: '#A855F720', text: '#A855F7', label: 'Epic', glowColor: '#A855F7' },
  legendary: { bg: '#F59E0B20', text: '#F59E0B', label: 'Legendary', glowColor: '#F59E0B' },
}

/** Calculate level info from total XP — V2 SINGLE SOURCE OF TRUTH
 *  Returns superset shape matching mobile: { level, currentXp, nextLevelXp, progress, tier, xpToNext } */
export function getLevelFromXP(totalXp) {
  let currentLevel = 1
  for (const entry of XP_LEVELS) {
    if (totalXp >= entry.cumulative) {
      currentLevel = entry.level
    } else {
      break
    }
  }

  const currentEntry = XP_LEVELS[currentLevel - 1]
  const nextEntry = currentLevel < MAX_LEVEL ? XP_LEVELS[currentLevel] : null
  const nextCumulative = nextEntry ? nextEntry.cumulative : currentEntry.cumulative
  const xpIntoLevel = totalXp - currentEntry.cumulative
  const xpNeeded = nextCumulative - currentEntry.cumulative
  const progress = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100

  return {
    level: currentLevel,
    currentXp: totalXp,
    nextLevelXp: nextCumulative,
    progress,
    tier: currentEntry.tier,
    xpToNext: nextEntry ? nextEntry.cumulative - totalXp : 0,
  }
}

/** Get tier config for a given level */
export function getLevelTier(level) {
  return LEVEL_TIERS.find(t => level >= t.min && level <= t.max) || LEVEL_TIERS[0]
}

/** Check if adding XP causes a level-up */
export function checkLevelUp(oldXp, newXp) {
  const oldLevel = getLevelFromXP(oldXp).level
  const newLevel = getLevelFromXP(newXp).level
  return { leveledUp: newLevel > oldLevel, oldLevel, newLevel }
}

/** Default shoutout categories (mirrors SQL seed, for use in app before DB fetch) */
export const DEFAULT_SHOUTOUT_CATEGORIES = [
  { name: 'Great Effort', emoji: '💪', color: '#E74C3C', description: 'Gave 100% effort' },
  { name: 'Leadership', emoji: '👑', color: '#F39C12', description: 'Showed leadership on and off the court' },
  { name: 'Most Improved', emoji: '📈', color: '#27AE60', description: 'Noticeably leveling up their game' },
  { name: 'Team Player', emoji: '🤝', color: '#3498DB', description: 'Puts the team first' },
  { name: 'Clutch Player', emoji: '🎯', color: '#9B59B6', description: 'Performs under pressure' },
  { name: 'Hardest Worker', emoji: '🔥', color: '#E67E22', description: 'Outworks everyone' },
  { name: 'Great Communication', emoji: '📣', color: '#1ABC9C', description: 'Calls the ball, talks on the court' },
  { name: 'Positive Attitude', emoji: '☀️', color: '#F1C40F', description: 'Always uplifting, never negative' },
  { name: 'Sportsmanship', emoji: '🏅', color: '#2ECC71', description: 'Respects opponents, refs, teammates' },
  { name: 'Coachable', emoji: '🧠', color: '#8E44AD', description: 'Listens, applies feedback, grows' },
]

/** Achievement categories with icons and colors */
export const ACHIEVEMENT_CATEGORIES = {
  Offensive: { label: 'Offensive', icon: 'Zap', color: '#FF3B3B' },
  Defensive: { label: 'Defensive', icon: 'Shield', color: '#3B82F6' },
  Playmaker: { label: 'Playmaker', icon: 'Users', color: '#10B981' },
  Heart: { label: 'Heart', icon: 'Heart', color: '#EC4899' },
  Community: { label: 'Community', icon: 'Megaphone', color: '#F59E0B' },
  Elite: { label: 'Elite', icon: 'Diamond', color: '#FFD700' },
}

/** Stat options for challenge creation */
export const STAT_OPTIONS = [
  { key: 'total_kills', label: 'Kills' },
  { key: 'total_aces', label: 'Aces' },
  { key: 'total_digs', label: 'Digs' },
  { key: 'total_assists', label: 'Assists' },
  { key: 'total_blocks', label: 'Blocks' },
  { key: 'total_serves', label: 'Serves' },
  { key: 'total_service_points', label: 'Service Points' },
]
