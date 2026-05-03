import { supabase } from './supabase';

/**
 * Load all children for a parent, checking BOTH parent_account_id AND player_parents.
 * Primary children: players.parent_account_id = profileId
 * Secondary children: player_parents.parent_id = profileId AND is_primary = false
 *
 * Results are deduplicated by player.id.
 *
 * @param {string} profileId - The parent's profile UUID
 * @param {string[]} seasonIds - Array of season UUIDs to scope by (optional)
 * @param {string} selectClause - Supabase select string (defaults to '*')
 * @returns {Array} - Deduplicated array of player records
 */
export async function loadMyChildren(profileId, seasonIds = [], selectClause = '*') {
  if (!profileId) return [];

  // 1. Primary children (existing behavior — unchanged)
  let primaryQuery = supabase
    .from('players')
    .select(selectClause)
    .eq('parent_account_id', profileId);

  if (seasonIds.length > 0) {
    primaryQuery = primaryQuery.in('season_id', seasonIds);
  }

  const { data: primary, error: primaryError } = await primaryQuery;
  if (primaryError) {
    console.error('Error loading primary children:', primaryError);
  }

  // 2. Secondary children via player_parents junction
  const { data: ppLinks, error: ppError } = await supabase
    .from('player_parents')
    .select('player_id')
    .eq('parent_id', profileId)
    .eq('is_primary', false);

  if (ppError) {
    console.error('Error loading player_parents links:', ppError);
  }

  let secondary = [];
  if (ppLinks?.length > 0) {
    const secondaryIds = ppLinks.map(l => l.player_id);
    let secQuery = supabase
      .from('players')
      .select(selectClause)
      .in('id', secondaryIds);

    if (seasonIds.length > 0) {
      secQuery = secQuery.in('season_id', seasonIds);
    }

    const { data: secData, error: secError } = await secQuery;
    if (secError) {
      console.error('Error loading secondary children:', secError);
    }
    secondary = secData || [];
  }

  // 3. Deduplicate by player.id
  const seen = new Set();
  const combined = [];
  for (const player of [...(primary || []), ...secondary]) {
    if (!seen.has(player.id)) {
      seen.add(player.id);
      combined.push(player);
    }
  }

  return combined;
}

/**
 * Check if a profile is a parent (primary or secondary) of a specific player.
 * Used for authorization checks.
 */
export async function isParentOf(profileId, playerId) {
  if (!profileId || !playerId) return false;

  // Check direct link
  const { data: direct } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('parent_account_id', profileId)
    .maybeSingle();

  if (direct) return true;

  // Check junction table
  const { data: junction } = await supabase
    .from('player_parents')
    .select('id')
    .eq('player_id', playerId)
    .eq('parent_id', profileId)
    .maybeSingle();

  return !!junction;
}

/**
 * Get all parents linked to a player (primary + secondary).
 */
export async function getLinkedParents(playerId) {
  if (!playerId) return [];

  // Primary parent from direct link
  const { data: player } = await supabase
    .from('players')
    .select('parent_account_id, profiles:parent_account_id(id, full_name, email, phone)')
    .eq('id', playerId)
    .maybeSingle();

  const parents = [];

  if (player?.profiles) {
    parents.push({
      ...player.profiles,
      relationship: 'parent',
      is_primary: true,
      source: 'parent_account_id',
    });
  }

  // Secondary parents from junction table
  const { data: ppRecords } = await supabase
    .from('player_parents')
    .select('*, profiles:parent_id(id, full_name, email, phone)')
    .eq('player_id', playerId)
    .eq('is_primary', false);

  if (ppRecords?.length) {
    for (const pp of ppRecords) {
      if (pp.profiles && !parents.find(p => p.id === pp.profiles.id)) {
        parents.push({
          ...pp.profiles,
          relationship: pp.relationship || 'parent',
          is_primary: false,
          can_pickup: pp.can_pickup,
          receives_notifications: pp.receives_notifications,
          source: 'player_parents',
        });
      }
    }
  }

  return parents;
}
