import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { calculateFeesForPlayer } from '../../lib/fee-calculator'
import { exportToCSV } from '../../lib/csv-export'
import {
  DollarSign, ChevronDown, ChevronRight, Search, Trash2, Mail,
  MessageCircle, Bell, X, Check, Clock, AlertCircle, User, Users,
  CheckSquare, Square, Download
} from '../../constants/icons'
import { ClickablePlayerName } from '../registrations/RegistrationsPage'
import { SkeletonPaymentsPage } from '../../components/ui'

// ============================================
// GENERATE FEES FOR EXISTING PLAYERS (backfill)
// ============================================
export async function generateFeesForExistingPlayers(supabase, seasonId, showToast) {
  try {
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single()
    
    if (seasonError || !season) throw new Error('Season not found')
    
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*, registrations(*)')
      .eq('season_id', seasonId)
    
    if (playersError) throw playersError
    
    const approvedPlayers = (players || []).filter(p => 
      ['approved', 'rostered', 'active'].includes(p.registrations?.[0]?.status)
    )
    
    if (approvedPlayers.length === 0) {
      return { success: true, message: 'No approved players found' }
    }
    
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('player_id, family_email, fee_category')
      .eq('season_id', seasonId)
      .eq('auto_generated', true)
    
    const playersWithFees = new Set((existingPayments || []).map(p => p.player_id))
    const familiesWithFamilyFee = new Set(
      (existingPayments || [])
        .filter(p => p.fee_category === 'per_family')
        .map(p => p.family_email?.toLowerCase())
    )
    
    const playersNeedingFees = approvedPlayers.filter(p => !playersWithFees.has(p.id))
    
    if (playersNeedingFees.length === 0) {
      return { success: true, message: 'All approved players already have fees' }
    }
    
    const familyGroups = {}
    for (const player of playersNeedingFees) {
      const familyEmail = player.parent_email?.toLowerCase() || 'unknown'
      if (!familyGroups[familyEmail]) {
        familyGroups[familyEmail] = []
      }
      familyGroups[familyEmail].push(player)
    }
    
    const familySiblingCounts = {}
    for (const payment of (existingPayments || [])) {
      const email = payment.family_email?.toLowerCase()
      if (email) {
        familySiblingCounts[email] = (familySiblingCounts[email] || 0) + 1
      }
    }
    for (const email of Object.keys(familySiblingCounts)) {
      const uniquePlayers = [...new Set((existingPayments || [])
        .filter(p => p.family_email?.toLowerCase() === email)
        .map(p => p.player_id))]
      familySiblingCounts[email] = uniquePlayers.length
    }
    
    let totalFeesCreated = 0
    let totalAmount = 0
    const allFees = []
    
    for (const familyEmail of Object.keys(familyGroups)) {
      const familyPlayers = familyGroups[familyEmail]
      let siblingIndex = familySiblingCounts[familyEmail] || 0
      
      for (const player of familyPlayers) {
        const fees = calculateFeesForPlayer(player, season, {
          checkExistingFamilyFee: true,
          existingFamilyEmails: [...familiesWithFamilyFee],
          siblingIndex
        })
        
        if (familyEmail && fees.some(f => f.fee_category === 'per_family')) {
          familiesWithFamilyFee.add(familyEmail)
        }
        
        allFees.push(...fees)
        totalFeesCreated += fees.length
        totalAmount += fees.reduce((sum, f) => sum + f.amount, 0)
        siblingIndex++
      }
    }
    
    if (allFees.length > 0) {
      const { error: insertError } = await supabase.from('payments').insert(allFees)
      if (insertError) throw insertError
      
      const message = `Generated ${totalFeesCreated} fees for ${playersNeedingFees.length} players totaling $${totalAmount.toFixed(2)}`
      if (showToast) showToast(message, 'success')
      
      return { 
        success: true, 
        playersProcessed: playersNeedingFees.length,
        feesCreated: totalFeesCreated, 
        totalAmount,
        message 
      }
    } else {
      const hasAnyFees = (parseFloat(season.fee_registration) || 0) > 0 ||
                         (parseFloat(season.fee_uniform) || 0) > 0 ||
                         (parseFloat(season.fee_monthly) || 0) > 0 ||
                         (parseFloat(season.fee_per_family) || 0) > 0
      
      if (!hasAnyFees) {
        const message = '⚠️ No fees configured for this season. Go to Setup → Seasons to add fees.'
        if (showToast) showToast(message, 'warning')
        return { success: true, noFeesConfigured: true, message }
      } else {
        const message = `Found ${playersNeedingFees.length} players but no fees to generate`
        if (showToast) showToast(message, 'info')
        return { success: true, playersProcessed: 0, feesCreated: 0, message }
      }
    }
  } catch (err) {
    console.error('Error generating fees for existing players:', err)
    if (showToast) showToast('Error: ' + err.message, 'error')
    return { success: false, error: err.message }
  }
}

// ============================================
// PLAYER PAYMENT CARD (Collapsible)
// ============================================
function PlayerPaymentCard({
  player,
  payments,
  onMarkPaid,
  onMarkUnpaid,
  onDeletePayment,
  onSendReminder,
  expanded,
  onToggle,
  tc,
  selected,
  onSelect,
}) {
  const totalOwed = payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const total = totalOwed + totalPaid
  const allPaid = totalOwed === 0 && payments.length > 0

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl overflow-hidden transition-all`}>
      {/* Collapsed Header - Click anywhere to expand */}
      <div
        onClick={onToggle}
        className={`p-4 cursor-pointer hover:brightness-105 transition flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          {/* Bulk select checkbox */}
          <button onClick={(e) => { e.stopPropagation(); onSelect?.() }} className="transition-colors flex-shrink-0">
            {selected
              ? <CheckSquare className="w-5 h-5 text-[var(--accent-primary)]" />
              : <Square className="w-5 h-5 text-slate-500" />
            }
          </button>

          {expanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}

          {/* Player Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium">
            {player.photo_url ? (
              <img src={player.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              player.first_name?.[0] || '?'
            )}
          </div>
          
          {/* Player Info */}
          <div>
            <p className={`font-semibold ${tc.text}`}>
              {player.first_name} {player.last_name}
            </p>
            <p className={`text-sm ${tc.textMuted}`}>
              {player.parent_name} • {player.parent_email}
            </p>
          </div>
        </div>
        
        {/* Payment Status Summary */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={`text-lg font-bold ${allPaid ? 'text-emerald-400' : 'text-slate-300'}`}>
              ${totalPaid.toFixed(2)} <span className="text-slate-500">/ ${total.toFixed(2)}</span>
            </p>
            <p className={`text-xs ${allPaid ? 'text-emerald-400' : 'text-red-400'}`}>
              {allPaid ? '✓ Paid in full' : `$${totalOwed.toFixed(2)} outstanding`}
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onSendReminder(player)}
              className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} hover:text-[var(--accent-primary)]`}
              title="Send reminder"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className={`border-t ${tc.border}`}>
          {/* Fee List */}
          <div className="divide-y divide-slate-700/50">
            {payments.map(payment => (
              <div 
                key={payment.id} 
                className={`px-4 py-3 flex items-center justify-between ${payment.paid ? 'bg-emerald-500/5' : ''}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-2 h-2 rounded-full ${payment.paid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${tc.text}`}>{payment.fee_name || payment.fee_type}</p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {payment.description || ''}
                      {payment.due_date && ` • Due: ${new Date(payment.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <p className={`font-semibold ${tc.text} w-20 text-right`}>
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </p>
                  
                  {/* Status Badge */}
                  <div className="w-20">
                    {payment.paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        <Check className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        <Clock className="w-3 h-3" /> Unpaid
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {payment.paid ? (
                      <button
                        onClick={() => onMarkUnpaid(payment.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
                      >
                        Mark Unpaid
                      </button>
                    ) : (
                      <button
                        onClick={() => onMarkPaid(payment)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => onDeletePayment(payment)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                      title="Remove fee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Payment History */}
          {payments.some(p => p.paid) && (
            <div className={`p-4 border-t ${tc.border} bg-slate-800/30`}>
              <p className={`text-xs font-semibold ${tc.textMuted} mb-2`}>PAYMENT HISTORY</p>
              <div className="space-y-2">
                {payments.filter(p => p.paid).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className={tc.textMuted}>
                      {p.fee_name} - ${parseFloat(p.amount).toFixed(2)}
                    </span>
                    <span className={tc.textMuted}>
                      {p.paid_date ? new Date(p.paid_date).toLocaleDateString() : 'N/A'} 
                      {p.payment_method && ` via ${p.payment_method}`}
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
// FAMILY PAYMENT CARD (Collapsible)
// ============================================
function FamilyPaymentCard({
  family,
  onMarkPaid,
  onMarkUnpaid,
  onDeletePayment,
  onSendReminder,
  expanded,
  onToggle,
  tc,
  selected,
  onSelect,
}) {
  const totalOwed = family.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = family.payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const total = totalOwed + totalPaid
  const allPaid = totalOwed === 0 && family.payments.length > 0
  
  // Group payments by player
  const playerPayments = family.payments.reduce((acc, p) => {
    const playerId = p.player_id || 'family'
    if (!acc[playerId]) {
      acc[playerId] = {
        player: p.players,
        payments: []
      }
    }
    acc[playerId].payments.push(p)
    return acc
  }, {})

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl overflow-hidden transition-all`}>
      {/* Collapsed Header */}
      <div
        onClick={onToggle}
        className={`p-4 cursor-pointer hover:brightness-105 transition flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          {/* Bulk select checkbox */}
          <button onClick={(e) => { e.stopPropagation(); onSelect?.() }} className="transition-colors flex-shrink-0">
            {selected
              ? <CheckSquare className="w-5 h-5 text-[var(--accent-primary)]" />
              : <Square className="w-5 h-5 text-slate-500" />
            }
          </button>

          {expanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
            <Users className="w-5 h-5" />
          </div>
          
          <div>
            <p className={`font-semibold ${tc.text}`}>{family.parentName}</p>
            <p className={`text-sm ${tc.textMuted}`}>
              {family.email} • {[...family.players].length} player{[...family.players].length !== 1 ? 's' : ''}
            </p>
            <p className={`text-xs ${tc.textMuted}`}>{[...family.players].join(', ')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={`text-lg font-bold ${allPaid ? 'text-emerald-400' : 'text-slate-300'}`}>
              ${totalPaid.toFixed(2)} <span className="text-slate-500">/ ${total.toFixed(2)}</span>
            </p>
            <p className={`text-xs ${allPaid ? 'text-emerald-400' : 'text-red-400'}`}>
              {allPaid ? '✓ Paid in full' : `$${totalOwed.toFixed(2)} outstanding`}
            </p>
          </div>
          
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onSendReminder(family)}
              className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} hover:text-[var(--accent-primary)]`}
              title="Send reminder"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className={`border-t ${tc.border}`}>
          {Object.entries(playerPayments).map(([playerId, { player, payments }]) => (
            <div key={playerId} className={`border-b ${tc.border} last:border-0`}>
              {/* Player Sub-header */}
              <div className={`px-4 py-2 bg-slate-800/30 flex items-center gap-2`}>
                <User className="w-4 h-4 text-slate-400" />
                <span className={`font-medium ${tc.text}`}>
                  {player?.first_name} {player?.last_name || 'Family Fee'}
                </span>
              </div>
              
              {/* Player's Fees */}
              <div className="divide-y divide-slate-700/50">
                {payments.map(payment => (
                  <div 
                    key={payment.id} 
                    className={`px-4 py-3 flex items-center justify-between ${payment.paid ? 'bg-emerald-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-2 rounded-full ${payment.paid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${tc.text}`}>{payment.fee_name || payment.fee_type}</p>
                        <p className={`text-xs ${tc.textMuted}`}>
                          {payment.due_date && `Due: ${new Date(payment.due_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className={`font-semibold ${tc.text} w-20 text-right`}>
                        ${parseFloat(payment.amount || 0).toFixed(2)}
                      </p>
                      
                      <div className="w-20">
                        {payment.paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            <Clock className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {payment.paid ? (
                          <button
                            onClick={() => onMarkUnpaid(payment.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
                          >
                            Mark Unpaid
                          </button>
                        ) : (
                          <button
                            onClick={() => onMarkPaid(payment)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => onDeletePayment(payment)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                          title="Remove fee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// MARK PAID MODAL
// ============================================
function MarkPaidModal({ payment, onConfirm, onClose, tc }) {
  const [details, setDetails] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-md p-6 border ${tc.border}`}>
        <h3 className={`text-lg font-bold ${tc.text} mb-4`}>Mark Payment as Paid</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Fee</label>
            <p className={`${tc.text} font-medium`}>
              {payment.fee_name} - ${parseFloat(payment.amount).toFixed(2)}
            </p>
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Payment Date</label>
            <input
              type="date"
              value={details.paid_date}
              onChange={e => setDetails(d => ({ ...d, paid_date: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Payment Method</label>
            <select
              value={details.payment_method}
              onChange={e => setDetails(d => ({ ...d, payment_method: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            >
              <option value="cash">Cash</option>
              <option value="venmo">Venmo</option>
              <option value="zelle">Zelle</option>
              <option value="cashapp">Cash App</option>
              <option value="check">Check</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Reference # (optional)</label>
            <input
              type="text"
              value={details.reference_number}
              onChange={e => setDetails(d => ({ ...d, reference_number: e.target.value }))}
              placeholder="Transaction ID, check #, etc."
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Notes (optional)</label>
            <textarea
              value={details.notes}
              onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-xl ${tc.hoverBg} ${tc.text}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(payment.id, details)}
            className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DELETE PAYMENT MODAL
// ============================================
function DeletePaymentModal({ payment, onConfirm, onClose, tc }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-md p-6 border ${tc.border}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className={`text-lg font-bold ${tc.text}`}>Remove Fee</h3>
        </div>
        
        <p className={tc.textMuted}>
          Are you sure you want to remove this fee? This action cannot be undone.
        </p>
        
        <div className={`mt-4 p-3 rounded-lg bg-slate-800/50`}>
          <p className={`font-medium ${tc.text}`}>{payment.fee_name || payment.fee_type}</p>
          <p className={`text-sm ${tc.textMuted}`}>${parseFloat(payment.amount).toFixed(2)}</p>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-xl ${tc.hoverBg} ${tc.text}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(payment.id)}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
          >
            Remove Fee
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SEND REMINDER MODAL
// ============================================
function SendReminderModal({ target, onSend, onClose, tc }) {
  const [method, setMethod] = useState('email')
  const [message, setMessage] = useState('')
  
  const isFamily = target?.email !== undefined
  const recipientName = isFamily ? target.parentName : `${target.first_name} ${target.last_name}`
  const recipientEmail = isFamily ? target.email : target.parent_email
  const outstanding = isFamily 
    ? target.payments?.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
    : 0

  const defaultMessage = `Hi ${recipientName.split(' ')[0]},\n\nThis is a friendly reminder about your outstanding balance${outstanding > 0 ? ` of $${outstanding.toFixed(2)}` : ''}. Please let us know if you have any questions.\n\nThank you!`
  
  useEffect(() => {
    setMessage(defaultMessage)
  }, [target])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-lg p-6 border ${tc.border}`}>
        <h3 className={`text-lg font-bold ${tc.text} mb-4`}>Send Payment Reminder</h3>
        
        <div className={`p-3 rounded-lg bg-slate-800/50 mb-4`}>
          <p className={`font-medium ${tc.text}`}>To: {recipientName}</p>
          <p className={`text-sm ${tc.textMuted}`}>{recipientEmail}</p>
        </div>
        
        <div className="mb-4">
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Send via</label>
          <div className="flex gap-2">
            {['email', 'text', 'app'].map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 px-4 py-2 rounded-lg capitalize flex items-center justify-center gap-2 ${
                  method === m 
                    ? 'bg-[var(--accent-primary)] text-white' 
                    : `${tc.cardBg} border ${tc.border} ${tc.textMuted}`
                }`}
              >
                {m === 'email' && <Mail className="w-4 h-4" />}
                {m === 'text' && <MessageCircle className="w-4 h-4" />}
                {m === 'app' && <Bell className="w-4 h-4" />}
                {m}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className={`block text-sm ${tc.textMuted} mb-1`}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-xl ${tc.hoverBg} ${tc.text}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onSend({ target, method, message })}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:brightness-110"
          >
            Send Reminder
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BLAST REMINDER MODAL
// ============================================
function BlastReminderModal({ families, onSend, onClose, tc }) {
  const [method, setMethod] = useState('email')
  const [targetGroup, setTargetGroup] = useState('unpaid')
  const [message, setMessage] = useState('')
  
  const unpaidFamilies = families.filter(f => f.payments.some(p => !p.paid))
  const targetCount = targetGroup === 'unpaid' ? unpaidFamilies.length : families.length

  const defaultMessage = `Hi,\n\nThis is a friendly reminder about outstanding payments for the current season. Please log in to view your balance and make a payment.\n\nThank you for your support!\n\n- Black Hornets Volleyball`
  
  useEffect(() => {
    setMessage(defaultMessage)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-lg p-6 border ${tc.border}`}>
        <h3 className={`text-lg font-bold ${tc.text} mb-4`}>Send Blast Reminder</h3>
        
        <div className="mb-4">
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Send to</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTargetGroup('unpaid')}
              className={`flex-1 px-4 py-2 rounded-lg ${
                targetGroup === 'unpaid' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : `${tc.cardBg} border ${tc.border} ${tc.textMuted}`
              }`}
            >
              Families with balance ({unpaidFamilies.length})
            </button>
            <button
              onClick={() => setTargetGroup('all')}
              className={`flex-1 px-4 py-2 rounded-lg ${
                targetGroup === 'all' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : `${tc.cardBg} border ${tc.border} ${tc.textMuted}`
              }`}
            >
              All families ({families.length})
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Send via</label>
          <div className="flex gap-2">
            {['email', 'text', 'app'].map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 px-4 py-2 rounded-lg capitalize flex items-center justify-center gap-2 ${
                  method === m 
                    ? 'bg-[var(--accent-primary)] text-white' 
                    : `${tc.cardBg} border ${tc.border} ${tc.textMuted}`
                }`}
              >
                {m === 'email' && <Mail className="w-4 h-4" />}
                {m === 'text' && <MessageCircle className="w-4 h-4" />}
                {m === 'app' && <Bell className="w-4 h-4" />}
                {m}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className={`block text-sm ${tc.textMuted} mb-1`}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-xl ${tc.hoverBg} ${tc.text}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onSend({ targetGroup, method, message, count: targetCount })}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:brightness-110"
          >
            Send to {targetCount} {targetCount === 1 ? 'family' : 'families'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD FEE MODAL
// ============================================
function AddFeeModal({ players, onAdd, onClose, tc }) {
  const [formData, setFormData] = useState({
    player_id: '',
    fee_type: 'other',
    fee_name: '',
    amount: '',
    due_date: '',
    description: ''
  })

  const handleSubmit = () => {
    if (!formData.player_id || !formData.fee_name || !formData.amount) {
      return
    }
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount),
      paid: false,
      fee_category: 'per_player'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-md p-6 border ${tc.border}`}>
        <h3 className={`text-lg font-bold ${tc.text} mb-4`}>Add New Fee</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Player</label>
            <select
              value={formData.player_id}
              onChange={e => setFormData(d => ({ ...d, player_id: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            >
              <option value="">Select player...</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Fee Type</label>
            <select
              value={formData.fee_type}
              onChange={e => setFormData(d => ({ ...d, fee_type: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            >
              <option value="registration">Registration</option>
              <option value="uniform">Uniform</option>
              <option value="monthly">Monthly</option>
              <option value="tournament">Tournament</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Fee Name</label>
            <input
              type="text"
              value={formData.fee_name}
              onChange={e => setFormData(d => ({ ...d, fee_name: e.target.value }))}
              placeholder="e.g., Tournament Entry Fee"
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData(d => ({ ...d, amount: e.target.value }))}
              placeholder="0.00"
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-1`}>Due Date (optional)</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={e => setFormData(d => ({ ...d, due_date: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg ${tc.inputBg} border ${tc.border} ${tc.text}`}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-xl ${tc.hoverBg} ${tc.text}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.player_id || !formData.fee_name || !formData.amount}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:brightness-110 disabled:opacity-50"
          >
            Add Fee
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PAYMENTS PAGE
// ============================================
export function PaymentsPage({ showToast }) {
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const [payments, setPayments] = useState([])
  const [players, setPlayers] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('individual')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [backfillLoading, setBackfillLoading] = useState(false)
  
  // Expanded card tracking
  const [expandedCards, setExpandedCards] = useState(new Set())

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [showReminderModal, setShowReminderModal] = useState(null)
  const [showBlastModal, setShowBlastModal] = useState(false)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadPayments()
      loadPlayers()
    }
  }, [selectedSeason?.id])

  async function loadPlayers() {
    const { data } = await supabase
      .from('players')
      .select('id, first_name, last_name, photo_url, position, grade, jersey_number, parent_email, parent_name')
      .eq('season_id', selectedSeason.id)
    setPlayers(data || [])
  }

  async function loadPayments() {
    if (!selectedSeason?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*, players(id, first_name, last_name, parent_name, parent_email, photo_url, position, grade, jersey_number)')
      .eq('season_id', selectedSeason.id)
      .order('created_at', { ascending: false })
    
    setPayments(data || [])
    setLoading(false)
  }

  async function handleMarkPaid(paymentId, details) {
    await supabase.from('payments').update({ 
      paid: true, 
      paid_date: details.paid_date || new Date().toISOString().split('T')[0],
      payment_method: details.payment_method,
      reference_number: details.reference_number,
      status: 'verified',
      verified_at: new Date().toISOString(),
      notes: details.notes || null
    }).eq('id', paymentId)
    showToast('Payment marked as paid', 'success')
    setShowMarkPaidModal(null)
    loadPayments()
  }

  async function handleMarkUnpaid(paymentId) {
    await supabase.from('payments').update({ 
      paid: false, 
      paid_date: null,
      reference_number: null,
      status: 'pending'
    }).eq('id', paymentId)
    showToast('Payment marked as unpaid', 'success')
    loadPayments()
  }

  async function handleDeletePayment(paymentId) {
    await supabase.from('payments').delete().eq('id', paymentId)
    showToast('Fee removed', 'success')
    setShowDeleteModal(null)
    loadPayments()
  }

  async function handleAddPayment(paymentData) {
    try {
      const player = players.find(p => p.id === paymentData.player_id)
      await supabase.from('payments').insert({
        ...paymentData,
        season_id: selectedSeason.id,
        family_email: player?.parent_email?.toLowerCase(),
        auto_generated: false,
        created_at: new Date().toISOString()
      })
      showToast('Fee added!', 'success')
      setShowAddModal(false)
      loadPayments()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function handleBackfillFees() {
    if (!selectedSeason) return
    setBackfillLoading(true)
    const result = await generateFeesForExistingPlayers(supabase, selectedSeason.id, showToast)
    setBackfillLoading(false)
    if (result.success) {
      loadPayments()
    }
  }

  async function handleSendReminder(data) {
    showToast(`Reminder ${data.method === 'email' ? 'email' : data.method === 'text' ? 'text' : 'notification'} queued!`, 'success')
    setShowReminderModal(null)
  }

  async function handleSendBlast(data) {
    showToast(`Blast sent to ${data.count} families via ${data.method}!`, 'success')
    setShowBlastModal(false)
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (viewMode === 'individual') {
      const allIds = playerList.map(p => p.id)
      if (selectedIds.size === allIds.length) setSelectedIds(new Set())
      else setSelectedIds(new Set(allIds))
    } else {
      const allEmails = familyList.map(f => f.email)
      if (selectedIds.size === allEmails.length) setSelectedIds(new Set())
      else setSelectedIds(new Set(allEmails))
    }
  }

  async function bulkMarkPaid() {
    const unpaidPaymentIds = []
    if (viewMode === 'individual') {
      for (const id of selectedIds) {
        const group = playerGroups[id]
        if (group) {
          group.payments.filter(p => !p.paid).forEach(p => unpaidPaymentIds.push(p.id))
        }
      }
    } else {
      for (const email of selectedIds) {
        const family = familyList.find(f => f.email === email)
        if (family) {
          family.payments.filter(p => !p.paid).forEach(p => unpaidPaymentIds.push(p.id))
        }
      }
    }
    if (unpaidPaymentIds.length === 0) {
      showToast('No unpaid fees in selected items', 'info')
      return
    }
    await supabase.from('payments').update({
      paid: true, paid_date: new Date().toISOString().split('T')[0],
      payment_method: 'bulk', status: 'verified', verified_at: new Date().toISOString()
    }).in('id', unpaidPaymentIds)
    showToast(`${unpaidPaymentIds.length} payment${unpaidPaymentIds.length !== 1 ? 's' : ''} marked as paid`, 'success')
    setSelectedIds(new Set())
    loadPayments()
  }

  async function bulkSendReminder() {
    showToast(`Reminders queued for ${selectedIds.size} ${viewMode === 'individual' ? 'player' : 'famil'}${selectedIds.size !== 1 ? (viewMode === 'individual' ? 's' : 'ies') : (viewMode === 'individual' ? '' : 'y')}`, 'success')
    setSelectedIds(new Set())
  }

  function bulkExport() {
    const selectedPayments = viewMode === 'individual'
      ? payments.filter(p => selectedIds.has(p.player_id))
      : payments.filter(p => selectedIds.has(p.family_email || p.players?.parent_email || 'unknown'))
    exportToCSV(selectedPayments, 'payments-selected', csvColumns)
    showToast(`Exported ${selectedPayments.length} payment records`, 'success')
  }

  function toggleCard(id) {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter payments based on status and search
  const filteredPayments = payments.filter(p => {
    if (statusFilter === 'paid' && !p.paid) return false
    if (statusFilter === 'unpaid' && p.paid) return false
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const playerName = `${p.players?.first_name || ''} ${p.players?.last_name || ''}`.toLowerCase()
      const parentName = (p.players?.parent_name || '').toLowerCase()
      const parentEmail = (p.players?.parent_email || '').toLowerCase()
      if (!playerName.includes(q) && !parentName.includes(q) && !parentEmail.includes(q)) {
        return false
      }
    }
    
    return true
  })

  // Group by player for individual view
  const playerGroups = filteredPayments.reduce((acc, payment) => {
    const playerId = payment.player_id
    if (!playerId) return acc
    if (!acc[playerId]) {
      acc[playerId] = {
        player: payment.players || { first_name: 'Unknown', last_name: '' },
        payments: []
      }
    }
    acc[playerId].payments.push(payment)
    return acc
  }, {})

  const playerList = Object.entries(playerGroups)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => {
      const aOwed = a.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const bOwed = b.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      return bOwed - aOwed
    })

  // Group by family
  const familyGroups = filteredPayments.reduce((acc, payment) => {
    const email = payment.family_email || payment.players?.parent_email || 'unknown'
    if (!acc[email]) {
      acc[email] = {
        email,
        parentName: payment.players?.parent_name || 'Unknown',
        payments: [],
        players: new Set()
      }
    }
    acc[email].payments.push(payment)
    if (payment.players?.first_name) {
      acc[email].players.add(`${payment.players.first_name} ${payment.players.last_name}`)
    }
    return acc
  }, {})

  const familyList = Object.values(familyGroups).sort((a, b) => {
    const aOwed = a.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const bOwed = b.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    return bOwed - aOwed
  })

  // Summary stats
  const totalOwed = payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalCollected = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const uniqueFamilies = new Set(payments.map(p => p.family_email || p.players?.parent_email)).size
  const collectionRate = payments.length > 0 
    ? Math.round((payments.filter(p => p.paid).length / payments.length) * 100) 
    : 0

  // CSV export
  const csvColumns = [
    { label: 'Player First Name', accessor: p => p.players?.first_name },
    { label: 'Player Last Name', accessor: p => p.players?.last_name },
    { label: 'Parent', accessor: p => p.players?.parent_name },
    { label: 'Parent Email', accessor: p => p.players?.parent_email || p.family_email },
    { label: 'Fee Type', accessor: p => p.fee_name || p.fee_type },
    { label: 'Amount', accessor: p => p.amount },
    { label: 'Paid', accessor: p => p.paid ? 'Yes' : 'No' },
    { label: 'Paid Date', accessor: p => p.paid_date },
    { label: 'Method', accessor: p => p.payment_method },
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>Payments</h1>
          <p className={`${tc.textSecondary} mt-1`}>Track and manage payment status • {selectedSeason.name}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowBlastModal(true)}
            className={`${tc.cardBg} border ${tc.border} ${tc.text} px-4 py-2 rounded-xl hover:brightness-110 flex items-center gap-2`}
          >
            <Bell className="w-4 h-4" /> Send Reminder
          </button>
          <button 
            onClick={handleBackfillFees}
            disabled={backfillLoading}
            className={`${tc.cardBg} border ${tc.border} ${tc.text} px-4 py-2 rounded-xl hover:brightness-110 flex items-center gap-2 ${backfillLoading ? 'opacity-50' : ''}`}
          >
            {backfillLoading ? '⏳' : '🔄'} Backfill Fees
          </button>
          <button 
            onClick={() => exportToCSV(payments, 'payments', csvColumns)}
            className={`${tc.cardBg} border ${tc.border} ${tc.text} px-4 py-2 rounded-xl hover:brightness-110 flex items-center gap-2`}
          >
            📥 Export CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--accent-primary)] text-white font-semibold px-4 py-2 rounded-xl hover:brightness-110"
          >
            ➕ Add Fee
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
          <p className={tc.textMuted}>Total Collected</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">${totalCollected.toFixed(2)}</p>
        </div>
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
          <p className={tc.textMuted}>Outstanding</p>
          <p className="text-3xl font-bold text-red-400 mt-1">${totalOwed.toFixed(2)}</p>
        </div>
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
          <p className={tc.textMuted}>Collection Rate</p>
          <p className="text-3xl font-bold text-[var(--accent-primary)] mt-1">{collectionRate}%</p>
        </div>
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
          <p className={tc.textMuted}>Families</p>
          <p className={`text-3xl font-bold ${tc.text} mt-1`}>{uniqueFamilies}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by player or parent name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${tc.inputBg} border ${tc.border} ${tc.text} focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-4">
          {/* Status Filter */}
          <div className={`flex ${tc.cardBg} rounded-xl p-1 border ${tc.border}`}>
            {['all', 'unpaid', 'paid'].map(f => (
              <button 
                key={f} 
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                  statusFilter === f ? 'bg-[var(--accent-primary)] text-white' : `${tc.textMuted} hover:${tc.text}`
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className={`flex ${tc.cardBg} rounded-xl p-1 border ${tc.border}`}>
            <button 
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                viewMode === 'individual' ? 'bg-[var(--accent-primary)] text-white' : `${tc.textMuted} hover:${tc.text}`
              }`}
            >
              <User className="w-4 h-4" /> Individual
            </button>
            <button 
              onClick={() => setViewMode('family')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                viewMode === 'family' ? 'bg-[var(--accent-primary)] text-white' : `${tc.textMuted} hover:${tc.text}`
              }`}
            >
              <Users className="w-4 h-4" /> Family
            </button>
          </div>
        </div>
      </div>

      {/* Select All + Count */}
      {!loading && payments.length > 0 && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button onClick={selectAll} className="transition-colors">
              {(viewMode === 'individual' ? selectedIds.size === playerList.length && playerList.length > 0 : selectedIds.size === familyList.length && familyList.length > 0)
                ? <CheckSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                : <Square className={`w-5 h-5 ${tc.textMuted}`} />
              }
            </button>
            <span className={`text-sm font-medium ${tc.textMuted}`}>
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${viewMode === 'individual' ? playerList.length : familyList.length} selected`
                : `Select all (${viewMode === 'individual' ? playerList.length : familyList.length})`
              }
            </span>
          </label>
          {selectedIds.size > 0 && (
            <button onClick={() => setSelectedIds(new Set())}
              className={`text-sm ${tc.textMuted} hover:text-[var(--accent-primary)] transition`}>
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonPaymentsPage />
      ) : payments.length === 0 ? (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-12 text-center`}>
          <DollarSign className="w-16 h-16 mx-auto text-slate-500" />
          <h3 className={`text-lg font-medium ${tc.text} mt-4`}>No payments found</h3>
          <p className={`${tc.textMuted} mt-2`}>Fees are automatically generated when registrations are approved.</p>
          <button 
            onClick={handleBackfillFees}
            className="mt-4 bg-[var(--accent-primary)] text-white px-6 py-2 rounded-xl"
          >
            Generate Fees for Existing Players
          </button>
        </div>
      ) : viewMode === 'individual' ? (
        /* Individual View - Collapsible Player Cards */
        <div className="space-y-3">
          {playerList.length === 0 ? (
            <div className={`text-center py-8 ${tc.textMuted}`}>
              No results found for "{searchQuery}"
            </div>
          ) : (
            playerList.map(({ id, player, payments }) => (
              <PlayerPaymentCard
                key={id}
                player={player}
                payments={payments}
                expanded={expandedCards.has(id)}
                onToggle={() => toggleCard(id)}
                onMarkPaid={(payment) => setShowMarkPaidModal(payment)}
                onMarkUnpaid={handleMarkUnpaid}
                onDeletePayment={(payment) => setShowDeleteModal(payment)}
                onSendReminder={(player) => setShowReminderModal(player)}
                tc={tc}
                selected={selectedIds.has(id)}
                onSelect={() => toggleSelect(id)}
              />
            ))
          )}
        </div>
      ) : (
        /* Family View - Collapsible Family Cards */
        <div className="space-y-3">
          {familyList.length === 0 ? (
            <div className={`text-center py-8 ${tc.textMuted}`}>
              No results found for "{searchQuery}"
            </div>
          ) : (
            familyList.map((family) => (
              <FamilyPaymentCard
                key={family.email}
                family={family}
                expanded={expandedCards.has(family.email)}
                onToggle={() => toggleCard(family.email)}
                onMarkPaid={(payment) => setShowMarkPaidModal(payment)}
                onMarkUnpaid={handleMarkUnpaid}
                onDeletePayment={(payment) => setShowDeleteModal(payment)}
                onSendReminder={(family) => setShowReminderModal(family)}
                tc={tc}
                selected={selectedIds.has(family.email)}
                onSelect={() => toggleSelect(family.email)}
              />
            ))
          )}
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl"
          style={{
            background: 'rgba(15,23,42,.95)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,.1)',
            animation: 'floatUp .25s ease-out',
          }}>
          <style>{`@keyframes floatUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
          <span className="text-sm font-bold text-white mr-2">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-6 bg-slate-600" />
          <button onClick={bulkMarkPaid}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition">
            <Check className="w-4 h-4" /> Mark Paid
          </button>
          <button onClick={bulkSendReminder}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition">
            <Bell className="w-4 h-4" /> Send Reminder
          </button>
          <button onClick={bulkExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showMarkPaidModal && (
        <MarkPaidModal
          payment={showMarkPaidModal}
          onConfirm={handleMarkPaid}
          onClose={() => setShowMarkPaidModal(null)}
          tc={tc}
        />
      )}
      
      {showDeleteModal && (
        <DeletePaymentModal
          payment={showDeleteModal}
          onConfirm={handleDeletePayment}
          onClose={() => setShowDeleteModal(null)}
          tc={tc}
        />
      )}
      
      {showReminderModal && (
        <SendReminderModal
          target={showReminderModal}
          onSend={handleSendReminder}
          onClose={() => setShowReminderModal(null)}
          tc={tc}
        />
      )}
      
      {showBlastModal && (
        <BlastReminderModal
          families={familyList}
          onSend={handleSendBlast}
          onClose={() => setShowBlastModal(false)}
          tc={tc}
        />
      )}
      
      {showAddModal && (
        <AddFeeModal
          players={players}
          onAdd={handleAddPayment}
          onClose={() => setShowAddModal(false)}
          tc={tc}
        />
      )}
    </div>
  )
}
