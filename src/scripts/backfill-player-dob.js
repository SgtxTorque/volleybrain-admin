import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var (Supabase Dashboard > Settings > API > service_role)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function backfillPlayerDOB(dryRun = true) {
  console.log(`\n=== Player DOB Backfill (${dryRun ? 'DRY RUN' : 'LIVE'}) ===\n`)

  // 1. Get all players missing DOB
  const { data: players, error: pErr } = await supabase
    .from('players')
    .select('id, first_name, last_name, date_of_birth, gender, season_id')
    .is('date_of_birth', null)

  if (pErr) { console.error('Error fetching players:', pErr); return }
  console.log(`Found ${players?.length || 0} players with missing DOB\n`)

  if (!players?.length) { console.log('Nothing to backfill.'); return }

  // 2. Get registrations with registration_data
  const { data: registrations, error: rErr } = await supabase
    .from('registrations')
    .select('id, player_id, season_id, registration_data')

  if (rErr) { console.error('Error fetching registrations:', rErr); return }

  // Build lookup: player_id -> registration_data
  const regLookup = new Map()
  for (const reg of registrations || []) {
    if (reg.player_id && reg.registration_data) {
      regLookup.set(reg.player_id, reg.registration_data)
    }
  }

  let fixedDOB = 0
  let fixedGender = 0
  let skipped = 0

  for (const player of players) {
    const regData = regLookup.get(player.id)
    if (!regData) {
      skipped++
      continue
    }

    // Extract DOB from registration_data
    // Could be at regData.player.birth_date, regData.birth_date, or nested in children array
    let dob = regData.player?.birth_date
      || regData.player?.date_of_birth
      || regData.birth_date
      || regData.date_of_birth
      || null

    // Check children array if present
    if (!dob && regData.children && Array.isArray(regData.children)) {
      for (const child of regData.children) {
        if (child.first_name?.toLowerCase() === player.first_name?.toLowerCase()) {
          dob = child.birth_date || child.date_of_birth || null
          break
        }
      }
    }

    let gender = null
    if (!player.gender) {
      gender = regData.player?.gender || regData.gender || null
      if (!gender && regData.children && Array.isArray(regData.children)) {
        for (const child of regData.children) {
          if (child.first_name?.toLowerCase() === player.first_name?.toLowerCase()) {
            gender = child.gender || null
            break
          }
        }
      }
    }

    if (!dob && !gender) {
      console.log(`  SKIP: ${player.first_name} ${player.last_name} — no DOB or gender found in registration_data`)
      skipped++
      continue
    }

    const updates = {}
    if (dob) {
      updates.date_of_birth = dob
      console.log(`  ${dryRun ? 'WOULD SET' : 'SETTING'} DOB: ${player.first_name} ${player.last_name} → ${dob}`)
      fixedDOB++
    }
    if (gender) {
      updates.gender = gender
      console.log(`  ${dryRun ? 'WOULD SET' : 'SETTING'} Gender: ${player.first_name} ${player.last_name} → ${gender}`)
      fixedGender++
    }

    if (!dryRun && Object.keys(updates).length > 0) {
      const { error } = await supabase.from('players').update(updates).eq('id', player.id)
      if (error) console.error(`  ERROR updating ${player.first_name}:`, error.message)
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`DOB ${dryRun ? 'would fix' : 'fixed'}: ${fixedDOB}`)
  console.log(`Gender ${dryRun ? 'would fix' : 'fixed'}: ${fixedGender}`)
  console.log(`Skipped (no registration data found): ${skipped}`)
  if (dryRun && (fixedDOB > 0 || fixedGender > 0)) {
    console.log(`\nTo apply: SUPABASE_SERVICE_ROLE_KEY=xxx DRY_RUN=false node src/scripts/backfill-player-dob.js`)
  }
}

const dryRun = process.env.DRY_RUN !== 'false'
backfillPlayerDOB(dryRun)
