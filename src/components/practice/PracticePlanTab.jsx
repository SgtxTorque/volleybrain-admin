import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { getEventPracticePlan, updateEventPlanStatus, attachPlanToEvent, detachPlanFromEvent } from '../../lib/practice-plan-service'
import { fetchPracticePlans } from '../../lib/practice-plan-service'
import { fetchEventReflections } from '../../lib/development-service'
import { Clock, Play, Zap, Plus, Link, X, Check, FileText, ChevronDown, ChevronUp, Users } from 'lucide-react'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  ready: { label: 'Ready', color: '#4BB9EC', bg: 'rgba(75,185,236,0.12)' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  completed: { label: 'Completed', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
}

const INTENSITY_CONFIG = {
  low: { color: '#10B981' },
  medium: { color: '#F59E0B' },
  high: { color: '#EF4444' },
}

export default function PracticePlanTab({ event, showToast, activeView }) {
  const { isDark } = useTheme()
  const { user, organization } = useAuth()
  const navigate = useNavigate()
  const orgId = organization?.id
  const isCoachOrAdmin = activeView === 'admin' || activeView === 'coach'

  const [eventPlan, setEventPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coachNotes, setCoachNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Attach picker
  const [showPicker, setShowPicker] = useState(false)
  const [availablePlans, setAvailablePlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)

  // Reflections
  const [reflections, setReflections] = useState([])
  const [showReflections, setShowReflections] = useState(false)

  useEffect(() => {
    if (event?.id) {
      loadEventPlan()
      loadReflections()
    }
  }, [event?.id])

  async function loadEventPlan() {
    setLoading(true)
    const { data } = await getEventPracticePlan(event.id)
    if (data) {
      setEventPlan(data)
      setCoachNotes(data.coach_notes || '')
    }
    setLoading(false)
  }

  async function loadReflections() {
    const { data } = await fetchEventReflections(event.id)
    if (data) setReflections(data)
  }

  async function handleAttachPlan(planId) {
    const { error } = await attachPlanToEvent(event.id, planId)
    if (error) { showToast?.('Failed to attach plan', 'error'); return }
    showToast?.('Plan attached', 'success')
    setShowPicker(false)
    loadEventPlan()
  }

  async function handleDetach() {
    if (!confirm('Detach this practice plan from the event?')) return
    const { error } = await detachPlanFromEvent(event.id)
    if (error) { showToast?.('Failed to detach', 'error'); return }
    setEventPlan(null)
    showToast?.('Plan detached', 'success')
  }

  async function handleStatusChange(status) {
    const { error } = await updateEventPlanStatus(event.id, status)
    if (error) { showToast?.('Failed to update status', 'error'); return }
    loadEventPlan()
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    const { error } = await updateEventPlanStatus(event.id, eventPlan.status, coachNotes)
    if (error) showToast?.('Failed to save notes', 'error')
    else showToast?.('Notes saved', 'success')
    setSavingNotes(false)
  }

  async function openPicker() {
    setLoadingPlans(true)
    setShowPicker(true)
    const { data } = await fetchPracticePlans({ orgId })
    if (data) setAvailablePlans(data)
    setLoadingPlans(false)
  }

  const textColor = isDark ? 'white' : '#10284C'
  const mutedColor = isDark ? '#64748B' : '#94A3B8'
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#E8ECF2'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No plan attached
  if (!eventPlan) {
    return (
      <div className="p-5">
        <div className={`text-center py-12 rounded-[14px] border-2 border-dashed ${
          isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'
        }`}>
          <div className="text-4xl mb-3">📋</div>
          <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            No practice plan attached
          </h3>
          <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Attach an existing plan or create a new one for this practice.
          </p>
          {isCoachOrAdmin && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={openPicker}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition"
                style={{ border: `1px solid ${border}`, color: textColor }}>
                <Link className="w-3.5 h-3.5" /> Attach a Plan
              </button>
              <button onClick={() => navigate('/practice-plans/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
                style={{ background: 'var(--accent-primary)' }}>
                <Plus className="w-3.5 h-3.5" /> Create New Plan
              </button>
            </div>
          )}
        </div>

        {/* Plan picker overlay */}
        {showPicker && (
          <div className={`mt-4 rounded-[14px] border p-4 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Select a Plan</h4>
              <button onClick={() => setShowPicker(false)}>
                <X className="w-4 h-4" style={{ color: mutedColor }} />
              </button>
            </div>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : availablePlans.length === 0 ? (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No plans available. Create one first.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {availablePlans.map(plan => (
                  <button key={plan.id} onClick={() => handleAttachPlan(plan.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition ${
                      isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    }`}>
                    <div className="font-semibold">{plan.title}</div>
                    <div style={{ color: mutedColor }}>
                      {plan.target_duration_minutes ? `${plan.target_duration_minutes} min` : ''} · {plan.practice_plan_items?.[0]?.count || 0} items
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Plan attached — show details
  const plan = eventPlan.practice_plans
  const planItems = plan?.practice_plan_items || []
  const totalDuration = planItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0)
  const statusConfig = STATUS_CONFIG[eventPlan.status] || STATUS_CONFIG.draft

  return (
    <div className="p-5 space-y-4">
      {/* Plan header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{plan?.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: statusConfig.bg, color: statusConfig.color }}>
              {statusConfig.label}
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {totalDuration} min · {planItems.length} items
            </span>
          </div>
        </div>
        {isCoachOrAdmin && (
          <div className="flex items-center gap-1.5">
            {eventPlan.status === 'ready' && (
              <button onClick={() => handleStatusChange('completed')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-500 bg-emerald-500/10 transition hover:bg-emerald-500/20">
                <Check className="w-3 h-3" /> Mark Complete
              </button>
            )}
            <button onClick={handleDetach}
              className="p-1.5 rounded-lg transition hover:bg-red-500/10">
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* Drill list */}
      <div className={`rounded-[14px] border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
        <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-[#E8ECF2]'}`}>
          {planItems.map((item, i) => {
            const drill = item.drills
            const intColor = INTENSITY_CONFIG[drill?.intensity]?.color || '#F59E0B'
            return (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${
                isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
              } transition`}>
                <span className={`text-xs font-bold w-5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{i + 1}</span>

                {drill?.video_thumbnail_url ? (
                  <img src={drill.video_thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                    {item.item_type === 'drill' ? '🏐' : item.item_type === 'break' ? '☕' : '💬'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                    {item.item_type === 'drill' ? (drill?.title || item.custom_title || 'Untitled') : (item.custom_title || item.item_type)}
                  </div>
                  {drill?.category && (
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {drill.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {drill?.intensity && <span className="w-1.5 h-1.5 rounded-full" style={{ background: intColor }} />}
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.duration_minutes}m
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Coach notes */}
      {isCoachOrAdmin && (
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Post-Practice Notes
          </h4>
          <textarea
            value={coachNotes} onChange={e => setCoachNotes(e.target.value)}
            placeholder="How did practice go? Any notes for next time..."
            rows={3}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none ${
              isDark ? 'bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-slate-600'
              : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400'
            }`}
          />
          <button onClick={handleSaveNotes} disabled={savingNotes}
            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--accent-primary)' }}>
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      )}

      {/* Reflections summary */}
      <div>
        <button onClick={() => setShowReflections(!showReflections)}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <Users className="w-3 h-3" />
          Player Reflections ({reflections.length})
          {showReflections ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showReflections && (
          <div className="mt-2">
            {reflections.length === 0 ? (
              <p className={`text-xs py-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No reflections yet. Players submit reflections from the Lynx mobile app.
              </p>
            ) : (
              <div className={`rounded-xl border divide-y ${isDark ? 'border-white/[0.06] divide-white/[0.04]' : 'border-[#E8ECF2] divide-[#E8ECF2]'}`}>
                {reflections.map(ref => (
                  <div key={ref.id} className="px-3 py-2.5">
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                      {ref.players?.first_name} {ref.players?.last_name}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {ref.reflection_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · {new Date(ref.submitted_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
