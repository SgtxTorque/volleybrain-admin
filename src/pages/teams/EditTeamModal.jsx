// =============================================================================
// EditTeamModal — 4-tab team editing form (Basic, Classification, Roster, Settings)
// Mirrors NewTeamModal structure with pre-populated fields from team prop
// =============================================================================

import { useState, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Upload } from 'lucide-react'
import TeamLogo from '../../components/TeamLogo'

export default function EditTeamModal({ team, onClose, onSave, showToast }) {
  const { isDark } = useTheme()
  const [form, setForm] = useState({
    name: team.name || '',
    abbreviation: team.abbreviation || '',
    color: team.color || '#FFD700',
    age_group: team.age_group || '',
    age_group_type: team.age_group_type || 'age',
    team_type: team.team_type || 'recreational',
    skill_level: team.skill_level || 'all',
    gender: team.gender || 'coed',
    max_roster_size: team.max_roster_size ?? 12,
    min_roster_size: team.min_roster_size ?? 6,
    roster_open: team.roster_open ?? true,
    description: team.description || '',
    internal_notes: team.internal_notes || ''
  })
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const logoInputRef = useRef(null)

  const ageOptions = [
    '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '17U', '18U', 'Adult'
  ]

  const gradeOptions = [
    { value: '3rd', label: '3rd Grade' },
    { value: '4th', label: '4th Grade' },
    { value: '5th', label: '5th Grade' },
    { value: '6th', label: '6th Grade' },
    { value: '7th', label: '7th Grade' },
    { value: '8th', label: '8th Grade' },
    { value: '9th', label: '9th Grade (Freshman)' },
    { value: '10th', label: '10th Grade (Sophomore)' },
    { value: '11th', label: '11th Grade (Junior)' },
    { value: '12th', label: '12th Grade (Senior)' },
  ]

  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast?.('Logo must be under 2MB', 'error')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setRemoveLogo(false)
  }

  async function handleSave() {
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      let logoUrl = undefined // undefined = don't change

      // Upload new logo if selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `team-logo-${Date.now()}.${fileExt}`
        const { data, error: uploadErr } = await supabase.storage.from('team-assets').upload(fileName, logoFile)
        if (uploadErr) {
          // Fallback to data URI
          const reader = new FileReader()
          logoUrl = await new Promise((resolve) => {
            reader.onload = (ev) => resolve(ev.target.result)
            reader.readAsDataURL(logoFile)
          })
        } else {
          const { data: { publicUrl } } = supabase.storage.from('team-assets').getPublicUrl(fileName)
          logoUrl = publicUrl
        }
      } else if (removeLogo) {
        logoUrl = null
      }

      const updatePayload = {
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim(),
        color: form.color,
        age_group: form.age_group,
        age_group_type: form.age_group_type,
        team_type: form.team_type,
        skill_level: form.skill_level,
        gender: form.gender,
        max_roster_size: form.max_roster_size,
        min_roster_size: form.min_roster_size,
        roster_open: form.roster_open,
        description: form.description.trim(),
        internal_notes: form.internal_notes.trim()
      }

      if (logoUrl !== undefined) {
        updatePayload.logo_url = logoUrl
      }

      const { error } = await supabase
        .from('teams')
        .update(updatePayload)
        .eq('id', team.id)

      if (error) throw error

      showToast?.('Team settings saved successfully', 'success')
      onSave?.()
    } catch (err) {
      console.error('Error updating team:', err)
      showToast?.('Failed to save team settings', 'error')
    }
    setSaving(false)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '🏐' },
    { id: 'classification', label: 'Classification', icon: '📋' },
    { id: 'roster', label: 'Roster', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const isValid = form.name.trim()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex items-center justify-between`}>
          <h2 className={`text-r-xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Edit Team Settings</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-lynx-frost text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-r-sm font-medium transition ${
                activeTab === tab.id
                  ? `${isDark ? 'text-white' : 'text-lynx-navy'} border-b-2 border-lynx-sky`
                  : `${isDark ? 'text-slate-500' : 'text-slate-400'} ${isDark ? 'hover:text-slate-300' : 'hover:text-slate-500'}`
              }`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Team Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Varsity Elite"
                  className={`w-full rounded-[14px] px-4 py-3 text-r-base ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-lynx-silver text-lynx-navy'}`}
                />
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Abbreviation</label>
                <input
                  type="text"
                  value={form.abbreviation}
                  onChange={e => setForm({...form, abbreviation: e.target.value.toUpperCase().slice(0, 5)})}
                  placeholder="e.g., BHE"
                  maxLength={5}
                  className={`w-full rounded-[14px] px-4 py-3 text-r-base uppercase ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-lynx-silver text-lynx-navy'}`}
                />
                <p className={`text-r-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Short code for scoreboards & schedules (max 5 chars)</p>
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Team Color</label>
                <div className="flex gap-3">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white/20 cursor-pointer overflow-hidden"
                    style={{ backgroundColor: form.color }}
                  >
                    <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full h-full cursor-pointer opacity-0" />
                  </div>
                  <input
                    type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                    className={`flex-1 rounded-[14px] px-4 py-3 text-r-base font-mono ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-lynx-silver text-lynx-navy'}`}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'].map(c => (
                    <button key={c} onClick={() => setForm({...form, color: c})}
                      className={`w-8 h-8 rounded-lg border-2 transition ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Team Logo</label>
                <div className="flex items-center gap-4">
                  <TeamLogo
                    team={{
                      logo_url: removeLogo ? null : (logoPreview || team.logo_url),
                      color: form.color,
                      name: form.name,
                      abbreviation: form.abbreviation
                    }}
                    size={64}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleLogoSelect}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-medium transition ${
                        isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.08]' : 'bg-slate-100 text-lynx-navy hover:bg-lynx-frost'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {team.logo_url && !removeLogo ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {(team.logo_url || logoFile) && !removeLogo && (
                      <button
                        type="button"
                        onClick={() => { setRemoveLogo(true); setLogoFile(null); setLogoPreview(null) }}
                        className="text-r-xs text-red-500 hover:text-red-400 text-left"
                      >
                        Remove Logo
                      </button>
                    )}
                    {removeLogo && (
                      <button
                        type="button"
                        onClick={() => setRemoveLogo(false)}
                        className="text-r-xs text-lynx-sky hover:text-lynx-sky/80 text-left"
                      >
                        Undo Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-r-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PNG, JPG, or WebP. Max 2MB.</p>
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Description</label>
                <textarea
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Team bio, goals, or info for parents..."
                  rows={3}
                  className={`w-full rounded-[14px] px-4 py-3 text-r-base resize-none ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-lynx-silver text-lynx-navy'}`}
                />
              </div>
            </div>
          )}

          {/* Classification Tab */}
          {activeTab === 'classification' && (
            <div className="space-y-5">
              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Division Type *</label>
                <div className="flex gap-2">
                  {[{ v: 'age', l: 'By Age (8U, 10U, etc.)' }, { v: 'grade', l: 'By Grade Level' }].map(d => (
                    <button key={d.v}
                      onClick={() => setForm({...form, age_group_type: d.v, age_group: ''})}
                      className={`flex-1 px-4 py-3 rounded-[14px] text-r-sm font-medium transition ${
                        form.age_group_type === d.v ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-50 text-lynx-navy'
                      }`}
                    >{d.l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>
                  {form.age_group_type === 'age' ? 'Age Group *' : 'Grade Level *'}
                </label>
                {form.age_group_type === 'age' ? (
                  <div className="grid grid-cols-4 gap-2">
                    {ageOptions.map(age => (
                      <button key={age} onClick={() => setForm({...form, age_group: age})}
                        className={`px-4 py-3 rounded-[14px] text-r-sm font-medium transition ${
                          form.age_group === age ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.08]' : 'bg-slate-50 text-lynx-navy hover:bg-lynx-frost'
                        }`}>{age}</button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {gradeOptions.map(grade => (
                      <button key={grade.value} onClick={() => setForm({...form, age_group: grade.value})}
                        className={`px-3 py-2 rounded-[14px] text-r-xs font-medium transition ${
                          form.age_group === grade.value ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.08]' : 'bg-slate-50 text-lynx-navy hover:bg-lynx-frost'
                        }`}>{grade.label}</button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Team Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 'recreational', e: '🎉', l: 'Recreational', d: 'Fun, learning & development' }, { v: 'competitive', e: '🏆', l: 'Competitive', d: 'Travel, tournaments & leagues' }].map(t => (
                    <button key={t.v} onClick={() => setForm({...form, team_type: t.v})}
                      className={`p-4 rounded-[14px] border-2 transition text-left ${
                        form.team_type === t.v ? 'border-lynx-sky bg-lynx-sky/10' : `border-transparent ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`
                      }`}>
                      <span className="text-4xl">{t.e}</span>
                      <p className={`font-semibold mt-2 text-r-sm ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{t.l}</p>
                      <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Gender</label>
                <div className="flex gap-2">
                  {[{ value: 'girls', label: '♀ Girls' }, { value: 'boys', label: '♂ Boys' }, { value: 'coed', label: '👫 Coed' }].map(g => (
                    <button key={g.value} onClick={() => setForm({...form, gender: g.value})}
                      className={`flex-1 px-4 py-3 rounded-[14px] text-r-sm font-medium transition ${
                        form.gender === g.value ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-50 text-lynx-navy'
                      }`}>{g.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Skill Level</label>
                <div className="flex gap-2">
                  {[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }, { value: 'all', label: 'All Levels' }].map(s => (
                    <button key={s.value} onClick={() => setForm({...form, skill_level: s.value})}
                      className={`flex-1 px-3 py-2 rounded-[14px] text-r-xs font-medium transition ${
                        form.skill_level === s.value ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-50 text-lynx-navy'
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Roster Tab */}
          {activeTab === 'roster' && (
            <div className="space-y-5">
              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>
                  Maximum Roster Size: <span className="text-lynx-sky font-bold text-r-lg">{form.max_roster_size}</span>
                </label>
                <input type="range" min="6" max="16" value={form.max_roster_size}
                  onChange={e => setForm({...form, max_roster_size: parseInt(e.target.value)})}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-lynx-sky"
                  style={{ background: `linear-gradient(to right, #4BB9EC 0%, #4BB9EC ${((form.max_roster_size - 6) / 10) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} ${((form.max_roster_size - 6) / 10) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} 100%)` }}
                />
                <div className={`flex justify-between text-r-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>6</span><span>10</span><span className="font-medium">12 (default)</span><span>14</span><span>16</span>
                </div>
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>
                  Minimum Roster Size: <span className="text-lynx-sky font-bold text-r-lg">{form.min_roster_size}</span>
                </label>
                <input type="range" min="4" max={form.max_roster_size} value={form.min_roster_size}
                  onChange={e => setForm({...form, min_roster_size: parseInt(e.target.value)})}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-lynx-sky"
                  style={{ background: `linear-gradient(to right, #4BB9EC 0%, #4BB9EC ${((form.min_roster_size - 4) / (form.max_roster_size - 4)) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} ${((form.min_roster_size - 4) / (form.max_roster_size - 4)) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} 100%)` }}
                />
                <p className={`text-r-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Minimum players needed to field a team</p>
              </div>

              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Roster Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setForm({...form, roster_open: true})}
                    className={`p-4 rounded-[14px] border-2 transition text-left ${form.roster_open ? 'border-emerald-500 bg-emerald-500/10' : `border-transparent ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}`}>
                    <span className="text-3xl">🟢</span>
                    <p className={`font-semibold mt-2 text-r-sm ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Open</p>
                    <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Accepting new players</p>
                  </button>
                  <button onClick={() => setForm({...form, roster_open: false})}
                    className={`p-4 rounded-[14px] border-2 transition text-left ${!form.roster_open ? 'border-red-500 bg-red-500/10' : `border-transparent ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}`}>
                    <span className="text-3xl">🔴</span>
                    <p className={`font-semibold mt-2 text-r-sm ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Closed</p>
                    <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Roster is full/locked</p>
                  </button>
                </div>
              </div>

              <div className={`rounded-[14px] p-4 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}>
                <p className={`text-r-xs mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Roster Preview</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(form.max_roster_size, 8) }).map((_, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-r-xs ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-slate-500' : 'bg-white border-lynx-silver text-slate-400'}`}>{i + 1}</div>
                    ))}
                    {form.max_roster_size > 8 && (
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-r-xs ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-slate-500' : 'bg-white border-lynx-silver text-slate-400'}`}>+{form.max_roster_size - 8}</div>
                    )}
                  </div>
                  <span className={`text-r-sm ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{form.min_roster_size} - {form.max_roster_size} players</span>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <label className={`block text-r-sm font-medium ${isDark ? 'text-white' : 'text-lynx-navy'} mb-2`}>Internal Notes (Admin Only)</label>
                <textarea value={form.internal_notes} onChange={e => setForm({...form, internal_notes: e.target.value})}
                  placeholder="Notes for coaches/admins only (not visible to parents)..."
                  rows={4}
                  className={`w-full rounded-[14px] px-4 py-3 text-r-base resize-none ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-lynx-silver text-lynx-navy'}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex items-center justify-between`}>
          <div className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {!form.name && <span className="text-amber-500">⚠ Team name required</span>}
            {form.name && !form.age_group && <span className="text-amber-500">⚠ Age group required</span>}
            {form.name && form.age_group && !saving && <span className="text-emerald-500">✓ Ready to save</span>}
            {saving && <span className="text-lynx-sky">Saving changes...</span>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={saving}
              className={`px-6 py-2 rounded-lg text-r-sm font-medium disabled:opacity-50 ${isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-100 text-lynx-navy hover:bg-lynx-frost'}`}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={!isValid || saving}
              className="px-6 py-3 rounded-lg bg-lynx-navy text-white font-bold text-r-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
