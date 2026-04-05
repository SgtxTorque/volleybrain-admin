// =============================================================================
// FamilyDetailPanel — Enhanced split desk detail panel with sibling tabs
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { X, Bell, Plus, Check, Clock, DollarSign, AlertTriangle, ChevronDown } from 'lucide-react'
import { parseLocalDate } from '../../lib/date-helpers'

// ---------- Payment timeline dot ----------
function TimelineDot({ status }) {
  if (status === 'paid') return <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shrink-0" />
  if (status === 'overdue') return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
  if (status === 'pending') return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
  return <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
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
  const [activeTab, setActiveTab] = useState('overview')
  if (!family) return null

  const totalOwed = family.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = family.payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const total = totalOwed + totalPaid
  const collectionPercent = total > 0 ? Math.round((totalPaid / total) * 100) : 0
  const unpaidPayments = family.payments.filter(p => !p.paid)
  const pendingManual = family.payments.filter(p => !p.paid && p.payment_method === 'manual')

  // Group payments by player
  const playerPayments = {}
  family.payments.forEach(p => {
    const name = p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown'
    if (!playerPayments[name]) playerPayments[name] = { player: p.players, payments: [] }
    playerPayments[name].payments.push(p)
  })
  const playerNames = Object.keys(playerPayments)
  const hasSiblings = playerNames.length > 1

  // Build timeline from all payments
  const timeline = [...family.payments]
    .sort((a, b) => {
      const dateA = a.paid_date || a.due_date || a.created_at || ''
      const dateB = b.paid_date || b.due_date || b.created_at || ''
      return new Date(dateB) - new Date(dateA)
    })
    .slice(0, 10)

  // Determine tabs: Overview + one per sibling (or just Overview if single child)
  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(hasSiblings ? playerNames.map(name => ({ id: name, label: name.split(' ')[0] })) : []),
  ]

  const divider = isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'
  const cardBg = isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-[#E8ECF2]'

  // Get payments for a specific player tab
  const getTabPayments = (tabId) => {
    if (tabId === 'overview') return family.payments
    return playerPayments[tabId]?.payments || []
  }

  const currentPayments = getTabPayments(activeTab)
  const currentUnpaid = currentPayments.filter(p => !p.paid)
  const currentPaid = currentPayments.filter(p => p.paid)

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
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black ${
            totalOwed > 0 ? 'bg-red-500/10 text-red-500' : 'bg-[#22C55E]/10 text-[#22C55E]'
          }`}>
            {(family.parentName || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{family.parentName} Family</h2>
            <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{family.email} · {playerNames.length} player{playerNames.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Balance overview */}
        <div className="mt-3 flex gap-4">
          <div>
            <div className={`text-lg font-black tabular-nums ${isDark ? 'text-white' : 'text-[#10284C]'}`}>${total.toFixed(0)}</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Billed</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums text-[#22C55E]">${totalPaid.toFixed(0)}</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Paid</div>
          </div>
          <div>
            <div className={`text-lg font-black tabular-nums ${totalOwed > 0 ? 'text-red-500' : 'text-[#22C55E]'}`}>${totalOwed.toFixed(0)}</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Owed</div>
          </div>
          <div className="flex-1">
            <div className={`text-lg font-black tabular-nums ${collectionPercent === 100 ? 'text-[#22C55E]' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{collectionPercent}%</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Collected</div>
          </div>
        </div>

        {/* Collection progress bar */}
        <div className="mt-2">
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all ${collectionPercent === 100 ? 'bg-[#22C55E]' : collectionPercent > 50 ? 'bg-[#4BB9EC]' : 'bg-red-500'}`}
              style={{ width: `${collectionPercent}%` }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <button onClick={() => onSendReminder(family)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition">
            <Bell className="w-3 h-3" /> Reminder
          </button>
          <button onClick={onAddFee}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            <Plus className="w-3 h-3" /> Add Fee
          </button>
          {unpaidPayments.length > 0 && (
            <button onClick={() => onMarkPaid(unpaidPayments[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-lynx-navy-subtle text-white hover:brightness-110 transition">
              <DollarSign className="w-3 h-3" /> Mark Paid
            </button>
          )}
        </div>
      </div>

      {/* Sibling Tabs (only show if multiple players) */}
      {tabs.length > 1 && (
        <div className={`px-5 pt-3 pb-0 border-b ${divider} shrink-0`}>
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? `${isDark ? 'bg-white/[0.06] text-white' : 'bg-white text-[#10284C]'} border-b-2 border-[#4BB9EC]`
                    : `${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`
                }`}
                style={{ fontFamily: 'var(--v2-font)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Pending Manual Approvals (overview tab only) */}
        {activeTab === 'overview' && pendingManual.length > 0 && (
          <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-700'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>Pending Approval</span>
            </div>
            {pendingManual.map(p => (
              <div key={p.id} className="flex items-center justify-between mt-1.5">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.players?.first_name} — {p.fee_name || p.fee_type}</p>
                  <p className={`text-[10px] ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    ${parseFloat(p.amount || 0).toFixed(2)} · {p.reference_number || 'No ref'}
                  </p>
                </div>
                <button onClick={() => onMarkPaid(p)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#22C55E] text-white hover:brightness-110">
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Line Items — shows per-tab */}
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            style={{ fontFamily: 'var(--v2-font)' }}>
            {activeTab === 'overview' ? `All Fees (${currentPayments.length})` : `${activeTab} Fees (${currentPayments.length})`}
          </h3>

          {currentPayments.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} py-4 text-center`}>No fees assigned</p>
          ) : (
            <div className={`rounded-xl overflow-hidden border ${divider}`}>
              <div className={`divide-y ${divider}`}>
                {currentPayments.map(p => {
                  const isOverdue = !p.paid && p.due_date && parseLocalDate(p.due_date) < new Date()
                  return (
                    <div key={p.id} className={`px-3 py-2.5 flex items-center gap-3 ${
                      p.paid ? (isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50') : ''
                    }`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${p.paid ? 'bg-[#22C55E]' : isOverdue ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {activeTab === 'overview' && p.players ? `${p.players.first_name} — ` : ''}{p.fee_name || p.fee_type}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {p.due_date && `Due ${parseLocalDate(p.due_date).toLocaleDateString()}`}
                          {p.paid && p.paid_date && ` · Paid ${parseLocalDate(p.paid_date).toLocaleDateString()}`}
                          {p.paid && p.payment_method && ` via ${p.payment_method}`}
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                        ${parseFloat(p.amount || 0).toFixed(2)}
                      </span>
                      {p.paid ? (
                        <button onClick={() => onMarkUnpaid(p.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                            isDark ? 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}>
                          Undo
                        </button>
                      ) : (
                        <button onClick={() => onMarkPaid(p)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#22C55E] text-white hover:brightness-110 shrink-0 transition">
                          Pay
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Payment Timeline (overview tab only) */}
        {activeTab === 'overview' && timeline.length > 0 && (
          <div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Payment Timeline
            </h3>
            <div className={`${cardBg} rounded-xl p-3`}>
              {timeline.map((p, i) => {
                const dateStr = p.paid_date || p.due_date || p.created_at
                const date = dateStr ? parseLocalDate(dateStr).toLocaleDateString() : '—'
                const status = p.paid ? 'paid' : (p.due_date && parseLocalDate(p.due_date) < new Date() ? 'overdue' : 'pending')
                return (
                  <div key={p.id} className="flex items-start gap-3 py-1.5">
                    <div className="flex flex-col items-center">
                      <TimelineDot status={status} />
                      {i < timeline.length - 1 && (
                        <div className={`w-px h-full min-h-[12px] ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
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
                    <span className={`text-xs font-bold tabular-nums shrink-0 ${p.paid ? 'text-[#22C55E]' : 'text-red-500'}`}>
                      ${parseFloat(p.amount || 0).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
