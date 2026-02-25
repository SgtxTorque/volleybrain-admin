import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  User, DollarSign, FileText, Settings, Users, ChevronRight,
  Camera, Save, Mail, Phone, Check, X, RefreshCw, Bell,
  Shield, Edit, ExternalLink, AlertTriangle
} from '../../constants/icons'

// ============================================
// MY STUFF PAGE — Consolidated Parent Self-Service
// Tabs: Profile | Payments | Waivers | Settings | Linked Players
// ============================================

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'waivers', label: 'Waivers', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'players', label: 'Linked Players', icon: Users },
]

function MyStuffPage({ roleContext, showToast }) {
  const { user, profile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${tc.text}`}>My Stuff</h1>
        <p className={tc.textSecondary}>Manage your profile, payments, and preferences</p>
      </div>

      {/* Tab Bar */}
      <div className={`flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? `${isDark ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-slate-900 shadow-md'}`
                  : `${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab showToast={showToast} />}
      {activeTab === 'payments' && <PaymentsTab roleContext={roleContext} showToast={showToast} />}
      {activeTab === 'waivers' && <WaiversTab roleContext={roleContext} showToast={showToast} />}
      {activeTab === 'settings' && <SettingsTab showToast={showToast} />}
      {activeTab === 'players' && <LinkedPlayersTab roleContext={roleContext} showToast={showToast} />}
    </div>
  )
}

// ============================================
// PROFILE TAB
// ============================================
function ProfileTab({ showToast }) {
  const { user, profile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
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
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      showToast?.('Photo updated!', 'success')
    } catch (err) {
      showToast?.(`Upload failed: ${err.message}`, 'error')
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
      showToast?.('Profile updated!', 'success')
    } catch (err) {
      showToast?.(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6 space-y-6`}>
      <h2 className={`text-lg font-bold ${tc.text}`}>Profile Information</h2>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden border-2 shadow-lg"
              style={{
                background: form.avatar_url ? 'transparent' : 'var(--accent-primary)',
                color: '#fff',
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
              {uploading ? <RefreshCw className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <p className={`text-xs ${tc.textMuted}`}>Click to change</p>
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-4">
          <div>
            <label className={`text-xs font-semibold uppercase ${tc.textMuted} block mb-1`}>Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50`}
            />
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase ${tc.textMuted} block mb-1`}>Email</label>
            <div className="flex items-center gap-2">
              <Mail className={`w-4 h-4 ${tc.textMuted}`} />
              <span className={`text-sm ${tc.textSecondary}`}>{form.email}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                Managed by login
              </span>
            </div>
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase ${tc.textMuted} block mb-1`}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className={`w-full px-4 py-2.5 rounded-xl text-sm border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50`}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PAYMENTS TAB — summary + recent
// ============================================
function PaymentsTab({ roleContext, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [roleContext])

  async function loadPayments() {
    const playerIds = (roleContext?.children || []).map(c => c.id).filter(Boolean)
    if (!playerIds.length) { setLoading(false); return }

    try {
      const { data } = await supabase
        .from('payments')
        .select('*, players(id, first_name, last_name)')
        .in('player_id', playerIds)
        .order('created_at', { ascending: false })

      setPayments(data || [])
    } catch (err) {
      console.error('Error loading payments:', err)
    }
    setLoading(false)
  }

  if (loading) return <LoadingSpinner />

  const totalDue = payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const unpaid = payments.filter(p => !p.paid)
  const paid = payments.filter(p => p.paid)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Total Due" value={`$${totalDue.toFixed(2)}`} color={totalDue > 0 ? '#EF4444' : '#10B981'} />
        <SummaryCard label="Total Paid" value={`$${totalPaid.toFixed(2)}`} color="#10B981" />
        <SummaryCard label="Total Fees" value={payments.length.toString()} color="var(--accent-primary)" />
      </div>

      {/* Unpaid */}
      {unpaid.length > 0 && (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          <h3 className={`font-bold ${tc.text} mb-3 flex items-center gap-2`}>
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Outstanding ({unpaid.length})
          </h3>
          <div className="space-y-2">
            {unpaid.map(p => (
              <div key={p.id} className={`${isDark ? 'bg-slate-800' : 'bg-slate-50'} rounded-xl p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${tc.text}`}>{p.fee_name || p.description || 'Fee'}</p>
                  <p className={`text-xs ${tc.textMuted}`}>
                    {p.players?.first_name} {p.players?.last_name}
                    {p.due_date && ` — Due ${new Date(p.due_date).toLocaleDateString()}`}
                  </p>
                </div>
                <span className="text-lg font-bold text-red-500">${parseFloat(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid history */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
        <h3 className={`font-bold ${tc.text} mb-3`}>Payment History ({paid.length})</h3>
        {paid.length > 0 ? (
          <div className="space-y-2">
            {paid.slice(0, 10).map(p => (
              <div key={p.id} className={`${isDark ? 'bg-slate-800' : 'bg-slate-50'} rounded-xl p-3 flex items-center gap-3`}>
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${tc.text} truncate`}>{p.fee_name || p.description || 'Payment'}</p>
                  <p className={`text-xs ${tc.textMuted}`}>
                    {p.players?.first_name} — {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'Paid'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-500">${parseFloat(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm text-center py-6 ${tc.textMuted}`}>No payment history yet</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// WAIVERS TAB — status + signing
// ============================================
function WaiversTab({ roleContext, showToast }) {
  const { user, profile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [waivers, setWaivers] = useState([])
  const [signatures, setSignatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [signingWaiver, setSigningWaiver] = useState(null)
  const [signatureName, setSignatureName] = useState('')

  const playerIds = (roleContext?.children || []).map(c => c.id).filter(Boolean)
  const orgId = roleContext?.children?.[0]?.season?.organizations?.id || roleContext?.children?.[0]?.season?.organization_id

  useEffect(() => {
    loadWaivers()
  }, [roleContext])

  async function loadWaivers() {
    if (!orgId) { setLoading(false); return }

    try {
      const { data: waiverData } = await supabase
        .from('waivers')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setWaivers(waiverData || [])

      if (waiverData?.length && playerIds.length) {
        const { data: sigs } = await supabase
          .from('waiver_signatures')
          .select('*')
          .in('waiver_id', waiverData.map(w => w.id))
          .in('player_id', playerIds)

        setSignatures(sigs || [])
      }
    } catch (err) {
      console.error('Error loading waivers:', err)
    }
    setLoading(false)
  }

  function isSigned(waiverId, playerId) {
    return signatures.some(s => s.waiver_id === waiverId && s.player_id === playerId)
  }

  async function handleSign(waiverId, playerId) {
    if (!signatureName.trim()) {
      showToast?.('Please type your full name to sign', 'warning')
      return
    }

    try {
      const { error } = await supabase.from('waiver_signatures').insert({
        waiver_id: waiverId,
        player_id: playerId,
        signed_by: user?.id,
        signature_name: signatureName.trim(),
        signed_at: new Date().toISOString(),
      })

      if (error) throw error

      showToast?.('Waiver signed!', 'success')
      setSigningWaiver(null)
      setSignatureName('')
      loadWaivers()
    } catch (err) {
      showToast?.(`Error signing: ${err.message}`, 'error')
    }
  }

  if (loading) return <LoadingSpinner />

  const children = roleContext?.children || []

  return (
    <div className="space-y-4">
      {waivers.length === 0 ? (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-8 text-center`}>
          <FileText className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
          <p className={`font-semibold ${tc.text}`}>No Active Waivers</p>
          <p className={`text-sm ${tc.textMuted} mt-1`}>Your organization hasn't published any waivers yet.</p>
        </div>
      ) : (
        waivers.map(waiver => (
          <div key={waiver.id} className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`font-bold ${tc.text}`}>{waiver.title}</h3>
                {waiver.description && <p className={`text-sm ${tc.textMuted} mt-1`}>{waiver.description}</p>}
              </div>
              {waiver.required && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/15 text-red-500">Required</span>
              )}
            </div>

            {/* Per-player signing status */}
            <div className="space-y-2">
              {children.map(child => {
                const signed = isSigned(waiver.id, child.id)
                const isSigningThis = signingWaiver?.waiverId === waiver.id && signingWaiver?.playerId === child.id

                return (
                  <div key={child.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${signed ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      {signed ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${tc.text}`}>{child.first_name} {child.last_name}</p>
                      <p className={`text-xs ${signed ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {signed ? 'Signed' : 'Not signed'}
                      </p>
                    </div>
                    {!signed && !isSigningThis && (
                      <button
                        onClick={() => setSigningWaiver({ waiverId: waiver.id, playerId: child.id })}
                        className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-bold hover:brightness-110 transition"
                      >
                        Sign
                      </button>
                    )}
                    {isSigningThis && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type full name to sign"
                          value={signatureName}
                          onChange={e => setSignatureName(e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'}`}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSign(waiver.id, child.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setSigningWaiver(null); setSignatureName('') }}
                          className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-200'}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ============================================
// SETTINGS TAB — notification prefs
// ============================================
function SettingsTab({ showToast }) {
  const { user, profile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    rsvp_reminders: true,
    payment_reminders: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.notification_preferences) {
      setPrefs(prev => ({ ...prev, ...profile.notification_preferences }))
    }
  }, [profile])

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: prefs })
        .eq('id', profile?.id)

      if (error) throw error
      showToast?.('Settings saved!', 'success')
    } catch (err) {
      showToast?.(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  function toggle(key) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  const settingsItems = [
    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive email updates about your account', icon: Mail },
    { key: 'push_notifications', label: 'Push Notifications', desc: 'Browser push notifications for urgent items', icon: Bell },
    { key: 'rsvp_reminders', label: 'RSVP Reminders', desc: 'Get reminded about unanswered event RSVPs', icon: RefreshCw },
    { key: 'payment_reminders', label: 'Payment Reminders', desc: 'Notifications about upcoming and overdue payments', icon: DollarSign },
  ]

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6 space-y-5`}>
      <h2 className={`text-lg font-bold ${tc.text}`}>Notification Preferences</h2>

      <div className="space-y-3">
        {settingsItems.map(item => {
          const Icon = item.icon
          return (
            <div key={item.key} className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${tc.textMuted}`} />
                <div>
                  <p className={`text-sm font-semibold ${tc.text}`}>{item.label}</p>
                  <p className={`text-xs ${tc.textMuted}`}>{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`w-12 h-7 rounded-full transition-all relative ${
                  prefs[item.key]
                    ? 'bg-[var(--accent-primary)]'
                    : isDark ? 'bg-slate-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${
                  prefs[item.key] ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:brightness-110 transition disabled:opacity-50"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}

// ============================================
// LINKED PLAYERS TAB
// ============================================
function LinkedPlayersTab({ roleContext, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const children = roleContext?.children || []

  if (!children.length) {
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-8 text-center`}>
        <Users className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
        <p className={`font-semibold ${tc.text}`}>No Linked Players</p>
        <p className={`text-sm ${tc.textMuted} mt-1`}>Register a player to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {children.map(child => {
        const team = child.team_players?.[0]?.teams
        const teamColor = team?.color || '#6366F1'

        return (
          <div key={child.id} className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
            <div className="h-2" style={{ backgroundColor: teamColor }} />
            <div className="p-5 flex items-center gap-4">
              {/* Photo */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white overflow-hidden"
                style={{ backgroundColor: teamColor }}
              >
                {child.photo_url ? (
                  <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover" />
                ) : (
                  `${child.first_name?.[0] || ''}${child.last_name?.[0] || ''}`
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${tc.text}`}>
                  {child.first_name} {child.last_name}
                </h3>
                <div className={`text-sm ${tc.textMuted} space-y-0.5`}>
                  {team && <p className="font-semibold" style={{ color: teamColor }}>{team.name}</p>}
                  {child.position && <p>Position: {child.position}</p>}
                  {child.jersey_number && <p>Jersey: #{child.jersey_number || child.team_players?.[0]?.jersey_number}</p>}
                  {child.grade !== undefined && child.grade !== null && <p>Grade: {child.grade === 0 ? 'K' : child.grade}</p>}
                </div>
              </div>

              {/* Season info */}
              <div className="text-right">
                {child.season && (
                  <div>
                    <p className={`text-xs font-semibold ${tc.textMuted}`}>{child.season.name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{child.season.sports?.icon} {child.season.sports?.name}</p>
                  </div>
                )}
                <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  child.status === 'approved' || child.team_players?.[0]
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-amber-500/15 text-amber-500'
                }`}>
                  {child.team_players?.[0] ? 'Active' : child.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// SHARED COMPONENTS
// ============================================
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
      <p className={`text-xs font-semibold uppercase ${tc.textMuted}`}>{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

export { MyStuffPage }
