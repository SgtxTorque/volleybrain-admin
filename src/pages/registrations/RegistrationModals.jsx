// =============================================================================
// RegistrationModals — DenyRegistrationModal + BulkDenyModal
// Extracted from RegistrationsPage.jsx
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

// ============================================
// DENY REGISTRATION MODAL
// ============================================
export function DenyRegistrationModal({ player, onClose, onDeny }) {
  const { isDark } = useTheme()
  const [reason, setReason] = useState('')

  const cardBg = isDark ? 'bg-lynx-charcoal' : 'bg-white'
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className={`${cardBg} border ${borderColor} rounded-[14px] w-full max-w-md`}>
        <div className={`p-6 border-b ${borderColor}`}>
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deny Registration</h2>
          <p className="text-slate-400 text-sm mt-1">{player.first_name} {player.last_name}</p>
        </div>
        <div className="p-6">
          <label className="block text-sm text-slate-400 mb-2">Reason for denial (optional)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Enter reason..."
            className={`w-full ${isDark ? 'bg-lynx-midnight border-white/[0.06] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-xl px-4 py-3 min-h-[100px]`}
          />
        </div>
        <div className={`p-6 border-t ${borderColor} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${borderColor} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Cancel
          </button>
          <button onClick={() => onDeny(reason)} className="px-6 py-2 rounded-xl bg-red-500 text-white font-bold">
            Deny Registration
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BULK DENY MODAL
// ============================================
export function BulkDenyModal({ count, onClose, onDeny, processing }) {
  const { isDark } = useTheme()
  const [reason, setReason] = useState('')

  const cardBg = isDark ? 'bg-lynx-charcoal' : 'bg-white'
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${cardBg} border ${borderColor} rounded-[14px] w-full max-w-md`}>
        <div className={`p-6 border-b ${borderColor}`}>
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deny {count} Registrations</h2>
          <p className="text-slate-400 text-sm mt-1">This action cannot be undone.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Reason for denial (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Season is full, missing required documents..."
              className={`w-full ${isDark ? 'bg-lynx-midnight border-white/[0.06] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-xl px-4 py-3 min-h-[100px]`}
            />
          </div>
        </div>
        <div className={`p-6 border-t ${borderColor} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${borderColor} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Cancel
          </button>
          <button
            onClick={() => onDeny(reason)}
            disabled={processing}
            className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50"
          >
            {processing ? 'Processing...' : `Deny ${count} Registrations`}
          </button>
        </div>
      </div>
    </div>
  )
}
