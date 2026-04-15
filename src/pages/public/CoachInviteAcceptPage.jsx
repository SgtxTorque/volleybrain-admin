// =============================================================================
// CoachInviteAcceptPage — Public page for accepting coach invitations
// =============================================================================
// URL: /invite/coach/:inviteCode
// Flow: Load invite details → Show org branding + role/team info →
//       Accept (if logged in) OR Sign Up / Log In (if not)

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrgLogo from '../../components/OrgLogo'
import { acceptInvitation as acceptInvitationRecord } from '../../lib/invite-utils'

const ROLE_LABELS = {
  head: 'Head Coach', assistant: 'Assistant Coach', manager: 'Manager', volunteer: 'Volunteer'
}

export default function CoachInviteAcceptPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()

  const [invite, setInvite] = useState(null)
  const [orgInfo, setOrgInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Auth mode: null (choose), 'signup', 'login'
  const [mode, setMode] = useState(null)
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formConfirm, setFormConfirm] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [warning, setWarning] = useState(null)

  // Force light theme on public route
  useEffect(() => {
    document.body.classList.add('public-route')
    return () => document.body.classList.remove('public-route')
  }, [])

  useEffect(() => {
    loadInvite()
    checkSession()
  }, [inviteCode])

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    setCurrentUser(session?.user || null)
  }

  async function loadInvite() {
    setLoading(true)
    try {
      const { data: coach, error: fetchError } = await supabase
        .from('coaches')
        .select('*, team_coaches(team_id, role, teams(id, name, color))')
        .eq('invite_code', inviteCode)
        .eq('invite_status', 'invited')
        .maybeSingle()

      if (fetchError || !coach) {
        setError('This invitation is no longer valid. It may have expired or already been accepted.')
        setLoading(false)
        return
      }

      // Fetch org info via season
      let org = null
      if (coach.season_id) {
        const { data: season } = await supabase
          .from('seasons')
          .select('name, organization_id, organizations(name, logo_url, slug, primary_color)')
          .eq('id', coach.season_id)
          .single()
        if (season) {
          coach._season = season
          org = season.organizations
        }
      }

      // Fallback: if season_id is null, resolve org from team_coaches → teams → seasons
      if (!coach._season && coach.team_coaches?.length > 0) {
        const teamId = coach.team_coaches[0].teams?.id || coach.team_coaches[0].team_id
        if (teamId) {
          const { data: teamSeason } = await supabase
            .from('teams')
            .select('season_id, seasons(organization_id, name, organizations(id, name, slug, logo_url, primary_color))')
            .eq('id', teamId)
            .single()
          if (teamSeason?.seasons) {
            coach._season = teamSeason.seasons
            org = teamSeason.seasons.organizations
          }
        }
      }

      // Fallback 2: check invitations table for org (has organization_id directly)
      if (!org) {
        const { data: inviteRecord } = await supabase
          .from('invitations')
          .select('organization_id, organizations(id, name, slug, logo_url, primary_color)')
          .eq('coach_id', coach.id)
          .maybeSingle()
        if (inviteRecord?.organizations) {
          org = inviteRecord.organizations
          if (!coach._season) {
            coach._season = { organization_id: inviteRecord.organization_id }
          }
        }
      }

      // Check invitations table for expiration
      const { data: invitation } = await supabase
        .from('invitations')
        .select('expires_at, status')
        .eq('coach_id', coach.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (invitation?.expires_at && new Date(invitation.expires_at) < new Date()) {
        setError('This invitation has expired. Please ask the admin to send a new one.')
        setLoading(false)
        return
      }

      setInvite(coach)
      setOrgInfo(org)
      setFormEmail(coach.invite_email || '')
    } catch (err) {
      setError('Something went wrong loading this invitation.')
    }
    setLoading(false)
  }

  function checkEmailMismatch(userEmail) {
    const inviteEmail = invite.invite_email?.toLowerCase()
    if (userEmail.toLowerCase() !== inviteEmail) {
      setWarning(`This invitation was sent to ${invite.invite_email}. You're accepting with ${userEmail}.`)
    }
  }

  async function acceptInvite(userId, userEmail) {
    // Check email mismatch
    checkEmailMismatch(userEmail)

    // Link the coach record to the user
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        profile_id: userId,
        invite_status: 'active',
        invite_accepted_at: new Date().toISOString(),
        email: userEmail || invite.invite_email,
      })
      .eq('id', invite.id)

    if (updateError) throw updateError

    // Mark invitation as accepted in invitations table (non-critical)
    try {
      const { data: invitation } = await supabase
        .from('invitations')
        .select('invite_code')
        .eq('coach_id', invite.id)
        .eq('status', 'pending')
        .maybeSingle()
      if (invitation?.invite_code) {
        await acceptInvitationRecord(invitation.invite_code, userId)
      }
    } catch {
      // Non-critical
    }

    // Resolve orgId from multiple sources (season_id may be null)
    let orgId = invite._season?.organization_id

    // Fallback 1: check invitations table (has organization_id directly)
    if (!orgId) {
      const { data: linkedInvitation } = await supabase
        .from('invitations')
        .select('organization_id')
        .eq('coach_id', invite.id)
        .maybeSingle()
      if (linkedInvitation?.organization_id) {
        orgId = linkedInvitation.organization_id
      }
    }

    // Fallback 2: resolve from team_coaches → teams → seasons → organizations
    if (!orgId && invite.team_coaches?.length > 0) {
      const teamId = invite.team_coaches[0].team_id
      if (teamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('season_id, seasons(organization_id)')
          .eq('id', teamId)
          .single()
        if (teamData?.seasons?.organization_id) {
          orgId = teamData.seasons.organization_id
        }
      }
    }

    // Map team_coaches role to user_roles constraint value
    const teamRole = invite.team_coaches?.[0]?.role || 'head'
    const roleMap = {
      'head': 'head_coach',
      'head_coach': 'head_coach',
      'assistant': 'assistant_coach',
      'assistant_coach': 'assistant_coach',
      'manager': 'team_manager',
      'team_manager': 'team_manager',
      'volunteer': 'assistant_coach',
    }
    const userRole = roleMap[teamRole] || 'head_coach'

    // Add coach role to user_roles and update profile (only if orgId resolved)
    if (orgId) {
      await supabase.from('user_roles').upsert({
        user_id: userId,
        organization_id: orgId,
        role: userRole,
        is_active: true,
      }, { onConflict: 'user_id,organization_id,role' })

      await supabase.from('profiles').update({
        current_organization_id: orgId,
        onboarding_completed: true,
      }).eq('id', userId)
    } else {
      console.error('Could not resolve organization ID for coach invite:', invite.id)
    }

    return orgId
  }

  // Verify profile writes committed, then redirect
  async function verifyAndRedirect(userId, orgId) {
    // Wait for DB writes to propagate
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify the profile was written correctly
    const { data: verifyProfile } = await supabase
      .from('profiles')
      .select('onboarding_completed, current_organization_id')
      .eq('id', userId)
      .single()

    if (!verifyProfile?.onboarding_completed) {
      // Force it again if the first write didn't stick
      await supabase.from('profiles').update({
        onboarding_completed: true,
        current_organization_id: orgId,
      }).eq('id', userId)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Clear stale view so loadRoleContext sets the correct one for the new org
    localStorage.removeItem('lynx_active_view')

    setAccepted(true)
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1500)
  }

  async function handleAccept() {
    setProcessing(true)
    setError(null)
    try {
      const orgId = await acceptInvite(currentUser.id, currentUser.email)
      await verifyAndRedirect(currentUser.id, orgId)
    } catch (err) {
      setError('Error accepting invitation: ' + err.message)
    }
    setProcessing(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (formPassword !== formConfirm) {
      setError('Passwords do not match')
      return
    }
    if (formPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setProcessing(true)
    setError(null)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          data: { full_name: `${invite.first_name} ${invite.last_name}` }
        }
      })
      if (signUpError) throw signUpError

      if (authData.user) {
        // Create/update profile (orgId will be corrected by acceptInvite if needed)
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: formEmail,
          full_name: `${invite.first_name} ${invite.last_name}`,
          phone: formPhone || null,
          current_organization_id: invite._season?.organization_id || null,
          onboarding_completed: true,
        })

        const orgId = await acceptInvite(authData.user.id, formEmail)

        // Ensure we're signed in (signUp may not auto-login if email confirmation is on)
        await supabase.auth.signInWithPassword({ email: formEmail, password: formPassword })

        await verifyAndRedirect(authData.user.id, orgId)
      }
    } catch (err) {
      setError(err.message)
    }
    setProcessing(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setProcessing(true)
    setError(null)
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formEmail,
        password: formPassword,
      })
      if (loginError) throw loginError

      if (data.user) {
        const orgId = await acceptInvite(data.user.id, data.user.email)
        await verifyAndRedirect(data.user.id, orgId)
      }
    } catch (err) {
      setError(err.message)
    }
    setProcessing(false)
  }

  // ── Styles ──
  const headerColor = orgInfo?.primary_color || '#10284C'
  const teamName = invite?.team_coaches?.[0]?.teams?.name
  const teamColor = invite?.team_coaches?.[0]?.teams?.color
  const seasonName = invite?._season?.name

  const inputCls = 'w-full rounded-xl px-4 py-3 text-sm border border-slate-200 bg-white text-[#10284C] placeholder-slate-400 outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/20 transition'
  const btnPrimary = 'w-full py-3.5 rounded-xl bg-[#10284C] text-white font-bold text-sm hover:bg-[#1a3a6b] transition disabled:opacity-50 disabled:cursor-not-allowed'
  const btnSecondary = 'flex-1 py-3 rounded-xl border-2 border-slate-200 text-[#10284C] font-bold text-sm hover:border-[#4BB9EC] hover:bg-[#4BB9EC]/5 transition'

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#4BB9EC] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4 text-sm">Loading your invitation...</p>
        </div>
      </div>
    )
  }

  // ── Error (no invite) ──
  if (error && !invite) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#10284C] mb-2">Invitation Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl bg-[#10284C] text-white font-bold text-sm hover:bg-[#1a3a6b] transition"
          >
            Go to Lynx
          </button>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (accepted) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#10284C] mb-2">You're In!</h2>
          <p className="text-slate-500 text-sm">Welcome to the team. Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // ── Main invite page ──
  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* Header */}
      <div className="w-full" style={{ background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%)` }}>
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          <div className="flex justify-center mb-4">
            <OrgLogo org={orgInfo || {}} size={56} />
          </div>
          <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">
            {orgInfo?.name || 'Lynx'}
          </p>
          <h1 className="text-2xl font-black text-white">
            You're Invited to Coach!
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Invite Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Invitation</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Name</span>
              <span className="text-sm font-bold text-[#10284C]">{invite.first_name} {invite.last_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-bold text-[#4BB9EC]">
                {ROLE_LABELS[invite.role] || invite.role || 'Coach'}
              </span>
            </div>
            {teamName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Team</span>
                <span className="text-sm font-bold" style={{ color: teamColor || '#10284C' }}>
                  {teamName}
                </span>
              </div>
            )}
            {seasonName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Season</span>
                <span className="text-sm font-bold text-[#10284C]">{seasonName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Warning alert */}
        {warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-700">{warning}</p>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {currentUser ? (
            // Logged in → Accept directly
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-4">
                You're signed in as <strong className="text-[#10284C]">{currentUser.email}</strong>.
                Ready to join?
              </p>
              <button onClick={handleAccept} disabled={processing} className={btnPrimary}>
                {processing ? 'Joining...' : 'Accept & Join Team'}
              </button>
            </div>
          ) : mode === null ? (
            // Choose: sign up or log in
            <div>
              <p className="text-sm text-slate-500 text-center mb-5">
                Create an account or sign in to accept this invitation.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setMode('signup')} className={btnSecondary}>
                  I'm New — Sign Me Up
                </button>
                <button onClick={() => setMode('login')} className={btnSecondary}>
                  I Have an Account
                </button>
              </div>
            </div>
          ) : mode === 'signup' ? (
            // Sign Up form
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#10284C]">Create Your Account</h3>
                <button type="button" onClick={() => { setMode(null); setError(null) }} className="text-xs text-[#4BB9EC] font-bold">
                  Back
                </button>
              </div>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="Email address"
                required
                className={inputCls}
              />
              <input
                type="password"
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder="Password (6+ characters)"
                required
                minLength={6}
                className={inputCls}
              />
              <input
                type="password"
                value={formConfirm}
                onChange={e => setFormConfirm(e.target.value)}
                placeholder="Confirm password"
                required
                className={inputCls}
              />
              <input
                type="tel"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className={inputCls}
              />
              <button type="submit" disabled={processing} className={btnPrimary}>
                {processing ? 'Creating Account...' : 'Sign Up & Accept Invitation'}
              </button>
            </form>
          ) : (
            // Login form
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#10284C]">Sign In</h3>
                <button type="button" onClick={() => { setMode(null); setError(null) }} className="text-xs text-[#4BB9EC] font-bold">
                  Back
                </button>
              </div>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="Email address"
                required
                className={inputCls}
              />
              <input
                type="password"
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder="Password"
                required
                className={inputCls}
              />
              <button type="submit" disabled={processing} className={btnPrimary}>
                {processing ? 'Signing In...' : 'Sign In & Accept Invitation'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 mb-8">
          Powered by <span className="font-bold">Lynx</span> — Youth sports, organized.
        </p>
      </div>
    </div>
  )
}
