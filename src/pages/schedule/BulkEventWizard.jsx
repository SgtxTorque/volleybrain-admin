import { useState, useEffect, useMemo } from 'react'
import { X, Calendar, Trophy, ChevronLeft, ChevronRight, Plus, Trash2, Link, CheckCircle2 } from '../../constants/icons'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import EventCard from '../../components/pages/EventCard'

// ─── Duration presets ────────────────────────────────────
const DURATION_PRESETS = [
  { label: '60 min', minutes: 60 },
  { label: '90 min', minutes: 90 },
  { label: '120 min', minutes: 120 },
]

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// ─── Day labels ──────────────────────────────────────────
const DAYS = [
  { value: 1, label: 'Monday', short: 'M' },
  { value: 2, label: 'Tuesday', short: 'T' },
  { value: 3, label: 'Wednesday', short: 'W' },
  { value: 4, label: 'Thursday', short: 'Th' },
  { value: 5, label: 'Friday', short: 'F' },
  { value: 6, label: 'Saturday', short: 'Sa' },
  { value: 0, label: 'Sunday', short: 'Su' },
]

// ─── Event type options ──────────────────────────────────
const EVENT_TYPES = [
  { value: 'practice', label: 'Practice' },
  { value: 'training', label: 'Training' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'scrimmage', label: 'Scrimmage' },
  { value: 'open_gym', label: 'Open Gym' },
  { value: 'team_event', label: 'Team Event' },
]

// ─── Step indicator ──────────────────────────────────────
function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
          i <= step ? 'bg-lynx-sky w-8' : 'bg-slate-300/30 w-4'
        }`} />
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════════
// Main Wizard
// ═════════════════════════════════════════════════════════
export default function BulkEventWizard({
  teams, venues, onClose, onCreate, showToast, fromSeason, seasonId
}) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [step, setStep] = useState(0) // 0=type, 1=form, 2=preview, 3=success
  const [seriesType, setSeriesType] = useState(null) // 'recurring' | 'games'
  const [createdCount, setCreatedCount] = useState(0)
  const [createdType, setCreatedType] = useState('')

  // Recurring schedule state
  const [recurForm, setRecurForm] = useState({
    team_id: '',
    event_type: 'practice',
    start_time: '18:00',
    duration: 90,
    selectedDays: [],
    venue_name: '',
    venue_address: '',
    court_number: '',
    start_date: '',
    end_date: '',
    weeks: 8,
    dateMode: 'range', // 'range' | 'weeks'
  })

  // Game series state
  const [gameRows, setGameRows] = useState([
    { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', court_number: '', location_type: 'home' }
  ])

  // Preview events (generated from form data)
  const [previewEvents, setPreviewEvents] = useState([])

  // ─── Generate preview for recurring ──────────────────
  useEffect(() => {
    if (seriesType !== 'recurring' || step < 1) return
    generateRecurringPreview()
  }, [
    recurForm.start_date, recurForm.end_date, recurForm.weeks,
    recurForm.dateMode, recurForm.selectedDays, recurForm.start_time,
    recurForm.duration, recurForm.team_id, recurForm.event_type,
    recurForm.venue_name, recurForm.court_number
  ])

  function generateRecurringPreview() {
    const { selectedDays, start_date, dateMode, weeks, end_date } = recurForm
    if (!start_date || selectedDays.length === 0) { setPreviewEvents([]); return }

    // Parse start date as local
    const [sy, sm, sd] = start_date.split('-').map(Number)
    const startD = new Date(sy, sm - 1, sd)

    let endD
    if (dateMode === 'weeks') {
      endD = new Date(startD)
      endD.setDate(endD.getDate() + weeks * 7)
    } else {
      if (!end_date) { setPreviewEvents([]); return }
      const [ey, em, ed] = end_date.split('-').map(Number)
      endD = new Date(ey, em - 1, ed)
    }

    const events = []
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      if (selectedDays.includes(d.getDay())) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const endTime = addMinutes(recurForm.start_time, recurForm.duration)
        events.push({
          id: `preview-${d.getTime()}`,
          event_date: `${y}-${m}-${dd}`,
          event_time: recurForm.start_time,
          end_time: endTime,
          event_type: recurForm.event_type,
          title: recurForm.event_type === 'practice' ? 'Practice' : EVENT_TYPES.find(t => t.value === recurForm.event_type)?.label || recurForm.event_type,
          team_id: recurForm.team_id || null,
          team_name: teams.find(t => t.id === recurForm.team_id)?.name || 'All Teams',
          venue_name: recurForm.venue_name,
          venue_address: recurForm.venue_address,
          court_number: recurForm.court_number || null,
          location_type: 'home',
          date_display: new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          time_display: `${formatTime12(recurForm.start_time)} – ${formatTime12(endTime)}`,
        })
      }
    }
    setPreviewEvents(events)
  }

  // ─── Generate preview for games ──────────────────────
  useEffect(() => {
    if (seriesType !== 'games' || step < 1) return
    generateGamePreview()
  }, [gameRows, step, seriesType])

  function generateGamePreview() {
    const validGames = gameRows.filter(g => g.date)
    const events = validGames.map((g, i) => {
      const [h, m] = (g.time || '10:00').split(':').map(Number)
      const endTime = addMinutes(g.time || '10:00', 120)
      return {
        id: `game-preview-${i}`,
        event_date: g.date,
        event_time: g.time || '10:00',
        end_time: endTime,
        event_type: 'game',
        title: g.opponent ? `vs ${g.opponent}` : 'Game',
        team_id: g.team_id || null,
        team_name: teams.find(t => t.id === g.team_id)?.name || 'All Teams',
        opponent_name: g.opponent,
        venue_name: g.venue_name,
        venue_address: venues.find(v => v.name === g.venue_name)?.address || '',
        court_number: g.court_number || null,
        location_type: g.location_type,
        date_display: g.date ? new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '',
        time_display: `${formatTime12(g.time || '10:00')} – ${formatTime12(endTime)}`,
      }
    })
    setPreviewEvents(events)
  }

  // ─── Remove preview event ────────────────────────────
  function removePreviewEvent(id) {
    setPreviewEvents(prev => prev.filter(e => e.id !== id))
  }

  // ─── Submit ──────────────────────────────────────────
  async function handleCreate() {
    if (previewEvents.length === 0) return

    // Generate a series_id for all events in this batch
    const seriesId = crypto.randomUUID()

    const eventsData = previewEvents.map(e => ({
      team_id: e.team_id || null,
      event_type: e.event_type,
      title: e.title,
      notes: '',
      event_date: e.event_date,
      event_time: e.event_time,
      end_time: e.end_time,
      venue_name: e.venue_name || '',
      venue_address: e.venue_address || '',
      court_number: e.court_number || null,
      location_type: e.location_type || 'home',
      opponent_name: e.opponent_name || null,
      series_id: seriesId,
    }))

    const success = await onCreate(eventsData)
    if (success) {
      setCreatedCount(eventsData.length)
      setCreatedType(seriesType === 'recurring'
        ? (recurForm.event_type === 'practice' ? 'practices' : 'events')
        : 'games')
      setStep(3) // success
    }
  }

  // ─── Navigation helpers ──────────────────────────────
  function canProceedToPreview() {
    if (seriesType === 'recurring') {
      return recurForm.selectedDays.length > 0 && recurForm.start_date &&
        (recurForm.dateMode === 'weeks' || recurForm.end_date) &&
        previewEvents.length > 0
    }
    return gameRows.some(g => g.date)
  }

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  const modalBg = isDark ? 'bg-[#0f1b2d]' : 'bg-white'
  const cardBg = isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputCls = `w-full rounded-xl px-4 py-3 text-base border transition focus:ring-2 focus:ring-lynx-sky/40 focus:border-lynx-sky ${
    isDark ? 'bg-lynx-midnight border-white/[0.08] text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
  }`

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${modalBg} border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* ─── Header ──────────────────────────────────── */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            {step > 0 && step < 3 && (
              <button onClick={() => setStep(step === 2 ? 1 : 0)}
                className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {step === 0 ? 'Create Event Series' :
                 step === 1 ? (seriesType === 'recurring' ? 'Recurring Schedule' : 'Game Series') :
                 step === 2 ? 'Review & Create' : 'Series Created!'}
              </h2>
              {step < 3 && (
                <div className="mt-1.5">
                  <StepIndicator step={step} total={3} />
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className={`p-2 rounded-lg transition ${isDark ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-slate-400 hover:bg-slate-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Body (scrollable) ───────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ═══ STEP 0: Type Chooser ═══════════════════ */}
          {step === 0 && (
            <div className="space-y-6">
              <p className={`text-center text-base ${mutedText}`}>
                What kind of events are you creating?
              </p>
              <div className="grid grid-cols-2 gap-5">
                {/* Recurring Schedule Card */}
                <button
                  onClick={() => { setSeriesType('recurring'); setStep(1) }}
                  className={`group relative rounded-2xl border-2 p-8 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                    isDark
                      ? 'border-white/[0.06] bg-lynx-charcoal hover:border-lynx-sky/60'
                      : 'border-slate-200 bg-white hover:border-lynx-sky hover:shadow-lynx-sky/10'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
                    <Calendar className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Recurring Schedule
                  </h3>
                  <p className={`text-sm leading-relaxed ${mutedText}`}>
                    Practices, training, or conditioning that repeat on the same days every week
                  </p>
                  <div className="mt-4 flex gap-1.5">
                    {['M', 'W', 'F'].map(d => (
                      <span key={d} className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 text-xs font-bold flex items-center justify-center">
                        {d}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Game Series Card */}
                <button
                  onClick={() => { setSeriesType('games'); setStep(1) }}
                  className={`group relative rounded-2xl border-2 p-8 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                    isDark
                      ? 'border-white/[0.06] bg-lynx-charcoal hover:border-lynx-sky/60'
                      : 'border-slate-200 bg-white hover:border-lynx-sky hover:shadow-lynx-sky/10'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5">
                    <Trophy className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Game Series
                  </h3>
                  <p className={`text-sm leading-relaxed ${mutedText}`}>
                    A set of games with opponents, venues, and home/away designations
                  </p>
                  <div className="mt-4 flex gap-1.5">
                    {['🏐', 'vs', '🏐'].map((d, i) => (
                      <span key={i} className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 text-xs font-bold flex items-center justify-center">
                        {d}
                      </span>
                    ))}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 1: Recurring Schedule Form ════════ */}
          {step === 1 && seriesType === 'recurring' && (
            <div className="space-y-6">
              {/* Team + Event Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${mutedText}`}>Team</label>
                  <select value={recurForm.team_id}
                    onChange={e => setRecurForm({ ...recurForm, team_id: e.target.value })}
                    className={inputCls}>
                    <option value="">All Teams / Org-wide</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${mutedText}`}>Event Type</label>
                  <select value={recurForm.event_type}
                    onChange={e => setRecurForm({ ...recurForm, event_type: e.target.value })}
                    className={inputCls}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Day-of-Week Pills */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${mutedText}`}>Days of the Week</label>
                <div className="flex gap-2">
                  {DAYS.map(day => {
                    const selected = recurForm.selectedDays.includes(day.value)
                    return (
                      <button key={day.value}
                        onClick={() => {
                          const days = selected
                            ? recurForm.selectedDays.filter(d => d !== day.value)
                            : [...recurForm.selectedDays, day.value]
                          setRecurForm({ ...recurForm, selectedDays: days })
                        }}
                        className={`w-12 h-12 rounded-xl text-sm font-bold transition-all duration-200 ${
                          selected
                            ? 'bg-lynx-sky text-lynx-navy shadow-md shadow-lynx-sky/20 scale-105'
                            : isDark
                              ? 'bg-lynx-midnight border border-white/[0.08] text-slate-400 hover:text-white hover:border-lynx-sky/40'
                              : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-lynx-sky/40'
                        }`}>
                        {day.short}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time + Duration */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${mutedText}`}>Time & Duration</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input type="time" value={recurForm.start_time}
                      onChange={e => setRecurForm({ ...recurForm, start_time: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    {DURATION_PRESETS.map(d => (
                      <button key={d.minutes}
                        onClick={() => setRecurForm({ ...recurForm, duration: d.minutes })}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          recurForm.duration === d.minutes
                            ? 'bg-lynx-sky text-lynx-navy'
                            : isDark
                              ? 'bg-lynx-midnight border border-white/[0.08] text-slate-400 hover:text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  {formatTime12(recurForm.start_time)} – {formatTime12(addMinutes(recurForm.start_time, recurForm.duration))}
                </p>
              </div>

              {/* Venue */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${mutedText}`}>Venue</label>
                {venues.length > 0 ? (
                  <select value={recurForm.venue_name}
                    onChange={e => {
                      const v = venues.find(v => v.name === e.target.value)
                      setRecurForm({ ...recurForm, venue_name: v?.name || e.target.value, venue_address: v?.address || '' })
                    }}
                    className={inputCls}>
                    <option value="">Select venue...</option>
                    {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder="Enter venue name"
                    value={recurForm.venue_name}
                    onChange={e => setRecurForm({ ...recurForm, venue_name: e.target.value })}
                    className={inputCls} />
                )}
              </div>

              {/* Date Range */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${mutedText}`}>Date Range</label>
                <div className="flex gap-3 mb-4">
                  <button onClick={() => setRecurForm({ ...recurForm, dateMode: 'range' })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                      recurForm.dateMode === 'range'
                        ? 'bg-lynx-sky text-lynx-navy'
                        : isDark ? 'bg-lynx-midnight border border-white/[0.08] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`}>
                    Start → End Date
                  </button>
                  <button onClick={() => setRecurForm({ ...recurForm, dateMode: 'weeks' })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                      recurForm.dateMode === 'weeks'
                        ? 'bg-lynx-sky text-lynx-navy'
                        : isDark ? 'bg-lynx-midnight border border-white/[0.08] text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`}>
                    For X Weeks
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${mutedText}`}>Start Date</label>
                    <input type="date" value={recurForm.start_date}
                      onChange={e => setRecurForm({ ...recurForm, start_date: e.target.value })}
                      className={inputCls} />
                  </div>
                  {recurForm.dateMode === 'range' ? (
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${mutedText}`}>End Date</label>
                      <input type="date" value={recurForm.end_date}
                        onChange={e => setRecurForm({ ...recurForm, end_date: e.target.value })}
                        className={inputCls} />
                    </div>
                  ) : (
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${mutedText}`}>Number of Weeks</label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setRecurForm({ ...recurForm, weeks: Math.max(1, recurForm.weeks - 1) })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition ${
                            isDark ? 'bg-lynx-midnight border border-white/[0.08] text-white hover:bg-white/[0.06]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}>
                          −
                        </button>
                        <span className={`text-2xl font-bold w-12 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {recurForm.weeks}
                        </span>
                        <button onClick={() => setRecurForm({ ...recurForm, weeks: Math.min(52, recurForm.weeks + 1) })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition ${
                            isDark ? 'bg-lynx-midnight border border-white/[0.08] text-white hover:bg-white/[0.06]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}>
                          +
                        </button>
                        <span className={`text-sm ${mutedText}`}>weeks</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Count */}
              {previewEvents.length > 0 && (
                <div className={`rounded-xl p-4 flex items-center justify-between ${
                  isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-emerald-600">{previewEvents.length}</span>
                      <span className={`ml-2 text-sm ${mutedText}`}>
                        {recurForm.event_type === 'practice' ? 'practices' : 'events'} will be created
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setStep(2)}
                    disabled={previewEvents.length === 0}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-500/20 hover:bg-emerald-500/30 transition disabled:opacity-50">
                    Preview →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 1: Game Series Form ═══════════════ */}
          {step === 1 && seriesType === 'games' && (
            <div className="space-y-5">
              <p className={`text-sm ${mutedText}`}>
                Add games one at a time. Fill in the details for each match.
              </p>

              {gameRows.map((game, i) => (
                <div key={i} className={`rounded-xl border p-4 space-y-3 transition ${
                  isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                      Game {i + 1}
                    </span>
                    {gameRows.length > 1 && (
                      <button onClick={() => setGameRows(gameRows.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Team</label>
                      <select value={game.team_id}
                        onChange={e => { const r = [...gameRows]; r[i].team_id = e.target.value; setGameRows(r) }}
                        className={inputCls}>
                        <option value="">All</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Date</label>
                      <input type="date" value={game.date}
                        onChange={e => { const r = [...gameRows]; r[i].date = e.target.value; setGameRows(r) }}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Time</label>
                      <input type="time" value={game.time}
                        onChange={e => { const r = [...gameRows]; r[i].time = e.target.value; setGameRows(r) }}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Opponent</label>
                      <input type="text" placeholder="Opponent name"
                        value={game.opponent}
                        onChange={e => { const r = [...gameRows]; r[i].opponent = e.target.value; setGameRows(r) }}
                        className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Venue</label>
                      {venues.length > 0 ? (
                        <select value={game.venue_name}
                          onChange={e => { const r = [...gameRows]; r[i].venue_name = e.target.value; setGameRows(r) }}
                          className={inputCls}>
                          <option value="">Select venue</option>
                          {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                        </select>
                      ) : (
                        <input type="text" placeholder="Venue name"
                          value={game.venue_name}
                          onChange={e => { const r = [...gameRows]; r[i].venue_name = e.target.value; setGameRows(r) }}
                          className={inputCls} />
                      )}
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Court #</label>
                      <input type="text" placeholder="#"
                        value={game.court_number || ''}
                        onChange={e => { const r = [...gameRows]; r[i].court_number = e.target.value; setGameRows(r) }}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Home / Away</label>
                      <select value={game.location_type}
                        onChange={e => { const r = [...gameRows]; r[i].location_type = e.target.value; setGameRows(r) }}
                        className={inputCls}>
                        <option value="home">Home</option>
                        <option value="away">Away</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Game Row Button */}
              <button onClick={() => setGameRows([...gameRows, { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', court_number: '', location_type: 'home' }])}
                className={`w-full py-3 rounded-xl border-2 border-dashed text-sm font-bold transition flex items-center justify-center gap-2 ${
                  isDark
                    ? 'border-white/[0.08] text-slate-400 hover:border-lynx-sky/40 hover:text-lynx-sky'
                    : 'border-slate-300 text-slate-400 hover:border-lynx-sky hover:text-lynx-sky'
                }`}>
                <Plus className="w-4 h-4" /> Add Another Game
              </button>

              {/* Live Count */}
              {gameRows.some(g => g.date) && (
                <div className={`rounded-xl p-4 flex items-center justify-between ${
                  isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-amber-600">{gameRows.filter(g => g.date).length}</span>
                      <span className={`ml-2 text-sm ${mutedText}`}>games ready to create</span>
                    </div>
                  </div>
                  <button onClick={() => { generateGamePreview(); setStep(2) }}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-amber-700 bg-amber-500/20 hover:bg-amber-500/30 transition">
                    Preview →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2: Preview ════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {previewEvents.length} {seriesType === 'recurring' ? (recurForm.event_type === 'practice' ? 'practices' : 'events') : 'games'} to create
                </p>
                <div className="flex items-center gap-2">
                  <Link className={`w-4 h-4 ${mutedText}`} />
                  <span className={`text-sm ${mutedText}`}>Linked as a series</span>
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                {previewEvents.map(event => (
                  <div key={event.id} className="relative group">
                    <EventCard event={event} />
                    <button onClick={() => removePreviewEvent(event.id)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Success ════════════════════════ */}
          {step === 3 && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {createdCount} {createdType} created!
                </h3>
                <p className={`text-base ${mutedText}`}>
                  All events have been linked as a series for easy management.
                </p>
              </div>

              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-lynx-navy text-white font-bold hover:bg-lynx-navy/90 transition text-base">
                  View on Schedule
                </button>
                <button onClick={() => { setStep(0); setSeriesType(null); setPreviewEvents([]) }}
                  className="px-6 py-3 rounded-xl bg-lynx-sky/10 text-lynx-sky font-bold hover:bg-lynx-sky/20 transition text-base">
                  Create Another Series
                </button>
                {fromSeason && (
                  <button onClick={() => { onClose(); /* navigate back to season setup handled by parent */ }}
                    className={`px-6 py-3 rounded-xl border font-bold transition text-base ${
                      isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    Return to Season Setup
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer (steps 1–2 only) ─────────────────── */}
        {(step === 1 || step === 2) && (
          <div className={`px-6 py-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex items-center justify-between`}>
            <button onClick={() => setStep(step - 1)}
              className={`px-5 py-2.5 rounded-xl border font-semibold transition text-base ${
                isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              Back
            </button>

            {step === 1 && (
              <button onClick={() => setStep(2)}
                disabled={!canProceedToPreview()}
                className="px-6 py-2.5 rounded-xl bg-lynx-navy text-white font-bold hover:bg-lynx-navy/90 transition disabled:opacity-40 text-base">
                Preview ({previewEvents.length})
              </button>
            )}

            {step === 2 && (
              <button onClick={handleCreate}
                disabled={previewEvents.length === 0}
                className="px-6 py-2.5 rounded-xl bg-lynx-navy text-white font-bold hover:bg-lynx-navy/90 transition disabled:opacity-40 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Create All ({previewEvents.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
