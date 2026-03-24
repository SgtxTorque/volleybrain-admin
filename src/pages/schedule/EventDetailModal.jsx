import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Edit, X, Check, Link, Clock, MapPin, Trophy, Target, Award, Calendar
} from '../../constants/icons'
import { PlayerCardExpanded } from '../../components/players'
import { CoachDetailModal } from '../../pages/coaches/CoachesPage'
import { getEventColor, formatTime12 } from './scheduleHelpers'

// ── Event type config ──
const TYPE_CONFIG = {
  game:       { icon: Trophy,  label: 'Game',       bg: 'bg-[#10284C]', text: 'text-white', accent: '#F59E0B' },
  practice:   { icon: Target,  label: 'Practice',   bg: 'bg-emerald-500/10', text: 'text-emerald-800', accent: '#10B981' },
  tournament: { icon: Award,   label: 'Tournament', bg: 'bg-purple-500/10', text: 'text-purple-800', accent: '#8B5CF6' },
  team_event: { icon: Users,   label: 'Team Event', bg: 'bg-sky-500/10', text: 'text-sky-800', accent: '#3B82F6' },
  other:      { icon: Calendar, label: 'Event',     bg: 'bg-slate-100', text: 'text-slate-700', accent: '#94A3B8' },
}

function EventDetailModal({ event, teams, venues, onClose, onUpdate, onDelete, onUpdateSeries, onDeleteSeries, activeView, showToast, selectedSeason, parentChildIds = [], onShareGameDay, parentTutorial }) {
  const { isAdmin: hasAdminRole, profile, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const isAdminView = activeView ? (activeView === 'admin' || activeView === 'coach' || activeView === 'team_manager') : hasAdminRole
  const isParentView = activeView === 'parent'

  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSeriesMenu, setShowSeriesMenu] = useState(null)

  // Data
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [volunteers, setVolunteers] = useState([])
  const [coaches, setCoaches] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [availableParents, setAvailableParents] = useState([])
  const [volunteerAssignModal, setVolunteerAssignModal] = useState(null)

  const [form, setForm] = useState({
    team_id: event.team_id || '',
    event_type: event.event_type || 'practice',
    title: event.title || '',
    description: event.description || '',
    start_date: event.event_date || '',
    start_time: event.event_time || '',
    end_time: event.end_time || '',
    venue_name: event.venue_name || '',
    venue_address: event.venue_address || '',
    court_number: event.court_number || '',
    location_type: event.location_type || 'home',
    opponent_name: event.opponent_name || ''
  })

  useEffect(() => { if (event?.id) loadEventData() }, [event?.id])

  async function loadEventData() {
    setLoading(true)
    try {
      if (event.team_id) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('*, players(id, first_name, last_name, jersey_number, position, photo_url, grade, status)')
          .eq('team_id', event.team_id)
        setRoster(teamPlayers?.map(tp => tp.players).filter(Boolean) || [])

        const { data: teamCoaches } = await supabase
          .from('team_coaches')
          .select('*, coaches(id, first_name, last_name, email, phone)')
          .eq('team_id', event.team_id)
        setCoaches(teamCoaches?.map(tc => tc.coaches ? { ...tc.coaches, role: tc.role } : null).filter(Boolean) || [])
      }

      const { data: rsvpData } = await supabase.from('event_rsvps').select('*').eq('event_id', event.id)
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
      setRsvps(rsvpMap)

      const { data: volunteerData } = await supabase
        .from('event_volunteers').select('*, profiles(id, full_name, email)').eq('event_id', event.id)
      setVolunteers(volunteerData || [])

      const { data: parentsData } = await supabase.from('profiles').select('id, full_name, email').order('first_name')
      setAvailableParents(parentsData || [])
    } catch (err) { console.error('Error loading event data:', err) }
    setLoading(false)
  }

  async function updateRsvp(playerId, status) {
    const existing = rsvps[playerId]
    if (existing) {
      await supabase.from('event_rsvps').update({ status, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('event_rsvps').insert({ event_id: event.id, player_id: playerId, status, responded_at: new Date().toISOString() })
    }
    const { data: rsvpData } = await supabase.from('event_rsvps').select('*').eq('event_id', event.id)
    const rsvpMap = {}
    rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
    setRsvps(rsvpMap)
    if (isParentView) parentTutorial?.completeStep?.('first_rsvp')
  }

  async function removeVolunteer(volunteerId) {
    await supabase.from('event_volunteers').delete().eq('id', volunteerId)
    setVolunteers(volunteers.filter(v => v.id !== volunteerId))
  }

  async function assignVolunteer(role, position, profileId) {
    const existing = volunteers.find(v => v.role === role && v.position === position)
    if (existing) return
    const { data, error } = await supabase.from('event_volunteers')
      .insert({ event_id: event.id, profile_id: profileId, role, position })
      .select('*, profiles(id, full_name, email)').single()
    if (!error && data) setVolunteers([...volunteers, data])
  }

  async function handleSave() {
    const success = await onUpdate(event.id, {
      team_id: form.team_id || null, event_type: form.event_type, title: form.title,
      description: form.description, event_date: form.start_date, event_time: form.start_time,
      end_time: form.end_time, venue_name: form.venue_name, venue_address: form.venue_address,
      court_number: form.court_number || null, location_type: form.location_type, opponent_name: form.opponent_name
    })
    if (success) { setIsEditing(false); loadEventData() }
  }

  // Computed
  const rsvpCounts = {
    yes: Object.values(rsvps).filter(r => r.status === 'yes').length,
    no: Object.values(rsvps).filter(r => r.status === 'no').length,
    maybe: Object.values(rsvps).filter(r => r.status === 'maybe').length,
    pending: roster.length - Object.keys(rsvps).length
  }
  const isGame = event.event_type === 'game' || event.event_type === 'tournament'
  const typeConfig = TYPE_CONFIG[event.event_type] || TYPE_CONFIG.other
  const TypeIcon = typeConfig.icon
  const teamColor = event.teams?.color || '#6366F1'
  const getVolunteer = (role, position) => volunteers.find(v => v.role === role && v.position === position)

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'}`
  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`

  // ── RENDER ──
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${
        isDark ? 'bg-[#0D1B2F] border border-white/[0.08]' : 'bg-white border border-[#E8ECF2] shadow-2xl'
      }`} onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className={`shrink-0 ${isGame ? 'bg-[#10284C]' : (isDark ? 'bg-[#132240]' : 'bg-[#F5F6F8]')}`}>
          <div className="px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      isGame ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'
                    }`}>
                      {event.teams?.name || 'All Teams'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      isGame ? 'bg-white/10 text-white' : `${typeConfig.bg} ${typeConfig.text}`
                    }`}>
                      {typeConfig.label}
                    </span>
                    {event.series_id && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4BB9EC]/15 text-[#4BB9EC] flex items-center gap-0.5">
                        <Link className="w-2.5 h-2.5" /> Series
                      </span>
                    )}
                  </div>
                  <h2 className={`text-lg font-bold tracking-tight ${isGame ? 'text-white' : (isDark ? 'text-white' : 'text-[#10284C]')}`}>
                    {event.title || event.event_type}
                  </h2>
                  <div className={`flex items-center gap-3 mt-1 text-xs ${isGame ? 'text-white/60' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                      {event.event_time && ` · ${formatTime12(event.event_time)}`}
                      {event.end_time && ` — ${formatTime12(event.end_time)}`}
                    </span>
                    {(event.venue_name || event.location) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue_name || event.location}
                        {event.court_number && ` · Ct ${event.court_number}`}
                      </span>
                    )}
                  </div>
                  {isGame && (event.opponent_name || event.location_type) && (
                    <div className="flex items-center gap-3 mt-1">
                      {event.opponent_name && (
                        <span className="text-sm font-bold text-white">vs {event.opponent_name}</span>
                      )}
                      {event.location_type && (
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          event.location_type === 'home' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {event.location_type}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(event.event_type === 'game' || event.event_type === 'tournament') && onShareGameDay && (
                  <button onClick={() => onShareGameDay(event)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      isGame ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#4BB9EC]/10 text-[#4BB9EC] hover:bg-[#4BB9EC]/20'
                    }`}>
                    🏟️ Share
                  </button>
                )}
                <button onClick={onClose} className={`p-1.5 rounded-lg transition ${
                  isGame ? 'text-white/50 hover:text-white hover:bg-white/10' : (isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600')
                }`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── TABS ── */}
          {!isEditing && (
            <div className="flex px-5">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'attendance', label: `Attendance (${roster.length})`, badge: rsvpCounts.pending > 0 ? rsvpCounts.pending : null },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? (isGame ? 'text-[#4BB9EC] border-[#4BB9EC]' : 'text-[#4BB9EC] border-[#4BB9EC]')
                      : (isGame ? 'text-white/30 border-transparent hover:text-white/60' : `${isDark ? 'text-slate-500 border-transparent hover:text-slate-300' : 'text-slate-400 border-transparent hover:text-slate-600'}`)
                  }`}>
                  {tab.label}
                  {tab.badge && <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-red-500/20 text-red-400">{tab.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEditing ? (
            /* ── EDIT FORM ── */
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})} className={inputCls}>
                    <option value="practice">Practice</option>
                    <option value="game">Game</option>
                    <option value="tournament">Tournament</option>
                    <option value="team_event">Team Event</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Team</label>
                  <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} className={inputCls}>
                    <option value="">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Week 3 Practice" className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>Date</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Start</label><input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>End</label><input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Venue</label><input type="text" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Address</label><input type="text" value={form.venue_address} onChange={e => setForm({...form, venue_address: e.target.value})} className={inputCls} /></div>
              </div>
              {(form.event_type === 'game' || form.event_type === 'tournament') && (
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Opponent</label><input type="text" value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Location</label>
                    <select value={form.location_type} onChange={e => setForm({...form, location_type: e.target.value})} className={inputCls}>
                      <option value="home">Home</option><option value="away">Away</option><option value="neutral">Neutral</option>
                    </select>
                  </div>
                  <div><label className={labelCls}>Court #</label><input type="text" value={form.court_number} onChange={e => setForm({...form, court_number: e.target.value})} className={inputCls} /></div>
                </div>
              )}
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className={`${inputCls} resize-none`} />
              </div>
            </div>
          ) : activeTab === 'overview' ? (
            /* ── OVERVIEW TAB ── */
            <div className="p-5 space-y-5">
              {/* RSVP Summary Strip */}
              <div>
                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Attendance</h3>
                <div className="flex gap-2">
                  {[
                    { label: 'Going', count: rsvpCounts.yes, color: 'text-emerald-500', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
                    { label: 'No', count: rsvpCounts.no, color: 'text-red-500', bg: isDark ? 'bg-red-500/10' : 'bg-red-50' },
                    { label: 'Maybe', count: rsvpCounts.maybe, color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
                    { label: 'Pending', count: rsvpCounts.pending, color: isDark ? 'text-slate-400' : 'text-slate-500', bg: isDark ? 'bg-white/[0.04]' : 'bg-slate-50' },
                  ].map(s => (
                    <div key={s.label} className={`flex-1 text-center py-2 rounded-lg ${s.bg}`}>
                      <div className={`text-lg font-black ${s.color}`}>{s.count}</div>
                      <div className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coaches */}
              {coaches.length > 0 && (
                <div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Coaches ({coaches.length})</h3>
                  <div className={`rounded-xl border ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                    <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                      {coaches.map(coach => (
                        <div key={coach.id} className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
                          onClick={() => setSelectedCoach(coach)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              {(coach.first_name || '?').charAt(0)}{(coach.last_name || '').charAt(0)}
                            </div>
                            <div>
                              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{coach.first_name} {coach.last_name}</span>
                              <span className={`text-xs ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{coach.role || 'coach'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Volunteers (games only) */}
              {isGame && (
                <div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Volunteers</h3>
                  <div className={`rounded-xl border ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                    <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                      {['Line Judge', 'Scorekeeper'].map(role => {
                        const slots = ['Primary', 'Backup 1', 'Backup 2']
                        return slots.map(pos => {
                          const vol = getVolunteer(role, pos)
                          return (
                            <div key={`${role}-${pos}`} className="px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{role}</span>
                                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pos}</span>
                              </div>
                              {vol ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-emerald-500 font-semibold">{vol.profiles?.full_name}</span>
                                  {isAdminView && (
                                    <button onClick={() => removeVolunteer(vol.id)} className="text-red-400 text-xs hover:underline">Remove</button>
                                  )}
                                </div>
                              ) : isAdminView ? (
                                <button onClick={() => setVolunteerAssignModal({ role, position: pos })}
                                  className="text-xs font-bold text-[#4BB9EC] hover:underline">+ Assign</button>
                              ) : (
                                <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Open</span>
                              )}
                            </div>
                          )
                        })
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {event.description && (
                <div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Notes</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{event.description}</p>
                </div>
              )}
            </div>
          ) : (
            /* ── ATTENDANCE TAB ── */
            <div className="p-5">
              <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                  {roster.map(player => {
                    const rsvp = rsvps[player.id]
                    const status = rsvp?.status || 'pending'
                    return (
                      <div key={player.id} className={`px-4 py-2 flex items-center gap-3 ${
                        status === 'yes' ? (isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50') :
                        status === 'no' ? (isDark ? 'bg-red-500/5' : 'bg-red-50/30') : ''
                      }`}>
                        {/* Photo */}
                        {player.photo_url ? (
                          <img src={player.photo_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer" onClick={() => setSelectedPlayer(player)} />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                            onClick={() => setSelectedPlayer(player)}>
                            {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
                          </div>
                        )}
                        {/* Number */}
                        {player.jersey_number && (
                          <span className={`text-sm font-black w-6 text-center ${isDark ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'}`}>
                            {player.jersey_number}
                          </span>
                        )}
                        {/* Name + info */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                            {player.first_name} {player.last_name}
                          </span>
                          <span className={`text-xs ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {player.position || ''}{player.grade ? ` · Grade ${player.grade}` : ''}
                          </span>
                        </div>
                        {/* RSVP status + buttons */}
                        {isAdminView || isParentView ? (
                          <div className="flex items-center gap-1 shrink-0">
                            {['yes', 'no', 'maybe'].map(s => (
                              <button key={s} onClick={() => updateRsvp(player.id, s)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  status === s
                                    ? s === 'yes' ? 'bg-emerald-500 text-white'
                                      : s === 'no' ? 'bg-red-500 text-white'
                                      : 'bg-amber-500 text-white'
                                    : isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}>
                                {s === 'yes' ? '✓ Yes' : s === 'no' ? '✗ No' : '? Maybe'}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            status === 'yes' ? 'bg-emerald-500/15 text-emerald-500' :
                            status === 'no' ? 'bg-red-500/15 text-red-500' :
                            status === 'maybe' ? 'bg-amber-500/15 text-amber-500' :
                            isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {status === 'yes' ? 'Going' : status === 'no' ? 'No' : status === 'maybe' ? 'Maybe' : 'Pending'}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {roster.length === 0 && (
                    <div className={`px-4 py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      No players on this team's roster
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className={`px-5 py-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} flex justify-between shrink-0`}>
          <div className="relative">
            {event.series_id && onDeleteSeries ? (
              <>
                <button onClick={() => setShowSeriesMenu(showSeriesMenu === 'delete' ? null : 'delete')}
                  className="px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition">
                  Delete ▾
                </button>
                {showSeriesMenu === 'delete' && (
                  <div className={`absolute bottom-full left-0 mb-2 w-52 rounded-xl shadow-2xl z-30 border overflow-hidden ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => { setShowSeriesMenu(null); onDelete(event.id) }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                      Delete this event only
                    </button>
                    <button onClick={() => { setShowSeriesMenu(null); onDeleteSeries(event.series_id, true, event.event_date) }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium text-red-400 transition ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                      Delete all future in series
                    </button>
                    <button onClick={() => { setShowSeriesMenu(null); onDeleteSeries(event.series_id, false) }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium text-red-500 transition ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                      Delete entire series
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => onDelete(event.id)} className="px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition">
                Delete Event
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-[#E8ECF2] text-slate-600 hover:bg-slate-50'}`}>
                  Cancel
                </button>
                {event.series_id && onUpdateSeries ? (
                  <div className="relative">
                    <button onClick={() => setShowSeriesMenu(showSeriesMenu === 'edit' ? null : 'edit')}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition">
                      Save ▾
                    </button>
                    {showSeriesMenu === 'edit' && (
                      <div className={`absolute bottom-full right-0 mb-2 w-52 rounded-xl shadow-2xl z-30 border overflow-hidden ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => { setShowSeriesMenu(null); handleSave() }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-medium transition ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                          Save this event only
                        </button>
                        <button onClick={async () => {
                          setShowSeriesMenu(null)
                          await onUpdateSeries(event.series_id, {
                            event_type: form.event_type, title: form.title, description: form.description,
                            event_time: form.start_time, end_time: form.end_time, venue_name: form.venue_name,
                            venue_address: form.venue_address, court_number: form.court_number || null,
                            location_type: form.location_type, opponent_name: form.opponent_name
                          })
                          setIsEditing(false)
                        }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-medium transition ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                          Update all in series
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleSave} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition">
                    Save Changes
                  </button>
                )}
              </>
            ) : (
              <>
                <button onClick={onClose}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-[#E8ECF2] text-slate-600 hover:bg-slate-50'}`}>
                  Close
                </button>
                {isAdminView && (
                  <button onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#4BB9EC]/10 text-[#4BB9EC] hover:bg-[#4BB9EC]/20 transition flex items-center gap-1.5">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {selectedPlayer && (
        <PlayerCardExpanded player={selectedPlayer} visible={!!selectedPlayer} onClose={() => setSelectedPlayer(null)}
          context="roster" viewerRole="admin" seasonId={selectedSeason?.id} sport={selectedSeason?.sport || 'volleyball'} isOwnChild={false} />
      )}
      {selectedCoach && <CoachDetailModal coach={selectedCoach} onClose={() => setSelectedCoach(null)} />}

      {/* Volunteer Assign Modal */}
      {volunteerAssignModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]" onClick={() => setVolunteerAssignModal(null)}>
          <div className={`w-full max-w-sm rounded-xl p-5 ${isDark ? 'bg-[#132240] border border-white/[0.08]' : 'bg-white border border-[#E8ECF2] shadow-xl'}`}
            onClick={e => e.stopPropagation()}>
            <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
              Assign {volunteerAssignModal.role} — {volunteerAssignModal.position}
            </h3>
            <div className={`max-h-60 overflow-y-auto divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
              {availableParents.map(p => (
                <button key={p.id} onClick={() => { assignVolunteer(volunteerAssignModal.role, volunteerAssignModal.position, p.id); setVolunteerAssignModal(null) }}
                  className={`w-full text-left px-3 py-2 text-sm transition ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {p.full_name || p.email}
                </button>
              ))}
            </div>
            <button onClick={() => setVolunteerAssignModal(null)}
              className={`mt-3 w-full py-2 rounded-lg text-xs font-bold ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailModal
