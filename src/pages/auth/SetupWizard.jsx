// =============================================================================
// SetupWizard — Full-page onboarding flow for new users
// Card-based steps with mascot companion, progress bar, confetti celebrations.
// Renders when needsOnboarding is true (after signup, before dashboard).
// =============================================================================

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useJourney, JOURNEY_STEPS } from '../../contexts/JourneyContext'
import { supabase } from '../../lib/supabase'

// ─── Design tokens (Lynx Brand Book) ───
const BRAND = {
  navy: '#0B1628',
  navyMid: '#10284C',
  sky: '#4BB9EC',
  skyDark: '#4BB9EC',
  gold: '#FFD700',
  teal: '#2DD4A8',
  coral: '#FF6B6B',
  pageBg: '#F5F6F8',
  cardBg: '#FFFFFF',
  textPrimary: '#0B1628',
  textMuted: '#64748B',
  radius: '24px',
  btnRadius: '14px',
}

// ─── Step enum ───
const STEPS = {
  ROLE: 'role',
  ORG_NAME: 'org_name',
  SPORTS: 'sports',  // NEW — sport selection for org directors
  COACH_PATH: 'coach_path',
  PARENT_PATH: 'parent_path',
  TEAM_NAME: 'team_name',
  INVITE_CODE: 'invite_code',
  SUCCESS: 'success',
  PENDING: 'pending',
}

// ─── Step metadata (progress, mascot, time) ───
const STEP_META = {
  [STEPS.ROLE]:        { progress: 25, mascot: '/images/mascots/waving.png',              mascotFallback: '/images/Meet-Lynx.png', time: 'Quick setup — just the basics' },
  [STEPS.ORG_NAME]:    { progress: 60, mascot: '/images/coachlynxmale.png',               mascotFallback: '/images/coachlynxmale.png', time: '~30 sec' },
  [STEPS.SPORTS]:      { progress: 75, mascot: '/images/mascots/clipboard-checklist.png', mascotFallback: '/images/laptoplynx.png', time: 'Almost done!' },
  [STEPS.COACH_PATH]:  { progress: 40, mascot: '/images/mascots/lightbulb.png',           mascotFallback: '/images/laptoplynx.png', time: null },
  [STEPS.PARENT_PATH]: { progress: 40, mascot: '/images/mascots/duo-high-five.png',       mascotFallback: '/images/celebrate.png', time: null },
  [STEPS.TEAM_NAME]:   { progress: 60, mascot: '/images/mascots/clipboard-checklist.png', mascotFallback: '/images/laptoplynx.png', time: '~30 sec' },
  [STEPS.INVITE_CODE]: { progress: 60, mascot: '/images/mascots/laptop.png',              mascotFallback: '/images/laptoplynx.png', time: '~1 min' },
  [STEPS.SUCCESS]:     { progress: 100, mascot: '/images/mascots/confetti.png',           mascotFallback: '/images/celebrate.png', time: null },
  [STEPS.PENDING]:     { progress: 100, mascot: '/images/SleepLynx.png',                 mascotFallback: '/images/SleepLynx.png', time: null },
}

// ─── Confetti ───
function fireConfetti() {
  const canvas = document.getElementById('wizard-confetti')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const colors = ['#4BB9EC', '#FFD700', '#2DD4A8', '#FF6B6B', '#ffffff']
  const pieces = []
  for (let i = 0; i < 100; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 4,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * 360,
      vr: -3 + Math.random() * 6,
      opacity: 1,
    })
  }
  let frame = 0
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.rot += p.vr; p.vy += 0.05
      if (frame > 60) p.opacity -= 0.01
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot * Math.PI / 180)
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })
    frame++
    if (frame < 150) requestAnimationFrame(draw)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  draw()
}

// ─── Mascot image with fallback ───
function MascotImage({ step, className = '' }) {
  const meta = STEP_META[step]
  const [src, setSrc] = useState(meta?.mascot || meta?.mascotFallback)

  return (
    <img
      src={src}
      alt=""
      className={`object-contain mx-auto ${className}`}
      style={{ animation: 'wizardFloat 3s ease-in-out infinite' }}
      onError={() => {
        if (src !== meta?.mascotFallback) setSrc(meta?.mascotFallback)
      }}
    />
  )
}

// ─── Journey step time estimates (honest — match the reality of org setup) ───
const JOURNEY_TIME = {
  create_org: '~15 min with everything handy',
  create_season: '~3 min',
  add_teams: '~2 min per team',
  add_coaches: '~1 min each',
  register_players: '~5 min',
  create_schedule: '~5 min',
  first_game: '~1 hr',
  join_create_team: '~2 min',
  add_roster: '~3 min',
  assign_coach: '~1 min',
  first_practice: '~1 hr',
}

// =============================================================================
// SetupWizard (main component)
// =============================================================================
export function SetupWizard({ onComplete, onBack }) {
  const { user, profile } = useAuth()
  const journey = useJourney()
  const { isDark } = useTheme()
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || ''

  // Step navigation
  const [step, setStep] = useState(STEPS.ROLE)
  const [history, setHistory] = useState([])
  const [animating, setAnimating] = useState(false)
  const cardRef = useRef(null)

  // Form state
  const [selectedRole, setSelectedRole] = useState(null)
  const [orgName, setOrgName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [selectedSport, setSelectedSport] = useState(null)
  const [customProgramName, setCustomProgramName] = useState('')
  const [createdOrgId, setCreatedOrgId] = useState(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successContext, setSuccessContext] = useState(null) // { type, name, role, badge }
  const [foundChildren, setFoundChildren] = useState(null) // auto-detected children for parent

  // Skip wizard if onboarding already completed (e.g. browser back-nav or stale state)
  useEffect(() => {
    if (profile?.onboarding_completed) {
      onComplete()
    }
  }, [profile?.onboarding_completed])

  // Auto-detect registered children when parent reaches PARENT_PATH step
  useEffect(() => {
    if (step === STEPS.PARENT_PATH && selectedRole === 'parent') {
      const email = user?.email || profile?.email
      if (!email) return
      ;(async () => {
        try {
          const { data } = await supabase
            .from('players')
            .select('id, first_name, last_name, team_players(teams(name, color)), season:seasons(name, organizations(name))')
            .eq('parent_email', email)
            .limit(5)
          if (data?.length > 0) setFoundChildren(data)
        } catch (err) { console.warn('Auto-detect children error:', err) }
      })()
    }
  }, [step, selectedRole])

  // Fire confetti on success
  useEffect(() => {
    if (step === STEPS.SUCCESS) {
      const t = setTimeout(() => fireConfetti(), 300)
      return () => clearTimeout(t)
    }
  }, [step])

  // Navigation helpers
  const goTo = (nextStep) => {
    setAnimating(true)
    setTimeout(() => {
      setHistory(prev => [...prev, step])
      setStep(nextStep)
      setError(null)
      setAnimating(false)
    }, 150)
  }

  const goBack = () => {
    if (history.length === 0) { onBack?.(); return }
    setAnimating(true)
    setTimeout(() => {
      const h = [...history]
      const prev = h.pop()
      setHistory(h)
      setStep(prev)
      setError(null)
      setAnimating(false)
    }, 150)
  }

  // ============================================
  // DATABASE ACTIONS (preserved from working code)
  // ============================================

  const createOrganization = async () => {
    setSaving(true)
    setError(null)
    try {
      const slug = orgName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) + '-' + Date.now().toString(36)

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, slug, is_active: true })
        .select()
        .single()

      if (orgError) throw orgError

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: user.id, organization_id: org.id,
        role: 'league_admin', is_active: true,
      })
      if (roleError) throw roleError

      // Set current_organization_id so AuthContext knows which org to load
      const { error: profileOrgError } = await supabase
        .from('profiles')
        .update({ current_organization_id: org.id })
        .eq('id', user.id)
      if (profileOrgError) throw profileOrgError

      const { error: onboardError } = await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'org_director', organization_id: org.id,
          completed_at: new Date().toISOString(),
          completed_steps: ['create_org'],
          earned_badges: ['founder', 'beta_tester'],
        },
      }).eq('id', user.id)
      if (onboardError) throw onboardError

      if (journey?.completeStep) journey.completeStep('create_org')

      setCreatedOrgId(org.id)
      setSaving(false)
      setSuccessContext({ type: 'org', name: orgName, role: 'Organization Director', badge: 'Founder' })
      goTo(STEPS.SPORTS)
    } catch (err) {
      console.error('Error creating organization:', err)
      setSaving(false)
      setError(err.message)
    }
  }

  // Save sport selection from wizard step 3
  const handleSportContinue = async () => {
    if (!selectedSport || !createdOrgId) return
    setSaving(true)
    setError(null)
    try {
      // Load current settings so we don't clobber anything
      const { data: orgRow } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', createdOrgId)
        .maybeSingle()

      const enabledSports = selectedSport === 'other' ? [] : [selectedSport]

      await supabase.from('organizations').update({
        settings: {
          ...(orgRow?.settings || {}),
          enabled_sports: enabledSports,
        },
      }).eq('id', createdOrgId)

      // Sport metadata for org-scoped sport records
      const SPORT_META = {
        volleyball:  { icon: '\ud83c\udfd0', color: '#FFB800' },
        basketball:  { icon: '\ud83c\udfc0', color: '#EF6C00' },
        soccer:      { icon: '\u26bd',       color: '#2E7D32' },
        baseball:    { icon: '\u26be',       color: '#C62828' },
        softball:    { icon: '\ud83e\udd4e', color: '#E91E63' },
        football:    { icon: '\ud83c\udfc8', color: '#6A1B9A' },
        lacrosse:    { icon: '\ud83e\udd4d', color: '#00838F' },
      }

      // Create a starter program — ALWAYS, regardless of sport selection
      if (selectedSport === 'other') {
        // "Other" path — create program with custom name (default to "General")
        const programName = customProgramName.trim() || 'General'
        await supabase.from('programs').insert({
          organization_id: createdOrgId,
          sport_id: null,
          name: programName,
          is_active: true,
          display_order: 0,
        })
      } else {
        const sportName = selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)
        const meta = SPORT_META[selectedSport] || {}

        // Check if this org already has a sport record for this sport
        const { data: existingOrgSport } = await supabase
          .from('sports')
          .select('id, name')
          .eq('organization_id', createdOrgId)
          .ilike('name', selectedSport)
          .maybeSingle()

        let sportId = existingOrgSport?.id || null

        // Create org-scoped sport record if none exists
        if (!sportId) {
          const { data: newSport } = await supabase
            .from('sports')
            .insert({
              organization_id: createdOrgId,
              name: sportName,
              icon: meta.icon || null,
              color_primary: meta.color || null,
              is_active: true,
              sort_order: 0,
            })
            .select('id')
            .single()
          sportId = newSport?.id || null
        }

        // Create program linked to the org-scoped sport
        await supabase.from('programs').insert({
          organization_id: createdOrgId,
          sport_id: sportId,
          name: sportName,
          is_active: true,
          display_order: 0,
        })
      }

      // Safety net: verify at least one program exists for this org
      const { count } = await supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', createdOrgId)

      if (!count || count === 0) {
        // Last resort fallback — create a "General" program
        await supabase.from('programs').insert({
          organization_id: createdOrgId,
          sport_id: null,
          name: 'General',
          is_active: true,
          display_order: 0,
        })
      }

      setSaving(false)
      goTo(STEPS.SUCCESS)
    } catch (err) {
      console.error('Error saving sport selection:', err)
      setSaving(false)
      // Don't block the user — go to celebration anyway
      goTo(STEPS.SUCCESS)
    }
  }

  const createMicroOrgForTM = async () => {
    setSaving(true)
    setError(null)
    try {
      const autoOrgName = `${profile?.full_name || 'My'} Club`
      const slug = autoOrgName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) + '-' + Date.now().toString(36)

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: autoOrgName,
          slug,
          is_active: true,
        })
        .select()
        .single()

      if (orgError) throw orgError

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'team_manager',
        is_active: true,
      })
      if (roleError) throw roleError

      const { error: profileOrgError } = await supabase
        .from('profiles')
        .update({ current_organization_id: org.id })
        .eq('id', user.id)
      if (profileOrgError) throw profileOrgError

      const { error: profileError } = await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'team_manager',
          organization_id: org.id,
          completed_at: new Date().toISOString(),
          completed_steps: ['join_create_team'],
          earned_badges: ['team_builder'],
        },
      }).eq('id', user.id)
      if (profileError) throw profileError

      if (journey?.completeStep) journey.completeStep('join_create_team')

      setSaving(false)
      onComplete() // Go directly to dashboard — TeamManagerSetup handles real team creation
    } catch (err) {
      console.error('Error creating team manager org:', err)
      setSaving(false)
      setError(err.message)
    }
  }

  const useInviteCodeAction = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data: invite } = await supabase
        .from('team_invite_codes')
        .select('*, teams(id, name, organization_id)')
        .eq('code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (!invite) {
        const { data: accountInvite } = await supabase
          .from('account_invites')
          .select('*')
          .eq('invite_code', inviteCode.toUpperCase())
          .eq('status', 'pending')
          .maybeSingle()

        if (!accountInvite) {
          // Check coaches table — codes are 8-char uppercase (legacy may be 16-char lowercase hex)
          const { data: coachInvite } = await supabase
            .from('coaches')
            .select('id, invite_code, invite_status')
            .ilike('invite_code', inviteCode)
            .eq('invite_status', 'invited')
            .maybeSingle()

          if (coachInvite) {
            // Redirect to the proper CoachInviteAcceptPage
            window.location.href = `/invite/coach/${coachInvite.invite_code}`
            setSaving(false)
            return
          }

          throw new Error('Invalid or expired invite code. Double-check with your admin.')
        }

        await supabase.from('account_invites')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', accountInvite.id)

        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: user.id, organization_id: accountInvite.organization_id,
          role: accountInvite.role || 'parent', is_active: true,
        })
        if (roleError) throw roleError

        const { error: profileErr1 } = await supabase.from('profiles').update({
          onboarding_completed: true,
          onboarding_data: {
            role: accountInvite.role || 'parent',
            organization_id: accountInvite.organization_id,
            completed_at: new Date().toISOString(),
            earned_badges: ['beta_tester'],
          },
        }).eq('id', user.id)
        if (profileErr1) throw profileErr1

        setSaving(false)
        setSuccessContext({ type: 'invite', name: 'your team', role: accountInvite.role || 'Parent', badge: null })
        goTo(STEPS.SUCCESS)
        return
      }

      const orgId = invite.teams?.organization_id
      const { error: roleError2 } = await supabase.from('user_roles').insert({
        user_id: user.id, organization_id: orgId,
        role: 'parent', is_active: true,
      })
      if (roleError2) throw roleError2

      const { error: profileErr2 } = await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'parent', organization_id: orgId,
          team_id: invite.team_id,
          completed_at: new Date().toISOString(),
          earned_badges: ['beta_tester'],
        },
      }).eq('id', user.id)
      if (profileErr2) throw profileErr2

      setSaving(false)
      setSuccessContext({ type: 'invite', name: invite.teams?.name || 'your team', role: 'Parent', badge: null })
      goTo(STEPS.SUCCESS)
    } catch (err) {
      console.error('Error using invite code:', err)
      setSaving(false)
      setError(err.message)
    }
  }

  const skipOnboarding = async () => {
    await supabase.from('profiles').update({
      onboarding_completed: true,
      onboarding_data: { skipped: true, completed_at: new Date().toISOString(), earned_badges: ['beta_tester'] },
    }).eq('id', user.id)
    onComplete()
  }

  // ============================================
  // ROLE SELECTION HANDLER
  // ============================================
  const handleRoleContinue = () => {
    if (!selectedRole) return
    if (selectedRole === 'org_director') goTo(STEPS.ORG_NAME)
    else if (selectedRole === 'team_manager') goTo(STEPS.COACH_PATH)
    else if (selectedRole === 'parent') goTo(STEPS.PARENT_PATH)
    else if (selectedRole === 'player') {
      // Players go directly to pending
      goTo(STEPS.PENDING)
    }
  }

  // Get journey role key for journey preview
  const getJourneyRole = () => {
    if (selectedRole === 'org_director') return 'org_director'
    if (selectedRole === 'team_manager') return 'team_manager'
    if (selectedRole === 'parent') return 'parent'
    return 'player'
  }

  // Progress data
  const meta = STEP_META[step] || { progress: 0 }

  // Step counter — each role has its own flow, so the step number and total
  // should match what the user is actually walking through. No phantom "Step 3 of 4".
  const directorSteps = [STEPS.ROLE, STEPS.ORG_NAME, STEPS.SPORTS, STEPS.SUCCESS]
  const coachSteps = [STEPS.ROLE, STEPS.COACH_PATH, STEPS.INVITE_CODE, STEPS.SUCCESS]
  const parentSteps = [STEPS.ROLE, STEPS.PARENT_PATH, STEPS.INVITE_CODE, STEPS.SUCCESS]
  const playerSteps = [STEPS.ROLE, STEPS.PENDING]

  const activeStepList = selectedRole === 'org_director' ? directorSteps
    : selectedRole === 'team_manager' ? coachSteps
    : selectedRole === 'parent' ? parentSteps
    : selectedRole === 'player' ? playerSteps
    : directorSteps

  // Fallback: if the current step isn't in the active list (e.g., pre-role, PENDING
  // reached from any path), default stepCount to 1 so we never show "Step 0 of N".
  const rawStepIndex = activeStepList.indexOf(step)
  const stepCount = rawStepIndex >= 0 ? rawStepIndex + 1 : 1
  const totalSteps = activeStepList.length

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BRAND.pageBg, fontFamily: "var(--v2-font, 'Plus Jakarta Sans'), sans-serif" }}>
      {/* Confetti canvas */}
      <canvas id="wizard-confetti" className="fixed inset-0 z-50 pointer-events-none" />

      {/* Float animation style */}
      <style>{`
        @keyframes wizardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes wizardSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .wizard-card-enter { animation: wizardSlideIn 250ms ease-out; }
      `}</style>

      {/* ─── Top Bar ─── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: BRAND.pageBg }}>
        {history.length > 0 && step !== STEPS.SUCCESS ? (
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: BRAND.textMuted }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back
          </button>
        ) : <div />}
        <img src="/lynx-icon-logo.png" alt="Lynx" className="w-8 h-8" />
      </div>

      {/* ─── Progress Bar ─── */}
      <div className="px-6 mb-6 max-w-[520px] w-full mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#E8ECF2' }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${meta.progress}%`, background: BRAND.sky }} />
          </div>
          <span className="ml-3 text-xs font-medium" style={{ color: BRAND.textMuted }}>Step {stepCount} of {totalSteps}</span>
        </div>
      </div>

      {/* ─── Card Content ─── */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div ref={cardRef} className={`w-full max-w-[520px] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E8ECF2] ${animating ? 'opacity-0' : 'wizard-card-enter'}`}
          style={{ background: BRAND.cardBg, transition: 'opacity 150ms ease' }}>

          {/* ─── STEP: Role Selection ─── */}
          {step === STEPS.ROLE && (
            <>
              <MascotImage step={step} className="w-28 h-28 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                Welcome{firstName ? `, ${firstName}` : ''}! What brings you to Lynx?
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                Pick the role that fits you best. You can always add more later.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'org_director', emoji: '\ud83c\udfe2', title: 'Organization Director', desc: 'I run a club with multiple teams' },
                  { id: 'team_manager', emoji: '\ud83c\udfd0', title: 'Coach / Team Manager', desc: 'I manage or coach a team' },
                  { id: 'parent', emoji: '\u2764\ufe0f', title: 'Parent / Guardian', desc: 'My child plays on a team' },
                  { id: 'player', emoji: '\u2b50', title: 'Player', desc: "I'm an athlete" },
                ].map(role => (
                  <button key={role.id} onClick={() => setSelectedRole(role.id)}
                    className="p-4 rounded-[16px] text-left transition-all border-2"
                    style={{
                      borderColor: selectedRole === role.id ? BRAND.sky : '#E8ECF2',
                      background: selectedRole === role.id ? BRAND.sky + '10' : '#FAFBFC',
                      boxShadow: selectedRole === role.id ? `0 0 0 1px ${BRAND.sky}30` : 'none',
                    }}>
                    <span className="text-2xl block mb-2">{role.emoji}</span>
                    <p className="font-bold text-sm" style={{ color: BRAND.textPrimary }}>{role.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{role.desc}</p>
                  </button>
                ))}
              </div>

              <PrimaryButton onClick={handleRoleContinue} disabled={!selectedRole} saving={false}>
                Let's Go
              </PrimaryButton>

              <button onClick={skipOnboarding}
                className="block mx-auto mt-4 text-sm font-medium transition-colors hover:underline"
                style={{ color: BRAND.textMuted }}>
                Skip setup for now
              </button>

              {meta.time && (
                <p className="text-center mt-4 text-xs" style={{ color: BRAND.textMuted }}>
                  {'\u23f1\ufe0f'} {meta.time}
                </p>
              )}
            </>
          )}

          {/* ─── STEP: Org Name ─── */}
          {step === STEPS.ORG_NAME && (
            <>
              <MascotImage step={step} className="w-24 h-24 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                Let's set up your organization
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                Just a name for now — you'll add all the details from your dashboard.
              </p>

              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: BRAND.textMuted }}>Organization Name</label>
              <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} autoFocus
                placeholder="e.g., Metro Youth Athletics"
                className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium outline-none transition-colors mb-6 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10"
                style={{ borderColor: '#E8ECF2', color: BRAND.textPrimary, background: '#FAFBFC' }}
              />

              {error && <ErrorMessage message={error} />}

              <PrimaryButton onClick={createOrganization} disabled={!orgName.trim()} saving={saving}>
                Create Organization
              </PrimaryButton>

              {meta.time && <TimeLabel time={meta.time} />}
            </>
          )}

          {/* ─── STEP: Sport Picker (org director) ─── */}
          {step === STEPS.SPORTS && (
            <>
              <MascotImage step={step} className="w-24 h-24 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                What does {orgName || 'your club'} play? {'\ud83c\udfc6'}
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                Pick your main sport. You can add more later.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'volleyball', emoji: '\ud83c\udfd0', name: 'Volleyball', color: '#FFB800' },
                  { id: 'basketball', emoji: '\ud83c\udfc0', name: 'Basketball', color: '#EF6C00' },
                  { id: 'soccer',     emoji: '\u26bd',       name: 'Soccer',     color: '#2E7D32' },
                  { id: 'baseball',   emoji: '\u26be',       name: 'Baseball',   color: '#C62828' },
                  { id: 'softball',   emoji: '\ud83e\udd4e', name: 'Softball',   color: '#E91E63' },
                  { id: 'football',   emoji: '\ud83c\udfc8', name: 'Football',   color: '#6A1B9A' },
                  { id: 'lacrosse',   emoji: '\ud83e\udd4d', name: 'Lacrosse',   color: '#00838F' },
                  { id: 'other',      emoji: '\ud83c\udfaf', name: 'Other / Multiple', color: '#546E7A' },
                ].map(sport => (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSport(sport.id)}
                    className="p-4 rounded-[14px] text-left transition-all"
                    style={{
                      background: selectedSport === sport.id ? `${sport.color}20` : '#FAFBFC',
                      border: selectedSport === sport.id ? `2px solid ${sport.color}` : '2px solid #E8ECF2',
                    }}
                  >
                    <span className="text-3xl block mb-1">{sport.emoji}</span>
                    <span className="text-sm font-bold" style={{ color: BRAND.textPrimary }}>{sport.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom name input when "Other" is selected */}
              {selectedSport === 'other' && (
                <div className="mb-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: BRAND.textMuted }}>Program Name</label>
                  <input
                    type="text"
                    value={customProgramName}
                    onChange={e => setCustomProgramName(e.target.value)}
                    placeholder="e.g., Multi-Sport, General Athletics"
                    className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium outline-none transition-colors focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10"
                    style={{ borderColor: '#E8ECF2', color: BRAND.textPrimary, background: '#FAFBFC' }}
                  />
                  <p className="text-xs mt-1.5" style={{ color: BRAND.textMuted }}>Leave blank to use "General"</p>
                </div>
              )}

              {error && <ErrorMessage message={error} />}

              <PrimaryButton onClick={handleSportContinue} disabled={!selectedSport} saving={saving}>
                Continue
              </PrimaryButton>

              {meta.time && <TimeLabel time={meta.time} />}
            </>
          )}

          {/* ─── STEP: Coach Path ─── */}
          {step === STEPS.COACH_PATH && (
            <>
              <MascotImage step={step} className="w-24 h-24 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                How's your team set up?
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                We'll get you connected to your team.
              </p>

              {saving ? (
                <div className="flex flex-col items-center py-8">
                  <svg className="animate-spin w-8 h-8 mb-3" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke={BRAND.sky} strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 019.95 9" stroke={BRAND.sky} strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: BRAND.textMuted }}>Setting up your account...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <OptionCard emoji={'\ud83c\udfd0'} title="Start a new team" desc="I'm building something from scratch" onClick={createMicroOrgForTM} />
                  <OptionCard emoji={'\ud83d\udd17'} title="I have an invite code" desc="My organization gave me a code" onClick={() => goTo(STEPS.INVITE_CODE)} />
                  <OptionCard emoji={'\u23f3'} title="I'll be added later" desc="Someone will assign me to a team" onClick={() => goTo(STEPS.PENDING)} />
                </div>
              )}

              {error && <ErrorMessage message={error} />}
            </>
          )}

          {/* ─── STEP: Parent Path ─── */}
          {step === STEPS.PARENT_PATH && (
            <>
              {foundChildren?.length > 0 ? (
                <>
                  {/* Celebration — children auto-detected */}
                  <div className="text-6xl text-center mb-2" style={{ animation: 'bounce 0.6s ease-in-out' }}>🎉</div>
                  <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                    We Found Your {foundChildren.length === 1 ? 'Player' : 'Players'}!
                  </h1>
                  <p className="text-center mb-5" style={{ color: BRAND.textMuted, fontSize: 14 }}>
                    {foundChildren.length === 1
                      ? "Your player is already registered! Let's get you connected."
                      : "Your players are already registered! Let's get you connected."}
                  </p>

                  <div className="space-y-3 mb-6">
                    {foundChildren.map(child => {
                      const teamName = child.team_players?.[0]?.teams?.name
                      const orgName = child.season?.organizations?.name
                      return (
                        <div key={child.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '14px 16px', borderRadius: 14,
                          background: 'rgba(16, 185, 129, 0.06)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0,
                          }}>
                            {child.first_name?.[0] || '?'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: BRAND.textPrimary, fontSize: 15 }}>
                              {child.first_name} {child.last_name}
                            </div>
                            {teamName && <div style={{ fontSize: 12, color: BRAND.textMuted }}>{teamName}</div>}
                            {orgName && <div style={{ fontSize: 11, color: '#94a3b8' }}>{orgName}</div>}
                          </div>
                          <div style={{ color: '#10B981', fontSize: 20, flexShrink: 0 }}>✓</div>
                        </div>
                      )
                    })}
                  </div>

                  <PrimaryButton onClick={() => goTo(STEPS.PENDING)}>
                    Let's Go!
                  </PrimaryButton>

                  <button
                    onClick={() => setFoundChildren(null)}
                    className="mt-3 text-sm underline"
                    style={{ color: BRAND.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    I also have an invite code
                  </button>
                </>
              ) : (
                <>
                  {/* Default — invite code or wait */}
                  <MascotImage step={step} className="w-24 h-24 mb-4" />
                  <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                    Let's get your family connected!
                  </h1>
                  <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                    Your club admin or coach may have given you a code.
                  </p>

                  <div className="space-y-3">
                    <OptionCard emoji="🔗" title="I have an invite code" desc="Join my team or organization" onClick={() => goTo(STEPS.INVITE_CODE)} />
                    <OptionCard emoji="⏳" title="I'll be added later" desc="Someone will assign me to a team" onClick={() => goTo(STEPS.PENDING)} />
                  </div>
                </>
              )}
            </>
          )}

          {/* ─── STEP: Team Name (no longer used — TMs skip to dashboard, team created in TeamManagerSetup) ─── */}

          {/* ─── STEP: Invite Code ─── */}
          {step === STEPS.INVITE_CODE && (
            <>
              <MascotImage step={step} className="w-24 h-24 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                Enter your invite code
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                Check your email or text from the team admin.
              </p>

              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: BRAND.textMuted }}>Invite Code</label>
              <input type="text" value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())} autoFocus
                placeholder="XXXX-XXXX"
                className="w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-mono font-bold tracking-widest outline-none transition-colors mb-4 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10"
                style={{ borderColor: '#E8ECF2', color: BRAND.textPrimary, background: '#FAFBFC' }}
              />

              {error && <ErrorMessage message={error} />}

              <div className="rounded-[14px] p-3 mb-6" style={{ background: '#F1F5F9' }}>
                <p className="text-sm" style={{ color: BRAND.textMuted }}>
                  \ud83d\udca1 Ask your team manager or organization director for the invite code.
                </p>
              </div>

              <PrimaryButton onClick={useInviteCodeAction} disabled={!inviteCode.trim()} saving={saving}>
                Join Team
              </PrimaryButton>

              {meta.time && <TimeLabel time={meta.time} />}
            </>
          )}

          {/* ─── STEP: Success ─── */}
          {step === STEPS.SUCCESS && successContext && (
            <>
              <MascotImage step={step} className="w-28 h-28 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                {successContext.type === 'org' ? "You're in! \ud83c\udf89"
                  : successContext.type === 'team' ? 'Your team is ready! \ud83c\udfd0'
                  : "You're in! Welcome to the team! \ud83c\udf89"}
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                {successContext.type === 'org'
                  ? `${successContext.name} is created and ready to set up. Here's what's next — take it at your own pace.`
                  : successContext.type === 'invite'
                  ? `You've joined ${successContext.name}.`
                  : `${successContext.name} has been created.`}
              </p>

              {/* Summary card */}
              <div className="rounded-[16px] p-4 mb-6" style={{ background: '#F1F5F9' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: BRAND.textPrimary }}>
                    {successContext.type === 'org' ? 'Organization' : successContext.type === 'team' ? 'Team' : 'Team'}
                  </span>
                  {successContext.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: BRAND.gold + '20', color: '#B8860B' }}>
                      {successContext.badge}
                    </span>
                  )}
                </div>
                <p className="font-bold" style={{ color: BRAND.textPrimary }}>{successContext.name}</p>
                <p className="text-sm" style={{ color: BRAND.textMuted }}>Role: {successContext.role}</p>
              </div>

              {/* Journey Preview */}
              {JOURNEY_STEPS?.[getJourneyRole()] && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1" style={{ color: BRAND.textPrimary }}>Here's what's ahead</h2>
                  <p className="text-sm mb-4" style={{ color: BRAND.textMuted }}>Your setup checklist — tackle these whenever you're ready.</p>
                  <div className="space-y-2">
                    {(JOURNEY_STEPS[getJourneyRole()] || []).slice(1, 6).map(jStep => (
                      <div key={jStep.id} className="flex items-center gap-3 px-3 py-2 rounded-[12px]" style={{ background: '#F8FAFC' }}>
                        <div className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: '#CBD5E1' }} />
                        <span className="flex-1 text-sm font-medium" style={{ color: BRAND.textPrimary }}>{jStep.title}</span>
                        <span className="text-xs" style={{ color: BRAND.textMuted }}>{JOURNEY_TIME[jStep.id] || '~2 min'}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-sm mt-4" style={{ color: BRAND.textMuted }}>
                    No rush — you can always pick up where you left off. {'\u23f0'}
                  </p>
                </div>
              )}

              <PrimaryButton onClick={() => onComplete()}>
                Go to Dashboard
              </PrimaryButton>
            </>
          )}

          {/* ─── STEP: Pending (waiting to be assigned) ─── */}
          {step === STEPS.PENDING && (
            <>
              <MascotImage step={step} className="w-28 h-28 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                You're all set for now!
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                Your admin or coach will add you to a team. You'll get a notification when it happens.
              </p>

              <PrimaryButton onClick={skipOnboarding}>
                Go to Dashboard
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function PrimaryButton({ onClick, disabled, saving, children }) {
  return (
    <button onClick={onClick} disabled={disabled || saving}
      className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-40 hover:brightness-110"
      style={{ background: BRAND.navyMid, fontFamily: "var(--v2-font, 'Plus Jakarta Sans'), sans-serif" }}>
      {saving ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Saving...
        </span>
      ) : children}
    </button>
  )
}

function OptionCard({ emoji, title, desc, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:border-[#4BB9EC] hover:bg-[#4BB9EC]/[0.04]"
      style={{ borderColor: '#E8ECF2', background: '#FAFBFC' }}>
      <span className="text-2xl shrink-0">{emoji}</span>
      <div>
        <p className="font-bold text-sm" style={{ color: BRAND.textPrimary }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{desc}</p>
      </div>
      <svg className="w-4 h-4 ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke={BRAND.textMuted} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  )
}

function ErrorMessage({ message }) {
  return (
    <div className="rounded-[12px] p-3 mb-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
      <p className="text-sm font-medium" style={{ color: BRAND.coral }}>{message}</p>
    </div>
  )
}

function TimeLabel({ time }) {
  return (
    <p className="text-center mt-4 text-xs" style={{ color: BRAND.textMuted }}>
      {'\u23f1\ufe0f'} {time}
    </p>
  )
}

export { SetupWizard as default }
