import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { createCheckoutSession, getCheckoutResult } from '../../lib/stripe-checkout'
import {
  DollarSign, Check, Clock, AlertTriangle, ChevronRight,
  CreditCard, Loader2, ExternalLink, XCircle, CheckCircle2, X
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'

function ParentPaymentsPage({ roleContext, showToast }) {
  const { user } = useAuth()
  const parentTutorial = useParentTutorial()
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

      // Complete parent journey step for making a payment
      parentTutorial?.completeStep?.('make_payment')
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
          .select('id, name, organization_id, organizations(id, name, payment_venmo, payment_zelle, payment_cashapp, payment_instructions, stripe_enabled, stripe_publishable_key, payment_processing_fee_mode)')
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

  // Calculate Stripe processing fee when org passes it to parents
  const passFeesToParent = organization?.payment_processing_fee_mode === 'pass_to_parent'
  const processingFee = passFeesToParent && selectedTotal > 0
    ? Math.round((selectedTotal * 0.029 + 0.30) * 100) / 100
    : 0
  const selectedTotalWithFee = Math.round((selectedTotal + processingFee) * 100) / 100

  // Find the nearest due date among unpaid payments
  const nextDueDate = unpaidPayments
    .filter(p => p.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]?.due_date

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
        : `Lynx Fees: ${feeNames}`

      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/payments?success=true&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${baseUrl}/payments?canceled=true`

      const { url } = await createCheckoutSession({
        payment_ids: selected.map(p => p.id),
        amount: Math.round(selectedTotalWithFee * 100),
        customer_email: user?.email,
        customer_name: user?.user_metadata?.full_name || user?.email,
        description: processingFee > 0
          ? `${description} (includes $${processingFee.toFixed(2)} processing fee)`
          : description,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organization_id: organization?.id,
          fee_count: selected.length.toString(),
          processing_fee: processingFee > 0 ? processingFee.toFixed(2) : undefined,
        },
      })

      window.location.href = url
    } catch (err) {
      console.error('Stripe checkout error:', err)
      showToast('Failed to start online payment: ' + err.message, 'error')
      setStripeLoading(false)
    }
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06] rounded-[14px]'
    : 'bg-white border border-slate-200 rounded-[14px]'
  const textPrimary = isDark ? 'text-white' : 'text-slate-900'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
  const borderCls = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full" />
    </div>
  )

  return (
    <PageShell
      title="Payments"
      breadcrumb="My Stuff"
      subtitle="Manage your family's payments and outstanding balances"
    >
      {/* Stat Row */}
      <InnerStatRow stats={[
        {
          icon: '💰',
          label: 'Total Owed',
          value: `$${totalDue.toFixed(2)}`,
          color: totalDue > 0 ? 'text-red-500' : 'text-emerald-500',
          sub: unpaidPayments.length > 0 ? `${unpaidPayments.length} unpaid` : 'None outstanding'
        },
        {
          icon: '✅',
          label: 'Total Paid',
          value: `$${totalPaid.toFixed(2)}`,
          color: 'text-emerald-500',
          sub: `${paidPayments.length} payment${paidPayments.length !== 1 ? 's' : ''}`
        },
        {
          icon: '📊',
          label: 'Outstanding Balance',
          value: `$${(totalDue - totalPaid > 0 ? totalDue : 0).toFixed(2)}`,
          color: totalDue > 0 ? 'text-amber-500' : 'text-emerald-500',
          sub: totalDue === 0 ? 'All clear' : `${unpaidPayments.length} remaining`
        },
        {
          icon: '📅',
          label: 'Next Due Date',
          value: nextDueDate ? new Date(nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          color: textPrimary,
          sub: nextDueDate ? new Date(nextDueDate).toLocaleDateString('en-US', { year: 'numeric' }) : 'No upcoming dues'
        }
      ]} />

      <div className="space-y-6">
        {/* Stripe Return Banners */}
        {returnStatus === 'success' && (
          <div className={`p-4 rounded-[14px] border flex items-start gap-3 ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-r-lg">Payment Successful!</p>
              <p className={`text-r-sm mt-1 ${isDark ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
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
          <div className={`p-4 rounded-[14px] border flex items-start gap-3 ${
            isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-r-sm">Payment Cancelled</p>
              <p className={`text-r-sm mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                No charges were made. You can try again anytime.
              </p>
            </div>
            <button onClick={() => setReturnStatus(null)} className="opacity-60 hover:opacity-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Pay Selected Button */}
        {selectedPayments.size > 0 && (
          <div className={`${cardCls} border-2 border-lynx-navy p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${textPrimary} text-r-sm`}>Ready to pay <span className="font-bold">${selectedTotal.toFixed(2)}</span></p>
                <p className="text-r-xs text-slate-400">{selectedPayments.size} fees selected</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={clearSelection}
                  className={`px-4 py-2 rounded-lg border ${borderCls} ${textPrimary} text-r-sm font-medium`}
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowPaymentOptions(true)}
                  disabled={processing}
                  className="px-6 py-2 bg-lynx-navy text-white font-bold rounded-lg hover:brightness-110 transition disabled:opacity-50 text-r-sm"
                >
                  {processing ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Outstanding Payments */}
        {unpaidPayments.length > 0 && (
          <div className={`${cardCls} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${textPrimary} text-r-lg flex items-center gap-2`}>
                <AlertTriangle className="w-5 h-5 text-red-500" /> Outstanding Payments
              </h2>
              <button
                onClick={selectedPayments.size === unpaidPayments.length ? clearSelection : selectAllUnpaid}
                className="text-r-sm bg-lynx-sky/20 text-lynx-sky px-3 py-1 rounded-lg font-medium hover:bg-lynx-sky/30 transition"
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
                    className={`${altBg} rounded-[14px] p-4 flex items-center gap-4 cursor-pointer transition ${isSelected ? 'ring-2 ring-lynx-sky' : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${isSelected ? 'bg-lynx-sky border-lynx-sky' : isDark ? 'border-slate-600' : 'border-slate-300'}`}>
                      {isSelected && <span className="text-white text-r-sm">✓</span>}
                    </div>
                    <div className="w-12 h-12 rounded-[14px] bg-red-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${textPrimary} text-r-sm`}>{payment.fee_name || payment.description || 'Payment'}</p>
                      <p className="text-r-xs text-slate-400">
                        {payment.players?.first_name} / {payment.seasons?.name || 'Season'}
                        {payment.due_date && ` / Due ${new Date(payment.due_date).toLocaleDateString()}`}
                      </p>
                      {payment.fee_category === 'per_family' && (
                        <span className="text-r-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Family Fee</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-r-xl font-bold text-red-500">${parseFloat(payment.amount).toFixed(2)}</p>
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
            <div className={`${cardCls} w-full max-w-md`}>
              <div className={`p-6 border-b ${borderCls}`}>
                <h2 className={`text-r-xl font-semibold ${textPrimary}`}>Payment Options</h2>
                <p className="text-slate-400 text-r-sm mt-1">
                  Subtotal: ${selectedTotal.toFixed(2)}
                  {processingFee > 0 && ` / Online total: $${selectedTotalWithFee.toFixed(2)}`}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Selected fees summary */}
                <div className={`${altBg} rounded-[14px] p-4 max-h-40 overflow-y-auto`}>
                  <p className="text-r-xs text-slate-400 uppercase mb-2">Paying for:</p>
                  {unpaidPayments.filter(p => selectedPayments.has(p.id)).map(p => (
                    <div key={p.id} className="flex justify-between text-r-sm py-1">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{p.fee_name || p.description} ({p.players?.first_name})</span>
                      <span className={textPrimary}>${parseFloat(p.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  {processingFee > 0 && (
                    <div className="flex justify-between text-r-sm py-1 text-slate-400">
                      <span>Processing fee (2.9% + $0.30)</span>
                      <span>${processingFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between font-bold pt-2 mt-2 border-t ${borderCls}`}>
                    <span className={textPrimary}>Total</span>
                    <span className="text-lynx-sky">${selectedTotalWithFee.toFixed(2)}</span>
                  </div>
                  {processingFee > 0 && (
                    <p className="text-r-xs text-slate-400 mt-1">Includes processing fee for online payment</p>
                  )}
                </div>

                {/* === STRIPE PAY ONLINE === */}
                {organization?.stripe_enabled && (
                  <div>
                    <button
                      onClick={handleStripeCheckout}
                      disabled={stripeLoading}
                      className={`
                        flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-lg font-bold text-r-sm
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
                          Pay Online - ${selectedTotalWithFee.toFixed(2)}
                          <ExternalLink className="w-4 h-4 ml-1 opacity-60" />
                        </>
                      )}
                    </button>
                    <p className="text-r-xs text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                      Secure checkout powered by Stripe
                    </p>
                  </div>
                )}

                {/* Divider between online and manual */}
                {organization?.stripe_enabled && (organization?.payment_venmo || organization?.payment_zelle || organization?.payment_cashapp || organization?.payment_instructions) && (
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 border-t ${borderCls}`} />
                    <span className="text-r-xs text-slate-400 uppercase">or pay manually</span>
                    <div className={`flex-1 border-t ${borderCls}`} />
                  </div>
                )}

                {/* Manual payment methods */}
                <div className="space-y-3">
                  {!organization?.stripe_enabled && (
                    <p className={`text-r-sm font-medium ${textPrimary}`}>Send payment via:</p>
                  )}

                  {organization?.payment_venmo && (
                    <a
                      href={`https://venmo.com/${organization.payment_venmo}?txn=pay&amount=${selectedTotal.toFixed(2)}&note=Lynx%20Fees`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-[#3D95CE]/20 rounded-[14px] hover:bg-[#3D95CE]/30 transition"
                    >
                      <CreditCard className="w-6 h-6 text-[#3D95CE]" />
                      <div className="flex-1">
                        <p className="font-medium text-[#3D95CE] text-r-sm">Venmo</p>
                        <p className="text-r-xs text-slate-400">@{organization.payment_venmo}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#3D95CE]" />
                    </a>
                  )}

                  {organization?.payment_zelle && (
                    <div className="flex items-center gap-3 p-4 bg-purple-500/20 rounded-[14px]">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                      <div className="flex-1">
                        <p className="font-medium text-purple-400 text-r-sm">Zelle</p>
                        <p className="text-r-xs text-slate-400">{organization.payment_zelle}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(organization.payment_zelle)
                          showToast('Zelle email copied!', 'success')
                        }}
                        className="text-purple-400 hover:underline text-r-sm font-medium"
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
                      className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-[14px] hover:bg-emerald-500/30 transition"
                    >
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                      <div className="flex-1">
                        <p className="font-medium text-emerald-400 text-r-sm">Cash App</p>
                        <p className="text-r-xs text-slate-400">{organization.payment_cashapp}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-emerald-400" />
                    </a>
                  )}

                  {organization?.payment_instructions && (
                    <div className={`p-4 ${altBg} rounded-[14px]`}>
                      <p className={`text-r-sm font-medium ${textPrimary} mb-2`}>Other Payment Options:</p>
                      <p className={`text-r-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} whitespace-pre-wrap`}>{organization.payment_instructions}</p>
                    </div>
                  )}

                  {!organization?.stripe_enabled && !organization?.payment_venmo && !organization?.payment_zelle && !organization?.payment_cashapp && !organization?.payment_instructions && (
                    <div className={`p-4 ${altBg} rounded-[14px] text-center`}>
                      <p className="text-slate-400 text-r-sm">Contact your league administrator for payment options.</p>
                    </div>
                  )}
                </div>

                {!organization?.stripe_enabled && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-[14px] p-4">
                    <p className="text-amber-400 text-r-sm">
                      After sending payment, your admin will mark it as paid within 1-2 business days.
                    </p>
                  </div>
                )}
              </div>

              <div className={`p-6 border-t ${borderCls}`}>
                <button
                  onClick={() => setShowPaymentOptions(false)}
                  className={`w-full py-2 rounded-lg border ${borderCls} ${textPrimary} text-r-sm font-medium`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className={`${cardCls} p-5`}>
          <h2 className={`font-semibold ${textPrimary} text-r-lg mb-4`}>Payment History</h2>
          {paidPayments.length > 0 ? (
            <div className="space-y-2">
              {paidPayments.map(payment => (
                <div key={payment.id} className={`${altBg} rounded-[14px] p-4 flex items-center gap-4`}>
                  <div className="w-10 h-10 rounded-[14px] bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className={`${textPrimary} text-r-sm`}>{payment.fee_name || payment.description || 'Payment'}</p>
                    <p className="text-r-xs text-slate-400">
                      {payment.players?.first_name} / {payment.payment_method && `${payment.payment_method} / `}
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : new Date(payment.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-500 text-r-sm">${parseFloat(payment.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-slate-400" />
              </div>
              <p className={`${textPrimary} font-semibold text-r-sm`}>No payment history</p>
              <p className="text-r-xs text-slate-400 mt-1">Completed payments will appear here</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export { ParentPaymentsPage }
