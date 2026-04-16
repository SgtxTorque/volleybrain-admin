import { Check, X, Edit } from 'lucide-react'
import { parseLocalDate } from '../../lib/date-helpers'

function calculateAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = parseLocalDate(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function InfoRow({ label, value, isDark }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{value || '—'}</span>
    </div>
  )
}

function SectionLabel({ children, isDark }) {
  return (
    <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 mt-4 first:mt-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{children}</h4>
  )
}

function WaiverRow({ label, signed, isDark }) {
  return (
    <div className={`flex items-center justify-between py-1.5`}>
      <span className={`text-xs font-semibold ${signed ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
        {label}
      </span>
      <span className={`text-[10px] font-bold uppercase ${signed ? 'text-emerald-500' : 'text-red-500'}`}>
        {signed ? 'Signed' : 'Missing'}
      </span>
    </div>
  )
}

export default function PlayerDossierPanel({ player, registration, payments, onClose, onApprove, onDeny, onEdit, onTransfer, isDark, approvalMode = 'open', paymentStatus }) {
  if (!player) return null

  const reg = registration || player.registrations?.[0]
  const isPending = ['submitted', 'pending', 'new'].includes(reg?.status)
  const age = calculateAge(player.birth_date || player.dob)
  const dob = (player.birth_date || player.dob)
    ? new Date((player.birth_date || player.dob) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const statusDisplay = isPending ? 'Pending' :
    reg?.status === 'approved' ? 'Approved' :
    reg?.status === 'rostered' ? 'Rostered' :
    reg?.status === 'waitlist' ? 'Waitlist' :
    reg?.status === 'withdrawn' ? 'Denied' : reg?.status || 'Unknown'

  const statusColor = isPending ? 'bg-amber-500/12 text-amber-500' :
    reg?.status === 'approved' ? 'bg-emerald-500/12 text-emerald-500' :
    reg?.status === 'rostered' ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' :
    reg?.status === 'waitlist' ? 'bg-amber-500/12 text-amber-500' :
    reg?.status === 'withdrawn' ? 'bg-red-500/12 text-red-500' : 'bg-slate-500/12 text-slate-400'

  const registeredDate = reg?.created_at
    ? new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  // Extract photo from registration_data if not on player record
  const photoUrl = player.photo_url
    || reg?.registration_data?.player?._photoPreview
    || null

  return (
    <div className={`sticky top-4 rounded-2xl border overflow-hidden ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}
      style={{ fontFamily: 'var(--v2-font)' }}>

      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between bg-[#10284C] shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70">Player Profile</span>
        <button onClick={onClose} className="text-white/50 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Player identity */}
      <div className={`px-5 py-4 flex items-center gap-4 border-b shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${isDark ? 'bg-[#4BB9EC]/10 text-[#4BB9EC]' : 'bg-[#4BB9EC]/10 text-[#4BB9EC]'}`}>
            {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {player.first_name} {player.last_name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>{statusDisplay}</span>
            {registeredDate && <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Registered {registeredDate}</span>}
          </div>
        </div>
      </div>

      {/* Content — 2-column layout */}
      <div className="px-5 py-3 space-y-4">

        {/* Row 1: Player Info (left) + Parent/Guardian (right) */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <SectionLabel isDark={isDark}>Player Information</SectionLabel>
            <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              <InfoRow label="Date of Birth" value={dob} isDark={isDark} />
              <InfoRow label="Age" value={age} isDark={isDark} />
              <InfoRow label="Grade" value={player.grade} isDark={isDark} />
              <InfoRow label="Gender" value={player.gender} isDark={isDark} />
              <InfoRow label="School" value={player.school} isDark={isDark} />
              <InfoRow label="Experience" value={player.experience_level} isDark={isDark} />
              <InfoRow label="Jersey #" value={player.jersey_number} isDark={isDark} />
              <InfoRow label="Jersey Pref" value={[player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean).join(', ') || null} isDark={isDark} />
              <InfoRow label="Jersey Size" value={player.uniform_size_jersey} isDark={isDark} />
              <InfoRow label="Shorts Size" value={player.uniform_size_shorts} isDark={isDark} />
              <InfoRow label="Position" value={player.position} isDark={isDark} />
            </div>
          </div>
          <div>
            <SectionLabel isDark={isDark}>Parent / Guardian</SectionLabel>
            <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              <InfoRow label="Name" value={player.parent_name} isDark={isDark} />
              <InfoRow label="Email" value={player.parent_email} isDark={isDark} />
              <InfoRow label="Phone" value={player.parent_phone} isDark={isDark} />
              <InfoRow label="Phone 2" value={player.parent_phone_secondary} isDark={isDark} />
              <InfoRow label="Address" value={[player.address, player.city, player.state, player.zip].filter(Boolean).join(', ') || null} isDark={isDark} />
            </div>
          </div>
        </div>

        {/* Row 2: Medical (left) + Emergency Contact (right) */}
        <div className={`border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <SectionLabel isDark={isDark}>Medical</SectionLabel>
              <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                <InfoRow label="Conditions" value={player.medical_conditions || player.medical_notes || 'None'} isDark={isDark} />
                <InfoRow label="Allergies" value={player.allergies || 'None'} isDark={isDark} />
                <InfoRow label="Medications" value={player.medications || 'None'} isDark={isDark} />
              </div>
            </div>
            <div>
              <SectionLabel isDark={isDark}>Emergency Contact</SectionLabel>
              <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                <InfoRow label="Name" value={player.emergency_contact_name} isDark={isDark} />
                <InfoRow label="Phone" value={player.emergency_contact_phone} isDark={isDark} />
                <InfoRow label="Relation" value={player.emergency_contact_relation} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Waivers + Payment inline */}
        <div className={`border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <SectionLabel isDark={isDark}>Waivers</SectionLabel>
              <WaiverRow label="Liability" signed={player.waiver_liability} isDark={isDark} />
              <WaiverRow label="Photo Release" signed={player.waiver_photo} isDark={isDark} />
              <WaiverRow label="Code of Conduct" signed={player.waiver_conduct} isDark={isDark} />
            </div>
            <div>
              <SectionLabel isDark={isDark}>Payment</SectionLabel>
              <div className={`rounded-lg px-3 py-2 flex justify-between items-center ${isDark ? 'bg-[#10284C]' : 'bg-[#10284C]'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Total</span>
                <span className="text-base font-black text-white">{(() => {
                  const totalFees = (payments || player.payments)?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
                  return totalFees > 0 ? `$${totalFees.toFixed(2)}` : '—'
                })()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`px-5 py-3 border-t shrink-0 space-y-2 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
        {isPending && (() => {
          const isPayFirstBlocked = approvalMode === 'pay_first' && paymentStatus && !paymentStatus.gatingFeesPaid
          return (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => !isPayFirstBlocked && onApprove(false)}
                  disabled={isPayFirstBlocked}
                  title={isPayFirstBlocked ? 'Payment required before approval' : 'Approve'}
                  className={`px-3 py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition ${
                    isPayFirstBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#22C55E] hover:brightness-110'
                  }`}>
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={onDeny}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center gap-1.5 transition">
                  <X className="w-3.5 h-3.5" /> Deny
                </button>
              </div>
              {isPayFirstBlocked && (
                <div className="text-xs text-amber-600 mt-1 text-center">
                  Payment required: ${paymentStatus?.unpaidAmount?.toFixed(2) || '0.00'} outstanding
                  <button
                    type="button"
                    onClick={() => onApprove(true)}
                    className="block mx-auto mt-1 text-[10px] text-slate-400 hover:text-[#4BB9EC] underline"
                  >
                    Force approve (override)
                  </button>
                </div>
              )}
              {approvalMode === 'tryout_first' && (
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  Fees will be generated when the player is rostered on a team.
                </p>
              )}
            </>
          )
        })()}
        <button onClick={onEdit}
          className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-slate-200'
          }`}>
          <Edit className="w-3.5 h-3.5" /> Edit Player
        </button>
        {onTransfer && ['pending', 'submitted', 'new', 'approved'].includes(reg?.status) && (
          <button
            type="button"
            onClick={() => onTransfer(player, reg)}
            className="w-full px-3 py-2 rounded-[14px] text-xs font-bold bg-[#4BB9EC]/10 text-[#4BB9EC] border border-[#4BB9EC]/20 hover:bg-[#4BB9EC]/20 flex items-center justify-center gap-1.5 transition"
          >
            Transfer season
          </button>
        )}
      </div>
    </div>
  )
}
