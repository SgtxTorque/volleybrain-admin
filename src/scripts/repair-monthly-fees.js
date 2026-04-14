import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY environment variable')
  console.error('Find it in Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function repairMonthlyFees(dryRun = true) {
  console.log(`\n=== Monthly Fee Repair Script (${dryRun ? 'DRY RUN' : 'LIVE RUN'}) ===\n`)

  // 1. Get all auto-generated monthly payments that are unpaid
  const { data: monthlyPayments, error: payErr } = await supabase
    .from('payments')
    .select('id, season_id, player_id, amount, fee_name, fee_type, paid, auto_generated')
    .eq('fee_type', 'monthly')
    .eq('auto_generated', true)
    .eq('paid', false)

  if (payErr) {
    console.error('Error fetching payments:', payErr)
    return
  }

  console.log(`Found ${monthlyPayments?.length || 0} unpaid auto-generated monthly payments\n`)

  if (!monthlyPayments?.length) {
    console.log('Nothing to repair — no unpaid auto-generated monthly payments found.')
    return
  }

  // 2. Get unique season IDs and fetch their fee_monthly values
  const seasonIds = [...new Set(monthlyPayments.map(p => p.season_id))]
  const { data: seasons, error: sErr } = await supabase
    .from('seasons')
    .select('id, name, fee_monthly, months_in_season')
    .in('id', seasonIds)

  if (sErr) {
    console.error('Error fetching seasons:', sErr)
    return
  }

  const seasonMap = Object.fromEntries(seasons.map(s => [s.id, s]))

  // 3. Compare and repair
  let repairCount = 0
  let skipCount = 0
  let alreadyCorrectCount = 0
  let errorCount = 0

  for (const payment of monthlyPayments) {
    const season = seasonMap[payment.season_id]
    if (!season) {
      console.warn(`  SKIP: Payment ${payment.id} — season ${payment.season_id} not found`)
      skipCount++
      continue
    }

    const correctAmount = parseFloat(season.fee_monthly) || 0
    const currentAmount = parseFloat(payment.amount) || 0

    // If amounts match (within 1 cent), already correct
    if (Math.abs(currentAmount - correctAmount) < 0.01) {
      alreadyCorrectCount++
      continue
    }

    // Check if this looks like the old bug: amount ≈ fee_monthly / months_in_season
    const buggyAmount = season.months_in_season > 0
      ? parseFloat(season.fee_monthly) / parseInt(season.months_in_season)
      : 0
    const looksLikeBug = Math.abs(currentAmount - buggyAmount) < 0.02

    console.log(`  ${dryRun ? 'WOULD FIX' : 'FIXING'}: Payment ${payment.id}`)
    console.log(`    Season: "${season.name}" (fee_monthly: $${season.fee_monthly}, months: ${season.months_in_season})`)
    console.log(`    Player: ${payment.player_id}`)
    console.log(`    Fee: ${payment.fee_name}`)
    console.log(`    Current: $${currentAmount.toFixed(2)} → Correct: $${correctAmount.toFixed(2)}${looksLikeBug ? ' (confirmed old ÷ bug pattern)' : ' (amount mismatch — not the ÷ bug pattern, updating anyway)'}`)
    console.log()

    if (!dryRun) {
      const { error: updateErr } = await supabase
        .from('payments')
        .update({ amount: correctAmount })
        .eq('id', payment.id)

      if (updateErr) {
        console.error(`    ERROR updating payment ${payment.id}:`, updateErr)
        errorCount++
        continue
      }
    }

    repairCount++
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Total monthly payments checked: ${monthlyPayments.length}`)
  console.log(`Already correct: ${alreadyCorrectCount}`)
  console.log(`${dryRun ? 'Would repair' : 'Repaired'}: ${repairCount}`)
  console.log(`Skipped (season not found): ${skipCount}`)
  if (errorCount > 0) console.log(`Errors: ${errorCount}`)
  console.log()

  if (dryRun && repairCount > 0) {
    console.log('To apply fixes, run with DRY_RUN=false:')
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_key DRY_RUN=false node src/scripts/repair-monthly-fees.js')
  }
}

const dryRun = process.env.DRY_RUN !== 'false'
repairMonthlyFees(dryRun)
