// =============================================================================
// PlayerProfileUI - Shared UI helpers for PlayerProfilePage tabs
// =============================================================================

import { Edit } from '../../constants/icons'

export function InfoRow({ label, value, isDark }) {
  const mutedCls = 'text-slate-400'
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const borderCls = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  return (
    <div className={`flex items-center gap-3 py-3 border-b last:border-b-0 ${borderCls}`}>
      <span className={`text-r-sm ${mutedCls} w-32 flex-shrink-0`}>{label}</span>
      <span className={`text-r-sm font-medium ${textCls}`}>{value || '-'}</span>
    </div>
  )
}

export function EditBtn({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-r-sm font-semibold bg-[#4BB9EC]/10 text-[#4BB9EC] hover:bg-[#4BB9EC]/20 transition">
      <Edit className="w-3.5 h-3.5" /> Edit
    </button>
  )
}

export function SaveCancelBtns({ onSave, onCancel, isDark }) {
  const borderCls = isDark ? 'border-white/[0.06]' : 'border-slate-200'
  const textCls = isDark ? 'text-white' : 'text-slate-900'

  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel} className={`flex-1 py-2.5 rounded-lg border ${borderCls} ${textCls} font-medium text-r-sm hover:opacity-80 transition`}>Cancel</button>
      <button onClick={onSave} className="flex-1 py-2.5 rounded-lg bg-[#10284C] text-white font-bold text-r-sm hover:brightness-110 transition">Save Changes</button>
    </div>
  )
}

export function FormField({ label, value, onChange, type = 'text', placeholder, options, isDark }) {
  const mutedCls = 'text-slate-400'
  const borderCls = isDark ? 'border-white/[0.06]' : 'border-slate-200'
  const inputCls = `w-full px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC]/20 ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`

  return (
    <div>
      <label className={`block text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="">Select...</option>
          {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      )}
    </div>
  )
}
