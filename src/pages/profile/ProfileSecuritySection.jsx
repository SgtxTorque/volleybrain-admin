import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Mail, Save, Lock, Key, Eye, EyeOff, Trash2,
  AlertTriangle, Check, X, RefreshCw
} from '../../constants/icons'

// ============================================
// CHANGE PASSWORD SECTION
// ============================================
export function ChangePasswordSection({ isDark, tc, showToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function getPasswordStrength(pw) {
    if (!pw) return { label: '', color: '', width: '0%' }
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
    if (/\d/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++

    if (score <= 2) return { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500', width: '33%' }
    if (score <= 3) return { label: 'Medium', color: 'text-amber-500', bgColor: 'bg-amber-500', width: '66%' }
    return { label: 'Strong', color: 'text-emerald-500', bgColor: 'bg-emerald-500', width: '100%' }
  }

  const strength = getPasswordStrength(form.newPassword)

  async function handleSave() {
    if (!form.newPassword) {
      showToast('Please enter a new password', 'error')
      return
    }
    if (form.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.newPassword })
      if (error) throw error
      showToast('Password updated successfully', 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'

  return (
    <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
      <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Key className="w-4 h-4 text-lynx-sky" />
        Change Password
      </h2>

      <div className="space-y-4 max-w-md">
        {/* Current password */}
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={e => set('currentPassword', e.target.value)}
              placeholder="Enter current password"
              className={`w-full px-3 py-2 pr-10 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${tc.textMuted}`}>
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)}
              placeholder="Enter new password"
              className={`w-full px-3 py-2 pr-10 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${tc.textMuted}`}>
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Strength indicator */}
          {form.newPassword && (
            <div className="mt-2">
              <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.bgColor}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-[11px] mt-1 font-medium ${strength.color}`}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Confirm New Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)}
            placeholder="Re-enter new password"
            className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
          />
          {form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <X className="w-3 h-3" /> Passwords do not match
            </p>
          )}
          {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length > 0 && (
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <Check className="w-3 h-3" /> Passwords match
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.newPassword || form.newPassword !== form.confirmPassword}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-r-sm font-bold text-white bg-lynx-navy hover:brightness-110 transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

// ============================================
// CHANGE EMAIL SECTION
// ============================================
export function ChangeEmailSection({ user, profile, isDark, tc, showToast }) {
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSave() {
    if (!newEmail) {
      showToast('Please enter a new email address', 'error')
      return
    }
    if (newEmail === (user?.email || profile?.email)) {
      showToast('New email is the same as your current email', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      // Also update profiles table
      await supabase.from('profiles').update({ email: newEmail }).eq('id', profile.id)
      setSent(true)
      showToast('Confirmation link sent to your new email address', 'success')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'

  return (
    <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
      <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Mail className="w-4 h-4 text-lynx-sky" />
        Change Email
      </h2>

      <div className="space-y-4 max-w-md">
        {/* Current email */}
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Current Email</label>
          <div className={`px-3 py-2 rounded-lg text-r-sm font-medium ${isDark ? 'bg-white/[.03] border border-white/[.06] text-white/60' : 'bg-lynx-cloud border border-lynx-silver text-slate-500'}`}>
            {user?.email || profile?.email || '-'}
          </div>
        </div>

        {/* New email */}
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="newemail@example.com"
            className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
          />
        </div>

        {/* Password confirmation */}
        <div>
          <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Confirm Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password for security"
            className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
          />
        </div>

        {sent && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${isDark ? 'bg-emerald-500/10 border border-emerald-500/15' : 'bg-emerald-50 border border-emerald-200'}`}>
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className={`text-r-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              A confirmation link has been sent to your new email address. Please check your inbox and click the link to complete the change.
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !newEmail}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-r-sm font-bold text-white bg-lynx-navy hover:brightness-110 transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {saving ? 'Sending...' : 'Update Email'}
        </button>
      </div>
    </div>
  )
}

// ============================================
// DELETE ACCOUNT SECTION
// ============================================
export function DeleteAccountSection({ profile, isDark, tc, showToast }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    try {
      // Mark profile as deletion_requested and sign out
      await supabase.from('profiles').update({ deletion_requested: true }).eq('id', profile.id)
      showToast('Your account has been scheduled for deletion', 'success')
      // Sign out after short delay so toast is visible
      setTimeout(async () => {
        await supabase.auth.signOut()
      }, 1500)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
      setDeleting(false)
    }
  }

  return (
    <div
      className={`rounded-[14px] p-6 animate-fade-in ${
        isDark
          ? 'bg-red-500/[0.04] border border-red-500/[0.15]'
          : 'bg-red-50/60 border border-red-200'
      }`}
    >
      <h2 className={`text-r-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
        <Trash2 className="w-4 h-4 text-red-400" />
        Danger Zone
      </h2>

      {!showConfirm ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-r-sm font-semibold ${isDark ? 'text-red-200' : 'text-red-800'}`}>Delete My Account</p>
            <p className={`text-r-xs mt-1 ${isDark ? 'text-red-300/60' : 'text-red-600/70'}`}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className={`shrink-0 px-4 py-2.5 rounded-lg text-r-sm font-medium transition ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
          >
            Delete My Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`flex items-start gap-2 p-3 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className={`text-r-sm font-semibold ${isDark ? 'text-red-200' : 'text-red-800'}`}>This is permanent</p>
              <p className={`text-r-xs mt-1 ${isDark ? 'text-red-300/60' : 'text-red-600/70'}`}>
                All your profile data, team assignments, coaching records, and any associated information will be permanently removed.
                Your organization memberships will be revoked. This cannot be undone.
              </p>
            </div>
          </div>

          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-red-300/70' : 'text-red-700'}`}>
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className={`w-full max-w-xs px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none focus:ring-1 focus:ring-red-500/30 ${
                isDark ? 'bg-red-500/5 border-red-500/20 text-red-200 placeholder-red-300/30' : 'bg-white border-red-200 text-red-800 placeholder-red-300'
              }`}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'DELETE' || deleting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-r-sm font-bold text-white bg-red-500 hover:brightness-110 transition disabled:opacity-40"
            >
              {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText('') }}
              className={`px-5 py-2.5 rounded-lg text-r-sm font-medium transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/[0.06]' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
