// =============================================================================
// PlayerProfileInfoTab - Registration info tab for PlayerProfilePage
// =============================================================================

import { InfoRow, EditBtn, SaveCancelBtns, FormField } from './PlayerProfileUI'
import { SPORT_POSITIONS } from './PlayerProfileConstants'

export default function PlayerProfileInfoTab({
  player, infoForm, setInfoForm, editingInfo, setEditingInfo,
  savePlayerInfo, sportName, seasonHistory, isDark
}) {
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'

  return (
    <div className="space-y-6">
      {/* Player Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-r-lg font-bold ${textCls}`}>Player Information</h3>
          {!editingInfo && <EditBtn onClick={() => setEditingInfo(true)} />}
        </div>
        {editingInfo ? (
          <div className={`${altBg} rounded-[14px] p-5 space-y-4`}>
            <div className="grid grid-cols-2 gap-4">
              <FormField isDark={isDark} label="First Name" value={infoForm.first_name} onChange={v => setInfoForm({ ...infoForm, first_name: v })} />
              <FormField isDark={isDark} label="Last Name" value={infoForm.last_name} onChange={v => setInfoForm({ ...infoForm, last_name: v })} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField isDark={isDark} label="Date of Birth" value={infoForm.date_of_birth} onChange={v => setInfoForm({ ...infoForm, date_of_birth: v })} type="date" />
              <FormField isDark={isDark} label="Gender" value={infoForm.gender} onChange={v => setInfoForm({ ...infoForm, gender: v })}
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'non-binary', label: 'Non-binary' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' }]} />
              <FormField isDark={isDark} label="Grade" value={infoForm.grade} onChange={v => setInfoForm({ ...infoForm, grade: v })}
                options={['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField isDark={isDark} label="School" value={infoForm.school} onChange={v => setInfoForm({ ...infoForm, school: v })} placeholder="School name" />
              <FormField isDark={isDark} label="Position" value={infoForm.position} onChange={v => setInfoForm({ ...infoForm, position: v })}
                options={(SPORT_POSITIONS[sportName?.toLowerCase()] || SPORT_POSITIONS.volleyball || []).map(p => ({ value: p, label: p }))} />
              <FormField isDark={isDark} label="Experience" value={infoForm.experience_level} onChange={v => setInfoForm({ ...infoForm, experience_level: v })}
                options={['Beginner', 'Intermediate', 'Advanced', 'Club/Travel']} />
            </div>
            <SaveCancelBtns isDark={isDark} onSave={savePlayerInfo} onCancel={() => setEditingInfo(false)} />
          </div>
        ) : (
          <div className={`${altBg} rounded-[14px] px-5`}>
            <InfoRow isDark={isDark} label="Full Name" value={`${player.first_name} ${player.last_name}`} />
            <InfoRow isDark={isDark} label="Date of Birth" value={player.date_of_birth ? new Date(player.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
            <InfoRow isDark={isDark} label="Gender" value={infoForm.gender ? infoForm.gender.charAt(0).toUpperCase() + infoForm.gender.slice(1).replace(/_/g, ' ') : null} />
            <InfoRow isDark={isDark} label="Grade" value={player.grade} />
            <InfoRow isDark={isDark} label="School" value={player.school} />
            <InfoRow isDark={isDark} label="Position" value={player.position} />
            <InfoRow isDark={isDark} label="Experience" value={player.experience_level || player.experience} />
          </div>
        )}
      </div>

      {/* Address (read-only) */}
      {(infoForm.address || infoForm.city) && !editingInfo && (
        <div>
          <h3 className={`text-r-lg font-bold ${textCls} mb-4`}>Address</h3>
          <div className={`${altBg} rounded-[14px] px-5`}>
            {infoForm.address && <InfoRow isDark={isDark} label="Street" value={infoForm.address} />}
            <InfoRow isDark={isDark} label="City/State/Zip" value={[infoForm.city, infoForm.state, infoForm.zip].filter(Boolean).join(', ') || null} />
          </div>
        </div>
      )}

      {/* Address (editing) */}
      {editingInfo && (
        <div>
          <h3 className={`text-r-lg font-bold ${textCls} mb-4`}>Address</h3>
          <div className={`${altBg} rounded-[14px] p-5 space-y-4`}>
            <FormField isDark={isDark} label="Street Address" value={infoForm.address} onChange={v => setInfoForm({ ...infoForm, address: v })} placeholder="123 Main St" />
            <div className="grid grid-cols-3 gap-4">
              <FormField isDark={isDark} label="City" value={infoForm.city} onChange={v => setInfoForm({ ...infoForm, city: v })} placeholder="City" />
              <FormField isDark={isDark} label="State" value={infoForm.state} onChange={v => setInfoForm({ ...infoForm, state: v })} placeholder="TX" />
              <FormField isDark={isDark} label="Zip" value={infoForm.zip} onChange={v => setInfoForm({ ...infoForm, zip: v })} placeholder="75068" />
            </div>
          </div>
        </div>
      )}

      {/* Parent/Guardian 1 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-r-lg font-bold ${textCls}`}>Parent / Guardian</h3>
          {!editingInfo && <EditBtn onClick={() => setEditingInfo(true)} />}
        </div>
        {editingInfo ? (
          <div className={`${altBg} rounded-[14px] p-5 space-y-4`}>
            <FormField isDark={isDark} label="Parent Name" value={infoForm.parent_name} onChange={v => setInfoForm({ ...infoForm, parent_name: v })} />
            <div className="grid grid-cols-2 gap-4">
              <FormField isDark={isDark} label="Email" value={infoForm.parent_email} onChange={v => setInfoForm({ ...infoForm, parent_email: v })} type="email" />
              <FormField isDark={isDark} label="Phone" value={infoForm.parent_phone} onChange={v => setInfoForm({ ...infoForm, parent_phone: v })} type="tel" />
            </div>
          </div>
        ) : (
          <div className={`${altBg} rounded-[14px] px-5`}>
            <InfoRow isDark={isDark} label="Parent Name" value={infoForm.parent_name} />
            <InfoRow isDark={isDark} label="Email" value={infoForm.parent_email} />
            <InfoRow isDark={isDark} label="Phone" value={infoForm.parent_phone} />
          </div>
        )}
      </div>

      {/* Parent/Guardian 2 */}
      {(infoForm.parent2_name || infoForm.parent2_email || editingInfo) && (
        <div>
          <h3 className={`text-r-lg font-bold ${textCls} mb-4`}>Parent / Guardian 2</h3>
          {editingInfo ? (
            <div className={`${altBg} rounded-[14px] p-5 space-y-4`}>
              <FormField isDark={isDark} label="Parent 2 Name" value={infoForm.parent2_name} onChange={v => setInfoForm({ ...infoForm, parent2_name: v })} placeholder="Optional" />
              <div className="grid grid-cols-2 gap-4">
                <FormField isDark={isDark} label="Email" value={infoForm.parent2_email} onChange={v => setInfoForm({ ...infoForm, parent2_email: v })} type="email" placeholder="Optional" />
                <FormField isDark={isDark} label="Phone" value={infoForm.parent2_phone} onChange={v => setInfoForm({ ...infoForm, parent2_phone: v })} type="tel" placeholder="Optional" />
              </div>
            </div>
          ) : (
            <div className={`${altBg} rounded-[14px] px-5`}>
              <InfoRow isDark={isDark} label="Parent 2 Name" value={infoForm.parent2_name} />
              <InfoRow isDark={isDark} label="Email" value={infoForm.parent2_email} />
              <InfoRow isDark={isDark} label="Phone" value={infoForm.parent2_phone} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
