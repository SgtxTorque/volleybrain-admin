import { supabase } from './supabase'

// =============================================================================
// PLAYER PASS — Utility library for PIN-based player access
// =============================================================================
// Tier 1: Parent creates username + 4-digit PIN for child (under 13, no email)
// Auth: Supabase account with generated email, PIN-derived password
// COPPA: Parent's authenticated session = verifiable parental consent
// =============================================================================

// ── PIN Hashing (Web Crypto API) ──────────────────────────────────────────────

export async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin, storedHash) {
  const inputHash = await hashPin(pin)
  return inputHash === storedHash
}

// ── Auth Password Derivation ──────────────────────────────────────────────────
// The Supabase auth password is derived from PIN + player UUID.
// The user never sees this — they only enter their 4-digit PIN.

export function deriveAuthPassword(pin, playerId) {
  return `LYNX_PLAYER_${pin}_${playerId}`
}

// ── Username Utilities ────────────────────────────────────────────────────────

export function suggestUsername(firstName, lastName) {
  const clean = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
  const first = clean(firstName)
  const last = clean(lastName)
  if (first && last) return `${first}.${last}`
  return first || last || 'player'
}

export function validateUsername(username) {
  if (!username || username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 30) return 'Username must be 30 characters or less'
  if (!/^[a-z0-9._]+$/.test(username)) return 'Only letters, numbers, dots, and underscores allowed'
  if (username.startsWith('.') || username.endsWith('.')) return 'Cannot start or end with a dot'
  return null
}

// ── PIN Validation ────────────────────────────────────────────────────────────

export function validatePin(pin) {
  if (!pin || pin.length !== 4) return 'PIN must be exactly 4 digits'
  if (!/^\d{4}$/.test(pin)) return 'PIN must contain only numbers'
  if (/^(\d)\1{3}$/.test(pin)) return 'PIN cannot be all the same digit (e.g., 1111)'
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return 'PIN cannot be a simple sequence (e.g., 1234)'
  return null
}

// ── Username Availability ─────────────────────────────────────────────────────

export async function checkUsernameAvailable(username, seasonId, excludePlayerId = null) {
  let query = supabase
    .from('players')
    .select('id')
    .eq('player_username', username.toLowerCase())
    .eq('season_id', seasonId)
    .eq('player_account_enabled', true)

  if (excludePlayerId) {
    query = query.neq('id', excludePlayerId)
  }

  const { data } = await query.maybeSingle()
  return !data
}

// ── Age Calculation ───────────────────────────────────────────────────────────

export function calculateAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// ── Create Player Pass ────────────────────────────────────────────────────────
// Called from parent dashboard. Creates a Supabase auth account, links it to
// the player record, grants 'player' role, and records COPPA consent.

export async function createPlayerPass({
  playerId,
  playerName,
  username,
  pin,
  seasonId,
  organizationId,
  parentProfileId,
}) {
  // 1. Hash the PIN for storage
  const hashedPin = await hashPin(pin)

  // 2. Generate auth credentials
  const authEmail = `${username.toLowerCase()}.player@thelynxapp.com`
  const authPassword = deriveAuthPassword(pin, playerId)

  // 3. Create Supabase auth account via Edge Function (needs service role)
  const { data: authResult, error: authError } = await supabase.functions.invoke('create-player-account', {
    body: {
      email: authEmail,
      password: authPassword,
      playerName,
      playerId,
      organizationId,
    }
  })

  if (authError || !authResult?.userId) {
    throw new Error(authError?.message || authResult?.error || 'Failed to create player account')
  }

  const userId = authResult.userId

  // 4. Update player record with pass info
  const { error: playerError } = await supabase
    .from('players')
    .update({
      player_username: username.toLowerCase(),
      player_pin: hashedPin,
      player_account_enabled: true,
      profile_id: userId,
    })
    .eq('id', playerId)

  if (playerError) throw playerError

  // 5. Create profile for the player auth user with COPPA consent
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: authEmail,
      full_name: playerName,
      account_type: 'player_child',
      parent_profile_id: parentProfileId,
      coppa_consent_given: true,
      coppa_consent_date: new Date().toISOString(),
      current_organization_id: organizationId,
      onboarding_completed: true,
    }, { onConflict: 'id' })

  if (profileError) throw profileError

  // 6. Grant player role
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      organization_id: organizationId,
      role: 'player',
      is_active: true,
      granted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,organization_id,role' })

  if (roleError) throw roleError

  return { userId, username: username.toLowerCase(), authEmail }
}

// ── Revoke Player Pass ────────────────────────────────────────────────────────
// Disables login without deleting the account. Can be re-enabled.

export async function revokePlayerPass(playerId) {
  const { error } = await supabase
    .from('players')
    .update({ player_account_enabled: false })
    .eq('id', playerId)

  if (error) throw error
}

// ── Re-enable Player Pass ─────────────────────────────────────────────────────

export async function reenablePlayerPass(playerId) {
  const { error } = await supabase
    .from('players')
    .update({ player_account_enabled: true })
    .eq('id', playerId)

  if (error) throw error
}

// ── Change Player PIN ─────────────────────────────────────────────────────────

export async function changePlayerPin(playerId, newPin) {
  const hashedPin = await hashPin(newPin)

  // Get the player record to derive new auth password
  const { data: player } = await supabase
    .from('players')
    .select('id, profile_id, player_username')
    .eq('id', playerId)
    .single()

  if (!player?.profile_id) throw new Error('Player does not have an active Player Pass')

  // Update PIN hash on player record
  const { error: pinError } = await supabase
    .from('players')
    .update({ player_pin: hashedPin })
    .eq('id', playerId)

  if (pinError) throw pinError

  // Update Supabase auth password via Edge Function
  const newAuthPassword = deriveAuthPassword(newPin, playerId)
  const { error: authError } = await supabase.functions.invoke('update-player-password', {
    body: {
      userId: player.profile_id,
      newPassword: newAuthPassword,
    }
  })

  if (authError) throw authError
}
