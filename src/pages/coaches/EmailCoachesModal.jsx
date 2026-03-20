import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { X, Mail, Copy, ExternalLink } from 'lucide-react'

// ============================================
// EMAIL COACHES MODAL
// Shows coach list with checkboxes, subject/message,
// copy-to-clipboard & mailto: link
// ============================================
export default function EmailCoachesModal({ coaches = [], onClose, showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const [selected, setSelected] = useState(() =>
    new Set(coaches.map((_, i) => i))
  )
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const allSelected = selected.size === coaches.length
  const selectedCoaches = coaches.filter((_, i) => selected.has(i))
  const selectedEmails = selectedCoaches.map(c => c.email).filter(Boolean)

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(coaches.map((_, i) => i)))
    }
  }

  function toggleOne(idx) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  async function handleCopyEmails() {
    if (selectedEmails.length === 0) {
      showToast?.('No coaches selected', 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(selectedEmails.join(', '))
      showToast?.(`${selectedEmails.length} email${selectedEmails.length === 1 ? '' : 's'} copied to clipboard`, 'success')
    } catch {
      showToast?.('Failed to copy to clipboard', 'error')
    }
  }

  function handleOpenEmailClient() {
    if (selectedEmails.length === 0) {
      showToast?.('No coaches selected', 'error')
      return
    }
    const params = new URLSearchParams()
    if (subject) params.set('subject', subject)
    if (message) params.set('body', message)
    const paramStr = params.toString()
    const mailto = `mailto:${selectedEmails.join(',')}${paramStr ? '?' + paramStr : ''}`
    window.open(mailto, '_blank')
  }

  const ic = `w-full rounded-xl px-4 py-3 text-r-sm ${tc.input} border ${tc.border} focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40`

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-lynx-silver'} border rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className={`text-r-lg font-bold ${tc.text}`}>Email Coaches</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-lynx-graphite text-slate-400' : 'hover:bg-lynx-frost text-lynx-slate'} transition`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Coach list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-r-xs font-medium uppercase tracking-wider ${tc.textMuted}`}>
                Recipients ({selectedEmails.length} of {coaches.length})
              </label>
              <button
                onClick={toggleAll}
                className={`text-r-xs font-medium text-[var(--accent-primary)] hover:underline`}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className={`${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'} rounded-xl max-h-48 overflow-y-auto divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-lynx-silver'}`}>
              {coaches.length === 0 ? (
                <div className={`p-4 text-center text-r-sm ${tc.textMuted}`}>
                  No coaches with email addresses
                </div>
              ) : (
                coaches.map((coach, idx) => (
                  <label
                    key={coach.id || idx}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-lynx-frost'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(idx)}
                      onChange={() => toggleOne(idx)}
                      className="w-4 h-4 rounded border-slate-400 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-r-sm font-medium ${tc.text} truncate`}>
                        {coach.first_name} {coach.last_name}
                      </p>
                      <p className={`text-r-xs ${tc.textMuted} truncate`}>
                        {coach.email}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className={`block text-r-xs font-medium uppercase tracking-wider ${tc.textMuted} mb-1.5`}>
              Subject (optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject line..."
              className={ic}
            />
          </div>

          {/* Message */}
          <div>
            <label className={`block text-r-xs font-medium uppercase tracking-wider ${tc.textMuted} mb-1.5`}>
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className={`${ic} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${tc.border} flex flex-col sm:flex-row gap-3`}>
          <button
            onClick={handleCopyEmails}
            disabled={selectedEmails.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lynx-sky text-lynx-navy font-bold text-r-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copy Emails
          </button>
          <button
            onClick={handleOpenEmailClient}
            disabled={selectedEmails.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lynx-navy text-white font-bold text-r-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Email Client
          </button>
        </div>
      </div>
    </div>
  )
}
