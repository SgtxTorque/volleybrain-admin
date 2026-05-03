// =============================================================================
// InviteCoParentModal — Invite a secondary parent/guardian for a player
// Used by admins (PlayerDetailModal) and primary parents (ParentDashboard)
// =============================================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { createInvitation } from '../../lib/invite-utils'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { UserPlus, X, Mail, User, Users, Shield, Loader2, Check } from 'lucide-react'

const RELATIONSHIPS = [
  { value: 'parent', label: 'Parent' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'stepparent', label: 'Stepparent' },
  { value: 'other', label: 'Other' },
]

export default function InviteCoParentModal({
  playerIds = [],       // array of player IDs to grant access to
  playerNames = [],     // array of player display names
  familyId = null,      // optional family ID for pre-fill
  organizationId,
  onClose,
  showToast,
}) {
  const { profile } = useAuth()
  const { isDark } = useTheme()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [loading, setLoading] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [existingSecondary, setExistingSecondary] = useState(null)

  // Pre-fill from family secondary contact
  useEffect(() => {
    async function prefill() {
      if (!familyId) return
      setPrefillLoading(true)
      const { data: family } = await supabase
        .from('families')
        .select('secondary_contact_name, secondary_contact_email, secondary_contact_phone')
        .eq('id', familyId)
        .maybeSingle()
      if (family?.secondary_contact_email) {
        setEmail(family.secondary_contact_email)
        setName(family.secondary_contact_name || '')
      }
      setPrefillLoading(false)
    }

    async function checkExisting() {
      if (!playerIds.length) return
      const { data } = await supabase
        .from('player_parents')
        .select('*, profiles:parent_id(id, full_name, email, phone)')
        .eq('player_id', playerIds[0])
        .eq('is_primary', false)
      if (data?.length > 0) {
        setExistingSecondary(data[0])
      }
    }

    prefill()
    checkExisting()
  }, [familyId, playerIds])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const invitation = await createInvitation({
        organizationId,
        email: email.trim(),
        inviteType: 'parent',
        role: 'parent',
        invitedBy: profile?.id,
        metadata: {
          playerIds,
          isSecondary: true,
          relationship,
          familyId,
          inviterName: profile?.full_name || 'Admin',
        },
      })

      // Send invite email via Resend edge function
      const inviteUrl = `${window.location.origin}/invite/parent/${invitation.invite_code}`
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: email.trim(),
            subject: `You've been invited to Lynx`,
            html: `
              <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
                <div style="background: #10284C; padding: 32px; border-radius: 14px 14px 0 0; text-align: center;">
                  <h1 style="color: white; font-size: 22px; margin: 0;">You're Invited!</h1>
                  <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 8px;">
                    ${name ? name + ', you' : 'You'} have been invited as a ${relationship} for ${playerNames.join(' & ')} on Lynx.
                  </p>
                </div>
                <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px;">
                  <p style="color: #64748b; font-size: 14px;">
                    Click the button below to create your account and start tracking schedules, payments, and more.
                  </p>
                  <a href="${inviteUrl}" style="display: block; text-align: center; background: #10284C; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 20px;">
                    Accept Invitation
                  </a>
                  <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
                    This link expires in 72 hours.
                  </p>
                </div>
              </div>
            `,
          },
        })
      } catch {
        // Email send failure is non-blocking — invitation is still created
        console.warn('Email send failed, but invitation was created')
      }

      setSent(true)
      showToast?.(`Invitation sent to ${email.trim()}`, 'success')
    } catch (err) {
      setError(err.message || 'Failed to send invitation')
    }
    setLoading(false)
  }

  async function handleRevoke() {
    if (!existingSecondary) return
    const confirm = window.confirm(`Remove ${existingSecondary.profiles?.full_name || 'this person'}'s access to this player?`)
    if (!confirm) return

    setLoading(true)
    try {
      await supabase.from('player_parents')
        .delete()
        .eq('id', existingSecondary.id)
      setExistingSecondary(null)
      showToast?.('Access revoked', 'success')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const cardBg = isDark ? 'bg-lynx-navy border-white/[0.06]' : 'bg-white border-slate-200'
  const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition ${
    isDark
      ? 'bg-lynx-midnight border-white/[0.06] text-white placeholder-slate-500 focus:border-lynx-sky'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-lynx-sky focus:ring-2 focus:ring-lynx-sky/20'
  }`

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
      <div className={`${cardBg} border rounded-[14px] w-full max-w-md shadow-2xl`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between" style={{ background: '#10284C', borderRadius: '14px 14px 0 0' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Invite Co-Parent</h2>
              <p className="text-sm text-white/60">{playerNames.join(' & ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          {sent ? (
            // Success state
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Invitation Sent!</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                An invite link has been sent to <strong>{email}</strong>. They'll be able to see {playerNames.join(' & ')}'s data once they accept.
              </p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl bg-lynx-sky text-white font-bold text-sm hover:bg-lynx-sky/90 transition">
                Done
              </button>
            </div>
          ) : existingSecondary ? (
            // Existing secondary parent
            <div>
              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-lynx-midnight' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lynx-sky/15 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-lynx-sky" />
                  </div>
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {existingSecondary.profiles?.full_name || 'Secondary Parent'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {existingSecondary.profiles?.email || ''} — {existingSecondary.relationship || 'parent'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRevoke}
                disabled={loading}
                className="w-full py-3 rounded-xl border-2 border-red-300 text-red-500 font-bold text-sm hover:bg-red-50 transition disabled:opacity-50"
              >
                {loading ? 'Revoking...' : 'Revoke Access'}
              </button>
              <div className="mt-4 pt-4 border-t border-slate-200/10">
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`}>Or invite another family member:</p>
                <button
                  onClick={() => setExistingSecondary(null)}
                  className="w-full py-2.5 rounded-xl bg-lynx-sky/10 text-lynx-sky font-bold text-sm hover:bg-lynx-sky/20 transition"
                >
                  + Invite Another
                </button>
              </div>
            </div>
          ) : (
            // Invite form
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="coparent@email.com"
                    required
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Name (optional)
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                  className={inputCls}
                >
                  {RELATIONSHIPS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {playerNames.length > 1 && (
                <div className={`rounded-xl p-3 ${isDark ? 'bg-lynx-midnight' : 'bg-blue-50'}`}>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-blue-600'}`}>
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    This person will have access to all {playerNames.length} children: {playerNames.join(', ')}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || prefillLoading}
                className="w-full py-3.5 rounded-xl bg-[#10284C] text-white font-bold text-sm hover:bg-[#1a3a6b] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send Invitation
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
