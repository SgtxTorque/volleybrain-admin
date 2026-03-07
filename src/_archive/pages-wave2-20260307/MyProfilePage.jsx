import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  User, Camera, Save, Mail, Phone, Shield, Users, Calendar,
  MapPin, Clock, ChevronRight, AlertTriangle, Check, X, RefreshCw,
  UserCog, Edit, Trophy, Building2, Lock, Key, Eye, EyeOff, Trash2, LogOut
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// MY PROFILE PAGE — Self-Service Profile Portal
// Glassmorphism Design System
// ═══════════════════════════════════════════════════════════

const MP_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .mp-au{animation:fadeUp .4s ease-out both}
  .mp-ai{animation:fadeIn .3s ease-out both}
  .mp-as{animation:scaleIn .25s ease-out both}
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
    <div className="mp-glass rounded-xl p-6 mp-au">
      <h2 className={`text-sm uppercase ${tc.textMuted} mb-5`}>Profile Information</h2>

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
            <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
          </div>
          <div>
            <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Email</label>
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
            <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Phone</label>
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
    <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '100ms' }}>
      <h2 className={`text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        Emergency Contact
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Contact Name</label>
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
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Phone</label>
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
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Relationship</label>
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
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
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
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
        <h2 className={`text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
          <UserCog className="w-4 h-4" style={{ color: accent.primary }} />
          Coach Profile
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Bio / About Me</label>
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
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '260ms' }}>
        <h2 className={`text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
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
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '320ms' }}>
        <h2 className={`text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
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
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
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
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '200ms' }}>
        <h2 className={`text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
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
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '260ms' }}>
        <h2 className={`text-sm uppercase ${tc.textMuted} mb-4 flex items-center gap-2`}>
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

// ═══════ CHANGE PASSWORD SECTION ═══════
function ChangePasswordSection({ isDark, tc, accent, showToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function getPasswordStrength(pw) {
    if (!pw) return { label: '', color: '', width: '0%' }
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
    if (/\d/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++

    if (score <= 2) return { label: 'Weak', color: '#EF4444', width: '33%' }
    if (score <= 3) return { label: 'Medium', color: '#F59E0B', width: '66%' }
    return { label: 'Strong', color: '#10B981', width: '100%' }
  }

  const strength = getPasswordStrength(form.newPassword)

  async function handleSave() {
    if (!form.newPassword) {
      showToast('Please enter a new password', 'error')
      return
    }
    if (form.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.newPassword })
      if (error) throw error
      showToast('Password updated successfully', 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  return (
    <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '400ms' }}>
      <h2 className={`text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Key className="w-4 h-4" style={{ color: accent.primary }} />
        Change Password
      </h2>

      <div className="space-y-4 max-w-md">
        {/* Current password (UX safety) */}
        <div>
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={e => set('currentPassword', e.target.value)}
              placeholder="Enter current password"
              className={`w-full px-3 py-2.5 pr-10 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${tc.textMuted}`}>
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)}
              placeholder="Enter new password"
              className={`w-full px-3 py-2.5 pr-10 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${tc.textMuted}`}>
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Strength indicator */}
          {form.newPassword && (
            <div className="mt-2">
              <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.width, backgroundColor: strength.color }} />
              </div>
              <p className="text-[11px] mt-1" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Confirm New Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)}
            placeholder="Re-enter new password"
            className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
          {form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
              <X className="w-3 h-3" /> Passwords do not match
            </p>
          )}
          {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length > 0 && (
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Passwords match
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.newPassword || form.newPassword !== form.confirmPassword}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: accent.primary }}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

// ═══════ CHANGE EMAIL SECTION ═══════
function ChangeEmailSection({ user, profile, isDark, tc, accent, showToast }) {
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSave() {
    if (!newEmail) {
      showToast('Please enter a new email address', 'error')
      return
    }
    if (newEmail === (user?.email || profile?.email)) {
      showToast('New email is the same as your current email', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      // Also update profiles table
      await supabase.from('profiles').update({ email: newEmail }).eq('id', profile.id)
      setSent(true)
      showToast('Confirmation link sent to your new email address', 'success')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  return (
    <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '440ms' }}>
      <h2 className={`text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Mail className="w-4 h-4" style={{ color: accent.primary }} />
        Change Email
      </h2>

      <div className="space-y-4 max-w-md">
        {/* Current email */}
        <div>
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Current Email</label>
          <div className={`px-3 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[.03] border border-white/[.06]' : 'bg-lynx-cloud border border-lynx-silver'} ${tc.textMuted}`}>
            {user?.email || profile?.email || '—'}
          </div>
        </div>

        {/* New email */}
        <div>
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="newemail@example.com"
            className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
        </div>

        {/* Password confirmation */}
        <div>
          <label className={`text-xs uppercase ${tc.textMuted} block mb-1`}>Confirm Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password for security"
            className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
        </div>

        {sent && (
          <div className={`flex items-start gap-2 p-3 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/15' : 'bg-emerald-50 border border-emerald-200'}`}>
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              A confirmation link has been sent to your new email address. Please check your inbox and click the link to complete the change.
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !newEmail}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: accent.primary }}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {saving ? 'Sending...' : 'Update Email'}
        </button>
      </div>
    </div>
  )
}

// ═══════ ORG MEMBERSHIPS SECTION ═══════
function OrgMembershipsSection({ profile, isDark, tc, accent }) {
  const navigate = useNavigate()
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadMemberships() }, [profile?.id])

  async function loadMemberships() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('id, role, is_active, created_at, organization_id, organizations(id, name, slug, logo_url)')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setMemberships(data || [])
    } catch (err) {
      console.error('Error loading memberships:', err)
    }
    setLoading(false)
  }

  const roleLabels = {
    league_admin: 'League Admin',
    admin: 'Admin',
    assistant_admin: 'Assistant Admin',
    registrar: 'Registrar',
    treasurer: 'Treasurer',
    coach: 'Coach',
    parent: 'Parent',
    player: 'Player',
  }

  const roleColors = {
    league_admin: '#8B5CF6',
    admin: '#8B5CF6',
    assistant_admin: '#6366F1',
    registrar: '#3B82F6',
    treasurer: '#10B981',
    coach: '#3B82F6',
    parent: '#22C55E',
    player: '#F59E0B',
  }

  if (loading) {
    return (
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '480ms' }}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '480ms' }}>
      <h2 className={`text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Building2 className="w-4 h-4" style={{ color: accent.primary }} />
        Organization Memberships
      </h2>

      {memberships.length === 0 ? (
        <div className="text-center py-6">
          <Building2 className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
          <p className={`text-sm ${tc.textMuted} mb-3`}>You're not part of any organization yet</p>
          <button
            onClick={() => navigate('/directory')}
            className="px-4 py-2 rounded-xl text-sm text-white transition hover:opacity-90"
            style={{ background: accent.primary }}
          >
            Browse Org Directory
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {memberships.map(m => (
            <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold overflow-hidden"
                style={{ background: `${accent.primary}15` }}
              >
                {m.organizations?.logo_url ? (
                  <img src={m.organizations.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-5 h-5" style={{ color: accent.primary }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${tc.text} truncate`}>{m.organizations?.name || 'Unknown Org'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{
                      background: `${roleColors[m.role] || '#64748B'}15`,
                      color: roleColors[m.role] || '#64748B',
                    }}
                  >
                    {roleLabels[m.role] || m.role}
                  </span>
                  {m.created_at && (
                    <span className={`text-[10px] ${tc.textMuted} flex items-center gap-1`}>
                      <Clock className="w-3 h-3" />
                      Joined {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════ DELETE ACCOUNT SECTION ═══════
function DeleteAccountSection({ profile, isDark, tc, showToast }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    try {
      // Mark profile as deletion_requested and sign out
      await supabase.from('profiles').update({ deletion_requested: true }).eq('id', profile.id)
      showToast('Your account has been scheduled for deletion', 'success')
      // Sign out after short delay so toast is visible
      setTimeout(async () => {
        await supabase.auth.signOut()
      }, 1500)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
      setDeleting(false)
    }
  }

  return (
    <div
      className="rounded-xl p-6 mp-au"
      style={{
        animationDelay: '560ms',
        background: isDark ? 'rgba(239,68,68,.04)' : 'rgba(239,68,68,.03)',
        border: `1px solid ${isDark ? 'rgba(239,68,68,.15)' : 'rgba(239,68,68,.2)'}`,
      }}
    >
      <h2 className={`text-sm uppercase mb-5 flex items-center gap-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
        <Trash2 className="w-4 h-4 text-red-400" />
        Danger Zone
      </h2>

      {!showConfirm ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-red-200' : 'text-red-800'}`}>Delete My Account</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-red-300/60' : 'text-red-600/70'}`}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm transition ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
          >
            Delete My Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`flex items-start gap-2 p-3 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-red-200' : 'text-red-800'}`}>This is permanent</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-red-300/60' : 'text-red-600/70'}`}>
                All your profile data, team assignments, coaching records, and any associated information will be permanently removed.
                Your organization memberships will be revoked. This cannot be undone.
              </p>
            </div>
          </div>

          <div>
            <label className={`text-xs uppercase block mb-1 ${isDark ? 'text-red-300/70' : 'text-red-700'}`}>
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className={`w-full max-w-xs px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 ${
                isDark ? 'bg-red-500/5 border-red-500/20 text-red-200 placeholder-red-300/30' : 'bg-white border-red-200 text-red-800 placeholder-red-300'
              }`}
              style={{ '--tw-ring-color': 'rgba(239,68,68,.3)' }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'DELETE' || deleting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition hover:opacity-90 disabled:opacity-40 bg-red-500"
            >
              {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText('') }}
              className={`px-5 py-2.5 rounded-xl text-sm transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════ MY HISTORY SECTION ═══════
function MyHistorySection({ profile, isDark, tc, accent, onNavigateToArchive }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [profile?.id])

  async function loadHistory() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const entries = []

      // Get coach participation
      const { data: coachRecords } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, season_id, seasons(id, name, sport, start_date, end_date, status, organization_id, organizations(id, name))')
        .eq('profile_id', profile.id)

      if (coachRecords) {
        for (const c of coachRecords) {
          if (!c.seasons) continue
          // Get team names via team_coaches
          const { data: tcData } = await supabase
            .from('team_coaches')
            .select('teams(name)')
            .eq('coach_id', c.id)
          const teamNames = tcData?.map(t => t.teams?.name).filter(Boolean) || []

          entries.push({
            id: `coach-${c.id}`,
            seasonId: c.seasons.id,
            orgName: c.seasons.organizations?.name || 'Unknown Org',
            seasonName: c.seasons.name,
            sport: c.seasons.sport,
            role: 'Coach',
            teamNames,
            startDate: c.seasons.start_date,
            endDate: c.seasons.end_date,
            status: c.seasons.status,
          })
        }
      }

      // Get player participation (for users who are also players)
      const { data: playerRecords } = await supabase
        .from('players')
        .select('id, first_name, last_name, team_players(team_id, teams(name, season_id, seasons(id, name, sport, start_date, end_date, status, organization_id, organizations(id, name))))')
        .eq('parent_account_id', profile.id)

      if (playerRecords) {
        for (const p of playerRecords) {
          const seenSeasons = new Set()
          for (const tp of (p.team_players || [])) {
            const s = tp.teams?.seasons
            if (!s || seenSeasons.has(s.id)) continue
            seenSeasons.add(s.id)
            // Collect all teams for this player in this season
            const teamNames = (p.team_players || [])
              .filter(tp2 => tp2.teams?.seasons?.id === s.id)
              .map(tp2 => tp2.teams?.name)
              .filter(Boolean)

            entries.push({
              id: `parent-${p.id}-${s.id}`,
              seasonId: s.id,
              orgName: s.organizations?.name || 'Unknown Org',
              seasonName: s.name,
              sport: s.sport,
              role: 'Parent',
              playerName: `${p.first_name} ${p.last_name}`,
              teamNames,
              startDate: s.start_date,
              endDate: s.end_date,
              status: s.status,
            })
          }
        }
      }

      // Get admin participation via user_roles
      const { data: roleRecords } = await supabase
        .from('user_roles')
        .select('role, organization_id, organizations(id, name)')
        .eq('user_id', profile.id)
        .eq('is_active', true)

      if (roleRecords) {
        for (const r of roleRecords) {
          if (r.role !== 'admin') continue
          // Get seasons for this org
          const { data: orgSeasons } = await supabase
            .from('seasons')
            .select('id, name, sport, start_date, end_date, status')
            .eq('organization_id', r.organization_id)
            .not('status', 'in', '("active","upcoming")')

          for (const s of (orgSeasons || [])) {
            // Avoid duplicates (admin may also be coach)
            if (entries.some(e => e.seasonId === s.id && e.role === 'Admin')) continue
            entries.push({
              id: `admin-${r.organization_id}-${s.id}`,
              seasonId: s.id,
              orgName: r.organizations?.name || 'Unknown Org',
              seasonName: s.name,
              sport: s.sport,
              role: 'Admin',
              teamNames: [],
              startDate: s.start_date,
              endDate: s.end_date,
              status: s.status,
            })
          }
        }
      }

      // Sort by start_date descending
      entries.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      setHistory(entries)
    } catch (err) {
      console.error('Error loading history:', err)
    }
    setLoading(false)
  }

  function formatRange(start, end) {
    const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
    if (start && end) return `${fmt(start)} — ${fmt(end)}`
    if (start) return `Started ${fmt(start)}`
    return ''
  }

  const sportEmoji = (sport) => {
    const map = { volleyball: '🏐', basketball: '🏀', soccer: '⚽', baseball: '⚾', football: '🏈' }
    return map[sport?.toLowerCase()] || '🏆'
  }

  if (loading) {
    return (
      <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="mp-glass rounded-xl p-6 mp-au" style={{ animationDelay: '600ms' }}>
      <h2 className={`text-sm uppercase ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Trophy className="w-4 h-4" style={{ color: accent.primary }} />
        My History
      </h2>

      {history.length === 0 ? (
        <p className={`text-sm ${tc.textMuted}`}>No past season history found</p>
      ) : (
        <div className="space-y-3">
          {history.map(entry => (
            <button
              key={entry.id}
              onClick={() => onNavigateToArchive?.(entry.seasonId)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01] ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-black/[0.02] hover:bg-black/[0.04]'}`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: `${accent.primary}15` }}
              >
                {sportEmoji(entry.sport)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-semibold ${tc.text} truncate`}>{entry.seasonName}</p>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0"
                    style={{
                      background: entry.role === 'Coach' ? 'rgba(59,130,246,0.15)' : entry.role === 'Admin' ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.15)',
                      color: entry.role === 'Coach' ? '#3b82f6' : entry.role === 'Admin' ? '#a855f7' : '#22c55e',
                    }}
                  >
                    {entry.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className={`w-3 h-3 ${tc.textMuted} shrink-0`} />
                  <span className={`text-xs ${tc.textMuted} truncate`}>{entry.orgName}</span>
                </div>
                {entry.teamNames?.length > 0 && (
                  <p className={`text-xs ${tc.textMuted} mt-0.5 truncate`}>
                    {entry.teamNames.join(', ')}
                    {entry.playerName && ` (${entry.playerName})`}
                  </p>
                )}
                {entry.startDate && (
                  <p className={`text-xs ${tc.textMuted} mt-0.5`}>{formatRange(entry.startDate, entry.endDate)}</p>
                )}
              </div>

              <ChevronRight className={`w-4 h-4 ${tc.textMuted} shrink-0`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════ MAIN PAGE ═══════
function MyProfilePage({ showToast }) {
  const navigate = useNavigate()
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
        <h1 className={`text-4xl ${tc.text} flex items-center gap-3`}>
          <User className="w-8 h-8" style={{ color: accent.primary }} />
          My Profile
        </h1>
        <p className={`text-sm uppercase ${tc.textMuted} mt-1`}>Manage your personal information</p>
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

        {/* ═══════ ACCOUNT SETTINGS ═══════ */}
        <ChangePasswordSection
          isDark={isDark}
          tc={tc}
          accent={accent}
          showToast={showToast}
        />

        <ChangeEmailSection
          user={user}
          profile={profile}
          isDark={isDark}
          tc={tc}
          accent={accent}
          showToast={showToast}
        />

        <OrgMembershipsSection
          profile={profile}
          isDark={isDark}
          tc={tc}
          accent={accent}
        />

        {/* ═══════ MY HISTORY (always last before danger zone) ═══════ */}
        <MyHistorySection
          profile={profile}
          isDark={isDark}
          tc={tc}
          accent={accent}
          onNavigateToArchive={() => navigate('/archives')}
        />

        {/* ═══════ DANGER ZONE (always very last) ═══════ */}
        <DeleteAccountSection
          profile={profile}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
        />
      </div>
    </div>
  )
}

export { MyProfilePage }
