// =============================================================================
// PlayerDossierPanel — War Room right-column player detail panel
// Receives all data as props — makes NO Supabase queries
// =============================================================================

import { Check, X, Edit, Eye, FileCheck, AlertCircle, XCircle } from 'lucide-react'

function calculateAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function InfoMini({ label, value, isDark }) {
  return (
    <div className={`rounded-lg p-2.5 ${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'}`}>
      <div className={`text-[9px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{value || '—'}</div>
    </div>
  )
}

function WaiverItem({ label, status, isDark }) {
  const colors = status === 'signed'
    ? { bar: 'bg-[#22C55E]', icon: FileCheck, iconColor: 'text-[#22C55E]', text: isDark ? 'text-emerald-300' : 'text-emerald-700' }
    : status === 'pending'
    ? { bar: 'bg-amber-400', icon: AlertCircle, iconColor: 'text-amber-400', text: isDark ? 'text-amber-300' : 'text-amber-700' }
    : { bar: 'bg-red-500', icon: XCircle, iconColor: 'text-red-500', text: isDark ? 'text-red-300' : 'text-red-700' }
  const Icon = colors.icon

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-[#F5F6F8]'}`}>
      <div className={`w-1 h-6 rounded-full ${colors.bar}`} />
      <Icon className={`w-3.5 h-3.5 ${colors.iconColor}`} />
      <span className={`text-xs font-bold ${colors.text}`}>{label}</span>
      <span className={`ml-auto text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {status === 'signed' ? 'Complete' : status === 'pending' ? 'Pending' : 'Missing'}
      </span>
    </div>
  )
}

export default function PlayerDossierPanel({ player, registration, onClose, onApprove, onDeny, onEdit, onViewFull, isDark }) {
  if (!player) return null

  const reg = registration || player.registrations?.[0]
  const isPending = ['submitted', 'pending', 'new'].includes(reg?.status)
  const age = calculateAge(player.birth_date || player.dob)
  const dob = (player.birth_date || player.dob)
    ? new Date((player.birth_date || player.dob) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  // Waiver statuses
  const waiverLiability = player.waiver_liability ? 'signed' : 'missing'
  const waiverPhoto = player.waiver_photo ? 'signed' : 'missing'
  const waiverConduct = player.waiver_conduct ? 'signed' : 'missing'

  // Status display
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

  return (
    <div className={`sticky top-6 rounded-2xl border overflow-hidden ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}
      style={{ fontFamily: 'var(--v2-font)' }}>

      {/* Navy header */}
      <div className="px-4 py-3 flex items-center justify-between bg-[#10284C]">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70">Player Dossier</span>
        <button onClick={onClose} className="text-white/50 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Avatar + Name */}
      <div className={`p-5 text-center border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-black ${isDark ? 'bg-[#4BB9EC]/10 text-[#4BB9EC]' : 'bg-[#4BB9EC]/10 text-[#4BB9EC]'}`}>
          {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
        </div>
        <h3 className={`text-lg font-extrabold mt-3 tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
          {player.first_name} {player.last_name}
        </h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {player.parent_name ? `Family: ${player.parent_name}` : 'No parent info'}
        </p>
        <div className="mt-2">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${statusColor}`}>
            {statusDisplay}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto">
        {/* Info grid */}
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Details</h4>
          <div className="grid grid-cols-2 gap-2">
            <InfoMini label="DOB" value={dob} isDark={isDark} />
            <InfoMini label="Age" value={age} isDark={isDark} />
            <InfoMini label="Jersey #" value={player.jersey_number} isDark={isDark} />
            <InfoMini label="Grade" value={player.grade} isDark={isDark} />
          </div>
        </div>

        {/* Document Checklist */}
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Documents</h4>
          <div className="space-y-1.5">
            <WaiverItem label="Liability Waiver" status={waiverLiability} isDark={isDark} />
            <WaiverItem label="Photo Release" status={waiverPhoto} isDark={isDark} />
            <WaiverItem label="Code of Conduct" status={waiverConduct} isDark={isDark} />
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Payment</h4>
          <div className={`rounded-lg p-3 ${isDark ? 'bg-[#10284C]' : 'bg-[#10284C]'}`}>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Total Commitment</span>
              <span className="text-xl font-black text-white">
                {reg?.registration_fee ? `$${reg.registration_fee}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contact</h4>
          <div className="space-y-1">
            {player.parent_email && (
              <p className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{player.parent_email}</p>
            )}
            {player.parent_phone && (
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{player.parent_phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`p-4 border-t space-y-2 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
        {isPending && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onApprove}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-[#22C55E] text-white hover:brightness-110 flex items-center justify-center gap-1.5 transition">
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button onClick={onDeny}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center gap-1.5 transition">
              <X className="w-3.5 h-3.5" /> Deny
            </button>
          </div>
        )}
        <button onClick={onEdit}
          className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-slate-200'
          }`}>
          <Edit className="w-3.5 h-3.5" /> Edit Player
        </button>
        <button onClick={onViewFull}
          className="w-full px-3 py-2 rounded-lg text-xs font-bold text-[#4BB9EC] hover:bg-[#4BB9EC]/10 flex items-center justify-center gap-1.5 transition">
          <Eye className="w-3.5 h-3.5" /> View Full Profile
        </button>
      </div>
    </div>
  )
}
