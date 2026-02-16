import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  User, Camera, Save, Mail, Phone, Shield, Users, Calendar,
  MapPin, Clock, ChevronRight, AlertTriangle, Check, X, RefreshCw,
  UserCog, Edit
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// MY PROFILE PAGE — Self-Service Profile Portal
// Glassmorphism Design System
// ═══════════════════════════════════════════════════════════

const MP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .mp-au{animation:fadeUp .4s ease-out both}
  .mp-ai{animation:fadeIn .3s ease-out both}
  .mp-as{animation:scaleIn .25s ease-out both}
  .mp-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .mp-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .mp-label{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.03em}
  .mp-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .mp-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .mp-light .mp-glass{background:rgba(255,255,255,.65);border-color:rgba(0,0,0,.06);box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .mp-light .mp-glass-solid{background:rgba(255,255,255,.72);border-color:rgba(0,0,0,.06)}
`

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

// ═══════ PROFILE INFO SECTION ═══════
function ProfileInfoSection({ profile, user, isDark, tc, accent, showToast, onProfileUpdate }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || profile.photo_url || '',
      })
    }
  }, [profile, user])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `profile-photos/${profile.id}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      set('avatar_url', publicUrl)
      // Save to the real DB column: avatar_url
      const { error: saveErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      if (saveErr) throw saveErr
      // Update both keys so MainApp's photo_url references also work in-session
      onProfileUpdate?.({ ...profile, avatar_url: publicUrl, photo_url: publicUrl })
      showToast('Photo updated', 'success')
    } catch (err) {
      console.error('Photo upload error:', err)
      showToast(`Upload failed: ${err.message}`, 'error')
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone,
      }).eq('id', profile.id)
      if (error) throw error
      onProfileUpdate?.({ ...profile, full_name: form.full_name, phone: form.phone })
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  return (
    <div className="mp-glass rounded-2xl p-6 mp-au">
      <h2 className={`mp-heading text-sm uppercase ${tc.textMuted} mb-5`}>Profile Information</h2>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden border-3 shadow-lg"
              style={{
                background: form.avatar_url ? 'transparent' : accent.primary,
                color: '#000',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
              }}
            >
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                form.full_name?.charAt(0) || '?'
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <p className={`text-xs ${tc.textMuted}`}>Click to change</p>
        </div>

        {/* Form Fields */}
        <div className="flex-1 space-y-4">
          <div>
            <label className={`mp-label text-xs uppercase ${tc.textMuted} block mb-1`}>Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
          </div>
          <div>
            <label className={`mp-label text-xs uppercase ${tc.textMuted} block mb-1`}>Email</label>
            <div className="relative">
              <input
                type="email"
                value={form.email}
                disabled
                className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border opacity-60 cursor-not-allowed`}
              />
              <Mail className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            </div>
            <p className={`text-xs ${tc.textMuted} mt-1`}>Email is managed through your account settings</p>
          </div>
          <div>
            <label className={`mp-label text-xs uppercase ${tc.textMuted} block mb-1`}>Phone</label>
            <div className="relative">
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
                style={{ '--tw-ring-color': `${accent.primary}50` }}
              />
              <Phone className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: accent.primary }}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════ EMERGENCY CONTACT SECTION ═══════
function EmergencyContactSection({ profile, isDark, tc, accent, showToast, onProfileUpdate }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        emergency_contact_relation: profile.emergency_contact_relation || '',
      })
    }
  }, [profile])

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

  return (
    <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '100ms' }}>
      <h2 className={`mp-heading text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        Emergency Contact
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={`mp-label text-xs uppercase ${tc.textMuted} block mb-1`}>Contact Name</label>
          <input
            type="text"
            value={form.emergency_contact_name}
            onChange={e => set('emergency_contact_name', e.target.value)}
            placeholder="Jane Doe"
            className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
        </div>
        <div>
          <label className={`mp-label text-xs uppercase ${tc.textMuted} block mb-1`}>Phone</label>
          <input
            type="tel"
            value={form.emergency_contact_phone}
            onChange={e => set('emergency_contact_phone', e.target.value)}
            placeholder="(555) 987-6543"
            className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
        </div>
        <div>
          <label className={`mp-label text-xs uppercase ${tc.textMuted} block mb-1`}>Relationship</label>
          <input
            type="text"
            value={form.emergency_contact_relation}
            onChange={e => set('emergency_contact_relation', e.target.value)}
            placeholder="Spouse, Parent, etc."
            className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 mt-4"
        style={{ background: accent.primary }}
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Emergency Contact'}
      </button>
    </div>
  )
}

// ═══════ COACH SECTION ═══════
function CoachSection({ profile, isDark, tc, accent, showToast }) {
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
      // Get coach record linked to this profile
      const { data: coach } = await supabase
        .from('coaches')
        .select('*, team_coaches(team_id, role, teams(id, name, color, season_id))')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (coach) {
        setCoachData(coach)
        setBio(coach.bio || '')

        // Extract team IDs
        const teamEntries = coach.team_coaches || []
        setTeams(teamEntries)

        // Get upcoming events for coach's teams
        const teamIds = teamEntries.map(tc => tc.team_id).filter(Boolean)
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

  if (loading) {
    return (
      <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (!coachData) return null

  return (
    <>
      {/* Bio Section */}
      <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
        <h2 className={`mp-heading text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
          <UserCog className="w-4 h-4" style={{ color: accent.primary }} />
          Coach Profile
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`mp-label text-xs uppercase ${tc.textMuted} block mb-1`}>Bio / About Me</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              placeholder="Tell players and parents about your coaching background..."
              className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2 resize-none`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
          </div>

          <button
            onClick={handleSaveBio}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: accent.primary }}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Bio'}
          </button>
        </div>
      </div>

      {/* Assigned Teams */}
      <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '260ms' }}>
        <h2 className={`mp-heading text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
          <Users className="w-4 h-4" style={{ color: accent.primary }} />
          My Teams
        </h2>
        {teams.length === 0 ? (
          <p className={`text-sm ${tc.textMuted}`}>No team assignments found</p>
        ) : (
          <div className="space-y-2">
            {teams.map((tc_item, i) => (
              <div key={tc_item.team_id || i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: tc_item.teams?.color || accent.primary }}
                >
                  {tc_item.teams?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${tc.text}`}>{tc_item.teams?.name || 'Unknown Team'}</p>
                  <p className={`text-xs ${tc.textMuted}`}>{tc_item.role === 'head' ? 'Head Coach' : tc_item.role === 'assistant' ? 'Assistant Coach' : tc_item.role || 'Coach'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Schedule */}
      <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '320ms' }}>
        <h2 className={`mp-heading text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
          <Calendar className="w-4 h-4" style={{ color: accent.primary }} />
          Upcoming Schedule
        </h2>
        {schedule.length === 0 ? (
          <p className={`text-sm ${tc.textMuted}`}>No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {schedule.map(evt => (
              <div key={evt.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  evt.event_type === 'game' ? 'bg-red-500/20 text-red-400' :
                  evt.event_type === 'practice' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {evt.event_type === 'game' ? 'GM' : evt.event_type === 'practice' ? 'PR' : 'EV'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${tc.text} truncate`}>
                    {evt.title || evt.event_type?.charAt(0).toUpperCase() + evt.event_type?.slice(1) || 'Event'}
                    {evt.opponent_name && ` vs ${evt.opponent_name}`}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>
                    {evt.event_date ? new Date(evt.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                    {evt.event_time && ` at ${formatTime12(evt.event_time)}`}
                    {evt.teams?.name && ` — ${evt.teams.name}`}
                  </p>
                </div>
                {evt.location && (
                  <div className="flex items-center gap-1 shrink-0">
                    <MapPin className={`w-3 h-3 ${tc.textMuted}`} />
                    <span className={`text-xs ${tc.textMuted} max-w-[120px] truncate`}>{evt.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ═══════ PARENT SECTION ═══════
function ParentSection({ profile, isDark, tc, accent }) {
  const [children, setChildren] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadParentData() }, [profile?.id])

  async function loadParentData() {
    setLoading(true)
    try {
      // Get children linked to this parent
      const { data: kids } = await supabase
        .from('players')
        .select('*, team_players(team_id, jersey_number, teams(id, name, color, season_id))')
        .eq('parent_account_id', profile.id)

      setChildren(kids || [])

      // Get upcoming schedule for children's teams
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

  if (loading) {
    return (
      <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (children.length === 0) return null

  return (
    <>
      {/* Children's Profiles */}
      <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
        <h2 className={`mp-heading text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
          <Users className="w-4 h-4" style={{ color: accent.primary }} />
          My Children
        </h2>
        <div className="space-y-3">
          {children.map(child => (
            <div key={child.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `${accent.primary}30`, color: accent.primary }}
                >
                  {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${tc.text}`}>{child.first_name} {child.last_name}</p>
                  {child.birth_date && (
                    <p className={`text-xs ${tc.textMuted}`}>DOB: {new Date(child.birth_date + 'T00:00:00').toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {/* Team assignments */}
              {child.team_players?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {child.team_players.map((tp, i) => (
                    <div
                      key={tp.team_id || i}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: `${tp.teams?.color || accent.primary}20`, color: tp.teams?.color || accent.primary }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: tp.teams?.color || accent.primary }} />
                      {tp.teams?.name || 'Team'}
                      {tp.jersey_number && ` #${tp.jersey_number}`}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${tc.textMuted} mt-1`}>Not assigned to a team yet</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="mp-glass rounded-2xl p-6 mp-au" style={{ animationDelay: '260ms' }}>
        <h2 className={`mp-heading text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
          <Calendar className="w-4 h-4" style={{ color: accent.primary }} />
          Upcoming Schedule
        </h2>
        {schedule.length === 0 ? (
          <p className={`text-sm ${tc.textMuted}`}>No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {schedule.map(evt => (
              <div key={evt.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  evt.event_type === 'game' ? 'bg-red-500/20 text-red-400' :
                  evt.event_type === 'practice' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {evt.event_type === 'game' ? 'GM' : evt.event_type === 'practice' ? 'PR' : 'EV'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${tc.text} truncate`}>
                    {evt.title || evt.event_type?.charAt(0).toUpperCase() + evt.event_type?.slice(1) || 'Event'}
                    {evt.opponent_name && ` vs ${evt.opponent_name}`}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>
                    {evt.event_date ? new Date(evt.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                    {evt.event_time && ` at ${formatTime12(evt.event_time)}`}
                    {evt.teams?.name && ` — ${evt.teams.name}`}
                  </p>
                </div>
                {evt.location && (
                  <div className="flex items-center gap-1 shrink-0">
                    <MapPin className={`w-3 h-3 ${tc.textMuted}`} />
                    <span className={`text-xs ${tc.textMuted} max-w-[120px] truncate`}>{evt.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ═══════ MAIN PAGE ═══════
function MyProfilePage({ showToast }) {
  const { user, profile, setProfile } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const [roleContext, setRoleContext] = useState({ isCoach: false, isParent: false })

  useEffect(() => { detectRoles() }, [profile?.id])

  async function detectRoles() {
    if (!profile?.id) return
    try {
      // Check if user is a coach
      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle()

      // Check if user is a parent (has children)
      const { data: children } = await supabase
        .from('players')
        .select('id')
        .eq('parent_account_id', profile.id)
        .limit(1)

      setRoleContext({
        isCoach: !!coach,
        isParent: (children?.length || 0) > 0,
      })
    } catch (err) { console.error('Error detecting roles:', err) }
  }

  function handleProfileUpdate(updatedProfile) {
    setProfile(updatedProfile)
  }

  return (
    <div className={`${isDark ? '' : 'mp-light'}`}>
      <style>{MP_STYLES}</style>

      {/* Header */}
      <div className="mp-au mb-6">
        <h1 className={`mp-display text-4xl ${tc.text} flex items-center gap-3`}>
          <User className="w-8 h-8" style={{ color: accent.primary }} />
          My Profile
        </h1>
        <p className={`mp-label text-sm uppercase ${tc.textMuted} mt-1`}>Manage your personal information</p>
      </div>

      {/* Content */}
      <div className="space-y-6 max-w-3xl">
        <ProfileInfoSection
          profile={profile}
          user={user}
          isDark={isDark}
          tc={tc}
          accent={accent}
          showToast={showToast}
          onProfileUpdate={handleProfileUpdate}
        />

        <EmergencyContactSection
          profile={profile}
          isDark={isDark}
          tc={tc}
          accent={accent}
          showToast={showToast}
          onProfileUpdate={handleProfileUpdate}
        />

        {roleContext.isCoach && (
          <CoachSection
            profile={profile}
            isDark={isDark}
            tc={tc}
            accent={accent}
            showToast={showToast}
          />
        )}

        {roleContext.isParent && (
          <ParentSection
            profile={profile}
            isDark={isDark}
            tc={tc}
            accent={accent}
          />
        )}
      </div>
    </div>
  )
}

export { MyProfilePage }
