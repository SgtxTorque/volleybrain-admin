// ============================================
// FEE GENERATION UTILITIES
// ============================================

/**
 * Calculate all fees for a player based on season settings
 * Returns array of fee objects ready to insert into payments table
 */
export function calculateFeesForPlayer(player, season, options = {}) {
  const { 
    checkExistingFamilyFee = true, 
    existingFamilyEmails = [],
    siblingIndex = 0  // 0 = first child, 1 = second child, etc.
  } = options
  const fees = []
  const familyEmail = player.parent_email?.toLowerCase()
  const now = new Date()
  const registrationDate = player.registrations?.[0]?.created_at ? new Date(player.registrations[0].created_at) : now
  
  // Determine if early bird pricing applies
  const earlyBirdDeadline = season.early_bird_deadline ? new Date(season.early_bird_deadline) : null
  const isEarlyBird = earlyBirdDeadline && registrationDate <= earlyBirdDeadline
  const earlyBirdDiscount = isEarlyBird ? (parseFloat(season.early_bird_discount) || 0) : 0
  
  // Determine if late fee applies
  const lateDeadline = season.late_registration_deadline ? new Date(season.late_registration_deadline) : null
  const isLate = lateDeadline && registrationDate > lateDeadline
  const lateFee = isLate ? (parseFloat(season.late_registration_fee) || 0) : 0
  
  // Calculate sibling discount
  const siblingDiscountType = season.sibling_discount_type || 'none'
  const siblingDiscountAmount = parseFloat(season.sibling_discount_amount) || 0
  const siblingDiscountApplyTo = season.sibling_discount_apply_to || 'additional'
  
  // Determine if this player gets sibling discount
  const getsSiblingDiscount = siblingDiscountType !== 'none' && siblingDiscountAmount > 0 && (
    siblingDiscountApplyTo === 'all' ? siblingIndex >= 0 : siblingIndex > 0
  )
  
  // Base fee record template
  const baseFee = {
    season_id: season.id,
    player_id: player.id,
    family_email: familyEmail,
    registration_id: player.registrations?.[0]?.id,
    paid: false,
    auto_generated: true,
    created_at: new Date().toISOString()
  }
  
  // Helper to apply sibling discount to an amount
  function applySiblingDiscount(amount, feeName) {
    if (!getsSiblingDiscount || amount <= 0) return { amount, discountApplied: 0, description: '' }
    
    let discountApplied = 0
    if (siblingDiscountType === 'flat') {
      discountApplied = Math.min(siblingDiscountAmount, amount) // Don't discount more than the fee
    } else if (siblingDiscountType === 'percent') {
      discountApplied = amount * (siblingDiscountAmount / 100)
    }
    
    const newAmount = Math.max(0, amount - discountApplied)
    const description = discountApplied > 0 
      ? ` (Sibling discount: -$${discountApplied.toFixed(2)})`
      : ''
    
    return { amount: newAmount, discountApplied, description }
  }
  
  // Build discount/fee labels for clarity
  const discountLabels = []
  if (isEarlyBird && earlyBirdDiscount > 0) discountLabels.push(`Early Bird -$${earlyBirdDiscount}`)
  if (getsSiblingDiscount) discountLabels.push('Sibling Discount')
  if (isLate && lateFee > 0) discountLabels.push(`Late Fee +$${lateFee}`)
  
  // 1. Registration Fee (per player) - sibling discount and early bird applies here
  const registrationFee = parseFloat(season.fee_registration) || 0
  if (registrationFee > 0) {
    let adjustedAmount = Math.max(0, registrationFee - earlyBirdDiscount)
    const siblingResult = applySiblingDiscount(adjustedAmount, 'Registration')
    adjustedAmount = siblingResult.amount
    
    let feeName = 'Registration'
    let description = 'Season registration fee'
    
    // Build dynamic name and description based on what applies
    const appliedDiscounts = []
    if (isEarlyBird && earlyBirdDiscount > 0) appliedDiscounts.push('Early Bird')
    if (siblingResult.discountApplied > 0) appliedDiscounts.push('Sibling')
    
    if (appliedDiscounts.length > 0) {
      feeName = `Registration (${appliedDiscounts.join(' + ')})`
      const descParts = []
      if (isEarlyBird && earlyBirdDiscount > 0) descParts.push(`Early bird -$${earlyBirdDiscount}`)
      if (siblingResult.discountApplied > 0) descParts.push(`Sibling -$${siblingResult.discountApplied.toFixed(2)}`)
      description = descParts.join(', ')
    }
    
    fees.push({
      ...baseFee,
      fee_type: 'registration',
      fee_name: feeName,
      fee_category: 'per_player',
      amount: adjustedAmount,
      description,
      // Track discount metadata
      early_bird_applied: isEarlyBird,
      early_bird_amount: earlyBirdDiscount,
      sibling_discount_applied: siblingResult.discountApplied > 0,
      sibling_discount_amount: siblingResult.discountApplied,
      sibling_index: siblingIndex
    })
  }
  
  // 2. Late Registration Fee (per player) - charged separately so it's visible
  if (lateFee > 0) {
    fees.push({
      ...baseFee,
      fee_type: 'late_fee',
      fee_name: 'Late Registration Fee',
      fee_category: 'per_player',
      amount: lateFee,
      description: `Late registration fee (registered after ${lateDeadline.toLocaleDateString()})`
    })
  }
  
  // 3. Uniform Fee (per player) - no sibling discount typically
  const uniformFee = parseFloat(season.fee_uniform) || 0
  if (uniformFee > 0) {
    fees.push({
      ...baseFee,
      fee_type: 'uniform',
      fee_name: 'Uniform',
      fee_category: 'per_player',
      amount: uniformFee,
      description: 'Uniform/jersey fee'
    })
  }
  
  // 4. Monthly Fees (per player) - sibling discount can apply
  const monthlyFee = parseFloat(season.fee_monthly) || 0
  const monthsInSeason = parseInt(season.months_in_season) || 0
  if (monthlyFee > 0 && monthsInSeason > 0) {
    const totalMonthly = monthlyFee * monthsInSeason
    const siblingResult = applySiblingDiscount(totalMonthly, 'Monthly')
    
    let feeName = `Monthly Fees (${monthsInSeason} months)`
    let description = `$${monthlyFee}/month × ${monthsInSeason} months`
    
    if (siblingResult.discountApplied > 0) {
      feeName = `Monthly Fees (${monthsInSeason} months, Sibling)`
      description = `$${monthlyFee}/month × ${monthsInSeason} months, Sibling -$${siblingResult.discountApplied.toFixed(2)}`
    }
    
    fees.push({
      ...baseFee,
      fee_type: 'monthly',
      fee_name: feeName,
      fee_category: 'per_player',
      amount: siblingResult.amount,
      description,
      sibling_discount_applied: siblingResult.discountApplied > 0,
      sibling_discount_amount: siblingResult.discountApplied
    })
  }
  
  // 5. Per-Family Fee (only if not already charged for this family in this season)
  const familyFee = parseFloat(season.fee_per_family) || 0
  if (familyFee > 0 && familyEmail) {
    const familyAlreadyCharged = checkExistingFamilyFee && 
      existingFamilyEmails.includes(familyEmail)
    
    if (!familyAlreadyCharged) {
      fees.push({
        ...baseFee,
        fee_type: 'family',
        fee_name: 'Family Registration',
        fee_category: 'per_family',
        amount: familyFee,
        description: 'One-time family registration fee per season'
      })
    }
  }
  
  return fees
}

/**
 * Preview fees for a player (before approval) - useful for showing parents what they'll owe
 */
export function previewFeesForPlayer(player, season, siblingCount = 0) {
  return calculateFeesForPlayer(player, season, {
    checkExistingFamilyFee: siblingCount > 0, // If they have siblings, family fee may already be charged
    existingFamilyEmails: siblingCount > 0 ? [player.parent_email?.toLowerCase()] : [],
    siblingIndex: siblingCount
  })
}

/**
 * Get fee summary for display
 */
export function getFeeSummary(fees) {
  const subtotal = fees.reduce((sum, f) => sum + f.amount, 0)
  const discounts = fees.reduce((sum, f) => {
    return sum + (f.early_bird_amount || 0) + (f.sibling_discount_amount || 0)
  }, 0)
  const lateFees = fees.filter(f => f.fee_type === 'late_fee').reduce((sum, f) => sum + f.amount, 0)
  
  return {
    subtotal,
    discounts,
    lateFees,
    total: subtotal,
    hasEarlyBird: fees.some(f => f.early_bird_applied),
    hasSiblingDiscount: fees.some(f => f.sibling_discount_applied),
    hasLateFee: lateFees > 0,
    feeCount: fees.length
  }
}

/**
 * Generate and insert fees for a single player on approval
 */
export async function generateFeesForPlayer(supabase, player, season, showToast) {
  try {
    // Check if fees already exist for this player in this season
    const { data: existingFees } = await supabase
      .from('payments')
      .select('id')
      .eq('player_id', player.id)
      .eq('season_id', season.id)
      .eq('auto_generated', true)
    
    if (existingFees && existingFees.length > 0) {
      console.log('Fees already exist for player:', player.id)
      return { success: true, skipped: true, message: 'Fees already generated' }
    }
    
    const familyEmail = player.parent_email?.toLowerCase()
    let existingFamilyEmails = []
    let siblingIndex = 0
    
    if (familyEmail) {
      // Check which family emails already have family fees for this season
      const { data: existingFamilyFees } = await supabase
        .from('payments')
        .select('family_email')
        .eq('season_id', season.id)
        .eq('fee_category', 'per_family')
      
      existingFamilyEmails = [...new Set((existingFamilyFees || []).map(f => f.family_email?.toLowerCase()))]
      
      // Count existing approved siblings in this season for sibling discount
      const { data: siblingPlayers } = await supabase
        .from('players')
        .select('id, registrations(status)')
        .eq('season_id', season.id)
        .ilike('parent_email', familyEmail)
        .neq('id', player.id)
      
      // Count siblings that are approved/rostered and have fees generated
      const approvedSiblings = (siblingPlayers || []).filter(s => 
        ['approved', 'rostered'].includes(s.registrations?.[0]?.status)
      )
      
      // Check which of those siblings already have fees
      if (approvedSiblings.length > 0) {
        const siblingIds = approvedSiblings.map(s => s.id)
        const { data: siblingsWithFees } = await supabase
          .from('payments')
          .select('player_id')
          .eq('season_id', season.id)
          .eq('auto_generated', true)
          .in('player_id', siblingIds)
        
        siblingIndex = [...new Set((siblingsWithFees || []).map(s => s.player_id))].length
      }
    }
    
    // Calculate fees with sibling index
    const fees = calculateFeesForPlayer(player, season, {
      checkExistingFamilyFee: true,
      existingFamilyEmails,
      siblingIndex
    })
    
    if (fees.length === 0) {
      return { success: true, skipped: true, message: 'No fees to generate' }
    }
    
    // Insert fees
    const { error } = await supabase.from('payments').insert(fees)
    
    if (error) throw error
    
    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0)
    const siblingNote = siblingIndex > 0 ? ` (sibling #${siblingIndex + 1})` : ''
    return { 
      success: true, 
      feesCreated: fees.length, 
      totalAmount,
      siblingIndex,
      message: `Generated ${fees.length} fees totaling $${totalAmount.toFixed(2)}${siblingNote}`
    }
  } catch (err) {
    console.error('Error generating fees:', err)
    if (showToast) showToast('Error generating fees: ' + err.message, 'error')
    return { success: false, error: err.message }
  }
}

/**
 * Retroactively generate fees for all approved players who don't have fees yet
 * Call this once after deploying the update
 */
export async function generateFeesForExistingPlayers(supabase, seasonId, showToast) {
  try {
    // Get the season
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single()
    
    if (seasonError || !season) throw new Error('Season not found')
    
    // Get all approved/rostered players for this season who don't have auto-generated fees
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*, registrations(*)')
      .eq('season_id', seasonId)
    
    if (playersError) throw playersError
    
    // Filter to only approved/rostered players
    const approvedPlayers = (players || []).filter(p => 
      ['approved', 'rostered'].includes(p.registrations?.[0]?.status)
    )
    
    if (approvedPlayers.length === 0) {
      return { success: true, message: 'No approved players found' }
    }
    
    // Get existing auto-generated payments
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('player_id, family_email, fee_category')
      .eq('season_id', seasonId)
      .eq('auto_generated', true)
    
    const playersWithFees = new Set((existingPayments || []).map(p => p.player_id))
    const familiesWithFamilyFee = new Set(
      (existingPayments || [])
        .filter(p => p.fee_category === 'per_family')
        .map(p => p.family_email?.toLowerCase())
    )
    
    // Filter to players without fees
    const playersNeedingFees = approvedPlayers.filter(p => !playersWithFees.has(p.id))
    
    if (playersNeedingFees.length === 0) {
      return { success: true, message: 'All approved players already have fees' }
    }
    
    // Group players by family for sibling discount calculation
    const familyGroups = {}
    for (const player of playersNeedingFees) {
      const familyEmail = player.parent_email?.toLowerCase() || 'unknown'
      if (!familyGroups[familyEmail]) {
        familyGroups[familyEmail] = []
      }
      familyGroups[familyEmail].push(player)
    }
    
    // Count existing siblings with fees per family
    const familySiblingCounts = {}
    for (const payment of (existingPayments || [])) {
      const email = payment.family_email?.toLowerCase()
      if (email) {
        familySiblingCounts[email] = (familySiblingCounts[email] || 0) + 1
      }
    }
    // Deduplicate - we want unique players, not fee count
    for (const email of Object.keys(familySiblingCounts)) {
      const uniquePlayers = [...new Set((existingPayments || [])
        .filter(p => p.family_email?.toLowerCase() === email)
        .map(p => p.player_id))]
      familySiblingCounts[email] = uniquePlayers.length
    }
    
    // Generate fees for each player with proper sibling indexing
    let totalFeesCreated = 0
    let totalAmount = 0
    const allFees = []
    
    for (const familyEmail of Object.keys(familyGroups)) {
      const familyPlayers = familyGroups[familyEmail]
      let siblingIndex = familySiblingCounts[familyEmail] || 0
      
      for (const player of familyPlayers) {
        const fees = calculateFeesForPlayer(player, season, {
          checkExistingFamilyFee: true,
          existingFamilyEmails: [...familiesWithFamilyFee],
          siblingIndex
        })
        
        // Track this family as having family fee now
        if (familyEmail && fees.some(f => f.fee_category === 'per_family')) {
          familiesWithFamilyFee.add(familyEmail)
        }
        
        allFees.push(...fees)
        totalFeesCreated += fees.length
        totalAmount += fees.reduce((sum, f) => sum + f.amount, 0)
        
        // Increment sibling index for next player in this family
        siblingIndex++
      }
    }
    
    if (allFees.length > 0) {
      // Insert all fees in one batch
      const { error: insertError } = await supabase.from('payments').insert(allFees)
      if (insertError) throw insertError
    }
    
    const message = `Generated ${totalFeesCreated} fees for ${playersNeedingFees.length} players totaling $${totalAmount.toFixed(2)}`
    if (showToast) showToast(message, 'success')
    
    return { 
      success: true, 
      playersProcessed: playersNeedingFees.length,
      feesCreated: totalFeesCreated, 
      totalAmount,
      message 
    }
  } catch (err) {
    console.error('Error generating fees for existing players:', err)
    if (showToast) showToast('Error: ' + err.message, 'error')
    return { success: false, error: err.message }
  }
}

/**
 * Generate email content for various notification types
 */
export function generateEmailContent(type, data) {
  const { player, season, organization, fees, totalDue } = data
  
  switch (type) {
    case 'registration_confirmation':
      return {
        subject: `Registration Confirmed - ${season?.name || 'Season'}`,
        body: `Hi ${player?.parent_name || 'Parent'},

Great news! ${player?.first_name}'s registration for ${organization?.name || 'our organization'} ${season?.name || ''} has been approved!

Player: ${player?.first_name} ${player?.last_name}
Season: ${season?.name}
${season?.start_date ? `Start Date: ${new Date(season.start_date).toLocaleDateString()}` : ''}

${totalDue > 0 ? `
PAYMENT DUE: $${totalDue.toFixed(2)}

Fee Breakdown:
${fees?.map(f => `• ${f.fee_name}: $${f.amount.toFixed(2)}`).join('\n') || 'See admin for details'}

Payment Methods:
${organization?.payment_venmo ? `• Venmo: ${organization.payment_venmo}` : ''}
${organization?.payment_zelle ? `• Zelle: ${organization.payment_zelle}` : ''}
${organization?.payment_cashapp ? `• Cash App: ${organization.payment_cashapp}` : ''}

Please include "${player?.first_name} ${player?.last_name} - ${season?.name}" in your payment note.
` : 'No payment due at this time.'}

Questions? Reply to this email.

See you on the court!
${organization?.name || 'The Team'}`
      }
    
    case 'payment_reminder':
      return {
        subject: `Payment Reminder - ${season?.name || 'Season'} - $${totalDue?.toFixed(2) || '0'} Due`,
        body: `Hi ${player?.parent_name || 'Parent'},

This is a friendly reminder that you have an outstanding balance for ${player?.first_name}'s registration.

AMOUNT DUE: $${totalDue?.toFixed(2) || '0'}

Outstanding Fees:
${fees?.filter(f => !f.paid).map(f => `• ${f.fee_name}: $${f.amount.toFixed(2)}`).join('\n') || 'See admin for details'}

Payment Methods:
${organization?.payment_venmo ? `• Venmo: ${organization.payment_venmo}` : ''}
${organization?.payment_zelle ? `• Zelle: ${organization.payment_zelle}` : ''}
${organization?.payment_cashapp ? `• Cash App: ${organization.payment_cashapp}` : ''}

Please include "${player?.first_name} ${player?.last_name} - ${season?.name}" in your payment note.

Questions? Reply to this email.

Thank you!
${organization?.name || 'The Team'}`
      }
    
    case 'waitlist_notification':
      return {
        subject: `You're on the Waitlist - ${season?.name || 'Season'}`,
        body: `Hi ${player?.parent_name || 'Parent'},

Thank you for registering ${player?.first_name} for ${organization?.name || 'our organization'} ${season?.name || ''}.

You are currently on the waitlist. We'll notify you as soon as a spot becomes available.

Waitlist Position: ${data.waitlistPosition || 'TBD'}

If you have any questions, please reply to this email.

Thank you for your patience!
${organization?.name || 'The Team'}`
      }
    
    default:
      return { subject: '', body: '' }
  }
}
