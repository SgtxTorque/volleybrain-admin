import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, MapPin, Clock, Users, DollarSign, ChevronRight, 
  Check, AlertTriangle, Plus, RefreshCw, X, ExternalLink, ClipboardList,
  MessageCircle, Megaphone, Target, Copy, CreditCard, Bell
} from '../../constants/icons'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
    </svg>
  )
}

// Helper function to format time to 12-hour format
function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

// ============================================
// EVENT DETAIL MODAL (Parent View)
// ============================================
function EventDetailModal({ event, teams, venues, onClose, onUpdate, onDelete, activeView }) {
  const tc = useThemeClasses()
  if (!event) return null

  const team = teams?.find(t => t.id === event.team_id)
  const venue = venues?.find(v => v.id === event.venue_id)
  const eventDate = event.event_date ? new Date(event.event_date) : null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${tc.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white`} style={{ backgroundColor: team?.color || '#6366F1' }}>
              {event.event_type === 'practice' ? <VolleyballIcon className="w-6 h-6" /> : 
               event.event_type === 'game' ? '🏐' : '📅'}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${tc.text}`}>{event.title || event.event_type}</h2>
              <p className={tc.textMuted}>{team?.name}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <Calendar className={`w-5 h-5 ${tc.textMuted}`} />
            <div>
              <p className={tc.text}>{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className={tc.textSecondary}>{formatTime12(event.event_time)}</p>}
            </div>
          </div>

          {/* Location */}
          {(event.location || venue || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 ${tc.textMuted}`} />
              <div>
                <p className={tc.text}>{event.venue_name || event.location || venue?.name}</p>
                {(venue?.address || event.venue_address) && <p className={`text-sm ${tc.textSecondary}`}>{event.venue_address || venue?.address}</p>}
              </div>
            </div>
          )}

          {/* Opponent (for games) */}
          {(event.opponent || event.opponent_name) && (
            <div className="flex items-center gap-3">
              <Users className={`w-5 h-5 ${tc.textMuted}`} />
              <p className={tc.text}>vs {event.opponent_name || event.opponent}</p>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
              <p className={`text-sm ${tc.textSecondary}`}>{event.notes}</p>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl border ${tc.border} ${tc.text} font-medium`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PAYMENT OPTIONS MODAL
// ============================================
function PaymentOptionsModal({ amount, organization, onClose, showToast }) {
  const tc = useThemeClasses()
  const [copied, setCopied] = useState(null)

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      showToast?.(`${label} copied to clipboard!`)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Make a Payment</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>Total Due: <span className="text-[var(--accent-primary)] font-bold">${amount?.toFixed(2) || '0.00'}</span></p>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Venmo */}
          {organization?.payment_venmo && (
            <a 
              href={`https://venmo.com/${organization.payment_venmo}?txn=pay&amount=${amount?.toFixed(2) || '0'}&note=VolleyBrain%20Payment`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#3D95CE]/20 rounded-xl hover:bg-[#3D95CE]/30 transition"
            >
              <span className="text-2xl">💳</span>
              <div className="flex-1">
                <p className="font-medium text-[#3D95CE]">Venmo</p>
                <p className={`text-sm ${tc.textMuted}`}>@{organization.payment_venmo}</p>
              </div>
              <span className="text-[#3D95CE]">→</span>
            </a>
          )}
          
          {/* Zelle */}
          {organization?.payment_zelle && (
            <div className="flex items-center gap-3 p-4 bg-purple-500/20 rounded-xl">
              <span className="text-2xl">💸</span>
              <div className="flex-1">
                <p className="font-medium text-purple-400">Zelle</p>
                <p className={`text-sm ${tc.textMuted}`}>{organization.payment_zelle}</p>
              </div>
              <button 
                onClick={() => copyToClipboard(organization.payment_zelle, 'Zelle email')}
                className={`text-sm px-3 py-1 rounded-lg ${copied === 'Zelle email' ? 'bg-emerald-500/20 text-emerald-400' : 'text-purple-400 hover:bg-purple-500/20'} transition`}
              >
                {copied === 'Zelle email' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
          
          {/* CashApp */}
          {organization?.payment_cashapp && (
            <a 
              href={`https://cash.app/${organization.payment_cashapp}/${amount?.toFixed(2) || '0'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition"
            >
              <span className="text-2xl">💵</span>
              <div className="flex-1">
                <p className="font-medium text-emerald-400">Cash App</p>
                <p className={`text-sm ${tc.textMuted}`}>{organization.payment_cashapp}</p>
              </div>
              <span className="text-emerald-400">→</span>
            </a>
          )}

          {/* Other Instructions */}
          {organization?.payment_instructions && (
            <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
              <p className={`text-sm font-medium ${tc.text} mb-2`}>Other Payment Options:</p>
              <p className={`text-sm ${tc.textSecondary} whitespace-pre-wrap`}>{organization.payment_instructions}</p>
            </div>
          )}

          {/* No payment methods configured */}
          {!organization?.payment_venmo && !organization?.payment_zelle && !organization?.payment_cashapp && !organization?.payment_instructions && (
            <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
              <p className={tc.textMuted}>Contact your league administrator for payment options.</p>
            </div>
          )}

          {/* Tip */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-400 text-sm">
              💡 After sending payment, your admin will mark it as paid within 1-2 business days.
            </p>
          </div>
        </div>
        
        <div className={`p-6 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD CHILD MODAL
// ============================================
function AddChildModal({ existingChildren, onClose, showToast }) {
  const tc = useThemeClasses()
  const [openSeasons, setOpenSeasons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOpenSeasons()
  }, [])

  async function loadOpenSeasons() {
    try {
      const orgIds = [...new Set((existingChildren || []).map(c => c.season?.organizations?.id).filter(Boolean))]
      
      const now = new Date().toISOString()
      let query = supabase
        .from('seasons')
        .select('*, sports(name, icon), organizations(id, name, slug, settings)')
        .lte('registration_opens', now)
        .or(`registration_closes.is.null,registration_closes.gte.${now}`)
        .in('status', ['upcoming', 'active'])
      
      if (orgIds.length > 0) {
        query = query.in('organization_id', orgIds)
      }
      
      const { data } = await query
      setOpenSeasons(data || [])
    } catch (err) {
      console.error('Error loading seasons:', err)
    }
    setLoading(false)
  }

  const templateChild = existingChildren?.[0]
  
  function getSiblingRegistrationUrl(season) {
    const orgSlug = season.organizations?.slug || 'black-hornets'
    const registrationBaseUrl = season.organizations?.settings?.registration_url || 'https://sgtxtorque.github.io/volleyball-registration'
    
    const prefillParams = new URLSearchParams({
      org: orgSlug,
      season: season.id,
      prefill: 'true',
      parent_name: templateChild?.parent_name || '',
      parent_email: templateChild?.parent_email || '',
      parent_phone: templateChild?.parent_phone || '',
    })
    
    const cleanParams = new URLSearchParams()
    prefillParams.forEach((value, key) => {
      if (value) cleanParams.append(key, value)
    })
    
    return `${registrationBaseUrl}?${cleanParams.toString()}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Add Another Child</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>Select a season to register a sibling</p>
        </div>
        
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : openSeasons.length > 0 ? (
            <>
              {templateChild && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
                  <p className="text-emerald-400 text-sm">
                    ✓ Parent info will be pre-filled from {templateChild.first_name}'s registration
                  </p>
                </div>
              )}
              {openSeasons.map(season => (
                <a 
                  key={season.id}
                  href={getSiblingRegistrationUrl(season)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${tc.cardBgAlt} rounded-xl p-4 flex items-center gap-4 hover:scale-[1.02] transition block`}
                >
                  <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
                    {season.sports?.icon || '🏐'}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${tc.text}`}>{season.name}</p>
                    <p className={`text-sm ${tc.textSecondary}`}>{season.organizations?.name}</p>
                  </div>
                  <span className="text-[var(--accent-primary)] font-semibold">Register →</span>
                </a>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
              <p className={`${tc.textSecondary} mt-2`}>No open registrations at this time</p>
            </div>
          )}
        </div>
        
        <div className={`p-6 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// RE-REGISTER MODAL
// ============================================
function ReRegisterModal({ player, season, onClose, showToast }) {
  const tc = useThemeClasses()
  const [copied, setCopied] = useState(false)

  const orgSlug = season.organizations?.slug || 'black-hornets'
  const registrationBaseUrl = season.organizations?.settings?.registration_url || 'https://sgtxtorque.github.io/volleyball-registration'

  const prefillParams = new URLSearchParams({
    org: orgSlug,
    season: season.id,
    prefill: 'true',
    first_name: player.first_name || '',
    last_name: player.last_name || '',
    dob: player.dob || player.birth_date || '',
    grade: player.grade === 0 ? 'K' : String(player.grade || ''),
    gender: player.gender || '',
    school: player.school || '',
    parent_name: player.parent_name || '',
    parent_email: player.parent_email || '',
    parent_phone: player.parent_phone || '',
  })
  
  const cleanParams = new URLSearchParams()
  prefillParams.forEach((value, key) => {
    if (value) cleanParams.append(key, value)
  })

  const registrationUrl = `${registrationBaseUrl}?${cleanParams.toString()}`
  
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl)
      setCopied(true)
      showToast?.('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`}>
        <div className={`p-6 border-b ${tc.border}`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Re-Register {player.first_name}</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>for {season.name}</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
                {season.sports?.icon || '🏅'}
              </div>
              <div>
                <p className={`font-semibold ${tc.text}`}>{season.name}</p>
                <p className={`text-sm ${tc.textSecondary}`}>{season.organizations?.name}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-400 text-sm">
              ✓ {player.first_name}'s information will be pre-filled to save time!
            </p>
          </div>
        </div>
        
        <div className={`p-6 border-t ${tc.border} flex gap-3`}>
          <button onClick={onClose} className={`flex-1 py-2 rounded-xl border ${tc.border} ${tc.text}`}>
            Cancel
          </button>
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-center hover:brightness-110 transition"
          >
            Open Registration →
          </a>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ALERT/ANNOUNCEMENT DETAIL MODAL
// ============================================
function AlertDetailModal({ alert, onClose }) {
  const tc = useThemeClasses()
  if (!alert) return null

  const createdDate = new Date(alert.created_at)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${tc.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              alert.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
            }`}>
              {alert.priority === 'urgent' ? <AlertTriangle className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${tc.text}`}>{alert.title}</h2>
              <p className={tc.textMuted}>{createdDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <p className={`${tc.textSecondary} whitespace-pre-wrap`}>{alert.content}</p>
        </div>

        <div className={`p-6 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl border ${tc.border} ${tc.text} font-medium`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PARENT DASHBOARD
// ============================================
function ParentDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate }) {
  const { profile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { selectedSport } = useSport()
  
  const [loading, setLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [playerDetails, setPlayerDetails] = useState([])
  const [selectedEventDetail, setSelectedEventDetail] = useState(null)
  const [teams, setTeams] = useState([])
  
  // Alerts/Announcements
  const [alerts, setAlerts] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  
  // Payment state
  const [paymentSummary, setPaymentSummary] = useState({ totalDue: 0, totalPaid: 0, unpaidItems: [] })
  const [organization, setOrganization] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Registration state
  const [registrationData, setRegistrationData] = useState([])
  const [openSeasons, setOpenSeasons] = useState([])
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [showReRegisterModal, setShowReRegisterModal] = useState(null)
  
  // Get parent's name from profile or first child's parent_name
  const parentName = profile?.full_name?.split(' ')[0] || registrationData[0]?.parent_name?.split(' ')[0] || 'Parent'
  
  // Helper to generate registration URL
  function getRegistrationUrl(season) {
    const orgSlug = season.organizations?.slug || 'black-hornets'
    const registrationBaseUrl = season.organizations?.settings?.registration_url || 'https://sgtxtorque.github.io/volleyball-registration'
    return `${registrationBaseUrl}?org=${orgSlug}&season=${season.id}`
  }

  useEffect(() => {
    if (roleContext?.children?.length > 0) {
      loadParentData()
    } else {
      setLoading(false)
      loadOpenSeasons()
    }
  }, [roleContext?.children])

  async function loadOpenSeasons() {
    try {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('seasons')
        .select('*, sports(name, icon), organizations(id, name, slug, settings)')
        .lte('registration_opens', now)
        .or(`registration_closes.is.null,registration_closes.gte.${now}`)
        .in('status', ['upcoming', 'active'])
      
      // Filter to seasons that children are NOT already registered for
      const childSeasonIds = registrationData.map(r => r.season_id)
      const available = (data || []).filter(s => !childSeasonIds.includes(s.id))
      setOpenSeasons(available)
    } catch (err) {
      console.error('Error loading seasons:', err)
    }
  }

  async function loadParentData() {
    setLoading(true)
    try {
      const playerIds = roleContext.children.map(c => c.id)
      
      // Load player details with registration info
      const { data: players } = await supabase
        .from('players')
        .select(`
          *,
          registrations(id, status, season_id, created_at),
          team_players(team_id, teams(id, name, color))
        `)
        .in('id', playerIds)
      
      if (players?.length > 0) {
        // Get season info for each player
        const seasonIds = [...new Set(players.flatMap(p => p.registrations?.map(r => r.season_id) || []))]
        const { data: seasons } = await supabase
          .from('seasons')
          .select('*, sports(name, icon), organizations(id, name, slug, settings)')
          .in('id', seasonIds)
        
        // Get organization for payment info
        const orgId = seasons?.[0]?.organization_id
        if (orgId) {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single()
          setOrganization(org)
        }

        // Build registration data with enriched info
        const enrichedPlayers = players.map(player => {
          const reg = player.registrations?.[0]
          const season = seasons?.find(s => s.id === reg?.season_id)
          const teamLink = player.team_players?.[0]
          return {
            ...player,
            season,
            season_id: reg?.season_id,
            registrationStatus: reg?.status,
            registrationId: reg?.id,
            team: teamLink?.teams
          }
        })
        
        setRegistrationData(enrichedPlayers)
        
        // Extract unique teams
        const uniqueTeams = [...new Map(
          enrichedPlayers
            .filter(p => p.team)
            .map(p => [p.team.id, p.team])
        ).values()]
        setTeams(uniqueTeams)

        // Load payment data
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .in('player_id', playerIds)
        
        if (payments) {
          const totalDue = payments
            .filter(p => !p.paid)
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
          const totalPaid = payments
            .filter(p => p.paid)
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
          const unpaidItems = payments.filter(p => !p.paid)
          
          setPaymentSummary({ totalDue, totalPaid, unpaidItems })
        }

        // Load alerts/announcements for this user
        await loadAlerts(playerIds, uniqueTeams.map(t => t.id))
      }

      // Load upcoming events for player's teams
      if (teams.length > 0 || roleContext.children.length > 0) {
        // Get team IDs from team_players
        const { data: teamLinks } = await supabase
          .from('team_players')
          .select('team_id')
          .in('player_id', playerIds)
        
        const teamIds = [...new Set(teamLinks?.map(tl => tl.team_id) || [])]
        
        if (teamIds.length > 0) {
          const today = new Date().toISOString().split('T')[0]
          
          // Try to load events - use schedule table which is more common
          try {
            const { data: events } = await supabase
              .from('schedule')
              .select('*, teams(id, name, color)')
              .in('team_id', teamIds)
              .gte('event_date', today)
              .order('event_date', { ascending: true })
              .order('event_time', { ascending: true })
              .limit(5)
            
            setUpcomingEvents(events || [])
          } catch (err) {
            console.log('Could not load events:', err)
            setUpcomingEvents([])
          }
        }
      }

      // Load recent team posts
      if (teams.length > 0) {
        const teamIds = teams.map(t => t.id)
        const { data: posts } = await supabase
          .from('team_posts')
          .select('*')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (posts?.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name, color')
            .in('id', [...new Set(posts.map(p => p.team_id))])
          
          setRecentPosts(posts.map(post => ({
            ...post,
            teams: teamsData?.find(t => t.id === post.team_id)
          })))
        }
      }

      await loadOpenSeasons()

    } catch (err) {
      console.error('Error loading parent data:', err)
    }
    setLoading(false)
  }

  async function loadAlerts(playerIds, teamIds) {
    try {
      // Try to load messages/blasts - these might not exist in all setups
      let allAlerts = []
      
      // Try messages table first
      try {
        if (teamIds.length > 0) {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .or(`target_type.eq.all,target_team_id.in.(${teamIds.join(',')})`)
            .order('created_at', { ascending: false })
            .limit(10)
          
          if (messages?.length > 0) {
            allAlerts = [...allAlerts, ...messages]
          }
        }
      } catch (err) {
        console.log('Messages table not available')
      }
      
      // Sort by date and take top 5
      allAlerts = allAlerts
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
      
      setAlerts(allAlerts)
    } catch (err) {
      console.log('Could not load alerts:', err)
      setAlerts([])
    }
  }

  // Get status badge
  function getStatusBadge(status) {
    switch(status) {
      case 'approved': return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Approved' }
      case 'rostered': case 'assigned': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'On Roster' }
      case 'pending': case 'submitted': case 'new': return { bg: 'bg-[var(--accent-primary)]/20', text: 'text-[var(--accent-primary)]', label: 'Pending' }
      case 'waitlist': return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Waitlist' }
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status || 'Registered' }
    }
  }

  // Get primary team for first player
  const primaryTeam = teams[0]
  const primarySeason = registrationData[0]?.season
  const primarySport = primarySeason?.sports

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  // No players registered yet
  if (!roleContext?.children?.length) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <VolleyballIcon className="w-20 h-20 text-[var(--accent-primary)] mb-4" />
          <h2 className={`text-2xl font-bold ${tc.text} mb-2`}>Welcome to VolleyBrain!</h2>
          <p className={tc.textSecondary}>You haven't registered any players yet.</p>
          <p className={`${tc.textMuted} mb-6`}>Get started by registering for an open season below.</p>
        </div>
        
        {openSeasons.length > 0 && (
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
            <h2 className={`text-lg font-semibold ${tc.text} mb-4`}>🎉 Open Registrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openSeasons.map(season => (
                <a 
                  key={season.id}
                  href={getRegistrationUrl(season)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${tc.cardBgAlt} rounded-xl p-4 flex items-center gap-4 hover:scale-[1.02] transition`}
                >
                  <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
                    {season.sports?.icon || '🏐'}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${tc.text}`}>{season.name}</p>
                    <p className={`text-sm ${tc.textSecondary}`}>{season.organizations?.name}</p>
                  </div>
                  <span className="text-[var(--accent-primary)] font-semibold">Register →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Parent's Name and Sport/Season Context */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {primarySport && (
              <span className="text-2xl">{primarySport.icon}</span>
            )}
            <span className={`text-sm ${tc.textMuted}`}>
              {primarySport?.name || 'Sports'} • {primarySeason?.name || 'Current Season'}
            </span>
          </div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>Welcome back, {parentName}! 👋</h1>
          <p className={tc.textSecondary}>
            Here's what's happening with {registrationData.length === 1 ? registrationData[0].first_name : 'your players'}
          </p>
        </div>
      </div>

      {/* Alerts/Announcements Section - NEW */}
      {alerts.length > 0 && (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
          <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className={`font-semibold ${tc.text}`}>Announcements</h2>
            </div>
            {alerts.some(a => a.priority === 'urgent') && (
              <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                {alerts.filter(a => a.priority === 'urgent').length} Urgent
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-700/50">
            {alerts.slice(0, 3).map(alert => (
              <div 
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`p-4 cursor-pointer hover:bg-white/5 transition flex items-start gap-3`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                }`}>
                  {alert.priority === 'urgent' ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${tc.text} truncate`}>{alert.title}</p>
                  <p className={`text-sm ${tc.textMuted} line-clamp-2`}>{alert.content}</p>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>
                    {new Date(alert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 ${tc.textMuted} flex-shrink-0`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Registration Banner - Prominent when available */}
      {openSeasons.length > 0 && (
        <div className="bg-gradient-to-r from-[var(--accent-primary)]/20 to-purple-500/20 border border-[var(--accent-primary)]/30 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className={`font-semibold ${tc.text}`}>New Season Registration Open!</p>
                <p className={`text-sm ${tc.textSecondary}`}>{openSeasons[0].name} - {openSeasons[0].organizations?.name}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {registrationData.map(player => (
                <button
                  key={player.id}
                  onClick={() => setShowReRegisterModal({ player, season: openSeasons[0] })}
                  className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-xl text-sm font-medium hover:brightness-110 transition"
                >
                  Register {player.first_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid - Players & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players Column - Takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className={`font-semibold ${tc.text} flex items-center gap-2`}>
            <Users className="w-5 h-5" /> My Players
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrationData.map(player => {
              const statusBadge = getStatusBadge(player.registrationStatus)
              return (
                <div 
                  key={player.id}
                  onClick={() => onNavigate(`player-${player.id}`)}
                  className={`${tc.cardBg} border ${tc.border} rounded-2xl p-4 cursor-pointer hover:border-[var(--accent-primary)]/50 hover:scale-[1.01] transition`}
                >
                  <div className="flex items-center gap-3">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.first_name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-xl font-bold text-[var(--accent-primary)]">
                        {player.first_name?.[0]}{player.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${tc.text}`}>{player.first_name} {player.last_name}</p>
                      {player.team && (
                        <p className="text-sm" style={{ color: player.team.color || '#6366F1' }}>
                          {player.team.name}
                        </p>
                      )}
                      {!player.team && player.season && (
                        <p className={`text-sm ${tc.textMuted}`}>{player.season.name}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              )
            })}
            
            {/* Add Another Child */}
            <button
              onClick={() => setShowAddChildModal(true)}
              className={`${tc.cardBg} border ${tc.border} border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 hover:border-[var(--accent-primary)]/50 transition`}
            >
              <Plus className={`w-5 h-5 ${tc.textMuted}`} />
              <span className={tc.textMuted}>Add Another Child</span>
            </button>
          </div>
        </div>

        {/* Payment Summary - 1 col */}
        <div className="space-y-4">
          <h2 className={`font-semibold ${tc.text} flex items-center gap-2`}>
            <DollarSign className="w-5 h-5" /> Balance
          </h2>
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
            {paymentSummary.totalDue > 0 ? (
              <>
                <div className="text-center mb-4">
                  <p className={`text-sm ${tc.textMuted}`}>Total Due</p>
                  <p className="text-4xl font-bold text-[var(--accent-primary)]">
                    ${paymentSummary.totalDue.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Pay Now
                </button>
                <p className={`text-xs ${tc.textMuted} text-center mt-3`}>
                  Venmo, Zelle, Cash App available
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <p className={`font-semibold ${tc.text}`}>All Paid Up!</p>
                <p className={`text-sm ${tc.textMuted}`}>No balance due</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('schedule')}
          className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 text-center hover:border-[var(--accent-primary)]/50 hover:scale-[1.02] transition`}
        >
          <Calendar className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
          <p className={`text-sm font-medium ${tc.text}`}>Schedule</p>
        </button>
        <button
          onClick={() => onNavigate('messages')}
          className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 text-center hover:border-[var(--accent-primary)]/50 hover:scale-[1.02] transition`}
        >
          <MessageCircle className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
          <p className={`text-sm font-medium ${tc.text}`}>Chats</p>
        </button>
        {primaryTeam && (
          <button
            onClick={() => navigateToTeamWall?.(primaryTeam.id)}
            className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 text-center hover:border-[var(--accent-primary)]/50 hover:scale-[1.02] transition`}
          >
            <Users className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
            <p className={`text-sm font-medium ${tc.text}`}>Team Hub</p>
          </button>
        )}
        <button
          onClick={() => onNavigate('invite')}
          className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 text-center hover:border-[var(--accent-primary)]/50 hover:scale-[1.02] transition`}
        >
          <Megaphone className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
          <p className={`text-sm font-medium ${tc.text}`}>Invite Friends</p>
        </button>
      </div>

      {/* Upcoming Events */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`font-semibold ${tc.text}`}>📅 Upcoming Events</h2>
          <button 
            onClick={() => onNavigate('schedule')}
            className={`text-sm text-[var(--accent-primary)] hover:underline`}
          >
            View All →
          </button>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="divide-y divide-gray-700/50">
            {upcomingEvents.map(event => {
              const eventDate = new Date(event.event_date)
              return (
                <div 
                  key={event.id}
                  onClick={() => setSelectedEventDetail(event)}
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="text-center">
                    <p className={`text-xs ${tc.textMuted} uppercase`}>{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className={`text-2xl font-bold ${tc.text}`}>{eventDate.getDate()}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{eventDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        event.event_type === 'game' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {event.event_type === 'game' ? '🏐 Game' : '🏋️ Practice'}
                      </span>
                      {event.opponent && <span className={`text-sm ${tc.textSecondary}`}>vs {event.opponent}</span>}
                    </div>
                    <p className={`text-sm ${tc.textSecondary}`}>
                      {event.event_time && formatTime12(event.event_time)}
                      {event.venue_name && ` • ${event.venue_name}`}
                    </p>
                    <p className="text-xs" style={{ color: event.teams?.color || '#EAB308' }}>
                      {event.teams?.name}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${tc.textMuted}`} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
            <p className={`${tc.textSecondary} mt-2`}>No upcoming events</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedEventDetail && (
        <EventDetailModal
          event={selectedEventDetail}
          teams={teams}
          venues={[]}
          onClose={() => setSelectedEventDetail(null)}
          activeView="parent"
        />
      )}

      {showPaymentModal && (
        <PaymentOptionsModal
          amount={paymentSummary.totalDue}
          organization={organization}
          onClose={() => setShowPaymentModal(false)}
          showToast={showToast}
        />
      )}

      {showAddChildModal && (
        <AddChildModal
          existingChildren={registrationData}
          onClose={() => setShowAddChildModal(false)}
          showToast={showToast}
        />
      )}

      {showReRegisterModal && (
        <ReRegisterModal
          player={showReRegisterModal.player}
          season={showReRegisterModal.season}
          onClose={() => setShowReRegisterModal(null)}
          showToast={showToast}
        />
      )}

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  )
}

export { ParentDashboard }
