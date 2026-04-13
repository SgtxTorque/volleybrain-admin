// =============================================================================
// RegistrationSetupModal — Lifecycle Tracker Step 2
// Shows when admin clicks "Set Up Registration" in the tracker.
// Saves registration config (template, dates, capacity) to the season record.
// =============================================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, ChevronDown, ChevronRight } from '../../constants/icons'

export default function RegistrationSetupModal({
  isOpen,
  onClose,
  seasonId,
  seasonName,
  organizationId,
  onComplete,
}) {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [registrationOpens, setRegistrationOpens] = useState('')
  const [registrationCloses, setRegistrationCloses] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState('')
  const [earlyBirdDiscount, setEarlyBirdDiscount] = useState('')
  const [lateRegDeadline, setLateRegDeadline] = useState('')
  const [lateRegFee, setLateRegFee] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [waitlistEnabled, setWaitlistEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  // Theme helpers
  const cardBg = isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-slate-200'
  const textPrimary = isDark ? 'text-white' : 'text-[#10284C]'
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500'
    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'

  useEffect(() => {
    if (!isOpen || !organizationId) return
    loadTemplates()
  }, [isOpen, organizationId])

  async function loadTemplates() {
    const { data } = await supabase
      .from('registration_templates')
      .select('id, name, is_default')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    setTemplates(data || [])
    const defaultTpl = (data || []).find(t => t.is_default)
    if (defaultTpl) setSelectedTemplateId(defaultTpl.id)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updateData = {
        registration_template_id: selectedTemplateId || null,
        registration_opens: registrationOpens || null,
        registration_closes: registrationCloses || null,
        registration_open: true,
      }
      if (earlyBirdDeadline) updateData.early_bird_deadline = earlyBirdDeadline
      if (earlyBirdDiscount) updateData.early_bird_discount = parseFloat(earlyBirdDiscount)
      if (lateRegDeadline) updateData.late_registration_deadline = lateRegDeadline
      if (lateRegFee) updateData.late_registration_fee = parseFloat(lateRegFee)
      if (maxPlayers) updateData.max_players = parseInt(maxPlayers)
      updateData.waitlist_enabled = waitlistEnabled

      const { error } = await supabase
        .from('seasons')
        .update(updateData)
        .eq('id', seasonId)

      if (error) throw error
      onComplete?.()
      onClose()
    } catch (err) {
      console.error('Registration setup save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleCreateCustomForm() {
    const returnUrl = encodeURIComponent(window.location.pathname + '?tab=setup')
    navigate(`/settings/templates?from=registration-setup&season=${seasonId}&returnTo=${returnUrl}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className={`${cardBg} border rounded-[14px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${textPrimary}`}>Set Up Registration</h2>
            <p className={`text-sm ${textMuted} mt-0.5`}>for {seasonName || 'this season'}</p>
          </div>
          <button onClick={onClose} className={`${textMuted} hover:${textPrimary}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
          {/* Warning if no templates */}
          {templates.length === 0 && (
            <div className={`flex items-start gap-3 p-3 rounded-[14px] ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <span className="text-lg shrink-0">⚠️</span>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>No registration forms configured yet</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>You can use the Lynx default form or create a custom one.</p>
              </div>
            </div>
          )}

          {/* Template Dropdown */}
          <div>
            <label className={`block text-sm font-semibold ${textPrimary} mb-1`}>Registration Form Template</label>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className={`w-full border rounded-[14px] px-3 py-2.5 text-sm focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC] outline-none ${inputCls}`}
            >
              <option value="">Lynx Default Form</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.is_default ? ' (org default)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Default form preview */}
          {!selectedTemplateId && (
            <div className={`p-3 rounded-[14px] text-xs ${isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
              <p className={`font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Default form collects:</p>
              <p>Player info (name, DOB, gender, grade, jersey size), parent contact, emergency contact, medical info, and waivers.</p>
            </div>
          )}

          {/* Create Custom Form CTA */}
          <button
            onClick={handleCreateCustomForm}
            className="w-full py-2.5 border-2 border-dashed border-[#4BB9EC] text-[#4BB9EC] font-semibold text-sm rounded-[14px] hover:bg-[#4BB9EC]/10 transition-colors"
          >
            Create Custom Registration Form
          </button>

          {/* Registration Dates */}
          <div className={`border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>Registration Dates</h3>
            <p className={`text-xs ${textMuted} mb-3`}>Set when families can register. Leave blank to use season status instead.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs ${textMuted} mb-1`}>Registration Opens</label>
                <input
                  type="date"
                  value={registrationOpens}
                  onChange={e => setRegistrationOpens(e.target.value)}
                  className={`w-full border rounded-[10px] px-3 py-2 text-sm ${inputCls}`}
                />
              </div>
              <div>
                <label className={`block text-xs ${textMuted} mb-1`}>Registration Closes</label>
                <input
                  type="date"
                  value={registrationCloses}
                  onChange={e => setRegistrationCloses(e.target.value)}
                  className={`w-full border rounded-[10px] px-3 py-2 text-sm ${inputCls}`}
                />
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 text-xs font-medium text-[#4BB9EC] hover:underline`}
          >
            {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {showAdvanced ? 'Hide advanced options' : 'Early bird, late fees, capacity...'}
          </button>

          {showAdvanced && (
            <div className={`space-y-4 border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
              {/* Early Bird */}
              <div>
                <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Early Bird</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs ${textMuted} mb-1`}>Deadline</label>
                    <input type="date" value={earlyBirdDeadline} onChange={e => setEarlyBirdDeadline(e.target.value)} className={`w-full border rounded-[10px] px-3 py-2 text-sm ${inputCls}`} />
                  </div>
                  <div>
                    <label className={`block text-xs ${textMuted} mb-1`}>Discount ($)</label>
                    <input type="number" value={earlyBirdDiscount} onChange={e => setEarlyBirdDiscount(e.target.value)} className={`w-full border rounded-[10px] px-3 py-2 text-sm ${inputCls}`} placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Late Registration */}
              <div className={`border-t pt-3 ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Late Registration</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs ${textMuted} mb-1`}>Starts</label>
                    <input type="date" value={lateRegDeadline} onChange={e => setLateRegDeadline(e.target.value)} className={`w-full border rounded-[10px] px-3 py-2 text-sm ${inputCls}`} />
                  </div>
                  <div>
                    <label className={`block text-xs ${textMuted} mb-1`}>Late Fee ($)</label>
                    <input type="number" value={lateRegFee} onChange={e => setLateRegFee(e.target.value)} className={`w-full border rounded-[10px] px-3 py-2 text-sm ${inputCls}`} placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className={`border-t pt-3 ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Capacity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs ${textMuted} mb-1`}>Max Players</label>
                    <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} className={`w-full border rounded-[10px] px-3 py-2 text-sm ${inputCls}`} placeholder="Unlimited" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input type="checkbox" checked={waitlistEnabled} onChange={e => setWaitlistEnabled(e.target.checked)} className="rounded" />
                    <label className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Enable waitlist</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} flex items-center justify-between`}>
          <button onClick={onClose} className={`text-sm ${textMuted} hover:${textPrimary}`}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#10284C] text-white font-semibold text-sm rounded-[14px] hover:bg-[#1a3a5c] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
