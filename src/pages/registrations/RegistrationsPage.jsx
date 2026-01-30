import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { generateFeesForPlayer } from '../../lib/fee-calculator'
import { EmailService, isEmailEnabled } from '../../lib/email-service'
import { exportToCSV } from '../../lib/csv-export'
import { 
  ClipboardList, Table, BarChart3, List, Calendar, Check, DollarSign, Edit, Trash2
} from '../../constants/icons'

// ============================================
// HELPER FUNCTIONS
// ============================================
export function calculateAge(birthDate) {
  if (!birthDate) return 'N/A'
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ============================================
// CLICKABLE PLAYER NAME
// ============================================
export function ClickablePlayerName({ player, className = '', children, onPlayerSelect }) {
  const { isDark } = useTheme()
  
  if (!player) return <span className={className}>{children || 'Unknown'}</span>
  
  const displayName = children || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown'
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onPlayerSelect?.(player)
      }}
      className={`${className} hover:text-[var(--accent-primary)] hover:underline cursor-pointer transition-colors text-left`}
    >
      {displayName}
    </button>
  )
}

// ============================================
// INFO ROW (for detail modals) - Compact version
// ============================================
function InfoRow({ label, value, tc }) {
  return (
    <div className={`${tc?.cardBgAlt || 'bg-slate-100 dark:bg-slate-900'} rounded-lg px-3 py-2`}>
      <p className={`text-xs ${tc?.textMuted || 'text-slate-400'} uppercase tracking-wide`}>{label}</p>
      <p className={`${tc?.text || 'text-slate-900 dark:text-white'} font-semibold mt-0.5`}>{value || '—'}</p>
    </div>
  )
}

// ============================================
// WAIVER BADGE
// ============================================
function WaiverBadge({ label, signed }) {
  return (
    <div className={`px-3 py-2 rounded-lg ${signed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
      <p className={`text-xs font-medium ${signed ? 'text-emerald-400' : 'text-red-400'}`}>
        {signed ? '✓' : '✗'} {label}
      </p>
    </div>
  )
}

// ============================================
// EDIT FIELD (for edit modals)
// ============================================
function EditField({ label, value, onChange, type = 'text', options, multiline, tc }) {
  const inputClasses = `w-full ${tc?.inputBg || 'bg-white dark:bg-slate-900'} border ${tc?.border || 'border-slate-300 dark:border-slate-700'} rounded-lg px-3 py-2 ${tc?.text || 'text-slate-900 dark:text-white'} text-sm`
  
  if (options) {
    return (
      <div>
        <label className={`block text-xs ${tc?.textMuted || 'text-slate-500'} mb-1`}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className={inputClasses}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }
  if (multiline) {
    return (
      <div>
        <label className={`block text-xs ${tc?.textMuted || 'text-slate-500'} mb-1`}>{label}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)}
          className={`${inputClasses} min-h-[80px]`} />
      </div>
    )
  }
  return (
    <div>
      <label className={`block text-xs ${tc?.textMuted || 'text-slate-500'} mb-1`}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputClasses} />
    </div>
  )
}

// ============================================
// PLAYER DETAIL/EDIT MODAL
// ============================================
export function PlayerDetailModal({ player, editMode, onClose, onUpdate, showToast }) {
  const tc = useThemeClasses()
  const reg = player.registrations?.[0]
  const [isEditing, setIsEditing] = useState(editMode)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: player.first_name || '',
    last_name: player.last_name || '',
    birth_date: player.birth_date || player.dob || '',
    grade: player.grade || '',
    gender: player.gender || '',
    school: player.school || '',
    experience_level: player.experience_level || player.experience || '',
    parent_name: player.parent_name || '',
    parent_email: player.parent_email || '',
    parent_phone: player.parent_phone || '',
    address: player.address || '',
    parent_2_name: player.parent_2_name || '',
    parent_2_email: player.parent_2_email || '',
    parent_2_phone: player.parent_2_phone || '',
    emergency_contact_name: player.emergency_contact_name || player.emergency_name || '',
    emergency_contact_phone: player.emergency_contact_phone || player.emergency_phone || '',
    emergency_contact_relation: player.emergency_contact_relation || player.emergency_relation || '',
    medical_conditions: player.medical_conditions || '',
    allergies: player.allergies || '',
    medications: player.medications || '',
    jersey_number: player.jersey_number || '',
    jersey_size: player.jersey_size || '',
    notes: player.notes || '',
  })

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

  // Section Header component for consistency
  const SectionHeader = ({ children }) => (
    <h3 className={`text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2 pb-1 border-b ${tc.border}`}>
      {children}
    </h3>
  )

  // Compact info display
  const InfoItem = ({ label, value }) => (
    <div className="min-w-0">
      <p className={`text-[10px] uppercase tracking-wide ${tc.textMuted}`}>{label}</p>
      <p className={`${tc.text} font-medium truncate`}>{value || '—'}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${tc.border} flex items-center justify-between sticky top-0 ${tc.cardBg} z-10`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
              <span className="text-[var(--accent-primary)] font-bold text-lg">
                {player.first_name?.[0]}{player.last_name?.[0]}
              </span>
            </div>
            <div>
              <h2 className={`text-xl font-bold ${tc.text}`}>
                {player.first_name} {player.last_name}
              </h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  reg?.status === 'submitted' || reg?.status === 'new' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
                  reg?.status === 'approved' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                  reg?.status === 'rostered' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  reg?.status === 'withdrawn' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                  'bg-gray-500/20 text-slate-500'
                }`}>{reg?.status === 'submitted' || reg?.status === 'new' ? 'pending' : reg?.status || 'unknown'}</span>
                <span className={`text-xs ${tc.textMuted}`}>
                  Registered {reg?.submitted_at ? new Date(reg.submitted_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center gap-2 font-medium">
                <Edit className="w-4 h-4" /> Edit
              </button>
            )}
            <button onClick={onClose} className={`w-8 h-8 rounded-lg ${tc.cardBgAlt} ${tc.textMuted} hover:${tc.text} flex items-center justify-center text-xl`}>×</button>
          </div>
        </div>
        
        {/* Content */}
        {isEditing ? (
          /* Edit Mode - Keep original 2-column layout */
          <div className="p-6 space-y-6">
            <div>
              <SectionHeader>Player Information</SectionHeader>
              <div className="grid grid-cols-3 gap-4">
                <EditField tc={tc} label="First Name" value={form.first_name} onChange={v => setForm({...form, first_name: v})} />
                <EditField tc={tc} label="Last Name" value={form.last_name} onChange={v => setForm({...form, last_name: v})} />
                <EditField tc={tc} label="Date of Birth" value={form.birth_date} onChange={v => setForm({...form, birth_date: v})} type="date" />
                <EditField tc={tc} label="Grade" value={form.grade} onChange={v => setForm({...form, grade: v})} type="number" />
                <EditField tc={tc} label="Gender" value={form.gender} onChange={v => setForm({...form, gender: v})} options={['Male', 'Female', 'Other']} />
                <EditField tc={tc} label="School" value={form.school} onChange={v => setForm({...form, school: v})} />
                <EditField tc={tc} label="Experience" value={form.experience_level} onChange={v => setForm({...form, experience_level: v})} options={['Beginner', 'Intermediate', 'Advanced']} />
                <EditField tc={tc} label="Jersey Number" value={form.jersey_number} onChange={v => setForm({...form, jersey_number: v})} type="number" />
                <EditField tc={tc} label="Jersey Size" value={form.jersey_size} onChange={v => setForm({...form, jersey_size: v})} options={['YS', 'YM', 'YL', 'AS', 'AM', 'AL', 'AXL']} />
              </div>
            </div>
            <div>
              <SectionHeader>Parent/Guardian</SectionHeader>
              <div className="grid grid-cols-3 gap-4">
                <EditField tc={tc} label="Parent Name" value={form.parent_name} onChange={v => setForm({...form, parent_name: v})} />
                <EditField tc={tc} label="Parent Email" value={form.parent_email} onChange={v => setForm({...form, parent_email: v})} type="email" />
                <EditField tc={tc} label="Parent Phone" value={form.parent_phone} onChange={v => setForm({...form, parent_phone: v})} type="tel" />
                <EditField tc={tc} label="Address" value={form.address} onChange={v => setForm({...form, address: v})} />
                <EditField tc={tc} label="Parent 2 Name" value={form.parent_2_name} onChange={v => setForm({...form, parent_2_name: v})} />
                <EditField tc={tc} label="Parent 2 Phone" value={form.parent_2_phone} onChange={v => setForm({...form, parent_2_phone: v})} type="tel" />
              </div>
            </div>
            <div>
              <SectionHeader>Emergency Contact</SectionHeader>
              <div className="grid grid-cols-3 gap-4">
                <EditField tc={tc} label="Name" value={form.emergency_contact_name} onChange={v => setForm({...form, emergency_contact_name: v})} />
                <EditField tc={tc} label="Phone" value={form.emergency_contact_phone} onChange={v => setForm({...form, emergency_contact_phone: v})} type="tel" />
                <EditField tc={tc} label="Relation" value={form.emergency_contact_relation} onChange={v => setForm({...form, emergency_contact_relation: v})} />
              </div>
            </div>
            <div>
              <SectionHeader>Medical Information</SectionHeader>
              <div className="grid grid-cols-3 gap-4">
                <EditField tc={tc} label="Medical Conditions" value={form.medical_conditions} onChange={v => setForm({...form, medical_conditions: v})} />
                <EditField tc={tc} label="Allergies" value={form.allergies} onChange={v => setForm({...form, allergies: v})} />
                <EditField tc={tc} label="Medications" value={form.medications} onChange={v => setForm({...form, medications: v})} />
              </div>
            </div>
            <div>
              <SectionHeader>Admin Notes</SectionHeader>
              <EditField tc={tc} label="Notes" value={form.notes} onChange={v => setForm({...form, notes: v})} multiline />
            </div>
          </div>
        ) : (
          /* View Mode - Wide landscape layout */
          <div className="p-6">
            {/* Top row - Player info in card grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Player Info Card */}
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <SectionHeader>Player Information</SectionHeader>
                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                  <InfoItem label="Date of Birth" value={player.birth_date || player.dob} />
                  <InfoItem label="Grade" value={player.grade} />
                  <InfoItem label="Gender" value={player.gender} />
                  <InfoItem label="School" value={player.school} />
                  <InfoItem label="Experience" value={player.experience_level || player.experience} />
                  <InfoItem label="Jersey Size" value={player.jersey_size} />
                </div>
              </div>

              {/* Parent Info Card */}
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <SectionHeader>Parent/Guardian</SectionHeader>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Name" value={player.parent_name} />
                  <InfoItem label="Email" value={player.parent_email} />
                  <InfoItem label="Phone" value={player.parent_phone} />
                  <InfoItem label="Address" value={player.address} />
                  {player.parent_2_name && <InfoItem label="Parent 2" value={player.parent_2_name} />}
                  {player.parent_2_phone && <InfoItem label="Parent 2 Phone" value={player.parent_2_phone} />}
                </div>
              </div>
            </div>

            {/* Bottom row - Emergency, Medical, Waivers */}
            <div className="grid grid-cols-3 gap-6">
              {/* Emergency Contact Card */}
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <SectionHeader>Emergency Contact</SectionHeader>
                <div className="space-y-3">
                  <InfoItem label="Name" value={player.emergency_contact_name || player.emergency_name} />
                  <InfoItem label="Phone" value={player.emergency_contact_phone || player.emergency_phone} />
                  <InfoItem label="Relation" value={player.emergency_contact_relation || player.emergency_relation} />
                </div>
              </div>

              {/* Medical Card */}
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <SectionHeader>Medical Information</SectionHeader>
                <div className="space-y-3">
                  <InfoItem label="Conditions" value={player.medical_conditions || 'None'} />
                  <InfoItem label="Allergies" value={player.allergies || 'None'} />
                  <InfoItem label="Medications" value={player.medications || 'None'} />
                </div>
              </div>

              {/* Waivers Card */}
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <SectionHeader>Waivers & Signature</SectionHeader>
                <div className="flex gap-2 mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${player.waiver_liability ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                    {player.waiver_liability ? '✓' : '✗'} Liability
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${player.waiver_photo ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/20 text-slate-500'}`}>
                    {player.waiver_photo ? '✓' : '—'} Photo
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${player.waiver_conduct ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                    {player.waiver_conduct ? '✓' : '✗'} Conduct
                  </span>
                </div>
                {player.waiver_signed_by && (
                  <div className="space-y-1">
                    <InfoItem label="Signed By" value={player.waiver_signed_by} />
                    <InfoItem label="Signed Date" value={player.waiver_signed_date ? new Date(player.waiver_signed_date).toLocaleDateString() : null} />
                  </div>
                )}
              </div>
            </div>

            {/* Denial reason if applicable */}
            {reg?.denial_reason && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <span className="font-semibold">Denial Reason:</span> {reg.denial_reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${tc.border} flex justify-end gap-3 sticky bottom-0 ${tc.cardBg}`}>
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className={`px-5 py-2 rounded-lg border ${tc.border} ${tc.text} font-medium`}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={onClose} className={`px-5 py-2 rounded-lg ${tc.cardBgAlt} ${tc.text} font-medium hover:opacity-80`}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// DENY REGISTRATION MODAL
// ============================================
export function DenyRegistrationModal({ player, onClose, onDeny }) {
  const tc = useThemeClasses()
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Deny Registration</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>{player.first_name} {player.last_name}</p>
        </div>
        <div className="p-6">
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Reason for denial (optional)</label>
          <textarea 
            value={reason} 
            onChange={e => setReason(e.target.value)}
            placeholder="Enter reason..."
            className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} min-h-[100px]`}
          />
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Cancel
          </button>
          <button onClick={() => onDeny(reason)} className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold">
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
  const tc = useThemeClasses()
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Deny {count} Registrations</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>This action cannot be undone.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Reason for denial (optional)</label>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Season is full, missing required documents..."
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} min-h-[100px]`}
            />
          </div>
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Cancel
          </button>
          <button 
            onClick={() => onDeny(reason)}
            disabled={processing}
            className="px-6 py-2 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
          >
            {processing ? 'Processing...' : `Deny ${count} Registrations`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DELETE REGISTRATION MODAL
// ============================================
export function DeleteRegistrationModal({ player, onClose, onDelete, processing }) {
  const tc = useThemeClasses()
  const [confirmText, setConfirmText] = useState('')
  const reg = player?.registrations?.[0]
  
  const canDelete = confirmText.toLowerCase() === 'delete'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${tc.text}`}>Delete Registration</h2>
              <p className={`${tc.textMuted} text-sm`}>{player?.first_name} {player?.last_name}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4`}>
            <p className={`text-sm ${tc.textSecondary}`}>
              This will <span className="text-red-400 font-semibold">permanently delete</span> this registration including:
            </p>
            <ul className={`text-sm ${tc.textMuted} mt-2 space-y-1 ml-4`}>
              <li>• Player record and all data</li>
              <li>• Registration history</li>
              <li>• Associated payment records</li>
              <li>• Waiver signatures</li>
            </ul>
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>
              Type <span className="font-mono text-red-400">delete</span> to confirm
            </label>
            <input 
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete"
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`}
              autoFocus
            />
          </div>
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3`}>
          <button 
            onClick={onClose} 
            className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}
            disabled={processing}
          >
            Cancel
          </button>
          <button 
            onClick={onDelete}
            disabled={!canDelete || processing}
            className="px-6 py-2 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Deleting...' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// REGISTRATION ANALYTICS
// ============================================
export function RegistrationAnalytics({ registrations, season, statusCounts, showToast }) {
  const tc = useThemeClasses()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (season?.id) loadPaymentData()
  }, [season?.id])

  async function loadPaymentData() {
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('season_id', season.id)
      setPayments(data || [])
    } catch (err) {
      console.error('Error loading payments:', err)
    }
    setLoading(false)
  }

  // Calculate metrics
  const totalRegistrations = registrations.length
  const approvalRate = totalRegistrations > 0 
    ? ((statusCounts.approved + statusCounts.rostered) / totalRegistrations * 100).toFixed(1)
    : 0

  // Revenue metrics
  const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const collectedRevenue = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const outstandingRevenue = totalRevenue - collectedRevenue
  const collectionRate = totalRevenue > 0 ? (collectedRevenue / totalRevenue * 100).toFixed(1) : 0

  // Family metrics
  const uniqueFamilies = [...new Set(registrations.map(r => r.parent_email?.toLowerCase()).filter(Boolean))]
  const familyCount = uniqueFamilies.length
  const avgPlayersPerFamily = familyCount > 0 ? (totalRegistrations / familyCount).toFixed(1) : 0

  // Registration timeline - group by date
  const registrationsByDate = registrations.reduce((acc, r) => {
    const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Unknown'
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  // Get last 14 days of data
  const last14Days = []
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString()
    last14Days.push({
      date: dateStr,
      shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: registrationsByDate[dateStr] || 0
    })
  }

  const maxDailyRegs = Math.max(...last14Days.map(d => d.count), 1)

  // Grade distribution
  const gradeDistribution = registrations.reduce((acc, r) => {
    const grade = r.grade || 'Unknown'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {})

  // Gender distribution
  const genderDistribution = registrations.reduce((acc, r) => {
    const gender = r.gender || 'Unknown'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {})

  // Conversion funnel
  const funnel = [
    { stage: 'Submitted', count: totalRegistrations, color: 'bg-slate-500' },
    { stage: 'Pending Review', count: statusCounts.pending, color: 'bg-[var(--accent-primary)]' },
    { stage: 'Approved', count: statusCounts.approved, color: 'bg-blue-500' },
    { stage: 'On Roster', count: statusCounts.rostered, color: 'bg-emerald-500' },
  ]

  // Calculate capacity if available
  const capacity = season?.capacity || 0
  const capacityUsed = statusCounts.approved + statusCounts.rostered
  const capacityPercent = capacity > 0 ? (capacityUsed / capacity * 100).toFixed(0) : null

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${tc.textMuted}`}>Total Registrations</p>
              <p className={`text-3xl font-bold ${tc.text}`}>{totalRegistrations}</p>
            </div>
            <ClipboardList className="w-8 h-8" />
          </div>
          <p className={`text-xs ${tc.textMuted} mt-2`}>{familyCount} families</p>
        </div>

        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${tc.textMuted}`}>Approval Rate</p>
              <p className={`text-3xl font-bold text-emerald-400`}>{approvalRate}%</p>
            </div>
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <p className={`text-xs ${tc.textMuted} mt-2`}>{statusCounts.approved + statusCounts.rostered} approved</p>
        </div>

        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${tc.textMuted}`}>Revenue</p>
              <p className={`text-3xl font-bold text-emerald-400`}>${collectedRevenue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-10 h-10" />
          </div>
          <p className={`text-xs text-amber-400 mt-2`}>${outstandingRevenue.toFixed(0)} outstanding</p>
        </div>

        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${tc.textMuted}`}>Collection Rate</p>
              <p className={`text-3xl font-bold ${parseFloat(collectionRate) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{collectionRate}%</p>
            </div>
            <span className="text-3xl">📈</span>
          </div>
          <p className={`text-xs ${tc.textMuted} mt-2`}>${totalRevenue.toFixed(0)} total due</p>
        </div>
      </div>

      {/* Capacity Bar (if capacity is set) */}
      {capacity > 0 && (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${tc.text}`}>Season Capacity</h3>
            <span className={`text-sm ${capacityPercent >= 90 ? 'text-red-400' : capacityPercent >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {capacityUsed} / {capacity} spots filled
            </span>
          </div>
          <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${tc.textMuted}`}>
              {statusCounts.waitlist > 0 && `${statusCounts.waitlist} on waitlist`}
            </span>
            <span className={`text-xs ${tc.textMuted}`}>
              {capacity - capacityUsed > 0 ? `${capacity - capacityUsed} spots left` : 'Full!'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Timeline Chart */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
            <Calendar className="w-5 h-5" />Registration Timeline (Last 14 Days)
          </h3>
          <div className="flex items-end justify-between h-40 gap-1">
            {last14Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full flex items-end justify-center">
                  <div 
                    className="w-full max-w-[24px] bg-[var(--accent-primary)] rounded-t transition-all hover:brightness-110"
                    style={{ height: `${(day.count / maxDailyRegs) * 100}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                    title={`${day.date}: ${day.count} registrations`}
                  />
                </div>
                <p className={`text-[10px] ${tc.textMuted} mt-1 rotate-[-45deg] origin-top-left translate-y-2`}>
                  {day.shortDate}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-2 border-t border-slate-700/50">
            <p className={`text-sm ${tc.textMuted}`}>
              Total in period: <span className={tc.text}>{last14Days.reduce((sum, d) => sum + d.count, 0)}</span>
              {' · '}Avg/day: <span className={tc.text}>{(last14Days.reduce((sum, d) => sum + d.count, 0) / 14).toFixed(1)}</span>
            </p>
          </div>
        </div>

        {/* Status Funnel */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4`}>🔄 Registration Funnel</h3>
          <div className="space-y-3">
            {funnel.map((stage, i) => {
              const percent = totalRegistrations > 0 ? (stage.count / totalRegistrations * 100) : 0
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm ${tc.textSecondary}`}>{stage.stage}</span>
                    <span className={`text-sm font-medium ${tc.text}`}>{stage.count}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {statusCounts.waitlist > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className={`text-sm text-amber-400`}>⏳ Waitlist</span>
                <span className={`text-sm font-medium text-amber-400`}>{statusCounts.waitlist}</span>
              </div>
            </div>
          )}
          {statusCounts.denied > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm text-red-400`}>✗ Denied</span>
                <span className={`text-sm font-medium text-red-400`}>{statusCounts.denied}</span>
              </div>
            </div>
          )}
        </div>

        {/* Grade Distribution */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4`}>🎓 Grade Distribution</h3>
          <div className="space-y-2">
            {Object.entries(gradeDistribution)
              .sort((a, b) => {
                const gradeOrder = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'Unknown']
                return gradeOrder.indexOf(a[0]) - gradeOrder.indexOf(b[0])
              })
              .map(([grade, count]) => {
                const percent = (count / totalRegistrations * 100)
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span className={`w-20 text-sm ${tc.textSecondary}`}>Grade {grade}</span>
                    <div className="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                      <div 
                        className="h-full bg-[var(--accent-primary)] flex items-center justify-end pr-2"
                        style={{ width: `${percent}%`, minWidth: count > 0 ? '30px' : '0' }}
                      >
                        <span className="text-xs text-white font-medium">{count}</span>
                      </div>
                    </div>
                    <span className={`w-12 text-xs ${tc.textMuted} text-right`}>{percent.toFixed(0)}%</span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Gender & Family Stats */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4`}>Demographics</h3>
          
          {/* Gender Pills */}
          <div className="flex gap-3 mb-6">
            {Object.entries(genderDistribution).map(([gender, count]) => {
              const percent = (count / totalRegistrations * 100).toFixed(0)
              const icon = gender.toLowerCase() === 'male' ? 'M' : gender.toLowerCase() === 'female' ? 'F' : 'O'
              const color = gender.toLowerCase() === 'male' ? 'bg-blue-500/20 text-blue-400' : gender.toLowerCase() === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-500/20 text-gray-400'
              return (
                <div key={gender} className={`flex-1 ${color} rounded-xl p-4 text-center`}>
                  <span className="text-2xl">{icon}</span>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                  <p className="text-xs opacity-75">{gender} ({percent}%)</p>
                </div>
              )
            })}
          </div>

          {/* Family Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${tc.text}`}>{familyCount}</p>
              <p className={`text-xs ${tc.textMuted}`}>Unique Families</p>
            </div>
            <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${tc.text}`}>{avgPlayersPerFamily}</p>
              <p className={`text-xs ${tc.textMuted}`}>Avg Players/Family</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
        <h3 className={`font-semibold ${tc.text} mb-4`}>💵 Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-sm ${tc.textMuted}`}>Total Expected</p>
            <p className={`text-2xl font-bold ${tc.text}`}>${totalRevenue.toFixed(2)}</p>
          </div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-sm ${tc.textMuted}`}>Collected</p>
            <p className={`text-2xl font-bold text-emerald-400`}>${collectedRevenue.toFixed(2)}</p>
          </div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-sm ${tc.textMuted}`}>Outstanding</p>
            <p className={`text-2xl font-bold text-amber-400`}>${outstandingRevenue.toFixed(2)}</p>
          </div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-sm ${tc.textMuted}`}>Avg per Player</p>
            <p className={`text-2xl font-bold ${tc.text}`}>${totalRegistrations > 0 ? (totalRevenue / totalRegistrations).toFixed(2) : '0.00'}</p>
          </div>
        </div>
        
        {/* Fee Type Breakdown */}
        {payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className={`text-sm ${tc.textMuted} mb-3`}>By Fee Type</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(
                payments.reduce((acc, p) => {
                  const type = p.fee_type || 'other'
                  if (!acc[type]) acc[type] = { total: 0, paid: 0 }
                  acc[type].total += parseFloat(p.amount) || 0
                  if (p.paid) acc[type].paid += parseFloat(p.amount) || 0
                  return acc
                }, {})
              ).map(([type, data]) => (
                <div key={type} className={`${tc.cardBg} border ${tc.border} rounded-lg px-4 py-2`}>
                  <p className={`text-xs ${tc.textMuted} capitalize`}>{type}</p>
                  <p className={`font-medium ${tc.text}`}>${data.total.toFixed(0)}</p>
                  <p className="text-xs text-emerald-400">${data.paid.toFixed(0)} paid</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MAIN REGISTRATIONS PAGE
// ============================================
export function RegistrationsPage({ showToast }) {
  const journey = useJourney()
  const { selectedSeason } = useSeason()
  const { organization } = useAuth()
  const tc = useThemeClasses()
  const [registrations, setRegistrations] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [showDenyModal, setShowDenyModal] = useState(null)
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [showBulkDenyModal, setShowBulkDenyModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(null) // Player object to delete
  const [deleteProcessing, setDeleteProcessing] = useState(false)
  
  // View mode: 'table' or 'analytics'
  const [viewMode, setViewMode] = useState('table')

  useEffect(() => {
    if (selectedSeason?.id) loadRegistrations()
  }, [selectedSeason?.id, statusFilter])

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [statusFilter])

  async function loadRegistrations() {
    if (!selectedSeason?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('players')
      .select('*, registrations(*)')
      .eq('season_id', selectedSeason.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading registrations:', error)
    } else {
      let filtered = data || []
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          filtered = filtered.filter(p => ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status))
        } else if (statusFilter === 'denied') {
          filtered = filtered.filter(p => p.registrations?.[0]?.status === 'withdrawn')
        } else {
          filtered = filtered.filter(p => p.registrations?.[0]?.status === statusFilter)
        }
      }
      setRegistrations(filtered)
    }
    setLoading(false)
  }

  async function updateStatus(playerId, regId, newStatus) {
    try {
      await supabase.from('registrations').update({ 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        ...(newStatus === 'approved' ? { approved_at: new Date().toISOString() } : {})
      }).eq('id', regId)
      
      // Generate fees automatically when approving
      if (newStatus === 'approved' && selectedSeason) {
        const { data: playerData } = await supabase
          .from('players')
          .select('*, registrations(*)')
          .eq('id', playerId)
          .single()
        
        if (playerData) {
          const result = await generateFeesForPlayer(supabase, playerData, selectedSeason, null)
          if (result.success && !result.skipped) {
            showToast(`Approved! Generated ${result.feesCreated} fees ($${result.totalAmount.toFixed(2)})`, 'success')
            
            // Send approval email notification
            if (isEmailEnabled(organization, 'registration_approved') && playerData.parent_email) {
              const fees = result.fees || []
              EmailService.sendApprovalNotification(playerData, selectedSeason, organization, fees)
                .then(r => r.success && console.log('Approval email queued'))
                .catch(e => console.error('Email queue error:', e))
            }
          } else if (result.skipped) {
            showToast('Registration approved!', 'success')
            if (isEmailEnabled(organization, 'registration_approved') && playerData.parent_email) {
              EmailService.sendApprovalNotification(playerData, selectedSeason, organization, [])
                .then(r => r.success && console.log('Approval email queued'))
                .catch(e => console.error('Email queue error:', e))
            }
          } else {
            showToast('Approved (fee generation failed - check manually)', 'warning')
          }
        } else {
          showToast('Registration approved!', 'success')
        }
        journey?.completeStep('register_players')
      } else {
        showToast(`Registration ${newStatus}!`, 'success')
      }
      
      loadRegistrations()
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error')
    }
  }

  async function denyRegistration(regId, reason) {
    try {
      await supabase.from('registrations').update({ 
        status: 'withdrawn', 
        denial_reason: reason,
        updated_at: new Date().toISOString()
      }).eq('id', regId)
      showToast('Registration denied', 'success')
      setShowDenyModal(null)
      loadRegistrations()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function deleteRegistration(player) {
    setDeleteProcessing(true)
    try {
      const reg = player.registrations?.[0]
      
      // Delete associated payments first (foreign key constraint)
      if (reg?.id) {
        const { error: paymentError } = await supabase
          .from('payments')
          .delete()
          .eq('registration_id', reg.id)
        
        if (paymentError) {
          console.warn('Error deleting payments:', paymentError)
          // Continue anyway - payments might not exist
        }
      }

      // Delete the registration record
      if (reg?.id) {
        const { error: regError } = await supabase
          .from('registrations')
          .delete()
          .eq('id', reg.id)
        
        if (regError) throw regError
      }

      // Delete the player record
      const { error: playerError } = await supabase
        .from('players')
        .delete()
        .eq('id', player.id)
      
      if (playerError) throw playerError

      showToast(`Deleted ${player.first_name} ${player.last_name}`, 'success')
      setShowDeleteModal(null)
      loadRegistrations()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Error deleting: ' + err.message, 'error')
    }
    setDeleteProcessing(false)
  }

  // ========== BULK ACTIONS ==========
  
  function toggleSelectAll() {
    if (selectedIds.size === filteredRegs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRegs.map(p => p.id)))
    }
  }

  function toggleSelect(playerId) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
    } else {
      newSelected.add(playerId)
    }
    setSelectedIds(newSelected)
  }

  async function bulkApprove() {
    setBulkProcessing(true)
    const selectedPlayers = filteredRegs.filter(p => selectedIds.has(p.id))
    const pendingPlayers = selectedPlayers.filter(p => 
      ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status)
    )
    
    if (pendingPlayers.length === 0) {
      showToast('No pending registrations selected', 'warning')
      setBulkProcessing(false)
      return
    }

    let approved = 0
    let feesGenerated = 0
    let totalFeeAmount = 0
    let emailsQueued = 0

    for (const player of pendingPlayers) {
      const reg = player.registrations?.[0]
      if (!reg) continue

      try {
        await supabase.from('registrations').update({ 
          status: 'approved', 
          updated_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        }).eq('id', reg.id)
        
        approved++

        let fees = []
        if (selectedSeason) {
          const result = await generateFeesForPlayer(supabase, player, selectedSeason, null)
          if (result.success && !result.skipped) {
            feesGenerated += result.feesCreated
            totalFeeAmount += result.totalAmount
            fees = result.fees || []
          }
        }
        
        if (isEmailEnabled(organization, 'registration_approved') && player.parent_email) {
          const emailResult = await EmailService.sendApprovalNotification(player, selectedSeason, organization, fees)
          if (emailResult.success) emailsQueued++
        }
      } catch (err) {
        console.error('Error approving player:', player.id, err)
      }
    }

    showToast(
      `Approved ${approved} registrations! Generated ${feesGenerated} fees ($${totalFeeAmount.toFixed(2)})${emailsQueued > 0 ? ` • ${emailsQueued} emails queued` : ''}`,
      'success'
    )
    
    journey?.completeStep('register_players')
    setSelectedIds(new Set())
    setBulkProcessing(false)
    loadRegistrations()
  }

  async function bulkApproveAllPending() {
    setBulkProcessing(true)
    const pendingPlayers = registrations.filter(p => 
      ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status)
    )
    
    if (pendingPlayers.length === 0) {
      showToast('No pending registrations to approve', 'warning')
      setBulkProcessing(false)
      return
    }

    let approved = 0
    let feesGenerated = 0
    let totalFeeAmount = 0
    let emailsQueued = 0

    for (const player of pendingPlayers) {
      const reg = player.registrations?.[0]
      if (!reg) continue

      try {
        await supabase.from('registrations').update({ 
          status: 'approved', 
          updated_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        }).eq('id', reg.id)
        
        approved++

        let fees = []
        if (selectedSeason) {
          const result = await generateFeesForPlayer(supabase, player, selectedSeason, null)
          if (result.success && !result.skipped) {
            feesGenerated += result.feesCreated
            totalFeeAmount += result.totalAmount
            fees = result.fees || []
          }
        }
        
        if (isEmailEnabled(organization, 'registration_approved') && player.parent_email) {
          const emailResult = await EmailService.sendApprovalNotification(player, selectedSeason, organization, fees)
          if (emailResult.success) emailsQueued++
        }
      } catch (err) {
        console.error('Error approving player:', player.id, err)
      }
    }

    showToast(
      `Approved all ${approved} pending registrations! Generated ${feesGenerated} fees ($${totalFeeAmount.toFixed(2)})${emailsQueued > 0 ? ` • ${emailsQueued} emails queued` : ''}`,
      'success'
    )
    
    journey?.completeStep('register_players')
    setBulkProcessing(false)
    loadRegistrations()
  }

  async function bulkDeny(reason) {
    setBulkProcessing(true)
    const selectedPlayers = filteredRegs.filter(p => selectedIds.has(p.id))
    const pendingPlayers = selectedPlayers.filter(p => 
      ['submitted', 'pending', 'new', 'waitlist'].includes(p.registrations?.[0]?.status)
    )
    
    let denied = 0

    for (const player of pendingPlayers) {
      const reg = player.registrations?.[0]
      if (!reg) continue

      try {
        await supabase.from('registrations').update({ 
          status: 'withdrawn', 
          denial_reason: reason,
          updated_at: new Date().toISOString()
        }).eq('id', reg.id)
        denied++
      } catch (err) {
        console.error('Error denying player:', player.id, err)
      }
    }

    showToast(`Denied ${denied} registrations`, 'success')
    setSelectedIds(new Set())
    setShowBulkDenyModal(false)
    setBulkProcessing(false)
    loadRegistrations()
  }

  async function bulkMoveToWaitlist() {
    setBulkProcessing(true)
    const selectedPlayers = filteredRegs.filter(p => selectedIds.has(p.id))
    const eligiblePlayers = selectedPlayers.filter(p => 
      ['submitted', 'pending', 'new', 'approved'].includes(p.registrations?.[0]?.status)
    )
    
    let moved = 0

    for (const player of eligiblePlayers) {
      const reg = player.registrations?.[0]
      if (!reg) continue

      try {
        await supabase.from('registrations').update({ 
          status: 'waitlist', 
          updated_at: new Date().toISOString()
        }).eq('id', reg.id)
        moved++
      } catch (err) {
        console.error('Error moving player to waitlist:', player.id, err)
      }
    }

    showToast(`Moved ${moved} registrations to waitlist`, 'success')
    setSelectedIds(new Set())
    setBulkProcessing(false)
    loadRegistrations()
  }

  async function bulkDelete() {
    setBulkProcessing(true)
    const selectedPlayers = filteredRegs.filter(p => selectedIds.has(p.id))
    const deletablePlayers = selectedPlayers.filter(p => 
      ['withdrawn', 'denied'].includes(p.registrations?.[0]?.status)
    )
    
    if (deletablePlayers.length === 0) {
      showToast('No withdrawn/denied registrations selected', 'warning')
      setBulkProcessing(false)
      return
    }

    let deleted = 0

    for (const player of deletablePlayers) {
      const reg = player.registrations?.[0]

      try {
        // Delete payments first
        if (reg?.id) {
          await supabase.from('payments').delete().eq('registration_id', reg.id)
        }
        
        // Delete registration
        if (reg?.id) {
          await supabase.from('registrations').delete().eq('id', reg.id)
        }
        
        // Delete player
        await supabase.from('players').delete().eq('id', player.id)
        deleted++
      } catch (err) {
        console.error('Error deleting player:', player.id, err)
      }
    }

    showToast(`Permanently deleted ${deleted} registrations`, 'success')
    setSelectedIds(new Set())
    setBulkProcessing(false)
    loadRegistrations()
  }

  function bulkExport() {
    const selectedPlayers = filteredRegs.filter(p => selectedIds.has(p.id))
    if (selectedPlayers.length === 0) {
      showToast('No registrations selected', 'warning')
      return
    }
    exportToCSV(selectedPlayers, 'selected_registrations', csvColumns)
    showToast(`Exported ${selectedPlayers.length} registrations`, 'success')
  }

  const filteredRegs = registrations.filter(p => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      p.first_name?.toLowerCase().includes(search) ||
      p.last_name?.toLowerCase().includes(search) ||
      p.parent_name?.toLowerCase().includes(search) ||
      p.parent_email?.toLowerCase().includes(search)
    )
  })

  const statusCounts = {
    all: registrations.length,
    pending: registrations.filter(p => ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status)).length,
    approved: registrations.filter(p => p.registrations?.[0]?.status === 'approved').length,
    rostered: registrations.filter(p => p.registrations?.[0]?.status === 'rostered').length,
    waitlist: registrations.filter(p => p.registrations?.[0]?.status === 'waitlist').length,
    denied: registrations.filter(p => p.registrations?.[0]?.status === 'withdrawn').length,
  }

  const selectedPendingCount = filteredRegs.filter(p => 
    selectedIds.has(p.id) && ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status)
  ).length

  const selectedDeniedCount = filteredRegs.filter(p => 
    selectedIds.has(p.id) && ['withdrawn', 'denied'].includes(p.registrations?.[0]?.status)
  ).length

  const csvColumns = [
    { label: 'First Name', accessor: r => r.first_name },
    { label: 'Last Name', accessor: r => r.last_name },
    { label: 'DOB', accessor: r => r.birth_date || r.dob },
    { label: 'Grade', accessor: r => r.grade },
    { label: 'Gender', accessor: r => r.gender },
    { label: 'Parent Name', accessor: r => r.parent_name },
    { label: 'Parent Email', accessor: r => r.parent_email },
    { label: 'Parent Phone', accessor: r => r.parent_phone },
    { label: 'Status', accessor: r => r.registrations?.[0]?.status },
    { label: 'Liability Waiver', accessor: r => r.waiver_liability ? 'Yes' : 'No' },
    { label: 'Photo Waiver', accessor: r => r.waiver_photo ? 'Yes' : 'No' },
    { label: 'Conduct Waiver', accessor: r => r.waiver_conduct ? 'Yes' : 'No' },
  ]

  if (!selectedSeason) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={tc.textSecondary}>Please select a season from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>Registrations</h1>
          <p className={`${tc.textSecondary} mt-1`}>View and manage player registrations • {selectedSeason.name}</p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className={`flex ${tc.cardBg} rounded-xl p-1 border ${tc.border}`}>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${viewMode === 'table' ? 'bg-[var(--accent-primary)] text-white' : `${tc.textSecondary} ${tc.hoverBg}`}`}
            >
              <Table className="w-4 h-4" /> Table
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${viewMode === 'analytics' ? 'bg-[var(--accent-primary)] text-white' : `${tc.textSecondary} ${tc.hoverBg}`}`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
          </div>
          {viewMode === 'table' && statusCounts.pending > 0 && (
            <button 
              onClick={bulkApproveAllPending}
              disabled={bulkProcessing}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-medium disabled:opacity-50"
            >
              {bulkProcessing ? '⏳' : '✓'} Approve All Pending ({statusCounts.pending})
            </button>
          )}
          <button 
            onClick={() => exportToCSV(filteredRegs, 'registrations', csvColumns)}
            className={`${tc.cardBg} ${tc.text} px-4 py-2 rounded-xl ${tc.hoverBgAlt} flex items-center gap-2 border ${tc.border}`}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <RegistrationAnalytics 
          registrations={registrations} 
          season={selectedSeason}
          statusCounts={statusCounts}
          showToast={showToast}
        />
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          {/* Bulk Action Bar - appears when items selected */}
          {selectedIds.size > 0 && (
            <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <span className={`${tc.text} font-medium`}>
                  {selectedIds.size} selected
                </span>
                <button onClick={() => setSelectedIds(new Set())} className={`text-sm ${tc.textMuted} hover:underline`}>
                  Clear selection
                </button>
              </div>
              <div className="flex gap-2">
                {selectedPendingCount > 0 && (
                  <button 
                    onClick={bulkApprove}
                    disabled={bulkProcessing}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {bulkProcessing ? '⏳' : '✓'} Approve ({selectedPendingCount})
                  </button>
                )}
                <button 
                  onClick={bulkMoveToWaitlist}
                  disabled={bulkProcessing}
                  className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <List className="w-4 h-4" /> Waitlist
                </button>
                <button 
                  onClick={() => setShowBulkDenyModal(true)}
                  disabled={bulkProcessing}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  ✗ Deny
                </button>
                {selectedDeniedCount > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm(`Permanently delete ${selectedDeniedCount} registration(s)? This cannot be undone.`)) {
                        bulkDelete()
                      }
                    }}
                    disabled={bulkProcessing}
                    className="bg-red-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-900 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete ({selectedDeniedCount})
                  </button>
                )}
                <button 
                  onClick={bulkExport}
                  className={`${tc.cardBgAlt} ${tc.text} px-4 py-2 rounded-xl text-sm font-medium ${tc.hoverBgAlt}`}
                >
                  📥 Export Selected
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className={`flex ${tc.cardBg} rounded-xl p-1 border ${tc.border} flex-wrap`}>
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'rostered', label: 'Rostered' },
                { key: 'waitlist', label: 'Waitlist', color: 'text-amber-400' },
                { key: 'denied', label: 'Denied' },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === f.key ? 'bg-[var(--accent-primary)] text-white' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  {f.label} ({statusCounts[f.key] || 0})
                </button>
              ))}
            </div>
            <input type="text" placeholder="Search players or parents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`flex-1 min-w-[200px] ${tc.cardBg} border ${tc.border} rounded-xl px-4 py-2 ${tc.text} placeholder-gray-500`} />
          </div>

          {/* Table */}
          {loading ? (
            <div className={`text-center py-12 ${tc.textSecondary}`}>Loading registrations...</div>
          ) : filteredRegs.length === 0 ? (
            <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-12 text-center`}>
              <ClipboardList className="w-16 h-16" />
              <h3 className={`text-lg font-medium ${tc.text} mt-4`}>No registrations found</h3>
              <p className={`${tc.textSecondary} mt-2`}>
                {statusFilter !== 'all' ? 'Try changing the filter' : 'Registrations will appear here'}
              </p>
            </div>
          ) : (
            <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${tc.border}`}>
                    <th className="w-12 px-4 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === filteredRegs.length && filteredRegs.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </th>
                    <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textSecondary}`}>Player</th>
                    <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textSecondary}`}>Parent</th>
                    <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textSecondary}`}>Contact</th>
                    <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textSecondary}`}>Waivers</th>
                    <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textSecondary}`}>Status</th>
                    <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textSecondary}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map(player => {
                    const reg = player.registrations?.[0]
                    const isSelected = selectedIds.has(player.id)
                    return (
                      <tr key={player.id} className={`border-b ${tc.border} ${tc.hoverBg} ${isSelected ? 'bg-[var(--accent-primary)]/10' : ''}`}>
                        <td className="w-12 px-4 py-4">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelect(player.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <ClickablePlayerName 
                              player={player}
                              onPlayerSelect={(p) => { setSelectedPlayer(p); setEditMode(false) }}
                              className={`font-medium ${tc.text}`}
                            />
                            <p className={`text-xs ${tc.textMuted}`}>
                              {player.birth_date || player.dob ? `Age: ${calculateAge(player.birth_date || player.dob)}` : ''} 
                              {player.grade ? ` • Grade ${player.grade}` : ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className={tc.text}>{player.parent_name || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`text-sm ${tc.textSecondary}`}>{player.parent_email}</p>
                          <p className={`text-xs ${tc.textMuted}`}>{player.parent_phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${player.waiver_liability ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {player.waiver_liability ? '✓' : '✗'}
                            </span>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${player.waiver_photo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-slate-400'}`}>
                              {player.waiver_photo ? '📷' : '–'}
                            </span>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${player.waiver_conduct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {player.waiver_conduct ? '✓' : '✗'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ['submitted', 'pending', 'new'].includes(reg?.status) ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
                            reg?.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                            reg?.status === 'rostered' ? 'bg-emerald-500/20 text-emerald-400' :
                            reg?.status === 'waitlist' ? 'bg-amber-500/20 text-amber-400' :
                            reg?.status === 'withdrawn' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-slate-400'
                          }`}>{reg?.status === 'submitted' || reg?.status === 'new' ? 'pending' : reg?.status || 'unknown'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedPlayer(player); setEditMode(false) }} className={`px-3 py-1 ${tc.cardBgAlt} rounded-lg text-xs ${tc.text} ${tc.hoverBgAlt}`}>
                              View
                            </button>
                            <button onClick={() => { setSelectedPlayer(player); setEditMode(true) }} className="px-3 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-400 hover:bg-blue-500/30">
                              Edit
                            </button>
                            {['submitted', 'pending', 'new'].includes(reg?.status) && (
                              <>
                                <button onClick={() => updateStatus(player.id, reg.id, 'approved')} className="px-3 py-1 bg-emerald-500/20 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/30">
                                  Approve
                                </button>
                                <button onClick={() => setShowDenyModal({ player, reg })} className="px-3 py-1 bg-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/30">
                                  Deny
                                </button>
                              </>
                            )}
                            {reg?.status === 'waitlist' && (
                              <button onClick={() => updateStatus(player.id, reg.id, 'approved')} className="px-3 py-1 bg-amber-500/20 rounded-lg text-xs text-amber-400 hover:bg-amber-500/30" title="Promote from waitlist to approved">
                                ⬆️ Promote
                              </button>
                            )}
                            {['withdrawn', 'denied'].includes(reg?.status) && (
                              <button 
                                onClick={() => setShowDeleteModal(player)} 
                                className="px-3 py-1 bg-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/30 flex items-center gap-1"
                                title="Permanently delete this registration"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Player Detail/Edit Modal */}
      {selectedPlayer && (
        <PlayerDetailModal 
          player={selectedPlayer} 
          editMode={editMode}
          onClose={() => { setSelectedPlayer(null); setEditMode(false) }} 
          onUpdate={() => { loadRegistrations(); setSelectedPlayer(null); setEditMode(false) }}
          showToast={showToast}
        />
      )}

      {/* Deny Modal (single) */}
      {showDenyModal && (
        <DenyRegistrationModal
          player={showDenyModal.player}
          onClose={() => setShowDenyModal(null)}
          onDeny={(reason) => denyRegistration(showDenyModal.reg.id, reason)}
        />
      )}

      {/* Bulk Deny Modal */}
      {showBulkDenyModal && (
        <BulkDenyModal
          count={selectedIds.size}
          onClose={() => setShowBulkDenyModal(false)}
          onDeny={bulkDeny}
          processing={bulkProcessing}
        />
      )}

      {/* Delete Registration Modal */}
      {showDeleteModal && (
        <DeleteRegistrationModal
          player={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onDelete={() => deleteRegistration(showDeleteModal)}
          processing={deleteProcessing}
        />
      )}
    </div>
  )
}
