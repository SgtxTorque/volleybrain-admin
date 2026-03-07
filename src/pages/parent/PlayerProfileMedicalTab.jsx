// =============================================================================
// PlayerProfileMedicalTab - Medical & Emergency contact tab for PlayerProfilePage
// =============================================================================

import { InfoRow, EditBtn, SaveCancelBtns, FormField } from './PlayerProfileUI'

export default function PlayerProfileMedicalTab({
  player, medicalForm, setMedicalForm, emergencyForm, setEmergencyForm,
  editingMedical, setEditingMedical, editingEmergency, setEditingEmergency,
  saveMedicalInfo, saveEmergencyContact, isDark
}) {
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const mutedCls = 'text-slate-400'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
  const inputCls = `w-full px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`

  return (
    <div className="space-y-6">
      {/* Emergency Contact */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-r-lg font-bold ${textCls}`}>Emergency Contact</h3>
          {!editingEmergency && <EditBtn onClick={() => setEditingEmergency(true)} />}
        </div>
        {editingEmergency ? (
          <div className={`${altBg} rounded-[14px] p-5 space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField isDark={isDark} label="Contact Name" value={emergencyForm.name} onChange={v => setEmergencyForm({ ...emergencyForm, name: v })} placeholder="Full name" />
              <FormField isDark={isDark} label="Phone Number" value={emergencyForm.phone} onChange={v => setEmergencyForm({ ...emergencyForm, phone: v })} type="tel" placeholder="(555) 123-4567" />
              <FormField isDark={isDark} label="Relationship" value={emergencyForm.relation} onChange={v => setEmergencyForm({ ...emergencyForm, relation: v })}
                options={['Mother', 'Father', 'Grandparent', 'Aunt/Uncle', 'Sibling', 'Other']} />
            </div>
            <SaveCancelBtns isDark={isDark} onSave={saveEmergencyContact} onCancel={() => setEditingEmergency(false)} />
          </div>
        ) : (
          <div className={`${altBg} rounded-[14px] px-5`}>
            <InfoRow isDark={isDark} label="Name" value={player.emergency_contact_name || player.emergency_name} />
            <InfoRow isDark={isDark} label="Phone" value={player.emergency_contact_phone || player.emergency_phone} />
            <InfoRow isDark={isDark} label="Relationship" value={player.emergency_contact_relation || player.emergency_relation} />
          </div>
        )}
        {!(player.emergency_contact_name || player.emergency_name) && !editingEmergency && (
          <div className={`mt-3 flex items-center gap-2 px-4 py-3 rounded-[14px] ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
            <span className="text-amber-500 text-r-sm">Warning</span>
            <span className={`text-r-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>No emergency contact on file. Please add one.</span>
          </div>
        )}
      </div>

      {/* Medical Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-r-lg font-bold ${textCls}`}>Medical Information</h3>
          {!editingMedical && <EditBtn onClick={() => setEditingMedical(true)} />}
        </div>
        {editingMedical ? (
          <div className={`${altBg} rounded-[14px] p-5 space-y-4`}>
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
          <div className={`${altBg} rounded-[14px] px-5`}>
            <InfoRow isDark={isDark} label="Conditions" value={player.medical_conditions || player.medical_notes || 'None reported'} />
            <InfoRow isDark={isDark} label="Allergies" value={player.allergies || 'None reported'} />
          </div>
        )}
      </div>
    </div>
  )
}
