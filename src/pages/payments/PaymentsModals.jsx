// =============================================================================
// PaymentsModals — MarkPaid, Delete, SendReminder, Blast, AddFee modals
// Extracted from PaymentsPage.jsx
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { AlertCircle, Mail, MessageCircle, Bell, X } from 'lucide-react'

// ============================================
// MARK PAID MODAL
// ============================================
export function MarkPaidModal({ payment, onConfirm, onClose }) {
  const { isDark } = useTheme()
  const [details, setDetails] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  })

  const inputCls = isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`rounded-[14px] w-full max-w-md p-6 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Mark Payment as Paid</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fee</label>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment.fee_name} - ${parseFloat(payment.amount).toFixed(2)}</p>
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Payment Date</label>
            <input type="date" value={details.paid_date} onChange={e => setDetails(d => ({ ...d, paid_date: e.target.value }))} className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Payment Method</label>
            <select value={details.payment_method} onChange={e => setDetails(d => ({ ...d, payment_method: e.target.value }))} className={`w-full px-3 py-2 rounded-lg ${inputCls}`}>
              <option value="cash">Cash</option>
              <option value="venmo">Venmo</option>
              <option value="zelle">Zelle</option>
              <option value="cashapp">Cash App</option>
              <option value="check">Check</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reference # (optional)</label>
            <input type="text" value={details.reference_number} onChange={e => setDetails(d => ({ ...d, reference_number: e.target.value }))} placeholder="Transaction ID, check #, etc." className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Notes (optional)</label>
            <textarea value={details.notes} onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))} placeholder="Any additional notes..." rows={2} className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-100 text-slate-900'}`}>Cancel</button>
          <button onClick={() => onConfirm(payment.id, details)} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600">Confirm Payment</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DELETE PAYMENT MODAL
// ============================================
export function DeletePaymentModal({ payment, onConfirm, onClose }) {
  const { isDark } = useTheme()
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`rounded-[14px] w-full max-w-md p-6 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Remove Fee</h3>
        </div>
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Are you sure you want to remove this fee? This action cannot be undone.</p>
        <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment.fee_name || payment.fee_type}</p>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>${parseFloat(payment.amount).toFixed(2)}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-100 text-slate-900'}`}>Cancel</button>
          <button onClick={() => onConfirm(payment.id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600">Remove Fee</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SEND REMINDER MODAL
// ============================================
export function SendReminderModal({ target, onSend, onClose }) {
  const { isDark } = useTheme()
  const [method, setMethod] = useState('email')
  const [message, setMessage] = useState('')

  const isFamily = target?.email !== undefined
  const recipientName = isFamily ? target.parentName : `${target.first_name} ${target.last_name}`
  const recipientEmail = isFamily ? target.email : target.parent_email
  const outstanding = isFamily
    ? target.payments?.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
    : 0

  const defaultMessage = `Hi ${recipientName.split(' ')[0]},\n\nThis is a friendly reminder about your outstanding balance${outstanding > 0 ? ` of $${outstanding.toFixed(2)}` : ''}. Please let us know if you have any questions.\n\nThank you!`

  useEffect(() => { setMessage(defaultMessage) }, [target])

  const inputCls = isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`rounded-[14px] w-full max-w-lg p-6 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Send Payment Reminder</h3>
        <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>To: {recipientName}</p>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{recipientEmail}</p>
        </div>
        <div className="mb-4">
          <label className={`block text-sm mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Send via</label>
          <div className="flex gap-2">
            {['email', 'text', 'app'].map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`flex-1 px-4 py-2 rounded-lg capitalize flex items-center justify-center gap-2 ${
                  method === m ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
                }`}>
                {m === 'email' && <Mail className="w-4 h-4" />}
                {m === 'text' && <MessageCircle className="w-4 h-4" />}
                {m === 'app' && <Bell className="w-4 h-4" />}
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-100 text-slate-900'}`}>Cancel</button>
          <button onClick={() => onSend({ target, method, message })} className="flex-1 px-4 py-2 rounded-lg bg-lynx-sky text-lynx-navy font-bold hover:brightness-110">Send Reminder</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BLAST REMINDER MODAL
// ============================================
export function BlastReminderModal({ families, onSend, onClose }) {
  const { isDark } = useTheme()
  const [method, setMethod] = useState('email')
  const [targetGroup, setTargetGroup] = useState('unpaid')
  const [message, setMessage] = useState('')

  const unpaidFamilies = families.filter(f => f.payments.some(p => !p.paid))
  const targetCount = targetGroup === 'unpaid' ? unpaidFamilies.length : families.length

  const defaultMessage = `Hi,\n\nThis is a friendly reminder about outstanding payments for the current season. Please log in to view your balance and make a payment.\n\nThank you for your support!\n\n- Black Hornets Volleyball`
  useEffect(() => { setMessage(defaultMessage) }, [])

  const inputCls = isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`rounded-[14px] w-full max-w-lg p-6 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Send Blast Reminder</h3>
        <div className="mb-4">
          <label className={`block text-sm mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Send to</label>
          <div className="flex gap-2">
            <button onClick={() => setTargetGroup('unpaid')}
              className={`flex-1 px-4 py-2 rounded-lg ${targetGroup === 'unpaid' ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
              Families with balance ({unpaidFamilies.length})
            </button>
            <button onClick={() => setTargetGroup('all')}
              className={`flex-1 px-4 py-2 rounded-lg ${targetGroup === 'all' ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
              All families ({families.length})
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className={`block text-sm mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Send via</label>
          <div className="flex gap-2">
            {['email', 'text', 'app'].map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`flex-1 px-4 py-2 rounded-lg capitalize flex items-center justify-center gap-2 ${
                  method === m ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] border border-white/[0.06] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
                }`}>
                {m === 'email' && <Mail className="w-4 h-4" />}
                {m === 'text' && <MessageCircle className="w-4 h-4" />}
                {m === 'app' && <Bell className="w-4 h-4" />}
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-100 text-slate-900'}`}>Cancel</button>
          <button onClick={() => onSend({ targetGroup, method, message, count: targetCount })} className="flex-1 px-4 py-2 rounded-lg bg-lynx-sky text-lynx-navy font-bold hover:brightness-110">
            Send to {targetCount} {targetCount === 1 ? 'family' : 'families'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD FEE MODAL
// ============================================
export function AddFeeModal({ players, onAdd, onClose }) {
  const { isDark } = useTheme()
  const [formData, setFormData] = useState({
    player_id: '', fee_type: 'other', fee_name: '', amount: '', due_date: '', description: ''
  })

  const handleSubmit = () => {
    if (!formData.player_id || !formData.fee_name || !formData.amount) return
    onAdd({ ...formData, amount: parseFloat(formData.amount), paid: false, fee_category: 'per_player' })
  }

  const inputCls = isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`rounded-[14px] w-full max-w-md p-6 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add New Fee</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Player</label>
            <select value={formData.player_id} onChange={e => setFormData(d => ({ ...d, player_id: e.target.value }))} className={`w-full px-3 py-2 rounded-lg ${inputCls}`}>
              <option value="">Select player...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fee Type</label>
            <select value={formData.fee_type} onChange={e => setFormData(d => ({ ...d, fee_type: e.target.value }))} className={`w-full px-3 py-2 rounded-lg ${inputCls}`}>
              <option value="registration">Registration</option>
              <option value="uniform">Uniform</option>
              <option value="monthly">Monthly</option>
              <option value="tournament">Tournament</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fee Name</label>
            <input type="text" value={formData.fee_name} onChange={e => setFormData(d => ({ ...d, fee_name: e.target.value }))} placeholder="e.g., Tournament Entry Fee" className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Amount ($)</label>
            <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData(d => ({ ...d, amount: e.target.value }))} placeholder="0.00" className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Due Date (optional)</label>
            <input type="date" value={formData.due_date} onChange={e => setFormData(d => ({ ...d, due_date: e.target.value }))} className={`w-full px-3 py-2 rounded-lg ${inputCls}`} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-100 text-slate-900'}`}>Cancel</button>
          <button onClick={handleSubmit} disabled={!formData.player_id || !formData.fee_name || !formData.amount}
            className="flex-1 px-4 py-2 rounded-lg bg-lynx-sky text-lynx-navy font-bold hover:brightness-110 disabled:opacity-50">
            Add Fee
          </button>
        </div>
      </div>
    </div>
  )
}
