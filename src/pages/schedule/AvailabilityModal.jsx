import { useState } from 'react'
import { X, Check, Repeat } from '../../constants/icons'
import { REASONS, DAY_NAMES_FULL, formatDateNice } from './availabilityHelpers'

// ============================================
// AVAILABILITY MODAL
// Mark dates as unavailable or tentative
// ============================================
export default function AvailabilityModal({ dates, onSave, onClose, tc, isDark }) {
  const [status, setStatus] = useState('unavailable')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [saving, setSaving] = useState(false)

  const firstDate = dates[0]
  const dayOfWeek = firstDate ? new Date(firstDate + 'T00:00:00').getDay() : 0

  async function handleSave() {
    setSaving(true)
    await onSave({
      status,
      reason: reason || null,
      notes: notes || null,
      recurring,
      recurringDay: recurring ? dayOfWeek : null,
    })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-[14px] overflow-hidden shadow-2xl border animate-scale-in ${
          isDark
            ? 'bg-lynx-charcoal border-white/[0.06]'
            : 'bg-white border-slate-200'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h3 className={`font-bold text-r-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Mark Availability
            </h3>
            <p className={`text-r-sm ${tc.textMuted}`}>
              {dates.length === 1 ? formatDateNice(dates[0]) : `${dates.length} dates selected`}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'}`}
          >
            <X className={`w-5 h-5 ${tc.textMuted}`} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status */}
          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted}`}>
              Status
            </label>
            <div className="flex gap-2 mt-2">
              {[
                { value: 'unavailable', label: 'Unavailable', color: 'bg-red-500', ring: 'ring-red-500/30' },
                { value: 'tentative', label: 'Tentative', color: 'bg-amber-500', ring: 'ring-amber-500/30' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-2.5 rounded-lg text-r-sm font-semibold transition-all ${
                    status === opt.value
                      ? `${opt.color} text-white ring-4 ${opt.ring} shadow-lg`
                      : isDark
                        ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted}`}>
              Reason (optional)
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(reason === r.value ? '' : r.value)}
                  className={`px-3 py-2 rounded-lg text-r-sm font-medium transition-all ${
                    reason === r.value
                      ? 'bg-lynx-navy text-white shadow-md'
                      : isDark
                        ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted}`}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any details..."
              rows={2}
              className={`mt-2 w-full px-3 py-2 rounded-lg text-r-sm resize-none transition focus:outline-none focus:ring-1 focus:ring-lynx-sky/20 ${
                isDark
                  ? 'bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 focus:border-lynx-sky'
                  : 'bg-white border border-slate-200 text-slate-700 placeholder-slate-400 focus:border-lynx-sky'
              }`}
            />
          </div>

          {/* Recurring */}
          {dates.length === 1 && (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-white/[0.04]' : 'bg-lynx-cloud'}`}>
              <button
                onClick={() => setRecurring(!recurring)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                  recurring
                    ? 'bg-lynx-navy text-white'
                    : isDark
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white border border-slate-300'
                }`}
              >
                {recurring && <Check className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <p className={`text-r-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <Repeat className="w-4 h-4 inline mr-1" />
                  Repeat weekly
                </p>
                <p className={`text-r-xs ${tc.textMuted}`}>
                  Every {DAY_NAMES_FULL[dayOfWeek]}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${tc.border} flex gap-3`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-r-sm transition ${
              isDark
                ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg font-bold text-r-sm text-white transition bg-lynx-navy hover:brightness-110 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
