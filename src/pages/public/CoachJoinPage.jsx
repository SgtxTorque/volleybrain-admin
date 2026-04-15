import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrgLogo from '../../components/OrgLogo'

export default function CoachJoinPage() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadOrg()
  }, [orgId])

  async function loadOrg() {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, logo_url, primary_color')
        .eq('id', orgId)
        .single()

      if (data) {
        setOrg(data)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleLookup(e) {
    e.preventDefault()
    if (!email.trim()) return

    setChecking(true)
    setError('')

    try {
      // Check if this email has a pending coach invite
      const { data: coachInvite } = await supabase
        .from('coaches')
        .select('id, invite_code, invite_status')
        .eq('invite_email', email.trim().toLowerCase())
        .eq('invite_status', 'invited')
        .maybeSingle()

      if (coachInvite?.invite_code) {
        // Found a pending invite — redirect to the accept page
        navigate(`/invite/coach/${coachInvite.invite_code}`)
        return
      }

      // No pending invite found
      setError(
        'No pending invitation found for this email. Please check with your club director to make sure they sent an invite to this address.'
      )
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10284C]" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4">
        <div className="bg-white rounded-[14px] shadow-sm p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Organization Not Found</h2>
          <p className="text-slate-500">This invite link may be outdated. Please contact your club director for a new link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4">
      <div className="bg-white rounded-[14px] shadow-sm p-8 max-w-md w-full">
        {/* Org branding */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <OrgLogo org={org} size={64} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{org.name}</h2>
          <p className="text-slate-500 mt-1">Coach Invitation</p>
        </div>

        {/* Email lookup form */}
        <p className="text-sm text-slate-600 mb-4">
          Enter the email address your invitation was sent to. We'll find your invite and get you set up.
        </p>

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@example.com"
              className="w-full px-3 py-2 rounded-[14px] border border-slate-300 text-sm focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC] outline-none"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-[14px] bg-amber-50 border border-amber-200 text-sm text-amber-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking}
            className="w-full py-3 rounded-[14px] bg-[#10284C] text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {checking ? 'Looking up...' : 'Find My Invitation'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Already have an account? <a href="/" className="text-[#4BB9EC] hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}
