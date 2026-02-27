import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import {
  Calendar, ChevronLeft, ChevronRight, X, AlertTriangle,
  Clock, MapPin, Users, Trash2, Check, ChevronDown,
  Info, Repeat, CalendarCheck2, CalendarX2
} from 'lucide-react'

// ============================================
// CONSTANTS
// ============================================
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const REASONS = [
  { value: 'vacation', label: 'Vacation', icon: '🏖️' },
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'personal', label: 'Personal', icon: '🏠' },
  { value: 'injury', label: 'Injury', icon: '🩹' },
  { value: 'other', label: 'Other', icon: '📝' },
]

// ============================================
// HELPER FUNCTIONS
// ============================================
function pad(n) { return n < 10 ? '0' + n : '' + n }
function toDateStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function todayStr() { const t = new Date(); return toDateStr(t.getFullYear(), t.getMonth(), t.getDate()) }

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const days = []

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    days.push({ date: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, dateStr: toDateStr(year, month, d), isCurrentMonth: true })
  }
  // Next month padding
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    days.push({ date: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false })
  }
  return days
}

function formatDateNice(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    return (h % 12 || 12) + ':' + minutes + ' ' + (h >= 12 ? 'PM' : 'AM')
  } catch { return timeStr }
}

function getDatesBetween(start, end) {
  const dates = []
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const [from, to] = s <= e ? [s, e] : [e, s]
  const cur = new Date(from)
  while (cur <= to) {
    dates.push(toDateStr(cur.getFullYear(), cur.getMonth(), cur.getDate()))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// ============================================
// AVAILABILITY MODAL
// ============================================
function AvailabilityModal({ dates, onSave, onClose, tc, isDark }) {
  const [status, setStatus] = useState('unavailable')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [saving, setSaving] = useState(false)

  const firstDate = dates[0]
  const dayOfWeek = firstDate ? new Date(firstDate + 'T00:00:00').getDay() : 0

  async function handleSave() {
    setSaving(true)
    await onSave({ status, reason: reason || null, notes: notes || null, recurring, recurringDay: recurring ? dayOfWeek : null })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl avail-modal-enter ${
          isDark
            ? 'bg-slate-800 border border-white/[0.08]'
            : 'bg-white/95 backdrop-blur-xl border border-slate-200/60'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h3 className={`font-bold text-lg ${tc.text}`}>Mark Availability</h3>
            <p className={`text-sm ${tc.textMuted}`}>
              {dates.length === 1 ? formatDateNice(dates[0]) : `${dates.length} dates selected`}
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${tc.hoverBg}`}>
            <X className={`w-5 h-5 ${tc.textMuted}`} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>
              Status
            </label>
            <div className="flex gap-2 mt-2">
              {[
                { value: 'unavailable', label: 'Unavailable', color: 'bg-red-500', ring: 'ring-red-500/30' },
                { value: 'tentative', label: 'Tentative', color: 'bg-amber-500', ring: 'ring-amber-500/30' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    status === opt.value
                      ? `${opt.color} text-white ring-4 ${opt.ring} shadow-lg`
                      : `${isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>
              Reason (optional)
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(reason === r.value ? '' : r.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    reason === r.value
                      ? 'bg-[var(--accent-primary)] text-white shadow-md'
                      : `${isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
                  }`}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any details..."
              rows={2}
              className={`mt-2 w-full px-4 py-3 rounded-xl text-sm resize-none ${
                isDark
                  ? 'bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 focus:border-[var(--accent-primary)]'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[var(--accent-primary)]'
              } outline-none transition`}
            />
          </div>

          {/* Recurring */}
          {dates.length === 1 && (
            <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
              <button
                onClick={() => setRecurring(!recurring)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                  recurring
                    ? 'bg-[var(--accent-primary)] text-white'
                    : `${isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-300'}`
                }`}
              >
                {recurring && <Check className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-medium ${tc.text}`}>
                  <Repeat className="w-4 h-4 inline mr-1" />
                  Repeat weekly
                </p>
                <p className={`text-xs ${tc.textMuted}`}>
                  Every {DAY_NAMES_FULL[dayOfWeek]}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${tc.border} flex gap-3`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${
              isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COACH AVAILABILITY PAGE
// ============================================
function CoachAvailabilityPage({ showToast, activeView, roleContext, onNavigate }) {
  const { profile, user, organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const { selectedSeason } = useSeason()

  // Calendar state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

  // Data state
  const [availability, setAvailability] = useState([])
  const [recurringPatterns, setRecurringPatterns] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)

  // Selection state
  const [selectedDates, setSelectedDates] = useState(new Set())
  const [lastClickedDate, setLastClickedDate] = useState(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalDates, setModalDates] = useState([])

  // Admin state
  const [coaches, setCoaches] = useState([])
  const [selectedCoachId, setSelectedCoachId] = useState(null)
  const [coachDropdownOpen, setCoachDropdownOpen] = useState(false)

  const isAdmin = activeView === 'admin'
  const isCoach = activeView === 'coach'
  const myCoachId = roleContext?.coachInfo?.id
  const myUserId = profile?.id

  // Determine which coach we're viewing
  const viewingCoachId = isAdmin ? selectedCoachId : myCoachId

  // Get team IDs for the coach we're viewing
  const getCoachTeamIds = useCallback(() => {
    if (isCoach) {
      return roleContext?.coachInfo?.team_coaches?.map(tc => tc.team_id).filter(Boolean) || []
    }
    if (isAdmin && selectedCoachId) {
      const coach = coaches.find(c => c.id === selectedCoachId)
      return coach?.team_coaches?.map(tc => tc.team_id).filter(Boolean) || []
    }
    return []
  }, [isCoach, isAdmin, selectedCoachId, coaches, roleContext])

  // ── Build lookup maps ──
  const availabilityMap = useMemo(() => {
    const map = {}
    availability.forEach(a => { map[a.date] = a })
    return map
  }, [availability])

  const eventsMap = useMemo(() => {
    const map = {}
    events.forEach(e => {
      const d = e.event_date
      if (!map[d]) map[d] = []
      map[d].push(e)
    })
    return map
  }, [events])

  // ── Compute calendar days ──
  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const today = todayStr()

  // ── Effective availability (explicit + recurring) ──
  const getEffectiveStatus = useCallback((dateStr) => {
    // Explicit record takes priority
    if (availabilityMap[dateStr]) return availabilityMap[dateStr]
    // Check recurring patterns
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
    const recurring = recurringPatterns.find(p => p.recurring_day_of_week === dayOfWeek)
    if (recurring) return { ...recurring, date: dateStr, isRecurring: true }
    return null
  }, [availabilityMap, recurringPatterns])

  // ── Stats ──
  const monthStats = useMemo(() => {
    let unavailable = 0, tentative = 0, conflicts = 0
    const monthEvents = new Set()
    calendarDays.filter(d => d.isCurrentMonth).forEach(d => {
      const status = getEffectiveStatus(d.dateStr)
      if (status?.status === 'unavailable') unavailable++
      if (status?.status === 'tentative') tentative++
      if (status && (eventsMap[d.dateStr]?.length || 0) > 0) conflicts++
      if (eventsMap[d.dateStr]) eventsMap[d.dateStr].forEach(e => monthEvents.add(e.id))
    })
    return { unavailable, tentative, events: monthEvents.size, conflicts }
  }, [calendarDays, getEffectiveStatus, eventsMap])

  // ── Upcoming unavailable (next 30 days) ──
  const upcomingUnavailable = useMemo(() => {
    const t = new Date()
    const items = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(t)
      d.setDate(d.getDate() + i)
      const ds = toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
      const status = getEffectiveStatus(ds)
      if (status && status.status !== 'available') {
        items.push({ dateStr: ds, ...status })
      }
    }
    return items
  }, [getEffectiveStatus])

  // ============================================
  // DATA LOADING
  // ============================================
  useEffect(() => {
    if (isAdmin) loadCoaches()
  }, [isAdmin, selectedSeason?.id])

  useEffect(() => {
    if (viewingCoachId) loadData()
    else { setAvailability([]); setRecurringPatterns([]); setEvents([]); setLoading(false) }
  }, [viewingCoachId, currentYear, currentMonth])

  async function loadCoaches() {
    try {
      let query = supabase
        .from('coaches')
        .select('id, first_name, last_name, photo_url, status, team_coaches(team_id, role, teams(id, name, color))')
        .eq('status', 'active')
        .order('last_name', { ascending: true })

      if (selectedSeason?.id) {
        query = query.eq('season_id', selectedSeason.id)
      }

      const { data } = await query
      setCoaches(data || [])
      if (data?.length > 0 && !selectedCoachId) {
        setSelectedCoachId(data[0].id)
      }
    } catch (err) {
      console.error('Error loading coaches:', err)
    }
  }

  async function loadData() {
    setLoading(true)
    try {
      const firstOfMonth = toDateStr(currentYear, currentMonth, 1)
      const lastOfMonth = toDateStr(currentYear, currentMonth, new Date(currentYear, currentMonth + 1, 0).getDate())

      // Load availability records for this month
      const { data: availData, error: availErr } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', viewingCoachId)
        .gte('date', firstOfMonth)
        .lte('date', lastOfMonth)
        .order('date', { ascending: true })

      if (availErr) {
        if (availErr.message?.includes('does not exist') || availErr.code === '42P01') {
          setTableExists(false)
          setLoading(false)
          return
        }
        throw availErr
      }
      setTableExists(true)
      setAvailability(availData || [])

      // Load recurring patterns
      const { data: recurData } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', viewingCoachId)
        .eq('recurring', true)

      setRecurringPatterns(recurData || [])

      // Load events for coach's teams
      const teamIds = getCoachTeamIds()
      if (teamIds.length > 0) {
        const { data: evtData } = await supabase
          .from('schedule_events')
          .select('*, teams!schedule_events_team_id_fkey(id, name, color)')
          .in('team_id', teamIds)
          .gte('event_date', firstOfMonth)
          .lte('event_date', lastOfMonth)
          .order('event_date', { ascending: true })

        setEvents(evtData || [])
      } else {
        setEvents([])
      }
    } catch (err) {
      console.error('Error loading availability:', err)
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        setTableExists(false)
      }
    }
    setLoading(false)
  }

  // ============================================
  // ACTIONS
  // ============================================
  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) }
    else setCurrentMonth(currentMonth - 1)
    setSelectedDates(new Set())
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) }
    else setCurrentMonth(currentMonth + 1)
    setSelectedDates(new Set())
  }
  function goToToday() {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    setSelectedDates(new Set())
  }

  function handleDayClick(day, e) {
    if (!day.isCurrentMonth) return
    if (isAdmin) return // Admin view is read-only

    const dateStr = day.dateStr
    const existing = getEffectiveStatus(dateStr)

    if (e.shiftKey && lastClickedDate) {
      // Shift-click: select range
      const range = getDatesBetween(lastClickedDate, dateStr)
      // Only include current month dates
      const currentMonthDates = range.filter(d => {
        const dt = new Date(d + 'T00:00:00')
        return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear
      })
      setSelectedDates(new Set(currentMonthDates))
      return
    }

    setLastClickedDate(dateStr)

    // If dates are already selected and this click is part of selection workflow
    if (selectedDates.size > 0) {
      setSelectedDates(new Set())
    }

    if (existing && !existing.isRecurring) {
      // Remove existing availability
      removeAvailability(dateStr)
    } else {
      // Open modal to add
      setModalDates([dateStr])
      setShowModal(true)
    }
  }

  async function saveAvailability({ status, reason, notes, recurring, recurringDay }) {
    if (!viewingCoachId || !myUserId) return

    try {
      const dates = modalDates.length > 0 ? modalDates : [...selectedDates]

      // If recurring, generate dates for next 12 weeks
      let allDates = [...dates]
      if (recurring && dates.length === 1) {
        const startDate = new Date(dates[0] + 'T00:00:00')
        for (let w = 1; w <= 12; w++) {
          const d = new Date(startDate)
          d.setDate(d.getDate() + (w * 7))
          allDates.push(toDateStr(d.getFullYear(), d.getMonth(), d.getDate()))
        }
      }

      const records = allDates.map(d => ({
        coach_id: viewingCoachId,
        user_id: myUserId,
        date: d,
        status,
        reason,
        notes,
        recurring: recurring && d === dates[0],
        recurring_day_of_week: recurring ? recurringDay : null,
      }))

      const { error } = await supabase
        .from('coach_availability')
        .upsert(records, { onConflict: 'coach_id,date' })

      if (error) throw error

      showToast?.(`Marked ${allDates.length} day${allDates.length > 1 ? 's' : ''} as ${status}`, 'success')
      setShowModal(false)
      setModalDates([])
      setSelectedDates(new Set())
      loadData()
    } catch (err) {
      console.error('Error saving availability:', err)
      showToast?.('Failed to save availability', 'error')
    }
  }

  async function removeAvailability(dateStr) {
    try {
      const { error } = await supabase
        .from('coach_availability')
        .delete()
        .eq('coach_id', viewingCoachId)
        .eq('date', dateStr)

      if (error) throw error
      showToast?.('Availability cleared', 'success')
      loadData()
    } catch (err) {
      console.error('Error removing availability:', err)
      showToast?.('Failed to remove', 'error')
    }
  }

  async function markSelectedDates() {
    if (selectedDates.size === 0) return
    setModalDates([...selectedDates].sort())
    setShowModal(true)
  }

  async function markThisWeek() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + (i - dayOfWeek))
      dates.push(toDateStr(d.getFullYear(), d.getMonth(), d.getDate()))
    }
    setModalDates(dates)
    setShowModal(true)
  }

  async function clearMonth() {
    if (!viewingCoachId) return
    const firstOfMonth = toDateStr(currentYear, currentMonth, 1)
    const lastOfMonth = toDateStr(currentYear, currentMonth, new Date(currentYear, currentMonth + 1, 0).getDate())

    try {
      const { error } = await supabase
        .from('coach_availability')
        .delete()
        .eq('coach_id', viewingCoachId)
        .gte('date', firstOfMonth)
        .lte('date', lastOfMonth)

      if (error) throw error
      showToast?.('Cleared all availability for this month', 'success')
      loadData()
    } catch (err) {
      console.error('Error clearing month:', err)
      showToast?.('Failed to clear month', 'error')
    }
  }

  // ── Selected coach info for admin view ──
  const selectedCoach = coaches.find(c => c.id === selectedCoachId)

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6 avail-page">
      <style>{`
        .avail-page { animation: availFadeIn 0.4s ease-out; }
        @keyframes availFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .avail-modal-enter { animation: availModalIn 0.25s ease-out; }
        @keyframes availModalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .avail-day-cell { transition: all 0.15s ease; user-select: none; }
        .avail-day-cell:hover { transform: scale(1.05); z-index: 2; }
        .avail-day-cell.unavailable { background: ${isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'}; }
        .avail-day-cell.tentative { background: ${isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)'}; }
        .avail-day-cell.selected { outline: 2px solid var(--accent-primary); outline-offset: -2px; }
        .avail-day-cell.is-today { box-shadow: inset 0 0 0 2px var(--accent-primary); border-radius: 12px; }
        .avail-stat-card { animation: availStatIn 0.5s ease-out backwards; }
        .avail-stat-card:nth-child(1) { animation-delay: 0.05s; }
        .avail-stat-card:nth-child(2) { animation-delay: 0.1s; }
        .avail-stat-card:nth-child(3) { animation-delay: 0.15s; }
        .avail-stat-card:nth-child(4) { animation-delay: 0.2s; }
        @keyframes availStatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ══════════════════════════════════════
          PAGE HEADER
          ══════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${tc.text}`}>
            {isAdmin ? 'Coach Availability' : 'My Availability'}
          </h1>
          <p className={`${tc.textMuted} text-sm mt-1`}>
            {isAdmin ? 'View coach schedules to help with planning' : 'Mark dates you\'re unavailable for practice or games'}
          </p>
        </div>

        {/* Admin: Coach Selector */}
        {isAdmin && coaches.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setCoachDropdownOpen(!coachDropdownOpen)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                isDark
                  ? 'bg-white/[0.06] border border-white/[0.08] hover:bg-white/10'
                  : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {selectedCoach?.photo_url ? (
                <img src={selectedCoach.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: accent.primary }}>
                  {selectedCoach?.first_name?.[0]}{selectedCoach?.last_name?.[0]}
                </div>
              )}
              <span className={`font-medium text-sm ${tc.text}`}>
                {selectedCoach ? `${selectedCoach.first_name} ${selectedCoach.last_name}` : 'Select Coach'}
              </span>
              <ChevronDown className={`w-4 h-4 ${tc.textMuted} transition ${coachDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {coachDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCoachDropdownOpen(false)} />
                <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto ${
                  isDark
                    ? 'bg-slate-800 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
                    : 'bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
                }`}>
                  {coaches.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCoachId(c.id); setCoachDropdownOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                        selectedCoachId === c.id
                          ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                          : `${tc.text} ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'}`
                      }`}
                    >
                      {c.photo_url ? (
                        <img src={c.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: accent.primary }}>
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.first_name} {c.last_name}</p>
                        <p className={`text-xs ${tc.textMuted} truncate`}>
                          {c.team_coaches?.map(t => t.teams?.name).filter(Boolean).join(', ') || 'No team'}
                        </p>
                      </div>
                      {selectedCoachId === c.id && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table doesn't exist warning */}
      {!tableExists && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className={`font-medium text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Database table not found</p>
            <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
              Run the coach_availability SQL migration in Supabase to enable this feature.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MAIN CONTENT: CALENDAR + SIDEBAR
          ══════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">

        {/* ─── CALENDAR ─── */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className={`rounded-xl overflow-hidden ${
            isDark
              ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]'
              : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
          }`}>
            {/* Month Navigation */}
            <div className={`px-6 py-4 flex items-center justify-between border-b ${tc.border}`}>
              <button
                onClick={prevMonth}
                className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                <ChevronLeft className={`w-5 h-5 ${tc.text}`} />
              </button>
              <div className="text-center">
                <h2
                  className={`text-2xl font-bold tracking-tight ${tc.text}`}
                >
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={goToToday}
                  className="text-xs text-[var(--accent-primary)] hover:underline font-medium"
                >
                  Today
                </button>
              </div>
              <button
                onClick={nextMonth}
                className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                <ChevronRight className={`w-5 h-5 ${tc.text}`} />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7">
              {DAY_NAMES.map(d => (
                <div
                  key={d}
                  className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${tc.textMuted}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const status = day.isCurrentMonth ? getEffectiveStatus(day.dateStr) : null
                  const dayEvents = eventsMap[day.dateStr] || []
                  const isToday = day.dateStr === today
                  const isSelected = selectedDates.has(day.dateStr)
                  const hasConflict = status && status.status === 'unavailable' && dayEvents.length > 0

                  const statusClass = status?.status === 'unavailable' ? 'unavailable'
                    : status?.status === 'tentative' ? 'tentative'
                    : ''

                  return (
                    <div
                      key={day.dateStr}
                      onClick={(e) => handleDayClick(day, e)}
                      className={`
                        avail-day-cell relative min-h-[80px] sm:min-h-[90px] p-1.5 sm:p-2 border-b border-r
                        ${tc.border}
                        ${!day.isCurrentMonth ? 'opacity-30' : (isCoach ? 'cursor-pointer' : '')}
                        ${statusClass}
                        ${isSelected ? 'selected' : ''}
                        ${isToday ? 'is-today' : ''}
                        ${idx % 7 === 0 ? 'border-l' : ''}
                        ${idx < 7 ? 'border-t' : ''}
                      `}
                    >
                      {/* Date Number */}
                      <div className="flex items-start justify-between">
                        <span className={`text-sm font-semibold ${
                          isToday ? 'text-[var(--accent-primary)]'
                          : day.isCurrentMonth ? tc.text
                          : tc.textMuted
                        }`}>
                          {day.date}
                        </span>

                        {/* Status + Conflict indicators */}
                        <div className="flex items-center gap-0.5">
                          {status?.isRecurring && (
                            <Repeat className="w-3 h-3 text-slate-400" />
                          )}
                          {hasConflict && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Scheduling conflict" />
                          )}
                          {status?.status === 'unavailable' && !status?.isRecurring && (
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          )}
                          {status?.status === 'tentative' && !status?.isRecurring && (
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          )}
                        </div>
                      </div>

                      {/* Reason label */}
                      {status?.reason && day.isCurrentMonth && (
                        <p className={`text-[10px] mt-0.5 truncate ${
                          status.status === 'unavailable' ? 'text-red-500' : 'text-amber-600'
                        }`}>
                          {REASONS.find(r => r.value === status.reason)?.icon} {status.reason}
                        </p>
                      )}

                      {/* Event dots */}
                      {dayEvents.length > 0 && day.isCurrentMonth && (
                        <div className="flex flex-wrap gap-0.5 mt-auto pt-1">
                          {dayEvents.slice(0, 3).map((evt, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-0.5"
                              title={`${evt.event_type}: ${evt.title || ''} ${evt.event_time ? formatTime12(evt.event_time) : ''}`}
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: evt.teams?.color || (evt.event_type === 'game' ? '#F59E0B' : '#8B5CF6') }}
                              />
                              <span className={`text-[9px] hidden sm:inline truncate max-w-[50px] ${tc.textMuted}`}>
                                {evt.event_type === 'game' ? 'Game' : 'Prac'}
                              </span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className={`text-[9px] ${tc.textMuted}`}>+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div className={`px-6 py-3 border-t ${tc.border} flex flex-wrap items-center gap-4`}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500/60 border border-emerald-500" />
                <span className={`text-xs ${tc.textMuted}`}>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className={`text-xs ${tc.textMuted}`}>Unavailable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className={`text-xs ${tc.textMuted}`}>Tentative</span>
              </div>
              <div className={`w-px h-4 ${tc.border}`} />
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className={`text-xs ${tc.textMuted}`}>Game</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                <span className={`text-xs ${tc.textMuted}`}>Practice</span>
              </div>
              {isCoach && (
                <>
                  <div className={`w-px h-4 ${tc.border}`} />
                  <span className={`text-xs ${tc.textMuted}`}>
                    <Info className="w-3 h-3 inline mr-1" />
                    Click to toggle, Shift+Click for range
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Selection Actions Bar */}
          {selectedDates.size > 0 && isCoach && (
            <div
              className={`flex items-center gap-3 p-4 rounded-xl ${
                isDark
                  ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20'
                  : 'bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20'
              }`}
            >
              <CalendarCheck2 className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
              <span className={`text-sm font-medium ${tc.text} flex-1`}>
                {selectedDates.size} date{selectedDates.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={markSelectedDates}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition"
              >
                Mark Selected
              </button>
              <button
                onClick={() => setSelectedDates(new Set())}
                className={`px-3 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'} transition`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ─── SIDEBAR ─── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Month Stats */}
          <div className={`rounded-xl p-5 ${
            isDark
              ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]'
              : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
          }`}>
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-4 ${tc.textMuted}`}
            >
              This Month
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`avail-stat-card p-3 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                <p className="text-2xl font-bold text-red-500">{monthStats.unavailable}</p>
                <p className={`text-xs ${tc.textMuted}`}>Unavailable</p>
              </div>
              <div className={`avail-stat-card p-3 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <p className="text-2xl font-bold text-amber-500">{monthStats.tentative}</p>
                <p className={`text-xs ${tc.textMuted}`}>Tentative</p>
              </div>
              <div className={`avail-stat-card p-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <p className="text-2xl font-bold text-blue-500">{monthStats.events}</p>
                <p className={`text-xs ${tc.textMuted}`}>Events</p>
              </div>
              {isAdmin && (
                <div className={`avail-stat-card p-3 rounded-xl ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                  <p className="text-2xl font-bold text-orange-500">{monthStats.conflicts}</p>
                  <p className={`text-xs ${tc.textMuted}`}>Conflicts</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Unavailable */}
          <div className={`rounded-xl overflow-hidden ${
            isDark
              ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]'
              : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
          }`}>
            <div className={`px-5 py-3 border-b ${tc.border}`}>
              <h3
                className={`text-sm font-bold uppercase tracking-wider ${tc.textMuted}`}
              >
                Upcoming Unavailable
              </h3>
            </div>
            <div className="p-3">
              {upcomingUnavailable.length === 0 ? (
                <div className="py-6 text-center">
                  <CalendarCheck2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                  <p className={`text-sm font-medium ${tc.text}`}>All clear!</p>
                  <p className={`text-xs ${tc.textMuted}`}>No upcoming unavailable dates</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {upcomingUnavailable.slice(0, 8).map((item, idx) => (
                    <div
                      key={item.dateStr + idx}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.status === 'unavailable' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${tc.text}`}>{formatDateNice(item.dateStr)}</p>
                        {item.reason && (
                          <p className={`text-xs ${tc.textMuted} capitalize`}>
                            {REASONS.find(r => r.value === item.reason)?.icon} {item.reason}
                            {item.isRecurring && ' (recurring)'}
                          </p>
                        )}
                      </div>
                      {isCoach && !item.isRecurring && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeAvailability(item.dateStr) }}
                          className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-red-50'}`}
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recurring Patterns */}
          {recurringPatterns.length > 0 && (
            <div className={`rounded-xl overflow-hidden ${
              isDark
                ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]'
                : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
            }`}>
              <div className={`px-5 py-3 border-b ${tc.border}`}>
                <h3
                  className={`text-sm font-bold uppercase tracking-wider ${tc.textMuted}`}
                >
                  <Repeat className="w-4 h-4 inline mr-1" />
                  Recurring Patterns
                </h3>
              </div>
              <div className="p-3 space-y-1">
                {recurringPatterns.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}
                  >
                    <Repeat className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${tc.text}`}>
                        Every {DAY_NAMES_FULL[p.recurring_day_of_week]}
                      </p>
                      {p.reason && (
                        <p className={`text-xs ${tc.textMuted} capitalize`}>{p.reason}</p>
                      )}
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      p.status === 'unavailable' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions — Coach only */}
          {isCoach && tableExists && (
            <div className={`rounded-xl p-5 ${
              isDark
                ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]'
                : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
            }`}>
              <h3
                className={`text-sm font-bold uppercase tracking-wider mb-4 ${tc.textMuted}`}
              >
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={markThisWeek}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isDark
                      ? 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CalendarX2 className="w-5 h-5 text-red-400" />
                  Mark This Week Unavailable
                </button>
                <button
                  onClick={clearMonth}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isDark
                      ? 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Trash2 className="w-5 h-5 text-slate-400" />
                  Clear All for {MONTH_NAMES[currentMonth]}
                </button>
              </div>
            </div>
          )}

          {/* Admin Conflict Summary */}
          {isAdmin && monthStats.conflicts > 0 && (
            <div className={`rounded-xl overflow-hidden ${
              isDark
                ? 'bg-amber-500/5 border border-amber-500/20'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className={`px-5 py-3 border-b ${isDark ? 'border-amber-500/10' : 'border-amber-200'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Scheduling Conflicts
                </h3>
              </div>
              <div className="p-4">
                <p className={`text-sm ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
                  {monthStats.conflicts} day{monthStats.conflicts > 1 ? 's' : ''} where {selectedCoach?.first_name || 'this coach'} is unavailable but has scheduled events.
                </p>
                <div className="mt-3 space-y-1">
                  {calendarDays.filter(d => d.isCurrentMonth).map(d => {
                    const status = getEffectiveStatus(d.dateStr)
                    const dayEvents = eventsMap[d.dateStr] || []
                    if (!status || status.status !== 'unavailable' || dayEvents.length === 0) return null
                    return (
                      <div key={d.dateStr} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/[0.04]' : 'bg-white/60'}`}>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className={`text-xs font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                          {formatDateNice(d.dateStr)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-amber-600'}`}>
                          — {dayEvents.map(e => e.event_type === 'game' ? 'Game' : 'Practice').join(', ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          MODAL
          ══════════════════════════════════════ */}
      {showModal && (
        <AvailabilityModal
          dates={modalDates}
          onSave={saveAvailability}
          onClose={() => { setShowModal(false); setModalDates([]) }}
          tc={tc}
          isDark={isDark}
        />
      )}
    </div>
  )
}

export { CoachAvailabilityPage }
