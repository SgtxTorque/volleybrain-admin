import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { 
  FileText, Save, RotateCcw, Eye, Edit3, 
  CheckCircle2, AlertCircle, Loader2, History
} from 'lucide-react'

const WAIVER_TYPES = [
  { 
    id: 'liability', 
    label: 'Liability Waiver', 
    description: 'Release from liability for injuries during activities',
    required: true 
  },
  { 
    id: 'photo', 
    label: 'Photo/Video Release', 
    description: 'Permission to use photos and videos for promotional purposes',
    required: false 
  },
  { 
    id: 'conduct', 
    label: 'Code of Conduct', 
    description: 'Agreement to follow league rules and demonstrate sportsmanship',
    required: true 
  },
]

export default function WaiversPage() {
  const { organization } = useAuth()
  const [waivers, setWaivers] = useState({
    liability: '',
    photo: '',
    conduct: '',
  })
  const [originalWaivers, setOriginalWaivers] = useState({})
  const [selectedWaiver, setSelectedWaiver] = useState('liability')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (organization?.id) {
      loadWaivers()
    }
  }, [organization?.id])

  async function loadWaivers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single()

      if (error) throw error

      const waiverData = data?.settings?.waivers || {}
      setWaivers({
        liability: waiverData.liability || getDefaultWaiver('liability'),
        photo: waiverData.photo || getDefaultWaiver('photo'),
        conduct: waiverData.conduct || getDefaultWaiver('conduct'),
      })
      setOriginalWaivers({
        liability: waiverData.liability || getDefaultWaiver('liability'),
        photo: waiverData.photo || getDefaultWaiver('photo'),
        conduct: waiverData.conduct || getDefaultWaiver('conduct'),
      })
    } catch (err) {
      console.error('Error loading waivers:', err)
    } finally {
      setLoading(false)
    }
  }

  function getDefaultWaiver(type) {
    const orgName = organization?.name || '[ORGANIZATION_NAME]'
    
    switch (type) {
      case 'liability':
        return `I, the undersigned parent/guardian, hereby release and hold harmless ${orgName}, its coaches, volunteers, and staff from any and all liability for injuries that may occur during practices, games, tournaments, or any related activities.

I understand that sports activities involve inherent risks and I accept full responsibility for any injuries sustained by my child while participating in ${orgName} programs.

I confirm that my child is physically able to participate in athletic activities and has no medical conditions that would prevent safe participation, or I have disclosed such conditions to the organization.`

      case 'photo':
        return `I grant permission to ${orgName} to use photographs, videos, and other media featuring my child for promotional purposes including but not limited to:
• Social media posts and stories
• Website content
• Marketing materials and flyers
• News coverage and press releases

I understand that my child's first name may be used alongside these images. I waive any right to compensation for such use.`

      case 'conduct':
        return `I agree that my child and our family will:
• Demonstrate good sportsmanship at all times
• Respect coaches, officials, opponents, and teammates
• Follow all rules and guidelines set by ${orgName}
• Communicate concerns through proper channels
• Support a positive team environment

I understand that violations of this code may result in disciplinary action including suspension or removal from the program.`

      default:
        return ''
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    
    try {
      // Get current settings
      const { data: current } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single()

      // Merge with new waiver data
      const updatedSettings = {
        ...current?.settings,
        waivers: {
          liability: waivers.liability,
          photo: waivers.photo,
          conduct: waivers.conduct,
          updatedAt: new Date().toISOString()
        }
      }

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', organization.id)

      if (error) throw error

      setOriginalWaivers({ ...waivers })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving waivers:', err)
      alert('Failed to save waivers: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (confirm('Reset to default waiver text? Your customizations will be lost.')) {
      setWaivers(prev => ({
        ...prev,
        [selectedWaiver]: getDefaultWaiver(selectedWaiver)
      }))
    }
  }

  const hasChanges = JSON.stringify(waivers) !== JSON.stringify(originalWaivers)
  const currentWaiver = WAIVER_TYPES.find(w => w.id === selectedWaiver)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Waiver Management</h1>
          <p className="text-gray-400 mt-1">Customize the waiver documents parents must sign during registration</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-medium">How Waivers Work</p>
          <p className="text-sm text-gray-400 mt-1">
            These waivers are shown to parents during registration. They must check a box to agree to each one. 
            Required waivers must be accepted to complete registration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Waiver Type Selector */}
        <div className="lg:col-span-1 space-y-2">
          {WAIVER_TYPES.map((waiver) => (
            <button
              key={waiver.id}
              onClick={() => setSelectedWaiver(waiver.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedWaiver === waiver.id
                  ? 'bg-gold/10 border-gold/50'
                  : 'bg-dark-card border-dark-border hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-5 h-5 ${selectedWaiver === waiver.id ? 'text-gold' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-medium ${selectedWaiver === waiver.id ? 'text-white' : 'text-gray-300'}`}>
                    {waiver.label}
                  </p>
                  {waiver.required && (
                    <span className="text-xs text-red-400">Required</span>
                  )}
                </div>
              </div>
              {waivers[waiver.id] !== originalWaivers[waiver.id] && (
                <span className="inline-block mt-2 text-xs text-gold bg-gold/10 px-2 py-0.5 rounded">
                  Modified
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Editor Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-border">
              <div>
                <h3 className="text-lg font-semibold text-white">{currentWaiver?.label}</h3>
                <p className="text-sm text-gray-400">{currentWaiver?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode ? 'bg-gold/20 text-gold' : 'hover:bg-dark-hover text-gray-400'
                  }`}
                  title={previewMode ? 'Edit mode' : 'Preview mode'}
                >
                  {previewMode ? <Edit3 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg hover:bg-dark-hover text-gray-400 transition-colors"
                  title="Reset to default"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor/Preview */}
            {previewMode ? (
              <div className="bg-dark rounded-xl p-6 min-h-[400px]">
                <div className="prose prose-invert max-w-none">
                  <h4 className="text-lg font-semibold text-white mb-4">{currentWaiver?.label}</h4>
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {waivers[selectedWaiver]}
                  </div>
                  <div className="mt-6 pt-4 border-t border-dark-border">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1" disabled />
                      <span className="text-sm text-gray-400">
                        I have read and agree to the {currentWaiver?.label}
                        {currentWaiver?.required && <span className="text-red-400"> *</span>}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <textarea
                value={waivers[selectedWaiver]}
                onChange={(e) => setWaivers(prev => ({ ...prev, [selectedWaiver]: e.target.value }))}
                className="textarea min-h-[400px] font-mono text-sm leading-relaxed"
                placeholder={`Enter your ${currentWaiver?.label.toLowerCase()} text here...`}
              />
            )}

            {/* Character Count */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{waivers[selectedWaiver].length} characters</span>
              <span>{waivers[selectedWaiver].split('\n').length} lines</span>
            </div>
          </div>

          {/* Tips */}
          <div className="card mt-6 bg-dark-card/50">
            <h4 className="font-medium text-white mb-3">💡 Tips for Effective Waivers</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Use clear, simple language that parents can easily understand</li>
              <li>• Be specific about what activities are covered</li>
              <li>• Include all relevant contact information and policies</li>
              <li>• Consult with a legal professional for liability waivers</li>
              <li>• Update waivers at the start of each season if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
