/**
 * Wire badge URLs to achievements table
 * 1. Reads badge-manifest.csv
 * 2. Fetches all existing achievements
 * 3. Deduplicates existing achievements (same stat_key+threshold+target_role)
 * 4. Updates matching rows with badge_image_url + chain data
 * 5. Inserts new achievement rows for unmatched manifest entries
 * 6. Wires tier0 images to chain start achievements
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { resolve } from 'path'

const SUPABASE_URL = 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_BADGE_URL = `${SUPABASE_URL}/storage/v1/object/public/badges`

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// --- Helpers ---
function mapRole(csvRole) {
  const map = { tm: 'team_manager', universal: 'all' }
  return map[csvRole] || csvRole
}

function rarityToTier(rarity) {
  const map = { Tier0: 0, Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5 }
  return map[rarity] ?? 1
}

function normalizeForMatch(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// --- Step 1: Read manifest ---
const csvPath = resolve('badge-manifest.csv')
const manifest = parse(readFileSync(csvPath, 'utf8'), { columns: true, skip_empty_lines: true })
console.log(`Manifest: ${manifest.length} rows`)

// Separate tier0 and non-tier0
const tier0Rows = manifest.filter(r => (r.rarity || '').trim() === 'Tier0')
const badgeRows = manifest.filter(r => (r.rarity || '').trim() !== 'Tier0')
console.log(`Non-tier0 badges: ${badgeRows.length}, Tier0: ${tier0Rows.length}`)

// --- Step 2: Fetch all existing achievements ---
const { data: existingAll, error: fetchErr } = await supabase
  .from('achievements')
  .select('*')
  .limit(1000)

if (fetchErr) {
  console.error('Failed to fetch achievements:', fetchErr)
  process.exit(1)
}
console.log(`Existing achievements in DB: ${existingAll.length}`)

// --- Step 3: Deduplicate existing achievements ---
// Group by stat_key + threshold + target_role
const groupKey = (a) => `${a.stat_key || ''}|${a.threshold || ''}|${a.target_role || ''}`
const groups = {}
for (const a of existingAll) {
  const key = groupKey(a)
  if (!groups[key]) groups[key] = []
  groups[key].push(a)
}

const toDelete = []
const kept = new Map() // key -> achievement (the one we keep)

for (const [key, members] of Object.entries(groups)) {
  if (members.length === 1) {
    kept.set(key, members[0])
    continue
  }
  // Multiple entries with same stat_key+threshold+target_role — keep the best one
  // Prefer: one that matches a manifest name, or the oldest (first created)
  const manifestMatch = badgeRows.find(r => {
    const dbRole = mapRole(r.role?.trim())
    return dbRole === members[0].target_role &&
      (r.stat_key?.trim() || '') === (members[0].stat_key || '') &&
      parseInt(r.threshold || '0') === (members[0].threshold || 0)
  })

  let keeper = null
  if (manifestMatch) {
    // Find the one whose name best matches the manifest badge_name
    const manifestName = normalizeForMatch(manifestMatch.badge_name)
    keeper = members.find(m => normalizeForMatch(m.name) === manifestName)
  }
  if (!keeper) {
    // Keep the oldest one
    keeper = members.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
  }

  kept.set(key, keeper)
  for (const m of members) {
    if (m.id !== keeper.id) toDelete.push(m.id)
  }
}

console.log(`Duplicates to delete: ${toDelete.length}`)

// Delete duplicates
if (toDelete.length > 0) {
  // Delete in batches of 20
  for (let i = 0; i < toDelete.length; i += 20) {
    const batch = toDelete.slice(i, i + 20)
    const { error: delErr } = await supabase
      .from('achievements')
      .delete()
      .in('id', batch)
    if (delErr) console.error(`Delete batch error:`, delErr)
    else console.log(`Deleted ${batch.length} duplicate achievements`)
  }
}

// --- Step 4: Match manifest rows to existing achievements, update or insert ---
const stats = { updated: 0, inserted: 0, unmatched: [], errors: [] }

// Build a lookup from kept achievements
const byStatKey = new Map()
for (const [key, ach] of kept.entries()) {
  byStatKey.set(key, ach)
}

// Also build name lookup for fallback matching
const byNameRole = new Map()
for (const [, ach] of kept.entries()) {
  const nk = `${normalizeForMatch(ach.name)}|${ach.target_role}`
  byNameRole.set(nk, ach)
}

for (const row of badgeRows) {
  const filename = row.output_filename?.trim()
  if (!filename) continue

  const dbRole = mapRole(row.role?.trim())
  const statKey = row.stat_key?.trim() || null
  const threshold = row.threshold?.trim() ? parseInt(row.threshold.trim()) : null
  const chainId = row.chain_id?.trim() || null
  const chainPos = row.chain_position?.trim() ? parseInt(row.chain_position.trim()) : 0
  const tier = rarityToTier(row.rarity?.trim())
  const badgeImageUrl = `${BASE_BADGE_URL}/${row.role?.trim()}/${filename}`
  const badgeName = row.badge_name?.trim()

  // Try to match existing achievement
  const lookupKey = `${statKey || ''}|${threshold || ''}|${dbRole}`
  let existing = byStatKey.get(lookupKey)

  // Fallback: match by name + role
  if (!existing) {
    const nameKey = `${normalizeForMatch(badgeName)}|${dbRole}`
    existing = byNameRole.get(nameKey)
  }

  if (existing) {
    // UPDATE existing achievement
    const { error: upErr } = await supabase
      .from('achievements')
      .update({
        badge_image_url: badgeImageUrl,
        chain_id: chainId,
        chain_position: chainPos,
        tier: tier,
        // Also update name to manifest version as source of truth
        name: badgeName,
        description: row.description?.trim() || existing.description,
        how_to_earn: row.how_to_earn?.trim() || existing.how_to_earn,
        xp_reward: row.xp?.trim() ? parseInt(row.xp.trim()) : existing.xp_reward,
        category: row.category?.trim() || existing.category,
        cadence: row.cadence?.trim() || existing.cadence,
        min_level: row.unlock_level?.trim() ? parseInt(row.unlock_level.trim()) : existing.min_level,
        stacks_into: row.stacks_into?.trim() || existing.stacks_into,
        rarity: row.rarity?.trim()?.toLowerCase() || existing.rarity,
      })
      .eq('id', existing.id)

    if (upErr) {
      stats.errors.push({ action: 'update', name: badgeName, error: upErr.message })
    } else {
      stats.updated++
      // Remove from lookup so it can't be matched again
      byStatKey.delete(lookupKey)
      const nameKey = `${normalizeForMatch(badgeName)}|${dbRole}`
      byNameRole.delete(nameKey)
    }
  } else {
    // INSERT new achievement
    const newAchievement = {
      name: badgeName,
      description: row.description?.trim() || null,
      how_to_earn: row.how_to_earn?.trim() || null,
      category: row.category?.trim() || null,
      type: 'stat_cumulative',
      rarity: row.rarity?.trim()?.toLowerCase() || 'common',
      stat_key: statKey,
      threshold: threshold,
      threshold_type: (row.cadence?.trim()?.toLowerCase() === 'season') ? 'season' : 'lifetime',
      requires_verification: false,
      sport: 'volleyball',
      is_active: true,
      display_order: parseInt(row.badge_number?.trim() || '0'),
      xp_reward: row.xp?.trim() ? parseInt(row.xp.trim()) : 25,
      target_role: dbRole,
      min_level: row.unlock_level?.trim() ? parseInt(row.unlock_level.trim()) : 1,
      stacks_into: row.stacks_into?.trim() || null,
      cadence: row.cadence?.trim()?.toLowerCase() || 'lifetime',
      badge_image_url: badgeImageUrl,
      chain_id: chainId,
      chain_position: chainPos,
      tier: tier,
    }

    const { error: insErr } = await supabase
      .from('achievements')
      .insert(newAchievement)

    if (insErr) {
      stats.errors.push({ action: 'insert', name: badgeName, error: insErr.message })
    } else {
      stats.inserted++
    }
  }
}

console.log('\n=== BADGE WIRING COMPLETE ===')
console.log(`Updated: ${stats.updated}`)
console.log(`Inserted: ${stats.inserted}`)
console.log(`Errors: ${stats.errors.length}`)

if (stats.errors.length > 0) {
  console.log('\nErrors:')
  stats.errors.forEach(e => console.log(`  [${e.action}] ${e.name}: ${e.error}`))
}

// --- Step 5: Wire tier0 images ---
console.log('\n--- Wiring tier0 images ---')
let tier0Updated = 0
let tier0Errors = 0

for (const row of tier0Rows) {
  const filename = row.output_filename?.trim()
  if (!filename) continue

  const chainId = row.chain_id?.trim()
  if (!chainId) continue

  const role = row.role?.trim()
  const tier0Url = `${BASE_BADGE_URL}/${role}/tier0/${filename}`

  // Find the first achievement in this chain (chain_position = 1, the first real badge)
  const { data: chainMembers, error: findErr } = await supabase
    .from('achievements')
    .select('id, chain_position')
    .eq('chain_id', chainId)
    .order('chain_position', { ascending: true })
    .limit(1)

  if (findErr || !chainMembers?.length) {
    tier0Errors++
    continue
  }

  const { error: t0Err } = await supabase
    .from('achievements')
    .update({ tier0_image_url: tier0Url })
    .eq('id', chainMembers[0].id)

  if (t0Err) tier0Errors++
  else tier0Updated++
}

console.log(`Tier0 images wired: ${tier0Updated}`)
console.log(`Tier0 errors: ${tier0Errors}`)

// --- Save full results ---
writeFileSync('wire-results.json', JSON.stringify(stats, null, 2))
console.log('\nResults saved to wire-results.json')
