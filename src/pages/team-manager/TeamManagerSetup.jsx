// =============================================================================
// TeamManagerSetup — 3-step setup wizard for new Team Managers
// Steps: Create Your Team → Season Info → You're All Set! (Confirmation)
// Ported from mobile team-manager-setup.tsx, adapted for desktop
// =============================================================================

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  ChevronLeft, ChevronRight, Check, Copy, Share2, Users, Calendar, Trophy
} from '../../constants/icons'
import { generateTeamInviteCode } from '../../lib/invite-utils'

const SPORT_OPTIONS = [
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'soccer', label: 'Soccer', icon: '⚽' },
  { value: 'baseball', label: 'Baseball', icon: '⚾' },
  { value: 'football', label: 'Football', icon: '🏈' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
]

const AGE_GROUPS = ['5U', '6U', '7U', '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '17U', '18U', 'Adult', 'Open']

const COLOR_PRESETS = [
  '#1E40AF', '#7C3AED', '#DC2626', '#059669', '#D97706',
  '#0891B2', '#BE185D', '#4F46E5', '#15803D', '#EA580C',
  '#0D9488', '#7C2D12', '#1D4ED8', '#9333EA', '#B91C1C',
]

function getDefaultSeasonName() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  if (month >= 0 && month <= 4) return `Spring ${year}`
  if (month >= 5 && month <= 7) return `Summer ${year}`
  if (month >= 8 && month <= 10) return `Fall ${year}`
  return `Winter ${year}`
}

export default function TeamManagerSetup({ roleContext, showToast, onComplete }) {
  const { user, profile, organization } = useAuth()
  const { isDark } = useTheme()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Step 1: Team Info
  const [teamName, setTeamName] = useState('')
  const [sport, setSport] = useState('volleyball')
  const [ageGroup, setAgeGroup] = useState('14U')
  const [teamColor, setTeamColor] = useState('#1E40AF')
  const [teamType, setTeamType] = useState('competitive')

  // Step 2: Season Info
  const [seasonName, setSeasonName] = useState(getDefaultSeasonName())
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d.toISOString().split('T')[0]
  })

  // Results
  const [inviteCode, setInviteCode] = useState(null)
  const [createdTeamName, setCreatedTeamName] = useState('')

  const cardClass = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06] rounded-[14px]'
    : 'bg-white border border-lynx-silver rounded-[14px] shadow-soft-sm'

  const inputClass = isDark
    ? 'w-full px-4 py-3 rounded-[14px] bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 outline-none'
    : 'w-full px-4 py-3 rounded-[14px] bg-white border border-lynx-silver text-slate-900 placeholder-slate-400 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 outline-none'

  const labelClass = `text-r-sm font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`

  async function handleCreate() {
    if (!teamName.trim()) {
      setError('Team name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // ── Step 1: Create org if needed ──
      let orgId = organization?.id

      if (!orgId) {
        const slug = teamName.trim().toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) + '-' + Date.now().toString(36)

        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: teamName.trim(),
            slug,
            is_active: true,
          })
          .select()
          .single()

        if (orgError) throw orgError
        orgId = newOrg.id
      }

      // ── Step 2: Create user_roles BEFORE season/team (required for RLS) ──
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('organization_id', orgId)
        .eq('role', 'team_manager')
        .maybeSingle()

      if (!existingRole) {
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: profile.id,
          organization_id: orgId,
          role: 'team_manager',
          is_active: true,
        })
        if (roleError) throw roleError
      }

      // ── Step 3: Update profiles.current_organization_id (required for RLS) ──
      const { error: profileOrgError } = await supabase
        .from('profiles')
        .update({ current_organization_id: orgId })
        .eq('id', profile.id)
      if (profileOrgError) throw profileOrgError

      // ── Step 4a: Create program for the team manager's micro-org ──
      let sportId = null
      const sportLabel = SPORT_OPTIONS.find(s => s.value === sport)?.label || sport
      const { data: sportRecord } = await supabase
        .from('sports')
        .select('id, name')
        .ilike('name', sport)
        .maybeSingle()
      if (sportRecord) sportId = sportRecord.id

      const { data: program, error: programError } = await supabase
        .from('programs')
        .insert({
          organization_id: orgId,
          sport_id: sportId,
          name: sportRecord?.name || sportLabel,
          is_active: true,
          display_order: 0,
        })
        .select()
        .single()

      if (programError) throw programError

      // ── Step 4b: Create season linked to program ──
      const { data: newSeason, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          organization_id: orgId,
          sport: sport.toLowerCase(),
          name: seasonName.trim(),
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          program_id: program.id,
        })
        .select()
        .single()

      if (seasonError) throw seasonError

      // ── Step 5: Create team ──
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          season_id: newSeason.id,
          name: teamName.trim(),
          color: teamColor,
          age_group: ageGroup,
          team_type: teamType,
          max_players: 20,
        })
        .select()
        .single()

      if (teamError) throw teamError

      // ── Step 6: Create team_staff assignment ──
      const { error: staffError } = await supabase
        .from('team_staff')
        .insert({
          team_id: newTeam.id,
          user_id: profile.id,
          staff_role: 'team_manager',
          is_active: true,
        })

      if (staffError) throw staffError

      // ── Step 7: Generate invite code (graceful if table missing) ──
      let code = null
      try {
        code = generateTeamInviteCode()
        await supabase.from('team_invite_codes').insert({
          team_id: newTeam.id,
          code,
          is_active: true,
          max_uses: 30,
          current_uses: 0,
          created_by: profile.id,
        })
      } catch (codeErr) {
        console.warn('Could not create invite code:', codeErr)
        code = null
      }

      setInviteCode(code)
      setCreatedTeamName(newTeam.name)
      setStep(3)
      showToast?.('Team created successfully!', 'success')
    } catch (err) {
      console.error('TeamManagerSetup error:', err)
      setError(err.message || 'Failed to create team. Please try again.')
    }
    setSaving(false)
  }

  async function handleCopyCode() {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      showToast?.('Code copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className={`w-full max-w-lg ${cardClass} overflow-hidden`}>
        {/* Progress Bar */}
        <div className={`h-1.5 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
          <div className="h-full bg-lynx-sky transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-8">
          {/* Step Indicator */}
          {step < 3 && (
            <p className={`text-r-xs font-bold uppercase tracking-widest mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Step {step} of 3
            </p>
          )}

          {/* Step 1: Team Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-r-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Your Team</h2>
                <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tell us about your team</p>
              </div>

              <div>
                <label className={labelClass}>Team Name</label>
                <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g., Storm 14U" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Sport</label>
                <div className="grid grid-cols-3 gap-2">
                  {SPORT_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setSport(s.value)}
                      className={`p-3 rounded-[14px] text-center transition ${
                        sport === s.value
                          ? (isDark ? 'bg-lynx-sky/10 border-2 border-lynx-sky text-white' : 'bg-lynx-ice border-2 border-lynx-sky text-lynx-navy')
                          : (isDark ? 'bg-white/[0.04] border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')
                      }`}>
                      <span className="text-r-xl block mb-1">{s.icon}</span>
                      <span className="text-r-xs font-semibold">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Age Group</label>
                <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={inputClass}>
                  {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Team Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(c => (
                    <button key={c} onClick={() => setTeamColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${teamColor === c ? 'ring-2 ring-lynx-sky ring-offset-2 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c, ringOffsetColor: isDark ? '#1A2744' : '#fff' }} />
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Team Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'recreational', label: 'Recreational', icon: '🎉', desc: 'Fun-focused, all skill levels' },
                    { value: 'competitive', label: 'Competitive', icon: '🏆', desc: 'Tournaments & league play' },
                  ].map(t => (
                    <button key={t.value} onClick={() => setTeamType(t.value)}
                      className={`p-3 rounded-[14px] text-center transition ${
                        teamType === t.value
                          ? (isDark ? 'bg-lynx-sky/10 border-2 border-lynx-sky text-white' : 'bg-lynx-ice border-2 border-lynx-sky text-lynx-navy')
                          : (isDark ? 'bg-white/[0.04] border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')
                      }`}>
                      <span className="text-r-xl block mb-1">{t.icon}</span>
                      <span className="text-r-xs font-semibold block">{t.label}</span>
                      <span className={`text-r-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Season Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-r-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Season Details</h2>
                <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>When does your season run?</p>
              </div>

              <div>
                <label className={labelClass}>Season Name</label>
                <input type="text" value={seasonName} onChange={e => setSeasonName(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className={`text-r-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>You're All Set!</h2>
                <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{createdTeamName} has been created</p>
              </div>

              {inviteCode && (
                <div>
                  <p className={`text-r-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Share this code with parents and players</p>
                  <div className={`py-4 px-6 rounded-[14px] mb-4 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-lynx-cloud border border-slate-100'}`}>
                    <p className={`text-r-4xl font-bold tracking-[0.3em] font-mono ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{inviteCode}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={handleCopyCode}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] font-bold text-r-sm transition ${
                        copied ? 'bg-emerald-500 text-white' : 'bg-lynx-sky text-white hover:bg-lynx-deep'
                      }`}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex gap-3 mt-8 ${step === 3 ? 'justify-center' : 'justify-between'}`}>
            {step === 2 && (
              <button onClick={() => { setStep(1); setError(null) }}
                className={`flex items-center gap-1 px-5 py-3 rounded-[14px] font-semibold text-r-sm ${
                  isDark ? 'border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-600 hover:bg-slate-50'
                }`}>
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step === 1 && (
              <button onClick={() => { if (!teamName.trim()) { setError('Team name is required'); return }; setStep(2); setError(null) }}
                disabled={!teamName.trim()}
                className="flex items-center gap-1 px-5 py-3 rounded-[14px] font-bold text-r-sm bg-lynx-sky text-white hover:bg-lynx-deep disabled:opacity-50 transition ml-auto">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button onClick={handleCreate} disabled={saving}
                className="flex items-center gap-1 px-6 py-3 rounded-[14px] font-bold text-r-sm bg-lynx-sky text-white hover:bg-lynx-deep disabled:opacity-50 transition ml-auto">
                {saving ? 'Creating...' : 'Create Team'}
              </button>
            )}

            {step === 3 && (
              <button onClick={() => { window.location.href = '/dashboard' }}
                className="px-8 py-3 rounded-[14px] font-bold text-r-sm bg-lynx-sky text-white hover:bg-lynx-deep transition">
                Go to Dashboard
              </button>
            )}
          </div>

          {error && step < 3 && (
            <p className="text-r-sm text-red-400 font-medium mt-3">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
