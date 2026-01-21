import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

function WaiversPage({ showToast }) {
  const { organization, setOrganization } = useAuth()
  const [waivers, setWaivers] = useState({ liability: '', photo: '', conduct: '' })
  const [selectedWaiver, setSelectedWaiver] = useState('liability')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (organization?.settings?.waivers) setWaivers(organization.settings.waivers)
  }, [organization])

  async function handleSave() {
    setSaving(true)
    const newSettings = { ...organization.settings, waivers }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setOrganization({ ...organization, settings: newSettings })
    showToast('Waivers saved!', 'success')
    setSaving(false)
  }

  const waiverTypes = [
    { id: 'liability', label: 'Liability Waiver', icon: '⚠️' },
    { id: 'photo', label: 'Photo/Video Release', icon: '📷' },
    { id: 'conduct', label: 'Code of Conduct', icon: '📋' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Waiver Management</h1>
          <p className="text-slate-400 mt-1">Edit waivers shown during registration</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[var(--accent-primary)] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50">
          {saving ? 'Saving...' : '💾 Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          {waiverTypes.map(w => (
            <button key={w.id} onClick={() => setSelectedWaiver(w.id)}
              className={`w-full text-left p-4 rounded-xl border transition ${selectedWaiver === w.id ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-xl mr-2">{w.icon}</span>
              <span className={selectedWaiver === w.id ? 'text-white' : 'text-slate-400'}>{w.label}</span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{waiverTypes.find(w => w.id === selectedWaiver)?.label}</h3>
          <textarea value={waivers[selectedWaiver] || ''} onChange={e => setWaivers({...waivers, [selectedWaiver]: e.target.value})}
            className="w-full min-h-[300px] bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white resize-y"
            placeholder="Enter waiver text..." />
        </div>
      </div>
    </div>
  )
}

export { WaiversPage }
