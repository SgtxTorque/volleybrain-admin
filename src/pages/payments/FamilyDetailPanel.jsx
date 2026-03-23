// =============================================================================
// FamilyDetailPanel — Split Desk right column for family payment details
// Shows account header, pending payments, player breakdown, timeline, activity
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { X, Bell, Plus, Check, Clock, DollarSign, AlertTriangle } from 'lucide-react'

// ---------- Payment timeline dot ----------
function TimelineDot({ status }) {
  if (status === 'paid') return <div className="w-3 h-3 rounded-full bg-[#22C55E] shrink-0" />
  if (status === 'overdue') return <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
  if (status === 'pending') return <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
  return <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
}

export default function FamilyDetailPanel({
  family,
  onClose,
  onMarkPaid,
  onMarkUnpaid,
  onSendReminder,
  onAddFee,
}) {
  const { isDark } = useTheme()
  if (!family) return null

  const totalOwed = family.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = family.payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const total = totalOwed + totalPaid
  const collectionPercent = total > 0 ? Math.round((totalPaid / total) * 100) : 0
  const playerNames = [...family.players]
  const unpaidPayments = family.payments.filter(p => !p.paid)
  const pendingManual = family.payments.filter(p => !p.paid && p.payment_method === 'manual')

  // Group payments by player
  const playerPayments = {}
  family.payments.forEach(p => {
    const name = p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown'
    if (!playerPayments[name]) playerPayments[name] = { player: p.players, payments: [] }
    playerPayments[name].payments.push(p)
  })

  // Build timeline from all payments
  const timeline = [...family.payments]
    .sort((a, b) => {
      const dateA = a.paid_date || a.due_date || a.created_at || ''
      const dateB = b.paid_date || b.due_date || b.created_at || ''
      return new Date(dateB) - new Date(dateA)
    })
    .slice(0, 8)

  const cardBg = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-slate-50 border border-[#E8ECF2]'
  const divider = isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'

  return (
    <div className={`rounded-2xl flex flex-col sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${divider} shrink-0`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            style={{ fontFamily: 'var(--v2-font)' }}>
            Account Detail
          </span>
          <button onClick={onClose}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
              isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Family avatar + name */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black ${
            totalOwed > 0 ? 'bg-red-500/10 text-red-500' : 'bg-[#22C55E]/10 text-[#22C55E]'
          }`}>
            {(family.parentName || '?').charAt(0)}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{family.parentName} Family</h2>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{family.email}</p>
          </div>
        </div>

        {/* Balance overview */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className={`text-lg font-black tabular-nums ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
              ${total.toFixed(0)}
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Billed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black tabular-nums text-[#22C55E]">
              ${totalPaid.toFixed(0)}
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Paid</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-black tabular-nums ${totalOwed > 0 ? 'text-red-500' : 'text-[#22C55E]'}`}>
              ${totalOwed.toFixed(0)}
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Owed</div>
          </div>
        </div>

        {/* Collection progress */}
        <div className="mt-3">
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all ${collectionPercent === 100 ? 'bg-[#22C55E]' : collectionPercent > 50 ? 'bg-[#4BB9EC]' : 'bg-red-500'}`}
              style={{ width: `${collectionPercent}%` }} />
          </div>
          <div className={`text-[10px] font-bold text-right mt-1 tabular-nums ${collectionPercent === 100 ? 'text-[#22C55E]' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {collectionPercent}% collected
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Pending Manual Payment Card */}
        {pendingManual.length > 0 && (
          <div className={`rounded-xl p-4 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-700'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>Pending Approval</span>
            </div>
            {pendingManual.map(p => (
              <div key={p.id} className="flex items-center justify-between mt-2">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.fee_name || p.fee_type}</p>
                  <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    ${parseFloat(p.amount || 0).toFixed(2)} · {p.reference_number || 'No ref'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onMarkPaid(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#22C55E] text-white hover:brightness-110">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player Accounts */}
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            style={{ fontFamily: 'var(--v2-font)' }}>
            Player Accounts ({playerNames.length})
          </h3>
          <div className="space-y-2">
            {Object.entries(playerPayments).map(([name, { player, payments: pPayments }]) => {
              const pOwed = pPayments.filter(p => !p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
              const pTotal = pPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
              return (
                <div key={name} className={`${cardBg} rounded-xl p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    {player?.photo_url ? (
                      <img src={player.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                        {name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <span className={`text-sm font-bold flex-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{name}</span>
                    <span className={`text-xs font-bold tabular-nums ${pOwed > 0 ? 'text-red-500' : 'text-[#22C55E]'}`}>
                      {pOwed > 0 ? `$${pOwed.toFixed(0)} owed` : 'Paid'}
                    </span>
                  </div>
                  {pPayments.map(p => (
                    <div key={p.id} className={`flex items-center justify-between py-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.paid ? 'bg-[#22C55E]' : 'bg-red-500'}`} />
                        <span>{p.fee_name || p.fee_type}</span>
                      </div>
                      <span className="font-bold tabular-nums">${parseFloat(p.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment Timeline */}
        {timeline.length > 0 && (
          <div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Payment Timeline
            </h3>
            <div className={`${cardBg} rounded-xl p-3 space-y-0`}>
              {timeline.map((p, i) => {
                const dateStr = p.paid_date || p.due_date || p.created_at
                const date = dateStr ? new Date(dateStr).toLocaleDateString() : '—'
                const status = p.paid ? 'paid' : (p.due_date && new Date(p.due_date) < new Date() ? 'overdue' : 'pending')
                return (
                  <div key={p.id} className="flex items-start gap-3 py-2">
                    <div className="flex flex-col items-center">
                      <TimelineDot status={status} />
                      {i < timeline.length - 1 && (
                        <div className={`w-px h-full min-h-[16px] ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {p.players?.first_name} — {p.fee_name || p.fee_type}
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {p.paid ? `Paid ${date}` : `Due ${date}`}
                        {p.payment_method && p.paid && ` via ${p.payment_method}`}
                      </p>
                    </div>
                    <span className={`text-xs font-bold tabular-nums shrink-0 ${
                      p.paid ? 'text-[#22C55E]' : 'text-red-500'
                    }`}>
                      ${parseFloat(p.amount || 0).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={`px-5 py-3 border-t ${divider} shrink-0 space-y-2`}>
        <div className="flex gap-2">
          <button onClick={() => onSendReminder(family)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition">
            <Bell className="w-3.5 h-3.5" /> Send Reminder
          </button>
          <button onClick={onAddFee}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            <Plus className="w-3.5 h-3.5" /> Add Fee
          </button>
        </div>
        {unpaidPayments.length > 0 && (
          <button onClick={() => onMarkPaid(unpaidPayments[0])}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#10284C] text-white hover:brightness-110 transition">
            <DollarSign className="w-3.5 h-3.5" /> Mark Next Payment Paid
          </button>
        )}
      </div>
    </div>
  )
}
