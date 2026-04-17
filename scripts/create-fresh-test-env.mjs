import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseKey) {
  console.error('ERROR: Set SUPABASE_SERVICE_KEY env var (service role key from Supabase dashboard)')
  console.error('Find it at: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Generate 8-char uppercase invite code (matching generateInviteCode())
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function main() {
  console.log('🐾 Creating Fresh Lynx Test Environment...\n')

  // ═══════════════════════════════════════
  // STEP 1: Create Admin Auth Account
  // ═══════════════════════════════════════
  console.log('Step 1: Creating admin auth account...')

  const adminEmail = 'qa.admin.final@example.com'
  const adminPassword = 'Test1234'

  // Check if account already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail)

  let adminUserId
  if (existingAdmin) {
    console.log(`  Admin account already exists: ${existingAdmin.id}`)
    // Reset password to ensure we know it
    await supabase.auth.admin.updateUserById(existingAdmin.id, { password: adminPassword })
    console.log('  Password reset to Test1234')
    adminUserId = existingAdmin.id
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email verification
    })
    if (authError) {
      console.error('  Failed to create admin:', authError.message)
      process.exit(1)
    }
    adminUserId = authData.user.id
    console.log(`  Created: ${adminUserId}`)
  }

  // ═══════════════════════════════════════
  // STEP 2: Create Organization
  // ═══════════════════════════════════════
  console.log('\nStep 2: Creating organization...')

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'QA Final Verification Club',
      slug: 'qa-final-verification-' + Date.now().toString(36),
      contact_email: adminEmail,
      logo_url: null,
      settings: {
        short_name: 'QA Final',
        primary_color: '#10284C',
        secondary_color: '#4BB9EC',
        contact_name: 'QA Admin',
        phone: '(555) 999-0001',
        city: 'Little Elm',
        state: 'Texas',
        legal_name: 'QA Final Verification Club',
        enabled_sports: ['volleyball'],
        payment_methods: { cash: { enabled: true }, venmo: { enabled: true, handle: '@qa-test' } },
        default_registration_fee: 150,
        default_uniform_fee: 45,
        default_monthly_fee: 50,
        early_bird_discount: 25,
        sibling_discount: 10,
        setup_complete: true,
        setup_completed_at: new Date().toISOString(),
      }
    })
    .select()
    .single()

  if (orgError) {
    console.error('  Failed to create org:', orgError.message)
    process.exit(1)
  }
  console.log(`  Created: ${org.name} (${org.id})`)

  // ═══════════════════════════════════════
  // STEP 3: Create Admin Profile + Role
  // ═══════════════════════════════════════
  console.log('\nStep 3: Creating admin profile and role...')

  // Upsert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: adminUserId,
      email: adminEmail,
      full_name: 'QA Admin',
      current_organization_id: org.id,
      onboarding_completed: true,
    })

  if (profileError) console.error('  Profile error:', profileError.message)
  else console.log('  Profile created')

  // Grant admin role
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: adminUserId,
      organization_id: org.id,
      role: 'league_admin',
    }, { onConflict: 'user_id,organization_id,role' })

  if (roleError) console.error('  Role error:', roleError.message)
  else console.log('  Role granted: league_admin')

  // ═══════════════════════════════════════
  // STEP 4: Create Volleyball Program
  // ═══════════════════════════════════════
  console.log('\nStep 4: Creating volleyball program...')

  // Look up volleyball sport
  const { data: volleyballSport } = await supabase
    .from('sports')
    .select('id')
    .ilike('name', 'volleyball')
    .maybeSingle()

  const { data: program, error: programError } = await supabase
    .from('programs')
    .insert({
      organization_id: org.id,
      name: 'Volleyball',
      sport_id: volleyballSport?.id || null,
      description: 'Volleyball program',
      is_active: true,
    })
    .select()
    .single()

  if (programError) {
    console.error('  Failed to create program:', programError.message)
    process.exit(1)
  }
  console.log(`  Created: ${program.name} (${program.id})`)

  // ═══════════════════════════════════════
  // STEP 5: Create Season
  // ═══════════════════════════════════════
  console.log('\nStep 5: Creating season...')

  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .insert({
      organization_id: org.id,
      program_id: program.id,
      name: 'Spring 2026',
      status: 'active',
      start_date: '2026-04-20',
      end_date: '2026-06-15',
      fee_registration: 150,
      fee_uniform: 45,
      fee_monthly: 50,
      months_in_season: 3,
      registration_open: true,
      registration_opens: '2026-04-17',
      registration_closes: '2026-05-15',
    })
    .select()
    .single()

  if (seasonError) {
    console.error('  Failed to create season:', seasonError.message)
    process.exit(1)
  }
  console.log(`  Created: ${season.name} (${season.id})`)

  // ═══════════════════════════════════════
  // STEP 6: Create 2 Teams
  // ═══════════════════════════════════════
  console.log('\nStep 6: Creating teams...')

  const teams = [
    { name: 'QA Panthers 14U', age_group: '14U', max_roster: 12, skill_level: 'recreational' },
    { name: 'QA Panthers 16U', age_group: '16U', max_roster: 12, skill_level: 'competitive' },
  ]

  const createdTeams = []
  for (const team of teams) {
    const { data: t, error: tErr } = await supabase
      .from('teams')
      .insert({
        season_id: season.id,
        name: team.name,
        age_group: team.age_group,
        max_roster_size: team.max_roster,
        skill_level: team.skill_level,
        color: '#10284C',
      })
      .select()
      .single()

    if (tErr) console.error(`  Failed to create ${team.name}:`, tErr.message)
    else {
      console.log(`  Created: ${t.name} (${t.id})`)
      createdTeams.push(t)
    }
  }

  // ═══════════════════════════════════════
  // STEP 7: Create Coach Record (NO auth account)
  // ═══════════════════════════════════════
  console.log('\nStep 7: Creating coach record...')

  const coachInviteCode = generateInviteCode()
  const coachEmail = 'qa.coach.final@example.com'

  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .insert({
      season_id: season.id,
      first_name: 'QA',
      last_name: 'Coach',
      email: coachEmail,
      invite_email: coachEmail,
      invite_code: coachInviteCode,
      invite_status: 'invited',
      invited_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (coachError) {
    console.error('  Failed to create coach:', coachError.message)
  } else {
    console.log(`  Created: QA Coach (${coach.id})`)
    console.log(`  Invite code: ${coachInviteCode}`)

    // Assign coach to first team
    if (createdTeams[0]) {
      const { error: tcErr } = await supabase
        .from('team_coaches')
        .insert({
          team_id: createdTeams[0].id,
          coach_id: coach.id,
          role: 'head',
        })
      if (tcErr) console.error('  Team assignment error:', tcErr.message)
      else console.log(`  Assigned to: ${createdTeams[0].name}`)
    }
  }

  // ═══════════════════════════════════════
  // STEP 8: Create a Venue
  // ═══════════════════════════════════════
  console.log('\nStep 8: Creating venue...')

  const { error: venueError } = await supabase
    .from('venues')
    .insert({
      organization_id: org.id,
      name: 'QA Community Center',
      address: '123 Test Street',
      city: 'Little Elm',
      state: 'TX',
      zip: '75068',
      is_active: true,
    })

  if (venueError) console.error('  Venue error:', venueError.message)
  else console.log('  Created: QA Community Center')

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  console.log('\n' + '═'.repeat(50))
  console.log('🎉 TEST ENVIRONMENT READY')
  console.log('═'.repeat(50))
  console.log('')
  console.log('ORGANIZATION')
  console.log(`  Name: ${org.name}`)
  console.log(`  ID:   ${org.id}`)
  console.log(`  Slug: ${org.slug}`)
  console.log('')
  console.log('ADMIN ACCOUNT')
  console.log(`  Email:    ${adminEmail}`)
  console.log(`  Password: ${adminPassword}`)
  console.log(`  User ID:  ${adminUserId}`)
  console.log('')
  console.log('COACH (no auth account — enters invite code during signup)')
  console.log(`  Email:       ${coachEmail}`)
  console.log(`  Password:    Test1234 (coach creates this during signup)')`)
  console.log(`  Invite Code: ${coachInviteCode}`)
  console.log('')
  console.log('PARENT (created during registration testing)')
  console.log(`  Email:    qa.parent.final@example.com`)
  console.log(`  Password: Test1234 (parent creates this during registration)`)
  console.log('')
  console.log('PROGRAM')
  console.log(`  ${program.name} (${program.id})`)
  console.log('')
  console.log('SEASON')
  console.log(`  ${season.name} (${season.id})`)
  console.log(`  Registration open: ${season.registration_opens} → ${season.registration_closes}`)
  console.log('')
  console.log('TEAMS')
  createdTeams.forEach(t => console.log(`  ${t.name} (${t.id})`))
  console.log('')
  console.log('REGISTRATION URL')
  console.log(`  https://www.thelynxapp.com/register/${org.slug}/${season.id}`)
  console.log('')
  console.log('═'.repeat(50))
  console.log('Copy the output above and paste it into the Cowork verification spec.')
  console.log('═'.repeat(50))
}

main().catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})
