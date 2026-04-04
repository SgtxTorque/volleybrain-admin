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
