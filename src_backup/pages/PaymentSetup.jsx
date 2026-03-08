import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { 
  CreditCard, Link, CheckCircle2, AlertCircle, 
  ExternalLink, Loader2, Shield, DollarSign,
  Zap, ArrowRight, Copy, Check
} from 'lucide-react'

export default function PaymentSetupPage() {
  const { organization } = useAuth()
  const [settings, setSettings] = useState({
    stripeConnected: false,
    stripeAccountId: '',
    venmoHandle: '',
    zelleEmail: '',
    cashappHandle: '',
    acceptOnlinePayments: false,
    acceptManualPayments: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (organization?.id) {
      loadSettings()
    }
  }, [organization?.id])

  async function loadSettings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single()

      if (error) throw error

      const paymentSettings = data?.settings?.payments || {}
      setSettings(prev => ({
        ...prev,
        ...paymentSettings,
        stripeConnected: !!paymentSettings.stripeAccountId,
      }))
    } catch (err) {
      console.error('Error loading payment settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: current } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single()

      const updatedSettings = {
        ...current?.settings,
        payments: {
          stripeAccountId: settings.stripeAccountId,
          venmoHandle: settings.venmoHandle,
          zelleEmail: settings.zelleEmail,
          cashappHandle: settings.cashappHandle,
          acceptOnlinePayments: settings.acceptOnlinePayments,
          acceptManualPayments: settings.acceptManualPayments,
          updatedAt: new Date().toISOString()
        }
      }

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', organization.id)

      if (error) throw error
      
      alert('Payment settings saved!')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleCopy(text, field) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  async function handleConnectStripe() {
    // In production, this would redirect to Stripe Connect OAuth
    // For now, we'll show instructions
    alert('Stripe Connect integration coming soon! For now, use manual payment methods.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Payment Setup</h1>
        <p className="text-gray-400 mt-1">Configure how you collect payments from families</p>
      </div>

      {/* Stripe Connect Section */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <CreditCard className="w-8 h-8 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">Online Payments with Stripe</h2>
            <p className="text-gray-400 mt-1">
              Accept credit cards, debit cards, and bank transfers directly through the app
            </p>
          </div>
        </div>

        {settings.stripeConnected ? (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Stripe Connected</p>
                <p className="text-sm text-gray-400">Account ID: {settings.stripeAccountId}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-dark rounded-xl border border-dark-border">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Why Connect Stripe?</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-400">
                    <li>• Parents can pay instantly during registration</li>
                    <li>• Automatic payment tracking in your dashboard</li>
                    <li>• Accept all major credit/debit cards</li>
                    <li>• Funds deposited directly to your bank account</li>
                    <li>• Secure, PCI-compliant payment processing</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnectStripe}
              className="btn-primary flex items-center gap-2"
            >
              <Link className="w-5 h-5" />
              Connect Stripe Account
              <ExternalLink className="w-4 h-4" />
            </button>

            <p className="text-xs text-gray-500">
              Don't have a Stripe account? You'll be able to create one during the connection process.
            </p>
          </div>
        )}

        {/* Stripe Fees Info */}
        <div className="mt-6 p-4 bg-dark rounded-xl">
          <h4 className="text-sm font-medium text-white mb-2">Stripe Processing Fees</h4>
          <p className="text-sm text-gray-400">
            Stripe charges 2.9% + $0.30 per transaction. For a $150 registration fee, 
            the processing fee would be approximately $4.65.
          </p>
        </div>
      </div>

      {/* Manual Payment Methods */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Manual Payment Methods</h2>
        <p className="text-gray-400 mb-6">
          Allow families to pay via Venmo, Zelle, or Cash App. You'll need to manually mark payments as received.
        </p>

        <div className="space-y-4">
          {/* Venmo */}
          <div className="p-4 bg-dark rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#3D95CE]/20 flex items-center justify-center">
                <span className="text-lg">V</span>
              </div>
              <div>
                <p className="font-medium text-white">Venmo</p>
                <p className="text-xs text-gray-500">@username format</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.venmoHandle}
                onChange={(e) => setSettings(prev => ({ ...prev, venmoHandle: e.target.value }))}
                className="input flex-1"
                placeholder="@YourVenmo"
              />
              {settings.venmoHandle && (
                <button
                  onClick={() => handleCopy(settings.venmoHandle, 'venmo')}
                  className="btn-secondary px-3"
                >
                  {copied === 'venmo' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {/* Zelle */}
          <div className="p-4 bg-dark rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#6D1ED4]/20 flex items-center justify-center">
                <span className="text-lg">Z</span>
              </div>
              <div>
                <p className="font-medium text-white">Zelle</p>
                <p className="text-xs text-gray-500">Email or phone number</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.zelleEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, zelleEmail: e.target.value }))}
                className="input flex-1"
                placeholder="payments@yourleague.com"
              />
              {settings.zelleEmail && (
                <button
                  onClick={() => handleCopy(settings.zelleEmail, 'zelle')}
                  className="btn-secondary px-3"
                >
                  {copied === 'zelle' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {/* Cash App */}
          <div className="p-4 bg-dark rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#00D632]/20 flex items-center justify-center">
                <span className="text-lg">$</span>
              </div>
              <div>
                <p className="font-medium text-white">Cash App</p>
                <p className="text-xs text-gray-500">$cashtag format</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.cashappHandle}
                onChange={(e) => setSettings(prev => ({ ...prev, cashappHandle: e.target.value }))}
                className="input flex-1"
                placeholder="$YourCashApp"
              />
              {settings.cashappHandle && (
                <button
                  onClick={() => handleCopy(settings.cashappHandle, 'cashapp')}
                  className="btn-secondary px-3"
                >
                  {copied === 'cashapp' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Payment Options</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-dark rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-medium text-white">Accept Online Payments</p>
                <p className="text-sm text-gray-400">Allow parents to pay with card during registration</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.acceptOnlinePayments}
              onChange={(e) => setSettings(prev => ({ ...prev, acceptOnlinePayments: e.target.checked }))}
              className="w-5 h-5 rounded bg-dark-border text-gold focus:ring-gold"
              disabled={!settings.stripeConnected}
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-dark rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-white">Accept Manual Payments</p>
                <p className="text-sm text-gray-400">Show Venmo, Zelle, Cash App options during registration</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.acceptManualPayments}
              onChange={(e) => setSettings(prev => ({ ...prev, acceptManualPayments: e.target.checked }))}
              className="w-5 h-5 rounded bg-dark-border text-gold focus:ring-gold"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save Payment Settings
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="card bg-dark-card/50">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Payment Security</p>
            <p className="text-sm text-gray-400 mt-1">
              When using Stripe, all payment information is processed securely and never stored on our servers. 
              For manual payments, always verify the payment was received before marking it as paid.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
