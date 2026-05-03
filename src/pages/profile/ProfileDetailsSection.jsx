import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { loadMyChildren } from '../../lib/parent-utils'
import { useAuth } from '../../contexts/AuthContext'
import {
  Save, Users, Calendar, MapPin,
  AlertTriangle, UserCog, RefreshCw
} from '../../constants/icons'

// Helper: format time to 12-hour
function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return hour12 + ':' + minutes + ' ' + ampm
  } catch { return timeStr }
}

// ============================================
// EMERGENCY CONTACT SECTION
// ============================================
export function EmergencyContactSection({ profile, isDark, tc, showToast, onProfileUpdate }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  })

  useEffect(() => {
    if (profile) {
      const hasProfileData = profile.emergency_contact_name || profile.emergency_contact_phone
      if (hasProfileData) {
        setForm({
          emergency_contact_name: profile.emergency_contact_name || '',
          emergency_contact_phone: profile.emergency_contact_phone || '',
          emergency_contact_relation: profile.emergency_contact_relation || '',
        })
      } else {
        // Fallback: try to load from parent's children player records
        loadFallbackFromPlayers()
      }
    }
  }, [profile])

  async function loadFallbackFromPlayers() {
    try {
      const { data: children } = await supabase
        .from('players')
        .select('emergency_contact_name, emergency_contact_phone')
        .eq('parent_account_id', profile.id)
        .not('emergency_contact_name', 'is', null)
        .limit(1)
      if (children?.length) {
        setForm(f => ({
          ...f,
          emergency_contact_name: f.emergency_contact_name || children[0].emergency_contact_name || '',
          emergency_contact_phone: f.emergency_contact_phone || children[0].emergency_contact_phone || '',
        }))
      }
    } catch { /* silently fail — non-critical fallback */ }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
      if (error) throw error
      onProfileUpdate?.({ ...profile, ...form })
      showToast('Emergency contact updated', 'success')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'

  return (
    <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
      <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        Emergency Contact
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Contact Name</label>
          <input
            type="text"
            value={form.emergency_contact_name}
            onChange={e => set('emergency_contact_name', e.target.value)}
            placeholder="Jane Doe"
            className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
          />
        </div>
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Phone</label>
          <input
            type="tel"
            value={form.emergency_contact_phone}
            onChange={e => set('emergency_contact_phone', e.target.value)}
            placeholder="(555) 987-6543"
            className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
          />
        </div>
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Relationship</label>
          <input
            type="text"
            value={form.emergency_contact_relation}
            onChange={e => set('emergency_contact_relation', e.target.value)}
            placeholder="Spouse, Parent, etc."
            className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-r-sm font-bold text-white bg-lynx-navy hover:brightness-110 transition disabled:opacity-50 mt-4"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Emergency Contact'}
      </button>
    </div>
  )
}

// ============================================
// COACH SECTION
// ============================================
export function CoachSection({ profile, isDark, tc, showToast }) {
  const [coachData, setCoachData] = useState(null)
  const [teams, setTeams] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bio, setBio] = useState('')

  useEffect(() => { loadCoachData() }, [profile?.id])

  async function loadCoachData() {
    setLoading(true)
    try {
      const { data: coach } = await supabase
        .from('coaches')
        .select('*, team_coaches(team_id, role, teams(id, name, color, season_id))')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (coach) {
        setCoachData(coach)
        setBio(coach.bio || '')

        const teamEntries = coach.team_coaches || []
        setTeams(teamEntries)

        const teamIds = teamEntries.map(t => t.team_id).filter(Boolean)
        if (teamIds.length > 0) {
          const today = new Date().toISOString().split('T')[0]
          const { data: events } = await supabase
            .from('schedule_events')
            .select('*, teams!schedule_events_team_id_fkey(id, name, color)')
            .in('team_id', teamIds)
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true })
            .limit(10)
          setSchedule(events || [])
        }
      }
    } catch (err) { console.error('Error loading coach data:', err) }
    setLoading(false)
  }

  async function handleSaveBio() {
    if (!coachData?.id) return
    setSaving(true)
    try {
      const { error } = await supabase.from('coaches').update({ bio }).eq('id', coachData.id)
      if (error) throw error
      showToast('Bio updated', 'success')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
  const rowBg = isDark ? 'bg-white/[0.03]' : 'bg-lynx-cloud'

  if (loading) {
    return (
      <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!coachData) return null

  return (
    <>
      {/* Bio Section */}
      <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
        <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-5 flex items-center gap-2`}>
          <UserCog className="w-4 h-4 text-lynx-sky" />
          Coach Profile
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Bio / About Me</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              placeholder="Tell players and parents about your coaching background..."
              className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none resize-none ${inputCls}`}
            />
          </div>

          <button
            onClick={handleSaveBio}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-r-sm font-bold text-white bg-lynx-navy hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Bio'}
          </button>
        </div>
      </div>

      {/* Assigned Teams */}
      <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
        <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-4 flex items-center gap-2`}>
          <Users className="w-4 h-4 text-lynx-sky" />
          My Teams
        </h2>
        {teams.length === 0 ? (
          <p className={`text-r-sm ${tc.textMuted}`}>No team assignments found</p>
        ) : (
          <div className="space-y-2">
            {teams.map((tc_item, i) => (
              <div key={tc_item.team_id || i} className={`flex items-center gap-3 p-3 rounded-lg ${rowBg}`}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-r-sm font-bold"
                  style={{ background: tc_item.teams?.color || '#10284C' }}
                >
                  {tc_item.teams?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className={`text-r-sm font-semibold ${tc.text}`}>{tc_item.teams?.name || 'Unknown Team'}</p>
                  <p className={`text-r-xs ${tc.textMuted}`}>{tc_item.role === 'head' ? 'Head Coach' : tc_item.role === 'assistant' ? 'Assistant Coach' : tc_item.role || 'Coach'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Schedule */}
      <ScheduleList
        title="Upcoming Schedule"
        schedule={schedule}
        isDark={isDark}
        tc={tc}
      />
    </>
  )
}

// ============================================
// PARENT SECTION
// ============================================
export function ParentSection({ profile, isDark, tc }) {
  const { organization } = useAuth()
  const [children, setChildren] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadParentData() }, [profile?.id, organization?.id])

  async function loadParentData() {
    setLoading(true)
    try {
      // Scope children to active organization (supports primary + secondary parents)
      let orgSeasonIds = []
      if (organization?.id) {
        const { data: orgSeasons } = await supabase.from('seasons').select('id').eq('organization_id', organization.id)
        orgSeasonIds = orgSeasons?.map(s => s.id) || []
      }
      const childIds = await loadMyChildren(profile.id, orgSeasonIds, 'id')
      let kids = []
      if (childIds.length > 0) {
        const { data } = await supabase
          .from('players')
          .select('*, team_players(team_id, jersey_number, teams(id, name, color, season_id))')
          .in('id', childIds.map(c => c.id))
        kids = data || []
      }

      setChildren(kids || [])

      const teamIds = [...new Set(
        (kids || []).flatMap(k => k.team_players?.map(tp => tp.team_id) || []).filter(Boolean)
      )]

      if (teamIds.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase
          .from('schedule_events')
          .select('*, teams!schedule_events_team_id_fkey(id, name, color)')
          .in('team_id', teamIds)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .order('event_time', { ascending: true })
          .limit(10)
        setSchedule(events || [])
      }
    } catch (err) { console.error('Error loading parent data:', err) }
    setLoading(false)
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const rowBg = isDark ? 'bg-white/[0.03]' : 'bg-lynx-cloud'

  if (loading) {
    return (
      <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (children.length === 0) return null

  return (
    <>
      {/* Children's Profiles */}
      <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
        <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-4 flex items-center gap-2`}>
          <Users className="w-4 h-4 text-lynx-sky" />
          My Children
        </h2>
        <div className="space-y-3">
          {children.map(child => (
            <div key={child.id} className={`p-4 rounded-lg ${rowBg}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-r-sm font-bold bg-lynx-sky/20 text-lynx-sky">
                  {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                </div>
                <div>
                  <p className={`text-r-sm font-semibold ${tc.text}`}>{child.first_name} {child.last_name}</p>
                  {child.birth_date && (
                    <p className={`text-r-xs ${tc.textMuted}`}>DOB: {new Date(child.birth_date + 'T00:00:00').toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {child.team_players?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {child.team_players.map((tp, i) => (
                    <div
                      key={tp.team_id || i}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-r-xs font-semibold"
                      style={{ background: `${tp.teams?.color || '#4BB9EC'}20`, color: tp.teams?.color || '#4BB9EC' }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: tp.teams?.color || '#4BB9EC' }} />
                      {tp.teams?.name || 'Team'}
                      {tp.jersey_number && ` #${tp.jersey_number}`}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-r-xs ${tc.textMuted} mt-1`}>Not assigned to a team yet</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Schedule */}
      <ScheduleList
        title="Upcoming Schedule"
        schedule={schedule}
        isDark={isDark}
        tc={tc}
      />
    </>
  )
}

// ============================================
// SHARED SCHEDULE LIST (used by Coach + Parent)
// ============================================
function ScheduleList({ title, schedule, isDark, tc }) {
  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const rowBg = isDark ? 'bg-white/[0.03]' : 'bg-lynx-cloud'

  return (
    <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
      <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-4 flex items-center gap-2`}>
        <Calendar className="w-4 h-4 text-lynx-sky" />
        {title}
      </h2>
      {schedule.length === 0 ? (
        <p className={`text-r-sm ${tc.textMuted}`}>No upcoming events</p>
      ) : (
        <div className="space-y-2">
          {schedule.map(evt => (
            <div key={evt.id} className={`flex items-center gap-3 p-3 rounded-lg ${rowBg}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-r-xs font-bold ${
                evt.event_type === 'game' ? 'bg-red-500/20 text-red-400' :
                evt.event_type === 'practice' ? 'bg-blue-500/20 text-blue-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {evt.event_type === 'game' ? 'GM' : evt.event_type === 'practice' ? 'PR' : 'EV'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-r-sm font-semibold ${tc.text} truncate`}>
                  {evt.title || evt.event_type?.charAt(0).toUpperCase() + evt.event_type?.slice(1) || 'Event'}
                  {evt.opponent_name && ` vs ${evt.opponent_name}`}
                </p>
                <p className={`text-r-xs ${tc.textMuted}`}>
                  {evt.event_date ? new Date(evt.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                  {evt.event_time && ` at ${formatTime12(evt.event_time)}`}
                  {evt.teams?.name && ` - ${evt.teams.name}`}
                </p>
              </div>
              {evt.location && (
                <div className="flex items-center gap-1 shrink-0">
                  <MapPin className={`w-3 h-3 ${tc.textMuted}`} />
                  <span className={`text-r-xs ${tc.textMuted} max-w-[120px] truncate`}>{evt.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
