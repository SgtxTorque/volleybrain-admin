import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

function PaymentSetupPage({ showToast }) {
  const { organization, setOrganization } = useAuth()
  const [settings, setSettings] = useState({ venmoHandle: '', zelleEmail: '', cashappHandle: '', acceptManualPayments: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (organization?.settings?.payments) setSettings({ ...settings, ...organization.settings.payments })
  }, [organization])

  async function handleSave() {
    setSaving(true)
    const newSettings = { ...organization.settings, payments: settings }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setOrganization({ ...organization, settings: newSettings })
    showToast('Payment settings saved!', 'success')
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Setup</h1>
          <p className="text-slate-400 mt-1">Configure payment methods</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[var(--accent-primary)] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50">
          {saving ? 'Saving...' : '💾 Save'}
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Manual Payment Methods</h2>
        {[
          { key: 'venmoHandle', label: 'Venmo', placeholder: '@YourVenmo', color: '#3D95CE' },
          { key: 'zelleEmail', label: 'Zelle', placeholder: 'email@example.com', color: '#6D1ED4' },
          { key: 'cashappHandle', label: 'Cash App', placeholder: '$YourCashApp', color: '#00D632' },
        ].map(p => (
          <div key={p.key} className="p-4 bg-slate-900 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: p.color + '30', color: p.color }}>
                {p.label[0]}
              </div>
              <span className="text-white font-medium">{p.label}</span>
            </div>
            <input type="text" value={settings[p.key]} onChange={e => setSettings({...settings, [p.key]: e.target.value})} placeholder={p.placeholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-white">Accept Manual Payments</p>
            <p className="text-sm text-slate-400">Show these options during registration</p>
          </div>
          <input type="checkbox" checked={settings.acceptManualPayments} onChange={e => setSettings({...settings, acceptManualPayments: e.target.checked})}
            className="w-6 h-6 rounded" />
        </label>
      </div>
    </div>
  )
}

export { PaymentSetupPage }
