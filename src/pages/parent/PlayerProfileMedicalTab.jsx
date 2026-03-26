// =============================================================================
// PlayerProfileMedicalTab - Medical info only (Emergency Contact moved to InfoTab)
// =============================================================================

import { InfoRow, EditBtn, SaveCancelBtns } from './PlayerProfileUI'

export default function PlayerProfileMedicalTab({
  player, medicalForm, setMedicalForm,
  editingMedical, setEditingMedical,
  saveMedicalInfo, isDark
}) {
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const mutedCls = 'text-slate-400'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
  const inputCls = `w-full px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC]/20 ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-bold ${textCls}`}>Medical Information</h3>
        {!editingMedical && <EditBtn onClick={() => setEditingMedical(true)} />}
      </div>
      {editingMedical ? (
        <div className={`${altBg} rounded-[14px] p-4 space-y-3`}>
          <div>
            <label className={`block text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>Medical Conditions</label>
            <textarea value={medicalForm.conditions} onChange={e => setMedicalForm({ ...medicalForm, conditions: e.target.value })}
              placeholder="Asthma, diabetes, seizures, etc. (or 'None')"
              rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={`block text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>Allergies</label>
            <textarea value={medicalForm.allergies} onChange={e => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
              placeholder="Food, medication, or environmental allergies (or 'None')"
              rows={3} className={`${inputCls} resize-none`} />
          </div>
          <SaveCancelBtns isDark={isDark} onSave={saveMedicalInfo} onCancel={() => setEditingMedical(false)} />
        </div>
      ) : (
        <div className={`${altBg} rounded-[14px] px-4`}>
          <InfoRow isDark={isDark} label="Conditions" value={player.medical_conditions || player.medical_notes || 'None reported'} />
          <InfoRow isDark={isDark} label="Allergies" value={player.allergies || 'None reported'} />
        </div>
      )}
    </div>
  )
}
