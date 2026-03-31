import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Layers, Award, Target, Activity, Plus, Edit as Pencil, Trash2, X,
  RefreshCw, Search, Filter, ChevronDown, AlertTriangle
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM CONTENT MANAGER — Sport Templates, Badges, Challenges, Sports
// PA Command Center Phase 3.6
// ═══════════════════════════════════════════════════════════

const CM_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .cm-au{animation:fadeUp .4s ease-out both}
  .cm-ai{animation:fadeIn .3s ease-out both}
  .cm-as{animation:scaleIn .25s ease-out both}
  .cm-glass{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
  .cm-light .cm-glass{background:#fff;border-color:#E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
`

const TABS = [
  { id: 'templates', label: 'Sport Templates', icon: Layers },
  { id: 'badges', label: 'Badge Library', icon: Award },
  { id: 'challenges', label: 'Challenges', icon: Target },
  { id: 'sports', label: 'Sports', icon: Activity },
]

// ═══════ MODAL ═══════
function Modal({ isOpen, onClose, title, children, isDark }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-[14px] p-6 shadow-xl cm-as ${isDark ? 'bg-[#1E293B] border border-slate-700' : 'bg-white border border-slate-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ═══════ SPORT SKILL TEMPLATES TAB ═══════
function TemplatesTab({ isDark, tc, showToast }) {
  const [templates, setTemplates] = useState([])
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ sport_id: '', category: '', name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [rlsWarning, setRlsWarning] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: temps, error }, { data: sp }] = await Promise.all([
      supabase.from('sport_skill_templates').select('*').order('created_at', { ascending: false }).limit(5000),
      supabase.from('sports').select('id, name').limit(100),
    ])
    if (error) {
      console.error('sport_skill_templates query error:', error)
      setRlsWarning(true)
      setTemplates([])
    } else {
      setTemplates(temps || [])
      setRlsWarning(false)
    }
    setSports(sp || [])
    setLoading(false)
  }

  function openAdd() {
    setEditItem(null)
    setForm({ sport_id: sports[0]?.id || '', category: '', name: '', description: '' })
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ sport_id: item.sport_id || '', category: item.category || '', name: item.name || '', description: item.description || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editItem) {
        await supabase.from('sport_skill_templates').update({
          sport_id: form.sport_id || null,
          category: form.category,
          name: form.name,
          description: form.description,
        }).eq('id', editItem.id)
        showToast?.('Template updated', 'success')
      } else {
        await supabase.from('sport_skill_templates').insert({
          sport_id: form.sport_id || null,
          category: form.category,
          name: form.name,
          description: form.description,
        })
        showToast?.('Template created', 'success')
      }
      setShowModal(false)
      await load()
    } catch (err) {
      console.error(err)
      showToast?.('Save failed', 'error')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template?')) return
    await supabase.from('sport_skill_templates').delete().eq('id', id)
    showToast?.('Template deleted', 'success')
    load()
  }

  // Group by sport
  const sportMap = {}
  for (const s of sports) sportMap[s.id] = s.name
  const grouped = {}
  for (const t of templates) {
    const sportName = sportMap[t.sport_id] || 'Unassigned'
    if (!grouped[sportName]) grouped[sportName] = []
    grouped[sportName].push(t)
  }

  const filtered = search
    ? templates.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div>
      {rlsWarning && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            RLS may be blocking access to sport_skill_templates. Carlos may need to add a platform admin policy.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
            <Search className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className={`bg-transparent text-sm outline-none w-40 ${isDark ? 'text-slate-300 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`}
            />
          </div>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {templates.length} templates across {Object.keys(grouped).length} sports
          </span>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#4BB9EC] hover:bg-[#3aa8db] transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4BB9EC', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered ? (
        <div className="space-y-2">
          {filtered.length === 0 && <p className={`text-xs text-center py-8 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No matching templates</p>}
          {filtered.map(t => (
            <TemplateRow key={t.id} item={t} sportName={sportMap[t.sport_id]} isDark={isDark} onEdit={() => openEdit(t)} onDelete={() => handleDelete(t.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([sport, items]) => (
            <div key={sport}>
              <h4 className={`text-xs uppercase font-bold mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sport} ({items.length})</h4>
              <div className="space-y-1.5">
                {items.map(t => (
                  <TemplateRow key={t.id} item={t} isDark={isDark} onEdit={() => openEdit(t)} onDelete={() => handleDelete(t.id)} />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className={`text-xs text-center py-8 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No sport skill templates found</p>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Template' : 'Add Template'} isDark={isDark}>
        <div className="space-y-3">
          <div>
            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sport</label>
            <select value={form.sport_id} onChange={e => setForm({ ...form, sport_id: e.target.value })}
              className={`w-full mt-1 px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <option value="">Unassigned</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Category</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className={`w-full mt-1 px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
              placeholder="e.g., Serving, Passing" />
          </div>
          <div>
            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full mt-1 px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
              placeholder="Skill name" />
          </div>
          <div>
            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className={`w-full mt-1 px-3 py-2 rounded-xl text-sm border resize-none ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
              rows={3} placeholder="Description..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#4BB9EC] hover:bg-[#3aa8db] transition disabled:opacity-50">
              {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TemplateRow({ item, sportName, isDark, onEdit, onDelete }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]' : 'bg-white border-slate-100 hover:bg-slate-50'} transition`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
          {item.category && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>{item.category}</span>
          )}
          {sportName && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{sportName}</span>
          )}
        </div>
        {item.description && <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.description}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button onClick={onEdit} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg transition text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ═══════ BADGE LIBRARY TAB (READ-ONLY) ═══════
function BadgesTab({ isDark, tc }) {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [rlsWarning, setRlsWarning] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('achievements')
      .select('*')
      .order('category')
      .limit(5000)
    if (error) {
      console.error('achievements query error:', error)
      setRlsWarning(true)
      setBadges([])
    } else {
      setBadges(data || [])
      setRlsWarning(false)
    }
    setLoading(false)
  }

  const categories = [...new Set(badges.map(b => b.category).filter(Boolean))]
  const tiers = [...new Set(badges.map(b => b.tier).filter(Boolean))]

  const filtered = badges.filter(b => {
    if (search && !b.name?.toLowerCase().includes(search.toLowerCase()) && !b.description?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCategory !== 'all' && b.category !== filterCategory) return false
    if (filterTier !== 'all' && b.tier !== filterTier) return false
    return true
  })

  return (
    <div>
      {rlsWarning && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            RLS may be blocking access to achievements. Carlos may need to add a platform admin policy.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
            <Search className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search badges..."
              className={`bg-transparent text-sm outline-none w-32 ${isDark ? 'text-slate-300 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`} />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <option value="all">All Tiers</option>
            {tiers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {filtered.length} badges in {categories.length} categories (read-only)
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4BB9EC', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No badges found</p>
            </div>
          )}
          {filtered.map(badge => (
            <div key={badge.id} className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white border-slate-100'}`}>
              <div className="flex items-start gap-3">
                {badge.image_url ? (
                  <img src={badge.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-amber-500/15' : 'bg-amber-50'}`}>
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{badge.name}</p>
                  {badge.description && <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{badge.description}</p>}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {badge.category && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>{badge.category}</span>
                    )}
                    {badge.tier && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>{badge.tier}</span>
                    )}
                    {badge.xp_reward && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>{badge.xp_reward} XP</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════ CHALLENGES TAB ═══════
function ChallengesTab({ isDark, tc, showToast }) {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [rlsWarning, setRlsWarning] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('coach_challenges')
      .select('*, organizations:organization_id(name)')
      .order('created_at', { ascending: false })
      .limit(5000)
    if (error) {
      console.error('coach_challenges query error:', error)
      setRlsWarning(true)
      setChallenges([])
    } else {
      setChallenges(data || [])
      setRlsWarning(false)
    }
    setLoading(false)
  }

  // Group by org
  const grouped = {}
  for (const c of challenges) {
    const orgName = c.organizations?.name || 'Platform Templates'
    if (!grouped[orgName]) grouped[orgName] = []
    grouped[orgName].push(c)
  }

  return (
    <div>
      {rlsWarning && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            RLS may be blocking access to coach_challenges. Carlos may need to add a platform admin policy.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {challenges.length} challenges across {Object.keys(grouped).length} orgs
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4BB9EC', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([orgName, items]) => (
            <div key={orgName}>
              <h4 className={`text-xs uppercase font-bold mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{orgName} ({items.length})</h4>
              <div className="space-y-1.5">
                {items.map(c => (
                  <div key={c.id} className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.title || c.name || 'Untitled'}</p>
                        {c.description && <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.description}</p>}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {c.challenge_type && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{c.challenge_type}</span>
                          )}
                          {c.difficulty && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>{c.difficulty}</span>
                          )}
                          {c.xp_reward && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>{c.xp_reward} XP</span>
                          )}
                          {c.target_value && (
                            <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Target: {c.target_value}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] shrink-0 ml-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        {c.status || 'active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className={`text-xs text-center py-8 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No challenges found</p>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════ SPORTS MANAGEMENT TAB ═══════
function SportsTab({ isDark, tc, showToast }) {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', icon: '' })
  const [saving, setSaving] = useState(false)
  const [rlsWarning, setRlsWarning] = useState(false)

  // Counts for enrichment
  const [orgCounts, setOrgCounts] = useState({})
  const [templateCounts, setTemplateCounts] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: sp, error }, { data: templates }] = await Promise.all([
      supabase.from('sports').select('*').order('name').limit(100),
      supabase.from('sport_skill_templates').select('sport_id').limit(10000),
    ])
    if (error) {
      console.error('sports query error:', error)
      setRlsWarning(true)
      setSports([])
    } else {
      setSports(sp || [])
      setRlsWarning(false)
    }

    // Count templates per sport
    const tCounts = {}
    for (const t of (templates || [])) {
      tCounts[t.sport_id] = (tCounts[t.sport_id] || 0) + 1
    }
    setTemplateCounts(tCounts)

    // Count orgs using each sport (via settings.sports)
    const { data: orgs } = await supabase.from('organizations').select('settings').limit(10000)
    const oCounts = {}
    for (const org of (orgs || [])) {
      const s = org.settings || {}
      const orgSports = s.sports || s.enabled_sports || []
      for (const sportName of (Array.isArray(orgSports) ? orgSports : [])) {
        oCounts[sportName] = (oCounts[sportName] || 0) + 1
      }
    }
    setOrgCounts(oCounts)

    setLoading(false)
  }

  function openAdd() {
    setEditItem(null)
    setForm({ name: '', icon: '' })
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ name: item.name || '', icon: item.icon || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editItem) {
        await supabase.from('sports').update({ name: form.name, icon: form.icon || null }).eq('id', editItem.id)
        showToast?.('Sport updated', 'success')
      } else {
        await supabase.from('sports').insert({ name: form.name, icon: form.icon || null })
        showToast?.('Sport created', 'success')
      }
      setShowModal(false)
      await load()
    } catch (err) {
      console.error(err)
      showToast?.('Save failed', 'error')
    }
    setSaving(false)
  }

  return (
    <div>
      {rlsWarning && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            RLS may be blocking access to sports. Carlos may need to add a platform admin policy.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {sports.length} sports configured
        </span>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#4BB9EC] hover:bg-[#3aa8db] transition">
          <Plus className="w-3.5 h-3.5" />
          Add Sport
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4BB9EC', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sports.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No sports configured</p>
            </div>
          )}
          {sports.map(sport => (
            <div key={sport.id} className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]' : 'bg-white border-slate-100 hover:bg-slate-50'} transition`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-sky-500/15' : 'bg-sky-50'}`}>
                    <span className="text-lg">{sport.icon || '\u26BD'}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{sport.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{orgCounts[sport.name?.toLowerCase()] || 0} orgs</span>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{templateCounts[sport.id] || 0} templates</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => openEdit(sport)} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Sport' : 'Add Sport'} isDark={isDark}>
        <div className="space-y-3">
          <div>
            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full mt-1 px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
              placeholder="Sport name" />
          </div>
          <div>
            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Icon (emoji)</label>
            <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
              className={`w-full mt-1 px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
              placeholder="e.g. \u{1F3D0}" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#4BB9EC] hover:bg-[#3aa8db] transition disabled:opacity-50">
              {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ═══════ MAIN PAGE ═══════
export default function PlatformContentManager({ showToast }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const [activeTab, setActiveTab] = useState('templates')

  return (
    <div className={`${isDark ? '' : 'cm-light'}`}>
      <style>{CM_STYLES}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 cm-au">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Content Manager</h2>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Manage platform-wide sport templates, badges, challenges, and sports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex items-center gap-1 p-1 rounded-xl mb-6 cm-au ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`} style={{ animationDelay: '100ms' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? (isDark ? 'bg-white/[0.08] text-white' : 'bg-white text-slate-900 shadow-sm')
                  : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="cm-au" style={{ animationDelay: '200ms' }}>
        {activeTab === 'templates' && <TemplatesTab isDark={isDark} tc={tc} showToast={showToast} />}
        {activeTab === 'badges' && <BadgesTab isDark={isDark} tc={tc} />}
        {activeTab === 'challenges' && <ChallengesTab isDark={isDark} tc={tc} showToast={showToast} />}
        {activeTab === 'sports' && <SportsTab isDark={isDark} tc={tc} showToast={showToast} />}
      </div>
    </div>
  )
}
