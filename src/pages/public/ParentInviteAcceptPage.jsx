// =============================================================================
// ParentInviteAcceptPage — Public page for accepting parent invitations
// =============================================================================
// URL: /invite/parent/:inviteCode
// Flow: Validate invite → Show org branding + child info →
//       Accept (if logged in) OR Sign Up / Log In (if not)
// Cloned from CoachInviteAcceptPage with parent-specific logic.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import OrgLogo from '../../components/OrgLogo'
import { supabase } from '../../lib/supabase'
import { validateInvitation, acceptInvitation, grantRole } from '../../lib/invite-utils'

export default function ParentInviteAcceptPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()

  const [invite, setInvite] = useState(null)
  const [orgInfo, setOrgInfo] = useState(null)
  const [childNames, setChildNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Auth mode: null (choose), 'signup', 'login'
  const [mode, setMode] = useState(null)
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formConfirm, setFormConfirm] = useState('')
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [accepted, setAccepted] = useState(false)

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
      const result = await validateInvitation(inviteCode)

      if (!result.valid) {
        setError(result.reason)
        setLoading(false)
        return
      }

      const inv = result.invite
      setInvite(inv)
      setOrgInfo(inv.organizations || null)
      setFormEmail(inv.email || '')

      // Load child names from metadata playerIds
      const playerIds = inv.metadata?.playerIds || []
      if (playerIds.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('first_name, last_name')
          .in('id', playerIds)
        if (players?.length) {
          setChildNames(players.map(p => `${p.first_name} ${p.last_name}`))
        }
      }
    } catch (err) {
      setError('Something went wrong loading this invitation.')
    }
    setLoading(false)
  }

  async function linkPlayersAndFamily(userId) {
    // Link players to parent account
    const playerIds = invite.metadata?.playerIds || []
    if (playerIds.length > 0) {
      await supabase.from('players')
        .update({ parent_account_id: userId })
        .in('id', playerIds)
        .is('parent_account_id', null)
    }

    // Link family record if it exists for this email + org
    await supabase.from('families')
      .update({ account_id: userId })
      .eq('primary_email', invite.email)
      .eq('organization_id', invite.organization_id)
      .is('account_id', null)

    // Grant parent role
    const orgId = invite.organization_id
    if (orgId) {
      await grantRole(userId, orgId, 'parent')

      // Set current org + complete onboarding
      await supabase.from('profiles').update({
        current_organization_id: orgId,
        onboarding_completed: true,
      }).eq('id', userId)
    }

    // Accept the invitation atomically
    await acceptInvitation(inviteCode, userId)
  }

  // Verify profile writes committed, then redirect
  async function verifyAndRedirect(userId) {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const orgId = invite.organization_id
    const { data: verifyProfile } = await supabase
      .from('profiles')
      .select('onboarding_completed, current_organization_id')
      .eq('id', userId)
      .single()

    if (!verifyProfile?.onboarding_completed) {
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

  function checkEmailMismatch(userEmail) {
    const inviteEmail = invite.email?.toLowerCase()
    if (userEmail.toLowerCase() !== inviteEmail) {
      setWarning(`This invitation was sent to ${invite.email}. You're accepting with ${userEmail}.`)
    }
  }

  async function handleAccept() {
    setProcessing(true)
    setError(null)
    try {
      checkEmailMismatch(currentUser.email)
      await linkPlayersAndFamily(currentUser.id)
      await verifyAndRedirect(currentUser.id)
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
    if (!formName.trim()) {
      setError('Please enter your full name')
      return
    }

    setProcessing(true)
    setError(null)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          data: { full_name: formName.trim() }
        }
      })
      if (signUpError) throw signUpError

      if (authData.user) {
        const orgId = invite.organization_id || null

        // Create/update profile
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: formEmail,
          full_name: formName.trim(),
          phone: formPhone || null,
          current_organization_id: orgId,
          onboarding_completed: true,
        })

        checkEmailMismatch(formEmail)
        await linkPlayersAndFamily(authData.user.id)

        // Ensure we're signed in (signUp may not auto-login if email confirmation is on)
        await supabase.auth.signInWithPassword({ email: formEmail, password: formPassword })

        await verifyAndRedirect(authData.user.id)
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
        checkEmailMismatch(data.user.email)
        await linkPlayersAndFamily(data.user.id)
        await verifyAndRedirect(data.user.id)
      }
    } catch (err) {
      setError(err.message)
    }
    setProcessing(false)
  }

  // ── Styles ──
  const headerColor = orgInfo?.primary_color || '#10284C'
  const seasonName = invite?.metadata?.seasonName

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
          <h2 className="text-xl font-bold text-[#10284C] mb-2">You're All Set!</h2>
          <p className="text-slate-500 text-sm">Your account is ready. Redirecting to your dashboard...</p>
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
            Welcome, Parent!
          </h1>
          {childNames.length > 0 && (
            <p className="text-white/80 text-sm mt-2">
              Set up your account to track {childNames.join(' & ')}'s season.
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Invite Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Account</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-bold text-[#10284C]">{invite.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-bold text-[#4BB9EC]">Parent</span>
            </div>
            {childNames.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{childNames.length === 1 ? 'Child' : 'Children'}</span>
                <span className="text-sm font-bold text-[#10284C]">{childNames.join(', ')}</span>
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
                Ready to link your children?
              </p>
              <button onClick={handleAccept} disabled={processing} className={btnPrimary}>
                {processing ? 'Linking...' : 'Link My Children'}
              </button>
            </div>
          ) : mode === null ? (
            // Choose: sign up or log in
            <div>
              <p className="text-sm text-slate-500 text-center mb-5">
                Create an account to track schedules, payments, and achievements.
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
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Full name *"
                required
                className={inputCls}
              />
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
                {processing ? 'Creating Account...' : 'Sign Up & Link Children'}
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
                {processing ? 'Signing In...' : 'Sign In & Link Children'}
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
