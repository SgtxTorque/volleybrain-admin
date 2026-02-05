import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useJourney } from '../../contexts/JourneyContext'
import { supabase } from '../../lib/supabase'
import { 
  ChevronRight, ChevronLeft, Check, Building2, Users, Calendar, 
  DollarSign, Settings, AlertCircle
} from '../../constants/icons'
import { VolleyballIcon } from '../../constants/icons'

function SetupWizard({ onComplete }) {
  const { user, profile } = useAuth()
  const journey = useJourney()
  const tc = useThemeClasses()
  const { accent, colors } = useTheme()
  
  // Navigation state
  const [currentStep, setCurrentStep] = useState(WIZARD_STEPS.ROLE_SELECTION)
  const [history, setHistory] = useState([])
  
  // Form state
  const [selectedRoles, setSelectedRoles] = useState([])
  const [orgName, setOrgName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const navigateTo = (step) => {
    setHistory(prev => [...prev, currentStep])
    setCurrentStep(step)
    setError(null)
  }

  const goBack = () => {
    if (history.length === 0) return
    const newHistory = [...history]
    const prevStep = newHistory.pop()
    setHistory(newHistory)
    setCurrentStep(prevStep)
    setError(null)
  }

  const toggleRole = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const getProgress = () => {
    const progressMap = {
      [WIZARD_STEPS.ROLE_SELECTION]: 20,
      [WIZARD_STEPS.ORG_INFO]: 60,
      [WIZARD_STEPS.ORG_COMPLETE]: 100,
      [WIZARD_STEPS.TEAM_CONTEXT]: 40,
      [WIZARD_STEPS.INDEPENDENT_TEAM_INFO]: 60,
      [WIZARD_STEPS.INDEPENDENT_TEAM_COMPLETE]: 100,
      [WIZARD_STEPS.JOIN_ORG]: 60,
      [WIZARD_STEPS.JOIN_PENDING]: 100,
      [WIZARD_STEPS.PARENT_PLAYER_TYPE]: 40,
      [WIZARD_STEPS.AWAITING_ASSIGNMENT]: 100,
    }
    return progressMap[currentStep] || 0
  }

  // Common props for WizardContainer
  const containerProps = {
    showBack: history.length > 0,
    onBack: goBack,
    progress: getProgress(),
    error,
    colors,
    accent,
    tc,
  }

  // ============================================
  // DATABASE ACTIONS
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
        .insert({
          name: orgName,
          slug: slug,
          type: 'club',
          settings: { sports: ['volleyball'] },
        })
        .select()
        .single()

      if (orgError) throw orgError

      await supabase.from('user_roles').insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'league_admin',
        is_active: true,
      })

      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'org_director',
          organization_id: org.id,
          completed_at: new Date().toISOString(),
          completed_steps: ['create_org'], // Initialize with first step complete
          earned_badges: ['founder'], // Award the founder badge
        },
      }).eq('id', user.id)

      // Complete journey step (will be picked up after reload)
      if (journey?.completeStep) {
        journey.completeStep('create_org')
      }

      setSaving(false)
      navigateTo(WIZARD_STEPS.ORG_COMPLETE)
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
        type: 'independent_team',
        settings: { sports: ['volleyball'] },
      })
      .select()
      .single()

    if (orgError) throw orgError

    await supabase.from('user_roles').insert({
      user_id: user.id,
      organization_id: org.id,
      role: 'league_admin',
      is_active: true,
    })

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

    // Complete journey step
    if (journey?.completeStep) {
      journey.completeStep('join_create_team')
    }

    setSaving(false)
    navigateTo(WIZARD_STEPS.INDEPENDENT_TEAM_COMPLETE)
  } catch (err) {
    console.error('Error creating team:', err)
    setSaving(false)
    setError(err.message)
  }
}

  const useInviteCode = async () => {
    setSaving(true)
    setError(null)
    try {
      // Try team_invite_codes first
      const { data: invite } = await supabase
        .from('team_invite_codes')
        .select('*, teams(id, name, organization_id)')
        .eq('code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (!invite) {
        // Try account_invites
        const { data: accountInvite } = await supabase
          .from('account_invites')
          .select('*')
          .eq('invite_code', inviteCode.toUpperCase())
          .eq('status', 'pending')
          .maybeSingle()

        if (!accountInvite) {
          throw new Error('Invalid or expired invite code')
        }

        await supabase.from('account_invites')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', accountInvite.id)

        await supabase.from('user_roles').insert({
          user_id: user.id,
          organization_id: accountInvite.organization_id,
          role: accountInvite.role || 'parent',
          is_active: true,
        })

        await supabase.from('profiles').update({
          onboarding_completed: true,
          onboarding_data: {
            role: accountInvite.role || 'parent',
            organization_id: accountInvite.organization_id,
            completed_at: new Date().toISOString(),
          },
        }).eq('id', user.id)

        setSaving(false)
        navigateTo(WIZARD_STEPS.JOIN_PENDING)
        return
      }

      // Team invite found
      const orgId = invite.teams?.organization_id

      await supabase.from('user_roles').insert({
        user_id: user.id,
        organization_id: orgId,
        role: 'parent',
        is_active: true,
      })

      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'parent',
          organization_id: orgId,
          team_id: invite.team_id,
          completed_at: new Date().toISOString(),
        },
      }).eq('id', user.id)

      setSaving(false)
      navigateTo(WIZARD_STEPS.JOIN_PENDING)
    } catch (err) {
      console.error('Error using invite code:', err)
      setSaving(false)
      setError(err.message)
    }
  }

  const skipOnboarding = async () => {
    await supabase.from('profiles').update({
      onboarding_completed: true,
      onboarding_data: { skipped: true, completed_at: new Date().toISOString() },
    }).eq('id', user.id)
    onComplete()
  }

  const finishOnboarding = () => onComplete()

  // ============================================
  // RENDER SCREENS
  // ============================================

  // STEP 1: Role Selection
  if (currentStep === WIZARD_STEPS.ROLE_SELECTION) {
    const roles = [
      { id: 'org_director', icon: 'building', title: 'Organization Director', description: 'I run a club with multiple teams' },
      { id: 'team_manager', icon: 'clipboard', title: 'Team Manager / Coach', description: 'I manage or coach a team' },
      { id: 'parent', icon: '❤️', title: 'Parent / Guardian', description: 'I have a child who plays' },
      { id: 'player', icon: 'volleyball', title: 'Player', description: "I'm a player" },
    ]

    const handleContinue = () => {
      if (selectedRoles.includes('org_director')) {
        navigateTo(WIZARD_STEPS.ORG_INFO)
      } else if (selectedRoles.includes('team_manager')) {
        navigateTo(WIZARD_STEPS.TEAM_CONTEXT)
      } else {
        navigateTo(WIZARD_STEPS.PARENT_PLAYER_TYPE)
      }
    }

    return (
      <WizardContainer {...containerProps} showBack={false}>
        <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}!
        </h1>
        <p className={`${tc.textMuted} mb-8`}>What brings you to VolleyBrain?</p>

        <div className="space-y-3 mb-8">
          {roles.map(role => (
            <WizardRoleCard
              key={role.id}
              icon={role.icon}
              title={role.title}
              description={role.description}
              selected={selectedRoles.includes(role.id)}
              onToggle={() => toggleRole(role.id)}
              tc={tc}
            />
          ))}
        </div>

        <WizardPrimaryButton onClick={handleContinue} disabled={selectedRoles.length === 0} saving={saving} accent={accent}>
          Continue →
        </WizardPrimaryButton>
      </WizardContainer>
    )
  }

  // ORG DIRECTOR: Create Organization
  if (currentStep === WIZARD_STEPS.ORG_INFO) {
    return (
      <WizardContainer {...containerProps}>
        <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>Create your organization</h1>
        <p className={`${tc.textMuted} mb-8`}>You can add teams and configure settings after setup.</p>

        <WizardInputField 
          label="Organization Name" 
          value={orgName} 
          onChange={(e) => setOrgName(e.target.value)} 
          placeholder="e.g., Black Hornets Volleyball" 
          tc={tc} 
        />

        <WizardPrimaryButton onClick={createOrganization} disabled={!orgName.trim()} saving={saving} accent={accent}>
          Create Organization →
        </WizardPrimaryButton>
      </WizardContainer>
    )
  }

  // ORG DIRECTOR: Complete
  if (currentStep === WIZARD_STEPS.ORG_COMPLETE) {
    return (
      <WizardContainer {...containerProps} showBack={false}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl" style={{ backgroundColor: accent.primary }}>✓</div>
          <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>You're all set!</h1>
          <p className={`${tc.textMuted}`}>Your organization has been created.</p>
        </div>

        <WizardSummaryCard title="Organization" items={[
          { label: 'Name', value: orgName },
          { label: 'Your Role', value: 'Organization Director' },
        ]} accent={accent} tc={tc} />

        <div className="mt-8">
          <WizardPrimaryButton onClick={finishOnboarding} saving={saving} accent={accent}>
            Go to Dashboard →
          </WizardPrimaryButton>
        </div>
      </WizardContainer>
    )
  }

  // TEAM MANAGER: Choose Path
  if (currentStep === WIZARD_STEPS.TEAM_CONTEXT) {
    return (
      <WizardContainer {...containerProps}>
        <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>Your team</h1>
        <p className={`${tc.textMuted} mb-8`}>How is your team organized?</p>

        <div className="space-y-3">
          <WizardOptionCard icon="volleyball" title="Create a new team" description="I'm starting fresh or run my own team" onClick={() => navigateTo(WIZARD_STEPS.INDEPENDENT_TEAM_INFO)} tc={tc} />
          <WizardOptionCard icon="link" title="Join an existing organization" description="I have an invite code" onClick={() => navigateTo(WIZARD_STEPS.JOIN_ORG)} tc={tc} />
          <WizardOptionCard icon="clock" title="I'll be assigned later" description="Someone will add me to a team" onClick={() => navigateTo(WIZARD_STEPS.AWAITING_ASSIGNMENT)} tc={tc} />
        </div>
      </WizardContainer>
    )
  }

  // TEAM MANAGER: Create Team
  if (currentStep === WIZARD_STEPS.INDEPENDENT_TEAM_INFO) {
    return (
      <WizardContainer {...containerProps}>
        <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>Create your team</h1>
        <p className={`${tc.textMuted} mb-8`}>You can add players and configure settings after setup.</p>

        <WizardInputField 
          label="Team Name" 
          value={teamName} 
          onChange={(e) => setTeamName(e.target.value)} 
          placeholder="e.g., Dallas Elite 14U" 
          tc={tc} 
        />

        <WizardPrimaryButton onClick={createIndependentTeam} disabled={!teamName.trim()} saving={saving} accent={accent}>
          Create Team →
        </WizardPrimaryButton>
      </WizardContainer>
    )
  }

  // TEAM MANAGER: Complete
  if (currentStep === WIZARD_STEPS.INDEPENDENT_TEAM_COMPLETE) {
    return (
      <WizardContainer {...containerProps} showBack={false}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl" style={{ backgroundColor: accent.primary }}>✓</div>
          <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>Team created!</h1>
          <p className={`${tc.textMuted}`}>You can now add players and set up your season.</p>
        </div>

        <WizardSummaryCard title="Team" items={[
          { label: 'Name', value: teamName },
          { label: 'Your Role', value: 'Team Manager' },
        ]} accent={accent} tc={tc} />

        <div className="mt-8">
          <WizardPrimaryButton onClick={finishOnboarding} saving={saving} accent={accent}>
            Go to Dashboard →
          </WizardPrimaryButton>
        </div>
      </WizardContainer>
    )
  }

  // JOIN: Enter Invite Code
  if (currentStep === WIZARD_STEPS.JOIN_ORG) {
    return (
      <WizardContainer {...containerProps}>
        <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>Join your organization</h1>
        <p className={`${tc.textMuted} mb-8`}>Enter the invite code from your organization.</p>

        <WizardInputField 
          label="Invite Code" 
          value={inviteCode} 
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())} 
          placeholder="e.g., BLACKHORNETS2026" 
          tc={tc} 
        />

        <div className={`p-4 rounded-xl mb-8 ${tc.cardBgAlt}`}>
          <p className={`text-sm ${tc.textMuted}`}>💡 Ask your team manager or organization director for the invite code.</p>
        </div>

        <WizardPrimaryButton onClick={useInviteCode} disabled={!inviteCode.trim()} saving={saving} accent={accent}>
          Join →
        </WizardPrimaryButton>
      </WizardContainer>
    )
  }

  // JOIN: Success
  if (currentStep === WIZARD_STEPS.JOIN_PENDING) {
    return (
      <WizardContainer {...containerProps} showBack={false}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl" style={{ backgroundColor: accent.primary }}>✓</div>
          <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>You're in!</h1>
          <p className={`${tc.textMuted}`}>Welcome to the organization.</p>
        </div>

        <div className="mt-8">
          <WizardPrimaryButton onClick={finishOnboarding} saving={saving} accent={accent}>
            Go to Dashboard →
          </WizardPrimaryButton>
        </div>
      </WizardContainer>
    )
  }

  // AWAITING: Will be assigned later
  if (currentStep === WIZARD_STEPS.AWAITING_ASSIGNMENT) {
    return (
      <WizardContainer {...containerProps} showBack={false}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl" style={{ backgroundColor: accent.primary + '30' }}>⏳</div>
          <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>All set!</h1>
          <p className={`${tc.textMuted}`}>You'll be notified when you're assigned to a team.</p>
        </div>

        <div className="mt-8">
          <WizardPrimaryButton onClick={skipOnboarding} saving={saving} accent={accent}>
            Got it →
          </WizardPrimaryButton>
        </div>
      </WizardContainer>
    )
  }

  // PARENT/PLAYER: Choose Path
  if (currentStep === WIZARD_STEPS.PARENT_PLAYER_TYPE) {
    return (
      <WizardContainer {...containerProps}>
        <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>Getting started</h1>
        <p className={`${tc.textMuted} mb-8`}>How would you like to proceed?</p>

        <div className="space-y-3">
          <WizardOptionCard icon="link" title="I have an invite code" description="Join my team or organization" onClick={() => navigateTo(WIZARD_STEPS.JOIN_ORG)} tc={tc} />
          <WizardOptionCard icon="clock" title="Skip for now" description="I'll join a team later" onClick={skipOnboarding} tc={tc} />
        </div>
      </WizardContainer>
    )
  }

  // Fallback
  return (
    <WizardContainer {...containerProps} showBack={false}>
      <div className="text-center">
        <h1 className={`text-2xl font-bold ${tc.text} mb-4`}>Welcome to VolleyBrain!</h1>
        <WizardPrimaryButton onClick={skipOnboarding} saving={saving} accent={accent}>
          Continue →
        </WizardPrimaryButton>
      </div>
    </WizardContainer>
  )
}

// ============================================

export { SetupWizard }
