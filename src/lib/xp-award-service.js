/**
 * xp-award-service.js — Centralized XP Award Service (Web)
 * Mirrors mobile lib/xp-award-service.ts
 */

import { supabase } from './supabase'
import { getLevelFromXP } from './engagement-constants'

/**
 * Award XP to a profile. Handles:
 * - Season rank multiplier lookup
 * - xp_ledger insert with season_id
 * - profiles update (total_xp, player_level, tier, xp_to_next_level)
 * - season_ranks.season_xp increment
 */
export async function awardXP({
  profileId,
  baseAmount,
  sourceType,
  sourceId = null,
  seasonId = null,
  organizationId = null,
  teamId = null,
  description = '',
}) {
  if (baseAmount <= 0) return { finalAmount: 0 }

  // Look up season rank multiplier from profiles (denormalized)
  let seasonMultiplier = 1.0
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_season_multiplier')
      .eq('id', profileId)
      .maybeSingle()
    seasonMultiplier = profile?.current_season_multiplier || 1.0
  } catch (e) {
    // Non-critical, continue with 1.0
  }

  const finalAmount = Math.round(baseAmount * seasonMultiplier)

  let finalDescription = description
  if (seasonMultiplier > 1.0) {
    finalDescription += ` (${seasonMultiplier}x season rank)`
  }

  // Insert xp_ledger
  await supabase.from('xp_ledger').insert({
    player_id: profileId,
    organization_id: organizationId,
    xp_amount: finalAmount,
    base_amount: baseAmount,
    season_multiplier: seasonMultiplier,
    source_type: sourceType,
    source_id: sourceId,
    season_id: seasonId,
    description: finalDescription,
  })

  // Update profiles
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', profileId)
    .maybeSingle()

  const oldTotalXp = currentProfile?.total_xp || 0
  const newTotalXp = oldTotalXp + finalAmount
  const levelInfo = getLevelFromXP(newTotalXp)

  await supabase
    .from('profiles')
    .update({
      total_xp: newTotalXp,
      player_level: levelInfo.level,
      tier: levelInfo.tier,
      xp_to_next_level: levelInfo.xpToNext,
    })
    .eq('id', profileId)

  // Update season_ranks if season known
  if (seasonId) {
    try {
      const { data: existing } = await supabase
        .from('season_ranks')
        .select('id, season_xp')
        .eq('player_id', profileId)
        .eq('season_id', seasonId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('season_ranks')
          .update({
            season_xp: (existing.season_xp || 0) + finalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else if (organizationId) {
        await supabase
          .from('season_ranks')
          .insert({
            player_id: profileId,
            season_id: seasonId,
            organization_id: organizationId,
            season_xp: finalAmount,
          })
      }
    } catch (e) {
      // Non-critical
    }
  }

  return {
    finalAmount,
    newTotalXp,
    newLevel: levelInfo.level,
    newTier: levelInfo.tier,
    leveledUp: levelInfo.level > getLevelFromXP(oldTotalXp).level,
  }
}
