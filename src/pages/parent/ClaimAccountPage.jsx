import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Users, Check, X, Loader2, UserPlus, ChevronRight } from '../../constants/icons'
import DashboardContainer from '../../components/layout/DashboardContainer'

// ============================================
// CLAIM ACCOUNT PAGE
// Detects orphan players (parent_email matches but parent_account_id is null)
// and lets the parent link them to their account.
// ============================================

function ClaimAccountPage({ showToast }) {
  const { user, profile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const [orphans, setOrphans] = useState([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)

  useEffect(() => { detectOrphans() }, [user, profile])

  async function detectOrphans() {
    if (!user?.email && !profile?.email) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const email = profile?.email || user?.email
      // Find players whose parent_email or emergency email matches
      // but have no parent_account_id set
      const { data, error } = await supabase
        .from('players')
        .select('id, first_name, last_name, position, jersey_number, season_id, organization_id')
        .is('parent_account_id', null)
        .or(`parent_email.eq.${email},email.eq.${email}`)
      if (error) throw error
      setOrphans(data || [])
    } catch (err) {
      console.error('Orphan detection error:', err)
    }
    setLoading(false)
  }

  async function handleLink() {
    if (orphans.length === 0) return
    setLinking(true)
    try {
      // Update all orphan players to link to this parent account
      const ids = orphans.map(o => o.id)
      const { error } = await supabase
        .from('players')
        .update({ parent_account_id: user.id })
        .in('id', ids)
      if (error) throw error

      showToast?.(`${orphans.length} player(s) linked to your account!`, 'success')
      navigate('/dashboard')
    } catch (err) {
      showToast?.(`Linking failed: ${err.message}`, 'error')
    }
    setLinking(false)
  }

  function handleSkip() {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <DashboardContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-lynx-sky" />
        </div>
      </DashboardContainer>
    )
  }

  // No orphans found -- redirect or show message
  if (orphans.length === 0) {
    return (
      <DashboardContainer>
        <div className="max-w-lg mx-auto mt-16">
          <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-lynx-charcoal/40 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className={`text-xl font-bold mb-2 ${tc.text}`}>No Unclaimed Players Found</h2>
            <p className={`text-sm mb-6 ${tc.textSecondary}`}>
              There are no player profiles waiting to be linked to your account.
            </p>
            <button onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-lynx-sky hover:bg-lynx-sky/90 text-white rounded-xl text-sm font-semibold transition-colors">
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <div className="max-w-lg mx-auto mt-12">
        <div className={`rounded-2xl p-8 ${isDark ? 'bg-lynx-charcoal/40 border border-white/10' : 'bg-white border border-slate-200 shadow-lg'}`}>
          {/* Header */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-lynx-sky/20 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-lynx-sky" />
            </div>
          </div>

          <h1 className={`text-2xl font-bold text-center mb-2 ${tc.text}`}>
            We found your family!
          </h1>
          <p className={`text-sm text-center mb-6 ${tc.textSecondary}`}>
            The following player profiles were created for your children.
            Link them to your account to manage registrations, payments, and more.
          </p>

          {/* Player List */}
          <div className="space-y-3 mb-6">
            {orphans.map(player => (
              <div key={player.id}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  isDark ? 'bg-white/[0.04] border border-white/10' : 'bg-slate-50 border border-slate-200'
                }`}>
                <div className="w-10 h-10 rounded-full bg-lynx-sky/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-lynx-sky" />
                </div>
                <div>
                  <p className={`font-semibold ${tc.text}`}>{player.first_name} {player.last_name}</p>
                  <p className={`text-xs ${tc.textSecondary}`}>
                    {player.position || 'Player'}
                    {player.jersey_number ? ` -- #${player.jersey_number}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={handleLink} disabled={linking}
              className="w-full py-3.5 bg-lynx-sky hover:bg-lynx-sky/90 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {linking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Linking...</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Link to My Account</>
              )}
            </button>

            <button onClick={handleSkip}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              This isn't me -- skip
            </button>
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}

// ============================================
// ORPHAN BANNER — For embedding in ParentDashboard
// ============================================
function OrphanPlayerBanner({ onNavigate }) {
  const { user, profile } = useAuth()
  const { isDark } = useTheme()
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function check() {
      if (!user?.email && !profile?.email) return
      const email = profile?.email || user?.email
      const { count: c } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .is('parent_account_id', null)
        .or(`parent_email.eq.${email},email.eq.${email}`)
      setCount(c || 0)
    }
    check()
  }, [user, profile])

  if (count === 0) return null

  return (
    <div className={`rounded-2xl p-4 flex items-center justify-between ${
      isDark ? 'bg-lynx-sky/10 border border-lynx-sky/30' : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex items-center gap-3">
        <UserPlus className="w-6 h-6 text-lynx-sky" />
        <div>
          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {count} player profile{count > 1 ? 's' : ''} found for your family
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Link them to your account to get started</p>
        </div>
      </div>
      <button onClick={() => onNavigate?.('claim-account')}
        className="flex items-center gap-1 px-4 py-2 bg-lynx-sky hover:bg-lynx-sky/90 text-white rounded-xl text-sm font-semibold transition-colors">
        Claim <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export { ClaimAccountPage, OrphanPlayerBanner }
