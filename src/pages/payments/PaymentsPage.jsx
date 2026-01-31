import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { calculateFeesForPlayer } from '../../lib/fee-calculator'
import { exportToCSV } from '../../lib/csv-export'
import { DollarSign, Copy, Mail } from '../../constants/icons'
import { ClickablePlayerName } from '../registrations/RegistrationsPage'

// ============================================
// GENERATE FEES FOR EXISTING PLAYERS (backfill)
// ============================================
export async function generateFeesForExistingPlayers(supabase, seasonId, showToast) {
  try {
    // Get the season
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single()
    
    if (seasonError || !season) throw new Error('Season not found')
    
    // Get all approved/rostered players for this season who don't have auto-generated fees
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*, registrations(*)')
      .eq('season_id', seasonId)
    
    if (playersError) throw playersError
    
    // Filter to only approved/rostered players
    const approvedPlayers = (players || []).filter(p => 
      ['approved', 'rostered'].includes(p.registrations?.[0]?.status)
    )
    
    if (approvedPlayers.length === 0) {
      return { success: true, message: 'No approved players found' }
    }
    
    // Get existing auto-generated payments
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
    
    // Filter to players without fees
    const playersNeedingFees = approvedPlayers.filter(p => !playersWithFees.has(p.id))
    
    if (playersNeedingFees.length === 0) {
      return { success: true, message: 'All approved players already have fees' }
    }
    
    // Group players by family for sibling discount calculation
    const familyGroups = {}
    for (const player of playersNeedingFees) {
      const familyEmail = player.parent_email?.toLowerCase() || 'unknown'
      if (!familyGroups[familyEmail]) {
        familyGroups[familyEmail] = []
      }
      familyGroups[familyEmail].push(player)
    }
    
    // Count existing siblings with fees per family
    const familySiblingCounts = {}
    for (const payment of (existingPayments || [])) {
      const email = payment.family_email?.toLowerCase()
      if (email) {
        familySiblingCounts[email] = (familySiblingCounts[email] || 0) + 1
      }
    }
    // Deduplicate - we want unique players, not fee count
    for (const email of Object.keys(familySiblingCounts)) {
      const uniquePlayers = [...new Set((existingPayments || [])
        .filter(p => p.family_email?.toLowerCase() === email)
        .map(p => p.player_id))]
      familySiblingCounts[email] = uniquePlayers.length
    }
    
    // Generate fees for each player with proper sibling indexing
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
        
        // Track this family as having family fee now
        if (familyEmail && fees.some(f => f.fee_category === 'per_family')) {
          familiesWithFamilyFee.add(familyEmail)
        }
        
        allFees.push(...fees)
        totalFeesCreated += fees.length
        totalAmount += fees.reduce((sum, f) => sum + f.amount, 0)
        
        // Increment sibling index for next player in this family
        siblingIndex++
      }
    }
    
    if (allFees.length > 0) {
      // Insert all fees in one batch
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
      // No fees generated - check if season has fees configured
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
// GENERATE EMAIL CONTENT
// ============================================
export function generateEmailContent(type, data) {
  const { player, season, organization, fees, totalDue } = data
  
  switch (type) {
    case 'registration_confirmation':
      return {
        subject: `Registration Confirmed - ${season?.name || 'Season'}`,
        body: `Hi ${player?.parent_name || 'Parent'},

Great news! ${player?.first_name}'s registration for ${organization?.name || 'our organization'} ${season?.name || ''} has been approved!

Player: ${player?.first_name} ${player?.last_name}
Season: ${season?.name}
${season?.start_date ? `Start Date: ${new Date(season.start_date).toLocaleDateString()}` : ''}

${totalDue > 0 ? `
PAYMENT DUE: $${totalDue.toFixed(2)}

Fee Breakdown:
${fees?.map(f => `• ${f.fee_name}: $${f.amount.toFixed(2)}`).join('\n') || 'See admin for details'}

Payment Methods:
${organization?.payment_venmo ? `• Venmo: ${organization.payment_venmo}` : ''}
${organization?.payment_zelle ? `• Zelle: ${organization.payment_zelle}` : ''}
${organization?.payment_cashapp ? `• Cash App: ${organization.payment_cashapp}` : ''}

Please include "${player?.first_name} ${player?.last_name} - ${season?.name}" in your payment note.
` : 'No payment due at this time.'}

Questions? Reply to this email.

See you on the court!
${organization?.name || 'The Team'}`
      }
    
    case 'payment_reminder':
      return {
        subject: `Payment Reminder - ${season?.name || 'Season'} - $${totalDue?.toFixed(2) || '0'} Due`,
        body: `Hi ${player?.parent_name || 'Parent'},

This is a friendly reminder that you have an outstanding balance for ${player?.first_name}'s registration.

AMOUNT DUE: $${totalDue?.toFixed(2) || '0'}

Outstanding Fees:
${fees?.filter(f => !f.paid).map(f => `• ${f.fee_name}: $${f.amount.toFixed(2)}`).join('\n') || 'See admin for details'}

Payment Methods:
${organization?.payment_venmo ? `• Venmo: ${organization.payment_venmo}` : ''}
${organization?.payment_zelle ? `• Zelle: ${organization.payment_zelle}` : ''}
${organization?.payment_cashapp ? `• Cash App: ${organization.payment_cashapp}` : ''}

Please include "${player?.first_name} ${player?.last_name} - ${season?.name}" in your payment note.

Questions? Reply to this email.

Thank you!
${organization?.name || 'The Team'}`
      }
    
    case 'waitlist_notification':
      return {
        subject: `You're on the Waitlist - ${season?.name || 'Season'}`,
        body: `Hi ${player?.parent_name || 'Parent'},

Thank you for registering ${player?.first_name} for ${organization?.name || 'our organization'} ${season?.name || ''}.

You are currently on the waitlist. We'll notify you as soon as a spot becomes available.

Waitlist Position: ${data.waitlistPosition || 'TBD'}

If you have any questions, please reply to this email.

Thank you for your patience!
${organization?.name || 'The Team'}`
      }
    
    default:
      return { subject: '', body: '' }
  }
}

// ============================================
// MARK PAID MODAL
// ============================================
export function MarkPaidModal({ payment, onClose, onConfirm }) {
  const tc = useThemeClasses()
  const [details, setDetails] = useState({
    payment_method: '',
    reference_number: '',
    paid_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Mark Payment as Paid</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>
            {payment.players?.first_name} {payment.players?.last_name} - {payment.fee_name || payment.fee_type} - ${payment.amount}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Payment Method *</label>
            <select 
              value={details.payment_method} 
              onChange={e => setDetails({...details, payment_method: e.target.value})}
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`}
            >
              <option value="">Select method...</option>
              <option value="venmo">Venmo</option>
              <option value="zelle">Zelle</option>
              <option value="cashapp">Cash App</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="stripe">Stripe</option>
              <option value="square">Square</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Reference/Confirmation # (optional)</label>
            <input 
              type="text" 
              value={details.reference_number} 
              onChange={e => setDetails({...details, reference_number: e.target.value})}
              placeholder="e.g., Venmo ID, Check #, etc."
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`}
            />
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Payment Date</label>
            <input 
              type="date" 
              value={details.paid_date} 
              onChange={e => setDetails({...details, paid_date: e.target.value})}
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`}
            />
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Notes (optional)</label>
            <textarea 
              value={details.notes} 
              onChange={e => setDetails({...details, notes: e.target.value})}
              placeholder="Any additional notes..."
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} min-h-[60px]`}
            />
          </div>
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(details)}
            disabled={!details.payment_method}
            className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// EMAIL GENERATOR MODAL
// ============================================
export function EmailGeneratorModal({ family, season, onClose, showToast }) {
  const tc = useThemeClasses()
  const { organization } = useAuth()
  const [emailType, setEmailType] = useState(family.totalDue > 0 ? 'payment_reminder' : 'registration_confirmation')
  
  // Find a player from this family for email generation
  const familyPayment = family.payments[0]
  const player = familyPayment?.players
  const unpaidFees = family.payments.filter(p => !p.paid)
  
  const emailContent = generateEmailContent(emailType, {
    player: { ...player, parent_name: family.parentName },
    season,
    organization,
    fees: emailType === 'payment_reminder' ? unpaidFees : family.payments,
    totalDue: family.totalDue
  })

  function copyToClipboard() {
    const fullEmail = `To: ${family.email}\nSubject: ${emailContent.subject}\n\n${emailContent.body}`
    navigator.clipboard.writeText(fullEmail)
    showToast('Email copied to clipboard!', 'success')
  }

  function openInGmail() {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(family.email)}&su=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`
    window.open(gmailUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Generate Email</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>To: {family.parentName} ({family.email})</p>
        </div>
        
        <div className="p-6 space-y-4 overflow-auto flex-1">
          {/* Email Type Selector */}
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Email Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEmailType('registration_confirmation')}
                className={`px-4 py-2 rounded-xl text-sm ${emailType === 'registration_confirmation' ? 'bg-[var(--accent-primary)] text-white' : `${tc.cardBgAlt} ${tc.text}`}`}
              >
                ✅ Confirmation
              </button>
              <button
                onClick={() => setEmailType('payment_reminder')}
                className={`px-4 py-2 rounded-xl text-sm ${emailType === 'payment_reminder' ? 'bg-[var(--accent-primary)] text-white' : `${tc.cardBgAlt} ${tc.text}`}`}
              >
                💰 Payment Reminder
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Subject</label>
            <div className={`${tc.cardBgAlt} rounded-xl px-4 py-3 ${tc.text}`}>
              {emailContent.subject}
            </div>
          </div>
          
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Body</label>
            <pre className={`${tc.cardBgAlt} rounded-xl px-4 py-3 ${tc.text} text-sm whitespace-pre-wrap font-sans max-h-[300px] overflow-auto`}>
              {emailContent.body}
            </pre>
          </div>
        </div>
        
        <div className={`p-6 border-t ${tc.border} flex justify-between`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Close
          </button>
          <div className="flex gap-3">
            <button 
              onClick={copyToClipboard}
              className={`px-6 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text} flex items-center gap-2`}
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button 
              onClick={openInGmail}
              className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold flex items-center gap-2"
            >
              <Mail className="w-4 h-4" /> Open in Gmail
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD PAYMENT MODAL
// ============================================
export function AddPaymentModal({ players, season, onClose, onAdd }) {
  const tc = useThemeClasses()
  const [form, setForm] = useState({
    player_id: '',
    fee_type: 'registration',
    fee_name: '',
    fee_category: 'per_player',
    amount: '',
    payment_method: '',
    paid: false,
    notes: ''
  })

  const feeTypes = [
    { value: 'registration', label: 'Registration', amount: season.fee_registration || 0, category: 'per_player' },
    { value: 'uniform', label: 'Uniform', amount: season.fee_uniform || 0, category: 'per_player' },
    { value: 'monthly', label: 'Monthly', amount: season.fee_monthly || 0, category: 'per_player' },
    { value: 'family', label: 'Family Fee', amount: season.fee_per_family || 0, category: 'per_family' },
    { value: 'other', label: 'Other', amount: '', category: 'per_player' },
  ]

  useEffect(() => {
    const feeInfo = feeTypes.find(f => f.value === form.fee_type)
    if (feeInfo && form.fee_type !== 'other') {
      setForm(prev => ({ 
        ...prev, 
        fee_name: feeInfo.label,
        fee_category: feeInfo.category,
        amount: feeInfo.amount 
      }))
    }
  }, [form.fee_type])

  function handleSubmit() {
    if (!form.player_id || !form.amount) {
      alert('Please select a player and enter an amount')
      return
    }
    onAdd({
      ...form,
      amount: parseFloat(form.amount),
      paid_date: form.paid ? new Date().toISOString().split('T')[0] : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Add Fee</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Player</label>
            <select value={form.player_id} onChange={e => setForm({...form, player_id: e.target.value})}
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`}>
              <option value="">Select player...</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Fee Type</label>
            <select value={form.fee_type} onChange={e => setForm({...form, fee_type: e.target.value})}
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`}>
              {feeTypes.filter(f => f.amount > 0 || f.value === 'other').map(f => (
                <option key={f.value} value={f.value}>
                  {f.label} {f.amount ? `($${f.amount})` : ''} {f.category === 'per_family' ? '(per family)' : ''}
                </option>
              ))}
            </select>
            {form.fee_type === 'family' && (
              <p className={`text-xs ${tc.textMuted} mt-1`}>Family fees are charged once per family per season</p>
            )}
          </div>
          {form.fee_type === 'other' && (
            <div>
              <label className={`block text-sm ${tc.textMuted} mb-2`}>Fee Name</label>
              <input type="text" value={form.fee_name} onChange={e => setForm({...form, fee_name: e.target.value})}
                placeholder="e.g., Tournament Fee"
                className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`} />
            </div>
          )}
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Amount</label>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`} />
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Payment Method (if paid)</label>
            <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`}>
              <option value="">Select...</option>
              <option value="venmo">Venmo</option>
              <option value="zelle">Zelle</option>
              <option value="cashapp">Cash App</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="stripe">Stripe</option>
              <option value="square">Square</option>
              <option value="other">Other</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.paid} onChange={e => setForm({...form, paid: e.target.checked})}
              className="w-5 h-5 rounded" />
            <span className={tc.text}>Mark as already paid</span>
          </label>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} min-h-[80px]`} />
          </div>
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">
            Add Fee
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PLAYER CARD EXPANDED (simple version for payment context)
// ============================================
function PlayerCardExpanded({ player, visible, onClose, context = 'payment' }) {
  const tc = useThemeClasses()
  
  if (!visible || !player) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>
            {player.first_name} {player.last_name}
          </h2>
          <p className={`text-sm ${tc.textMuted}`}>
            {player.grade ? `Grade ${player.grade}` : ''} 
            {player.jersey_number ? ` • #${player.jersey_number}` : ''}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${tc.textMuted}`}>Parent</p>
              <p className={tc.text}>{player.parent_name || 'N/A'}</p>
            </div>
            <div>
              <p className={`text-xs ${tc.textMuted}`}>Email</p>
              <p className={tc.text}>{player.parent_email || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className={`p-6 border-t ${tc.border}`}>
          <button 
            onClick={onClose}
            className={`w-full py-2 rounded-xl ${tc.cardBgAlt} ${tc.text}`}
          >
            Close
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
  const [viewMode, setViewMode] = useState('individual') // 'individual' or 'family'
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(null)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(null)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadPayments()
      loadPlayers()
    }
  }, [selectedSeason?.id, statusFilter])

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
    let query = supabase
      .from('payments')
      .select('*, players(id, first_name, last_name, parent_name, parent_email, photo_url, position, grade, jersey_number)')
      .eq('season_id', selectedSeason.id)
      .order('created_at', { ascending: false })
    
    if (statusFilter === 'paid') query = query.eq('paid', true)
    else if (statusFilter === 'unpaid') query = query.eq('paid', false)
    
    const { data } = await query
    setPayments(data || [])
    setLoading(false)
  }

  async function markAsPaidWithDetails(paymentId, details) {
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

  async function markAsUnpaid(paymentId) {
    await supabase.from('payments').update({ 
      paid: false, 
      paid_date: null,
      reference_number: null,
      status: 'pending'
    }).eq('id', paymentId)
    showToast('Payment marked as unpaid', 'success')
    loadPayments()
  }

  async function addPayment(paymentData) {
    try {
      const player = players.find(p => p.id === paymentData.player_id)
      await supabase.from('payments').insert({
        ...paymentData,
        season_id: selectedSeason.id,
        family_email: player?.parent_email?.toLowerCase(),
        auto_generated: false,
        created_at: new Date().toISOString()
      })
      showToast('Payment added!', 'success')
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

  // Group payments by family for family view
  const familyGroups = payments.reduce((acc, payment) => {
    const email = payment.family_email || payment.players?.parent_email || 'unknown'
    if (!acc[email]) {
      acc[email] = {
        email,
        parentName: payment.players?.parent_name || 'Unknown',
        payments: [],
        totalDue: 0,
        totalPaid: 0,
        players: new Set()
      }
    }
    acc[email].payments.push(payment)
    if (payment.paid) {
      acc[email].totalPaid += parseFloat(payment.amount) || 0
    } else {
      acc[email].totalDue += parseFloat(payment.amount) || 0
    }
    if (payment.players?.first_name) {
      acc[email].players.add(`${payment.players.first_name} ${payment.players.last_name}`)
    }
    return acc
  }, {})

  const families = Object.values(familyGroups).sort((a, b) => b.totalDue - a.totalDue)

  const totalOwed = payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalCollected = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const uniqueFamilies = new Set(payments.map(p => p.family_email || p.players?.parent_email)).size

  const csvColumns = [
    { label: 'Player First Name', accessor: p => p.players?.first_name },
    { label: 'Player Last Name', accessor: p => p.players?.last_name },
    { label: 'Parent', accessor: p => p.players?.parent_name || p.payer_name },
    { label: 'Parent Email', accessor: p => p.players?.parent_email || p.family_email },
    { label: 'Fee Type', accessor: p => p.fee_name || p.fee_type },
    { label: 'Fee Category', accessor: p => p.fee_category || 'per_player' },
    { label: 'Amount', accessor: p => p.amount },
    { label: 'Paid', accessor: p => p.paid ? 'Yes' : 'No' },
    { label: 'Paid Date', accessor: p => p.paid_date },
    { label: 'Method', accessor: p => p.payment_method },
    { label: 'Reference #', accessor: p => p.reference_number },
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
          <h1 className={`text-3xl font-bold ${tc.text}`}>Payments</h1>
          <p className={`${tc.textSecondary} mt-1`}>Track and manage payment status • {selectedSeason.name}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleBackfillFees}
            disabled={backfillLoading}
            className={`${tc.cardBg} border ${tc.border} ${tc.text} px-4 py-2 rounded-xl hover:brightness-110 flex items-center gap-2 ${backfillLoading ? 'opacity-50' : ''}`}
            title="Generate fees for approved players who don't have fees yet"
          >
            {backfillLoading ? '⏳' : '🔄'} {backfillLoading ? 'Generating...' : 'Backfill Fees'}
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
          <p className="text-3xl font-bold text-[var(--accent-primary)] mt-1">
            {payments.length > 0 ? Math.round((payments.filter(p => p.paid).length / payments.length) * 100) : 0}%
          </p>
        </div>
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
          <p className={tc.textMuted}>Families</p>
          <p className={`text-3xl font-bold ${tc.text} mt-1`}>{uniqueFamilies}</p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className={`flex ${tc.cardBg} rounded-xl p-1 border ${tc.border}`}>
            {['all', 'unpaid', 'paid'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                  statusFilter === f ? 'bg-[var(--accent-primary)] text-white' : `${tc.textMuted} hover:${tc.text}`
                }`}>{f}</button>
            ))}
          </div>
        </div>
        <div className={`flex ${tc.cardBg} rounded-xl p-1 border ${tc.border}`}>
          <button 
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'individual' ? 'bg-[var(--accent-primary)] text-white' : `${tc.textMuted} hover:${tc.text}`
            }`}
          >
            Individual
          </button>
          <button 
            onClick={() => setViewMode('family')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'family' ? 'bg-[var(--accent-primary)] text-white' : `${tc.textMuted} hover:${tc.text}`
            }`}
          >
            Family
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`text-center py-12 ${tc.textSecondary}`}>Loading payments...</div>
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
      ) : viewMode === 'family' ? (
        /* Family View */
        <div className="space-y-4">
          {families.map(family => (
            <div key={family.email} className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${tc.border} flex justify-between items-center`}>
                <div>
                  <p className={`font-semibold ${tc.text}`}>{family.parentName}</p>
                  <p className={`text-sm ${tc.textMuted}`}>{family.email}</p>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>Players: {[...family.players].join(', ')}</p>
                </div>
                <div className="text-right">
                  {family.totalDue > 0 ? (
                    <p className="text-xl font-bold text-red-400">${family.totalDue.toFixed(2)} due</p>
                  ) : (
                    <p className="text-xl font-bold text-emerald-400">Paid in full</p>
                  )}
                  <p className={`text-sm ${tc.textMuted}`}>${family.totalPaid.toFixed(2)} paid</p>
                  <button 
                    onClick={() => setShowEmailModal(family)}
                    className={`mt-2 text-xs px-3 py-1 rounded-lg ${tc.hoverBg} ${tc.textMuted}`}
                  >
                    📧 Generate Email
                  </button>
                </div>
              </div>
              <table className="w-full">
                <tbody>
                  {family.payments.map(payment => (
                    <tr key={payment.id} className={`border-b ${tc.border} last:border-0`}>
                      <td className="px-4 py-3">
                        <p className={tc.text}>{payment.players?.first_name || 'Family'}</p>
                        <p className={`text-xs ${tc.textMuted}`}>{payment.fee_name || payment.fee_type}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className={`font-medium ${tc.text}`}>${parseFloat(payment.amount || 0).toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {payment.paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {payment.paid ? (
                          <button onClick={() => markAsUnpaid(payment.id)} className={`px-3 py-1 rounded-lg text-xs ${tc.textMuted} ${tc.hoverBg}`}>
                            Undo
                          </button>
                        ) : (
                          <button onClick={() => setShowMarkPaidModal(payment)} className="px-3 py-1 bg-emerald-500/20 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/30">
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        /* Individual View (Original Table) */
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${tc.border}`}>
                <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textMuted}`}>Player</th>
                <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textMuted}`}>Parent</th>
                <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textMuted}`}>Fee Type</th>
                <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textMuted}`}>Amount</th>
                <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textMuted}`}>Status</th>
                <th className={`text-left px-6 py-4 text-sm font-medium ${tc.textMuted}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className={`border-b ${tc.border} ${tc.hoverBg}`}>
                  <td className="px-6 py-4">
                    <ClickablePlayerName 
                      player={payment.players}
                      onPlayerSelect={setSelectedPlayer}
                      className={`font-medium ${tc.text}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className={tc.textSecondary}>{payment.players?.parent_name || payment.payer_name || 'N/A'}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{payment.players?.parent_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={tc.text}>{payment.fee_name || payment.fee_type || 'N/A'}</p>
                    {payment.fee_category === 'per_family' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Family</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className={`${tc.text} font-medium`}>${parseFloat(payment.amount || 0).toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {payment.paid ? 'Paid' : 'Unpaid'}
                    </span>
                    {payment.paid_date && (
                      <p className={`text-xs ${tc.textMuted} mt-1`}>{new Date(payment.paid_date).toLocaleDateString()}</p>
                    )}
                    {payment.reference_number && (
                      <p className={`text-xs ${tc.textMuted}`}>Ref: {payment.reference_number}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {payment.paid ? (
                      <button onClick={() => markAsUnpaid(payment.id)} className={`px-3 py-1 rounded-lg text-xs ${tc.textMuted} ${tc.hoverBg}`}>
                        Mark Unpaid
                      </button>
                    ) : (
                      <button onClick={() => setShowMarkPaidModal(payment)} className="px-3 py-1 bg-emerald-500/20 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/30">
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <AddPaymentModal 
          players={players}
          season={selectedSeason}
          onClose={() => setShowAddModal(false)}
          onAdd={addPayment}
        />
      )}

      {/* Mark Paid Modal */}
      {showMarkPaidModal && (
        <MarkPaidModal
          payment={showMarkPaidModal}
          onClose={() => setShowMarkPaidModal(null)}
          onConfirm={(details) => markAsPaidWithDetails(showMarkPaidModal.id, details)}
        />
      )}

      {/* Email Generation Modal */}
      {showEmailModal && (
        <EmailGeneratorModal
          family={showEmailModal}
          season={selectedSeason}
          onClose={() => setShowEmailModal(null)}
          showToast={showToast}
        />
      )}

      {/* Player Card Modal */}
      {selectedPlayer && (
        <PlayerCardExpanded
          player={selectedPlayer}
          visible={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          context="payment"
        />
      )}
    </div>
  )
}
