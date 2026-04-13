import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

import { supabase } from '../../lib/supabase'
import { isFeatureEnabled } from '../../config/feature-flags'
import { generateInviteToken } from '../../lib/invite-utils'

/* ─── SVG brand logos ─── */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function AppleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

export function LoginPage({ initialMode, onBack }) {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const [mode, setMode] = useState(initialMode || 'login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetSending, setResetSending] = useState(false)

  // Recovery state for parents/coaches with records but no auth account
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryType, setRecoveryType] = useState('') // 'parent' or 'coach'
  const [recoveryName, setRecoveryName] = useState('')
  const [recoveryInviteCode, setRecoveryInviteCode] = useState('')
  const [recoveryOrgId, setRecoveryOrgId] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)

  // Check for auth error in URL hash (e.g., expired OTP from password reset link)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied')) {
      setError('This password reset link has expired. Please request a new one.')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, firstName, lastName)
        setMessage('Account created! You can now continue.')
      }
    } catch (err) {
      // On login failure, check if this person has a record but no auth account
      if (mode === 'login' && err.message?.includes('Invalid login credentials')) {
        try {
          // CHECK 1: Parent with a family record but no auth
          const { data: familyMatch } = await supabase
            .from('families')
            .select('id, primary_email, primary_contact_name, organization_id')
            .eq('primary_email', email.trim().toLowerCase())
            .maybeSingle()

          if (familyMatch) {
            // Verify they truly have no auth account (profiles table)
            const { data: profileMatch } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', email.trim().toLowerCase())
              .maybeSingle()

            if (!profileMatch) {
              setError('')
              setRecoveryType('parent')
              setRecoveryName(familyMatch.primary_contact_name || email.trim())
              setRecoveryOrgId(familyMatch.organization_id || '')
              setShowRecovery(true)
              setLoading(false)
              return
            }
          }

          // CHECK 2: Coach with an invite but no auth
          const { data: coachMatch } = await supabase
            .from('coaches')
            .select('id, email, invite_code, invite_status, season_id')
            .eq('email', email.trim().toLowerCase())
            .eq('invite_status', 'invited')
            .order('invited_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (coachMatch) {
            setError('')
            setRecoveryType('coach')
            setRecoveryName(email.trim())
            setRecoveryInviteCode(coachMatch.invite_code || '')
            setShowRecovery(true)
            setLoading(false)
            return
          }

          // CHECK 3: Coach in coaches table without pending invite (active but no auth)
          const { data: activeCoach } = await supabase
            .from('coaches')
            .select('id, email, season_id')
            .eq('email', email.trim().toLowerCase())
            .limit(1)
            .maybeSingle()

          if (activeCoach) {
            // Look up org from the season
            let orgId = ''
            if (activeCoach.season_id) {
              const { data: season } = await supabase
                .from('seasons')
                .select('organization_id')
                .eq('id', activeCoach.season_id)
                .maybeSingle()
              orgId = season?.organization_id || ''
            }

            // Check if they have no profile
            const { data: coachProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', email.trim().toLowerCase())
              .maybeSingle()

            if (!coachProfile) {
              setError('')
              setRecoveryType('coach')
              setRecoveryName(email.trim())
              setRecoveryOrgId(orgId)
              setShowRecovery(true)
              setLoading(false)
              return
            }
          }
        } catch (checkErr) {
          console.error('Recovery check failed:', checkErr)
        }
      }

      setError(err.message)
    }
    setLoading(false)
  }

  async function handleRecoveryAction() {
    try {
      setRecoveryLoading(true)

      if (recoveryType === 'parent') {
        // Look for an existing parent invite
        const { data: invite } = await supabase
          .from('invitations')
          .select('invite_code')
          .eq('email', email.trim().toLowerCase())
          .eq('invite_type', 'parent')
          .eq('status', 'pending')
          .order('invited_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (invite?.invite_code) {
          window.location.href = `/invite/parent/${invite.invite_code}`
          return
        }

        // No existing invite — create one on the fly
        const { data: family } = await supabase
          .from('families')
          .select('id, organization_id')
          .eq('primary_email', email.trim().toLowerCase())
          .maybeSingle()

        if (family?.organization_id) {
          const inviteCode = generateInviteToken()
          const { error: inviteError } = await supabase
            .from('invitations')
            .insert({
              email: email.trim().toLowerCase(),
              invite_type: 'parent',
              role: 'parent',
              invite_code: inviteCode,
              organization_id: family.organization_id,
              status: 'pending',
              invited_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
            })

          if (!inviteError) {
            window.location.href = `/invite/parent/${inviteCode}`
            return
          }
        }

        setError('We found your registration but couldn\'t set up your account. Please contact your club administrator.')

      } else if (recoveryType === 'coach') {
        if (recoveryInviteCode) {
          window.location.href = `/invite/coach/${recoveryInviteCode}`
        } else if (recoveryOrgId) {
          window.location.href = `/join/coach/${recoveryOrgId}`
        } else {
          setError('We found your coaching record but couldn\'t locate your invitation. Please ask your club administrator to resend your invite.')
        }
      }
    } catch (err) {
      console.error('Recovery action error:', err)
      setError('Something went wrong. Please try again or contact your club administrator.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  function clearRecovery() {
    setShowRecovery(false)
    setRecoveryType('')
    setRecoveryName('')
    setRecoveryInviteCode('')
    setRecoveryOrgId('')
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Please enter your email address first')
      return
    }
    setResetSending(true)
    setError('')
    setMessage('')
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (resetError) throw resetError
      setMessage('Password reset link sent! Check your email.')
    } catch (err) {
      setError(err.message)
    }
    setResetSending(false)
  }

  async function handleGoogleLogin() {
    setError('')
    setOauthLoading('google')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
      setOauthLoading('')
    }
  }

  async function handleAppleLogin() {
    setError('')
    setOauthLoading('apple')
    try {
      await signInWithApple()
    } catch (err) {
      setError(err.message)
      setOauthLoading('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #162D50 100%)' }}>
      <div className="w-full max-w-md">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back
          </button>
        )}

        <div className="text-center mb-8">
          <img src="/lynx-icon-logo.png" alt="Lynx" className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_4px_12px_rgba(75,185,236,0.3)]" />
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--v2-font)' }}>Lynx</h1>
          <p className="text-slate-400 mt-2">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {/* Toggle between Login and Sign Up */}
        <div className="flex mb-6 bg-white/[0.06] rounded-xl p-1">
          <button
            onClick={() => { setMode('login'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${
              mode === 'login'
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${
              mode === 'signup'
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 text-emerald-400 text-sm">
              {message}
            </div>
          )}

          {/* ─── Social / OAuth Buttons ─── */}
          {(isFeatureEnabled('googleOAuth') || isFeatureEnabled('appleOAuth')) && (
            <div className="space-y-3 mb-6">
              {isFeatureEnabled('googleOAuth') && (
                <button
                  onClick={handleGoogleLogin}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-[#10284C] font-bold py-3 rounded-xl border border-[#E8ECF2] hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <GoogleLogo />
                  {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
                </button>
              )}
              {isFeatureEnabled('appleOAuth') && (
                <button
                  onClick={handleAppleLogin}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-3 rounded-xl hover:bg-slate-950 transition border border-white/[0.12] disabled:opacity-50"
                >
                  <AppleLogo />
                  {oauthLoading === 'apple' ? 'Redirecting...' : 'Continue with Apple'}
                </button>
              )}
            </div>
          )}

          {/* ─── Divider (only shown when OAuth buttons are visible) ─── */}
          {(isFeatureEnabled('googleOAuth') || isFeatureEnabled('appleOAuth')) && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-xs text-slate-500 uppercase tracking-wider whitespace-nowrap">or continue with email</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 focus:outline-none transition"
                    placeholder="First"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 focus:outline-none transition"
                    placeholder="Last"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearRecovery() }}
                required
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 focus:outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 6 : undefined}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 focus:outline-none transition"
                placeholder="••••••••"
              />
              {mode === 'signup' && (
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              )}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetSending}
                  className="text-sm text-slate-400 hover:text-[#4BB9EC] transition cursor-pointer mt-1 disabled:opacity-50"
                >
                  {resetSending ? 'Sending...' : 'Forgot password?'}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lynx-navy-subtle text-white font-bold py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50"
              style={{ fontFamily: 'var(--v2-font)' }}
            >
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          {/* Recovery card for parents/coaches with records but no auth */}
          {showRecovery && (
            <div className="mt-4 p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  {recoveryType === 'parent' ? (
                    <>
                      <p className="text-sm font-medium text-sky-300">
                        We found a registration for {recoveryName}!
                      </p>
                      <p className="text-sm text-sky-400/80 mt-1">
                        It looks like your account hasn't been set up yet.
                        Click below to create your password and access your dashboard.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-sky-300">
                        We found a coaching invitation for {recoveryName}!
                      </p>
                      <p className="text-sm text-sky-400/80 mt-1">
                        Your club invited you as a coach but your account hasn't been set up yet.
                        Click below to accept your invitation and get started.
                      </p>
                    </>
                  )}
                  <button
                    onClick={handleRecoveryAction}
                    disabled={recoveryLoading}
                    className="mt-3 px-4 py-2 bg-[#4BB9EC] text-white text-sm font-semibold rounded-xl hover:bg-[#3a9fd4] transition-colors disabled:opacity-50"
                  >
                    {recoveryLoading
                      ? 'Loading...'
                      : (recoveryType === 'parent' ? 'Set Up My Account' : 'Accept My Invitation')
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          {mode === 'login'
            ? "Don't have an account? "
            : "Already have an account? "
          }
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
            className="text-[#4BB9EC] hover:underline font-semibold"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm mb-2">Looking for a league?</p>
          <a
            href="/directory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#4BB9EC] transition hover:brightness-110"
          >
            Browse Organizations
          </a>
        </div>
        <div className="text-center mt-6 pb-4">
          <a href="/privacy-policy" className="text-slate-500 hover:text-slate-300 text-xs transition">Privacy Policy</a>
          <span className="text-slate-600 mx-2">·</span>
          <a href="/terms" className="text-slate-500 hover:text-slate-300 text-xs transition">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
