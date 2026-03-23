// =============================================================================
// PaymentCards — PlayerPaymentCard + FamilyPaymentCard (Split Desk styling)
// Extracted from PaymentsPage.jsx
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronDown, ChevronRight, Check, Clock, Trash2, Bell } from 'lucide-react'

// ============================================
// PLAYER PAYMENT CARD
// ============================================
export function PlayerPaymentCard({
  player,
  payments,
  onMarkPaid,
  onMarkUnpaid,
  onDeletePayment,
  onSendReminder,
  expanded,
  onToggle,
}) {
  const { isDark } = useTheme()
  const totalOwed = payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const total = totalOwed + totalPaid
  const allPaid = totalOwed === 0 && payments.length > 0

  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-[14px] overflow-hidden transition-all`}>
      <div onClick={onToggle} className={`px-5 py-4 cursor-pointer transition flex items-center justify-between ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
        <div className="flex items-center gap-4">
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          {player.photo_url ? (
            <img src={player.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
            </div>
          )}
          <div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{player.first_name} {player.last_name}</p>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{player.parent_name} · {player.parent_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={`text-xl font-bold tabular-nums ${allPaid ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
              ${totalPaid.toFixed(2)} <span className="text-slate-400">/ ${total.toFixed(2)}</span>
            </p>
            <p className={`text-sm ${allPaid ? 'text-emerald-500' : 'text-red-500'}`}>
              {allPaid ? 'Paid in full' : `$${totalOwed.toFixed(2)} outstanding`}
            </p>
          </div>
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => onSendReminder(player)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-slate-100 text-slate-400'} hover:text-lynx-sky`}>
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
            {payments.map(payment => (
              <div key={payment.id} className={`px-5 py-3 flex items-center justify-between ${payment.paid ? (isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50') : ''}`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-2 h-2 rounded-full ${payment.paid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <p className={`font-medium text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment.fee_name || payment.fee_type}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {payment.description || ''}{payment.due_date && ` · Due: ${new Date(payment.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-semibold text-base w-20 text-right tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </p>
                  <div className="w-20">
                    {payment.paid ? (
                      <span className="inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500">
                        <Check className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full bg-red-500/12 text-red-500">
                        <Clock className="w-3 h-3" /> Unpaid
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {payment.paid ? (
                      <button onClick={() => onMarkUnpaid(payment.id)}
                        className={`text-sm px-3 py-1.5 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.08]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Mark Unpaid
                      </button>
                    ) : (
                      <button onClick={() => onMarkPaid(payment)}
                        className="text-sm px-3 py-1.5 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600">
                        Mark Paid
                      </button>
                    )}
                    <button onClick={() => onDeletePayment(payment)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {payments.some(p => p.paid) && (
            <div className={`px-5 py-3 border-t ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
              <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Payment History</p>
              <div className="space-y-1">
                {payments.filter(p => p.paid).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{p.fee_name} - ${parseFloat(p.amount).toFixed(2)}</span>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                      {p.paid_date ? new Date(p.paid_date).toLocaleDateString() : 'N/A'}{p.payment_method && ` via ${p.payment_method}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// FAMILY PAYMENT CARD — Split Desk styling
// ============================================
export function FamilyPaymentCard({
  family,
  onMarkPaid,
  onMarkUnpaid,
  onDeletePayment,
  onSendReminder,
  expanded,
  onToggle,
  isSelected = false,
  onSelect,
  zone,
  onBulkToggle,
  bulkSelected = false,
}) {
  const { isDark } = useTheme()
  const totalOwed = family.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = family.payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const total = totalOwed + totalPaid
  const allPaid = totalOwed === 0 && family.payments.length > 0
  const playerNames = [...family.players].join(', ')
  const playerCount = family.players.size || 0
  const collectionPercent = total > 0 ? Math.round((totalPaid / total) * 100) : 0

  const isOverdue = zone === 'critical' || zone === 'followup'
  const initial = (family.parentName || '?').charAt(0)

  return (
    <div className={`rounded-[14px] overflow-hidden transition-all ${
      isSelected
        ? (isDark ? 'bg-[#4BB9EC]/10 border-2 border-[#10284C]' : 'bg-[#4BB9EC]/[0.06] border-2 border-[#10284C]')
        : (isDark ? 'bg-[#132240] border border-white/[0.06] hover:bg-[#1a2d50]' : 'bg-white border border-[#E8ECF2] hover:shadow-md')
    } ${isOverdue && !isSelected ? (isDark ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-red-500') : ''}`}>
      {/* Header row */}
      <div className={`p-4 flex items-center gap-3 cursor-pointer transition`}
        onClick={() => onSelect?.()}>
        {/* Bulk checkbox */}
        {onBulkToggle && (
          <button
            onClick={e => { e.stopPropagation(); onBulkToggle() }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
              bulkSelected
                ? 'bg-[#10284C] border-[#10284C]'
                : isDark ? 'border-white/20 hover:border-white/40' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {bulkSelected && <Check className="w-3 h-3 text-white" />}
          </button>
        )}

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          isOverdue ? 'bg-red-500/10 text-red-500 ring-2 ring-red-500/20' : 'bg-[#4BB9EC]/10 text-[#4BB9EC]'
        }`}>{initial}</div>

        {/* Name + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{family.parentName} Family</span>
            {zone === 'critical' && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500 text-white">Overdue</span>}
            {zone === 'followup' && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white">Follow Up</span>}
          </div>
          <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {playerCount} player{playerCount !== 1 ? 's' : ''} · {playerNames}
          </div>
        </div>

        {/* Balance */}
        <div className="text-right shrink-0">
          <div className={`font-black text-sm tabular-nums ${allPaid ? 'text-[#22C55E]' : isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {allPaid ? '$0.00' : `$${totalOwed.toFixed(2)}`}
          </div>
          <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {allPaid ? 'Paid' : 'Balance'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-20 shrink-0">
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all ${collectionPercent === 100 ? 'bg-[#22C55E]' : collectionPercent > 50 ? 'bg-[#4BB9EC]' : 'bg-red-500'}`}
              style={{ width: `${collectionPercent}%` }} />
          </div>
          <div className={`text-[10px] font-bold text-right mt-0.5 tabular-nums ${collectionPercent === 100 ? 'text-[#22C55E]' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {collectionPercent}%
          </div>
        </div>

        {/* Expand + actions */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onSendReminder(family)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-slate-100 text-slate-400'} hover:text-lynx-sky`}>
            <Bell className="w-4 h-4" />
          </button>
          <button onClick={onToggle} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded fee line items */}
      {expanded && (
        <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
            {family.payments.map(payment => (
              <div key={payment.id} className={`px-5 py-3 flex items-center justify-between ${payment.paid ? (isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50') : ''}`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-2 h-2 rounded-full ${payment.paid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {payment.players?.first_name} {payment.players?.last_name} — {payment.fee_name || payment.fee_type}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {payment.description || ''}{payment.due_date && ` · Due: ${new Date(payment.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-semibold text-sm w-16 text-right tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </p>
                  <div className="w-16">
                    {payment.paid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500">
                        <Check className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/12 text-red-500">
                        <Clock className="w-3 h-3" /> Due
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {payment.paid ? (
                      <button onClick={() => onMarkUnpaid(payment.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.08]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Mark Unpaid
                      </button>
                    ) : (
                      <button onClick={() => onMarkPaid(payment)}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600">
                        Mark Paid
                      </button>
                    )}
                    <button onClick={() => onDeletePayment(payment)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
