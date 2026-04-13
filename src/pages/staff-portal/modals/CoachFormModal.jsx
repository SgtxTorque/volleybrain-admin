import { useState, useRef } from 'react'
import { useThemeClasses } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import {
  Camera, Shield, FileText, Award, X
} from '../../../constants/icons'

export default function CoachFormModal({ coach, onSave, onClose, showToast }) {
  const tc = useThemeClasses()
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [certInput, setCertInput] = useState({ name: '', issuer: '', expires: '', verified: false })

  const [form, setForm] = useState({
    first_name: coach?.first_name || '', last_name: coach?.last_name || '',
    email: coach?.email || '', phone: coach?.phone || '',
    secondary_phone: coach?.secondary_phone || '', preferred_contact: coach?.preferred_contact || 'email',
    address: coach?.address || '', date_of_birth: coach?.date_of_birth || '',
    gender: coach?.gender || '', shirt_size: coach?.shirt_size || '',
    photo_url: coach?.photo_url || '', bio: coach?.bio || '',
    experience_years: coach?.experience_years || '', experience_details: coach?.experience_details || '',
    specialties: coach?.specialties || '', coaching_license: coach?.coaching_license || '',
    coaching_level: coach?.coaching_level || '',
    preferred_sports: coach?.preferred_sports || ['volleyball'],
    preferred_age_groups: coach?.preferred_age_groups || [],
    availability: coach?.availability || '',
    certifications: coach?.certifications || [],
    background_check_status: coach?.background_check_status || 'not_started',
    background_check_date: coach?.background_check_date || '',
    background_check_expiry: coach?.background_check_expiry || '',
    waiver_signed: coach?.waiver_signed || false,
    waiver_signed_at: coach?.waiver_signed_at || null,
    waiver_signer_name: coach?.waiver_signer_name || '',
    code_of_conduct_signed: coach?.code_of_conduct_signed || false,
    code_of_conduct_signed_at: coach?.code_of_conduct_signed_at || null,
    emergency_contact_name: coach?.emergency_contact_name || '',
    emergency_contact_phone: coach?.emergency_contact_phone || '',
    emergency_contact_relation: coach?.emergency_contact_relation || '',
    status: coach?.status || 'active', notes: coach?.notes || ''
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `coach-photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      set('photo_url', publicUrl)
      showToast?.('Photo uploaded', 'success')
    } catch (err) {
      showToast?.(`Upload failed: ${err.message}`, 'error')
    }
    setUploading(false)
  }

  function addCert() {
    if (!certInput.name) return
    set('certifications', [...form.certifications, { ...certInput }])
    setCertInput({ name: '', issuer: '', expires: '', verified: false })
  }
  function removeCert(idx) { set('certifications', form.certifications.filter((_, i) => i !== idx)) }

  function handleSubmit() {
    if (!form.first_name || !form.last_name) { showToast?.('First and last name required', 'error'); return }
    const clean = (v) => (v === '' || v === undefined) ? null : v
    onSave({
      ...form,
      date_of_birth: clean(form.date_of_birth),
      background_check_date: clean(form.background_check_date),
      background_check_expiry: clean(form.background_check_expiry),
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      gender: clean(form.gender),
      shirt_size: clean(form.shirt_size),
      availability: clean(form.availability),
      waiver_signed_at: form.waiver_signed && !coach?.waiver_signed ? new Date().toISOString() : clean(form.waiver_signed_at),
      code_of_conduct_signed_at: form.code_of_conduct_signed && !coach?.code_of_conduct_signed ? new Date().toISOString() : clean(form.code_of_conduct_signed_at),
    })
  }

  const steps = [
    { id: 1, label: 'Personal', icon: '👤' },
    { id: 2, label: 'Experience', icon: '🏆' },
    { id: 3, label: 'Compliance', icon: '🛡️' },
    { id: 4, label: 'Emergency', icon: '🚨' },
  ]
  const ic = `w-full rounded-xl px-4 py-3 text-sm ${tc.cardBg} border ${tc.border} ${tc.text}`
  const lc = `block text-xs font-medium ${tc.textMuted} mb-1.5 uppercase tracking-wider`

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>{coach ? 'Edit Coach' : 'Add Coach'}</h2>
          <button onClick={onClose} className={`${tc.textMuted} text-2xl`}>×</button>
        </div>

        {/* Steps */}
        <div className={`flex border-b ${tc.border}`}>
          {steps.map(s => (
            <button key={s.id} onClick={() => setStep(s.id)}
              className={`flex-1 py-3 text-xs font-medium text-center transition ${step === s.id ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : tc.textMuted}`}>
              <span className="text-base mr-1">{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 1: Personal Info */}
          {step === 1 && (<>
            <div className="flex items-center gap-4">
              <div className="relative">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                    {form.first_name?.[0] || '?'}{form.last_name?.[0] || ''}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-lg hover:brightness-110">
                  {uploading ? <span className="animate-spin text-xs">⏳</span> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div><p className={`text-sm font-medium ${tc.text}`}>Coach Photo</p><p className={`text-xs ${tc.textMuted}`}>Click the camera to upload</p></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>First Name *</label><input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} className={ic} placeholder="John" /></div>
              <div><label className={lc}>Last Name *</label><input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} className={ic} placeholder="Smith" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={ic} placeholder="coach@email.com" /></div>
              <div><label className={lc}>Phone</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={ic} placeholder="(555) 555-5555" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={lc}>Secondary Phone</label><input type="tel" value={form.secondary_phone} onChange={e => set('secondary_phone', e.target.value)} className={ic} /></div>
              <div><label className={lc}>Preferred Contact</label>
                <select value={form.preferred_contact} onChange={e => set('preferred_contact', e.target.value)} className={ic}>
                  <option value="email">Email</option><option value="phone">Phone Call</option><option value="text">Text Message</option>
                </select>
              </div>
              <div><label className={lc}>Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className={ic}>
                  <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-Binary</option><option value="prefer_not_to_say">Prefer Not to Say</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={lc}>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={ic} /></div>
              <div><label className={lc}>Shirt Size</label>
                <select value={form.shirt_size} onChange={e => set('shirt_size', e.target.value)} className={ic}>
                  <option value="">—</option>{['XS','S','M','L','XL','2XL','3XL','4XL'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={lc}>Address</label><input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={ic} placeholder="123 Main St" /></div>
            </div>
            <div><label className={lc}>Bio</label><textarea value={form.bio} onChange={e => set('bio', e.target.value)} className={`${ic} h-24 resize-none`} placeholder="Tell parents and players about yourself..." /></div>
          </>)}

          {/* STEP 2: Experience */}
          {step === 2 && (<>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>Years of Experience</label><input type="number" value={form.experience_years} onChange={e => set('experience_years', e.target.value)} className={ic} min="0" /></div>
              <div><label className={lc}>Coaching Level</label><input type="text" value={form.coaching_level} onChange={e => set('coaching_level', e.target.value)} className={ic} placeholder="e.g., USAV CAP Level 2" /></div>
            </div>
            <div><label className={lc}>Specialties</label><input type="text" value={form.specialties} onChange={e => set('specialties', e.target.value)} className={ic} placeholder="Setting, Defense, Serving" /></div>
            <div><label className={lc}>Coaching License</label><input type="text" value={form.coaching_license} onChange={e => set('coaching_license', e.target.value)} className={ic} placeholder="License # or cert ID" /></div>
            <div><label className={lc}>Experience Details</label><textarea value={form.experience_details} onChange={e => set('experience_details', e.target.value)} className={`${ic} h-24 resize-none`} placeholder="Previous teams, leagues, accomplishments..." /></div>
            <div><label className={lc}>Availability</label>
              <select value={form.availability} onChange={e => set('availability', e.target.value)} className={ic}>
                <option value="">—</option><option value="all">All (Weekdays & Weekends)</option><option value="weekdays">Weekdays Only</option><option value="weekends">Weekends Only</option><option value="evenings">Evenings Only</option>
              </select>
            </div>

            <div>
              <label className={lc}>Certifications</label>
              {form.certifications?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {form.certifications.map((cert, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${tc.border}`}>
                      <div><p className={`text-sm ${tc.text}`}>{cert.name}{cert.issuer ? ` (${cert.issuer})` : ''}</p>{cert.expires && <p className={`text-xs ${tc.textMuted}`}>Exp: {cert.expires}</p>}</div>
                      <button onClick={() => removeCert(i)} className="text-red-400 hover:text-red-300 p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                <input type="text" value={certInput.name} onChange={e => setCertInput(p => ({...p, name: e.target.value}))} className={ic} placeholder="Cert name" />
                <input type="text" value={certInput.issuer} onChange={e => setCertInput(p => ({...p, issuer: e.target.value}))} className={ic} placeholder="Issuer" />
                <input type="date" value={certInput.expires} onChange={e => setCertInput(p => ({...p, expires: e.target.value}))} className={ic} />
                <button onClick={addCert} className="px-3 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium">+ Add</button>
              </div>
            </div>
          </>)}

          {/* STEP 3: Compliance */}
          {step === 3 && (<>
            <div className={`p-3 rounded-[14px] mb-2 ${tc.cardBgAlt}`}>
              <p className={`text-sm ${tc.textSecondary}`}>
                <span className="font-medium">These fields are optional.</span> Track coach compliance with your organization's requirements.
              </p>
              <p className={`text-xs mt-1 ${tc.textMuted}`}>
                Configure organization waivers in{' '}
                <a href="/settings/waivers" className="text-[#4BB9EC] hover:underline">Settings &rarr; Waivers</a>
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3 flex items-center gap-2`}><Shield className="w-4 h-4" /> Background Check</h4>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lc}>Status</label>
                  <select value={form.background_check_status} onChange={e => set('background_check_status', e.target.value)} className={ic}>
                    <option value="not_started">Not Started</option><option value="pending">Pending</option><option value="cleared">Cleared</option><option value="failed">Failed</option><option value="expired">Expired</option>
                  </select>
                </div>
                <div><label className={lc}>Completed Date</label><input type="date" value={form.background_check_date} onChange={e => set('background_check_date', e.target.value)} className={ic} /></div>
                <div><label className={lc}>Expiry Date</label><input type="date" value={form.background_check_expiry} onChange={e => set('background_check_expiry', e.target.value)} className={ic} /></div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3 flex items-center gap-2`}><FileText className="w-4 h-4" /> Liability Waiver</h4>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={form.waiver_signed} onChange={e => set('waiver_signed', e.target.checked)} className="w-5 h-5 rounded" />
                <span className={tc.text}>Waiver signed</span>
              </label>
              {form.waiver_signed && (
                <div><label className={lc}>Signer Name</label><input type="text" value={form.waiver_signer_name} onChange={e => set('waiver_signer_name', e.target.value)} className={ic} placeholder="Full legal name" /></div>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3 flex items-center gap-2`}><Award className="w-4 h-4" /> Code of Conduct</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.code_of_conduct_signed} onChange={e => set('code_of_conduct_signed', e.target.checked)} className="w-5 h-5 rounded" />
                <span className={tc.text}>Code of conduct acknowledged</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={ic}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div><label className={lc}>Admin Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={`${ic} h-24 resize-none`} placeholder="Internal notes (not visible to coaches)..." /></div>
          </>)}

          {/* STEP 4: Emergency */}
          {step === 4 && (<>
            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3`}>🚨 Emergency Contact</h4>
              <div className="space-y-3">
                <div><label className={lc}>Contact Name</label><input type="text" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} className={ic} placeholder="Jane Doe" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>Phone</label><input type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} className={ic} placeholder="(555) 555-5555" /></div>
                  <div><label className={lc}>Relationship</label><input type="text" value={form.emergency_contact_relation} onChange={e => set('emergency_contact_relation', e.target.value)} className={ic} placeholder="Spouse" /></div>
                </div>
              </div>
            </div>
          </>)}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${tc.border} flex items-center justify-between`}>
          <div className="flex gap-2">
            {step > 1 && <button onClick={() => setStep(step - 1)} className={`px-4 py-2 rounded-xl border ${tc.border} ${tc.text} text-sm`}>← Back</button>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className={`px-4 py-2 rounded-xl border ${tc.border} ${tc.text} text-sm`}>Cancel</button>
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm">Next →</button>
            ) : (
              <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm">{coach ? 'Save Changes' : 'Add Coach'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
