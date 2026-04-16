import { supabase } from './supabase'

/**
 * Transfer a registration from one season to another.
 * Handles: registration update, player season update, fee recalculation,
 * team removal, RSVP cleanup.
 *
 * @param {object} params
 * @param {string} params.registrationId - Registration UUID
 * @param {string} params.playerId - Player UUID
 * @param {string} params.oldSeasonId - Current season UUID
 * @param {string} params.newSeasonId - Target season UUID
 * @param {string} params.organizationId - Org UUID (for validation)
 * @param {boolean} params.keepCustomFees - Whether to keep custom (non-auto) fees
 * @returns {{ success, error, details }}
 */
export async function transferRegistration({
  registrationId,
  playerId,
  oldSeasonId,
  newSeasonId,
  organizationId,
  keepCustomFees = true,
}) {
  try {
    // 1. VALIDATE — new season exists in same org
    const { data: newSeason, error: seasonErr } = await supabase
      .from('seasons')
      .select('id, name, organization_id, approval_mode')
      .eq('id', newSeasonId)
      .single()

    if (seasonErr || !newSeason) {
      return { success: false, error: 'Target season not found' }
    }
    if (newSeason.organization_id !== organizationId) {
      return { success: false, error: 'Target season belongs to a different organization' }
    }

    // 2. VALIDATE — player not already registered in new season
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('player_id', playerId)
      .eq('season_id', newSeasonId)
      .maybeSingle()

    if (existingReg) {
      return { success: false, error: 'Player is already registered in the target season' }
    }

    // 3. CHECK — are there paid auto-generated fees?
    const { data: paidFees } = await supabase
      .from('payments')
      .select('id, amount, fee_name')
      .eq('player_id', playerId)
      .eq('season_id', oldSeasonId)
      .eq('auto_generated', true)
      .eq('paid', true)

    if (paidFees?.length > 0) {
      const paidTotal = paidFees.reduce((s, f) => s + parseFloat(f.amount || 0), 0)
      return {
        success: false,
        error: `Player has $${paidTotal.toFixed(2)} in paid fees. Please process a refund before transferring.`,
        paidFees,
      }
    }

    // 4. DELETE auto-generated fees (old season)
    await supabase
      .from('payments')
      .delete()
      .eq('player_id', playerId)
      .eq('season_id', oldSeasonId)
      .eq('auto_generated', true)

    // 5. Handle custom fees
    if (!keepCustomFees) {
      await supabase
        .from('payments')
        .delete()
        .eq('player_id', playerId)
        .eq('season_id', oldSeasonId)
        .eq('auto_generated', false)
    } else {
      // Move custom fees to new season
      await supabase
        .from('payments')
        .update({ season_id: newSeasonId })
        .eq('player_id', playerId)
        .eq('season_id', oldSeasonId)
        .eq('auto_generated', false)
    }

    // 6. Remove from team roster
    const { data: deletedRoster } = await supabase
      .from('team_players')
      .delete()
      .eq('player_id', playerId)
      .select()

    // 7. Delete old season RSVPs
    const { data: oldEvents } = await supabase
      .from('schedule_events')
      .select('id')
      .eq('season_id', oldSeasonId)

    if (oldEvents?.length) {
      const oldEventIds = oldEvents.map(e => e.id)
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('player_id', playerId)
        .in('event_id', oldEventIds)
    }

    // 8. UPDATE registration season
    const { error: regErr } = await supabase
      .from('registrations')
      .update({ season_id: newSeasonId })
      .eq('id', registrationId)

    if (regErr) {
      return { success: false, error: 'Failed to update registration: ' + regErr.message }
    }

    // 9. UPDATE player season
    const { error: playerErr } = await supabase
      .from('players')
      .update({ season_id: newSeasonId })
      .eq('id', playerId)

    if (playerErr) {
      return { success: false, error: 'Failed to update player: ' + playerErr.message }
    }

    // 10. Regenerate fees for new season (if registration is approved/rostered)
    const { data: registration } = await supabase
      .from('registrations')
      .select('status')
      .eq('id', registrationId)
      .single()

    let feesGenerated = false
    if (registration?.status === 'approved' || registration?.status === 'rostered') {
      const { generateFeesForPlayer } = await import('./fee-calculator')
      const { data: playerData } = await supabase
        .from('players')
        .select('*, registrations(*)')
        .eq('id', playerId)
        .single()

      const { data: fullNewSeason } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', newSeasonId)
        .single()

      if (playerData && fullNewSeason) {
        await generateFeesForPlayer(supabase, playerData, fullNewSeason, null)
        feesGenerated = true
      }
    }

    return {
      success: true,
      details: {
        newSeasonName: newSeason.name,
        rosterRemoved: (deletedRoster?.length || 0) > 0,
        feesGenerated,
        customFeesMoved: keepCustomFees,
      },
    }
  } catch (err) {
    console.error('Transfer registration error:', err)
    return { success: false, error: err.message || 'Transfer failed' }
  }
}
