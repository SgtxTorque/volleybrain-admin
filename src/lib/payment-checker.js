import { supabase } from './supabase';

/**
 * Check payment status for a player in a season.
 * Used by the approval flow to gate approval behind payment.
 *
 * @param {string} playerId
 * @param {string} seasonId
 * @param {string[]|null} gateFeeTypes - array of fee_type values that gate approval.
 *   If null or empty, checks ALL auto-generated fees.
 * @returns {{ hasFees, totalOwed, amountPaid, fullyPaid, unpaidAmount, gatingFeesPaid }}
 */
export async function getPlayerPaymentStatus(playerId, seasonId, gateFeeTypes = null) {
  let query = supabase
    .from('payments')
    .select('amount, paid, fee_type, auto_generated')
    .eq('player_id', playerId)
    .eq('season_id', seasonId);

  const { data: payments, error } = await query;

  if (error || !payments?.length) {
    return {
      hasFees: false,
      totalOwed: 0,
      amountPaid: 0,
      fullyPaid: false,
      unpaidAmount: 0,
      gatingFeesPaid: false
    };
  }

  // Overall totals (all fees)
  const autoFees = payments.filter(p => p.auto_generated);
  const totalOwed = autoFees.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const amountPaid = autoFees.filter(p => p.paid).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // Gating fee check — only the fee types that the admin marked as "required for approval"
  let gatingFeesPaid = true;
  if (gateFeeTypes && gateFeeTypes.length > 0) {
    const gatingFees = autoFees.filter(p => gateFeeTypes.includes(p.fee_type));
    const unpaidGating = gatingFees.filter(p => !p.paid);
    gatingFeesPaid = unpaidGating.length === 0 && gatingFees.length > 0;
  } else {
    // No specific gating types — check all auto-generated fees
    gatingFeesPaid = amountPaid >= totalOwed && totalOwed > 0;
  }

  return {
    hasFees: totalOwed > 0,
    totalOwed,
    amountPaid,
    fullyPaid: amountPaid >= totalOwed && totalOwed > 0,
    unpaidAmount: Math.max(0, totalOwed - amountPaid),
    gatingFeesPaid
  };
}
