// =============================================================================
// InviteCoachModal — Invite coaches via email or shareable link
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { X, Copy, Link, Mail, Share2 } from 'lucide-react'
import { EmailService } from '../../lib/email-service'

export default function InviteCoachModal({ orgName, orgId, onClose, showToast }) {
  const { isDark } = useTheme()
  const { organization, profile } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [messageCopied, setMessageCopied] = useState(false)

  const inviteLink = `thelynxapp.com/join/coach/${orgId}`

  const recruitmentMessage =
    `\u{1F3D0} We're looking for coaches! Join ${orgName} on Lynx \u2014 the app that makes running youth sports clubs easy. Apply here: ${inviteLink}`

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
        // User cancelled — ignore AbortError
        if (e.name !== 'AbortError') console.error(e)
      }
    } else {
      // Fallback: copy the recruitment message
      handleCopyMessage()
    }
  }

  async function handleSendEmail() {
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
    const result = await EmailService.sendCoachInvite({
      recipientEmail: email.trim(),
      orgName: orgName || organization?.name || 'Our Club',
      orgId: orgId || organization?.id,
      orgLogoUrl: organization?.logo_url,
      senderName: profile?.full_name || orgName,
    })
    setSending(false)
    if (result.success) {
      showToast?.(`Invite sent to ${email.trim()}!`, 'success')
      setEmail('')
    } else {
      showToast?.('Failed to send invite. Please try again.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`${
          isDark
            ? 'bg-lynx-charcoal border border-white/[0.06]'
            : 'bg-white border border-lynx-silver'
        } rounded-xl w-full max-w-lg animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${
            isDark ? 'border-white/[0.06]' : 'border-lynx-silver'
          } flex items-center justify-between`}
        >
          <h2 className={`text-r-xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
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
        <div className="px-6 py-5 space-y-6">
          {/* Section 1: Email Invite */}
          <div>
            <label
              className={`flex items-center gap-2 text-r-sm font-semibold uppercase tracking-wider mb-3 ${
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
                placeholder="coach@example.com"
                className={`flex-1 rounded-lg px-4 py-2.5 text-r-base transition ${
                  isDark
                    ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500 focus:border-lynx-sky'
                    : 'bg-white border border-lynx-silver text-lynx-navy placeholder-slate-400 focus:border-lynx-sky'
                } outline-none`}
              />
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className={`px-5 py-2.5 rounded-lg bg-lynx-navy text-white font-bold text-r-sm hover:brightness-110 transition whitespace-nowrap ${sending ? 'opacity-60 cursor-wait' : ''}`}
              >
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            <p className={`text-r-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              A branded email invite will be sent from noreply@thelynxapp.com
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-silver'}`} />
            <span className={`text-r-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              or share a link
            </span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-silver'}`} />
          </div>

          {/* Section 2: Shareable Link */}
          <div>
            <label
              className={`flex items-center gap-2 text-r-sm font-semibold uppercase tracking-wider mb-3 ${
                isDark ? 'text-slate-400' : 'text-lynx-slate'
              }`}
            >
              <Link className="w-4 h-4" />
              Invite Link
            </label>
            <div className="flex gap-2">
              <div
                className={`flex-1 rounded-lg px-4 py-2.5 text-r-base font-mono truncate select-all ${
                  isDark
                    ? 'bg-white/[0.06] border border-white/[0.06] text-lynx-sky'
                    : 'bg-lynx-frost border border-lynx-silver text-lynx-navy'
                }`}
              >
                {inviteLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-r-sm transition whitespace-nowrap ${
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

          {/* Section 3: Social Share / Recruitment Message */}
          <div>
            <label
              className={`flex items-center gap-2 text-r-sm font-semibold uppercase tracking-wider mb-3 ${
                isDark ? 'text-slate-400' : 'text-lynx-slate'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Recruitment Message
            </label>
            <div
              className={`rounded-lg px-4 py-3 text-r-base leading-relaxed mb-3 ${
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
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-r-sm transition ${
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-lynx-navy text-white font-bold text-r-sm hover:brightness-110 transition"
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
            className={`w-full px-4 py-2.5 rounded-lg font-semibold text-r-base transition ${
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
