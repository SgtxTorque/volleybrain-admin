// =============================================================================
// PlayerDetailModal — View/Edit player registration detail
// Extracted from RegistrationsPage.jsx
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { parseLocalDate } from '../../lib/date-helpers'
import { Edit, UserPlus } from 'lucide-react'
import InviteCoParentModal from '../../components/modals/InviteCoParentModal'
import { useAuth } from '../../contexts/AuthContext'
import { formatPhone } from '../../lib/formatters'

// ============================================
// HELPER: calculateAge
// ============================================
export function calculateAge(birthDate) {
  if (!birthDate) return 'N/A'
  const today = new Date()
  const birth = parseLocalDate(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ============================================
// HELPER: ClickablePlayerName
// ============================================
export function ClickablePlayerName({ player, className = '', children, onPlayerSelect }) {
  if (!player) return <span className={className}>{children || 'Unknown'}</span>

  const displayName = children || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onPlayerSelect?.(player)
      }}
      className={`${className} hover:text-lynx-sky hover:underline cursor-pointer transition-colors text-left`}
    >
      {displayName}
    </button>
  )
}

// ============================================
// INTERNAL: InfoRow
// ============================================
function InfoRow({ label, value }) {
  const { isDark } = useTheme()
  return (
    <div className={`${isDark ? 'bg-lynx-midnight' : 'bg-slate-100'} rounded-lg px-3 py-2`}>
      <p className="text-sm uppercase tracking-wider font-bold text-slate-400">{label}</p>
      <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold text-base mt-0.5`}>{value || '—'}</p>
    </div>
  )
}

// ============================================
// INTERNAL: WaiverBadge
// ============================================
function WaiverBadge({ label, signed }) {
  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
      signed ? 'bg-emerald-500/12 text-emerald-500' : 'bg-red-500/12 text-red-500'
    }`}>
      {signed ? '✓' : '✗'} {label}
    </span>
  )
}

// ============================================
// INTERNAL: EditField
// ============================================
function EditField({ label, value, onChange, type = 'text', options, multiline }) {
  const { isDark } = useTheme()
  const inputCls = `w-full ${isDark ? 'bg-lynx-midnight border-white/[0.06] text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-lg px-3 py-2 text-base`

  if (options) {
    return (
      <div>
        <label className="block text-base font-medium text-slate-400 mb-1">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="">Select...</option>
          {(Array.isArray(options) ? options : []).map(o => {
            const val = typeof o === 'object' ? o.value : o
            const lbl = typeof o === 'object' ? o.label : o
            return <option key={val} value={val}>{lbl}</option>
          })}
        </select>
      </div>
    )
  }
  if (multiline) {
    return (
      <div>
        <label className="block text-base font-medium text-slate-400 mb-1">{label}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} min-h-[60px]`} />
      </div>
    )
  }
  return (
    <div>
      <label className="block text-base font-medium text-slate-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
    </div>
  )
}

// ============================================
// PLAYER DETAIL/EDIT MODAL
// ============================================
export default function PlayerDetailModal({ player, editMode, onClose, onUpdate, showToast }) {
  const { isDark } = useTheme()
  const { organization } = useAuth()
  const reg = player.registrations?.[0]
  const rd = reg?.registration_data || {}
  const shared = rd.shared || {}
  const childData = rd.player || {}

  const [isEditing, setIsEditing] = useState(editMode)
  const [saving, setSaving] = useState(false)
  const [siblings, setSiblings] = useState([])
  const [showCoParentInvite, setShowCoParentInvite] = useState(false)

  // Merge player columns with registration_data JSON
  const merged = {
    ...player,
    gender: player.gender || childData.gender || '',
    school: player.school || childData.school || '',
    experience_level: player.experience_level || player.experience || childData.experience_level || '',
    address: player.address || shared.address || '',
    city: player.city || shared.city || '',
    state: player.state || shared.state || '',
    zip: player.zip || shared.zip || '',
    parent2_name: player.parent2_name || shared.parent2_name || '',
    parent2_email: player.parent2_email || shared.parent2_email || '',
    parent2_phone: player.parent2_phone || shared.parent2_phone || '',
    medical_conditions: player.medical_conditions || player.medical_notes || '',
    allergies: player.allergies || '',
    medications: player.medications || '',
    emergency_name: player.emergency_contact_name || player.emergency_name || shared.emergency_name || '',
    emergency_phone: player.emergency_contact_phone || player.emergency_phone || shared.emergency_phone || '',
    emergency_relation: player.emergency_contact_relation || player.emergency_relation || shared.emergency_relation || '',
  }

  const fullAddress = [merged.address, merged.city, merged.state, merged.zip].filter(Boolean).join(', ')

  const [form, setForm] = useState({
    first_name: player.first_name || '',
    last_name: player.last_name || '',
    birth_date: player.birth_date || player.dob || '',
    grade: player.grade || '',
    gender: merged.gender,
    school: merged.school,
    experience_level: merged.experience_level,
    parent_name: player.parent_name || '',
    parent_email: player.parent_email || '',
    parent_phone: player.parent_phone || '',
    address: merged.address,
    city: merged.city,
    state: merged.state,
    zip: merged.zip,
    parent2_name: merged.parent2_name,
    parent2_email: merged.parent2_email,
    parent2_phone: merged.parent2_phone,
    emergency_contact_name: merged.emergency_name,
    emergency_contact_phone: merged.emergency_phone,
    emergency_contact_relation: merged.emergency_relation,
    medical_conditions: merged.medical_conditions,
    allergies: merged.allergies,
    medications: merged.medications,
    jersey_number: player.jersey_number || '',
    jersey_size: player.jersey_size || player.uniform_size_jersey || '',
    notes: player.notes || '',
  })

  // Detect siblings (same parent email, same season)
  useEffect(() => {
    async function findSiblings() {
      if (!player.parent_email || !player.season_id) return
      const { data } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .eq('parent_email', player.parent_email)
        .eq('season_id', player.season_id)
        .neq('id', player.id)
      setSiblings(data || [])
    }
    findSiblings()
  }, [player.id])

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('players')
        .update({
          ...form,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id)

      if (error) throw error
      showToast('Player updated successfully!', 'success')
      onUpdate()
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error')
    }
    setSaving(false)
  }

  // Status colors
  const isPending = ['submitted', 'pending', 'new'].includes(reg?.status)
  const statusColor = isPending
    ? 'bg-amber-500/12 text-amber-500'
    : reg?.status === 'approved' ? 'bg-lynx-sky/15 text-lynx-sky'
    : reg?.status === 'rostered' ? 'bg-emerald-500/12 text-emerald-500'
    : reg?.status === 'withdrawn' ? 'bg-red-500/12 text-red-500'
    : 'bg-slate-500/12 text-slate-400'

  const waivers = reg?.waivers_accepted || {}

  const cardBg = isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  const SectionTitle = ({ children }) => (
    <h3 className={`text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 pb-1.5 border-b ${borderColor}`}>{children}</h3>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${cardBg} border rounded-[14px] w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-lynx-sky/15 flex items-center justify-center text-lynx-sky font-bold text-xl">
              {player.first_name?.[0]}{player.last_name?.[0]}
            </div>
            <div>
              <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {player.first_name} {player.last_name}
              </h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${statusColor}`}>
                  {isPending ? 'pending' : reg?.status || 'unknown'}
                </span>
                {reg?.submitted_at && (
                  <span className="text-sm text-slate-400">
                    Registered {new Date(reg.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {siblings.length > 0 && (
                  <span className="text-sm px-2 py-0.5 rounded-full bg-purple-500/12 text-purple-500 font-medium">
                    {siblings.length} sibling{siblings.length > 1 ? 's' : ''}: {siblings.map(s => s.first_name).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button onClick={() => setShowCoParentInvite(true)} className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-500 font-bold text-base hover:bg-emerald-500/25 flex items-center gap-2 transition">
                  <UserPlus className="w-4 h-4" /> Invite Co-Parent
                </button>
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-xl bg-lynx-sky/15 text-lynx-sky font-bold text-base hover:bg-lynx-sky/25 flex items-center gap-2 transition">
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none px-2">&times;</button>
          </div>
        </div>

        <div className="p-6">
          {isEditing ? (
            /* EDIT MODE */
            <div className="space-y-6">
              <div>
                <SectionTitle>Player Information</SectionTitle>
                <div className="grid grid-cols-3 gap-3">
                  <EditField label="First Name" value={form.first_name} onChange={v => setForm({...form, first_name: v})} />
                  <EditField label="Last Name" value={form.last_name} onChange={v => setForm({...form, last_name: v})} />
                  <EditField label="Date of Birth" value={form.birth_date} onChange={v => setForm({...form, birth_date: v})} type="date" />
                  <EditField label="Grade" value={form.grade} onChange={v => setForm({...form, grade: v})} />
                  <EditField label="Gender" value={form.gender} onChange={v => setForm({...form, gender: v})} options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'non-binary',label:'Non-binary'}]} />
                  <EditField label="School" value={form.school} onChange={v => setForm({...form, school: v})} />
                  <EditField label="Experience" value={form.experience_level} onChange={v => setForm({...form, experience_level: v})} options={['Beginner', 'Intermediate', 'Advanced', 'Club/Travel']} />
                  <EditField label="Jersey Number" value={form.jersey_number} onChange={v => setForm({...form, jersey_number: v})} type="number" />
                  <EditField label="Jersey Size" value={form.jersey_size} onChange={v => setForm({...form, jersey_size: v})} options={['YXS','YS','YM','YL','YXL','AS','AM','AL','AXL','A2XL']} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <SectionTitle>Parent / Guardian 1</SectionTitle>
                  <div className="grid grid-cols-1 gap-3">
                    <EditField label="Name" value={form.parent_name} onChange={v => setForm({...form, parent_name: v})} />
                    <EditField label="Email" value={form.parent_email} onChange={v => setForm({...form, parent_email: v})} type="email" />
                    <EditField label="Phone" value={form.parent_phone} onChange={v => setForm({...form, parent_phone: v})} type="tel" />
                  </div>
                </div>
                <div>
                  <SectionTitle>Parent / Guardian 2</SectionTitle>
                  <div className="grid grid-cols-1 gap-3">
                    <EditField label="Name" value={form.parent2_name} onChange={v => setForm({...form, parent2_name: v})} />
                    <EditField label="Email" value={form.parent2_email} onChange={v => setForm({...form, parent2_email: v})} type="email" />
                    <EditField label="Phone" value={form.parent2_phone} onChange={v => setForm({...form, parent2_phone: v})} type="tel" />
                  </div>
                </div>
              </div>
              <div>
                <SectionTitle>Address</SectionTitle>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2"><EditField label="Street" value={form.address} onChange={v => setForm({...form, address: v})} /></div>
                  <EditField label="City" value={form.city} onChange={v => setForm({...form, city: v})} />
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="State" value={form.state} onChange={v => setForm({...form, state: v})} />
                    <EditField label="Zip" value={form.zip} onChange={v => setForm({...form, zip: v})} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <SectionTitle>Emergency Contact</SectionTitle>
                  <div className="space-y-3">
                    <EditField label="Name" value={form.emergency_contact_name} onChange={v => setForm({...form, emergency_contact_name: v})} />
                    <EditField label="Phone" value={form.emergency_contact_phone} onChange={v => setForm({...form, emergency_contact_phone: v})} type="tel" />
                    <EditField label="Relation" value={form.emergency_contact_relation} onChange={v => setForm({...form, emergency_contact_relation: v})} />
                  </div>
                </div>
                <div>
                  <SectionTitle>Medical Information</SectionTitle>
                  <div className="space-y-3">
                    <EditField label="Conditions" value={form.medical_conditions} onChange={v => setForm({...form, medical_conditions: v})} multiline />
                    <EditField label="Allergies" value={form.allergies} onChange={v => setForm({...form, allergies: v})} />
                    <EditField label="Medications" value={form.medications} onChange={v => setForm({...form, medications: v})} />
                  </div>
                </div>
                <div>
                  <SectionTitle>Admin Notes</SectionTitle>
                  <EditField label="Notes" value={form.notes} onChange={v => setForm({...form, notes: v})} multiline />
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE — 3-Row Landscape Layout */
            <div className="space-y-5">

              {/* ROW 1: Player Information */}
              <div>
                <SectionTitle>Player Information</SectionTitle>
                <div className="grid grid-cols-4 lg:grid-cols-5 gap-2.5">
                  <InfoRow label="Date of Birth" value={player.birth_date || player.dob ? new Date((player.birth_date || player.dob) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
                  <InfoRow label="Age" value={calculateAge(player.birth_date || player.dob)} />
                  <InfoRow label="Grade" value={player.grade} />
                  <InfoRow label="Gender" value={merged.gender ? merged.gender.charAt(0).toUpperCase() + merged.gender.slice(1) : null} />
                  <InfoRow label="School" value={merged.school} />
                  <InfoRow label="Experience" value={merged.experience_level} />
                  <InfoRow label="Jersey #" value={player.jersey_number} />
                  <InfoRow label="Jersey Prefs" value={[player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean).join(', ') || null} />
                  <InfoRow label="Jersey Size" value={player.jersey_size || player.uniform_size_jersey} />
                  <InfoRow label="Shorts Size" value={player.uniform_size_shorts} />
                </div>
              </div>

              {/* ROW 2: Parent/Guardian(s) + Address */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <SectionTitle>Parent / Guardian</SectionTitle>
                  <div className="grid grid-cols-2 gap-2.5">
                    <InfoRow label="Name" value={player.parent_name} />
                    <InfoRow label="Email" value={player.parent_email} />
                    <InfoRow label="Phone" value={formatPhone(player.parent_phone)} />
                    <InfoRow label="Address" value={fullAddress || null} />
                  </div>
                  {merged.parent2_name && (
                    <div className="mt-2.5">
                      <p className="text-sm uppercase tracking-wider font-bold text-slate-400 mb-2">Parent / Guardian 2</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <InfoRow label="Name" value={merged.parent2_name} />
                        <InfoRow label="Email" value={merged.parent2_email} />
                        <InfoRow label="Phone" value={formatPhone(merged.parent2_phone)} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <SectionTitle>Emergency Contact</SectionTitle>
                  <div className="grid grid-cols-3 gap-2.5">
                    <InfoRow label="Name" value={merged.emergency_name} />
                    <InfoRow label="Phone" value={formatPhone(merged.emergency_phone)} />
                    <InfoRow label="Relation" value={merged.emergency_relation} />
                  </div>
                </div>
              </div>

              {/* ROW 3: Medical + Waivers + Custom Answers */}
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <SectionTitle>Medical Information</SectionTitle>
                  <div className="space-y-2.5">
                    <InfoRow label="Conditions" value={merged.medical_conditions || 'None'} />
                    <InfoRow label="Allergies" value={merged.allergies || 'None'} />
                    <InfoRow label="Medications" value={merged.medications || 'None'} />
                  </div>
                </div>

                <div>
                  <SectionTitle>Waivers</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(waivers).length > 0 ? (
                      Object.entries(waivers).map(([key, val]) => (
                        <WaiverBadge key={key} label={key.replace(/_/g, ' ').replace(/waiver /i, '')} signed={val} />
                      ))
                    ) : (
                      <>
                        <WaiverBadge label="Liability" signed={player.waiver_liability} />
                        <WaiverBadge label="Photo" signed={player.waiver_photo} />
                        <WaiverBadge label="Conduct" signed={player.waiver_conduct} />
                      </>
                    )}
                  </div>
                  {(reg?.signature_name || player.waiver_signed_by) && (
                    <p className="text-base text-slate-400 mt-3">
                      Signed by <span className="font-semibold">{reg?.signature_name || player.waiver_signed_by}</span>
                      {(reg?.signature_date || player.waiver_signed_date) && (
                        <> on {new Date(reg?.signature_date || player.waiver_signed_date).toLocaleDateString()}</>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <SectionTitle>Registration Status</SectionTitle>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColor}`}>
                      {isPending ? 'pending' : reg?.status || 'unknown'}
                    </span>
                    {reg?.submitted_at && (
                      <span className="text-sm text-slate-400">
                        {new Date(reg.submitted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {reg?.deny_reason && (
                    <p className="text-base text-red-500 mt-2">Reason: {reg.deny_reason}</p>
                  )}
                  {reg?.custom_answers && Object.keys(reg.custom_answers).length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm uppercase tracking-wider font-bold text-slate-400 mb-2">Custom Answers</p>
                      <div className="space-y-1.5">
                        {Object.entries(reg.custom_answers).map(([q, a]) => (
                          <div key={q} className="text-base text-slate-400">
                            <span className="font-medium">{q}:</span> {a || '—'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${borderColor} flex justify-end gap-3`}>
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className={`px-6 py-2 rounded-xl border ${borderColor} ${isDark ? 'text-white' : 'text-slate-900'} font-medium hover:opacity-80 transition`}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-xl bg-lynx-sky text-lynx-navy font-bold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={onClose} className={`px-6 py-2 rounded-xl ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} font-medium transition`}>
              Close
            </button>
          )}
        </div>
      </div>

      {showCoParentInvite && (
        <InviteCoParentModal
          playerIds={[player.id]}
          playerNames={[`${player.first_name} ${player.last_name}`]}
          familyId={player.family_id || null}
          organizationId={organization?.id || player.organization_id}
          onClose={() => setShowCoParentInvite(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
