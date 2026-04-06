// =============================================================================
// ManagePlayerPassModal — Parent manages child's Player Pass
// Change PIN, copy login info, revoke access
// =============================================================================

import { useState, useRef } from 'react'
import { X, Copy, AlertCircle, Eye, EyeOff, Check, ShieldCheck } from '../../constants/icons'
import { validatePin, changePlayerPin, revokePlayerPass, reenablePlayerPass } from '../../lib/player-pass'

export default function ManagePlayerPassModal({ player, onClose, onRefresh, showToast }) {
  const playerName = `${player.firstName || player.first_name || ''} ${player.lastName || player.last_name || ''}`.trim()
  const username = player.playerUsername || player.player_username || ''
  const isEnabled = player.playerAccountEnabled ?? player.player_account_enabled ?? true

  // PIN change state
  const [newPin, setNewPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [showPin, setShowPin] = useState(false)
  const [pinError, setPinError] = useState(null)
  const [pinSuccess, setPinSuccess] = useState(false)
  const [changingPin, setChangingPin] = useState(false)

  // Revoke state
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [reenabling, setReenabling] = useState(false)

  const pinRefs = [useRef(), useRef(), useRef(), useRef()]
  const confirmPinRefs = [useRef(), useRef(), useRef(), useRef()]

  function handlePinChange(index, value, isConfirm = false) {
    if (!/^\d*$/.test(value)) return
    const setter = isConfirm ? setConfirmPin : setNewPin
    const refs = isConfirm ? confirmPinRefs : pinRefs
    setter(prev => {
      const updated = [...prev]
      updated[index] = value.slice(-1)
      return updated
    })
    if (value && index < 3) {
      refs[index + 1].current?.focus()
    }
    setPinError(null)
    setPinSuccess(false)
  }

  function handlePinKeyDown(index, e, isConfirm = false) {
    const current = isConfirm ? confirmPin : newPin
    const refs = isConfirm ? confirmPinRefs : pinRefs
    if (e.key === 'Backspace' && !current[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  async function handleChangePin() {
    const pinString = newPin.join('')
    const confirmString = confirmPin.join('')

    const pinValidation = validatePin(pinString)
    if (pinValidation) { setPinError(pinValidation); return }

    if (pinString !== confirmString) { setPinError('PINs do not match'); return }

    setChangingPin(true)
    setPinError(null)
    try {
      await changePlayerPin(player.id, pinString)
      setPinSuccess(true)
      setNewPin(['', '', '', ''])
      setConfirmPin(['', '', '', ''])
      showToast?.('PIN updated successfully!', 'success')
    } catch (err) {
      setPinError(err.message || 'Failed to update PIN')
    }
    setChangingPin(false)
  }

  async function handleRevoke() {
    setRevoking(true)
    try {
      await revokePlayerPass(player.id)
      showToast?.(`${playerName}'s Player Login has been disabled.`, 'success')
      onRefresh?.()
      onClose()
    } catch (err) {
      showToast?.(err.message || 'Failed to revoke access', 'error')
    }
    setRevoking(false)
  }

  async function handleReenable() {
    setReenabling(true)
    try {
      await reenablePlayerPass(player.id)
      showToast?.(`${playerName}'s Player Login has been re-enabled!`, 'success')
      onRefresh?.()
      onClose()
    } catch (err) {
      showToast?.(err.message || 'Failed to re-enable access', 'error')
    }
    setReenabling(false)
  }

  function copyLoginInfo() {
    const text = `${playerName}'s Lynx Player Login\nUsername: ${username}\nPIN: (ask your parent)\nLogin: ${window.location.origin}/player-login`
    navigator.clipboard.writeText(text)
    showToast?.('Login info copied!', 'success')
  }

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
              fontSize: 20, fontWeight: 700, borderRadius: 10,
              border: pinError ? '2px solid #EF4444' : '1px solid #E2E8F0',
              background: '#FFFFFF', color: '#10284C', outline: 'none',
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div style={{
        maxWidth: 440, width: '100%', maxHeight: '90vh', overflow: 'auto',
        background: '#FFFFFF', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: isEnabled ? '#ECFDF5' : '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck className="w-5 h-5" style={{ color: isEnabled ? '#10B981' : '#EF4444' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#10284C', margin: 0 }}>
                {playerName}'s Player Login
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Manage access and security</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Status section */}
          <div style={{
            background: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isEnabled ? '#10B981' : '#EF4444',
              }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: isEnabled ? '#059669' : '#DC2626' }}>
                {isEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Username</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10284C' }}>{username}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Login URL</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4BB9EC' }}>{window.location.origin}/player-login</div>
              </div>
            </div>
          </div>

          {/* Copy Login Info */}
          <button
            onClick={copyLoginInfo}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 10,
              background: '#F1F5F9', border: '1px solid #E2E8F0',
              color: '#10284C', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginBottom: 24,
            }}
          >
            <Copy className="w-4 h-4" /> Copy Login Info
          </button>

          {/* Change PIN section */}
          {isEnabled && (
            <>
              <div style={{
                borderTop: '1px solid #F1F5F9', paddingTop: 20, marginBottom: 20,
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#10284C', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Change PIN
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <PinInputGroup
                    values={newPin}
                    onChange={(i, v) => handlePinChange(i, v, false)}
                    onKeyDown={(i, e) => handlePinKeyDown(i, e, false)}
                    refs={pinRefs}
                    label="New PIN"
                  />
                  <PinInputGroup
                    values={confirmPin}
                    onChange={(i, v) => handlePinChange(i, v, true)}
                    onKeyDown={(i, e) => handlePinKeyDown(i, e, true)}
                    refs={confirmPinRefs}
                    label="Confirm New PIN"
                  />
                </div>

                {pinError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 10,
                  }}>
                    <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                  </div>
                )}
                {pinSuccess && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 10,
                  }}>
                    <Check className="w-3.5 h-3.5" /> PIN updated successfully!
                  </div>
                )}

                <button
                  onClick={handleChangePin}
                  disabled={changingPin || newPin.join('').length !== 4 || confirmPin.join('').length !== 4}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none',
                    background: changingPin || newPin.join('').length !== 4 ? '#E2E8F0' : '#10284C',
                    color: changingPin || newPin.join('').length !== 4 ? '#94A3B8' : '#FFFFFF',
                    fontSize: 13, fontWeight: 700, cursor: changingPin ? 'not-allowed' : 'pointer',
                    marginTop: 14,
                  }}
                >
                  {changingPin ? 'Updating...' : 'Update PIN'}
                </button>
              </div>
            </>
          )}

          {/* Danger Zone */}
          <div style={{
            borderTop: '1px solid #F1F5F9', paddingTop: 20,
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isEnabled ? 'Danger Zone' : 'Re-enable Access'}
            </h3>

            {isEnabled ? (
              <>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px' }}>
                  This will disable {playerName}'s ability to log in. You can re-create it anytime.
                </p>
                {!showRevokeConfirm ? (
                  <button
                    onClick={() => setShowRevokeConfirm(true)}
                    style={{
                      width: '100%', padding: '10px 16px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Revoke Player Login
                  </button>
                ) : (
                  <div style={{ background: '#FEF2F2', borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', margin: '0 0 10px' }}>
                      Are you sure? {playerName} will not be able to log in until you re-enable it.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setShowRevokeConfirm(false)}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8,
                          background: '#FFFFFF', border: '1px solid #E2E8F0',
                          color: '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRevoke}
                        disabled={revoking}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8,
                          background: '#DC2626', border: 'none',
                          color: '#FFFFFF', fontSize: 12, fontWeight: 700,
                          cursor: revoking ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {revoking ? 'Revoking...' : 'Yes, Revoke'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px' }}>
                  {playerName}'s Player Login is currently disabled. Re-enable to allow them to log in again with the same username and PIN.
                </p>
                <button
                  onClick={handleReenable}
                  disabled={reenabling}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 10,
                    background: reenabling ? '#E2E8F0' : '#10B981', border: 'none',
                    color: '#FFFFFF', fontSize: 13, fontWeight: 700,
                    cursor: reenabling ? 'not-allowed' : 'pointer',
                  }}
                >
                  {reenabling ? 'Re-enabling...' : 'Re-enable Player Login'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
