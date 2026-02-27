import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  ChevronLeft, ChevronRight, BarChart3, Share2
} from '../../constants/icons'
import { SkeletonSchedulePage } from '../../components/ui'
import SchedulePosterModal from './SchedulePosterModal'
import GameDayShareModal from './GameDayShareModal'
import { getEventColor, formatTime, formatTime12, VolleyballIcon } from './scheduleHelpers'
import { MonthView, WeekView, DayView, ListView } from './CalendarViews'
import LineupBuilder from './LineupBuilder'
import GameCompletionModal from './GameCompletionModal'
import AddEventModal from './AddEventModal'
import BulkPracticeModal from './BulkPracticeModal'
import BulkGamesModal from './BulkGamesModal'
import VenueManagerModal from './VenueManagerModal'
import AvailabilitySurveyModal from './AvailabilitySurveyModal'
import EventDetailModal from './EventDetailModal'

// Helper functions moved to ./scheduleHelpers.js
// Calendar views moved to ./CalendarViews.jsx

function SchedulePage({ showToast, activeView, roleContext }) {
  const journey = useJourney()
  const parentTutorial = useParentTutorial()
  const { organization } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const [events, setEvents] = useState([])
  const [teams, setTeams] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('month') // month, week, day, list
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedEventType, setSelectedEventType] = useState('all')
  
  // Parent view restrictions
  const isParentView = activeView === 'parent'
  const isPlayerView = activeView === 'player'
  const parentChildIds = roleContext?.children?.map(c => c.id) || []
  
  // Complete "view_schedule" step for parents when they visit this page
  useEffect(() => {
    if (isParentView) {
      parentTutorial?.completeStep?.('view_schedule')
    }
  }, [isParentView])
  
  // Modals
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showBulkPractice, setShowBulkPractice] = useState(false)
  const [showBulkGames, setShowBulkGames] = useState(false)
  const [showVenueManager, setShowVenueManager] = useState(false)
  const [showAvailabilitySurvey, setShowAvailabilitySurvey] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showPosterModal, setShowPosterModal] = useState(false)
  const [showGameDayCard, setShowGameDayCard] = useState(null) // event object or null
  const [allUpcomingGames, setAllUpcomingGames] = useState([])

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
      .select('*, teams!schedule_events_team_id_fkey(id, name, color, logo_url)')
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
      .select('id, name, color, logo_url')
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

  // Load upcoming games for the hero strip
  useEffect(() => {
    if (selectedSeason?.id) loadAllUpcoming()
  }, [selectedSeason?.id, selectedTeam])

  async function loadAllUpcoming() {
    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('schedule_events')
      .select('*, teams!schedule_events_team_id_fkey(id, name, color, logo_url)')
      .eq('season_id', selectedSeason.id)
      .eq('event_type', 'game')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
      .limit(6)
    const { data } = await query
    setAllUpcomingGames(data || [])
  }

  if (!selectedSeason) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={tc.textMuted}>Please select a season from the sidebar</p>
      </div>
    )
  }

  const sportIcon = selectedSeason?.sports?.icon || '🏐'
  const upcomingGames = filteredEvents.filter(e => e.event_type === 'game' && new Date(e.event_date) >= new Date())

  function formatGameDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date(); today.setHours(0,0,0,0)
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    if (d.getTime() === today.getTime()) return 'TODAY'
    if (d.getTime() === tomorrow.getTime()) return 'TOMORROW'
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  }

  function formatGameDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function formatGameTime(timeStr) {
    if (!timeStr) return 'TBD'
    const [h,m] = timeStr.split(':'); const hr = parseInt(h)
    return `${hr>12?hr-12:hr===0?12:hr}:${m} ${hr>=12?'PM':'AM'}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {sportIcon}
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${tc.text}`}>Schedule</h1>
              <p className={`text-sm ${tc.textMuted}`}>{selectedSeason.name} • {filteredEvents.length} events this month</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Share & Export dropdown — available to ALL roles */}
          <div className="relative">
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                isDark 
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Share2 className="w-4 h-4" /> Share & Export ▾
            </button>
            {showShareMenu && (
              <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-30 border overflow-hidden ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500 bg-slate-900/50' : 'text-slate-400 bg-slate-50'}`}>
                  Generate
                </div>
                <button onClick={() => { setShowPosterModal(true); setShowShareMenu(false) }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                  <span className="text-lg">📋</span>
                  <div>
                    <div className="font-semibold text-sm">Season Poster</div>
                    <div className={`text-xs ${tc.textMuted}`}>Branded schedule graphic</div>
                  </div>
                </button>
                {upcomingGames.length > 0 && (
                  <button onClick={() => { setShowGameDayCard(upcomingGames[0]); setShowShareMenu(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span className="text-lg">🏟️</span>
                    <div>
                      <div className="font-semibold text-sm">Game Day Card</div>
                      <div className={`text-xs ${tc.textMuted}`}>Share next game on social</div>
                    </div>
                  </button>
                )}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t ${isDark ? 'text-slate-500 bg-slate-900/50 border-slate-700' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                  Export
                </div>
                <button onClick={() => { exportToICal(); setShowShareMenu(false) }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                  <span className="text-lg">📅</span>
                  <div>
                    <div className="font-semibold text-sm">Export to Calendar</div>
                    <div className={`text-xs ${tc.textMuted}`}>iCal (.ics) for Google/Apple</div>
                  </div>
                </button>
                <button onClick={() => { window.print(); setShowShareMenu(false) }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                  <span className="text-lg">🖨️</span>
                  <div>
                    <div className="font-semibold text-sm">Print Schedule</div>
                    <div className={`text-xs ${tc.textMuted}`}>Print or save as PDF</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          {/* Add Events — admin/coach only */}
          {!isParentView && !isPlayerView && (
            <div className="relative">
              <button 
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="bg-[var(--accent-primary)] text-white font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 flex items-center gap-2 text-sm shadow-sm"
              >
                ➕ Add Events ▾
              </button>
              {showQuickActions && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-30 border overflow-hidden ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <button onClick={() => { setShowAddEvent(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span>📝</span> Single Event
                  </button>
                  <button onClick={() => { setShowBulkPractice(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span>🔄</span> Recurring Practice
                  </button>
                  <button onClick={() => { setShowBulkGames(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <VolleyballIcon className="w-4 h-4" /> Bulk Add Games
                  </button>
                  <button onClick={() => { setShowVenueManager(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span>📍</span> Manage Venues
                  </button>
                  <button onClick={() => { setShowAvailabilitySurvey(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <BarChart3 className="w-5 h-5" /> Availability Survey
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ UPCOMING GAMES STRIP ═══ */}
      {allUpcomingGames.length > 0 && (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`px-5 py-3 flex items-center justify-between border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upcoming Games</span>
            </div>
            {upcomingGames.length > 0 && (
              <button 
                onClick={() => setShowGameDayCard(allUpcomingGames[0])}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Next Game
              </button>
            )}
          </div>
          <div className="p-3 flex gap-3 overflow-x-auto">
            {allUpcomingGames.slice(0, 5).map((game, i) => {
              const gameTeam = game.teams || teams.find(t => t.id === game.team_id)
              const teamCol = gameTeam?.color || '#6366F1'
              const isToday = formatGameDay(game.event_date) === 'TODAY'
              const isTomorrow = formatGameDay(game.event_date) === 'TOMORROW'
              return (
                <button 
                  key={game.id} 
                  onClick={() => setSelectedEvent(game)}
                  className={`flex-shrink-0 rounded-xl p-3 text-left transition-all border-2 hover:shadow-md ${
                    isToday 
                      ? 'border-amber-400 shadow-amber-100' 
                      : isTomorrow
                        ? (isDark ? 'border-slate-600 hover:border-slate-500' : 'border-blue-200 hover:border-blue-300')
                        : (isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300')
                  }`}
                  style={{ 
                    minWidth: 180,
                    background: isToday 
                      ? (isDark ? `${teamCol}15` : `${teamCol}08`) 
                      : isDark ? 'rgba(30,41,59,0.5)' : '#fff'
                  }}
                >
                  {/* Day badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isToday ? 'bg-amber-400 text-amber-900' : isTomorrow ? 'bg-blue-100 text-blue-700' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {formatGameDay(game.event_date)}
                    </span>
                    {/* Share button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowGameDayCard(game) }}
                      className={`p-1 rounded-md transition ${isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'}`}
                      title="Share game"
                    >
                      <Share2 className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </button>
                  </div>
                  {/* Opponent */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: teamCol }} />
                    <div>
                      <div className={`text-sm font-extrabold ${tc.text} leading-tight`}>
                        vs. {game.opponent_name || game.opponent || 'TBD'}
                      </div>
                      {gameTeam?.name && (
                        <div className={`text-xs font-bold ${tc.textMuted}`}>{gameTeam.name}</div>
                      )}
                    </div>
                  </div>
                  {/* Date + Time */}
                  <div className={`text-[11px] font-semibold ${tc.textMuted}`}>
                    {formatGameDate(game.event_date)} • {formatGameTime(game.event_time)}
                  </div>
                  {game.venue_name && (
                    <div className={`text-[10px] ${tc.textMuted} mt-0.5 truncate max-w-[160px]`}>📍 {game.venue_name}{game.court_number ? ` · ${game.court_number}` : ''}</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium border ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
            <option value="all">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={selectedEventType} onChange={e => setSelectedEventType(e.target.value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium border ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
            <option value="all">All Types</option>
            <option value="practice">Practices</option>
            <option value="game">Games</option>
            <option value="tournament">Tournaments</option>
            <option value="team_event">Team Events</option>
            <option value="other">Other</option>
          </select>
          {/* Event type legend dots */}
          <div className="hidden sm:flex items-center gap-3 ml-2">
            {[
              { type: 'practice', label: 'Practice', color: '#10B981' },
              { type: 'game', label: 'Game', color: '#F59E0B' },
              { type: 'tournament', label: 'Tourney', color: '#8B5CF6' },
            ].map(t => (
              <div key={t.type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className={`text-xs font-medium ${tc.textMuted}`}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-xl p-1 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            {['month', 'week', 'day', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                  view === v 
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                    : `${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                }`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className={`flex items-center justify-between rounded-xl p-3 border ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button onClick={prevMonth} className={`p-2 rounded-lg transition font-semibold text-sm ${
          isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
        }`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className={`text-lg font-extrabold ${tc.text}`}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToToday} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>
            Today
          </button>
        </div>
        <button onClick={nextMonth} className={`p-2 rounded-lg transition font-semibold text-sm ${
          isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
        }`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar View */}
      {loading ? (
        <SkeletonSchedulePage />
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
      <div className={`text-center text-sm ${tc.textMuted}`}>
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
          selectedSeason={selectedSeason}
          parentChildIds={parentChildIds}
          showToast={showToast}
          onShareGameDay={(evt) => { setSelectedEvent(null); setShowGameDayCard(evt) }}
          parentTutorial={parentTutorial}
        />
      )}

      {/* Season Poster Modal */}
      {showPosterModal && (
        <SchedulePosterModal
          season={selectedSeason}
          team={selectedTeam !== 'all' ? teams.find(t => t.id === selectedTeam) : teams[0]}
          organization={organization}
          events={events}
          onClose={() => setShowPosterModal(false)}
          showToast={showToast}
        />
      )}

      {/* Game Day Share Card */}
      {showGameDayCard && (
        <GameDayShareModal
          event={showGameDayCard}
          team={teams.find(t => t.id === showGameDayCard.team_id) || teams[0]}
          organization={organization}
          season={selectedSeason}
          onClose={() => setShowGameDayCard(null)}
          showToast={showToast}
        />
      )}

      {/* Click outside to close menus */}
      {(showQuickActions || showShareMenu) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowQuickActions(false); setShowShareMenu(false) }} />
      )}
    </div>
  )
}

export { SchedulePage, getEventColor, formatTime, formatTime12 }
