import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, Calendar, MapPin, Clock, Edit, Trash2, Check, X,
  ChevronLeft, ChevronRight, BarChart3, Star, CheckSquare, ClipboardList, User,
  Phone, Mail, Award
} from '../../constants/icons'
import { PlayerCard, PlayerCardExpanded } from '../../components/players'
import { ClickableCoachName, CoachDetailModal } from '../../pages/coaches/CoachesPage'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
      <path d="M2 12a15.3 15.3 0 0 0 10 4 15.3 15.3 0 0 0 10-4" />
    </svg>
  )
}

// Placeholder LineupBuilder - full version available in Game Prep page
function LineupBuilder({ event, team, onClose, showToast }) {
  const tc = useThemeClasses()
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={tc.cardBg + ' rounded-2xl w-full max-w-md p-6 text-center'}>
        <VolleyballIcon className="w-16 h-16 mx-auto mb-4 text-[var(--accent-primary)]" />
        <h2 className={'text-xl font-bold mb-2 ' + tc.text}>Lineup Builder</h2>
        <p className={tc.textMuted + ' mb-4'}>Full lineup builder available in Game Prep section</p>
        <button onClick={onClose} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-medium">
          Close
        </button>
      </div>
    </div>
  )
}

// Helper functions
function getEventColor(type) {
  const colors = {
    practice: '#10B981',
    game: '#F59E0B',
    tournament: '#8B5CF6',
    team_event: '#3B82F6',
    other: '#6B7280'
  }
  return colors[type] || colors.other
}

function formatTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function SchedulePage({ showToast, activeView }) {
  const journey = useJourney()
  const { organization } = useAuth()
  const { selectedSeason } = useSeason()
  const [events, setEvents] = useState([])
  const [teams, setTeams] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('month') // month, week, day, list
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedEventType, setSelectedEventType] = useState('all')
  
  // Modals
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showBulkPractice, setShowBulkPractice] = useState(false)
  const [showBulkGames, setShowBulkGames] = useState(false)
  const [showVenueManager, setShowVenueManager] = useState(false)
  const [showAvailabilitySurvey, setShowAvailabilitySurvey] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showQuickActions, setShowQuickActions] = useState(false)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadEvents()
      loadTeams()
      loadVenues()
    }
  }, [selectedSeason?.id, currentDate])

  async function loadEvents() {
    if (!selectedSeason?.id) {
      console.log('loadEvents: No season selected')
      return
    }
    setLoading(true)
    
    // Get date range based on view
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Format as YYYY-MM-DD for date comparison
    const startDate = startOfMonth.toISOString().split('T')[0]
    const endDate = endOfMonth.toISOString().split('T')[0]
    
    console.log('loadEvents: Querying with', {
      season_id: selectedSeason.id,
      startDate,
      endDate
    })
    
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*, teams!schedule_events_team_id_fkey(id, name, color)')
      .eq('season_id', selectedSeason.id)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
    
    console.log('loadEvents: Result', { data, error, count: data?.length })
    
    if (error) console.error('Error loading events:', error)
    
    // Transform data to add computed start_time for calendar views
    const transformedData = (data || []).map(event => ({
      ...event,
      // Combine event_date and event_time into a start_time for calendar compatibility
      start_time: event.event_date && event.event_time 
        ? `${event.event_date}T${event.event_time}` 
        : event.event_date,
      // Also create end_time timestamp if end_time exists
      end_time_full: event.event_date && event.end_time 
        ? `${event.event_date}T${event.end_time}` 
        : null
    }))
    
    setEvents(transformedData)
    setLoading(false)
  }

  async function loadTeams() {
    if (!selectedSeason?.id) return
    const { data } = await supabase
      .from('teams')
      .select('id, name, color')
      .eq('season_id', selectedSeason.id)
      .order('name')
    setTeams(data || [])
  }

  async function loadVenues() {
    if (!organization?.id) return
    // Load from org settings or a venues table
    const savedVenues = organization.settings?.venues || []
    setVenues(savedVenues)
  }

  async function saveVenues(newVenues) {
    const newSettings = { ...organization.settings, venues: newVenues }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setVenues(newVenues)
    showToast('Venues saved!', 'success')
  }

  async function createEvent(eventData) {
    try {
      const { error } = await supabase.from('schedule_events').insert({
        ...eventData,
        season_id: selectedSeason.id,
        created_at: new Date().toISOString()
      })
      if (error) throw error
      showToast('Event created!', 'success')
      journey?.completeStep('create_schedule')
      loadEvents()
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  async function createBulkEvents(eventsData, notify = false) {
    try {
      const events = eventsData.map(e => ({
        ...e,
        season_id: selectedSeason.id,
        created_at: new Date().toISOString()
      }))
      const { error } = await supabase.from('schedule_events').insert(events)
      if (error) throw error
      showToast(`${events.length} events created!`, 'success')
      journey?.completeStep('create_schedule')
      loadEvents()
      // TODO: If notify, trigger notification to families
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  async function updateEvent(eventId, eventData) {
    try {
      const { error } = await supabase
        .from('schedule_events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', eventId)
      if (error) throw error
      showToast('Event updated!', 'success')
      loadEvents()
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  async function deleteEvent(eventId) {
    if (!confirm('Delete this event?')) return
    try {
      const { error } = await supabase.from('schedule_events').delete().eq('id', eventId)
      if (error) throw error
      showToast('Event deleted', 'success')
      setSelectedEvent(null)
      loadEvents()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  // Filter events - show org-wide events (null team_id) always, plus team-specific events
  const filteredEvents = events.filter(e => {
    // If "All Teams" selected, show everything
    if (selectedTeam === 'all') {
      // Just filter by event type if needed
      if (selectedEventType !== 'all' && e.event_type !== selectedEventType) return false
      return true
    }
    
    // If specific team selected, show: team's events + org-wide events (null team_id)
    if (e.team_id !== selectedTeam && e.team_id !== null) return false
    if (selectedEventType !== 'all' && e.event_type !== selectedEventType) return false
    return true
  })

  // Navigation helpers
  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  function goToToday() {
    setCurrentDate(new Date())
  }

  // Generate iCal export
  function exportToICal() {
    const icsEvents = filteredEvents.map(event => {
      const start = new Date(event.start_time)
      const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 60 * 60 * 1000)
      
      const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      
      return `BEGIN:VEVENT
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${event.title || event.event_type}
DESCRIPTION:${event.description || ''}
LOCATION:${event.venue_name || ''} ${event.venue_address || ''}
END:VEVENT`
    }).join('\n')

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VolleyBrain//Schedule//EN
${icsEvents}
END:VCALENDAR`

    const blob = new Blob([ical], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `volleybrain-schedule-${selectedSeason?.name || 'calendar'}.ics`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Calendar exported!', 'success')
  }

  if (!selectedSeason) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Please select a season from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Schedule</h1>
          <p className="text-slate-400 mt-1">Manage practices, games, and events • {selectedSeason.name}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToICal} className="bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-600 flex items-center gap-2">
            📅 Export iCal
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="bg-[var(--accent-primary)] text-white font-semibold px-4 py-2 rounded-xl hover:brightness-110 flex items-center gap-2"
            >
              ➕ Add Events ▾
            </button>
            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-700 border border-slate-700 rounded-xl shadow-xl z-20">
                <button onClick={() => { setShowAddEvent(true); setShowQuickActions(false) }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 rounded-t-xl flex items-center gap-3">
                  <span>📝</span> Single Event
                </button>
                <button onClick={() => { setShowBulkPractice(true); setShowQuickActions(false) }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 flex items-center gap-3">
                  <span>🔄</span> Recurring Practice
                </button>
                <button onClick={() => { setShowBulkGames(true); setShowQuickActions(false) }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 flex items-center gap-3">
                  <VolleyballIcon className="w-4 h-4" /> Bulk Add Games
                </button>
                <button onClick={() => { setShowVenueManager(true); setShowQuickActions(false) }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 flex items-center gap-3">
                  <span>📍</span> Manage Venues
                </button>
                <button onClick={() => { setShowAvailabilitySurvey(true); setShowQuickActions(false) }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 rounded-b-xl flex items-center gap-3">
                  <BarChart3 className="w-5 h-5" /> Availability Survey
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
            <option value="all">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={selectedEventType} onChange={e => setSelectedEventType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
            <option value="all">All Types</option>
            <option value="practice">Practices</option>
            <option value="game">Games</option>
            <option value="tournament">Tournaments</option>
            <option value="team_event">Team Events</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            {['month', 'week', 'day', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                  view === v ? 'bg-[var(--accent-primary)] text-white' : 'text-slate-400 hover:text-white'
                }`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl p-4">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-white">← Prev</button>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToToday} className="px-3 py-1 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600">
            Today
          </button>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-white">Next →</button>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading schedule...</div>
      ) : view === 'month' ? (
        <MonthView 
          events={filteredEvents} 
          currentDate={currentDate} 
          onSelectEvent={setSelectedEvent}
          onSelectDate={(date) => { setCurrentDate(date); setView('day') }}
          teams={teams}
        />
      ) : view === 'week' ? (
        <WeekView 
          events={filteredEvents} 
          currentDate={currentDate}
          onSelectEvent={setSelectedEvent}
          teams={teams}
        />
      ) : view === 'day' ? (
        <DayView 
          events={filteredEvents} 
          currentDate={currentDate}
          onSelectEvent={setSelectedEvent}
          teams={teams}
        />
      ) : (
        <ListView 
          events={filteredEvents}
          onSelectEvent={setSelectedEvent}
          teams={teams}
        />
      )}

      {/* Event Count */}
      <div className="text-center text-slate-500 text-sm">
        {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} this month
      </div>

      {/* Modals */}
      {showAddEvent && (
        <AddEventModal
          teams={teams}
          venues={venues}
          onClose={() => setShowAddEvent(false)}
          onCreate={createEvent}
        />
      )}

      {showBulkPractice && (
        <BulkPracticeModal
          teams={teams}
          venues={venues}
          onClose={() => setShowBulkPractice(false)}
          onCreate={createBulkEvents}
        />
      )}

      {showBulkGames && (
        <BulkGamesModal
          teams={teams}
          venues={venues}
          onClose={() => setShowBulkGames(false)}
          onCreate={createBulkEvents}
        />
      )}

      {showVenueManager && (
        <VenueManagerModal
          venues={venues}
          onClose={() => setShowVenueManager(false)}
          onSave={saveVenues}
        />
      )}

      {showAvailabilitySurvey && (
        <AvailabilitySurveyModal
          teams={teams}
          organization={organization}
          onClose={() => setShowAvailabilitySurvey(false)}
          showToast={showToast}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          teams={teams}
          venues={venues}
          onClose={() => setSelectedEvent(null)}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
          activeView={activeView}
        />
      )}

      {/* Click outside to close quick actions */}
      {showQuickActions && (
        <div className="fixed inset-0 z-10" onClick={() => setShowQuickActions(false)} />
      )}
    </div>
  )
}
// Export added at end
// ============================================
// CALENDAR VIEWS
// ============================================
function MonthView({ events, currentDate, onSelectEvent, onSelectDate, teams }) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = []
  for (let i = 0; i < startPadding; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getEventsForDay = (day) => {
    if (!day) return []
    const dayStart = new Date(year, month, day)
    const dayEnd = new Date(year, month, day, 23, 59, 59)
    return events.filter(e => {
      const eventDate = new Date(e.start_time)
      return eventDate >= dayStart && eventDate <= dayEnd
    })
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-3 text-center text-sm font-medium text-slate-400">{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          return (
            <div 
              key={i} 
              className={`min-h-[100px] p-2 border-b border-r border-slate-700 ${!day ? 'bg-slate-900' : 'hover:bg-slate-700 cursor-pointer'}`}
              onClick={() => day && onSelectDate(new Date(year, month, day))}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'w-7 h-7 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center' : 'text-white'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div 
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onSelectEvent(event) }}
                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ 
                          backgroundColor: getEventColor(event.event_type) + '30',
                          color: getEventColor(event.event_type),
                          borderLeft: `3px solid ${event.teams?.color || getEventColor(event.event_type)}`
                        }}
                      >
                        {formatTime(event.start_time)} {event.title || event.event_type}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ events, currentDate, onSelectEvent, teams }) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  const hours = []
  for (let h = 6; h <= 22; h++) {
    hours.push(h)
  }

  const getEventsForDayHour = (day, hour) => {
    return events.filter(e => {
      const eventDate = new Date(e.start_time)
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getHours() === hour
    })
  }

  const isToday = (day) => {
    const today = new Date()
    return day.getDate() === today.getDate() && 
           day.getMonth() === today.getMonth() && 
           day.getFullYear() === today.getFullYear()
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-slate-700">
        <div className="p-3 text-center text-sm font-medium text-slate-400"></div>
        {weekDays.map((day, i) => (
          <div key={i} className={`p-3 text-center ${isToday(day) ? 'bg-[var(--accent-primary)]/10' : ''}`}>
            <div className="text-xs text-slate-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className={`text-lg font-bold ${isToday(day) ? 'text-[var(--accent-primary)]' : 'text-white'}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-slate-700">
            <div className="p-2 text-xs text-slate-500 text-right pr-3">
              {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
            </div>
            {weekDays.map((day, i) => {
              const hourEvents = getEventsForDayHour(day, hour)
              return (
                <div key={i} className={`p-1 min-h-[50px] border-l border-slate-700 ${isToday(day) ? 'bg-yellow-500/5' : ''}`}>
                  {hourEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 mb-1"
                      style={{ 
                        backgroundColor: getEventColor(event.event_type) + '30',
                        color: getEventColor(event.event_type)
                      }}
                    >
                      {event.title || event.event_type}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({ events, currentDate, onSelectEvent, teams }) {
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.start_time)
    return eventDate.getDate() === currentDate.getDate() &&
           eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear()
  })

  const hours = []
  for (let h = 6; h <= 22; h++) {
    hours.push(h)
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-bold text-white">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <p className="text-sm text-slate-400">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(e => new Date(e.start_time).getHours() === hour)
          return (
            <div key={hour} className="flex border-b border-slate-700">
              <div className="w-20 p-3 text-sm text-slate-500 text-right shrink-0">
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <div className="flex-1 p-2 min-h-[60px]">
                {hourEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="p-3 rounded-xl cursor-pointer hover:opacity-80 mb-2"
                    style={{ 
                      backgroundColor: getEventColor(event.event_type) + '20',
                      borderLeft: `4px solid ${event.teams?.color || getEventColor(event.event_type)}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{event.title || event.event_type}</span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: getEventColor(event.event_type) + '30', color: getEventColor(event.event_type) }}>
                        {event.event_type}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {formatTime(event.start_time)} - {event.end_time ? formatTime(event.end_time) : 'TBD'}
                    </div>
                    {event.venue_name && (
                      <div className="text-sm text-slate-500 mt-1">📍 {event.venue_name}</div>
                    )}
                    {event.teams?.name && (
                      <div className="text-sm mt-1" style={{ color: event.teams.color }}>{event.teams.name}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ListView({ events, onSelectEvent, teams }) {
  const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  
  // Group by date
  const grouped = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-[var(--accent-primary)]/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: event.teams?.color || getEventColor(event.event_type) }}
                    />
                    <div>
                      <p className="font-medium text-white">{event.title || event.event_type}</p>
                      <p className="text-sm text-slate-400">
                        {formatTime(event.start_time)} - {event.end_time ? formatTime(event.end_time) : 'TBD'}
                        {event.venue_name && ` • ${event.venue_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: getEventColor(event.event_type) + '30', color: getEventColor(event.event_type) }}>
                      {event.event_type}
                    </span>
                    {event.teams?.name && (
                      <p className="text-xs mt-1" style={{ color: event.teams.color }}>{event.teams.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <span className="text-5xl">🗓️</span>
          <h3 className="text-lg font-medium text-white mt-4">No events this month</h3>
          <p className="text-slate-400 mt-2">Create your first event to get started</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// ADD SINGLE EVENT MODAL
// ============================================
function AddEventModal({ teams, venues, onClose, onCreate }) {
  const [form, setForm] = useState({
    team_id: '',
    event_type: 'practice',
    title: '',
    description: '',
    start_date: '',
    start_time: '18:00',
    end_time: '19:00',
    venue_name: '',
    venue_address: '',
    location_type: 'home',
    opponent_name: '',
    arrival_time: '',
    notify_families: false
  })

  function handleVenueSelect(venueName) {
    const venue = venues.find(v => v.name === venueName)
    setForm({ ...form, venue_name: venue?.name || venueName, venue_address: venue?.address || '' })
  }

  async function handleSubmit() {
    if (!form.start_date || !form.start_time) {
      alert('Please enter date and time')
      return
    }
    
    // Build arrival_time as full timestamp if provided
    let arrivalTimestamp = null
    if (form.arrival_time) {
      arrivalTimestamp = `${form.start_date}T${form.arrival_time}:00`
    }
    
    // Use your schema: event_date (date) + event_time (time) + end_time (time)
    const eventData = {
      team_id: form.team_id || null,
      event_type: form.event_type,
      title: form.title || form.event_type.charAt(0).toUpperCase() + form.event_type.slice(1),
      notes: form.description,  // Your schema uses 'notes' not 'description'
      event_date: form.start_date,  // DATE format: YYYY-MM-DD
      event_time: form.start_time,  // TIME format: HH:MM
      end_time: form.end_time || null,  // TIME format: HH:MM
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      location_type: form.location_type,
      opponent_name: form.opponent_name,
      arrival_time: arrivalTimestamp  // TIMESTAMP format: YYYY-MM-DDTHH:MM:SS
    }
    
    const success = await onCreate(eventData)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <h2 className="text-xl font-semibold text-white">Add Event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Event Type</label>
              <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                <option value="practice">Practice</option>
                <option value="game">Game</option>
                <option value="tournament">Tournament</option>
                <option value="team_event">Team Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Team (optional)</label>
              <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                <option value="">All Teams / Org-wide</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder={form.event_type.charAt(0).toUpperCase() + form.event_type.slice(1)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Venue</label>
            <select value={form.venue_name} onChange={e => handleVenueSelect(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-2">
              <option value="">Select saved venue or enter below</option>
              {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
            <input type="text" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})}
              placeholder="Venue name"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-2" />
            <input type="text" value={form.venue_address} onChange={e => setForm({...form, venue_address: e.target.value})}
              placeholder="Address"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
          </div>

          {form.event_type === 'game' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Location Type</label>
                  <select value={form.location_type} onChange={e => setForm({...form, location_type: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Opponent</label>
                  <input type="text" value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})}
                    placeholder="Opponent team name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Arrival Time (optional)</label>
                <input type="time" value={form.arrival_time} onChange={e => setForm({...form, arrival_time: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-2">Description (optional)</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Additional details..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white min-h-[80px]" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl">
            <input type="checkbox" checked={form.notify_families} onChange={e => setForm({...form, notify_families: e.target.checked})}
              className="w-5 h-5 rounded" />
            <span className="text-white">Notify all families after creating</span>
          </label>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Create Event</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BULK PRACTICE MODAL (RECURRING)
// ============================================
function BulkPracticeModal({ teams, venues, onClose, onCreate }) {
  const [form, setForm] = useState({
    team_id: '',
    start_time: '18:00',
    end_time: '19:30',
    start_date: '',
    end_date: '',
    notify_families: true
  })
  
  // Track day configurations with their own venues
  const [dayConfigs, setDayConfigs] = useState([])
  const [preview, setPreview] = useState([])
  const [showPreviewEdit, setShowPreviewEdit] = useState(false)

  const dayOptions = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ]

  function toggleDay(dayValue) {
    const existing = dayConfigs.find(d => d.day === dayValue)
    if (existing) {
      setDayConfigs(dayConfigs.filter(d => d.day !== dayValue))
    } else {
      setDayConfigs([...dayConfigs, { 
        day: dayValue, 
        venue_name: '', 
        venue_address: '',
        start_time: form.start_time,
        end_time: form.end_time
      }])
    }
  }

  function updateDayConfig(dayValue, field, value) {
    setDayConfigs(dayConfigs.map(d => 
      d.day === dayValue ? { ...d, [field]: value } : d
    ))
  }

  function handleVenueSelectForDay(dayValue, venueName) {
    const venue = venues.find(v => v.name === venueName)
    setDayConfigs(dayConfigs.map(d => 
      d.day === dayValue ? { 
        ...d, 
        venue_name: venue?.name || venueName, 
        venue_address: venue?.address || '' 
      } : d
    ))
  }

  function applyVenueToAllDays(venueName) {
    const venue = venues.find(v => v.name === venueName)
    setDayConfigs(dayConfigs.map(d => ({
      ...d,
      venue_name: venue?.name || venueName,
      venue_address: venue?.address || ''
    })))
  }

  function generatePreview() {
    if (!form.start_date || !form.end_date || dayConfigs.length === 0) {
      setPreview([])
      return
    }

    const events = []
    const start = new Date(form.start_date)
    const end = new Date(form.end_date)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayConfig = dayConfigs.find(dc => dc.day === d.getDay())
      if (dayConfig) {
        events.push({
          id: `${d.getTime()}`,
          date: new Date(d),
          dayName: dayOptions.find(opt => opt.value === d.getDay())?.label,
          venue_name: dayConfig.venue_name,
          venue_address: dayConfig.venue_address,
          start_time: dayConfig.start_time || form.start_time,
          end_time: dayConfig.end_time || form.end_time
        })
      }
    }
    setPreview(events)
  }

  useEffect(() => {
    generatePreview()
  }, [form.start_date, form.end_date, dayConfigs])

  function updatePreviewItem(id, field, value) {
    setPreview(preview.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function removePreviewItem(id) {
    setPreview(preview.filter(p => p.id !== id))
  }

  async function handleSubmit() {
    if (preview.length === 0) {
      alert('No practices to create. Please select days and date range.')
      return
    }

    const eventsData = preview.map(p => {
      // Format date as YYYY-MM-DD
      const eventDate = p.date.toISOString().split('T')[0]
      
      return {
        team_id: form.team_id || null,
        event_type: 'practice',
        title: 'Practice',
        notes: '',  // Your schema uses 'notes' not 'description'
        event_date: eventDate,  // DATE format: YYYY-MM-DD
        event_time: p.start_time || form.start_time,  // TIME format: HH:MM
        end_time: p.end_time || form.end_time,  // TIME format: HH:MM
        venue_name: p.venue_name || '',
        venue_address: p.venue_address || '',
        location_type: 'home'
      }
    })

    const success = await onCreate(eventsData, form.notify_families)
    if (success) onClose()
  }

  const selectedDays = dayConfigs.map(d => d.day)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Recurring Practice</h2>
            <p className="text-sm text-slate-400">Schedule practices with per-day venue control</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Team Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Team</label>
            <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="">All Teams / Org-wide</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">First Practice</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Last Practice</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>

          {/* Default Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Default Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Default End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-3">Practice Days</label>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    selectedDays.includes(day.value)
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-Day Venue Configuration */}
          {dayConfigs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-white">Venue per Day</h4>
                {venues.length > 0 && (
                  <select 
                    onChange={e => e.target.value && applyVenueToAllDays(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white"
                  >
                    <option value="">Apply to all days...</option>
                    {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-3">
                {dayConfigs.sort((a, b) => a.day - b.day).map(dc => (
                  <div key={dc.day} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <div className="w-24 font-medium text-white">
                      {dayOptions.find(d => d.value === dc.day)?.label}
                    </div>
                    <select 
                      value={dc.venue_name}
                      onChange={e => handleVenueSelectForDay(dc.day, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select venue...</option>
                      {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                    </select>
                    <input 
                      type="time" 
                      value={dc.start_time || form.start_time}
                      onChange={e => updateDayConfig(dc.day, 'start_time', e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
                    />
                    <span className="text-slate-500">-</span>
                    <input 
                      type="time" 
                      value={dc.end_time || form.end_time}
                      onChange={e => updateDayConfig(dc.day, 'end_time', e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Preview: {preview.length} practices</h4>
                <button 
                  onClick={() => setShowPreviewEdit(!showPreviewEdit)}
                  className="text-xs text-[var(--accent-primary)] hover:text-yellow-300"
                >
                  {showPreviewEdit ? 'Hide Details' : 'Edit Individual Practices'}
                </button>
              </div>
              
              {showPreviewEdit ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {preview.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg text-sm">
                      <span className="w-20 text-slate-400">{p.date.toLocaleDateString()}</span>
                      <span className="w-16 text-white">{p.dayName?.slice(0, 3)}</span>
                      <select 
                        value={p.venue_name}
                        onChange={e => {
                          const venue = venues.find(v => v.name === e.target.value)
                          updatePreviewItem(p.id, 'venue_name', venue?.name || '')
                          updatePreviewItem(p.id, 'venue_address', venue?.address || '')
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value="">No venue</option>
                        {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </select>
                      <button onClick={() => removePreviewItem(p.id)} className="text-red-400 hover:text-red-300 px-2"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.slice(0, 15).map((p, i) => (
                    <div key={p.id} className="text-sm text-slate-400 flex justify-between">
                      <span>{p.dayName} - {p.date.toLocaleDateString()}</span>
                      <span className="text-slate-500">{p.venue_name || 'No venue'}</span>
                    </div>
                  ))}
                  {preview.length > 15 && (
                    <div className="text-sm text-slate-500">...and {preview.length - 15} more</div>
                  )}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl">
            <input type="checkbox" checked={form.notify_families} onChange={e => setForm({...form, notify_families: e.target.checked})}
              className="w-5 h-5 rounded" />
            <span className="text-white">Notify all families after creating</span>
          </label>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800">
          <span className="text-slate-400">
            {preview.length > 0 ? `${preview.length} practices will be created` : 'Select days and date range'}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
            <button onClick={handleSubmit} disabled={preview.length === 0}
              className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50">
              Create {preview.length} Practices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BULK GAMES MODAL
// ============================================
function BulkGamesModal({ teams, venues, onClose, onCreate }) {
  const [games, setGames] = useState([
    { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', location_type: 'home' }
  ])
  const [notifyFamilies, setNotifyFamilies] = useState(true)

  function addRow() {
    setGames([...games, { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', location_type: 'home' }])
  }

  function removeRow(index) {
    setGames(games.filter((_, i) => i !== index))
  }

  function updateRow(index, field, value) {
    const updated = [...games]
    updated[index][field] = value
    setGames(updated)
  }

  async function handleSubmit() {
    const validGames = games.filter(g => g.date && g.time)
    if (validGames.length === 0) {
      alert('Please enter at least one game with date and time')
      return
    }

    const eventsData = validGames.map(g => {
      const venue = venues.find(v => v.name === g.venue_name)
      
      // Calculate end time (2 hours after start)
      const [hours, minutes] = g.time.split(':')
      const endHours = (parseInt(hours) + 2) % 24
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`

      return {
        team_id: g.team_id || null,
        event_type: 'game',
        title: g.opponent ? `vs ${g.opponent}` : 'Game',
        notes: '',
        event_date: g.date,  // DATE format: YYYY-MM-DD
        event_time: g.time,  // TIME format: HH:MM
        end_time: endTime,   // TIME format: HH:MM
        opponent_name: g.opponent,
        venue_name: g.venue_name,
        venue_address: venue?.address || '',
        location_type: g.location_type
      }
    })

    const success = await onCreate(eventsData, notifyFamilies)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Bulk Add Games</h2>
            <p className="text-sm text-slate-400">Enter multiple games at once</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400">
                  <th className="pb-3 pr-2">Team</th>
                  <th className="pb-3 pr-2">Date</th>
                  <th className="pb-3 pr-2">Time</th>
                  <th className="pb-3 pr-2">Opponent</th>
                  <th className="pb-3 pr-2">Venue</th>
                  <th className="pb-3 pr-2">H/A</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, i) => (
                  <tr key={i}>
                    <td className="pb-2 pr-2">
                      <select value={game.team_id} onChange={e => updateRow(i, 'team_id', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="">All</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="date" value={game.date} onChange={e => updateRow(i, 'date', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="time" value={game.time} onChange={e => updateRow(i, 'time', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="text" value={game.opponent} onChange={e => updateRow(i, 'opponent', e.target.value)}
                        placeholder="Opponent"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <select value={game.venue_name} onChange={e => updateRow(i, 'venue_name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="">Select venue</option>
                        {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </select>
                    </td>
                    <td className="pb-2 pr-2">
                      <select value={game.location_type} onChange={e => updateRow(i, 'location_type', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="home">Home</option>
                        <option value="away">Away</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </td>
                    <td className="pb-2">
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-300 p-2"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button onClick={addRow} className="mt-4 px-4 py-2 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-[var(--accent-primary)]/30 w-full">
            + Add Another Game
          </button>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl mt-4">
            <input type="checkbox" checked={notifyFamilies} onChange={e => setNotifyFamilies(e.target.checked)}
              className="w-5 h-5 rounded" />
            <span className="text-white">Notify all families after creating</span>
          </label>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800">
          <span className="text-slate-400">
            {games.filter(g => g.date && g.time).length} valid game{games.filter(g => g.date && g.time).length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">
              Create Games
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// VENUE MANAGER MODAL
// ============================================
function VenueManagerModal({ venues, onClose, onSave }) {
  const [localVenues, setLocalVenues] = useState([...venues])
  const [newVenue, setNewVenue] = useState({ name: '', address: '', notes: '' })

  function addVenue() {
    if (!newVenue.name) return
    setLocalVenues([...localVenues, { ...newVenue }])
    setNewVenue({ name: '', address: '', notes: '' })
  }

  function removeVenue(index) {
    setLocalVenues(localVenues.filter((_, i) => i !== index))
  }

  function handleSave() {
    onSave(localVenues)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Manage Venues</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">Save frequently used locations for quick selection</p>
          
          {/* Existing venues */}
          <div className="space-y-2">
            {localVenues.map((venue, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{venue.name}</p>
                  {venue.address && <p className="text-sm text-slate-400">{venue.address}</p>}
                  {venue.notes && <p className="text-xs text-slate-500 mt-1">{venue.notes}</p>}
                </div>
                <button onClick={() => removeVenue(i)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Add new venue */}
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Add New Venue</h4>
            <div className="space-y-3">
              <input type="text" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})}
                placeholder="Venue name (e.g., Main Gym)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <input type="text" value={newVenue.address} onChange={e => setNewVenue({...newVenue, address: e.target.value})}
                placeholder="Address"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <input type="text" value={newVenue.notes} onChange={e => setNewVenue({...newVenue, notes: e.target.value})}
                placeholder="Notes (e.g., Court 2, Park at back)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <button onClick={addVenue} disabled={!newVenue.name}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 disabled:opacity-50">
                + Add Venue
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save Venues</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// AVAILABILITY SURVEY MODAL
// ============================================
function AvailabilitySurveyModal({ teams, organization, onClose, showToast }) {
  const [step, setStep] = useState('create') // create, view
  const [surveys, setSurveys] = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  
  // Create form
  const [form, setForm] = useState({
    title: 'Practice Availability',
    team_id: '',
    slots: [
      { day: 'Monday', time: '5:00 PM - 7:00 PM' },
      { day: 'Tuesday', time: '6:00 PM - 8:00 PM' },
      { day: 'Wednesday', time: '5:00 PM - 7:00 PM' },
    ],
    deadline: ''
  })

  useEffect(() => {
    loadSurveys()
  }, [])

  async function loadSurveys() {
    // Load from organization settings
    const existingSurveys = organization.settings?.availability_surveys || []
    setSurveys(existingSurveys)
  }

  function addSlot() {
    setForm({ ...form, slots: [...form.slots, { day: '', time: '' }] })
  }

  function removeSlot(index) {
    setForm({ ...form, slots: form.slots.filter((_, i) => i !== index) })
  }

  function updateSlot(index, field, value) {
    const updated = [...form.slots]
    updated[index][field] = value
    setForm({ ...form, slots: updated })
  }

  async function createSurvey() {
    const newSurvey = {
      id: Date.now().toString(),
      ...form,
      created_at: new Date().toISOString(),
      responses: [],
      status: 'active'
    }

    const updatedSurveys = [...surveys, newSurvey]
    const newSettings = { ...organization.settings, availability_surveys: updatedSurveys }
    
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    
    setSurveys(updatedSurveys)
    showToast('Survey created! Share the link with families.', 'success')
    setSelectedSurvey(newSurvey)
    setStep('view')
  }

  async function deleteSurvey(surveyId) {
    if (!confirm('Delete this survey and all responses?')) return
    const updatedSurveys = surveys.filter(s => s.id !== surveyId)
    const newSettings = { ...organization.settings, availability_surveys: updatedSurveys }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setSurveys(updatedSurveys)
    setSelectedSurvey(null)
    showToast('Survey deleted', 'success')
  }

  function copyShareLink(surveyId) {
    // In production, this would be a real shareable URL
    const link = `${window.location.origin}/availability/${organization.id}/${surveyId}`
    navigator.clipboard.writeText(link)
    showToast('Link copied to clipboard!', 'success')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Availability Survey</h2>
            <p className="text-sm text-slate-400">Collect availability from families</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        {step === 'create' ? (
          <div className="p-6 space-y-6">
            {/* Existing surveys */}
            {surveys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Existing Surveys</h3>
                <div className="space-y-2">
                  {surveys.map(survey => (
                    <div key={survey.id} className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{survey.title}</p>
                        <p className="text-sm text-slate-400">{survey.responses?.length || 0} responses</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedSurvey(survey); setStep('view') }}
                          className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-white hover:bg-slate-600">
                          View Results
                        </button>
                        <button onClick={() => copyShareLink(survey.id)}
                          className="px-3 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-400 hover:bg-blue-500/30">
                          Copy Link
                        </button>
                        <button onClick={() => deleteSurvey(survey.id)}
                          className="px-3 py-1 bg-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create new survey */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Create New Survey</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Survey Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Team (optional)</label>
                  <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Time Slot Options</label>
                  <div className="space-y-2">
                    {form.slots.map((slot, i) => (
                      <div key={i} className="flex gap-2">
                        <select value={slot.day} onChange={e => updateSlot(i, 'day', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                          <option value="">Select day</option>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <input type="text" value={slot.time} onChange={e => updateSlot(i, 'time', e.target.value)}
                          placeholder="e.g., 5:00 PM - 7:00 PM"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
                        <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-300 px-2"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={addSlot}
                      className="w-full px-4 py-2 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-[var(--accent-primary)]/30">
                      + Add Time Slot
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Response Deadline (optional)</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // View survey results
          <div className="p-6">
            <button onClick={() => setStep('create')} className="text-slate-400 hover:text-white mb-4 flex items-center gap-2">
              ← Back to surveys
            </button>
            
            {selectedSurvey && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedSurvey.title}</h3>
                  <p className="text-sm text-slate-400">{selectedSurvey.responses?.length || 0} responses received</p>
                </div>

                {/* Results heatmap */}
                <div className="bg-slate-900 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white mb-4">Availability Summary</h4>
                  <div className="space-y-3">
                    {selectedSurvey.slots.map((slot, i) => {
                      const available = selectedSurvey.responses?.filter(r => r.available?.includes(i)).length || 0
                      const notAvailable = selectedSurvey.responses?.filter(r => r.notAvailable?.includes(i)).length || 0
                      const total = selectedSurvey.responses?.length || 1
                      const percentage = Math.round((available / total) * 100)
                      
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-40 text-sm text-white">
                            {slot.day} {slot.time}
                          </div>
                          <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: percentage >= 70 ? '#10B981' : percentage >= 40 ? '#F59E0B' : '#EF4444'
                              }}
                            />
                          </div>
                          <div className="w-24 text-right text-sm">
                            <span className="text-emerald-400">{available}✓</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-red-400">{notAvailable}✗</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Individual responses */}
                {selectedSurvey.responses?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Individual Responses</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedSurvey.responses.map((response, i) => (
                        <div key={i} className="bg-slate-900 rounded-lg p-3 text-sm">
                          <p className="text-white font-medium">{response.name}</p>
                          <p className="text-slate-400 text-xs">
                            Available: {response.available?.map(idx => selectedSurvey.slots[idx]?.day).join(', ') || 'None'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => copyShareLink(selectedSurvey.id)}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30">
                    📋 Copy Share Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Close</button>
          {step === 'create' && (
            <button onClick={createSurvey} disabled={form.slots.length === 0}
              className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50">
              Create Survey
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// EVENT DETAIL MODAL (VIEW/EDIT)
// ============================================
function EventDetailModal({ event, teams, venues, onClose, onUpdate, onDelete, activeView, showToast }) {
  const { isAdmin: hasAdminRole, profile, user } = useAuth()
  // Use activeView if provided, otherwise fall back to admin role check
  const isAdminView = activeView ? (activeView === 'admin' || activeView === 'coach') : hasAdminRole
  const isCoachView = activeView === 'coach'
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  
  // Rich data
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [volunteers, setVolunteers] = useState([])
  const [coaches, setCoaches] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedCoach, setSelectedCoach] = useState(null)
  
  // View controls
  const [showPhotos, setShowPhotos] = useState(true)
  const [availableParents, setAvailableParents] = useState([])
  const [volunteerAssignModal, setVolunteerAssignModal] = useState(null)
  
  const [form, setForm] = useState({
    team_id: event.team_id || '',
    event_type: event.event_type || 'practice',
    title: event.title || '',
    description: event.description || '',
    start_date: event.event_date || (event.start_time ? new Date(event.start_time).toISOString().split('T')[0] : ''),
    start_time: event.event_time || (event.start_time ? new Date(event.start_time).toTimeString().slice(0, 5) : ''),
    end_time: event.end_time || '',
    venue_name: event.venue_name || '',
    venue_address: event.venue_address || '',
    location_type: event.location_type || 'home',
    opponent_name: event.opponent_name || ''
  })

  useEffect(() => {
    if (event?.id) loadEventData()
  }, [event?.id])

  async function loadEventData() {
    setLoading(true)
    try {
      // Load team roster if team is assigned
      if (event.team_id) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('*, players(id, first_name, last_name, jersey_number, position, photo_url, grade, status)')
          .eq('team_id', event.team_id)
        setRoster(teamPlayers?.map(tp => tp.players).filter(Boolean) || [])

        // Load coaches for this team
        const { data: teamCoaches } = await supabase
          .from('team_coaches')
          .select('*, coaches(id, first_name, last_name, email, phone)')
          .eq('team_id', event.team_id)
        // Merge coach data with role from team_coaches join table
        setCoaches(teamCoaches?.map(tc => tc.coaches ? { ...tc.coaches, role: tc.role } : null).filter(Boolean) || [])
      }

      // Load RSVPs for this event
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', event.id)
      
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
      setRsvps(rsvpMap)

      // Load volunteers for this event
      const { data: volunteerData } = await supabase
        .from('event_volunteers')
        .select('*, profiles(id, full_name, email)')
        .eq('event_id', event.id)
      setVolunteers(volunteerData || [])

      // Load available parents for volunteer assignment
      const { data: parentsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name, email')
        .order('first_name')
      setAvailableParents(parentsData || [])

    } catch (err) {
      console.error('Error loading event data:', err)
    }
    setLoading(false)
  }

  async function updateRsvp(playerId, status) {
    const existing = rsvps[playerId]
    
    if (existing) {
      await supabase.from('event_rsvps')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('event_rsvps').insert({
        event_id: event.id,
        player_id: playerId,
        status,
        responded_at: new Date().toISOString()
      })
    }
    
    // Refresh RSVPs
    const { data: rsvpData } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', event.id)
    
    const rsvpMap = {}
    rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
    setRsvps(rsvpMap)
  }

  async function removeVolunteer(volunteerId) {
    await supabase.from('event_volunteers').delete().eq('id', volunteerId)
    setVolunteers(volunteers.filter(v => v.id !== volunteerId))
  }

  async function assignVolunteer(role, position, profileId) {
    // Check if slot is taken
    const existing = volunteers.find(v => v.role === role && v.position === position)
    if (existing) return

    const { data, error } = await supabase
      .from('event_volunteers')
      .insert({
        event_id: event.id,
        profile_id: profileId,
        role,
        position
      })
      .select('*, profiles(id, full_name, email)')
      .single()

    if (!error && data) {
      setVolunteers([...volunteers, data])
    }
  }

  async function handleSave() {
    const success = await onUpdate(event.id, {
      team_id: form.team_id || null,
      event_type: form.event_type,
      title: form.title,
      description: form.description,
      event_date: form.start_date,
      event_time: form.start_time,
      end_time: form.end_time,
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      location_type: form.location_type,
      opponent_name: form.opponent_name
    })
    if (success) {
      setIsEditing(false)
      loadEventData()
    }
  }

  // RSVP counts
  const rsvpCounts = {
    yes: Object.values(rsvps).filter(r => r.status === 'yes').length,
    no: Object.values(rsvps).filter(r => r.status === 'no').length,
    maybe: Object.values(rsvps).filter(r => r.status === 'maybe').length,
    pending: roster.length - Object.keys(rsvps).length
  }

  // Volunteer helpers
  const getVolunteer = (role, position) => volunteers.find(v => v.role === role && v.position === position)
  const isGame = event.event_type === 'game'

  const tabs = [
    { id: 'details', label: 'Details', icon: 'clipboard' },
    { id: 'roster', label: `Roster (${roster.length})`, icon: 'users' },
    { id: 'rsvp', label: `RSVPs`, icon: '✓', badge: rsvpCounts.pending > 0 ? rsvpCounts.pending : null },
    ...(isGame ? [{ id: 'volunteers', label: 'Volunteers', icon: '🙋' }] : []),
    { id: 'coaches', label: `Coaches (${coaches.length})`, icon: 'user-cog' },
    ...(isGame && isAdminView ? [{ id: 'gameprep', label: 'Game Prep', icon: 'volleyball' }] : [])
  ]

  const teamColor = event.teams?.color || '#EAB308'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between" style={{ borderLeftColor: teamColor, borderLeftWidth: 4 }}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{event.event_type === 'game' ? 'practice' : event.event_type === 'practice' ? '🏃' : event.event_type === 'tournament' ? '🏆' : '📅'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{event.title || (event.event_type === 'game' ? `vs ${event.opponent_name || 'TBD'}` : event.event_type)}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: getEventColor(event.event_type) + '30', color: getEventColor(event.event_type) }}>
                  {event.event_type}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
                {event.event_time && ` • ${formatTime12(event.event_time)}`}
                {event.teams?.name && ` • ${event.teams.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className={`p-2 rounded-lg transition ${showPhotos ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
              title={showPhotos ? 'Hide Photos' : 'Show Photos'}
            >
              📷
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl p-2">×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' 
                  : 'text-slate-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading event details...</div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && (
                isEditing ? (
                  <div className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Event Type</label>
                        <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                          <option value="practice">Practice</option>
                          <option value="game">Game</option>
                          <option value="tournament">Tournament</option>
                          <option value="team_event">Team Event</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Team</label>
                        <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                          <option value="">All Teams</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Title</label>
                      <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                        placeholder="e.g., Week 3 Practice"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Date</label>
                        <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Start Time</label>
                        <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">End Time</label>
                        <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Venue</label>
                        <input type="text" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Address</label>
                        <input type="text" value={form.venue_address} onChange={e => setForm({...form, venue_address: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                    </div>

                    {form.event_type === 'game' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Opponent</label>
                          <input type="text" value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Location Type</label>
                          <select value={form.location_type} onChange={e => setForm({...form, location_type: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                            <option value="home">Home</option>
                            <option value="away">Away</option>
                            <option value="neutral">Neutral</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Notes</label>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white min-h-[80px]" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column - Event Info */}
                    <div className="space-y-4">
                      <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase">Event Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <DetailItem label="Date" value={event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'} />
                          <DetailItem label="Time" value={event.event_time ? `${formatTime12(event.event_time)}${event.end_time ? ` - ${formatTime12(event.end_time)}` : ''}` : 'TBD'} />
                        </div>
                        {event.venue_name && <DetailItem label="Venue" value={event.venue_name} />}
                        {event.venue_address && <DetailItem label="Address" value={event.venue_address} />}
                        {event.teams?.name && <DetailItem label="Team" value={event.teams.name} highlight={teamColor} />}
                        {event.opponent_name && <DetailItem label="Opponent" value={event.opponent_name} />}
                        {event.location_type && isGame && <DetailItem label="Location" value={event.location_type.charAt(0).toUpperCase() + event.location_type.slice(1)} />}
                      </div>

                      {event.description && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">Notes</h4>
                          <p className="text-white text-sm">{event.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Quick Stats */}
                    <div className="space-y-4">
                      {/* RSVP Summary */}
                      <div className="bg-slate-900 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase">RSVP Summary</h4>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-xs text-[var(--accent-primary)] hover:underline"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-emerald-400">{rsvpCounts.yes}</div>
                            <div className="text-xs text-emerald-400">Going</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-red-400">{rsvpCounts.no}</div>
                            <div className="text-xs text-red-400">No</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-[var(--accent-primary)]">{rsvpCounts.maybe}</div>
                            <div className="text-xs text-[var(--accent-primary)]">Maybe</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-slate-400">{rsvpCounts.pending}</div>
                            <div className="text-xs text-slate-400">Pending</div>
                          </button>
                        </div>
                      </div>

                      {/* Volunteers Summary (Games only) */}
                      {isGame && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Volunteers</h4>
                          <div className="space-y-2">
                            <VolunteerSlot 
                              role="Line Judge" 
                              volunteer={getVolunteer('line_judge', 'primary')} 
                              icon="🚩"
                              onClick={() => setActiveTab('volunteers')}
                            />
                            <VolunteerSlot 
                              role="Scorekeeper" 
                              volunteer={getVolunteer('scorekeeper', 'primary')} 
                              icon="clipboard"
                              onClick={() => setActiveTab('volunteers')}
                            />
                          </div>
                        </div>
                      )}

                      {/* Coaches */}
                      {coaches.length > 0 && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Coaches</h4>
                          <div className="space-y-2">
                            {coaches.map(coach => (
                              <div key={coach.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800">
                                {showPhotos && coach.photo_url ? (
                                  <img src={coach.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">Coach</div>
                                )}
                                <div>
                                  <ClickableCoachName 
                                    coach={coach}
                                    onCoachSelect={setSelectedCoach}
                                    className="text-white text-sm"
                                  />
                                  <div className="text-xs text-slate-500">{coach.role || 'Coach'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Roster Tab */}
              {activeTab === 'roster' && (
                <div>
                  {roster.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-10 h-10" />
                      <p className="text-slate-400 mt-4">No players on roster</p>
                      {!event.team_id && <p className="text-slate-500 text-sm mt-2">Assign a team to see roster</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {roster.map(player => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          context="attendance"
                          teamColor={teamColor}
                          showPhoto={showPhotos}
                          size="small"
                          onClick={() => setSelectedPlayer(player)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RSVP Tab */}
              {activeTab === 'rsvp' && (
                <div>
                  {/* RSVP Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-emerald-400">{rsvpCounts.yes}</div>
                      <div className="text-sm text-emerald-400">Going</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-red-400">{rsvpCounts.no}</div>
                      <div className="text-sm text-red-400">Can't Go</div>
                    </div>
                    <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-[var(--accent-primary)]">{rsvpCounts.maybe}</div>
                      <div className="text-sm text-[var(--accent-primary)]">Maybe</div>
                    </div>
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-slate-400">{rsvpCounts.pending}</div>
                      <div className="text-sm text-slate-400">Pending</div>
                    </div>
                  </div>

                  {/* Player RSVP List */}
                  {roster.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      {!event.team_id ? 'Assign a team to manage RSVPs' : 'No players on roster'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roster.map(player => {
                        const rsvp = rsvps[player.id]
                        return (
                          <div key={player.id} className="bg-slate-900 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                              {showPhotos && (
                                player.photo_url ? (
                                  <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-500"><User className="w-6 h-6" /></div>
                                )
                              )}
                              {player.jersey_number && (
                                <span className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold" style={{ backgroundColor: teamColor + '30', color: teamColor }}>
                                  {player.jersey_number}
                                </span>
                              )}
                              <div>
                                <div className="text-white font-medium">{player.first_name} {player.last_name}</div>
                                <div className="text-xs text-slate-500">
                                  {player.position && <span className="mr-2">{player.position}</span>}
                                  {player.grade && <span>Grade {player.grade}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateRsvp(player.id, 'yes')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                  rsvp?.status === 'yes' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                                }`}
                              >
                                ✓ Yes
                              </button>
                              <button
                                onClick={() => updateRsvp(player.id, 'no')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                  rsvp?.status === 'no' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                                }`}
                              >
                                ✗ No
                              </button>
                              <button
                                onClick={() => updateRsvp(player.id, 'maybe')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                  rsvp?.status === 'maybe' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)]'
                                }`}
                              >
                                ? Maybe
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Volunteers Tab */}
              {activeTab === 'volunteers' && isGame && (
                <div className="space-y-6">
                  {/* Current user's volunteer status */}
                  {!isAdminView && user?.id && (
                    <div className={`p-4 rounded-xl ${volunteers.some(v => v.profile_id === user.id) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'}`}>
                      {volunteers.some(v => v.profile_id === user.id) ? (
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-6 h-6" />
                          <div>
                            <p className="text-emerald-400 font-medium">You're signed up!</p>
                            <p className="text-emerald-400/70 text-sm">
                              {volunteers.find(v => v.profile_id === user.id)?.role === 'line_judge' ? 'Line Judge' : 'Scorekeeper'}
                              {' - '}
                              {volunteers.find(v => v.profile_id === user.id)?.position === 'primary' ? 'Primary' : 'Backup'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🙋</span>
                          <div>
                            <p className="text-[var(--accent-primary)] font-medium">Volunteers needed!</p>
                            <p className="text-[var(--accent-primary)]/70 text-sm">Click a slot below to sign up</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Line Judge */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🚩</span> Line Judge
                    </h4>
                    <div className="space-y-2">
                      {['primary', 'backup_1', 'backup_2'].map(position => {
                        const volunteer = getVolunteer('line_judge', position)
                        const isAssigning = volunteerAssignModal?.role === 'line_judge' && volunteerAssignModal?.position === position
                        const isCurrentUser = volunteer?.profile_id === user?.id
                        const userAlreadyVolunteering = volunteers.some(v => v.profile_id === user?.id)
                        
                        return (
                          <div key={position} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800'}`}>
                            <div className="flex items-center gap-3">
                              <span className={position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500'}>
                                {position === 'primary' ? <Star className="w-4 h-4" /> : ''}
                              </span>
                              <span className="text-slate-400 text-sm w-20">{position === 'primary' ? 'Primary' : position.replace('_', ' ').replace('backup', 'Backup')}</span>
                              {volunteer ? (
                                <span className={isCurrentUser ? 'text-emerald-400 font-medium' : 'text-white'}>
                                  {isCurrentUser ? 'You' : (volunteer.profiles?.full_name || 'Volunteer')}
                                </span>
                              ) : isAdminView ? (
                                isAssigning ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      autoFocus
                                      onChange={(e) => {
                                        if (e.target.value) assignVolunteer('line_judge', position, e.target.value)
                                        setVolunteerAssignModal(null)
                                      }}
                                      onBlur={() => setVolunteerAssignModal(null)}
                                      className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                    >
                                      <option value="">Select parent...</option>
                                      {availableParents.filter(p => !volunteers.some(v => v.profile_id === p.id)).map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.full_name || `${parent.first_name} ${parent.last_name}`}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => setVolunteerAssignModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setVolunteerAssignModal({ role: 'line_judge', position })} className="text-[var(--accent-primary)] hover:underline text-sm">+ Assign</button>
                                )
                              ) : (
                                <button
                                  onClick={() => assignVolunteer('line_judge', position, user?.id)}
                                  disabled={userAlreadyVolunteering}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${userAlreadyVolunteering ? 'bg-gray-500/20 text-slate-500 cursor-not-allowed' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-yellow-400/30'}`}
                                >
                                  {userAlreadyVolunteering ? 'Open' : '🙋 Sign Up'}
                                </button>
                              )}
                            </div>
                            {volunteer && (isAdminView || isCurrentUser) && (
                              <button onClick={() => removeVolunteer(volunteer.id)} className="text-red-400 hover:text-red-300 text-sm">
                                {isCurrentUser ? 'Cancel' : 'Remove'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Scorekeeper */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" /> Scorekeeper
                    </h4>
                    <div className="space-y-2">
                      {['primary', 'backup_1', 'backup_2'].map(position => {
                        const volunteer = getVolunteer('scorekeeper', position)
                        const isAssigning = volunteerAssignModal?.role === 'scorekeeper' && volunteerAssignModal?.position === position
                        const isCurrentUser = volunteer?.profile_id === user?.id
                        const userAlreadyVolunteering = volunteers.some(v => v.profile_id === user?.id)
                        
                        return (
                          <div key={position} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800'}`}>
                            <div className="flex items-center gap-3">
                              <span className={position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500'}>
                                {position === 'primary' ? <Star className="w-4 h-4" /> : ''}
                              </span>
                              <span className="text-slate-400 text-sm w-20">{position === 'primary' ? 'Primary' : position.replace('_', ' ').replace('backup', 'Backup')}</span>
                              {volunteer ? (
                                <span className={isCurrentUser ? 'text-emerald-400 font-medium' : 'text-white'}>
                                  {isCurrentUser ? 'You' : (volunteer.profiles?.full_name || 'Volunteer')}
                                </span>
                              ) : isAdminView ? (
                                isAssigning ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      autoFocus
                                      onChange={(e) => {
                                        if (e.target.value) assignVolunteer('scorekeeper', position, e.target.value)
                                        setVolunteerAssignModal(null)
                                      }}
                                      onBlur={() => setVolunteerAssignModal(null)}
                                      className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                    >
                                      <option value="">Select parent...</option>
                                      {availableParents.filter(p => !volunteers.some(v => v.profile_id === p.id)).map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.full_name || `${parent.first_name} ${parent.last_name}`}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => setVolunteerAssignModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setVolunteerAssignModal({ role: 'scorekeeper', position })} className="text-[var(--accent-primary)] hover:underline text-sm">+ Assign</button>
                                )
                              ) : (
                                <button
                                  onClick={() => assignVolunteer('scorekeeper', position, user?.id)}
                                  disabled={userAlreadyVolunteering}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${userAlreadyVolunteering ? 'bg-gray-500/20 text-slate-500 cursor-not-allowed' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-yellow-400/30'}`}
                                >
                                  {userAlreadyVolunteering ? 'Open' : '🙋 Sign Up'}
                                </button>
                              )}
                            </div>
                            {volunteer && (isAdminView || isCurrentUser) && (
                              <button onClick={() => removeVolunteer(volunteer.id)} className="text-red-400 hover:text-red-300 text-sm">
                                {isCurrentUser ? 'Cancel' : 'Remove'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm text-center">
                    {isAdminView ? 'Assign parents to volunteer slots above.' : 'Thank you for volunteering! Your help makes our league possible.'}
                  </p>
                </div>
              )}

              {/* Coaches Tab */}
              {activeTab === 'coaches' && (
                <div>
                  {coaches.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-4xl">Coach</span>
                      <p className="text-slate-400 mt-4">No coaches assigned</p>
                      {!event.team_id && <p className="text-slate-500 text-sm mt-2">Assign a team to see coaches</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coaches.map(coach => (
                        <div key={coach.id} className="bg-slate-900 rounded-xl p-4 flex items-center gap-4">
                          {showPhotos && coach.photo_url ? (
                            <img src={coach.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl">Coach</div>
                          )}
                          <div className="flex-1">
                            <ClickableCoachName 
                              coach={coach}
                              onCoachSelect={setSelectedCoach}
                              className="text-white font-semibold text-lg"
                            />
                            <div className="text-slate-400 text-sm">{coach.role || 'Coach'}</div>
                            <div className="flex gap-4 mt-2">
                              {coach.email && (
                                <a href={`mailto:${coach.email}`} className="text-[var(--accent-primary)] hover:underline text-sm">Email</a>
                              )}
                              {coach.phone && (
                                <a href={`tel:${coach.phone}`} className="text-[var(--accent-primary)] hover:underline text-sm">Call</a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Game Prep Tab - For coaches/admins on games */}
              {activeTab === 'gameprep' && isGame && (
                <div className="space-y-4">
                  {/* Quick Actions for Game Day */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Game Day Prep</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowLineupBuilder(true)}
                        className="flex items-center gap-3 p-4 bg-[var(--accent-primary)]/20 rounded-xl hover:bg-[var(--accent-primary)]/30 transition text-left"
                      >
                        <ClipboardList className="w-7 h-7" />
                        <div>
                          <p className="text-white font-semibold">Set Lineup</p>
                          <p className="text-slate-400 text-xs">Build starting rotation</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('rsvp')}
                        className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition text-left"
                      >
                        <span className="text-2xl">✓</span>
                        <div>
                          <p className="text-white font-semibold">Check Attendance</p>
                          <p className="text-slate-400 text-xs">{rsvpCounts.yes} confirmed, {rsvpCounts.pending} pending</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('roster')}
                        className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition text-left"
                      >
                        <Users className="w-7 h-7" />
                        <div>
                          <p className="text-white font-semibold">View Roster</p>
                          <p className="text-slate-400 text-xs">{roster.length} players</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('volunteers')}
                        className="flex items-center gap-3 p-4 bg-purple-500/20 rounded-xl hover:bg-purple-500/30 transition text-left"
                      >
                        <span className="text-2xl">🙋</span>
                        <div>
                          <p className="text-white font-semibold">Volunteers</p>
                          <p className="text-slate-400 text-xs">{volunteers.length} assigned</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Game Info Summary */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">📍 Game Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-xs">Opponent</p>
                        <p className="text-white font-semibold text-lg">{event.opponent_name || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Location</p>
                        <p className="text-white font-semibold">{event.location_type === 'home' ? '🏠 Home' : event.location_type === 'away' ? '✈️ Away' : '🏟️ Neutral'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Venue</p>
                        <p className="text-white">{event.venue_name || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Time</p>
                        <p className="text-white">{event.event_time ? formatTime12(event.event_time) : 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Coach Notes */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">📝 Game Notes</h4>
                    <p className="text-slate-300 text-sm">{event.description || 'No notes added'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 flex justify-between">
          <button onClick={() => onDelete(event.id)} className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl">
            🗑️ Delete Event
          </button>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Close</button>
                <button onClick={() => setIsEditing(true)} className="px-6 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Edit className="w-4 h-4 inline mr-1" />Edit Event</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Player Card Expanded Modal */}
{selectedPlayer && (
  <PlayerCardExpanded
    player={selectedPlayer}
    visible={!!selectedPlayer}
    onClose={() => setSelectedPlayer(null)}
    context="roster"
    viewerRole="admin"
    seasonId={selectedSeason?.id}
    sport={selectedSeason?.sport || 'volleyball'}
    isOwnChild={false}
  />
)}

      {/* Coach Detail Modal */}
      {selectedCoach && (
        <CoachDetailModal
          coach={selectedCoach}
          onClose={() => setSelectedCoach(null)}
        />
      )}

      {/* Lineup Builder Modal */}
      {showLineupBuilder && event.team_id && (
        <LineupBuilder
          event={event}
          team={teams?.find(t => t.id === event.team_id) || { id: event.team_id, name: event.teams?.name }}
          onClose={() => setShowLineupBuilder(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// Helper components for Rich Event Modal
function DetailItem({ label, value, highlight }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-white font-medium" style={highlight ? { color: highlight } : {}}>{value || '—'}</div>
    </div>
  )
}

function VolunteerSlot({ role, volunteer, icon, onClick }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-slate-400 text-sm">{role}</span>
      </div>
      {volunteer ? (
        <span className="text-emerald-400 text-sm">{volunteer.profiles?.full_name || 'Assigned'}</span>
      ) : (
        <button 
          onClick={onClick}
          className="text-[var(--accent-primary)] text-sm hover:underline"
        >
          Need Volunteer →
        </button>
      )}
    </div>
  )
}

// Export
export { SchedulePage, getEventColor, formatTime, formatTime12 }
