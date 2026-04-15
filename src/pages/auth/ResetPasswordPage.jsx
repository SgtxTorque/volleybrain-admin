import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [otpExpired, setOtpExpired] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied') || hash.includes('error_code=otp_disabled')) {
      setOtpExpired(true)
      // Clean up the hash so it doesn't persist on refresh
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError
      setSuccess(true)
      // Sign out the recovery session and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (otpExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white rounded-[14px] p-8 border border-slate-200 text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Reset link expired</h2>
          <p className="text-slate-500 text-sm mb-6">
            Password reset links expire after a short time for security. Request a new one and click it right away.
          </p>
          <a href="/login" className="inline-flex items-center justify-center w-full px-5 py-3 rounded-[14px] bg-[#10284C] text-white font-semibold text-sm hover:brightness-110">
            Back to Login →
          </a>
          <p className="mt-3 text-xs text-slate-400">
            Enter your email on the login page and click "Forgot password?" to get a new link.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4">
        <div className="bg-white rounded-[14px] shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Password Updated!</h2>
          <p className="text-slate-500 mb-2">Your password has been reset successfully.</p>
          <p className="text-sm text-slate-400 mb-6">Redirecting to sign in...</p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-[14px] bg-[#10284C] text-white font-semibold hover:brightness-110 transition-all"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4">
      <div className="bg-white rounded-[14px] shadow-sm p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Set New Password</h2>
        <p className="text-slate-500 mb-6">Enter your new password below.</p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 rounded-[14px] border border-slate-300 text-sm focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC] outline-none"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-3 py-2 rounded-[14px] border border-slate-300 text-sm focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC] outline-none"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="p-3 rounded-[14px] bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[14px] bg-[#10284C] text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
