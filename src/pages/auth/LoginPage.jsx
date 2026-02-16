import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { VolleyballIcon } from '../../constants/icons'

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

export function LoginPage() {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
      setError(err.message)
    }
    setLoading(false)
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4"><VolleyballIcon className="w-16 h-16" /></div>
          <h1 className="text-3xl font-bold text-white">VolleyBrain</h1>
          <p className="text-slate-400 mt-2">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {/* Toggle between Login and Sign Up */}
        <div className="flex mb-6 bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => { setMode('login'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${
              mode === 'login'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${
              mode === 'signup'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
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
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-semibold py-3 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
            >
              <GoogleLogo />
              {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
            </button>
            <button
              onClick={handleAppleLogin}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold py-3 rounded-xl hover:bg-slate-950 transition border border-slate-600 disabled:opacity-50"
            >
              <AppleLogo />
              {oauthLoading === 'apple' ? 'Redirecting...' : 'Continue with Apple'}
            </button>
          </div>

          {/* ─── Divider ─── */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-wider whitespace-nowrap">or continue with email</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)]/50 focus:outline-none"
                    placeholder="First"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)]/50 focus:outline-none"
                    placeholder="Last"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)]/50 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 6 : undefined}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)]/50 focus:outline-none"
                placeholder="••••••••"
              />
              {mode === 'signup' && (
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-white font-semibold py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50"
            >
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          {mode === 'login'
            ? "Don't have an account? "
            : "Already have an account? "
          }
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
            className="text-[var(--accent-primary)] hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm mb-2">Looking for a league?</p>
          <a
            href="/directory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black transition hover:opacity-90"
            style={{ background: '#EAB308' }}
          >
            Browse Organizations
          </a>
        </div>
      </div>
    </div>
  )
}
