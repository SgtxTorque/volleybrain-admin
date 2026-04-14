import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var (Supabase Dashboard > Settings > API > service_role)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const KNOWN_SPORTS = {
  volleyball:  { code: 'volleyball',  icon: '\ud83c\udfd0', color: '#FFB800' },
  basketball:  { code: 'basketball',  icon: '\ud83c\udfc0', color: '#EF6C00' },
  soccer:      { code: 'soccer',      icon: '\u26bd',       color: '#2E7D32' },
  baseball:    { code: 'baseball',    icon: '\u26be',       color: '#C62828' },
  softball:    { code: 'softball',    icon: '\ud83e\udd4e', color: '#E91E63' },
  football:    { code: 'football',    icon: '\ud83c\udfc8', color: '#6A1B9A' },
  lacrosse:    { code: 'lacrosse',    icon: '\ud83e\udd4d', color: '#00838F' },
}

async function backfill(dryRun = true) {
  console.log(`\n=== Sport Records Backfill (${dryRun ? 'DRY RUN' : 'LIVE'}) ===\n`)

  // 1. Get all organizations
  const { data: orgs, error: oErr } = await supabase.from('organizations').select('id, name, settings')
  if (oErr) { console.error('Error:', oErr); return }

  // 2. Get all existing sport records
  const { data: existingSports } = await supabase.from('sports').select('id, organization_id, code, name')
  const sportLookup = new Map()
  for (const s of existingSports || []) {
    sportLookup.set(`${s.organization_id}:${s.code}`, s)
  }

  // 3. Get all programs
  const { data: programs } = await supabase.from('programs').select('id, organization_id, sport_id, name')

  let created = 0, linked = 0, skipped = 0

  for (const org of orgs || []) {
    // Determine which sports this org needs from:
    // a) org.settings.enabled_sports array
    // b) program names that match known sports
    const enabledSports = org.settings?.enabled_sports || []
    const orgPrograms = (programs || []).filter(p => p.organization_id === org.id)

    // Collect all sport codes this org should have
    const neededSports = new Set()

    // From enabled_sports setting
    for (const sport of enabledSports) {
      const code = sport.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (KNOWN_SPORTS[code]) neededSports.add(code)
    }

    // From program names
    for (const prog of orgPrograms) {
      const nameLower = prog.name.toLowerCase()
      for (const code of Object.keys(KNOWN_SPORTS)) {
        if (nameLower.includes(code)) neededSports.add(code)
      }
    }

    if (neededSports.size === 0) {
      skipped++
      continue
    }

    console.log(`\nOrg: ${org.name} (${org.id})`)
    console.log(`  Needs sports: ${[...neededSports].join(', ')}`)

    let sortOrder = 0
    for (const code of neededSports) {
      const key = `${org.id}:${code}`
      let sportRecord = sportLookup.get(key)

      // Create sport record if missing
      if (!sportRecord) {
        const meta = KNOWN_SPORTS[code]
        const name = code.charAt(0).toUpperCase() + code.slice(1)
        console.log(`  ${dryRun ? 'WOULD CREATE' : 'CREATING'}: ${name} (code: ${code})`)

        if (!dryRun) {
          const { data: newSport, error } = await supabase
            .from('sports')
            .insert({
              organization_id: org.id,
              code: meta.code,
              name: name,
              icon: meta.icon,
              color_primary: meta.color,
              is_active: true,
              sort_order: sortOrder,
            })
            .select('id, organization_id, code, name')
            .single()

          if (error) {
            console.error(`  ERROR creating ${name}:`, error.message)
            console.error(`  Full error:`, JSON.stringify(error))
            continue
          }
          sportRecord = newSport
          sportLookup.set(key, newSport)
        }
        created++
        sortOrder++
      }

      // Link orphaned programs to this sport
      if (sportRecord) {
        for (const prog of orgPrograms) {
          if (prog.sport_id) continue // already linked
          const nameLower = prog.name.toLowerCase()
          if (!nameLower.includes(code)) continue

          console.log(`  ${dryRun ? 'WOULD LINK' : 'LINKING'}: program "${prog.name}" -> ${sportRecord.name}`)
          if (!dryRun) {
            const { error } = await supabase
              .from('programs')
              .update({ sport_id: sportRecord.id })
              .eq('id', prog.id)
            if (error) console.error(`  ERROR linking:`, error.message)
          }
          linked++
        }
      }
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Sports ${dryRun ? 'would create' : 'created'}: ${created}`)
  console.log(`Programs ${dryRun ? 'would link' : 'linked'}: ${linked}`)
  console.log(`Orgs skipped (no known sports): ${skipped}`)
  if (dryRun && (created > 0 || linked > 0)) {
    console.log(`\nTo apply: SUPABASE_SERVICE_ROLE_KEY=xxx DRY_RUN=false node src/scripts/backfill-sport-records.js`)
  }
}

const dryRun = process.env.DRY_RUN !== 'false'
backfill(dryRun)
