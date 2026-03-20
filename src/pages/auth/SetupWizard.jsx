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
  sky: '#5BCBFA',
  skyDark: '#4BB9EC',
  gold: '#FFD700',
  teal: '#2DD4A8',
  coral: '#FF6B6B',
  pageBg: '#F4F7FA',
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
  COACH_PATH: 'coach_path',
  PARENT_PATH: 'parent_path',
  TEAM_NAME: 'team_name',
  INVITE_CODE: 'invite_code',
  SUCCESS: 'success',
  PENDING: 'pending',
}

// ─── Step metadata (progress, mascot, time) ───
const STEP_META = {
  [STEPS.ROLE]:        { progress: 25, mascot: '/images/mascots/waving.png',              mascotFallback: '/images/Meet-Lynx.png', time: '~2 min total' },
  [STEPS.ORG_NAME]:    { progress: 60, mascot: '/images/coachlynxmale.png',               mascotFallback: '/images/coachlynxmale.png', time: '~30 sec' },
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

// ─── Journey step time estimates ───
const JOURNEY_TIME = {
  create_org: '~3 min', create_season: '~3 min', add_teams: '~2 min',
  add_coaches: '~2 min', register_players: '~5 min', create_schedule: '~5 min',
  first_game: '~1 hr', join_create_team: '~2 min', add_roster: '~3 min',
  assign_coach: '~1 min', first_practice: '~1 hr',
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

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successContext, setSuccessContext] = useState(null) // { type, name, role, badge }

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
        .insert({ name: orgName, slug, type: 'club', settings: {} })
        .select()
        .single()

      if (orgError) throw orgError

      await supabase.from('user_roles').insert({
        user_id: user.id, organization_id: org.id,
        role: 'league_admin', is_active: true,
      })

      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'org_director', organization_id: org.id,
          completed_at: new Date().toISOString(),
          completed_steps: ['create_org'],
          earned_badges: ['founder', 'beta_tester'],
        },
      }).eq('id', user.id)

      if (journey?.completeStep) journey.completeStep('create_org')

      setSaving(false)
      setSuccessContext({ type: 'org', name: orgName, role: 'Organization Director', badge: 'Founder' })
      goTo(STEPS.SUCCESS)
    } catch (err) {
      console.error('Error creating organization:', err)
      setSaving(false)
      setError(err.message)
    }
  }

  const createIndependentTeam = async () => {
  setSaving(true)
  setError(null)
  try {
    const slug = teamName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36)

    // Just create org - they'll add team from dashboard
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: teamName,
        slug: slug,
        is_active: true,
      })
      .select()
      .single()

      if (orgError) throw orgError

    await supabase.from('user_roles').insert({
      user_id: user.id,
      organization_id: org.id,
      role: 'team_manager',
      is_active: true,
    })

    // Update profile with current org (required for RLS)
    await supabase
      .from('profiles')
      .update({ current_organization_id: org.id })
      .eq('id', user.id)

    await supabase.from('profiles').update({
      onboarding_completed: true,
      onboarding_data: {
        role: 'team_manager',
        organization_id: org.id,
        completed_at: new Date().toISOString(),
        completed_steps: ['join_create_team'], // Initialize with first step complete
        earned_badges: ['team_builder'], // Award the team builder badge
      },
    }).eq('id', user.id)

      if (journey?.completeStep) journey.completeStep('join_create_team')

      setSaving(false)
      setSuccessContext({ type: 'team', name: teamName, role: 'Team Manager', badge: 'Team Builder' })
      goTo(STEPS.SUCCESS)
    } catch (err) {
      console.error('Error creating team:', err)
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

        if (!accountInvite) throw new Error('Invalid or expired invite code. Double-check with your admin.')

        await supabase.from('account_invites')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', accountInvite.id)

        await supabase.from('user_roles').insert({
          user_id: user.id, organization_id: accountInvite.organization_id,
          role: accountInvite.role || 'parent', is_active: true,
        })

        await supabase.from('profiles').update({
          onboarding_completed: true,
          onboarding_data: {
            role: accountInvite.role || 'parent',
            organization_id: accountInvite.organization_id,
            completed_at: new Date().toISOString(),
            earned_badges: ['beta_tester'],
          },
        }).eq('id', user.id)

        setSaving(false)
        setSuccessContext({ type: 'invite', name: 'your team', role: accountInvite.role || 'Parent', badge: null })
        goTo(STEPS.SUCCESS)
        return
      }

      const orgId = invite.teams?.organization_id
      await supabase.from('user_roles').insert({
        user_id: user.id, organization_id: orgId,
        role: 'parent', is_active: true,
      })

      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'parent', organization_id: orgId,
          team_id: invite.team_id,
          completed_at: new Date().toISOString(),
          earned_badges: ['beta_tester'],
        },
      }).eq('id', user.id)

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
  const stepCount = step === STEPS.ROLE ? 1
    : (step === STEPS.SUCCESS || step === STEPS.PENDING) ? 4
    : step === STEPS.ORG_NAME || step === STEPS.COACH_PATH || step === STEPS.PARENT_PATH ? 2
    : 3
  const totalSteps = step === STEPS.SUCCESS || step === STEPS.PENDING ? 4 : 4

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BRAND.pageBg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${meta.progress}%`, background: BRAND.sky }} />
          </div>
          <span className="ml-3 text-xs font-medium" style={{ color: BRAND.textMuted }}>Step {stepCount} of {totalSteps}</span>
        </div>
      </div>

      {/* ─── Card Content ─── */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div ref={cardRef} className={`w-full max-w-[520px] rounded-[24px] p-8 shadow-lg ${animating ? 'opacity-0' : 'wizard-card-enter'}`}
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
                      borderColor: selectedRole === role.id ? BRAND.sky : '#E2E8F0',
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
                  \u23f1\ufe0f {meta.time}
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

              <label className="block text-sm font-semibold mb-2" style={{ color: BRAND.textPrimary }}>Organization Name</label>
              <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} autoFocus
                placeholder="e.g., Black Hornets Athletics"
                className="w-full px-4 py-3 rounded-[14px] border-2 text-base font-medium outline-none transition-colors mb-6"
                style={{ borderColor: '#E2E8F0', color: BRAND.textPrimary, background: '#FAFBFC' }}
                onFocus={e => e.target.style.borderColor = BRAND.sky}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />

              {error && <ErrorMessage message={error} />}

              <PrimaryButton onClick={createOrganization} disabled={!orgName.trim()} saving={saving}>
                Create Organization
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

              <div className="space-y-3">
                <OptionCard emoji="\ud83c\udfd0" title="Start a new team" desc="I'm building something from scratch" onClick={() => goTo(STEPS.TEAM_NAME)} />
                <OptionCard emoji="\ud83d\udd17" title="I have an invite code" desc="My organization gave me a code" onClick={() => goTo(STEPS.INVITE_CODE)} />
                <OptionCard emoji="\u23f3" title="I'll be added later" desc="Someone will assign me to a team" onClick={() => goTo(STEPS.PENDING)} />
              </div>
            </>
          )}

          {/* ─── STEP: Parent Path ─── */}
          {step === STEPS.PARENT_PATH && (
            <>
              <MascotImage step={step} className="w-24 h-24 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                Let's get your family connected!
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                Your club admin or coach may have given you a code.
              </p>

              <div className="space-y-3">
                <OptionCard emoji="\ud83d\udd17" title="I have an invite code" desc="Join my team or organization" onClick={() => goTo(STEPS.INVITE_CODE)} />
                <OptionCard emoji="\u23f3" title="I'll be added later" desc="Someone will assign me to a team" onClick={() => goTo(STEPS.PENDING)} />
              </div>
            </>
          )}

          {/* ─── STEP: Team Name ─── */}
          {step === STEPS.TEAM_NAME && (
            <>
              <MascotImage step={step} className="w-24 h-24 mb-4" />
              <h1 className="text-2xl font-bold text-center mb-1" style={{ color: BRAND.textPrimary }}>
                Name your team
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                You can add players and schedules from your dashboard.
              </p>

              <label className="block text-sm font-semibold mb-2" style={{ color: BRAND.textPrimary }}>Team Name</label>
              <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} autoFocus
                placeholder="e.g., 14U Lightning"
                className="w-full px-4 py-3 rounded-[14px] border-2 text-base font-medium outline-none transition-colors mb-6"
                style={{ borderColor: '#E2E8F0', color: BRAND.textPrimary, background: '#FAFBFC' }}
                onFocus={e => e.target.style.borderColor = BRAND.sky}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />

              {error && <ErrorMessage message={error} />}

              <PrimaryButton onClick={createIndependentTeam} disabled={!teamName.trim()} saving={saving}>
                Create Team
              </PrimaryButton>

              {meta.time && <TimeLabel time={meta.time} />}
            </>
          )}

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

              <label className="block text-sm font-semibold mb-2" style={{ color: BRAND.textPrimary }}>Invite Code</label>
              <input type="text" value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())} autoFocus
                placeholder="XXXX-XXXX"
                className="w-full px-4 py-3 rounded-[14px] border-2 text-center text-lg font-mono font-bold tracking-widest outline-none transition-colors mb-4"
                style={{ borderColor: '#E2E8F0', color: BRAND.textPrimary, background: '#FAFBFC' }}
                onFocus={e => e.target.style.borderColor = BRAND.sky}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
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
                {successContext.type === 'org' ? 'Your organization is live! \ud83c\udf89'
                  : successContext.type === 'team' ? 'Your team is ready! \ud83c\udfd0'
                  : "You're in! Welcome to the team! \ud83c\udf89"}
              </h1>
              <p className="text-center mb-6" style={{ color: BRAND.textMuted }}>
                {successContext.type === 'invite' ? `You've joined ${successContext.name}.` : `${successContext.name} has been created.`}
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
      className="w-full py-3.5 rounded-[14px] font-bold text-white text-base transition-all disabled:opacity-40"
      style={{ background: BRAND.sky, boxShadow: '0 2px 8px rgba(75,185,236,0.3)' }}>
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
      className="w-full flex items-center gap-4 p-4 rounded-[16px] border-2 text-left transition-all hover:shadow-md"
      style={{ borderColor: '#E2E8F0', background: '#FAFBFC' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND.sky; e.currentTarget.style.background = BRAND.sky + '08' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC' }}>
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
