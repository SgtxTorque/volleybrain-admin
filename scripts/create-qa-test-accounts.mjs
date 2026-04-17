/**
 * create-qa-test-accounts.mjs
 *
 * Creates Coach and Parent QA test accounts for the QA Panthers Athletics org.
 * Uses Gmail subaddressing off qatestdirector2026@gmail.com so all emails
 * deliver to one inbox.
 *
 * REQUIREMENTS:
 *   - SUPABASE_SERVICE_ROLE_KEY env variable (or reads from .env in repo root)
 *   - Node 18+ (for top-level await)
 *
 * USAGE:
 *   node scripts/create-qa-test-accounts.mjs
 *
 * This script is idempotent — it checks for existing accounts before creating.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ---- Config ----
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
  } catch { /* .env not found, rely on environment */ }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Set SUPABASE_SERVICE_ROLE_KEY in your environment or .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ---- Account definitions ----
const QA_ORG_SLUG = 'qa-panthers-athletics-mnifyrk3'

const COACH_ACCOUNT = {
  email: 'qatestdirector2026+coach@gmail.com',
  password: 'TestCoach2026!',
  firstName: 'Coach',
  lastName: 'Martinez',
  displayName: 'Coach Martinez',
  role: 'head_coach',
}

const PARENT_ACCOUNT = {
  email: 'qatestdirector2026+parent@gmail.com',
  password: 'TestParent2026!',
  firstName: 'Sofia',
  lastName: 'Torres',
  displayName: 'Sofia Torres',
  role: 'parent',
}

// ---- Helpers ----
async function lookupOrg() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', QA_ORG_SLUG)
    .single()
  if (error || !data) {
    console.error(`Could not find org with slug "${QA_ORG_SLUG}":`, error?.message)
    process.exit(1)
  }
  console.log(`  Org: ${data.name} (${data.id})`)
  return data
}

async function lookupSeason(orgId) {
  const { data, error } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error || !data) {
    console.error('Could not find season for org:', error?.message)
    process.exit(1)
  }
  console.log(`  Season: ${data.name} (${data.id})`)
  return data
}

async function lookupTeams(seasonId) {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .eq('season_id', seasonId)
    .order('name')
  if (error) {
    console.error('Could not load teams:', error.message)
    process.exit(1)
  }
  console.log(`  Teams: ${(data || []).map(t => t.name).join(', ')}`)
  return data || []
}

async function lookupPlayers(seasonId) {
  const { data } = await supabase
    .from('players')
    .select('id, first_name, last_name, parent_email, parent_account_id')
    .eq('season_id', seasonId)
    .order('last_name')
  return data || []
}

async function createOrGetAuthUser(email, password, firstName, lastName) {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users?.find(u => u.email === email)
  if (found) {
    console.log(`  Auth user already exists: ${email} (${found.id})`)
    return found
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` }
  })
  if (error) {
    console.error(`  Failed to create auth user ${email}:`, error.message)
    return null
  }
  console.log(`  Created auth user: ${email} (${data.user.id})`)
  return data.user
}

async function upsertProfile(userId, email, fullName, role, orgId) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
    role,
    primary_role: role,
    current_organization_id: orgId,
    onboarding_completed: true,
    onboarding_complete: true,
  })
  if (error) {
    console.error(`  Failed to upsert profile:`, error.message)
    return false
  }
  console.log(`  Profile upserted: ${fullName}`)
  return true
}

async function ensureUserRole(userId, orgId, role) {
  // Check if role exists
  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('role', role)
    .maybeSingle()
  if (existing) {
    console.log(`  User role already exists: ${role}`)
    return true
  }

  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    organization_id: orgId,
    role,
    is_active: true,
    granted_at: new Date().toISOString(),
  })
  if (error) {
    console.error(`  Failed to insert user_role:`, error.message)
    return false
  }
  console.log(`  User role created: ${role}`)
  return true
}

// ---- Main ----
async function main() {
  console.log('\n=== QA Test Account Creator ===\n')
  console.log('Looking up QA Panthers Athletics...')
  const org = await lookupOrg()
  const season = await lookupSeason(org.id)
  const teams = await lookupTeams(season.id)
  const players = await lookupPlayers(season.id)

  // Pick the first team for coach assignment
  const targetTeam = teams[0]
  if (!targetTeam) {
    console.error('No teams found in season — cannot assign coach')
    process.exit(1)
  }

  // ---- COACH ----
  console.log('\n--- Creating Coach Account ---')
  const coachUser = await createOrGetAuthUser(
    COACH_ACCOUNT.email, COACH_ACCOUNT.password,
    COACH_ACCOUNT.firstName, COACH_ACCOUNT.lastName
  )
  if (!coachUser) { console.error('Aborting coach setup'); process.exit(1) }

  await upsertProfile(coachUser.id, COACH_ACCOUNT.email, COACH_ACCOUNT.displayName, 'coach', org.id)
  await ensureUserRole(coachUser.id, org.id, COACH_ACCOUNT.role)

  // Create coaches row
  const { data: existingCoach } = await supabase
    .from('coaches')
    .select('id')
    .eq('profile_id', coachUser.id)
    .eq('season_id', season.id)
    .maybeSingle()

  let coachRowId = existingCoach?.id
  if (!coachRowId) {
    const { data: newCoach, error } = await supabase.from('coaches').insert({
      profile_id: coachUser.id,
      season_id: season.id,
      first_name: COACH_ACCOUNT.firstName,
      last_name: COACH_ACCOUNT.lastName,
      email: COACH_ACCOUNT.email,
      status: 'active',
      invite_status: 'active',
      invite_accepted_at: new Date().toISOString(),
    }).select('id').single()
    if (error) {
      console.error('  Failed to create coaches row:', error.message)
    } else {
      coachRowId = newCoach.id
      console.log(`  Coaches row created: ${coachRowId}`)
    }
  } else {
    console.log(`  Coaches row already exists: ${coachRowId}`)
  }

  // Assign to team
  if (coachRowId) {
    const { data: existingTC } = await supabase
      .from('team_coaches')
      .select('id')
      .eq('coach_id', coachRowId)
      .eq('team_id', targetTeam.id)
      .maybeSingle()
    if (!existingTC) {
      const { error } = await supabase.from('team_coaches').insert({
        coach_id: coachRowId,
        team_id: targetTeam.id,
        role: 'head',
      })
      if (error) console.error('  Failed to assign coach to team:', error.message)
      else console.log(`  Coach assigned to ${targetTeam.name} as head coach`)
    } else {
      console.log(`  Coach already assigned to ${targetTeam.name}`)
    }
  }

  // ---- PARENT ----
  console.log('\n--- Creating Parent Account ---')
  const parentUser = await createOrGetAuthUser(
    PARENT_ACCOUNT.email, PARENT_ACCOUNT.password,
    PARENT_ACCOUNT.firstName, PARENT_ACCOUNT.lastName
  )
  if (!parentUser) { console.error('Aborting parent setup'); process.exit(1) }

  await upsertProfile(parentUser.id, PARENT_ACCOUNT.email, PARENT_ACCOUNT.displayName, 'parent', org.id)
  await ensureUserRole(parentUser.id, org.id, PARENT_ACCOUNT.role)

  // Create families row
  const { data: existingFamily } = await supabase
    .from('families')
    .select('id')
    .eq('account_id', parentUser.id)
    .maybeSingle()

  if (!existingFamily) {
    const { error } = await supabase.from('families').insert({
      name: `${PARENT_ACCOUNT.displayName} Family`,
      primary_email: PARENT_ACCOUNT.email,
      primary_contact_name: PARENT_ACCOUNT.displayName,
      primary_contact_email: PARENT_ACCOUNT.email,
      account_id: parentUser.id,
    })
    if (error) console.error('  Failed to create families row:', error.message)
    else console.log(`  Family created: ${PARENT_ACCOUNT.displayName} Family`)
  } else {
    console.log(`  Family already exists for parent`)
  }

  // Link to a player — pick the first player without a parent_account_id, or the first player
  const unlinked = players.find(p => !p.parent_account_id)
  const targetPlayer = unlinked || players[0]
  if (targetPlayer) {
    const { error } = await supabase
      .from('players')
      .update({
        parent_account_id: parentUser.id,
        parent_email: PARENT_ACCOUNT.email,
        parent_name: PARENT_ACCOUNT.displayName,
      })
      .eq('id', targetPlayer.id)
    if (error) {
      console.error(`  Failed to link parent to player:`, error.message)
    } else {
      console.log(`  Parent linked to player: ${targetPlayer.first_name} ${targetPlayer.last_name}`)
    }
  } else {
    console.log('  No players found to link parent to')
  }

  // ---- Summary ----
  console.log('\n=== Done! ===\n')
  console.log('Test Accounts:')
  console.log(`  Coach: ${COACH_ACCOUNT.email} / ${COACH_ACCOUNT.password}`)
  console.log(`  Parent: ${PARENT_ACCOUNT.email} / ${PARENT_ACCOUNT.password}`)
  console.log(`\nAll emails deliver to: qatestdirector2026@gmail.com`)
  console.log(`Coach assigned to team: ${targetTeam.name}`)
  if (targetPlayer) {
    console.log(`Parent linked to player: ${targetPlayer.first_name} ${targetPlayer.last_name}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
