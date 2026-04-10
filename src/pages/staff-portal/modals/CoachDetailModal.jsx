import { useState } from 'react'
import { useThemeClasses } from '../../../contexts/ThemeContext'
import { X, Star, Copy, Share2, RefreshCw } from '../../../constants/icons'
import { supabase } from '../../../lib/supabase'
import { generateInviteCode } from '../../../lib/invite-utils'

const roleLabels = { head: 'Head Coach', assistant: 'Assistant', manager: 'Manager', volunteer: 'Volunteer' }
const bgCheckLabels = {
  not_started: { label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: '⏳' },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '🔄' },
  cleared: { label: 'Cleared', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '✅' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20', icon: '❌' },
  expired: { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '⚠️' }
}

export default function CoachDetailModal({ coach, onClose, onEdit, showToast, orgName, onRefresh }) {
  const tc = useThemeClasses()
  const [inviteCode, setInviteCode] = useState(coach?.invite_code || null)
  const [regenerating, setRegenerating] = useState(false)

  if (!coach) return null
  const bgCheck = bgCheckLabels[coach.background_check_status] || bgCheckLabels.not_started
  const certs = Array.isArray(coach.certifications) ? coach.certifications : []

  function handleCopyCode() {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    showToast?.('Invite code copied!', 'success')
  }

  function handleShareCode() {
    if (!inviteCode) return
    const message = `Hey ${coach.first_name}! You've been added to ${orgName || 'our club'} as a coach on Lynx. Download the app and enter this code to join:\n\nInvite Code: ${inviteCode}\n\nDownload Lynx: https://thelynxapp.com`
    if (navigator.share) {
      navigator.share({ title: `Lynx Coach Invite`, text: message })
    } else {
      navigator.clipboard.writeText(message)
      showToast?.('Invite message copied to clipboard!', 'success')
    }
  }

  async function handleRegenerateCode() {
    setRegenerating(true)
    const newCode = generateInviteCode()
    const { error } = await supabase
      .from('coaches')
      .update({ invite_code: newCode })
      .eq('id', coach.id)
    if (error) {
      showToast?.('Error generating new code', 'error')
    } else {
      setInviteCode(newCode)
      showToast?.('New invite code generated!', 'success')
      onRefresh?.()
    }
    setRegenerating(false)
  }

  async function handleGenerateCode() {
    setRegenerating(true)
    const newCode = generateInviteCode()
    const { error } = await supabase
      .from('coaches')
      .update({ invite_code: newCode })
      .eq('id', coach.id)
    if (error) {
      showToast?.('Error generating code', 'error')
    } else {
      setInviteCode(newCode)
      showToast?.('Invite code generated!', 'success')
      onRefresh?.()
    }
    setRegenerating(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="relative h-32 bg-gradient-to-r from-blue-600/30 to-purple-600/30">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/30 text-white hover:bg-black/50"><X className="w-5 h-5" /></button>
          <div className="absolute -bottom-10 left-6">
            {coach.photo_url ? (
              <img src={coach.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white border-4 border-slate-800 shadow-lg">
                {coach.first_name?.[0]}{coach.last_name?.[0]}
              </div>
            )}
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`text-xl font-bold ${tc.text}`}>{coach.first_name} {coach.last_name}</h2>
              {coach.coaching_level && <p className="text-sm text-purple-400">{coach.coaching_level}</p>}
            </div>
            {onEdit && <button onClick={onEdit} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition">Edit</button>}
          </div>

          {coach.bio && <p className={`${tc.textMuted} text-sm mt-3`}>{coach.bio}</p>}

          <div className="mt-4 space-y-2 text-sm">
            {coach.email && <DRow label="Email" value={coach.email} link={`mailto:${coach.email}`} tc={tc} />}
            {coach.phone && <DRow label="Phone" value={coach.phone} link={`tel:${coach.phone}`} tc={tc} />}
            {coach.address && <DRow label="Address" value={coach.address} tc={tc} />}
            {coach.date_of_birth && <DRow label="DOB" value={new Date(coach.date_of_birth + 'T00:00:00').toLocaleDateString()} tc={tc} />}
          </div>

          {/* Invite Code Section */}
          <SHead label="Mobile App Invite Code" tc={tc} />
          <div className={`p-4 rounded-xl border ${tc.border}`}>
            {inviteCode ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    <button onClick={handleCopyCode}
                      className="text-xs px-3 py-1.5 bg-[#10284C] text-white rounded-lg hover:brightness-125 flex items-center gap-1 transition">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button onClick={handleShareCode}
                      className="text-xs px-3 py-1.5 bg-[#4BB9EC] text-white rounded-lg hover:brightness-110 flex items-center gap-1 transition">
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                    <button onClick={handleRegenerateCode} disabled={regenerating}
                      className={`text-xs px-3 py-1.5 border rounded-lg flex items-center gap-1 transition ${tc.border} ${tc.textMuted} hover:bg-white/10 ${regenerating ? 'opacity-50' : ''}`}>
                      <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} /> New Code
                    </button>
                  </div>
                </div>
                <div className={`border-2 border-dashed rounded-xl p-4 text-center ${tc.border}`}>
                  <span className={`text-3xl font-mono font-bold tracking-[0.3em] ${tc.text}`}>
                    {inviteCode}
                  </span>
                </div>
                <p className={`text-xs ${tc.textMuted} mt-2 text-center`}>
                  Share this code with {coach.first_name} to join via the Lynx mobile app
                </p>
              </>
            ) : (
              <div className="text-center py-3">
                <p className={`text-sm ${tc.textMuted} mb-3`}>No invite code generated yet</p>
                <button onClick={handleGenerateCode} disabled={regenerating}
                  className={`px-4 py-2 bg-[#10284C] text-white rounded-lg text-sm font-semibold hover:brightness-125 transition ${regenerating ? 'opacity-50' : ''}`}>
                  {regenerating ? 'Generating...' : 'Generate Invite Code'}
                </button>
              </div>
            )}
          </div>

          <SHead label="Experience & Credentials" tc={tc} />
          <div className="space-y-2 text-sm">
            {coach.experience_years && <DRow label="Years" value={`${coach.experience_years} years`} tc={tc} />}
            {coach.specialties && <DRow label="Specialties" value={coach.specialties} tc={tc} />}
            {coach.coaching_license && <DRow label="License" value={coach.coaching_license} tc={tc} />}
            {coach.experience_details && <p className={`${tc.textMuted} text-xs mt-1`}>{coach.experience_details}</p>}
          </div>

          {certs.length > 0 && (
            <>
              <SHead label="Certifications" tc={tc} />
              <div className="space-y-2">
                {certs.map((cert, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${tc.border}`}>
                    <div>
                      <p className={`text-sm font-medium ${tc.text}`}>{cert.name}</p>
                      {cert.issuer && <p className={`text-xs ${tc.textMuted}`}>{cert.issuer}</p>}
                    </div>
                    <div className="text-right">
                      {cert.expires && <p className={`text-xs ${tc.textMuted}`}>Exp: {cert.expires}</p>}
                      {cert.verified && <span className="text-xs text-emerald-400">✓ Verified</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <SHead label="Compliance" tc={tc} />
          <div className="grid grid-cols-3 gap-2">
            <CBadge label="Background" status={bgCheck.label} icon={bgCheck.icon} color={bgCheck.color} bg={bgCheck.bg} />
            <CBadge label="Waiver" status={coach.waiver_signed ? 'Signed' : 'Not Signed'} icon={coach.waiver_signed ? '✅' : '⏳'} color={coach.waiver_signed ? 'text-emerald-400' : 'text-amber-400'} bg={coach.waiver_signed ? 'bg-emerald-500/20' : 'bg-amber-500/20'} />
            <CBadge label="Conduct" status={coach.code_of_conduct_signed ? 'Signed' : 'Not Signed'} icon={coach.code_of_conduct_signed ? '✅' : '⏳'} color={coach.code_of_conduct_signed ? 'text-emerald-400' : 'text-amber-400'} bg={coach.code_of_conduct_signed ? 'bg-emerald-500/20' : 'bg-amber-500/20'} />
          </div>

          {coach.emergency_contact_name && (
            <>
              <SHead label="Emergency Contact" tc={tc} />
              <div className="text-sm space-y-1">
                <DRow label="Name" value={coach.emergency_contact_name} tc={tc} />
                {coach.emergency_contact_phone && <DRow label="Phone" value={coach.emergency_contact_phone} link={`tel:${coach.emergency_contact_phone}`} tc={tc} />}
                {coach.emergency_contact_relation && <DRow label="Relation" value={coach.emergency_contact_relation} tc={tc} />}
              </div>
            </>
          )}

          {coach.assignments?.length > 0 && (
            <>
              <SHead label="Team Assignments" tc={tc} />
              <div className="flex flex-wrap gap-2">
                {coach.assignments.map(a => (
                  <span key={a.id} className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1" style={{ backgroundColor: `${a.teams?.color}20`, color: a.teams?.color }}>
                    {a.role === 'head' && <Star className="w-3 h-3" />} {a.teams?.name} <span className="opacity-60">({roleLabels[a.role] || a.role})</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DRow({ label, value, link, tc }) {
  return (
    <div className="flex items-center justify-between">
      <span className={tc.textMuted}>{label}</span>
      {link ? <a href={link} className="text-[var(--accent-primary)] hover:underline">{value}</a> : <span className={tc.text}>{value}</span>}
    </div>
  )
}
function SHead({ label, tc }) {
  return <h4 className={`text-xs font-bold ${tc.textMuted} uppercase tracking-wider mt-5 mb-2 border-t ${tc.border} pt-4`}>{label}</h4>
}
function CBadge({ label, status, icon, color, bg }) {
  return (
    <div className={`${bg} rounded-lg p-2 text-center`}>
      <span className="text-lg">{icon}</span>
      <p className={`text-xs font-bold ${color} mt-1`}>{status}</p>
      <p className="text-xs opacity-60">{label}</p>
    </div>
  )
}
