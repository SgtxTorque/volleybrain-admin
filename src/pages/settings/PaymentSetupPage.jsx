import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  CreditCard, CheckCircle2 as CheckCircle, AlertCircle, ExternalLink,
  RefreshCw, Zap, DollarSign,
  Loader2, HelpCircle, AlertTriangle, XCircle
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'

function PaymentSetupPage({ showToast }) {
  const { organization, setOrganization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  // Manual payment settings
  const [settings, setSettings] = useState({
    venmoHandle: '',
    zelleEmail: '',
    cashappHandle: '',
    acceptManualPayments: true
  })

  // Stripe settings
  const [stripeSettings, setStripeSettings] = useState({
    stripe_enabled: false,
    payment_processing_fee_mode: 'absorb',
    allow_partial_payments: false,
    minimum_payment_amount: 10,
    send_receipt_emails: true
  })

  // Connect state
  const [connectStatus, setConnectStatus] = useState(null) // null = loading, object = loaded
  const [connectLoading, setConnectLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')

  useEffect(() => {
    if (organization?.settings?.payments) {
      setSettings(prev => ({ ...prev, ...organization.settings.payments }))
    }
    if (organization) {
      setStripeSettings(prev => ({
        ...prev,
        stripe_enabled: organization.stripe_enabled || false,
        payment_processing_fee_mode: organization.payment_processing_fee_mode || 'absorb',
        allow_partial_payments: organization.allow_partial_payments || false,
        minimum_payment_amount: organization.minimum_payment_amount || 10,
        send_receipt_emails: organization.send_receipt_emails !== false
      }))
    }
  }, [organization])

  // On mount: check for Stripe return/refresh URL params and check connect status
  useEffect(() => {
    if (!organization?.id) return

    const params = new URLSearchParams(window.location.search)
    const isReturn = params.get('stripe_return') === 'true'
    const isRefresh = params.get('stripe_refresh') === 'true'

    // Clean up URL params
    if (isReturn || isRefresh) {
      const url = new URL(window.location)
      url.searchParams.delete('stripe_return')
      url.searchParams.delete('stripe_refresh')
      window.history.replaceState({}, '', url)
    }

    // Always check status if org has a stripe_account_id, or if returning from Stripe
    if (organization.stripe_account_id || isReturn) {
      checkConnectStatus()
    } else {
      setConnectStatus({ connected: false })
    }
  }, [organization?.id])

  async function checkConnectStatus() {
    setStatusLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-status', {
        body: { organization_id: organization.id }
      })

      if (error) {
        console.error('Connect status error:', error)
        setConnectStatus({ connected: false, error: error.message })
      } else {
        setConnectStatus(data)
        // Update local org state if onboarding status changed
        if (data?.onboarding_complete && !organization.stripe_onboarding_complete) {
          setOrganization(prev => ({
            ...prev,
            stripe_onboarding_complete: true,
            stripe_enabled: true
          }))
          setStripeSettings(prev => ({ ...prev, stripe_enabled: true }))
        }
      }
    } catch (err) {
      console.error('Connect status error:', err)
      setConnectStatus({ connected: false, error: err.message })
    }
    setStatusLoading(false)
  }

  async function handleConnectWithStripe() {
    setConnectLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { organization_id: organization.id }
      })

      if (error) throw new Error(error.message)

      if (data?.already_connected) {
        showToast('Stripe is already connected!', 'success')
        checkConnectStatus()
      } else if (data?.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        throw new Error('No onboarding URL returned')
      }
    } catch (err) {
      console.error('Connect onboard error:', err)
      showToast('Failed to start Stripe setup: ' + err.message, 'error')
    }
    setConnectLoading(false)
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect your Stripe account? Parents will no longer be able to pay online. You can reconnect at any time.')) return

    setDisconnecting(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          stripe_account_id: null,
          stripe_onboarding_complete: false,
          stripe_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)

      if (error) throw error

      setOrganization(prev => ({
        ...prev,
        stripe_account_id: null,
        stripe_onboarding_complete: false,
        stripe_enabled: false
      }))
      setConnectStatus({ connected: false })
      setStripeSettings(prev => ({ ...prev, stripe_enabled: false }))
      showToast('Stripe disconnected', 'success')
    } catch (err) {
      showToast('Failed to disconnect: ' + err.message, 'error')
    }
    setDisconnecting(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const newSettings = { ...organization.settings, payments: settings }

      const { error } = await supabase
        .from('organizations')
        .update({
          settings: newSettings,
          stripe_enabled: stripeSettings.stripe_enabled,
          payment_processing_fee_mode: stripeSettings.payment_processing_fee_mode,
          allow_partial_payments: stripeSettings.allow_partial_payments,
          minimum_payment_amount: stripeSettings.minimum_payment_amount,
          send_receipt_emails: stripeSettings.send_receipt_emails,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)

      if (error) throw error

      setOrganization(prev => ({
        ...prev,
        settings: newSettings,
        stripe_enabled: stripeSettings.stripe_enabled,
        payment_processing_fee_mode: stripeSettings.payment_processing_fee_mode,
        allow_partial_payments: stripeSettings.allow_partial_payments,
        minimum_payment_amount: stripeSettings.minimum_payment_amount,
        send_receipt_emails: stripeSettings.send_receipt_emails
      }))

      showToast('Payment settings saved!', 'success')
    } catch (err) {
      console.error('Error saving settings:', err)
      showToast('Failed to save settings', 'error')
    }
    setSaving(false)
  }

  const isConnected = connectStatus?.connected && connectStatus?.onboarding_complete

  return (
    <PageShell
      title="Payment Setup"
      subtitle="Configure how parents can pay fees"
      breadcrumb="Setup › Payment Setup"
      actions={
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#10284C] text-white font-bold px-6 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center gap-2 text-sm"
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      }
    >

      {/* Navy Overview Header */}
      <div className="bg-[#10284C] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--v2-font)' }}>
              Payment Configuration
            </h2>
            <p className="text-sm text-white/50">Set up manual and online payment methods</p>
          </div>
          <div className="flex gap-4 text-xs font-bold text-white/50">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full inline-block ${settings.acceptManualPayments ? 'bg-[#22C55E]' : 'bg-slate-500'}`} />
              Manual {settings.acceptManualPayments ? 'On' : 'Off'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full inline-block ${isConnected ? 'bg-[#22C55E]' : 'bg-slate-500'}`} />
              Stripe {isConnected ? 'Connected' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      {/* V2 Tab Navigation */}
      <div className={`flex items-center gap-1 rounded-xl p-1 w-fit mb-6 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'border border-[#E8ECF2]'}`}>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeTab === 'manual'
              ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
              : isDark ? 'text-slate-500 hover:bg-white/[0.06]' : 'text-slate-400 hover:bg-[#F5F6F8]'
          }`}
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          Manual Payments
        </button>
        <button
          onClick={() => setActiveTab('stripe')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'stripe'
              ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
              : isDark ? 'text-slate-500 hover:bg-white/[0.06]' : 'text-slate-400 hover:bg-[#F5F6F8]'
          }`}
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          <CreditCard className="w-4 h-4" /> Online Payments
          {isConnected && <span className="w-2 h-2 rounded-full bg-[#22C55E]" />}
        </button>
      </div>

      {/* Manual Payments Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className={`rounded-[14px] p-6 space-y-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
            <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>Manual Payment Methods</h2>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Parents will see these options and send payment directly to you.
            </p>

            {[
              { key: 'venmoHandle', label: 'Venmo', placeholder: '@YourVenmo', color: '#3D95CE', icon: 'V' },
              { key: 'zelleEmail', label: 'Zelle', placeholder: 'email@example.com', color: '#6D1ED4', icon: 'Z' },
              { key: 'cashappHandle', label: 'Cash App', placeholder: '$YourCashApp', color: '#00D632', icon: '$' },
            ].map(p => (
              <div key={p.key} className={`p-4 rounded-[14px] ${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: p.color + '20', color: p.color }}
                  >
                    {p.icon}
                  </div>
                  <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{p.label}</span>
                </div>
                <input
                  type="text"
                  value={settings[p.key]}
                  onChange={e => setSettings({...settings, [p.key]: e.target.value})}
                  placeholder={p.placeholder}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium border focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 ${
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600' : 'bg-white border-[#E8ECF2] text-[#10284C]'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className={`rounded-[14px] p-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Accept Manual Payments</p>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Show Venmo/Zelle/Cash App options during checkout</p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={settings.acceptManualPayments}
                  onChange={e => setSettings({...settings, acceptManualPayments: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4BB9EC]" />
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Stripe Tab */}
      {activeTab === 'stripe' && (
        <div className="space-y-6">

          {/* === CONNECTED STATE === */}
          {isConnected && (
            <>
              {/* Connected Status Card */}
              <div className={`rounded-[14px] p-6 border-2 border-[#22C55E]/30 ${isDark ? 'bg-[#22C55E]/5' : 'bg-[#22C55E]/5'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#22C55E]/15 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-[#22C55E]" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                        Stripe Connected
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {connectStatus.business_name || 'Your Stripe Account'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={checkConnectStatus}
                      disabled={statusLoading}
                      className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
                      title="Refresh status"
                    >
                      <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </button>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${connectStatus.charges_enabled ? 'bg-[#22C55E]' : 'bg-amber-500'}`} />
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Charges {connectStatus.charges_enabled ? 'Enabled' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${connectStatus.payouts_enabled ? 'bg-[#22C55E]' : 'bg-amber-500'}`} />
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Payouts {connectStatus.payouts_enabled ? 'Enabled' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#22C55E]/20">
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#4BB9EC] hover:underline flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Stripe Dashboard
                  </a>
                  <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>|</span>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-sm font-medium text-red-400 hover:text-red-300 flex items-center gap-1.5"
                  >
                    {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Enable/Disable Toggle */}
              <div className={`rounded-[14px] p-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      stripeSettings.stripe_enabled ? 'bg-[#22C55E]/15' : isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'
                    }`}>
                      <Zap className={`w-6 h-6 ${stripeSettings.stripe_enabled ? 'text-[#22C55E]' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>Accept Online Payments</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {stripeSettings.stripe_enabled
                          ? 'Parents can pay with credit/debit cards'
                          : 'Enable to show "Pay Online" option to parents'
                        }
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stripeSettings.stripe_enabled}
                      onChange={e => setStripeSettings(prev => ({ ...prev, stripe_enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#4BB9EC]" />
                  </label>
                </div>
              </div>

              {/* Payment Options (always shown when connected) */}
              <div className={`rounded-[14px] p-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
                <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>Payment Options</h3>

                <div className="space-y-4">
                  {/* Processing Fee Mode */}
                  <div>
                    <label className={`block text-sm font-medium ${tc.text} mb-3`}>
                      Stripe Processing Fees (2.9% + $0.30)
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'absorb', label: 'Absorb fees', desc: 'Organization pays all fees' },
                        { value: 'pass_to_parent', label: 'Pass to parent', desc: 'Add fees to payment total' },
                      ].map(option => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                            stripeSettings.payment_processing_fee_mode === option.value
                              ? isDark ? 'bg-slate-700 border border-lynx-sky' : 'bg-white border border-lynx-sky shadow-sm'
                              : isDark ? 'bg-slate-700/50 border border-transparent hover:border-slate-600' : 'bg-slate-50 border border-transparent hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="feeMode"
                            value={option.value}
                            checked={stripeSettings.payment_processing_fee_mode === option.value}
                            onChange={e => setStripeSettings(prev => ({ ...prev, payment_processing_fee_mode: e.target.value }))}
                            className="w-4 h-4 text-lynx-sky"
                          />
                          <div>
                            <p className={`${tc.text} font-medium`}>{option.label}</p>
                            <p className={`${tc.textMuted} text-sm`}>{option.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Partial Payments */}
                  <div className={`flex items-center justify-between p-4 ${tc.cardBgAlt} rounded-lg`}>
                    <div>
                      <p className={`${tc.text} font-medium`}>Allow Partial Payments</p>
                      <p className={`${tc.textMuted} text-sm`}>Let parents pay a portion of their balance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stripeSettings.allow_partial_payments}
                        onChange={e => setStripeSettings(prev => ({ ...prev, allow_partial_payments: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lynx-sky" />
                    </label>
                  </div>

                  {/* Send Receipt Emails */}
                  <div className={`flex items-center justify-between p-4 ${tc.cardBgAlt} rounded-lg`}>
                    <div>
                      <p className={`${tc.text} font-medium`}>Send Receipt Emails</p>
                      <p className={`${tc.textMuted} text-sm`}>Email parents when payments are confirmed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stripeSettings.send_receipt_emails}
                        onChange={e => setStripeSettings(prev => ({ ...prev, send_receipt_emails: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lynx-sky" />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === NOT CONNECTED STATE — onboarding incomplete === */}
          {connectStatus?.connected && !connectStatus?.onboarding_complete && (
            <div className={`rounded-[14px] p-6 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                    Stripe Setup Incomplete
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Your Stripe account was created but onboarding isn't finished. Complete setup to start accepting payments.
                  </p>
                  <button
                    onClick={handleConnectWithStripe}
                    disabled={connectLoading}
                    className="mt-4 px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {connectLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Complete Stripe Setup
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === NOT CONNECTED STATE === */}
          {connectStatus && !connectStatus.connected && (
            <>
              {/* Help Section */}
              <div className={`rounded-[14px] p-6 ${isDark ? 'bg-[#4BB9EC]/5 border border-[#4BB9EC]/15' : 'bg-[#4BB9EC]/5 border border-[#4BB9EC]/20'}`}>
                <h3 className="text-[#4BB9EC] font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--v2-font)' }}>
                  <HelpCircle className="w-5 h-5" />
                  How it works
                </h3>
                <div className={`space-y-2 text-sm ${isDark ? 'text-[#4BB9EC]/70' : 'text-[#4BB9EC]/80'}`}>
                  <p>
                    <strong>1.</strong> Click "Connect with Stripe" below to create or link your Stripe account
                  </p>
                  <p>
                    <strong>2.</strong> Complete the Stripe setup wizard (takes about 5 minutes)
                  </p>
                  <p>
                    <strong>3.</strong> Once connected, parents can pay fees with credit/debit cards
                  </p>
                  <p>
                    <strong>4.</strong> Payments go directly to your Stripe account. You manage payouts from your Stripe Dashboard.
                  </p>
                </div>
              </div>

              {/* Connect Button Card */}
              <div className={`rounded-[14px] p-8 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
                <div className="w-16 h-16 rounded-2xl bg-[#4BB9EC]/10 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-[#4BB9EC]" />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                  Connect Your Stripe Account
                </h3>
                <p className={`text-sm max-w-md mx-auto mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Accept credit and debit card payments from parents. Stripe handles all payment processing securely.
                  {' '}A small platform fee of $0.50 per transaction applies.
                </p>
                <button
                  onClick={handleConnectWithStripe}
                  disabled={connectLoading}
                  className="w-full max-w-sm mx-auto px-8 py-3.5 bg-[#4BB9EC] text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition"
                  style={{ fontFamily: 'var(--v2-font)' }}
                >
                  {connectLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Connect with Stripe
                    </>
                  )}
                </button>
                <p className={`text-xs mt-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  You'll be redirected to Stripe to complete setup
                </p>
              </div>
            </>
          )}

          {/* Loading state */}
          {!connectStatus && (
            <div className={`rounded-[14px] p-8 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
              <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Checking Stripe connection...</p>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}

export { PaymentSetupPage }
