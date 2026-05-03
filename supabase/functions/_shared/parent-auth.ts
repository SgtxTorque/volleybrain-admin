/**
 * Shared parent authorization helper for Edge Functions.
 *
 * Checks if a user is an authorized parent (primary via players.parent_account_id
 * or secondary via player_parents junction table) for a given player.
 */

/**
 * Check if a user is an authorized parent (primary or secondary) for a player.
 *
 * @param supabaseClient - Supabase client (service role or user JWT)
 * @param userId - The authenticated user's profile ID
 * @param playerId - The player ID to check authorization for
 * @returns true if the user is a primary or secondary parent
 */
export async function isAuthorizedParent(
  supabaseClient: any,
  userId: string,
  playerId: string
): Promise<boolean> {
  if (!userId || !playerId) return false;

  // Check 1: Direct parent_account_id link (primary parent)
  const { data: player } = await supabaseClient
    .from('players')
    .select('parent_account_id')
    .eq('id', playerId)
    .maybeSingle();

  if (player?.parent_account_id === userId) return true;

  // Check 2: player_parents junction table (secondary parent)
  const { data: ppLink } = await supabaseClient
    .from('player_parents')
    .select('id')
    .eq('player_id', playerId)
    .eq('parent_id', userId)
    .maybeSingle();

  return !!ppLink;
}
