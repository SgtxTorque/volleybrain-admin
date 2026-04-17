/**
 * scrub-qa-test-data.mjs
 *
 * Removes the founder's real surname ("Fuentez") and secondary email
 * (fuentezinaction@gmail.com) from QA Panthers Athletics test data.
 * Only touches records within the QA Panthers org — never modifies
 * Black Hornets Athletics or any other org.
 *
 * USAGE:
 *   # Dry run — shows what would change, changes nothing:
 *   node scripts/scrub-qa-test-data.mjs --dry-run
 *
 *   # Execute:
 *   node scripts/scrub-qa-test-data.mjs
 *
 * Reads .env for Supabase credentials. Override with env var:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/scrub-qa-test-data.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')

function loadEnv() {
  try {
    const text = readFileSync(envPath, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* .env not found */ }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const QA_ORG_SLUG = 'qa-panthers-athletics-mnifyrk3'
const REPLACEMENT_SURNAME = 'Thompson'
const BANNED_EMAIL = 'fuentezinaction@gmail.com'
const REPLACEMENT_EMAIL = 'qatestdirector2026+testparent@gmail.com'

let changeCount = 0

function logChange(table, id, field, oldVal, newVal) {
  changeCount++
  const prefix = DRY_RUN ? '[DRY RUN]' : '[CHANGED]'
  console.log(`  ${prefix} ${table}.${field} (id=${id}): "${oldVal}" -> "${newVal}"`)
}

async function main() {
  console.log(`\n=== QA Test Data Scrub ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'} ===\n`)

  // Look up QA Panthers org
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', QA_ORG_SLUG)
    .single()
  if (orgErr || !org) {
    console.error(`Could not find org "${QA_ORG_SLUG}":`, orgErr?.message)
    process.exit(1)
  }
  console.log(`Org: ${org.name} (${org.id})\n`)

  // Get all seasons for this org (to scope player queries)
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id')
    .eq('organization_id', org.id)
  const seasonIds = (seasons || []).map(s => s.id)

  if (seasonIds.length === 0) {
    console.log('No seasons found — nothing to scrub')
    return
  }

  // ---- 1. Players with "Fuentez" surname ----
  console.log('--- Checking players ---')
  const { data: fPlayers } = await supabase
    .from('players')
    .select('id, first_name, last_name, parent_name, parent_email')
    .in('season_id', seasonIds)
    .ilike('last_name', '%fuentez%')

  for (const p of (fPlayers || [])) {
    logChange('players', p.id, 'last_name', p.last_name, REPLACEMENT_SURNAME)
    if (!DRY_RUN) {
      await supabase.from('players').update({ last_name: REPLACEMENT_SURNAME }).eq('id', p.id)
    }
  }

  // ---- 2. Players with parent_name containing "Fuentez" ----
  console.log('\n--- Checking player parent_name ---')
  const { data: pnPlayers } = await supabase
    .from('players')
    .select('id, parent_name, parent_email')
    .in('season_id', seasonIds)
    .ilike('parent_name', '%fuentez%')

  for (const p of (pnPlayers || [])) {
    const newName = p.parent_name.replace(/fuentez/gi, REPLACEMENT_SURNAME)
    logChange('players', p.id, 'parent_name', p.parent_name, newName)
    if (!DRY_RUN) {
      await supabase.from('players').update({ parent_name: newName }).eq('id', p.id)
    }
  }

  // ---- 3. Players with banned email in parent_email ----
  console.log('\n--- Checking player parent_email ---')
  const { data: ePlayers } = await supabase
    .from('players')
    .select('id, parent_email, parent_name')
    .in('season_id', seasonIds)
    .ilike('parent_email', `%${BANNED_EMAIL}%`)

  for (const p of (ePlayers || [])) {
    logChange('players', p.id, 'parent_email', p.parent_email, REPLACEMENT_EMAIL)
    if (!DRY_RUN) {
      await supabase.from('players').update({ parent_email: REPLACEMENT_EMAIL }).eq('id', p.id)
    }
  }

  // ---- 4. Families with "Fuentez" in name or contact fields ----
  console.log('\n--- Checking families ---')
  const { data: allFamilies } = await supabase
    .from('families')
    .select('id, name, primary_email, primary_contact_name, primary_contact_email, secondary_contact_name, secondary_contact_email')

  for (const f of (allFamilies || [])) {
    // Check name
    if (f.name && /fuentez/i.test(f.name)) {
      const newName = f.name.replace(/fuentez/gi, REPLACEMENT_SURNAME)
      logChange('families', f.id, 'name', f.name, newName)
      if (!DRY_RUN) {
        await supabase.from('families').update({ name: newName }).eq('id', f.id)
      }
    }
    // Check primary_contact_name
    if (f.primary_contact_name && /fuentez/i.test(f.primary_contact_name)) {
      const newName = f.primary_contact_name.replace(/fuentez/gi, REPLACEMENT_SURNAME)
      logChange('families', f.id, 'primary_contact_name', f.primary_contact_name, newName)
      if (!DRY_RUN) {
        await supabase.from('families').update({ primary_contact_name: newName }).eq('id', f.id)
      }
    }
    // Check primary_email
    if (f.primary_email && f.primary_email.toLowerCase() === BANNED_EMAIL) {
      logChange('families', f.id, 'primary_email', f.primary_email, REPLACEMENT_EMAIL)
      if (!DRY_RUN) {
        await supabase.from('families').update({ primary_email: REPLACEMENT_EMAIL }).eq('id', f.id)
      }
    }
    // Check primary_contact_email
    if (f.primary_contact_email && f.primary_contact_email.toLowerCase() === BANNED_EMAIL) {
      logChange('families', f.id, 'primary_contact_email', f.primary_contact_email, REPLACEMENT_EMAIL)
      if (!DRY_RUN) {
        await supabase.from('families').update({ primary_contact_email: REPLACEMENT_EMAIL }).eq('id', f.id)
      }
    }
    // Check secondary_contact_name
    if (f.secondary_contact_name && /fuentez/i.test(f.secondary_contact_name)) {
      const newName = f.secondary_contact_name.replace(/fuentez/gi, REPLACEMENT_SURNAME)
      logChange('families', f.id, 'secondary_contact_name', f.secondary_contact_name, newName)
      if (!DRY_RUN) {
        await supabase.from('families').update({ secondary_contact_name: newName }).eq('id', f.id)
      }
    }
    // Check secondary_contact_email
    if (f.secondary_contact_email && f.secondary_contact_email.toLowerCase() === BANNED_EMAIL) {
      logChange('families', f.id, 'secondary_contact_email', f.secondary_contact_email, REPLACEMENT_EMAIL)
      if (!DRY_RUN) {
        await supabase.from('families').update({ secondary_contact_email: REPLACEMENT_EMAIL }).eq('id', f.id)
      }
    }
  }

  // ---- 5. Profiles with "Fuentez" in full_name ----
  console.log('\n--- Checking profiles ---')
  const { data: fProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .ilike('full_name', '%fuentez%')

  for (const p of (fProfiles || [])) {
    // Only scrub if email is not the real admin email (safety)
    if (p.email === 'fuentez.carlos@gmail.com' || p.email === 'qatestdirector2026@gmail.com') {
      console.log(`  [SKIP] profiles.full_name (id=${p.id}): real admin account, not scrubbing`)
      continue
    }
    const newName = p.full_name.replace(/fuentez/gi, REPLACEMENT_SURNAME)
    logChange('profiles', p.id, 'full_name', p.full_name, newName)
    if (!DRY_RUN) {
      await supabase.from('profiles').update({ full_name: newName }).eq('id', p.id)
    }
  }

  // ---- 6. Payments with "Fuentez" in description or notes ----
  console.log('\n--- Checking payments ---')
  const { data: fPayments } = await supabase
    .from('payments')
    .select('id, description, notes, player_id')
    .in('season_id', seasonIds)

  for (const pay of (fPayments || [])) {
    if (pay.description && /fuentez/i.test(pay.description)) {
      const newDesc = pay.description.replace(/fuentez/gi, REPLACEMENT_SURNAME)
      logChange('payments', pay.id, 'description', pay.description, newDesc)
      if (!DRY_RUN) {
        await supabase.from('payments').update({ description: newDesc }).eq('id', pay.id)
      }
    }
    if (pay.notes && /fuentez/i.test(pay.notes)) {
      const newNotes = pay.notes.replace(/fuentez/gi, REPLACEMENT_SURNAME)
      logChange('payments', pay.id, 'notes', pay.notes, newNotes)
      if (!DRY_RUN) {
        await supabase.from('payments').update({ notes: newNotes }).eq('id', pay.id)
      }
    }
  }

  // ---- Summary ----
  console.log(`\n=== ${DRY_RUN ? 'DRY RUN' : 'SCRUB'} COMPLETE ===`)
  console.log(`Total changes: ${changeCount}`)
  if (DRY_RUN) {
    console.log('\nNo data was modified. Run without --dry-run to apply changes.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
