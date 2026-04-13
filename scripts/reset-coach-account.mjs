import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseKey) {
  console.error('Set SUPABASE_SERVICE_KEY env var (service role key, not anon key)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  // Find the user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Failed to list users:', listError.message)
    // Alternative: try direct query
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'QAcoach2@example.com')
      .maybeSingle()

    if (profile) {
      console.log('Found profile:', profile.id, profile.email)
      const { error } = await supabase.auth.admin.updateUserById(profile.id, {
        password: 'TestCoach2026!'
      })
      if (error) console.error('Password reset failed:', error.message)
      else console.log('Password reset SUCCESS for', profile.email)
    } else {
      console.log('No profile found for QAcoach2@example.com')
      console.log('Account may not exist — need to create it via coach invite flow')
    }
    return
  }

  const coach = users.find(u => u.email === 'QAcoach2@example.com' || u.email === 'qacoach2@example.com')
  if (!coach) {
    console.log('No auth account found for QAcoach2@example.com')
    console.log('Account may need to be created via the coach invite flow')
    return
  }

  console.log('Found auth user:', coach.id, coach.email)
  const { error } = await supabase.auth.admin.updateUserById(coach.id, {
    password: 'TestCoach2026!'
  })

  if (error) console.error('Password reset failed:', error.message)
  else console.log('Password reset SUCCESS — TestCoach2026!')
}

main().catch(console.error)
