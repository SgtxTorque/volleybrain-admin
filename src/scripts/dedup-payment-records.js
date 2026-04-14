import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function dedupPayments(dryRun = true) {
  console.log(`\n=== Payment Dedup (${dryRun ? 'DRY RUN' : 'LIVE'}) ===\n`)

  // Find all auto-generated payments
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, player_id, season_id, fee_type, fee_name, amount, paid, auto_generated, created_at')
    .eq('auto_generated', true)
    .order('created_at', { ascending: true })

  if (error) { console.error('Error:', error); return }

  // Group by (player_id, season_id, fee_type, fee_name)
  const groups = new Map()
  for (const p of payments || []) {
    const key = `${p.player_id}|${p.season_id}|${p.fee_type}|${p.fee_name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(p)
  }

  let dupGroups = 0
  let deleteCount = 0
  let paidDupCount = 0

  for (const [key, group] of groups) {
    if (group.length <= 1) continue
    dupGroups++

    // Keep the first one (oldest), delete the rest
    const [keep, ...dupes] = group

    console.log(`\n  DUPLICATE GROUP: ${key}`)
    console.log(`    Keep: ${keep.id} (created ${keep.created_at}, amount $${keep.amount}, paid: ${keep.paid})`)

    for (const dupe of dupes) {
      if (dupe.paid) {
        console.log(`    SKIP DELETE: ${dupe.id} — already PAID (amount $${dupe.amount}). Manual review needed.`)
        paidDupCount++
        continue
      }

      console.log(`    ${dryRun ? 'WOULD DELETE' : 'DELETING'}: ${dupe.id} (created ${dupe.created_at}, amount $${dupe.amount})`)

      if (!dryRun) {
        const { error: delErr } = await supabase.from('payments').delete().eq('id', dupe.id)
        if (delErr) console.error(`    ERROR deleting:`, delErr.message)
      }
      deleteCount++
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Duplicate groups found: ${dupGroups}`)
  console.log(`Records ${dryRun ? 'would delete' : 'deleted'}: ${deleteCount}`)
  if (paidDupCount > 0) console.log(`Paid duplicates (need manual review): ${paidDupCount}`)
  if (dryRun && deleteCount > 0) {
    console.log(`\nTo apply: SUPABASE_SERVICE_ROLE_KEY=xxx DRY_RUN=false node src/scripts/dedup-payment-records.js`)
  }
  if (deleteCount > 0 || dupGroups === 0) {
    console.log(`\nAfter dedup, add the unique constraint via Supabase SQL Editor:`)
    console.log(`CREATE UNIQUE INDEX payments_unique_auto_fee ON payments (player_id, season_id, fee_type, fee_name) WHERE (auto_generated = true);`)
  }
}

const dryRun = process.env.DRY_RUN !== 'false'
dedupPayments(dryRun)
