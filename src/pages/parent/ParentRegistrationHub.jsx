import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { loadMyChildren } from '../../lib/parent-utils'
import { getPrimaryTeamInfo } from '../../lib/team-utils'
import { parseLocalDate } from '../../lib/date-helpers'
import {
  Calendar, Clock, DollarSign, Users, ChevronRight, Check,
  FileText, AlertTriangle, User, Loader2, Shield,
  CheckCircle2, ClipboardList, ChevronDown, ChevronUp
} from '../../constants/icons'
import DashboardContainer from '../../components/layout/DashboardContainer'

// ============================================
// PARENT REGISTRATION HUB
// 2-panel desktop layout: Open seasons + form on left, summary on right
// ============================================

const TABS = [
  { id: 'open', label: 'Open Seasons', icon: Calendar },
  { id: 'mine', label: 'My Registrations', icon: ClipboardList },
]

function ParentRegistrationHub({ roleContext, showToast }) {
  const { user, profile, organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [activeTab, setActiveTab] = useState('open')
  const [seasons, setSeasons] = useState([])
  const [myPlayers, setMyPlayers] = useState([])
  const [waivers, setWaivers] = useState([])
  const [signedWaivers, setSignedWaivers] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedSeason, setExpandedSeason] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [usePrevious, setUsePrevious] = useState(false)

  // Registration form state
  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', gender: '',
    grade: '', school: '', position: '', jersey_number: '',
    parent_name: '', parent_email: '', parent_phone: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    medical_notes: '', allergies: '',
  })

  // Waiver signatures (waiver_id -> typed name)
  const [waiverSigs, setWaiverSigs] = useState({})
  const [waiverScrolled, setWaiverScrolled] = useState({})

  useEffect(() => { loadData() }, [user, organization?.id])

  async function loadData() {
    const orgId = organization?.id
    if (!orgId) { setLoading(false); return }
    setLoading(true)
    try {
      // Load open seasons
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*, sports (name, icon, positions)')
        .eq('organization_id', orgId)
        .in('status', ['open', 'active'])
        .order('start_date', { ascending: true })
      setSeasons(seasonData || [])

      // Load parent's existing players (scoped to active org via all org seasons)
      const { data: allOrgSeasons } = await supabase.from('seasons').select('id').eq('organization_id', orgId)
      const allOrgSeasonIds = allOrgSeasons?.map(s => s.id) || []
      // Load parent's children (supports primary + secondary parents)
      const childIds = await loadMyChildren(user.id, allOrgSeasonIds, 'id')
      let playerData = []
      if (childIds.length > 0) {
        const { data } = await supabase
          .from('players')
          .select('*, team_players (team_id, is_primary_team, teams (name))')
          .in('id', childIds.map(c => c.id))
          .order('created_at', { ascending: false })
        playerData = data || []
      }
      setMyPlayers(playerData || [])
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadWaivers(seasonId) {
    const orgId = organization?.id
    if (!orgId) return
    const { data } = await supabase
      .from('waiver_templates')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    setWaivers(data || [])

    // Check which waivers are already signed by this user
    if (data?.length) {
      const { data: sigs } = await supabase
        .from('waiver_signatures')
        .select('waiver_template_id')
        .eq('signed_by_user_id', profile?.id)
        .in('waiver_template_id', data.map(w => w.id))
      const sigMap = {}
      sigs?.forEach(s => { sigMap[s.waiver_template_id] = true })
      setSignedWaivers(sigMap)
    }
  }

  function handleExpandSeason(season) {
    if (expandedSeason === season.id) {
      setExpandedSeason(null)
      return
    }
    setExpandedSeason(season.id)
    loadWaivers(season.id)
    // If returning family, offer pre-fill
    if (myPlayers.length > 0 && !usePrevious) {
      setUsePrevious(false) // show the card
    }
  }

  function prefillFromPlayer(player) {
    setForm(f => ({
      ...f,
      last_name: player.last_name || '',
      parent_name: player.parent_name || profile?.full_name || '',
      parent_email: player.parent_email || profile?.email || '',
      parent_phone: player.parent_phone || profile?.phone || '',
      emergency_contact_name: player.emergency_contact_name || '',
      emergency_contact_phone: player.emergency_contact_phone || '',
      medical_notes: player.medical_notes || '',
      allergies: player.allergies || '',
      school: player.school || '',
    }))
    setUsePrevious(true)
    showToast?.('Previous info loaded!', 'success')
  }

  async function handleSubmit(seasonId) {
    if (!form.first_name || !form.last_name) {
      showToast?.('Player first and last name are required', 'error')
      return
    }
    // Check required waivers are signed
    const requiredWaivers = waivers.filter(w => w.is_required)
    const unsignedRequired = requiredWaivers.filter(w => !waiverSigs[w.id])
    if (unsignedRequired.length > 0) {
      showToast?.('Please sign all required waivers before submitting', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Create player record
      const { data: newPlayer, error: playerErr } = await supabase
        .from('players')
        .insert({
          organization_id: organization?.id,
          season_id: seasonId,
          first_name: form.first_name,
          last_name: form.last_name,
          birth_date: form.date_of_birth || null,
          gender: form.gender || null,
          grade: form.grade || null,
          school: form.school || null,
          position: form.position || null,
          jersey_number: form.jersey_number || null,
          parent_name: form.parent_name || profile?.full_name,
          parent_email: form.parent_email || profile?.email,
          parent_phone: form.parent_phone || profile?.phone,
          parent_account_id: user.id,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          medical_notes: form.medical_notes || null,
          allergies: form.allergies || null,
          status: 'pending',
          registration_date: new Date().toISOString(),
        })
        .select()
        .single()
      if (playerErr) throw playerErr

      // Create waiver signatures
      const sigInserts = Object.entries(waiverSigs)
        .filter(([, name]) => name?.trim())
        .map(([waiverId, sigName]) => ({
          waiver_template_id: waiverId,
          player_id: newPlayer.id,
          organization_id: organization?.id,
          season_id: seasonId,
          signed_by_user_id: profile?.id,
          signed_by_name: sigName.trim(),
          signed_by_email: profile?.email || '',
          signed_by_relation: 'Parent/Guardian',
          signature_data: sigName.trim(),
          status: 'signed',
          signed_at: new Date().toISOString(),
        }))
      if (sigInserts.length > 0) {
        await supabase.from('waiver_signatures').insert(sigInserts)
      }

      showToast?.('Registration submitted successfully!', 'success')
      // Reset form
      setForm({
        first_name: '', last_name: '', date_of_birth: '', gender: '',
        grade: '', school: '', position: '', jersey_number: '',
        parent_name: '', parent_email: '', parent_phone: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        medical_notes: '', allergies: '',
      })
      setWaiverSigs({})
      setWaiverScrolled({})
      setExpandedSeason(null)
      setUsePrevious(false)
      loadData()
    } catch (err) {
      showToast?.(`Registration failed: ${err.message}`, 'error')
    }
    setSubmitting(false)
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  if (loading) {
    return (
      <DashboardContainer className="px-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#4BB9EC]" />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer className="px-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${tc.text}`}>Registration Hub</h1>
          <p className={tc.textSecondary}>Register your children for upcoming seasons</p>
        </div>

        {/* Tab Bar */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 ${isDark ? 'bg-white/[0.03]/60' : 'bg-slate-100'}`}>
          {TABS.map(tab => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? `${isDark ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-slate-900 shadow-md'}`
                    : `${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`
                }`}>
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 2-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT PANEL (60%) */}
          <div className="lg:col-span-3 space-y-4">
            {activeTab === 'open' && (
              seasons.length === 0 ? (
                <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-white/[0.03]/40' : 'bg-white border border-slate-200'}`}>
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className={`text-lg font-semibold ${tc.text}`}>No Open Seasons</p>
                  <p className={tc.textSecondary}>Check back later for new registration periods.</p>
                </div>
              ) : seasons.map(season => (
                <SeasonCard key={season.id} season={season} isDark={isDark} tc={tc}
                  expanded={expandedSeason === season.id}
                  onToggle={() => handleExpandSeason(season)}
                  form={form} set={set} waivers={waivers} waiverSigs={waiverSigs}
                  waiverScrolled={waiverScrolled} signedWaivers={signedWaivers}
                  setWaiverSigs={setWaiverSigs} setWaiverScrolled={setWaiverScrolled}
                  onSubmit={() => handleSubmit(season.id)} submitting={submitting}
                  myPlayers={myPlayers} />
              ))
            )}
            {activeTab === 'mine' && (
              <MyRegistrations players={myPlayers} isDark={isDark} tc={tc} />
            )}
          </div>

          {/* RIGHT PANEL (40%) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Registration Summary */}
            {expandedSeason && (
              <SummaryCard season={seasons.find(s => s.id === expandedSeason)}
                form={form} waivers={waivers} waiverSigs={waiverSigs}
                signedWaivers={signedWaivers} isDark={isDark} tc={tc} />
            )}

            {/* Returning Family Card */}
            {myPlayers.length > 0 && expandedSeason && !usePrevious && (
              <div className={`rounded-2xl p-5 ${isDark ? 'bg-emerald-900/30 border border-emerald-700/40' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className={`font-semibold ${tc.text}`}>Welcome back!</p>
                    <p className={`text-sm ${tc.textSecondary}`}>We found your previous info.</p>
                  </div>
                </div>
                <div className="space-y-1 mb-3">
                  {myPlayers.slice(0, 3).map(p => (
                    <div key={p.id} className={`text-sm flex items-center gap-2 ${tc.textSecondary}`}>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      {p.first_name} {p.last_name}
                    </div>
                  ))}
                </div>
                <button onClick={() => prefillFromPlayer(myPlayers[0])}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  Use Previous Info
                </button>
              </div>
            )}

            {/* No season selected hint */}
            {!expandedSeason && activeTab === 'open' && (
              <div className={`rounded-2xl p-6 text-center ${isDark ? 'bg-white/[0.03]/40' : 'bg-white border border-slate-200'}`}>
                <ChevronRight className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className={`text-sm ${tc.textSecondary}`}>Select a season to see registration details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}

// ============================================
// SEASON CARD
// ============================================
function SeasonCard({ season, isDark, tc, expanded, onToggle, form, set,
  waivers, waiverSigs, waiverScrolled, signedWaivers, setWaiverSigs,
  setWaiverScrolled, onSubmit, submitting, myPlayers }) {

  const regEnd = season.registration_end ? parseLocalDate(season.registration_end) : null
  const daysLeft = regEnd ? Math.max(0, Math.ceil((regEnd - new Date()) / 86400000)) : null
  const spotsLeft = season.max_players
    ? Math.max(0, season.max_players - (season.player_count || 0))
    : null
  const sportName = season.sports?.name || 'Sport'

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${
      isDark ? 'bg-white/[0.03]/40 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'
    }`}>
      {/* Season Header */}
      <button onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4BB9EC]/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#4BB9EC]" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${tc.text}`}>{season.name}</h3>
            <p className={`text-sm ${tc.textSecondary}`}>{sportName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {daysLeft !== null && (
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {daysLeft === 0 ? 'Last day!' : `${daysLeft} days left`}
            </span>
          )}
          {season.fee_amount > 0 && (
            <span className={`text-sm font-semibold ${tc.textSecondary}`}>
              ${season.fee_amount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {/* Season Details Row */}
      <div className={`px-5 pb-3 flex gap-4 text-xs ${tc.textSecondary}`}>
        {season.start_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {parseLocalDate(season.start_date).toLocaleDateString()} - {season.end_date ? parseLocalDate(season.end_date).toLocaleDateString() : 'TBD'}
          </span>
        )}
        {spotsLeft !== null && (
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {spotsLeft} spots left
          </span>
        )}
      </div>

      {/* Expanded: Registration Form */}
      {expanded && (
        <div className={`border-t ${isDark ? 'border-white/10' : 'border-slate-200'} p-5 space-y-5`}>
          <h4 className={`font-bold ${tc.text}`}>Player Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="First Name *" value={form.first_name} onChange={v => set('first_name', v)} isDark={isDark} />
            <FormInput label="Last Name *" value={form.last_name} onChange={v => set('last_name', v)} isDark={isDark} />
            <FormInput label="Date of Birth" type="date" value={form.date_of_birth} onChange={v => set('date_of_birth', v)} isDark={isDark} />
            <FormSelect label="Gender" value={form.gender} onChange={v => set('gender', v)} isDark={isDark}
              options={['', 'Male', 'Female', 'Other']} />
            <FormInput label="Grade" value={form.grade} onChange={v => set('grade', v)} isDark={isDark} />
            <FormInput label="School" value={form.school} onChange={v => set('school', v)} isDark={isDark} />
            <FormInput label="Position" value={form.position} onChange={v => set('position', v)} isDark={isDark} />
            <FormInput label="Jersey # Preference" value={form.jersey_number} onChange={v => set('jersey_number', v)} isDark={isDark} />
          </div>

          <h4 className={`font-bold ${tc.text} pt-2`}>Parent / Guardian</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Parent Name" value={form.parent_name} onChange={v => set('parent_name', v)} isDark={isDark} />
            <FormInput label="Email" type="email" value={form.parent_email} onChange={v => set('parent_email', v)} isDark={isDark} />
            <FormInput label="Phone" type="tel" value={form.parent_phone} onChange={v => set('parent_phone', v)} isDark={isDark} />
          </div>

          <h4 className={`font-bold ${tc.text} pt-2`}>Emergency Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Emergency Contact Name" value={form.emergency_contact_name} onChange={v => set('emergency_contact_name', v)} isDark={isDark} />
            <FormInput label="Emergency Phone" type="tel" value={form.emergency_contact_phone} onChange={v => set('emergency_contact_phone', v)} isDark={isDark} />
          </div>

          <h4 className={`font-bold ${tc.text} pt-2`}>Medical Info (Optional)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Medical Notes" value={form.medical_notes} onChange={v => set('medical_notes', v)} isDark={isDark} />
            <FormInput label="Allergies" value={form.allergies} onChange={v => set('allergies', v)} isDark={isDark} />
          </div>

          {/* Waivers Section */}
          {waivers.length > 0 && (
            <div className="pt-2">
              <h4 className={`font-bold ${tc.text} mb-3`}>Waivers</h4>
              {waivers.map(waiver => (
                <WaiverBlock key={waiver.id} waiver={waiver} isDark={isDark} tc={tc}
                  alreadySigned={signedWaivers[waiver.id]}
                  sigName={waiverSigs[waiver.id] || ''}
                  scrolled={waiverScrolled[waiver.id]}
                  onScroll={() => setWaiverScrolled(s => ({ ...s, [waiver.id]: true }))}
                  onSign={name => setWaiverSigs(s => ({ ...s, [waiver.id]: name }))} />
              ))}
            </div>
          )}

          {/* Submit */}
          <button onClick={onSubmit} disabled={submitting}
            className="w-full py-3 bg-[#4BB9EC] hover:bg-[#4BB9EC]/90 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// WAIVER BLOCK
// ============================================
function WaiverBlock({ waiver, isDark, tc, alreadySigned, sigName, scrolled, onScroll, onSign }) {
  if (alreadySigned) {
    return (
      <div className={`rounded-xl p-4 mb-3 ${isDark ? 'bg-emerald-900/20 border border-emerald-700/30' : 'bg-emerald-50 border border-emerald-200'}`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className={`font-semibold text-sm ${tc.text}`}>{waiver.name || waiver.title}</span>
          <span className="text-xs text-emerald-500 ml-auto">Already signed</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl p-4 mb-3 ${isDark ? 'bg-white/[0.03]/60 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
      <p className={`font-semibold text-sm mb-2 ${tc.text}`}>
        {waiver.name || waiver.title} {waiver.is_required && <span className="text-red-500">*</span>}
      </p>
      <div className={`max-h-32 overflow-y-auto text-xs leading-relaxed mb-3 p-3 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'}`}
        onScroll={e => {
          const el = e.target
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) onScroll()
        }}>
        {waiver.content || 'Waiver content not available.'}
      </div>
      {!scrolled && (
        <p className="text-xs text-amber-500 mb-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Scroll to the bottom to enable signing
        </p>
      )}
      <div className="flex items-center gap-2">
        <input type="text" placeholder="Type your full name to sign"
          value={sigName} onChange={e => onSign(e.target.value)}
          disabled={!scrolled && !sigName}
          className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
            isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
          } disabled:opacity-40`} />
        {sigName && <Check className="w-5 h-5 text-emerald-500" />}
      </div>
    </div>
  )
}

// ============================================
// SUMMARY CARD (right panel)
// ============================================
function SummaryCard({ season, form, waivers, waiverSigs, signedWaivers, isDark, tc }) {
  if (!season) return null
  const totalWaivers = waivers.length
  const signedCount = Object.keys(waiverSigs).filter(k => waiverSigs[k]?.trim()).length +
    Object.keys(signedWaivers).length

  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03]/40 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
      <h3 className={`font-bold text-lg mb-4 ${tc.text}`}>Registration Summary</h3>

      <div className="space-y-3">
        <SummaryRow label="Season" value={season.name} tc={tc} />
        {form.first_name && (
          <SummaryRow label="Player" value={`${form.first_name} ${form.last_name}`} tc={tc} />
        )}
        {season.fee_amount > 0 && (
          <SummaryRow label="Registration Fee" value={`$${season.fee_amount}`} tc={tc} />
        )}
        {totalWaivers > 0 && (
          <SummaryRow label="Waivers"
            value={`${signedCount} / ${totalWaivers} signed`}
            tc={tc}
            valueColor={signedCount === totalWaivers ? 'text-emerald-500' : 'text-amber-500'} />
        )}
        {form.date_of_birth && (
          <SummaryRow label="DOB" value={new Date(form.date_of_birth + 'T00:00:00').toLocaleDateString()} tc={tc} />
        )}
        {form.position && <SummaryRow label="Position" value={form.position} tc={tc} />}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, tc, valueColor }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${tc.textSecondary}`}>{label}</span>
      <span className={`text-sm font-semibold ${valueColor || tc.text}`}>{value}</span>
    </div>
  )
}

// ============================================
// MY REGISTRATIONS TAB
// ============================================
function MyRegistrations({ players, isDark, tc }) {
  if (players.length === 0) {
    return (
      <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-white/[0.03]/40' : 'bg-white border border-slate-200'}`}>
        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className={`text-lg font-semibold ${tc.text}`}>No Registrations Yet</p>
        <p className={tc.textSecondary}>Switch to the Open Seasons tab to register.</p>
      </div>
    )
  }

  const STATUS_COLORS = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    waitlisted: 'bg-blue-100 text-blue-700',
    denied: 'bg-red-100 text-red-700',
    inactive: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-3">
      {players.map(player => (
        <div key={player.id} className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03]/40 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4BB9EC]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#4BB9EC]" />
              </div>
              <div>
                <p className={`font-semibold ${tc.text}`}>{player.first_name} {player.last_name}</p>
                <p className={`text-sm ${tc.textSecondary}`}>
                  {getPrimaryTeamInfo(player.team_players)?.name || 'Awaiting placement'}
                  {player.position && ` -- ${player.position}`}
                </p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[player.status] || STATUS_COLORS.pending}`}>
              {player.status || 'pending'}
            </span>
          </div>
          {player.registration_date && (
            <p className={`text-xs mt-2 ${tc.textSecondary}`}>
              Registered: {new Date(player.registration_date).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================
// FORM HELPERS
// ============================================
function FormInput({ label, value, onChange, type = 'text', isDark }) {
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg text-sm border ${
          isDark ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
        } focus:ring-2 focus:ring-[#4BB9EC]/50 focus:border-[#4BB9EC] outline-none transition`} />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, isDark }) {
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg text-sm border ${
          isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
        } focus:ring-2 focus:ring-[#4BB9EC]/50 focus:border-[#4BB9EC] outline-none transition`}>
        {options.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
      </select>
    </div>
  )
}

export { ParentRegistrationHub }
