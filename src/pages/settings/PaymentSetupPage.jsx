import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  CreditCard, Key, CheckCircle, AlertCircle, ExternalLink,
  RefreshCw, Shield, Zap, DollarSign,
  Loader2, HelpCircle, AlertTriangle
} from 'lucide-react'

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
    stripe_mode: 'test',
    stripe_publishable_key: '',
    payment_processing_fee_mode: 'absorb',
    allow_partial_payments: false,
    minimum_payment_amount: 10,
    send_receipt_emails: true
  })
  
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [activeTab, setActiveTab] = useState('manual') // 'manual' or 'stripe'

  useEffect(() => {
    if (organization?.settings?.payments) {
      setSettings({ ...settings, ...organization.settings.payments })
    }
    // Load Stripe settings from organization
    if (organization) {
      setStripeSettings(prev => ({
        ...prev,
        stripe_enabled: organization.stripe_enabled || false,
        stripe_mode: organization.stripe_mode || 'test',
        stripe_publishable_key: organization.stripe_publishable_key || '',
        payment_processing_fee_mode: organization.payment_processing_fee_mode || 'absorb',
        allow_partial_payments: organization.allow_partial_payments || false,
        minimum_payment_amount: organization.minimum_payment_amount || 10,
        send_receipt_emails: organization.send_receipt_emails !== false
      }))
    }
  }, [organization])

  async function handleSave() {
    setSaving(true)
    try {
      // Save manual payment settings to organization.settings
      const newSettings = { ...organization.settings, payments: settings }
      
      // Save both manual and Stripe settings
      const { error } = await supabase
        .from('organizations')
        .update({ 
          settings: newSettings,
          stripe_enabled: stripeSettings.stripe_enabled,
          stripe_mode: stripeSettings.stripe_mode,
          stripe_publishable_key: stripeSettings.stripe_publishable_key,
          payment_processing_fee_mode: stripeSettings.payment_processing_fee_mode,
          allow_partial_payments: stripeSettings.allow_partial_payments,
          minimum_payment_amount: stripeSettings.minimum_payment_amount,
          send_receipt_emails: stripeSettings.send_receipt_emails,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)
      
      if (error) throw error
      
      setOrganization({ 
        ...organization, 
        settings: newSettings,
        stripe_enabled: stripeSettings.stripe_enabled,
        stripe_mode: stripeSettings.stripe_mode,
        stripe_publishable_key: stripeSettings.stripe_publishable_key,
        payment_processing_fee_mode: stripeSettings.payment_processing_fee_mode,
        allow_partial_payments: stripeSettings.allow_partial_payments,
        minimum_payment_amount: stripeSettings.minimum_payment_amount,
        send_receipt_emails: stripeSettings.send_receipt_emails
      })
      
      showToast('Payment settings saved!', 'success')
    } catch (err) {
      console.error('Error saving settings:', err)
      showToast('Failed to save settings', 'error')
    }
    setSaving(false)
  }

async function testStripeConnection() {
    setTesting(true)
    setTestResult(null)
    
    try {
      const key = stripeSettings.stripe_publishable_key
      
      if (!key) {
        setTestResult({ success: false, message: 'Please enter a publishable key' })
        setTesting(false)
        return
      }
      if (!key.startsWith('pk_')) {
        setTestResult({ success: false, message: 'Invalid key format. Publishable key should start with pk_' })
        setTesting(false)
        return
      }
      if (stripeSettings.stripe_mode === 'test' && !key.includes('_test_')) {
        setTestResult({ success: false, message: 'You selected Test mode but entered a Live key' })
        setTesting(false)
        return
      }
      if (stripeSettings.stripe_mode === 'live' && key.includes('_test_')) {
        setTestResult({ success: false, message: 'You selected Live mode but entered a Test key' })
        setTesting(false)
        return
      }

      const { data, error } = await supabase.functions.invoke('stripe-test-connection')
      
      if (error) {
        setTestResult({ success: false, message: error.message || 'Connection test failed' })
      } else if (data?.success) {
        setTestResult({ success: true, message: data.message || 'Connection successful!' })
      } else {
        setTestResult({ success: false, message: data?.message || 'Connection test failed' })
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message })
    }
    
    setTesting(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text} flex items-center gap-3`}>
            <DollarSign className="w-8 h-8" />
            Payment Setup
          </h1>
          <p className={`${tc.textMuted} mt-1`}>Configure how parents can pay fees</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-[var(--accent-primary)] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={`flex gap-2 border-b ${tc.border} pb-2`}>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'manual'
              ? isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm'
              : `${tc.textMuted} ${isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-50'}`
          }`}
        >
          💵 Manual Payments
        </button>
        <button
          onClick={() => setActiveTab('stripe')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            activeTab === 'stripe'
              ? isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm'
              : `${tc.textMuted} ${isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-50'}`
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Online Payments (Stripe)
          {stripeSettings.stripe_enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Manual Payments Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6 space-y-4`}>
            <h2 className={`text-lg font-semibold ${tc.text}`}>Manual Payment Methods</h2>
            <p className={`${tc.textMuted} text-sm`}>
              Parents will see these options and send payment directly to you.
            </p>
            
            {[
              { key: 'venmoHandle', label: 'Venmo', placeholder: '@YourVenmo', color: '#3D95CE', icon: 'V' },
              { key: 'zelleEmail', label: 'Zelle', placeholder: 'email@example.com', color: '#6D1ED4', icon: 'Z' },
              { key: 'cashappHandle', label: 'Cash App', placeholder: '$YourCashApp', color: '#00D632', icon: '$' },
            ].map(p => (
              <div key={p.key} className={`p-4 ${tc.cardBgAlt} rounded-xl`}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: p.color + '30', color: p.color }}
                  >
                    {p.icon}
                  </div>
                  <span className={`${tc.text} font-medium`}>{p.label}</span>
                </div>
                <input
                  type="text"
                  value={settings[p.key]}
                  onChange={e => setSettings({...settings, [p.key]: e.target.value})}
                  placeholder={p.placeholder}
                  className={`w-full ${tc.input} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>
            ))}
          </div>

          <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className={`font-medium ${tc.text}`}>Accept Manual Payments</p>
                <p className={`text-sm ${tc.textMuted}`}>Show Venmo/Zelle/Cash App options during checkout</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.acceptManualPayments} 
                onChange={e => setSettings({...settings, acceptManualPayments: e.target.checked})}
                className="w-6 h-6 rounded accent-orange-500" 
              />
            </label>
          </div>
        </div>
      )}

      {/* Stripe Tab */}
      {activeTab === 'stripe' && (
        <div className="space-y-6">
          {/* Help Section - Show at top */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Getting Started with Stripe
            </h3>
            <div className="space-y-2 text-sm text-blue-300">
              <p>
                <strong>1.</strong> Create a free{' '}
                <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="underline">
                  Stripe account
                </a>
              </p>
              <p>
                <strong>2.</strong> Get your Publishable Key from{' '}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">
                  Developers → API Keys
                </a>
              </p>
              <p>
                <strong>3.</strong> Start with Test mode to try payments without real charges
              </p>
              <p>
                <strong>4.</strong> Use test card: <code className="bg-blue-500/20 px-1 rounded">4242 4242 4242 4242</code>
              </p>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stripeSettings.stripe_enabled ? 'bg-emerald-500/20' : isDark ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <Zap className={`w-6 h-6 ${stripeSettings.stripe_enabled ? 'text-emerald-400' : tc.textMuted}`} />
                </div>
                <div>
                  <h3 className={`${tc.text} font-semibold`}>Online Card Payments</h3>
                  <p className={`${tc.textMuted} text-sm`}>
                    {stripeSettings.stripe_enabled 
                      ? 'Parents can pay with credit/debit cards'
                      : 'Enable to accept card payments via Stripe'
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
                <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {stripeSettings.stripe_enabled && (
            <>
              {/* Mode Selection */}
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
                <h3 className={`${tc.text} font-semibold mb-4 flex items-center gap-2`}>
                  <Shield className="w-5 h-5" />
                  Environment Mode
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setStripeSettings(prev => ({ ...prev, stripe_mode: 'test' }))}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      stripeSettings.stripe_mode === 'test'
                        ? 'border-amber-500 bg-amber-500/10'
                        : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${stripeSettings.stripe_mode === 'test' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                      <span className={`font-semibold ${tc.text}`}>Test Mode</span>
                    </div>
                    <p className={`text-sm ${tc.textMuted}`}>
                      Use test API keys. No real charges.
                    </p>
                  </button>

                  <button
                    onClick={() => setStripeSettings(prev => ({ ...prev, stripe_mode: 'live' }))}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      stripeSettings.stripe_mode === 'live'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${stripeSettings.stripe_mode === 'live' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      <span className={`font-semibold ${tc.text}`}>Live Mode</span>
                    </div>
                    <p className={`text-sm ${tc.textMuted}`}>
                      Real payments will be processed.
                    </p>
                  </button>
                </div>
                
                {stripeSettings.stripe_mode === 'live' && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-medium text-sm">Live Mode Active</p>
                      <p className="text-amber-400/70 text-sm">
                        Real payments will be charged to parents.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* API Keys */}
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
                <h3 className={`${tc.text} font-semibold mb-4 flex items-center gap-2`}>
                  <Key className="w-5 h-5" />
                  API Keys
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    stripeSettings.stripe_mode === 'test' 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {stripeSettings.stripe_mode === 'test' ? 'Test' : 'Live'}
                  </span>
                </h3>
                
                <p className={`${tc.textMuted} text-sm mb-4`}>
                  Get your API keys from{' '}
                  <a 
                    href={`https://dashboard.stripe.com/${stripeSettings.stripe_mode === 'test' ? 'test/' : ''}apikeys`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Stripe Dashboard → Developers → API Keys
                  </a>
                </p>
                
                <div className="space-y-4">
                  {/* Publishable Key */}
                  <div>
                    <label className={`block text-sm font-medium ${tc.text} mb-2`}>
                      Publishable Key
                      <span className={`${tc.textMuted} font-normal ml-2`}>(starts with pk_)</span>
                    </label>
                    <input
                      type="text"
                      value={stripeSettings.stripe_publishable_key}
                      onChange={e => setStripeSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                      placeholder={`pk_${stripeSettings.stripe_mode}_...`}
                      className={`w-full px-4 py-3 ${tc.input} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm`}
                    />
                  </div>
                  
                  {/* Secret Key - Info Only */}
                  <div className={`p-4 ${tc.cardBgAlt} rounded-lg`}>
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className={`${tc.text} font-medium text-sm`}>Secret Key</p>
                        <p className={`${tc.textMuted} text-sm mt-1`}>
                          Your secret key (sk_...) should be stored securely in your Supabase Edge Function secrets, not here.
                          This will be set up when you deploy the payment processing functions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Test Connection */}
                <div className={`mt-6 pt-4 border-t ${tc.border}`}>
                  <button
                    onClick={testStripeConnection}
                    disabled={testing || !stripeSettings.stripe_publishable_key}
                    className={`px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Validate Key
                      </>
                    )}
                  </button>
                  
                  {testResult && (
                    <div className={`mt-3 p-3 rounded-lg flex items-start gap-3 ${
                      testResult.success 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <p className={testResult.success ? 'text-emerald-400' : 'text-red-400'}>
                        {testResult.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Options */}
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
                <h3 className={`${tc.text} font-semibold mb-4`}>Payment Options</h3>
                
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
                              ? isDark ? 'bg-slate-700 border border-orange-500' : 'bg-white border border-orange-500 shadow-sm'
                              : isDark ? 'bg-slate-700/50 border border-transparent hover:border-slate-600' : 'bg-slate-50 border border-transparent hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="feeMode"
                            value={option.value}
                            checked={stripeSettings.payment_processing_fee_mode === option.value}
                            onChange={e => setStripeSettings(prev => ({ ...prev, payment_processing_fee_mode: e.target.value }))}
                            className="w-4 h-4 text-orange-500"
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
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {!stripeSettings.stripe_enabled && (
            <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-8 text-center`}>
              <CreditCard className={`w-16 h-16 ${tc.textMuted} mx-auto mb-4`} />
              <h3 className={`${tc.text} font-semibold text-lg mb-2`}>Online Payments Disabled</h3>
              <p className={`${tc.textMuted} max-w-md mx-auto`}>
                Enable online payments above to accept credit/debit card payments from parents via Stripe.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { PaymentSetupPage }
