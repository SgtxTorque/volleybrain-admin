// =============================================================================
// NewTeamModal — 4-tab team creation form (Basic, Classification, Roster, Settings)
// Extracted from TeamsPage.jsx for the 500-line rule
// =============================================================================

import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, MessageCircle, ClipboardList } from '../../constants/icons'

export default function NewTeamModal({ onClose, onCreate }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    color: '#FFD700',
    logo_url: '',
    age_group_type: 'age',
    age_group: '',
    team_type: 'recreational',
    skill_level: 'all',
    gender: 'coed',
    max_roster_size: 12,
    min_roster_size: 6,
    roster_open: true,
    description: '',
    internal_notes: '',
    create_team_chat: true,
    create_player_chat: true,
    create_team_wall: true
  })
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [creating, setCreating] = useState(false)

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

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `team-logo-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('team-assets')
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        const reader = new FileReader()
        reader.onload = (e) => setForm({ ...form, logo_url: e.target.result })
        reader.readAsDataURL(file)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('team-assets')
          .getPublicUrl(fileName)
        setForm({ ...form, logo_url: publicUrl })
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
    setUploading(false)
  }

  async function handleCreate() {
    if (!form.name.trim() || creating) return
    setCreating(true)
    try {
      await onCreate(form)
    } catch (err) {
      console.error('Error creating team:', err)
    }
    setCreating(false)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '🏐' },
    { id: 'classification', label: 'Classification', icon: '📋' },
    { id: 'roster', label: 'Roster', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const isValid = form.name.trim() && form.age_group

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Team</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-base font-medium transition ${
                activeTab === tab.id
                  ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-lynx-sky`
                  : `${isDark ? 'text-slate-500' : 'text-slate-400'} hover:text-slate-300`
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
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Team Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Varsity Elite"
                  className={`w-full rounded-lg px-4 py-3 ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Abbreviation</label>
                <input
                  type="text"
                  value={form.abbreviation}
                  onChange={e => setForm({...form, abbreviation: e.target.value.toUpperCase().slice(0, 5)})}
                  placeholder="e.g., BHE"
                  maxLength={5}
                  className={`w-full rounded-lg px-4 py-3 uppercase ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
                />
                <p className={`text-base mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Short code for scoreboards & schedules (max 5 chars)</p>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Team Color</label>
                <div className="flex gap-3">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white/20 cursor-pointer overflow-hidden"
                    style={{ backgroundColor: form.color }}
                  >
                    <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full h-full cursor-pointer opacity-0" />
                  </div>
                  <input
                    type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                    className={`flex-1 rounded-lg px-4 py-3 font-mono ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
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

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Team Logo</label>
                <div className="flex items-center gap-4">
                  {form.logo_url ? (
                    <div className="relative">
                      <img src={form.logo_url} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                      <button onClick={() => setForm({...form, logo_url: ''})} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-base">×</button>
                    </div>
                  ) : (
                    <label className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${isDark ? 'bg-white/[0.06] border-white/[0.06] hover:border-lynx-sky' : 'bg-slate-50 border-slate-200 hover:border-lynx-sky'}`}>
                      <span className="text-3xl">📷</span>
                      <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Upload</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                  <div className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <p>Recommended: 200x200px</p>
                    <p>PNG or JPG</p>
                    {uploading && <p className="text-lynx-sky">Uploading...</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Description</label>
                <textarea
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Team bio, goals, or info for parents..."
                  rows={3}
                  className={`w-full rounded-lg px-4 py-3 resize-none ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>
          )}

          {/* Classification Tab */}
          {activeTab === 'classification' && (
            <div className="space-y-5">
              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Division Type *</label>
                <div className="flex gap-2">
                  {[{ v: 'age', l: 'By Age (8U, 10U, etc.)' }, { v: 'grade', l: 'By Grade Level' }].map(d => (
                    <button key={d.v}
                      onClick={() => setForm({...form, age_group_type: d.v, age_group: ''})}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                        form.age_group_type === d.v ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-50 text-slate-900'
                      }`}
                    >{d.l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                  {form.age_group_type === 'age' ? 'Age Group *' : 'Grade Level *'}
                </label>
                {form.age_group_type === 'age' ? (
                  <div className="grid grid-cols-4 gap-2">
                    {ageOptions.map(age => (
                      <button key={age} onClick={() => setForm({...form, age_group: age})}
                        className={`px-4 py-3 rounded-lg font-medium transition ${
                          form.age_group === age ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.08]' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                        }`}>{age}</button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {gradeOptions.map(grade => (
                      <button key={grade.value} onClick={() => setForm({...form, age_group: grade.value})}
                        className={`px-3 py-2 rounded-lg text-base font-medium transition ${
                          form.age_group === grade.value ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.08]' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                        }`}>{grade.label}</button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Team Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 'recreational', e: '🎉', l: 'Recreational', d: 'Fun, learning & development' }, { v: 'competitive', e: '🏆', l: 'Competitive', d: 'Travel, tournaments & leagues' }].map(t => (
                    <button key={t.v} onClick={() => setForm({...form, team_type: t.v})}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        form.team_type === t.v ? 'border-lynx-sky bg-lynx-sky/10' : `border-transparent ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`
                      }`}>
                      <span className="text-4xl">{t.e}</span>
                      <p className={`font-semibold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.l}</p>
                      <p className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Gender</label>
                <div className="flex gap-2">
                  {[{ value: 'girls', label: '♀ Girls' }, { value: 'boys', label: '♂ Boys' }, { value: 'coed', label: '👫 Coed' }].map(g => (
                    <button key={g.value} onClick={() => setForm({...form, gender: g.value})}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                        form.gender === g.value ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-50 text-slate-900'
                      }`}>{g.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Skill Level</label>
                <div className="flex gap-2">
                  {[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }, { value: 'all', label: 'All Levels' }].map(s => (
                    <button key={s.value} onClick={() => setForm({...form, skill_level: s.value})}
                      className={`flex-1 px-3 py-2 rounded-lg text-base font-medium transition ${
                        form.skill_level === s.value ? 'bg-lynx-sky text-white' : isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-50 text-slate-900'
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
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                  Maximum Roster Size: <span className="text-lynx-sky font-bold text-xl">{form.max_roster_size}</span>
                </label>
                <input type="range" min="6" max="16" value={form.max_roster_size}
                  onChange={e => setForm({...form, max_roster_size: parseInt(e.target.value)})}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-lynx-sky"
                  style={{ background: `linear-gradient(to right, #4BB9EC 0%, #4BB9EC ${((form.max_roster_size - 6) / 10) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} ${((form.max_roster_size - 6) / 10) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} 100%)` }}
                />
                <div className={`flex justify-between text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>6</span><span>10</span><span className="font-medium">12 (default)</span><span>14</span><span>16</span>
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                  Minimum Roster Size: <span className="text-lynx-sky font-bold text-xl">{form.min_roster_size}</span>
                </label>
                <input type="range" min="4" max={form.max_roster_size} value={form.min_roster_size}
                  onChange={e => setForm({...form, min_roster_size: parseInt(e.target.value)})}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-lynx-sky"
                  style={{ background: `linear-gradient(to right, #4BB9EC 0%, #4BB9EC ${((form.min_roster_size - 4) / (form.max_roster_size - 4)) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} ${((form.min_roster_size - 4) / (form.max_roster_size - 4)) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} 100%)` }}
                />
                <p className={`text-base mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Minimum players needed to field a team</p>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Roster Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setForm({...form, roster_open: true})}
                    className={`p-4 rounded-lg border-2 transition text-left ${form.roster_open ? 'border-emerald-500 bg-emerald-500/10' : `border-transparent ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}`}>
                    <span className="text-3xl">🟢</span>
                    <p className={`font-semibold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Open</p>
                    <p className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Accepting new players</p>
                  </button>
                  <button onClick={() => setForm({...form, roster_open: false})}
                    className={`p-4 rounded-lg border-2 transition text-left ${!form.roster_open ? 'border-red-500 bg-red-500/10' : `border-transparent ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}`}>
                    <span className="text-3xl">🔴</span>
                    <p className={`font-semibold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Closed</p>
                    <p className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Roster is full/locked</p>
                  </button>
                </div>
              </div>

              <div className={`rounded-lg p-4 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}>
                <p className={`text-base mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Roster Preview</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(form.max_roster_size, 8) }).map((_, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>{i + 1}</div>
                    ))}
                    {form.max_roster_size > 8 && (
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>+{form.max_roster_size - 8}</div>
                    )}
                  </div>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{form.min_roster_size} - {form.max_roster_size} players</span>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>Auto-Create on Team Creation</label>
                <div className="space-y-3">
                  {[
                    { key: 'create_team_chat', icon: <MessageCircle className="w-7 h-7" />, label: 'Team Chat', desc: 'Parents & coaches can message' },
                    { key: 'create_player_chat', icon: <span className="text-3xl">🧒</span>, label: 'Player Chat', desc: 'Players & coaches (parents view-only)' },
                    { key: 'create_team_wall', icon: <ClipboardList className="w-7 h-7" />, label: 'Team Wall/Page', desc: 'Team announcements, events & posts' },
                  ].map(opt => (
                    <label key={opt.key} className={`flex items-center justify-between p-4 rounded-lg cursor-pointer ${isDark ? 'bg-white/[0.06]' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        {opt.icon}
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{opt.label}</p>
                          <p className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{opt.desc}</p>
                        </div>
                      </div>
                      <input type="checkbox" checked={form[opt.key]}
                        onChange={e => setForm({...form, [opt.key]: e.target.checked})}
                        className="w-5 h-5 rounded accent-lynx-sky" />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Internal Notes (Admin Only)</label>
                <textarea value={form.internal_notes} onChange={e => setForm({...form, internal_notes: e.target.value})}
                  placeholder="Notes for coaches/admins only (not visible to parents)..."
                  rows={3}
                  className={`w-full rounded-lg px-4 py-3 resize-none ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex items-center justify-between`}>
          <div className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {!form.name && <span className="text-amber-500">⚠ Team name required</span>}
            {form.name && !form.age_group && <span className="text-amber-500">⚠ Age group required</span>}
            {form.name && form.age_group && !creating && <span className="text-emerald-500">✓ Ready to create</span>}
            {creating && <span className="text-lynx-sky">Creating team...</span>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={creating}
              className={`px-6 py-2 rounded-lg font-medium disabled:opacity-50 ${isDark ? 'bg-white/[0.06] text-white' : 'bg-slate-100 text-slate-900'}`}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!isValid || creating}
              className="px-6 py-3 rounded-lg bg-lynx-sky text-lynx-navy font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition">
              {creating ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
