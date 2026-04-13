import { supabase } from './supabase'

/**
 * Generate a short, readable invite code for coaches.
 * 8 characters, uppercase alphanumeric (no I, O, 0, 1 to avoid confusion).
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate a short, readable invite code for teams.
 * 6 characters, uppercase alphanumeric (no I, O, 0, 1 to avoid confusion).
 */
export function generateTeamInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate a secure invite token (longer, for email magic links).
 * 40 chars hex — more secure than 8-char readable code.
 */
export function generateInviteToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}

/**
 * Create a unified invitation record in the invitations table.
 * Expires any existing pending invitations for the same email + org + type.
 */
export async function createInvitation({
  organizationId,
  email,
  inviteType,      // 'coach', 'parent', 'role_elevation'
  role,            // 'coach', 'parent', 'team_manager'
  invitedBy,       // admin user ID
  teamId = null,
  playerId = null,
  coachId = null,
  metadata = {},
  expiresInHours = 72,  // 3-day default expiration
}) {
  const inviteCode = generateInviteToken()
  const expiresAt = expiresInHours > 0
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    : new Date().toISOString() // immediate (for role_elevation)

  // Expire any existing pending invitations for the same email + org + type
  await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('email', email.trim().toLowerCase())
    .eq('organization_id', organizationId)
    .eq('invite_type', inviteType)
    .eq('status', 'pending')

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: organizationId,
      email: email.trim().toLowerCase(),
      invite_type: inviteType,
      role,
      invite_code: inviteCode,
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: 'pending',
      team_id: teamId,
      player_id: playerId,
      coach_id: coachId,
      metadata,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Validate an invitation — check exists, pending, not expired.
 * Returns { valid, invite, reason }.
 */
export async function validateInvitation(inviteCode) {
  const { data: invite, error } = await supabase
    .from('invitations')
    .select('*, organizations(id, name, logo_url, slug, primary_color)')
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .maybeSingle()

  if (error) throw error
  if (!invite) return { valid: false, reason: 'Invitation not found or already used.' }

  // Check expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    // Mark as expired
    await supabase.from('invitations').update({ status: 'expired' }).eq('id', invite.id)
    return { valid: false, reason: 'This invitation has expired. Please ask for a new one.' }
  }

  return { valid: true, invite }
}

/**
 * Accept an invitation — atomic status update prevents double-accept.
 */
export async function acceptInvitation(inviteCode, userId) {
  const { data: invite, error } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
    })
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')  // Atomic check — prevents double-accept race condition
    .select()
    .single()

  if (error || !invite) {
    throw new Error('Could not accept invitation. It may have already been used.')
  }

  return invite
}

/**
 * Check if an email already has an account in profiles.
 * Returns the profile or null.
 */
export async function checkExistingAccount(email) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  return profile  // null if no account exists
}

/**
 * Grant a role to a user for an organization (upsert — safe to call multiple times).
 */
export async function grantRole(userId, organizationId, role) {
  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      organization_id: organizationId,
      role,
      is_active: true,
      granted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,organization_id,role' })

  if (error) throw error
}
