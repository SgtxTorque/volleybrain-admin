import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'

// ============================================
// SAVE TEMPLATE MODAL
// ============================================
function SaveTemplateModal({ team, formation, lineup, liberoId, formations, sport, userId, isDark, tc, showToast, onClose }) {
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      // If setting as default, unset existing defaults for this team
      if (isDefault) {
        await supabase.from('lineup_templates')
          .update({ is_default: false })
          .eq('team_id', team.id)
          .eq('is_default', true)
      }

      const positionData = Object.entries(lineup).map(([posId, playerId]) => ({
        position_id: parseInt(posId),
        player_id: playerId,
        role: formations[formation]?.positions?.find(p => p.id === parseInt(posId))?.role
      }))

      const { error } = await supabase.from('lineup_templates').insert({
        team_id: team.id,
        organization_id: team.organization_id || null,
        name: name.trim(),
        formation_type: formation,
        sport: sport,
        positions: positionData,
        libero_id: liberoId,
        is_default: isDefault,
        created_by: userId,
      })

      if (error) throw error
      showToast?.(`Template "${name}" saved!`, 'success')
      onClose()
    } catch (err) {
      console.error('Error saving template:', err)
      showToast?.('Error saving template', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className={`w-80 rounded-2xl p-5 shadow-xl ${isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'}`}
        onClick={e => e.stopPropagation()}
      >
        <h3 className={`text-sm font-bold ${tc.text} mb-3`}>Save as Template</h3>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Template name..."
          autoFocus
          className={`w-full px-3 py-2 rounded-lg text-sm mb-3 border outline-none focus:ring-1 focus:ring-[var(--accent-primary)] ${
            isDark ? 'bg-lynx-graphite border-lynx-border-dark text-white placeholder:text-slate-500' : 'bg-lynx-frost border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'
          }`}
        />
        <label className={`flex items-center gap-2 text-xs ${tc.textSecondary} mb-4 cursor-pointer`}>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={e => setIsDefault(e.target.checked)}
            className="rounded"
          />
          Set as default for this team
        </label>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
              isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// LOAD TEMPLATE DROPDOWN
// ============================================
function LoadTemplateDropdown({ team, roster, formations, isDark, tc, showToast, onApply, onClose }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('lineup_templates')
        .select('*')
        .eq('team_id', team.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      setTemplates(data || [])
    } catch (err) {
      console.error('Error loading templates:', err)
    }
    setLoading(false)
  }

  function handleSelect(template) {
    const newLineup = {}
    const rosterIds = new Set(roster.map(p => p.id))
    const skipped = []

    template.positions?.forEach(pos => {
      if (rosterIds.has(pos.player_id)) {
        newLineup[pos.position_id] = pos.player_id
      } else {
        skipped.push(pos.position_id)
      }
    })

    if (skipped.length > 0) {
      showToast?.(`Template loaded. ${skipped.length} player(s) no longer on roster — skipped.`, 'warning')
    } else {
      showToast?.(`Template "${template.name}" loaded!`, 'success')
    }

    onApply({
      lineup: newLineup,
      formation: template.formation_type,
      liberoId: rosterIds.has(template.libero_id) ? template.libero_id : null,
    })
    onClose()
  }

  async function handleDelete(e, templateId) {
    e.stopPropagation()
    try {
      await supabase.from('lineup_templates').delete().eq('id', templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      showToast?.('Template deleted', 'success')
    } catch (err) {
      showToast?.('Error deleting template', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className={`w-80 rounded-2xl p-4 shadow-xl max-h-96 flex flex-col ${isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'}`}
        onClick={e => e.stopPropagation()}
      >
        <h3 className={`text-sm font-bold ${tc.text} mb-3`}>Load Template</h3>

        {loading ? (
          <div className={`text-xs ${tc.textMuted} text-center py-6`}>Loading...</div>
        ) : templates.length === 0 ? (
          <div className={`text-xs ${tc.textMuted} text-center py-6`}>
            No templates saved yet.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-colors ${
                  isDark ? 'hover:bg-lynx-graphite' : 'hover:bg-lynx-frost'
                } border ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${tc.text} flex items-center gap-1`}>
                    {t.name}
                    {t.is_default && (
                      <span className="text-[9px] px-1.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">DEFAULT</span>
                    )}
                  </div>
                  <div className={`text-[10px] ${tc.textMuted}`}>
                    {t.formation_type} · {t.positions?.length || 0} players
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, t.id)}
                  className="text-red-400 hover:text-red-300 text-xs px-1"
                >
                  ×
                </button>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className={`mt-3 w-full py-2 rounded-lg text-xs font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ============================================
// TEMPLATE MANAGER (hooks for auto-loading)
// ============================================
export function useTemplateAutoLoad({ team, roster, formations, lineup, setLineup, setFormation, setLiberoId, setSetLineups, showToast }) {
  const [autoLoaded, setAutoLoaded] = useState(false)

  useEffect(() => {
    if (autoLoaded || !team?.id || Object.keys(lineup).length > 0 || roster.length === 0) return
    loadDefaultTemplate()
  }, [team?.id, roster.length])

  async function loadDefaultTemplate() {
    try {
      const { data } = await supabase
        .from('lineup_templates')
        .select('*')
        .eq('team_id', team.id)
        .eq('is_default', true)
        .limit(1)
        .single()

      if (!data) return

      const rosterIds = new Set(roster.map(p => p.id))
      const newLineup = {}
      data.positions?.forEach(pos => {
        if (rosterIds.has(pos.player_id)) {
          newLineup[pos.position_id] = pos.player_id
        }
      })

      if (Object.keys(newLineup).length > 0) {
        if (data.formation_type && formations[data.formation_type]) {
          setFormation(data.formation_type)
        }
        setLineup(newLineup)
        setSetLineups(prev => ({ ...prev, 1: newLineup }))
        if (data.libero_id && rosterIds.has(data.libero_id)) {
          setLiberoId(data.libero_id)
        }
        showToast?.(`Loaded default template: ${data.name}`, 'success')
      }
    } catch {
      // No default template — that's fine
    }
    setAutoLoaded(true)
  }
}

export { SaveTemplateModal, LoadTemplateDropdown }
