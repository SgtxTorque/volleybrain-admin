// =============================================================================
// Shoutout Service — Give, XP, Achievement Checks
// =============================================================================

import { supabase } from './supabase'
import { XP_BY_SOURCE, getLevelFromXP } from './engagement-constants'

// =============================================================================
// Main: giveShoutout
// =============================================================================

export async function giveShoutout({
  giverId, giverRole, giverName,
  receiverId, receiverRole, receiverName, receiverAvatar,
  teamId, organizationId,
  category, message,
}) {
  try {
    // 1. Create team_post of type "shoutout"
    const displayText = `${giverName} gave ${receiverName} a ${category.emoji} ${category.name} shoutout!`
    const metadata = JSON.stringify({
      receiverId,
      receiverName,
      receiverAvatar,
      categoryName: category.name,
      categoryEmoji: category.emoji,
      categoryColor: category.color,
      categoryId: category.id,
      message: message || null,
    })

    const { data: post, error: postError } = await supabase
      .from('team_posts')
      .insert({
        team_id: teamId,
        author_id: giverId,
        post_type: 'shoutout',
        title: metadata,
        content: displayText,
        is_pinned: false,
        is_published: true,
      })
      .select('id')
      .single()

    if (postError) {
      console.error('[ShoutoutService] post insert error:', postError)
      return { success: false, error: postError.message }
    }

    // 2. Create shoutout record
    const { data: shoutout, error: shoutoutError } = await supabase
      .from('shoutouts')
      .insert({
        giver_id: giverId,
        giver_role: giverRole,
        receiver_id: receiverId,
        receiver_role: receiverRole,
        team_id: teamId,
        organization_id: organizationId,
        category_id: category.id,
        category: category.name,
        message: message || null,
        show_on_team_wall: true,
        post_id: post.id,
      })
      .select('id')
      .single()

    if (shoutoutError) {
      console.error('[ShoutoutService] shoutout insert error:', shoutoutError)
    }

    // 3. Award XP (fire-and-forget)
    awardShoutoutXP(giverId, receiverId, organizationId, shoutout?.id || null).catch(() => {})

    // 4. Check achievements (fire-and-forget)
    checkShoutoutAchievements(giverId, receiverId).catch(() => {})

    return { success: true, shoutoutId: shoutout?.id, postId: post.id }
  } catch (err) {
    console.error('[ShoutoutService] giveShoutout error:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

// =============================================================================
// Award XP
// =============================================================================

async function awardShoutoutXP(giverId, receiverId, organizationId, shoutoutId) {
  const giverXP = XP_BY_SOURCE.shoutout_given
  const receiverXP = XP_BY_SOURCE.shoutout_received

  const entries = [
    {
      player_id: giverId,
      organization_id: organizationId,
      xp_amount: giverXP,
      source_type: 'shoutout_given',
      source_id: shoutoutId,
      description: `Gave a shoutout (+${giverXP} XP)`,
    },
    {
      player_id: receiverId,
      organization_id: organizationId,
      xp_amount: receiverXP,
      source_type: 'shoutout_received',
      source_id: shoutoutId,
      description: `Received a shoutout (+${receiverXP} XP)`,
    },
  ]

  const { error: ledgerError } = await supabase.from('xp_ledger').insert(entries)
  if (ledgerError) console.error('[ShoutoutService] XP ledger error:', ledgerError)

  // Update total_xp and player_level on profiles
  for (const { userId, xp_amount } of [
    { userId: giverId, xp_amount: giverXP },
    { userId: receiverId, xp_amount: receiverXP },
  ]) {
    const profId = await resolveProfileId(userId)
    if (!profId) continue

    const { data: prof } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', profId)
      .single()

    const currentXP = prof?.total_xp || 0
    const newXP = currentXP + xp_amount
    const { level } = getLevelFromXP(newXP)

    await supabase
      .from('profiles')
      .update({ total_xp: newXP, player_level: level })
      .eq('id', profId)
  }
}

// =============================================================================
// ID Resolution — profiles.id <-> players.id
// =============================================================================

async function resolvePlayerId(id) {
  const { data: direct } = await supabase.from('players').select('id').eq('id', id).maybeSingle()
  if (direct) return direct.id
  const { data: linked } = await supabase.from('players').select('id').eq('parent_account_id', id).limit(1).maybeSingle()
  return linked?.id || null
}

async function resolveProfileId(id) {
  const { data: direct } = await supabase.from('profiles').select('id').eq('id', id).maybeSingle()
  if (direct) return direct.id
  const { data: player } = await supabase.from('players').select('parent_account_id').eq('id', id).maybeSingle()
  return player?.parent_account_id || null
}

// =============================================================================
// Check Shoutout Achievements
// =============================================================================

async function checkShoutoutAchievements(giverId, receiverId) {
  const { count: givenCount } = await supabase
    .from('shoutouts')
    .select('id', { count: 'exact', head: true })
    .eq('giver_id', giverId)

  const { count: receivedCount } = await supabase
    .from('shoutouts')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', receiverId)

  if (givenCount != null) {
    await checkAndAwardShoutoutBadges(giverId, 'shoutouts_given', givenCount)
  }
  if (receivedCount != null) {
    await checkAndAwardShoutoutBadges(receiverId, 'shoutouts_received', receivedCount)
  }
}

async function checkAndAwardShoutoutBadges(userId, statKey, currentValue) {
  const playerId = await resolvePlayerId(userId)
  if (!playerId) return

  const { data: achievements } = await supabase
    .from('achievements')
    .select('id, threshold')
    .eq('stat_key', statKey)
    .eq('is_active', true)

  if (!achievements || achievements.length === 0) return

  const achIds = achievements.map(a => a.id)
  const { data: earned } = await supabase
    .from('player_achievements')
    .select('achievement_id')
    .eq('player_id', playerId)
    .in('achievement_id', achIds)

  const earnedSet = new Set((earned || []).map(e => e.achievement_id))

  const now = new Date().toISOString()
  const newUnlocks = []

  for (const ach of achievements) {
    if (earnedSet.has(ach.id)) continue
    if (ach.threshold != null && currentValue >= ach.threshold) {
      newUnlocks.push({
        player_id: playerId,
        achievement_id: ach.id,
        earned_at: now,
        stat_value_at_unlock: currentValue,
      })
    }
  }

  if (newUnlocks.length > 0) {
    const { error } = await supabase
      .from('player_achievements')
      .upsert(newUnlocks, { onConflict: 'player_id,achievement_id', ignoreDuplicates: true })
    if (error) console.error('[ShoutoutService] badge unlock error:', error)
  }

  // Update progress
  const progressRows = achievements.map(ach => ({
    player_id: playerId,
    achievement_id: ach.id,
    current_value: currentValue,
    target_value: ach.threshold ?? 0,
    last_updated_at: now,
  }))

  if (progressRows.length > 0) {
    await supabase
      .from('player_achievement_progress')
      .upsert(progressRows, { onConflict: 'player_id,achievement_id' })
  }
}

// =============================================================================
// Fetch shoutout categories
// =============================================================================

export async function fetchShoutoutCategories(organizationId) {
  let query = supabase
    .from('shoutout_categories')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  if (organizationId) {
    query = query.or(`is_default.eq.true,organization_id.eq.${organizationId}`)
  } else {
    query = query.eq('is_default', true)
  }

  const { data, error } = await query
  if (error) {
    console.error('[ShoutoutService] fetchCategories error:', error)
    return []
  }
  return data || []
}

// =============================================================================
// Fetch shoutout stats for a profile
// =============================================================================

export async function fetchShoutoutStats(profileId) {
  const { count: received } = await supabase
    .from('shoutouts')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', profileId)

  const { count: given } = await supabase
    .from('shoutouts')
    .select('id', { count: 'exact', head: true })
    .eq('giver_id', profileId)

  const { data: receivedData } = await supabase
    .from('shoutouts')
    .select('category, shoutout_categories(emoji, color)')
    .eq('receiver_id', profileId)

  const catMap = new Map()
  for (const row of receivedData || []) {
    const cat = row.category
    const catData = row.shoutout_categories
    const existing = catMap.get(cat)
    if (existing) {
      existing.count++
    } else {
      catMap.set(cat, {
        emoji: catData?.emoji || '⭐',
        color: catData?.color || '#64748B',
        count: 1,
      })
    }
  }

  const categoryBreakdown = Array.from(catMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.count - a.count)

  return { received: received || 0, given: given || 0, categoryBreakdown }
}
