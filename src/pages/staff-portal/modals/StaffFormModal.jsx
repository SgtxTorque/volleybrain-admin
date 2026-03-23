import { useState } from 'react'
import { X } from '../../../constants/icons'

const STAFF_ROLES = [
  'Board Member', 'Team Parent', 'Scorekeeper', 'Line Judge',
  'Athletic Trainer', 'Photographer/Videographer', 'Event Coordinator', 'Volunteer', 'Other'
]

export default function StaffFormModal({ staff, teams, isDark, onSave, onClose }) {
  const [form, setForm] = useState({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || 'Volunteer',
    custom_role: staff?.custom_role || '',
    team_id: staff?.team_id || '',
    background_check_status: staff?.background_check_status || 'not_started',
    notes: staff?.notes || '',
    status: staff?.status || 'active',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const ic = `w-full rounded-lg px-4 py-3 text-r-sm ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-white border border-lynx-silver text-lynx-navy'}`
  const lc = `block text-r-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1.5 uppercase tracking-wider`

  function handleSubmit() {
    if (!form.first_name || !form.last_name) return
    onSave({
      ...form,
      team_id: form.team_id || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex items-center justify-between`}>
          <h2 className={`text-r-xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
            {staff ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-lynx-frost text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>First Name *</label><input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} className={ic} placeholder="Jane" /></div>
            <div><label className={lc}>Last Name *</label><input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} className={ic} placeholder="Doe" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={ic} placeholder="jane@email.com" /></div>
            <div><label className={lc}>Phone</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={ic} placeholder="(555) 555-5555" /></div>
          </div>
          <div>
            <label className={lc}>Role *</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={ic}>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {form.role === 'Other' && (
            <div><label className={lc}>Custom Role</label><input type="text" value={form.custom_role} onChange={e => set('custom_role', e.target.value)} className={ic} placeholder="e.g., Social Media Manager" /></div>
          )}
          <div>
            <label className={lc}>Assigned Team (optional)</label>
            <select value={form.team_id} onChange={e => set('team_id', e.target.value)} className={ic}>
              <option value="">Org-level (no team)</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lc}>Background Check Status</label>
            <select value={form.background_check_status} onChange={e => set('background_check_status', e.target.value)} className={ic}>
              <option value="not_started">Not Started</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className={lc}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              className={`${ic} h-20 resize-none`} placeholder="Internal notes..." />
          </div>
        </div>

        <div className={`px-5 py-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-5 py-2 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white' : 'bg-lynx-frost text-lynx-navy'}`}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!form.first_name || !form.last_name}
            className="px-6 py-2 rounded-lg bg-lynx-navy text-white font-bold disabled:opacity-50 hover:brightness-110 transition">
            {staff ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  )
}
