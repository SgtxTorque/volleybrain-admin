// fix-installment-rounding.mjs
// One-time migration to recalculate installment amounts with remainder-aware rounding
//
// RUN:     DRY_RUN=1 node scripts/fix-installment-rounding.mjs   (preview only)
// RUN:     node scripts/fix-installment-rounding.mjs              (apply changes)
//
// This script:
// 1. Finds all monthly installment fee groups in the `payments` table
// 2. Recalculates amounts using Math.floor + remainder on first installment
// 3. Updates the database (unless DRY_RUN=1)
// 4. Reports changes made
//
// SAFE: Only modifies `amount` field on monthly installment fees (fee_type='monthly').
// Does not touch registration fees, uniform fees, family fees, or any other fee types.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('ERROR: Set SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY environment variable')
  process.exit(1)
}

const DRY_RUN = process.env.DRY_RUN === '1'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('=== Installment Rounding Migration ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE — changes will be applied'}\n`)

  // Step 1: Fetch all monthly installment fees
  const { data: fees, error } = await supabase
    .from('payments')
    .select('id, amount, player_id, season_id, fee_type, fee_name, due_date, auto_generated')
    .eq('fee_type', 'monthly')
    .eq('auto_generated', true)
    .order('player_id')
    .order('due_date')

  if (error) {
    console.error('Failed to fetch fees:', error.message)
    process.exit(1)
  }

  console.log(`Found ${fees.length} monthly installment fees\n`)

  if (fees.length === 0) {
    console.log('No monthly installment fees found. Nothing to do.')
    return
  }

  // Step 2: Group by player_id + season_id (each player has one set of monthly installments per season)
  const groups = {}
  for (const fee of fees) {
    const key = `${fee.player_id}__${fee.season_id}`
    if (!groups[key]) groups[key] = []
    groups[key].push(fee)
  }

  console.log(`Found ${Object.keys(groups).length} installment groups\n`)

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  // Step 3: Recalculate each group
  for (const [groupKey, installments] of Object.entries(groups)) {
    const count = installments.length
    if (count <= 1) {
      skippedCount++
      continue
    }

    // Calculate the current sum
    const currentSum = installments.reduce((sum, f) => sum + f.amount, 0)
    const roundedTotal = Math.round(currentSum * 100) / 100

    // Check if the total is off by 1-5 cents (rounding error)
    const nearestWhole = Math.round(roundedTotal)
    const diff = Math.abs(roundedTotal - nearestWhole)

    if (diff > 0 && diff <= 0.05) {
      // This is a rounding error — recalculate
      const correctTotal = nearestWhole
      const baseAmount = Math.floor(correctTotal * 100 / count) / 100
      const remainder = Math.round((correctTotal - baseAmount * count) * 100) / 100

      const [playerId] = groupKey.split('__')
      console.log(`Group (player ${playerId.slice(0, 8)}...): ${count} installments, current sum $${roundedTotal.toFixed(2)}, target $${correctTotal.toFixed(2)}`)
      console.log(`  Base: $${baseAmount.toFixed(2)}, First installment gets remainder: +$${remainder.toFixed(2)}`)

      // Sort by due_date so first installment is deterministic
      installments.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))

      for (let i = 0; i < installments.length; i++) {
        const newAmount = (i === 0) ? baseAmount + remainder : baseAmount
        const fee = installments[i]

        if (Math.abs(fee.amount - newAmount) > 0.001) {
          console.log(`  ${DRY_RUN ? '[DRY RUN]' : 'Updating'} fee ${fee.id.slice(0, 8)}... (${fee.fee_name}): $${fee.amount.toFixed(2)} → $${newAmount.toFixed(2)}`)

          if (!DRY_RUN) {
            const { error: updateError } = await supabase
              .from('payments')
              .update({ amount: newAmount })
              .eq('id', fee.id)

            if (updateError) {
              console.error(`  ERROR updating fee ${fee.id}:`, updateError.message)
              errorCount++
            } else {
              updatedCount++
            }
          } else {
            updatedCount++
          }
        }
      }
    } else if (diff === 0) {
      // Already correct — no rounding error
      skippedCount++
    } else {
      // Diff too large to be a rounding error — skip for safety
      console.log(`SKIPPED group ${groupKey.split('__')[0].slice(0, 8)}...: sum $${roundedTotal.toFixed(2)} differs from nearest whole by $${diff.toFixed(2)} (too large to auto-fix)`)
      skippedCount++
    }
  }

  console.log(`\n=== Migration ${DRY_RUN ? 'Preview' : 'Complete'} ===`)
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${updatedCount} fees`)
  console.log(`Skipped: ${skippedCount} groups (no rounding error or single installment)`)
  if (errorCount > 0) console.log(`Errors: ${errorCount}`)
  if (DRY_RUN) console.log(`\nTo apply changes, run without DRY_RUN=1`)
}

main().catch(console.error)
