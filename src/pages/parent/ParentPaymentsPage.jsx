import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { createCheckoutSession, getCheckoutResult } from '../../lib/stripe-checkout'
import { 
  DollarSign, Check, Clock, AlertTriangle, ChevronRight,
  CreditCard, Loader2, ExternalLink, XCircle, CheckCircle2, X
} from '../../constants/icons'

function ParentPaymentsPage({ roleContext, showToast }) {
  const { user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPayments, setSelectedPayments] = useState(new Set())
  const [processing, setProcessing] = useState(false)
  const [organization, setOrganization] = useState(null)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [returnStatus, setReturnStatus] = useState(null)

  // Check for Stripe return on mount
  useEffect(() => {
    const result = getCheckoutResult()
    if (result.success) {
      setReturnStatus('success')
      const url = new URL(window.location)
      url.searchParams.delete('success')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url)
    } else if (result.canceled) {
      setReturnStatus('canceled')
      const url = new URL(window.location)
      url.searchParams.delete('canceled')
      window.history.replaceState({}, '', url)
    }
  }, [])

  useEffect(() => { loadPayments() }, [roleContext])

  async function loadPayments() {
    const playerIds = roleContext?.children?.map(c => c.id) || []
    if (playerIds.length === 0) { setLoading(false); return }

    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, players (id, first_name, last_name, season_id)')
        .in('player_id', playerIds)
        .order('created_at', { ascending: false })
      
      if (paymentsError) {
        console.error('Payments query error:', paymentsError)
        setLoading(false)
        return
      }

      const seasonIds = [...new Set((paymentsData || []).map(p => p.players?.season_id).filter(Boolean))]
      
      let seasonsMap = {}
      if (seasonIds.length > 0) {
        const { data: seasonsData } = await supabase
          .from('seasons')
          .select('id, name, organization_id, organizations(id, name, payment_venmo, payment_zelle, payment_cashapp, payment_instructions, stripe_enabled, stripe_publishable_key)')
          .in('id', seasonIds)
        
        seasonsMap = (seasonsData || []).reduce((acc, s) => {
          acc[s.id] = s
          return acc
        }, {})
        
        if (seasonsData?.[0]?.organizations) {
          setOrganization(seasonsData[0].organizations)
        }
      }
      
      const enrichedPayments = (paymentsData || []).map(p => ({
        ...p,
        seasons: seasonsMap[p.players?.season_id] || null
      }))
      
      setPayments(enrichedPayments)
    } catch (err) { console.error('Error loading payments:', err) }
    setLoading(false)
  }

  const totalDue = payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const unpaidPayments = payments.filter(p => !p.paid)
  const paidPayments = payments.filter(p => p.paid)
  
  const selectedTotal = unpaidPayments
    .filter(p => selectedPayments.has(p.id))
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  function togglePaymentSelection(paymentId) {
    const newSelected = new Set(selectedPayments)
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId)
    } else {
      newSelected.add(paymentId)
    }
    setSelectedPayments(newSelected)
  }

  function selectAllUnpaid() {
    setSelectedPayments(new Set(unpaidPayments.map(p => p.id)))
  }

  function clearSelection() {
    setSelectedPayments(new Set())
  }

  async function handleStripeCheckout() {
    if (selectedPayments.size === 0) {
      showToast('Please select fees to pay', 'warning')
      return
    }
    
    setStripeLoading(true)
    try {
      const selected = unpaidPayments.filter(p => selectedPayments.has(p.id))
      
      const feeNames = selected
        .map(p => p.fee_name || p.description || 'Fee')
        .join(', ')
      
      const description = selected.length === 1
        ? feeNames
        : `VolleyBrain Fees: ${feeNames}`

      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/payments?success=true&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${baseUrl}/payments?canceled=true`

      const { url } = await createCheckoutSession({
        payment_ids: selected.map(p => p.id),
        amount: Math.round(selectedTotal * 100),
        customer_email: user?.email,
        customer_name: user?.user_metadata?.full_name || user?.email,
        description,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organization_id: organization?.id,
          fee_count: selected.length.toString(),
        },
      })

      window.location.href = url
    } catch (err) {
      console.error('Stripe checkout error:', err)
      showToast('Failed to start online payment: ' + err.message, 'error')
      setStripeLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${tc.text}`}>Payments</h1>
        <p className={tc.textSecondary}>Manage your family's payments</p>
      </div>

      {/* Stripe Return Banners */}
      {returnStatus === 'success' && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-lg">Payment Successful! 🎉</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
              Your payment has been processed. A receipt has been sent to your email. 
              It may take a moment for your balance to update.
            </p>
          </div>
          <button onClick={() => { setReturnStatus(null); loadPayments() }} className="opacity-60 hover:opacity-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {returnStatus === 'canceled' && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Payment Cancelled</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>
              No charges were made. You can try again anytime.
            </p>
          </div>
          <button onClick={() => setReturnStatus(null)} className="opacity-60 hover:opacity-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <p className={tc.textMuted}>Total Due</p>
          <p className={`text-3xl font-bold ${totalDue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>${totalDue.toFixed(2)}</p>
          {unpaidPayments.length > 0 && <p className="text-xs text-red-400 mt-1">{unpaidPayments.length} unpaid fees</p>}
        </div>
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <p className={tc.textMuted}>Total Paid</p>
          <p className="text-3xl font-bold text-emerald-500">${totalPaid.toFixed(2)}</p>
          <p className={`text-xs ${tc.textMuted} mt-1`}>{paidPayments.length} payments</p>
        </div>
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          {selectedPayments.size > 0 ? (
            <div>
              <p className={tc.textMuted}>Selected</p>
              <p className="text-3xl font-bold text-[var(--accent-primary)]">${selectedTotal.toFixed(2)}</p>
              <p className={`text-xs ${tc.textMuted} mt-1`}>{selectedPayments.size} fees selected</p>
            </div>
          ) : totalDue > 0 ? (
            <div className="flex flex-col justify-center h-full">
              <p className={`text-sm ${tc.textMuted} mb-2`}>Select fees below to pay</p>
              <button 
                onClick={selectAllUnpaid}
                className="py-2 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-medium hover:bg-[var(--accent-primary)]/30 transition"
              >
                Select All
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Check className="w-12 h-12 text-emerald-500" />
              <p className={`${tc.text} font-semibold mt-2`}>All Paid!</p>
            </div>
          )}
        </div>
      </div>

      {/* Pay Selected Button */}
      {selectedPayments.size > 0 && (
        <div className={`${tc.cardBg} border-2 border-[var(--accent-primary)] rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={tc.text}>Ready to pay <span className="font-bold">${selectedTotal.toFixed(2)}</span></p>
              <p className={`text-sm ${tc.textMuted}`}>{selectedPayments.size} fees selected</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={clearSelection}
                className={`px-4 py-2 rounded-xl border ${tc.border} ${tc.text}`}
              >
                Clear
              </button>
              <button 
                onClick={() => setShowPaymentOptions(true)}
                disabled={processing}
                className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : '💳 Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outstanding Payments */}
      {unpaidPayments.length > 0 && (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${tc.text} flex items-center gap-2`}>
              <span className="text-red-500">⚠️</span> Outstanding Payments
            </h2>
            <button 
              onClick={selectedPayments.size === unpaidPayments.length ? clearSelection : selectAllUnpaid}
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              {selectedPayments.size === unpaidPayments.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-3">
            {unpaidPayments.map(payment => {
              const isSelected = selectedPayments.has(payment.id)
              return (
                <div 
                  key={payment.id} 
                  onClick={() => togglePaymentSelection(payment.id)}
                  className={`${tc.cardBgAlt} rounded-xl p-4 flex items-center gap-4 cursor-pointer transition ${isSelected ? 'ring-2 ring-[var(--accent-primary)]' : 'hover:bg-slate-800/50'}`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${isSelected ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-slate-600'}`}>
                    {isSelected && <span className="text-white text-sm">✓</span>}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <span className="text-2xl">💵</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${tc.text}`}>{payment.fee_name || payment.description || 'Payment'}</p>
                    <p className={`text-sm ${tc.textMuted}`}>
                      {payment.players?.first_name} • {payment.seasons?.name || 'Season'}
                      {payment.due_date && ` • Due ${new Date(payment.due_date).toLocaleDateString()}`}
                    </p>
                    {payment.fee_category === 'per_family' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Family Fee</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-500">${parseFloat(payment.amount).toFixed(2)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment Options Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
            <div className={`p-6 border-b ${tc.border}`}>
              <h2 className={`text-xl font-semibold ${tc.text}`}>Payment Options</h2>
              <p className={`${tc.textMuted} text-sm mt-1`}>Total: ${selectedTotal.toFixed(2)}</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Selected fees summary */}
              <div className={`${tc.cardBgAlt} rounded-xl p-4 max-h-40 overflow-y-auto`}>
                <p className={`text-xs ${tc.textMuted} uppercase mb-2`}>Paying for:</p>
                {unpaidPayments.filter(p => selectedPayments.has(p.id)).map(p => (
                  <div key={p.id} className="flex justify-between text-sm py-1">
                    <span className={tc.textSecondary}>{p.fee_name || p.description} ({p.players?.first_name})</span>
                    <span className={tc.text}>${parseFloat(p.amount).toFixed(2)}</span>
                  </div>
                ))}
                <div className={`flex justify-between font-bold pt-2 mt-2 border-t ${tc.border}`}>
                  <span className={tc.text}>Total</span>
                  <span className="text-[var(--accent-primary)]">${selectedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* === STRIPE PAY ONLINE === */}
              {organization?.stripe_enabled && (
                <div>
                  <button
                    onClick={handleStripeCheckout}
                    disabled={stripeLoading}
                    className={`
                      flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-semibold
                      transition-all duration-200
                      ${stripeLoading
                        ? 'bg-indigo-600/50 text-white cursor-wait'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110 hover:shadow-lg hover:shadow-indigo-500/25'
                      }
                    `}
                  >
                    {stripeLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting to Stripe...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay Online — ${selectedTotal.toFixed(2)}
                        <ExternalLink className="w-4 h-4 ml-1 opacity-60" />
                      </>
                    )}
                  </button>
                  <p className={`text-xs ${tc.textMuted} text-center mt-2 flex items-center justify-center gap-1`}>
                    🔒 Secure checkout powered by Stripe
                  </p>
                </div>
              )}

              {/* Divider between online and manual */}
              {organization?.stripe_enabled && (organization?.payment_venmo || organization?.payment_zelle || organization?.payment_cashapp || organization?.payment_instructions) && (
                <div className="flex items-center gap-3">
                  <div className={`flex-1 border-t ${tc.border}`} />
                  <span className={`text-xs ${tc.textMuted} uppercase`}>or pay manually</span>
                  <div className={`flex-1 border-t ${tc.border}`} />
                </div>
              )}

              {/* Manual payment methods */}
              <div className="space-y-3">
                {!organization?.stripe_enabled && (
                  <p className={`text-sm font-medium ${tc.text}`}>Send payment via:</p>
                )}
                
                {organization?.payment_venmo && (
                  <a 
                    href={`https://venmo.com/${organization.payment_venmo}?txn=pay&amount=${selectedTotal.toFixed(2)}&note=VolleyBrain%20Fees`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-[#3D95CE]/20 rounded-xl hover:bg-[#3D95CE]/30 transition"
                  >
                    <span className="text-2xl">💳</span>
                    <div className="flex-1">
                      <p className="font-medium text-[#3D95CE]">Venmo</p>
                      <p className={`text-sm ${tc.textMuted}`}>@{organization.payment_venmo}</p>
                    </div>
                    <span className="text-[#3D95CE]">→</span>
                  </a>
                )}
                
                {organization?.payment_zelle && (
                  <div className="flex items-center gap-3 p-4 bg-purple-500/20 rounded-xl">
                    <span className="text-2xl">💸</span>
                    <div className="flex-1">
                      <p className="font-medium text-purple-400">Zelle</p>
                      <p className={`text-sm ${tc.textMuted}`}>{organization.payment_zelle}</p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(organization.payment_zelle)
                        showToast('Zelle email copied!', 'success')
                      }}
                      className="text-purple-400 hover:underline text-sm"
                    >
                      Copy
                    </button>
                  </div>
                )}
                
                {organization?.payment_cashapp && (
                  <a 
                    href={`https://cash.app/${organization.payment_cashapp}/${selectedTotal.toFixed(2)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition"
                  >
                    <span className="text-2xl">💵</span>
                    <div className="flex-1">
                      <p className="font-medium text-emerald-400">Cash App</p>
                      <p className={`text-sm ${tc.textMuted}`}>{organization.payment_cashapp}</p>
                    </div>
                    <span className="text-emerald-400">→</span>
                  </a>
                )}

                {organization?.payment_instructions && (
                  <div className={`p-4 ${tc.cardBgAlt} rounded-xl`}>
                    <p className={`text-sm font-medium ${tc.text} mb-2`}>Other Payment Options:</p>
                    <p className={`text-sm ${tc.textSecondary} whitespace-pre-wrap`}>{organization.payment_instructions}</p>
                  </div>
                )}

                {!organization?.stripe_enabled && !organization?.payment_venmo && !organization?.payment_zelle && !organization?.payment_cashapp && !organization?.payment_instructions && (
                  <div className={`p-4 ${tc.cardBgAlt} rounded-xl text-center`}>
                    <p className={tc.textMuted}>Contact your league administrator for payment options.</p>
                  </div>
                )}
              </div>

              {!organization?.stripe_enabled && (
                <div className={`bg-amber-500/10 border border-amber-500/30 rounded-xl p-4`}>
                  <p className="text-amber-400 text-sm">
                    💡 After sending payment, your admin will mark it as paid within 1-2 business days.
                  </p>
                </div>
              )}
            </div>
            
            <div className={`p-6 border-t ${tc.border}`}>
              <button 
                onClick={() => setShowPaymentOptions(false)} 
                className={`w-full py-2 rounded-xl border ${tc.border} ${tc.text}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
        <h2 className={`font-semibold ${tc.text} mb-4`}>Payment History</h2>
        {paidPayments.length > 0 ? (
          <div className="space-y-2">
            {paidPayments.map(payment => (
              <div key={payment.id} className={`${tc.cardBgAlt} rounded-xl p-4 flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-500">✓</span>
                </div>
                <div className="flex-1">
                  <p className={tc.text}>{payment.fee_name || payment.description || 'Payment'}</p>
                  <p className={`text-xs ${tc.textMuted}`}>
                    {payment.players?.first_name} • {payment.payment_method && `${payment.payment_method} • `}
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : new Date(payment.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold text-emerald-500">${parseFloat(payment.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <span className="text-4xl">📜</span>
            <p className={tc.textMuted}>No payment history</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { ParentPaymentsPage }
