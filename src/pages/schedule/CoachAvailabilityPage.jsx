import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { supabase } from '../../lib/supabase'
import { ChevronDown, Check, AlertTriangle } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
import InnerStatRow from '../../components/pages/InnerStatRow'
import AvailabilityModal from './AvailabilityModal'
import AvailabilityCalendar from './AvailabilityCalendar'
import AvailabilitySidebar from './AvailabilitySidebar'
import {
  toDateStr, todayStr, getCalendarDays, getDatesBetween,
} from './availabilityHelpers'

function CoachAvailabilityPage({ showToast, activeView, roleContext, onNavigate }) {
  const { profile, user, organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()

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
  const viewingCoachId = isAdmin ? selectedCoachId : myCoachId

  const cardCls = isDark
    ? 'bg-lynx-charcoal rounded-[14px] border border-white/[0.06]'
    : 'bg-white rounded-[14px] border border-slate-200 shadow-sm'

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

  // Build lookup maps
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

  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const today = todayStr()

  // Effective availability (explicit + recurring)
  const getEffectiveStatus = useCallback((dateStr) => {
    if (availabilityMap[dateStr]) return availabilityMap[dateStr]
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
    const recurring = recurringPatterns.find(p => p.recurring_day_of_week === dayOfWeek)
    if (recurring) return { ...recurring, date: dateStr, isRecurring: true }
    return null
  }, [availabilityMap, recurringPatterns])

  // Stats
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

  // Upcoming unavailable (next 30 days)
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

  // ── DATA LOADING ──
  useEffect(() => {
    if (isAdmin) loadCoaches()
  }, [isAdmin, selectedSeason?.id, selectedSport?.id])

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

      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        query = query.eq('season_id', selectedSeason.id)
      } else if (selectedSport?.id) {
        const sportSeasonIds = (allSeasons || [])
          .filter(s => s.sport_id === selectedSport.id)
          .map(s => s.id)
        if (sportSeasonIds.length === 0) {
          setCoaches([])
          return
        }
        query = query.in('season_id', sportSeasonIds)
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

      const { data: recurData } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', viewingCoachId)
        .eq('recurring', true)

      setRecurringPatterns(recurData || [])

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

  // ── ACTIONS ──
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
    if (isAdmin) return

    const dateStr = day.dateStr
    const existing = getEffectiveStatus(dateStr)

    if (e.shiftKey && lastClickedDate) {
      const range = getDatesBetween(lastClickedDate, dateStr)
      const currentMonthDates = range.filter(d => {
        const dt = new Date(d + 'T00:00:00')
        return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear
      })
      setSelectedDates(new Set(currentMonthDates))
      return
    }

    setLastClickedDate(dateStr)

    if (selectedDates.size > 0) {
      setSelectedDates(new Set())
    }

    if (existing && !existing.isRecurring) {
      removeAvailability(dateStr)
    } else {
      setModalDates([dateStr])
      setShowModal(true)
    }
  }

  async function saveAvailability({ status, reason, notes, recurring, recurringDay }) {
    if (!viewingCoachId || !myUserId) return

    try {
      const dates = modalDates.length > 0 ? modalDates : [...selectedDates]
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

  function markSelectedDates() {
    if (selectedDates.size === 0) return
    setModalDates([...selectedDates].sort())
    setShowModal(true)
  }

  function markThisWeek() {
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

  const selectedCoach = coaches.find(c => c.id === selectedCoachId)

  const statItems = [
    { value: String(monthStats.unavailable), label: 'UNAVAILABLE', icon: '❌', color: 'text-red-500' },
    { value: String(monthStats.tentative), label: 'TENTATIVE', icon: '⚠️', color: 'text-amber-500' },
    { value: String(monthStats.events), label: 'EVENTS', icon: '📅', color: 'text-blue-500' },
    ...(isAdmin ? [{ value: String(monthStats.conflicts), label: 'CONFLICTS', icon: '🔥', color: 'text-orange-500' }] : []),
  ]

  // ── Admin coach selector ──
  const coachSelectorAction = isAdmin && coaches.length > 0 ? (
    <div className="relative">
      <button
        onClick={() => setCoachDropdownOpen(!coachDropdownOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
          isDark
            ? 'bg-white/[0.06] border border-white/[0.08] hover:bg-white/10'
            : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        {selectedCoach?.photo_url ? (
          <img src={selectedCoach.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-r-xs font-bold bg-lynx-navy">
            {selectedCoach?.first_name?.[0]}{selectedCoach?.last_name?.[0]}
          </div>
        )}
        <span className={`font-medium text-r-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {selectedCoach ? `${selectedCoach.first_name} ${selectedCoach.last_name}` : 'Select Coach'}
        </span>
        <ChevronDown className={`w-4 h-4 ${tc.textMuted} transition ${coachDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {coachDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCoachDropdownOpen(false)} />
          <div className={`absolute right-0 top-full mt-2 w-72 rounded-[14px] overflow-hidden z-50 max-h-80 overflow-y-auto border shadow-2xl ${
            isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
          }`}>
            {coaches.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCoachId(c.id); setCoachDropdownOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                  selectedCoachId === c.id
                    ? isDark ? 'bg-lynx-sky/15 text-lynx-sky' : 'bg-lynx-sky/10 text-lynx-sky'
                    : isDark ? 'text-white hover:bg-white/[0.04]' : 'text-slate-800 hover:bg-lynx-cloud'
                }`}
              >
                {c.photo_url ? (
                  <img src={c.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-r-xs font-bold bg-lynx-navy">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-r-sm truncate">{c.first_name} {c.last_name}</p>
                  <p className={`text-r-xs ${tc.textMuted} truncate`}>
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
  ) : null

  // ── RENDER ──
  return (
    <PageShell
      breadcrumb={isAdmin ? 'Operations > Coach Availability' : 'My Availability'}
      title={isAdmin ? 'Coach Availability' : 'My Availability'}
      subtitle={isAdmin ? 'View coach schedules to help with planning' : "Mark dates you're unavailable for practice or games"}
      actions={coachSelectorAction}
    >
      <div className="animate-page-in">
        {!tableExists && (
          <div className={`flex items-center gap-3 p-4 rounded-[14px] mb-6 ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}>
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className={`font-medium text-r-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                Database table not found
              </p>
              <p className={`text-r-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                Run the coach_availability SQL migration in Supabase to enable this feature.
              </p>
            </div>
          </div>
        )}

        <InnerStatRow stats={statItems} />

        <div className="grid grid-cols-12 gap-6">
          <AvailabilityCalendar
            cardCls={cardCls} tc={tc} isDark={isDark} isCoach={isCoach}
            currentMonth={currentMonth} currentYear={currentYear} today={today}
            calendarDays={calendarDays} loading={loading}
            getEffectiveStatus={getEffectiveStatus} eventsMap={eventsMap} selectedDates={selectedDates}
            prevMonth={prevMonth} nextMonth={nextMonth} goToToday={goToToday} handleDayClick={handleDayClick}
            markSelectedDates={markSelectedDates} clearSelectedDates={() => setSelectedDates(new Set())}
          />

          <AvailabilitySidebar
            cardCls={cardCls} tc={tc} isDark={isDark}
            isAdmin={isAdmin} isCoach={isCoach} tableExists={tableExists}
            upcomingUnavailable={upcomingUnavailable} recurringPatterns={recurringPatterns}
            monthStats={monthStats} currentMonth={currentMonth}
            calendarDays={calendarDays} getEffectiveStatus={getEffectiveStatus} eventsMap={eventsMap}
            selectedCoach={selectedCoach}
            removeAvailability={removeAvailability} markThisWeek={markThisWeek} clearMonth={clearMonth}
          />
        </div>

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
    </PageShell>
  )
}

export { CoachAvailabilityPage }
