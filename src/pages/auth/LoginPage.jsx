import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { VolleyballIcon } from '../../constants/icons'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
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
