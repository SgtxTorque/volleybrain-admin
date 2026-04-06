// =============================================================================
// PlayerLoginPage — Gamified username + PIN login for player accounts
// Dark navy theme, Lynx branding, "Enter the Den" energy
// Rate limiting: 5 failed attempts → 5 minute lockout
// =============================================================================

import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { verifyPin, deriveAuthPassword } from '../../lib/player-pass'
import { Eye, EyeOff, AlertCircle } from '../../constants/icons'

const LOCKOUT_KEY = 'lynx_player_lockout'
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 5

function getLockoutState() {
  try {
    const stored = localStorage.getItem(LOCKOUT_KEY)
    if (!stored) return { attempts: 0, lockedUntil: 0 }
    return JSON.parse(stored)
  } catch {
    return { attempts: 0, lockedUntil: 0 }
  }
}

function setLockoutState(state) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state))
}

export default function PlayerLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  const pinRefs = [useRef(), useRef(), useRef(), useRef()]
  const usernameRef = useRef()

  // Check lockout on mount and update countdown
  useEffect(() => {
    const checkLockout = () => {
      const state = getLockoutState()
      if (state.lockedUntil > Date.now()) {
        setLockoutRemaining(Math.ceil((state.lockedUntil - Date.now()) / 1000))
      } else {
        setLockoutRemaining(0)
      }
    }
    checkLockout()
    const interval = setInterval(checkLockout, 1000)
    return () => clearInterval(interval)
  }, [])

  const isLockedOut = lockoutRemaining > 0

  function handlePinChange(index, value) {
    if (!/^\d*$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus()
    }
  }

  function handlePinKeyDown(index, e) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
    if (e.key === 'Enter' && pin.every(d => d)) {
      handleLogin()
    }
  }

  async function handleLogin() {
    if (isLockedOut) return

    const pinString = pin.join('')
    if (!username.trim()) {
      setError('Enter your username!')
      usernameRef.current?.focus()
      return
    }
    if (pinString.length !== 4) {
      setError('Enter your 4-digit PIN!')
      pinRefs[pin.findIndex(d => !d) ?? 0].current?.focus()
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Find the player by username
      const { data: player, error: findError } = await supabase
        .from('players')
        .select('id, player_pin, player_account_enabled, player_username, profile_id, first_name, season_id')
        .eq('player_username', username.toLowerCase().trim())
        .eq('player_account_enabled', true)
        .maybeSingle()

      if (findError) throw findError

      if (!player) {
        setError('Username not found. Check with your parent!')
        setLoading(false)
        return
      }

      // 2. Verify PIN against stored hash
      const pinValid = await verifyPin(pinString, player.player_pin)
      if (!pinValid) {
        const state = getLockoutState()
        const newAttempts = (state.attempts || 0) + 1

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockedUntil = Date.now() + LOCKOUT_DURATION
          setLockoutState({ attempts: newAttempts, lockedUntil })
          setLockoutRemaining(Math.ceil(LOCKOUT_DURATION / 1000))
          setError('Too many wrong PINs. Try again in 5 minutes.')
        } else {
          setLockoutState({ attempts: newAttempts, lockedUntil: 0 })
          setError(`Wrong PIN. ${MAX_ATTEMPTS - newAttempts} ${MAX_ATTEMPTS - newAttempts === 1 ? 'try' : 'tries'} left.`)
        }
        setLoading(false)
        return
      }

      // 3. Reset failed attempts on success
      setLockoutState({ attempts: 0, lockedUntil: 0 })

      // 4. Sign in with Supabase auth
      const authEmail = `${player.player_username}.player@thelynxapp.com`
      const authPassword = deriveAuthPassword(pinString, player.id)

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      })

      if (signInError) {
        setError('Login failed. Try again or ask your parent for help.')
        setLoading(false)
        return
      }

      // 5. Success — redirect to dashboard
      window.location.href = '/dashboard'

    } catch (err) {
      console.error('Player login error:', err)
      setError('Something went wrong. Try again!')
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1929 0%, #10284C 50%, #162D50 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Subtle background pattern */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle at 25% 25%, #4BB9EC 1px, transparent 1px), radial-gradient(circle at 75% 75%, #4BB9EC 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, textAlign: 'center' }}>
        {/* Mascot + Logo */}
        <div style={{ marginBottom: 24 }}>
          <img
            src="/images/images/lynx-mascot.png"
            alt="Lynx mascot"
            style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}>
            Enter the Den
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Log in with your username and PIN
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '32px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {/* Error message */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              fontSize: 13, fontWeight: 600, color: '#FCA5A5',
              textAlign: 'left',
            }}>
              <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Lockout message */}
          {isLockedOut && (
            <div style={{
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 20,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FCD34D', marginBottom: 4 }}>
                Account Locked
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FBBF24', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(lockoutRemaining)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(252,211,77,0.7)', marginTop: 4 }}>
                Ask your parent if you forgot your PIN
              </div>
            </div>
          )}

          {/* Username field */}
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 8,
            }}>
              Username
            </label>
            <input
              ref={usernameRef}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="your.username"
              disabled={isLockedOut}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF', fontSize: 16, fontWeight: 600,
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                opacity: isLockedOut ? 0.4 : 1,
              }}
              onFocus={e => e.target.style.borderColor = '#4BB9EC'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') pinRefs[0].current?.focus() }}
            />
          </div>

          {/* PIN field */}
          <div style={{ marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em',
              }}>
                PIN
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', padding: '2px 4px',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 600,
                }}
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPin ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  disabled={isLockedOut}
                  style={{
                    width: 56, height: 60, textAlign: 'center',
                    fontSize: 24, fontWeight: 800,
                    borderRadius: 14,
                    background: digit ? 'rgba(75,185,236,0.15)' : 'rgba(255,255,255,0.06)',
                    border: digit ? '2px solid rgba(75,185,236,0.4)' : '1px solid rgba(255,255,255,0.12)',
                    color: '#FFFFFF', outline: 'none',
                    transition: 'all 0.2s',
                    opacity: isLockedOut ? 0.4 : 1,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#4BB9EC'; e.target.style.background = 'rgba(75,185,236,0.15)' }}
                  onBlur={e => { if (!digit) { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)' } }}
                />
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleLogin}
            disabled={loading || isLockedOut}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 14,
              background: loading || isLockedOut ? 'rgba(75,185,236,0.3)' : 'linear-gradient(135deg, #4BB9EC, #2E8BC0)',
              border: 'none', color: '#FFFFFF',
              fontSize: 16, fontWeight: 800, cursor: loading || isLockedOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading || isLockedOut ? 'none' : '0 4px 16px rgba(75,185,236,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Signing in...
              </>
            ) : (
              "Let's Go!"
            )}
          </button>
        </div>

        {/* Footer link */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Are you a parent or coach?{' '}
            <Link to="/" style={{ color: '#4BB9EC', fontWeight: 600, textDecoration: 'none' }}>
              Log in here
            </Link>
          </p>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  )
}
