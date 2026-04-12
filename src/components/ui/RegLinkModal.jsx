// =============================================================================
// RegLinkModal — Share registration link via copy or email
// =============================================================================
// Shared component used by DashboardPage and ProgramPage.
// Supports season selector dropdown with optional default selection.

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { EmailService } from '../../lib/email-service'

export default function RegLinkModal({
  isOpen,
  onClose,
  organization,
  seasons: seasonsProp,
  defaultSeasonId,
  showToast,
}) {
  const { isDark } = useTheme()
  const [emails, setEmails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [localSeasons, setLocalSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState(defaultSeasonId || null)

  // Load seasons if not provided via props
  useEffect(() => {
    if (!seasonsProp && organization?.id) {
      supabase.from('seasons')
        .select('id, name, status')
        .eq('organization_id', organization.id)
        .in('status', ['upcoming', 'active'])
        .order('start_date', { ascending: false })
        .then(({ data }) => setLocalSeasons(data || []))
    }
  }, [organization?.id, seasonsProp])

  const seasons = seasonsProp || localSeasons
  const selectedSeason = seasons.find(s => s.id === selectedSeasonId) || null

  const slug = organization?.slug || organization?.id
  const url = selectedSeasonId
    ? `${window.location.origin}/register/${slug}/${selectedSeasonId}`
    : `${window.location.origin}/register/${slug}`

  if (!isOpen) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showToast?.('Registration link copied!', 'success')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy this registration link:', url)
    }
  }

  async function handleSendEmails() {
    const emailList = emails.split(/[,;\s]+/).map(e => e.trim()).filter(e => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    })
    if (emailList.length === 0) return

    setSending(true)
    let successCount = 0
    for (const email of emailList) {
      const result = await EmailService.sendRegistrationInvite({
        recipientEmail: email,
        orgName: organization?.name || 'Our Club',
        orgId: organization?.id,
        seasonName: selectedSeason?.name || '',
        registrationUrl: url,
      })
      if (result.success) successCount++
    }
    setSending(false)
    setSent(true)
    setEmails('')
    showToast?.(`${successCount} invite${successCount !== 1 ? 's' : ''} sent!`, 'success')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`${isDark ? 'bg-[#1a1f2e] border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-xl w-full max-w-md animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Registration Link</h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedSeason?.name || 'All Seasons'} — {organization?.name || 'Your Organization'}
            </p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Season Selector */}
          {seasons.length > 0 && (
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Season
              </label>
              <select
                value={selectedSeasonId || ''}
                onChange={(e) => setSelectedSeasonId(e.target.value || null)}
                className={`w-full px-3 py-2 rounded-[14px] border text-sm outline-none transition ${
                  isDark
                    ? 'bg-white/[0.06] border-white/[0.06] text-white focus:border-sky-500'
                    : 'bg-white border-slate-300 text-[#10284C] focus:border-sky-500'
                }`}
              >
                <option value="">All Seasons (org-wide registration link)</option>
                {seasons.filter(s => s.status === 'upcoming' || s.status === 'active').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Season warning when no specific season selected */}
          {!selectedSeasonId && (
            <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
              This link will show a season picker. Select a season above to share a direct link.
            </div>
          )}

          {/* Copy Link Section */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedSeason ? `Link for: ${selectedSeason.name}` : 'Copy Link'}
            </label>
            <div className="flex gap-2">
              <div className={`flex-1 rounded-lg px-3 py-2 text-sm font-mono truncate ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-sky-400' : 'bg-slate-50 border border-slate-200 text-[#10284C]'}`}>
                {url}
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                  copied
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : 'bg-[#10284C] text-white hover:brightness-110'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>or</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
          </div>

          {/* Email to Parents Section */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Email to Parents
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="parent1@email.com, parent2@email.com"
              rows={2}
              className={`w-full rounded-lg px-3 py-2 text-sm transition resize-none ${
                isDark
                  ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500 focus:border-sky-500'
                  : 'bg-white border border-slate-200 text-[#10284C] placeholder-slate-400 focus:border-sky-500'
              } outline-none`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Comma-separated. Each parent receives a branded email with the registration link.
            </p>
            <button
              onClick={handleSendEmails}
              disabled={sending || !emails.trim()}
              className={`mt-3 w-full px-4 py-2.5 rounded-lg font-bold text-sm transition ${
                sent
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : sending
                    ? 'bg-[#10284C] text-white opacity-60 cursor-wait'
                    : emails.trim()
                      ? 'bg-[#10284C] text-white hover:brightness-110'
                      : isDark ? 'bg-white/[0.06] text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {sent ? 'Invites Sent!' : sending ? 'Sending...' : 'Send Registration Invites'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
