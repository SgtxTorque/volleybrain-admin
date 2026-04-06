// =============================================================================
// CreatePlayerPassModal — Parent creates username + PIN for child's Player Pass
// COPPA: Parental consent captured via checkboxes before submission
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Check, AlertCircle, Copy, Zap, Eye, EyeOff } from '../../constants/icons'
import {
  suggestUsername, validateUsername, validatePin,
  checkUsernameAvailable, createPlayerPass,
} from '../../lib/player-pass'

export default function CreatePlayerPassModal({ player, seasonId, organizationId, parentProfileId, onClose, onSuccess, showToast }) {
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null) // 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameError, setUsernameError] = useState(null)

  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [showPin, setShowPin] = useState(false)
  const [pinError, setPinError] = useState(null)

  const [consent1, setConsent1] = useState(false)
  const [consent2, setConsent2] = useState(false)
  const [consent3, setConsent3] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const pinRefs = [useRef(), useRef(), useRef(), useRef()]
  const confirmPinRefs = [useRef(), useRef(), useRef(), useRef()]
  const debounceRef = useRef(null)

  const playerName = `${player.first_name || player.firstName || ''} ${player.last_name || player.lastName || ''}`.trim()

  // Auto-suggest username on mount
  useEffect(() => {
    const suggested = suggestUsername(
      player.first_name || player.firstName,
      player.last_name || player.lastName
    )
    setUsername(suggested)
  }, [player])

  // Debounced username availability check
  useEffect(() => {
    if (!username) { setUsernameStatus(null); return }

    const validationError = validateUsername(username.toLowerCase())
    if (validationError) {
      setUsernameStatus('invalid')
      setUsernameError(validationError)
      return
    }

    setUsernameStatus('checking')
    setUsernameError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username.toLowerCase(), seasonId, player.id)
        setUsernameStatus(available ? 'available' : 'taken')
        setUsernameError(available ? null : 'Username is taken — try another')
      } catch {
        setUsernameStatus(null)
      }
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [username, seasonId, player.id])

  // PIN input handler (auto-advance)
  const handlePinInput = useCallback((index, value, isConfirm = false) => {
    if (!/^\d?$/.test(value)) return
    const arr = isConfirm ? [...confirmPin] : [...pin]
    arr[index] = value
    isConfirm ? setConfirmPin(arr) : setPin(arr)
    setPinError(null)

    // Auto-advance to next input
    if (value && index < 3) {
      const refs = isConfirm ? confirmPinRefs : pinRefs
      refs[index + 1].current?.focus()
    }
  }, [pin, confirmPin])

  // PIN backspace handler
  const handlePinKeyDown = useCallback((index, e, isConfirm = false) => {
    if (e.key === 'Backspace') {
      const arr = isConfirm ? [...confirmPin] : [...pin]
      if (!arr[index] && index > 0) {
        const refs = isConfirm ? confirmPinRefs : pinRefs
        refs[index - 1].current?.focus()
      }
    }
  }, [pin, confirmPin])

  const pinString = pin.join('')
  const confirmPinString = confirmPin.join('')
  const allConsented = consent1 && consent2 && consent3
  const canSubmit = usernameStatus === 'available' && pinString.length === 4 && confirmPinString.length === 4 && allConsented && !submitting

  async function handleSubmit() {
    setError(null)
    setPinError(null)

    // Validate PIN
    const pinValidation = validatePin(pinString)
    if (pinValidation) { setPinError(pinValidation); return }

    // Check PINs match
    if (pinString !== confirmPinString) { setPinError('PINs do not match'); return }

    setSubmitting(true)
    try {
      const result = await createPlayerPass({
        playerId: player.id,
        playerName,
        username: username.toLowerCase(),
        pin: pinString,
        seasonId,
        organizationId,
        parentProfileId,
      })

      setSuccess(result)
      onSuccess?.(result)
    } catch (err) {
      setError(err.message || 'Failed to create Player Pass')
    }
    setSubmitting(false)
  }

  function copyLoginInfo() {
    const text = `${playerName}'s Lynx Player Login\nUsername: ${success.username}\nPIN: (ask your parent)\nLogin: ${window.location.origin}/player-login`
    navigator.clipboard.writeText(text)
    showToast?.('Login info copied!')
  }

  // ── PIN Input Component ──
  const PinInputGroup = ({ values, onChange, onKeyDown, refs, label }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        {values.map((digit, i) => (
          <input
            key={i}
            ref={refs[i]}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => onChange(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            style={{
              width: 48, height: 52, textAlign: 'center',
              fontSize: 20, fontWeight: 700,
              borderRadius: 10,
              border: pinError ? '2px solid #EF4444' : '1px solid #E2E8F0',
              background: '#FFFFFF', color: '#10284C',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#4BB9EC'}
            onBlur={e => { if (!pinError) e.target.style.borderColor = '#E2E8F0' }}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          style={{ padding: '0 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
        >
          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  // ── Success State ──
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div style={{ maxWidth: 440, width: '100%', background: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check className="w-7 h-7 text-white" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Player Login Created!</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{playerName} can now log in</p>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Username</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#10284C' }}>{success.username}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 12, marginBottom: 4 }}>Login URL</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4BB9EC' }}>{window.location.origin}/player-login</div>
            </div>

            <button
              onClick={copyLoginInfo}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                background: '#F1F5F9', border: '1px solid #E2E8F0',
                color: '#10284C', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginBottom: 12,
              }}
            >
              <Copy className="w-4 h-4" /> Copy Login Info
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                background: '#10284C', border: 'none',
                color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Form ──
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div style={{ maxWidth: 440, width: '100%', maxHeight: '90vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#10284C', margin: 0 }}>Create Player Login</h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>for {playerName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>
            Give {player.first_name || player.firstName} their own login to access their player dashboard, badges, stats, and more.
          </p>

          {/* Username */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', marginBottom: 6 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                placeholder="e.g., maya.johnson"
                style={{
                  width: '100%', padding: '10px 40px 10px 12px', borderRadius: 10,
                  border: usernameStatus === 'taken' || usernameStatus === 'invalid' ? '2px solid #EF4444' : usernameStatus === 'available' ? '2px solid #10B981' : '1px solid #E2E8F0',
                  background: '#FFFFFF', color: '#10284C', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                {usernameStatus === 'checking' && <div style={{ width: 16, height: 16, border: '2px solid #4BB9EC', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
                {usernameStatus === 'available' && <Check className="w-4 h-4" style={{ color: '#10B981' }} />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <AlertCircle className="w-4 h-4" style={{ color: '#EF4444' }} />}
              </div>
            </div>
            {usernameError && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{usernameError}</p>}
            {usernameStatus === 'available' && <p style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>Username is available</p>}
          </div>

          {/* PIN */}
          <div style={{ marginBottom: 16 }}>
            <PinInputGroup values={pin} onChange={(i, v) => handlePinInput(i, v, false)} onKeyDown={(i, e) => handlePinKeyDown(i, e, false)} refs={pinRefs} label="4-Digit PIN" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <PinInputGroup values={confirmPin} onChange={(i, v) => handlePinInput(i, v, true)} onKeyDown={(i, e) => handlePinKeyDown(i, e, true)} refs={confirmPinRefs} label="Confirm PIN" />
          </div>

          {pinError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, marginBottom: 16 }}>
              <AlertCircle className="w-4 h-4" style={{ color: '#EF4444', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#EF4444' }}>{pinError}</span>
            </div>
          )}

          {/* COPPA Consent */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>&#128274;</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10284C' }}>Parental Consent</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
              By creating this login, I confirm:
            </p>

            {[
              { checked: consent1, set: setConsent1, label: `I am the parent/guardian of ${player.first_name || player.firstName}` },
              { checked: consent2, set: setConsent2, label: `I consent to ${player.first_name || player.firstName} having a player account on this platform` },
              { checked: consent3, set: setConsent3, label: 'I understand I can revoke access at any time from my dashboard' },
            ].map(({ checked, set, label }, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => set(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#4BB9EC', width: 16, height: 16 }}
                />
                <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, marginBottom: 16 }}>
              <AlertCircle className="w-4 h-4" style={{ color: '#EF4444', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px 16px', borderRadius: 10,
              background: '#F1F5F9', border: '1px solid #E2E8F0',
              color: '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                background: canSubmit ? '#10284C' : '#CBD5E1', border: 'none',
                color: '#FFFFFF', fontSize: 13, fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Creating...' : 'Create Player Login'}
            </button>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
