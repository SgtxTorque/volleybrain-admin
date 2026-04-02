import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSport } from '../../contexts/SportContext'
import {
  fetchPracticePlan, createPracticePlan, updatePracticePlan,
  savePlanItems, attachPlanToEvent, fetchUpcomingPracticeEvents
} from '../../lib/practice-plan-service'
import { fetchDrills, fetchDrillCategories } from '../../lib/drill-service'
import {
  ArrowLeft, Save, GripVertical, X, Plus, Clock, Search,
  ChevronDown, Coffee, MessageCircle, Play, Zap, Link, ChevronRight
} from 'lucide-react'

const INTENSITY_CONFIG = {
  low: { color: '#10B981' },
  medium: { color: '#F59E0B' },
  high: { color: '#EF4444' },
}

const ITEM_TYPE_CONFIG = {
  drill: { label: 'Drill', icon: Play, color: 'var(--accent-primary)' },
  break: { label: 'Break', icon: Coffee, color: '#10B981' },
  talk: { label: 'Team Talk', icon: MessageCircle, color: '#8B5CF6' },
  custom: { label: 'Custom', icon: Plus, color: '#F59E0B' },
}

export default function PracticePlanBuilder({ showToast }) {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { user, organization } = useAuth()
  const { isDark } = useTheme()
  const { selectedSport } = useSport()
  const orgId = organization?.id
  const isNew = planId === 'new'

  // Plan state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDuration, setTargetDuration] = useState(90)
  const [focusAreas, setFocusAreas] = useState([])
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  // Drill picker state
  const [drills, setDrills] = useState([])
  const [categories, setCategories] = useState([])
  const [drillSearch, setDrillSearch] = useState('')
  const [drillCategory, setDrillCategory] = useState('')
  const [loadingDrills, setLoadingDrills] = useState(true)

  // Attach to event
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [planDbId, setPlanDbId] = useState(isNew ? null : planId)

  // Drag state
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  useEffect(() => {
    if (!isNew && planId) loadPlan()
    loadDrills()
    loadCategories()
  }, [planId])

  useEffect(() => {
    const timeout = setTimeout(() => loadDrills(), 300)
    return () => clearTimeout(timeout)
  }, [drillSearch, drillCategory])

  async function loadPlan() {
    setLoading(true)
    const { data } = await fetchPracticePlan(planId)
    if (data) {
      setTitle(data.title || '')
      setDescription(data.description || '')
      setTargetDuration(data.target_duration_minutes || 90)
      setFocusAreas(data.focus_areas || [])
      setItems((data.practice_plan_items || []).map(item => ({
        id: item.id,
        drill_id: item.drill_id,
        drill: item.drills || null,
        custom_title: item.custom_title || '',
        custom_notes: item.custom_notes || '',
        duration_minutes: item.duration_minutes || 10,
        item_type: item.item_type || 'drill',
      })))
    }
    setLoading(false)
  }

  async function loadDrills() {
    setLoadingDrills(true)
    const { data } = await fetchDrills({
      orgId,
      sportId: selectedSport?.id,
      category: drillCategory || undefined,
      search: drillSearch.trim() || undefined,
      limit: 30,
    })
    if (data) setDrills(data)
    setLoadingDrills(false)
  }

  async function loadCategories() {
    const { data } = await fetchDrillCategories({ orgId, sportId: selectedSport?.id })
    if (data) setCategories(data)
  }

  function addDrillToSequence(drill) {
    setItems(prev => [...prev, {
      id: `temp-${Date.now()}`,
      drill_id: drill.id,
      drill,
      custom_title: '',
      custom_notes: '',
      duration_minutes: drill.duration_minutes || 10,
      item_type: 'drill',
    }])
  }

  function addBlock(type) {
    setItems(prev => [...prev, {
      id: `temp-${Date.now()}`,
      drill_id: null,
      drill: null,
      custom_title: type === 'break' ? 'Water Break' : type === 'talk' ? 'Team Talk' : 'Custom Block',
      custom_notes: '',
      duration_minutes: type === 'break' ? 5 : 10,
      item_type: type,
    }])
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  // Drag handlers
  function handleDragStart(index) { dragItem.current = index }
  function handleDragEnter(index) { dragOverItem.current = index }
  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return
    const reordered = [...items]
    const [removed] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOverItem.current, 0, removed)
    setItems(reordered)
    dragItem.current = null
    dragOverItem.current = null
  }

  async function handleSave() {
    if (!title.trim()) { showToast?.('Please enter a plan title', 'error'); return }
    setSaving(true)

    try {
      let currentPlanId = planDbId

      if (isNew || !currentPlanId) {
        const { data, error } = await createPracticePlan({
          org_id: orgId,
          created_by: user.id,
          sport_id: selectedSport?.id || null,
          title: title.trim(),
          description: description.trim() || null,
          target_duration_minutes: targetDuration || null,
          focus_areas: focusAreas.length > 0 ? focusAreas : null,
        })
        if (error) { showToast?.('Failed to create plan', 'error'); return }
        currentPlanId = data.id
        setPlanDbId(data.id)
      } else {
        const { error } = await updatePracticePlan(currentPlanId, {
          title: title.trim(),
          description: description.trim() || null,
          target_duration_minutes: targetDuration || null,
          focus_areas: focusAreas.length > 0 ? focusAreas : null,
        })
        if (error) { showToast?.('Failed to update plan', 'error'); return }
      }

      // Save items
      const { error: itemsError } = await savePlanItems(currentPlanId, items.map(item => ({
        drill_id: item.drill_id,
        custom_title: item.custom_title || null,
        custom_notes: item.custom_notes || null,
        duration_minutes: item.duration_minutes,
        item_type: item.item_type,
      })))

      if (itemsError) { showToast?.('Failed to save plan items', 'error'); return }

      showToast?.('Practice plan saved', 'success')
      if (isNew && currentPlanId) navigate(`/practice-plans/${currentPlanId}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  async function handleAttachToEvent(eventId) {
    if (!planDbId) { showToast?.('Save the plan first', 'error'); return }
    const { error } = await attachPlanToEvent(eventId, planDbId)
    if (error) { showToast?.('Failed to attach plan', 'error'); return }
    showToast?.('Plan attached to practice event', 'success')
    setShowAttachMenu(false)
  }

  async function loadUpcomingEvents() {
    const { data } = await fetchUpcomingPracticeEvents(orgId)
    if (data) setUpcomingEvents(data)
    setShowAttachMenu(true)
  }

  const currentDuration = items.reduce((sum, item) => sum + (item.duration_minutes || 0), 0)
  const isOverTarget = targetDuration && currentDuration > targetDuration

  const bg = isDark ? '#0A1B33' : '#F5F7FA'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'white'
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#E8ECF2'
  const textColor = isDark ? 'white' : '#10284C'
  const mutedColor = isDark ? '#64748B' : '#94A3B8'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Header */}
      <div className="shrink-0 px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/practice-plans')} className="p-2 rounded-lg transition hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" style={{ color: mutedColor }} />
          </button>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Untitled Practice Plan"
            className="text-lg font-extrabold bg-transparent outline-none border-none"
            style={{ color: textColor, minWidth: 200 }}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Duration summary */}
          <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
            isOverTarget ? 'bg-amber-500/10 text-amber-500' : isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {currentDuration}m{targetDuration ? ` / ${targetDuration}m` : ''} · {items.length} item{items.length !== 1 ? 's' : ''}
          </div>

          {/* Attach */}
          <div className="relative">
            <button
              onClick={loadUpcomingEvents}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition"
              style={{ border: `1px solid ${border}`, color: textColor }}
            >
              <Link className="w-3.5 h-3.5" /> Attach
              <ChevronDown className="w-3 h-3" />
            </button>
            {showAttachMenu && (
              <div className={`absolute right-0 top-full mt-1 w-72 rounded-xl shadow-2xl z-30 border overflow-hidden ${
                isDark ? 'bg-[#132240] border-white/[0.08]' : 'bg-white border-slate-200'
              }`}>
                <div className="p-3">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Upcoming Practices
                  </p>
                  {upcomingEvents.length === 0 ? (
                    <p className={`text-xs py-3 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming practices</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {upcomingEvents.map(evt => (
                        <button
                          key={evt.id}
                          onClick={() => handleAttachToEvent(evt.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                            isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{evt.title}</div>
                            <div className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                              {new Date(evt.event_date).toLocaleDateString()} · {evt.teams?.name}
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 shrink-0" style={{ color: mutedColor }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ borderTop: `1px solid ${border}` }} className="p-2">
                  <button onClick={() => setShowAttachMenu(false)}
                    className={`w-full text-center py-2 rounded-lg text-xs font-semibold ${isDark ? 'text-slate-500 hover:bg-white/[0.04]' : 'text-slate-400 hover:bg-slate-50'}`}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--accent-primary)' }}
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Drill Sequence */}
        <div className="flex-1 overflow-y-auto p-5" style={{ minWidth: 0 }}>
          {/* Target duration */}
          <div className="flex items-center gap-3 mb-4">
            <label className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Target:</label>
            <input
              type="number" value={targetDuration} onChange={e => setTargetDuration(Number(e.target.value))}
              className="w-16 px-2 py-1 rounded-lg text-xs font-semibold text-center outline-none"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}`, color: textColor }}
            />
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>min</span>
          </div>

          {/* Items list */}
          {items.length === 0 ? (
            <div className={`text-center py-16 rounded-[14px] border-2 border-dashed ${
              isDark ? 'border-white/[0.06] text-slate-500' : 'border-[#E8ECF2] text-slate-400'
            }`}>
              <p className="text-sm font-semibold mb-1">No drills added yet</p>
              <p className="text-xs">Add drills from the picker on the right, or add a break/talk block below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const typeConfig = ITEM_TYPE_CONFIG[item.item_type] || ITEM_TYPE_CONFIG.drill
                const TypeIcon = typeConfig.icon
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className={`group rounded-[14px] border transition ${
                      isDark ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]' : 'bg-white border-[#E8ECF2] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <GripVertical className="w-4 h-4 cursor-grab shrink-0" style={{ color: mutedColor }} />

                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${typeConfig.color}20` }}>
                        <TypeIcon className="w-3 h-3" style={{ color: typeConfig.color }} />
                      </div>

                      <span className={`text-xs font-bold w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {index + 1}.
                      </span>

                      <div className="flex-1 min-w-0">
                        {item.item_type === 'drill' ? (
                          <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                            {item.drill?.title || item.custom_title || 'Untitled Drill'}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={item.custom_title || ''}
                            onChange={e => updateItem(index, 'custom_title', e.target.value)}
                            placeholder={
                              item.item_type === 'break' ? 'Water Break' :
                              item.item_type === 'talk' ? 'Team Talk' : 'Custom Block'
                            }
                            className={`text-sm font-semibold bg-transparent outline-none w-full border-b border-transparent focus:border-[var(--accent-primary)] transition ${isDark ? 'text-white placeholder:text-slate-600' : 'text-[#10284C] placeholder:text-slate-400'}`}
                          />
                        )}
                        {item.drill?.category && (
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {item.drill.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        )}
                      </div>

                      {/* Duration input */}
                      <input
                        type="number"
                        value={item.duration_minutes}
                        onChange={e => updateItem(index, 'duration_minutes', Number(e.target.value) || 1)}
                        className="w-12 px-1.5 py-1 rounded-lg text-xs font-bold text-center outline-none"
                        style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}`, color: textColor }}
                        min="1"
                      />
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>min</span>

                      <button onClick={() => removeItem(index)}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-500/10">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>

                    {/* Expandable notes */}
                    <div className="px-4 pb-3 pl-[72px]">
                      <input
                        type="text"
                        value={item.custom_notes}
                        onChange={e => updateItem(index, 'custom_notes', e.target.value)}
                        placeholder="Coach notes..."
                        className={`w-full text-xs outline-none bg-transparent ${isDark ? 'text-slate-400 placeholder:text-slate-600' : 'text-slate-500 placeholder:text-slate-300'}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add buttons */}
          <div className="flex gap-2 mt-3">
            <button onClick={() => addBlock('break')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.06]' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'
              }`}>
              <Coffee className="w-3 h-3" /> + Break
            </button>
            <button onClick={() => addBlock('talk')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.06]' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'
              }`}>
              <MessageCircle className="w-3 h-3" /> + Talk
            </button>
            <button onClick={() => addBlock('custom')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.06]' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'
              }`}>
              <Plus className="w-3 h-3" /> + Custom
            </button>
          </div>
        </div>

        {/* RIGHT — Drill Picker */}
        <div className="w-[340px] shrink-0 border-l overflow-y-auto" style={{ borderColor: border }}>
          <div className="p-4 space-y-3">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Drill Picker
            </h3>

            {/* Search + category */}
            <div className="space-y-2">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                <input
                  type="text" value={drillSearch} onChange={e => setDrillSearch(e.target.value)}
                  placeholder="Search drills..."
                  className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none ${
                    isDark ? 'bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-slate-600' : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400'
                  }`}
                />
              </div>
              <select
                value={drillCategory} onChange={e => setDrillCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-xs outline-none ${
                  isDark ? 'bg-white/[0.04] border border-white/[0.06] text-white' : 'bg-white border border-[#E8ECF2] text-[#10284C]'
                }`}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.display_name}</option>)}
              </select>
            </div>

            {/* Drill list */}
            {loadingDrills ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`} />
                ))}
              </div>
            ) : drills.length === 0 ? (
              <p className={`text-xs text-center py-6 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                No drills found. Create drills in the Drill Library first.
              </p>
            ) : (
              <div className="space-y-1.5">
                {drills.map(drill => {
                  const intColor = INTENSITY_CONFIG[drill.intensity]?.color || '#F59E0B'
                  return (
                    <div
                      key={drill.id}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition cursor-pointer ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className={`w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center ${
                        isDark ? 'bg-white/[0.04]' : 'bg-slate-100'
                      }`}>
                        {drill.video_thumbnail_url ? (
                          <img src={drill.video_thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">🏐</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                          {drill.title}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {drill.duration_minutes}m
                          </span>
                          <span className="w-1 h-1 rounded-full" style={{ background: intColor }} />
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {drill.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addDrillToSequence(drill)}
                        className="shrink-0 px-2.5 py-1 rounded-md text-xs font-bold transition hover:opacity-80"
                        style={{ background: 'var(--accent-primary)', color: 'white' }}
                      >
                        + Add
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
