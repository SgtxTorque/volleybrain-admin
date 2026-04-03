// =============================================================================
// InviteCoachModal — Invite coaches via email or shareable link
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { X, Copy, Link, Mail, Share2, UserPlus, ChevronDown } from 'lucide-react'
import { EmailService } from '../../lib/email-service'

const COACH_ROLES = [
  { value: 'head', label: 'Head Coach' },
  { value: 'assistant', label: 'Assistant Coach' },
  { value: 'manager', label: 'Manager' },
  { value: 'volunteer', label: 'Volunteer' },
]

export default function InviteCoachModal({ orgName, orgId, seasonName, seasonId, teams, onClose, onInviteSent, showToast }) {
  const { isDark } = useTheme()
  const { organization, profile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('assistant')
  const [teamId, setTeamId] = useState('')
  const [sending, setSending] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [messageCopied, setMessageCopied] = useState(false)

  const inviteLink = `thelynxapp.com/join/coach/${orgId}`

  const recruitmentMessage =
    `\u{1F3D0} We're looking for coaches! Join ${orgName} on Lynx \u2014 the app that makes running youth sports clubs easy. Apply here: ${inviteLink}`

  const inputCls = `w-full rounded-lg px-4 py-2.5 text-sm transition ${
    isDark
      ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500 focus:border-lynx-sky'
      : 'bg-white border border-lynx-silver text-lynx-navy placeholder-slate-400 focus:border-lynx-sky'
  } outline-none`

  const selectCls = `w-full rounded-lg px-4 py-2.5 text-sm transition ${
    isDark
      ? 'bg-white/[0.06] border border-white/[0.06] text-white focus:border-lynx-sky'
      : 'bg-white border border-lynx-silver text-lynx-navy focus:border-lynx-sky'
  } outline-none`

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      showToast?.('Invite link copied!', 'success')
      setTimeout(() => setLinkCopied(false), 2500)
    } catch {
      showToast?.('Failed to copy link', 'error')
    }
  }

  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(recruitmentMessage)
      setMessageCopied(true)
      showToast?.('Recruitment message copied!', 'success')
      setTimeout(() => setMessageCopied(false), 2500)
    } catch {
      showToast?.('Failed to copy message', 'error')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Coach Invite - ${orgName}`,
          text: recruitmentMessage,
        })
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
      }
    } else {
      handleCopyMessage()
    }
  }

  async function handleSendEmail() {
    if (!firstName.trim() || !lastName.trim()) {
      showToast?.('Please enter the coach\'s first and last name', 'error')
      return
    }
    if (!email.trim()) {
      showToast?.('Please enter an email address', 'error')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      showToast?.('Please enter a valid email address', 'error')
      return
    }

    setSending(true)

    const selectedTeam = teams?.find(t => t.id === teamId)

    // 1. Create a pending coach record with invite code
    const inviteCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

    const { data: pendingCoach, error: coachError } = await supabase
      .from('coaches')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        role: role,
        invite_status: 'invited',
        invite_email: email.trim(),
        invite_code: inviteCode,
        invited_at: new Date().toISOString(),
        invited_by: profile?.id || null,
        season_id: seasonId || null,
      })
      .select()
      .single()

    if (coachError) {
      console.error('Error creating pending coach record:', coachError)
      // Continue anyway — we'll still send the email with a generic link
    }

    // 2. Link to team if selected
    if (pendingCoach && teamId) {
      const { error: teamError } = await supabase.from('team_coaches').insert({
        coach_id: pendingCoach.id,
        team_id: teamId,
        role: role,
      })
      if (teamError) console.error('Error linking coach to team:', teamError)
    }

    // 3. Queue the invite email with the real invite URL
    const inviteUrl = pendingCoach
      ? `${window.location.origin}/invite/coach/${inviteCode}`
      : `${window.location.origin}/join/coach/${orgId || organization?.id}`

    const result = await EmailService.sendCoachInvite({
      recipientEmail: email.trim(),
      coachName: firstName.trim(),
      orgName: orgName || organization?.name || 'Our Club',
      orgId: orgId || organization?.id,
      orgLogoUrl: organization?.logo_url,
      senderName: profile?.full_name || orgName,
      seasonName: seasonName || null,
      teamName: selectedTeam?.name || null,
      role: COACH_ROLES.find(r => r.value === role)?.label || 'Coach',
      inviteLink: inviteUrl,
    })

    if (!result.success) {
      setSending(false)
      showToast?.('Failed to send invite email. The coach record was created but email failed.', 'error')
      onInviteSent?.()
      return
    }

    setSending(false)
    showToast?.(`Invite sent to ${firstName.trim()} (${email.trim()})!`, 'success')
    onInviteSent?.()
    setFirstName('')
    setLastName('')
    setEmail('')
    setRole('assistant')
    setTeamId('')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`${
          isDark
            ? 'bg-lynx-charcoal border border-white/[0.06]'
            : 'bg-white border border-lynx-silver'
        } rounded-xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${
            isDark ? 'border-white/[0.06]' : 'border-lynx-silver'
          } flex items-center justify-between sticky top-0 z-10 ${isDark ? 'bg-lynx-charcoal' : 'bg-white'}`}
        >
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
            Invite a Coach
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              isDark
                ? 'hover:bg-white/[0.04] text-slate-400'
                : 'hover:bg-lynx-frost text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Section 1: Coach Details */}
          <div>
            <label
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? 'text-slate-400' : 'text-lynx-slate'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Coach Details
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name *"
                className={inputCls}
              />
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name *"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={role} onChange={e => setRole(e.target.value)} className={selectCls}>
                {COACH_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <select value={teamId} onChange={e => setTeamId(e.target.value)} className={selectCls}>
                <option value="">No team yet</option>
                {(teams || []).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Email Invite */}
          <div>
            <label
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? 'text-slate-400' : 'text-lynx-slate'
              }`}
            >
              <Mail className="w-4 h-4" />
              Send Direct Invite
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                placeholder="coach@example.com *"
                className={`flex-1 ${inputCls}`}
              />
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className={`px-5 py-2.5 rounded-lg bg-lynx-navy text-white font-bold text-sm hover:brightness-110 transition whitespace-nowrap ${sending ? 'opacity-60 cursor-wait' : ''}`}
              >
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              A branded email invite will be sent from noreply@thelynxapp.com
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-silver'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              or share a link
            </span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-silver'}`} />
          </div>

          {/* Section 3: Shareable Link */}
          <div>
            <label
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? 'text-slate-400' : 'text-lynx-slate'
              }`}
            >
              <Link className="w-4 h-4" />
              Invite Link
            </label>
            <div className="flex gap-2">
              <div
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-mono truncate select-all ${
                  isDark
                    ? 'bg-white/[0.06] border border-white/[0.06] text-lynx-sky'
                    : 'bg-lynx-frost border border-lynx-silver text-lynx-navy'
                }`}
              >
                {inviteLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                  linkCopied
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : 'bg-lynx-navy text-white hover:brightness-110'
                }`}
              >
                <Copy className="w-4 h-4" />
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Section 4: Social Share / Recruitment Message */}
          <div>
            <label
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? 'text-slate-400' : 'text-lynx-slate'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Recruitment Message
            </label>
            <div
              className={`rounded-lg px-4 py-3 text-sm leading-relaxed mb-3 ${
                isDark
                  ? 'bg-white/[0.06] border border-white/[0.06] text-slate-300'
                  : 'bg-lynx-frost border border-lynx-silver text-lynx-navy'
              }`}
            >
              {recruitmentMessage}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyMessage}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition ${
                  messageCopied
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : isDark
                      ? 'bg-white/[0.06] border border-white/[0.06] text-white hover:bg-white/[0.1]'
                      : 'bg-white border border-lynx-silver text-lynx-navy hover:bg-lynx-frost'
                }`}
              >
                <Copy className="w-4 h-4" />
                {messageCopied ? 'Copied!' : 'Copy Message'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-lynx-navy text-white font-bold text-sm hover:brightness-110 transition"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t ${
            isDark ? 'border-white/[0.06]' : 'border-lynx-silver'
          }`}
        >
          <button
            onClick={onClose}
            className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
              isDark
                ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                : 'bg-lynx-frost text-lynx-navy hover:bg-lynx-silver'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
