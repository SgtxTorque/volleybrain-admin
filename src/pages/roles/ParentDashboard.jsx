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
// Import Dashboard Widgets
import TeamStandingsWidget from '../../components/widgets/parent/TeamStandingsWidget'
import ChildStatsWidget from '../../components/widgets/parent/ChildStatsWidget'
import ChildAchievementsWidget from '../../components/widgets/parent/ChildAchievementsWidget'

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
function PaymentOptionsModal({ amount, organization, fees = [], players = [], onClose, showToast, onRequestPaymentPlan }) {
  const tc = useThemeClasses()
  const [copied, setCopied] = useState(null)
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(true)

  // Get player name by ID
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId)
    return player ? `${player.first_name} ${player.last_name}` : 'Unknown'
  }

  // Get player first name by ID
  const getPlayerFirstName = (playerId) => {
    const player = players.find(p => p.id === playerId)
    return player?.first_name || 'Player'
  }

  // Generate payment note
  const seasonName = players[0]?.season?.name || 'Season'
  const playerNames = [...new Set(fees.map(f => getPlayerFirstName(f.player_id)))].join(', ')
  const paymentNote = `${playerNames} - ${seasonName}`

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      showToast?.(`${label} copied!`, 'success')
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  // Group fees by player
  const feesByPlayer = fees.reduce((acc, fee) => {
    const name = getPlayerName(fee.player_id)
    if (!acc[name]) acc[name] = []
    acc[name].push(fee)
    return acc
  }, {})

  const hasPaymentMethods = organization?.payment_venmo || organization?.payment_zelle || organization?.payment_cashapp

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg shadow-2xl`}>
        {/* Header */}
        <div className={`p-5 border-b ${tc.border}`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>Make a Payment</h2>
          <div className="flex items-center justify-between mt-2">
            <p className={`${tc.textMuted} text-sm`}>Total Due</p>
            <p className="text-2xl font-bold text-[var(--accent-primary)]">${amount?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Fee Breakdown */}
          {fees.length > 0 && (
            <div className={`${tc.cardBgAlt} rounded-xl overflow-hidden`}>
              <button 
                onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                className={`w-full p-3 flex items-center justify-between ${tc.text} hover:opacity-80`}
              >
                <span className="font-medium text-sm">📋 Fee Breakdown</span>
                <span className={`transition-transform ${showFeeBreakdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showFeeBreakdown && (
                <div className={`px-3 pb-3 border-t ${tc.border}`}>
                  {Object.entries(feesByPlayer).map(([playerName, playerFees]) => (
                    <div key={playerName} className="mt-3">
                      <p className={`text-xs font-semibold ${tc.textMuted} uppercase tracking-wide mb-1`}>{playerName}</p>
                      {playerFees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className={tc.textSecondary}>{fee.fee_name}</span>
                          <span className={tc.text}>${fee.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className={`flex justify-between font-semibold pt-2 mt-2 border-t ${tc.border}`}>
                    <span className={tc.text}>Total</span>
                    <span className="text-[var(--accent-primary)]">${amount?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Note */}
          {hasPaymentMethods && (
            <div className={`${tc.cardBgAlt} rounded-xl p-3`}>
              <p className={`text-xs ${tc.textMuted} mb-1`}>Include this note with your payment:</p>
              <div className="flex items-center gap-2">
                <code className={`flex-1 text-sm ${tc.text} bg-black/10 dark:bg-white/10 px-2 py-1 rounded`}>
                  {paymentNote}
                </code>
                <button 
                  onClick={() => copyToClipboard(paymentNote, 'Note')}
                  className={`text-xs px-2 py-1 rounded ${copied === 'Note' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'}`}
                >
                  {copied === 'Note' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {hasPaymentMethods && (
            <div className="space-y-2">
              <p className={`text-xs font-semibold ${tc.textMuted} uppercase tracking-wide`}>Payment Methods</p>
              
              {/* Venmo */}
              {organization?.payment_venmo && (
                <a 
                  href={`https://venmo.com/${organization.payment_venmo.replace('@', '')}?txn=pay&amount=${amount?.toFixed(2) || '0'}&note=${encodeURIComponent(paymentNote)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[#008CFF]/10 hover:bg-[#008CFF]/20 rounded-xl transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#008CFF] flex items-center justify-center text-white font-bold text-lg">V</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#008CFF]">Venmo</p>
                    <p className={`text-sm ${tc.textMuted}`}>@{organization.payment_venmo.replace('@', '')}</p>
                  </div>
                  <span className="text-[#008CFF] group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}
              
              {/* Zelle */}
              {organization?.payment_zelle && (
                <div className="flex items-center gap-3 p-3 bg-[#6D1ED4]/10 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#6D1ED4] flex items-center justify-center text-white font-bold text-lg">Z</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#6D1ED4]">Zelle</p>
                    <p className={`text-sm ${tc.textMuted}`}>{organization.payment_zelle}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(organization.payment_zelle, 'Zelle')}
                    className={`text-sm px-3 py-1 rounded-lg transition ${copied === 'Zelle' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[#6D1ED4]/20 text-[#6D1ED4] hover:bg-[#6D1ED4]/30'}`}
                  >
                    {copied === 'Zelle' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              )}
              
              {/* Cash App */}
              {organization?.payment_cashapp && (
                <a 
                  href={`https://cash.app/${organization.payment_cashapp.replace('$', '')}/${amount?.toFixed(2) || '0'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[#00D632]/10 hover:bg-[#00D632]/20 rounded-xl transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00D632] flex items-center justify-center text-white font-bold text-lg">$</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#00D632]">Cash App</p>
                    <p className={`text-sm ${tc.textMuted}`}>{organization.payment_cashapp}</p>
                  </div>
                  <span className="text-[#00D632] group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}
            </div>
          )}

          {/* Other Instructions */}
          {organization?.payment_instructions && (
            <div className={`${tc.cardBgAlt} rounded-xl p-3`}>
              <p className={`text-xs font-semibold ${tc.textMuted} uppercase tracking-wide mb-2`}>Additional Instructions</p>
              <p className={`text-sm ${tc.textSecondary} whitespace-pre-wrap`}>{organization.payment_instructions}</p>
            </div>
          )}

          {/* No payment methods configured */}
          {!hasPaymentMethods && !organization?.payment_instructions && (
            <div className={`${tc.cardBgAlt} rounded-xl p-6 text-center`}>
              <p className="text-3xl mb-2">💳</p>
              <p className={`font-medium ${tc.text}`}>Payment methods coming soon!</p>
              <p className={`text-sm ${tc.textMuted} mt-1`}>Contact your league administrator for payment options.</p>
            </div>
          )}

          {/* Confirmation Note */}
          {hasPaymentMethods && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
              <span className="text-amber-500">💡</span>
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                After sending payment, your admin will mark it as paid within 1-2 business days.
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`p-5 border-t ${tc.border} space-y-2`}>
          {/* Request Payment Plan - future feature */}
          {amount > 100 && (
            <button 
              onClick={() => {
                showToast?.('Payment plan requests coming soon!', 'info')
                // onRequestPaymentPlan?.()
              }}
              className={`w-full py-2 rounded-xl border ${tc.border} ${tc.textMuted} text-sm hover:bg-black/5 dark:hover:bg-white/5 transition`}
            >
              💬 Need a payment plan? Contact admin
            </button>
          )}
          <button onClick={onClose} className={`w-full py-2.5 rounded-xl ${tc.cardBgAlt} ${tc.text} font-medium hover:opacity-80 transition`}>
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
    const registrationBaseUrl = season.organizations?.settings?.registration_url || window.location.origin
    
    // Note: Prefill params are stored in localStorage via registration-prefill.js
    // The URL params below are kept for backwards compatibility but may not be read
    const prefillParams = new URLSearchParams({
      prefill: 'true',
      parent_name: templateChild?.parent_name || '',
      parent_email: templateChild?.parent_email || '',
      parent_phone: templateChild?.parent_phone || '',
    })
    
    const cleanParams = new URLSearchParams()
    prefillParams.forEach((value, key) => {
      if (value) cleanParams.append(key, value)
    })
    
    return `${registrationBaseUrl}/register/${orgSlug}/${season.id}?${cleanParams.toString()}`
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
  const registrationBaseUrl = season.organizations?.settings?.registration_url || window.location.origin

  // Prefill params for re-registration
  const prefillParams = new URLSearchParams({
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

  const registrationUrl = `${registrationBaseUrl}/register/${orgSlug}/${season.id}?${cleanParams.toString()}`
  
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
  const [teamIds, setTeamIds] = useState([])
  const [seasonId, setSeasonId] = useState(null)
  
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

  // Get primary team and sport for context
  const primaryTeam = teams[0]
  const primarySport = registrationData[0]?.season?.sports || { name: 'Volleyball', icon: '🏐' }
  const primarySeason = registrationData[0]?.season

  useEffect(() => {
    if (roleContext?.children) {
      loadParentData()
    } else {
      loadParentDataFromProfile()
    }
  }, [roleContext, profile])

  async function loadParentDataFromProfile() {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    try {
      // Get all players where this user is the parent
      const { data: players } = await supabase
        .from('players')
        .select(`
          *,
          team_players(team_id, teams(id, name, color, season_id)),
          season:seasons(id, name, sports(name, icon), organizations(id, name, slug, settings))
        `)
        .eq('parent_account_id', profile.id)

      if (players && players.length > 0) {
        // Build registration data from players
        const regData = players.map(p => {
          const teamPlayer = p.team_players?.[0]
          return {
            ...p,
            team: teamPlayer?.teams,
            registrationStatus: teamPlayer ? 'active' : 'pending'
          }
        })
        
        setRegistrationData(regData)
        
        // Get unique team IDs and set season
        const tIds = [...new Set(regData.map(p => p.team?.id).filter(Boolean))]
        setTeamIds(tIds)
        
        if (regData[0]?.season?.id) {
          setSeasonId(regData[0].season.id)
        }

        // Load teams
        if (tIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('*')
            .in('id', tIds)
          setTeams(teamsData || [])
        }

        // Load organization for payments
        if (regData[0]?.season?.organizations) {
          setOrganization(regData[0].season.organizations)
        }

        // Load upcoming events
        await loadUpcomingEvents(tIds)
        
        // Load payment summary
        await loadPaymentSummary(regData)
        
        // Load alerts
        await loadAlerts(regData[0]?.season?.organizations?.id)
      }
    } catch (err) {
      console.error('Error loading parent data:', err)
    }
    setLoading(false)
  }

  async function loadParentData() {
    try {
      const children = roleContext.children || []
      
      // Build registration data
      const regData = children.map(c => ({
        ...c,
        team: c.team_players?.[0]?.teams,
        registrationStatus: c.team_players?.[0] ? 'active' : 'pending'
      }))
      
      setRegistrationData(regData)
      
      // Get unique team IDs
      const tIds = [...new Set(children.flatMap(c => 
        c.team_players?.map(tp => tp.team_id) || []
      ).filter(Boolean))]
      setTeamIds(tIds)

      // Load additional data
      if (tIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .in('id', tIds)
        setTeams(teamsData || [])
        
        // Get season from first team
        if (teamsData?.[0]?.season_id) {
          setSeasonId(teamsData[0].season_id)
        }
      }

      await loadUpcomingEvents(tIds)
      await loadPaymentSummary(regData)
      
      // Load organization
      if (children[0]?.season?.organizations) {
        setOrganization(children[0].season.organizations)
      }
      
      // Load alerts
      const orgId = children[0]?.season?.organizations?.id || children[0]?.season?.organization_id
      if (orgId) {
        await loadAlerts(orgId)
      }
    } catch (err) {
      console.error('Error loading parent data:', err)
    }
    setLoading(false)
  }

  async function loadUpcomingEvents(teamIds) {
    if (!teamIds?.length) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('schedule_events')
        .select('*, teams(name, color)')
        .in('team_id', teamIds)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(5)
      
      setUpcomingEvents(data || [])
    } catch (err) {
      console.error('Error loading events:', err)
    }
  }

  async function loadPaymentSummary(players) {
    if (!players?.length) return
    
    try {
      const playerIds = players.map(p => p.id)
      
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .in('player_id', playerIds)

      if (payments) {
        const unpaid = payments.filter(p => !p.paid)
        const totalDue = unpaid.reduce((sum, p) => sum + (p.amount || 0), 0)
        const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0)
        
        setPaymentSummary({
          totalDue,
          totalPaid,
          unpaidItems: unpaid
        })
      }
    } catch (err) {
      console.error('Error loading payments:', err)
    }
  }

  async function loadAlerts(orgId) {
    if (!orgId) return
    
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
      
      setAlerts(data || [])
    } catch (err) {
      console.error('Error loading alerts:', err)
    }
  }

  async function loadOpenSeasons() {
    try {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('seasons')
        .select('*, sports(name, icon), organizations(id, name, slug, settings)')
        .lte('registration_opens', now)
        .or(`registration_closes.is.null,registration_closes.gte.${now}`)
        .in('status', ['upcoming', 'active'])
      
      setOpenSeasons(data || [])
    } catch (err) {
      console.error('Error loading open seasons:', err)
    }
  }

  useEffect(() => {
    loadOpenSeasons()
  }, [])

  function getRegistrationUrl(season) {
    const orgSlug = season.organizations?.slug || 'black-hornets'
    const baseUrl = season.organizations?.settings?.registration_url || window.location.origin
    return `${baseUrl}/register/${orgSlug}/${season.id}`
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'active':
        return { label: 'Active', bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
      case 'pending':
        return { label: 'Pending', bg: 'bg-amber-500/20', text: 'text-amber-400' }
      case 'waitlist':
        return { label: 'Waitlist', bg: 'bg-blue-500/20', text: 'text-blue-400' }
      default:
        return { label: status || 'Unknown', bg: 'bg-gray-500/20', text: 'text-gray-400' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Empty state - no registered players
  if (registrationData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
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
    <div className="space-y-5">
      {/* ═══ WELCOME HEADER ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {primarySport && <span className="text-2xl">{primarySport.icon}</span>}
          <span className={`text-sm ${tc.textMuted}`}>
            {primarySport?.name || 'Sports'} • {primarySeason?.name || 'Current Season'}
          </span>
        </div>
        <h1 className={`text-3xl font-bold ${tc.text}`}>Welcome back, {parentName}! 👋</h1>
        <p className={tc.textSecondary}>
          Here's what's happening with {registrationData.length === 1 ? registrationData[0].first_name : 'your players'}
        </p>
      </div>

      {/* ═══ ALERTS ═══ */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map(alert => (
            <div 
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`rounded-xl p-3 cursor-pointer transition flex items-center gap-3 ${
                alert.priority === 'urgent'
                  ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/15'
                  : `${tc.cardBg} border ${tc.border} hover:border-[var(--accent-primary)]/40`
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                alert.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
              }`}>
                {alert.priority === 'urgent' ? <AlertTriangle className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${tc.text} truncate`}>{alert.title}</p>
                <p className={`text-xs ${tc.textMuted} truncate`}>{alert.content}</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${tc.textMuted} flex-shrink-0`} />
            </div>
          ))}
        </div>
      )}

      {/* ═══ HERO ROW: Next Up + Balance ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Event Card */}
        <button
          onClick={() => upcomingEvents[0] ? setSelectedEventDetail(upcomingEvents[0]) : onNavigate('schedule')}
          className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5 text-left hover:border-[var(--accent-primary)]/50 transition group`}
        >
          {upcomingEvents.length > 0 ? (() => {
            const evt = upcomingEvents[0]
            const eventDate = new Date(evt.event_date)
            const isGame = evt.event_type === 'game'
            const today = new Date()
            today.setHours(0,0,0,0)
            const evtDay = new Date(eventDate)
            evtDay.setHours(0,0,0,0)
            const daysUntil = Math.ceil((evtDay - today) / (1000 * 60 * 60 * 24))
            const dayLabel = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : eventDate.toLocaleDateString('en-US', { weekday: 'long' })
            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isGame ? 'text-amber-400' : 'text-blue-400'}`}>
                    {isGame ? '🏐 Next Game' : '🏋️ Next Event'}
                  </span>
                  {daysUntil <= 1 && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold animate-pulse">
                      {dayLabel}!
                    </span>
                  )}
                </div>
                <p className={`text-xl font-bold ${tc.text}`}>
                  {dayLabel}{evt.event_time && ` at ${formatTime12(evt.event_time)}`}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {evt.venue_name && (
                    <span className={`text-sm ${tc.textMuted} flex items-center gap-1`}>
                      <MapPin className="w-3.5 h-3.5" /> {evt.venue_name}
                    </span>
                  )}
                  {evt.opponent && <span className={`text-sm ${tc.textSecondary}`}>vs {evt.opponent}</span>}
                </div>
                <p className="text-xs mt-2" style={{ color: evt.teams?.color || 'var(--accent-primary)' }}>
                  {evt.teams?.name}
                </p>
              </>
            )
          })() : (
            <div className="flex flex-col items-center justify-center py-4">
              <Calendar className={`w-10 h-10 ${tc.textMuted} mb-2`} />
              <p className={`font-semibold ${tc.text}`}>No upcoming events</p>
              <p className={`text-sm ${tc.textMuted}`}>Check the schedule →</p>
            </div>
          )}
        </button>

        {/* Balance Card */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
          {paymentSummary.totalDue > 0 ? (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wider text-red-400 mb-2`}>💰 Balance Due</p>
              <p className="text-3xl font-bold text-red-400">${paymentSummary.totalDue.toFixed(2)}</p>
              <p className={`text-sm ${tc.textMuted} mb-3`}>{paymentSummary.unpaidItems.length} unpaid fees</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate('payments')}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className={`px-4 py-2.5 rounded-xl border ${tc.border} ${tc.text} text-sm hover:bg-white/5 transition`}
                >
                  Details
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 h-full">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className={`text-xl font-bold ${tc.text}`}>All Paid Up! 🎉</p>
                <p className={`text-sm ${tc.textMuted}`}>{paymentSummary.totalPaid > 0 ? `$${paymentSummary.totalPaid.toFixed(2)} paid this season` : "You're all set"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MY PLAYERS ═══ */}
      <div>
        <h2 className={`font-semibold ${tc.text} flex items-center gap-2 mb-3`}>
          <Users className="w-5 h-5" /> My Players
        </h2>
        <div className="space-y-3">
          {registrationData.map(player => {
            const statusBadge = getStatusBadge(player.registrationStatus)
            const teamColor = player.team?.color || '#6366F1'
            const playerEvent = upcomingEvents.find(e => player.team && e.team_id === player.team.id)
            const playerUnpaid = paymentSummary.unpaidItems.filter(p => p.player_id === player.id)
            
            return (
              <div 
                key={player.id}
                className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden hover:border-[var(--accent-primary)]/50 transition`}
                style={{ borderLeftWidth: '4px', borderLeftColor: teamColor }}
              >
                <div className="p-4">
                  {/* Top row: Avatar + Name + Status */}
                  <div className="flex items-center gap-3 mb-3">
                    <div onClick={() => onNavigate(`player-${player.id}`)} className="cursor-pointer">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.first_name} className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: teamColor }}>
                          {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p 
                          className={`font-bold text-lg ${tc.text} cursor-pointer hover:text-[var(--accent-primary)] transition`}
                          onClick={() => onNavigate(`player-${player.id}`)}
                        >
                          {player.first_name} {player.last_name}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: teamColor }}>
                        {player.team?.name || player.season?.name || 'Unassigned'}
                      </p>
                    </div>
                    {playerUnpaid.length > 0 ? (
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400">
                          ${playerUnpaid.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-red-400/70">{playerUnpaid.length} unpaid</p>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}
                  </div>

                  {/* Info row: next event + quick links */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {playerEvent ? (
                      <button 
                        onClick={() => setSelectedEventDetail(playerEvent)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          playerEvent.event_type === 'game' 
                            ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' 
                            : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {playerEvent.event_type === 'game' ? '🏐' : '🏋️'}{' '}
                        {new Date(playerEvent.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {playerEvent.event_time && ` ${formatTime12(playerEvent.event_time)}`}
                      </button>
                    ) : (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${tc.textMuted} ${tc.cardBgAlt}`}>
                        <Calendar className="w-3 h-3" /> No upcoming events
                      </span>
                    )}
                    
                    {player.jersey_number && (
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tc.cardBgAlt} ${tc.textSecondary}`}>
                        #{player.jersey_number}
                      </span>
                    )}
                    
                    {player.team && (
                      <button 
                        onClick={() => navigateToTeamWall?.(player.team.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition`}
                      >
                        <Users className="w-3 h-3" /> Team Hub
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Add Another Child */}
          <button
            onClick={() => setShowAddChildModal(true)}
            className={`w-full ${tc.cardBg} border ${tc.border} border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 hover:border-[var(--accent-primary)]/50 transition`}
          >
            <Plus className={`w-5 h-5 ${tc.textMuted}`} />
            <span className={tc.textMuted}>Add Another Child</span>
          </button>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { id: 'schedule', icon: Calendar, label: 'Schedule', color: '#3B82F6' },
          { id: 'messages', icon: MessageCircle, label: 'Messages', color: '#8B5CF6' },
          { id: 'standings', icon: Target, label: 'Standings', color: '#EF4444' },
          { id: 'leaderboards', icon: ClipboardList, label: 'Stats', color: '#F59E0B' },
          { id: 'achievements', icon: () => <span className="text-lg">🏆</span>, label: 'Awards', color: '#10B981' },
        ].map(action => (
          <button
            key={action.id}
            onClick={() => onNavigate(action.id)}
            className={`${tc.cardBg} border ${tc.border} rounded-xl py-3 px-2 text-center hover:border-[var(--accent-primary)]/50 hover:scale-[1.02] transition`}
          >
            <div className="flex justify-center mb-1">
              {typeof action.icon === 'function' 
                ? action.icon()
                : <action.icon className="w-5 h-5" style={{ color: action.color }} />
              }
            </div>
            <p className={`text-xs font-medium ${tc.text}`}>{action.label}</p>
          </button>
        ))}
      </div>

      {/* ═══ REGISTRATION BANNER ═══ */}
      {openSeasons.length > 0 && (
        <div className="bg-gradient-to-r from-[var(--accent-primary)]/15 to-purple-500/15 border border-[var(--accent-primary)]/30 rounded-2xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className={`font-semibold text-sm ${tc.text}`}>New Season Registration Open!</p>
                <p className={`text-xs ${tc.textSecondary}`}>{openSeasons[0].name} - {openSeasons[0].organizations?.name}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {registrationData.map(player => (
                <button
                  key={player.id}
                  onClick={() => setShowReRegisterModal({ player, season: openSeasons[0] })}
                  className="px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg text-xs font-medium hover:brightness-110 transition"
                >
                  Register {player.first_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ UPCOMING SCHEDULE ═══ */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`font-semibold text-sm ${tc.text}`}>📅 Upcoming Schedule</h2>
          <button onClick={() => onNavigate('schedule')} className={`text-xs text-[var(--accent-primary)] hover:underline`}>
            View All →
          </button>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="divide-y divide-gray-700/30">
            {upcomingEvents.slice(0, 5).map(event => {
              const eventDate = new Date(event.event_date)
              const isGame = event.event_type === 'game'
              return (
                <div 
                  key={event.id}
                  onClick={() => setSelectedEventDetail(event)}
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="text-center w-12 flex-shrink-0">
                    <p className={`text-xs ${tc.textMuted} uppercase leading-tight`}>{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className={`text-lg font-bold ${tc.text} leading-tight`}>{eventDate.getDate()}</p>
                    <p className={`text-xs ${tc.textMuted} leading-tight`}>{eventDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                  </div>
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.teams?.color || '#6366F1' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isGame ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {isGame ? '🏐 Game' : '🏋️ Practice'}
                      </span>
                      {event.opponent && <span className={`text-xs ${tc.textSecondary}`}>vs {event.opponent}</span>}
                    </div>
                    <p className={`text-xs ${tc.textMuted} mt-0.5`}>
                      {event.event_time && formatTime12(event.event_time)}
                      {event.venue_name && ` • ${event.venue_name}`}
                    </p>
                    <p className="text-xs font-medium" style={{ color: event.teams?.color || '#EAB308' }}>{event.teams?.name}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${tc.textMuted} flex-shrink-0`} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className={`w-10 h-10 mx-auto ${tc.textMuted} mb-2`} />
            <p className={`text-sm ${tc.textSecondary}`}>No upcoming events</p>
          </div>
        )}
      </div>

      {/* ═══ STATS & ACHIEVEMENTS ROW ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamIds.length > 0 && (
          <TeamStandingsWidget teamId={teamIds[0]} onViewStandings={() => onNavigate?.('standings')} />
        )}
        {registrationData.length > 0 && (
          <ChildAchievementsWidget children={registrationData} onViewAchievements={() => onNavigate?.('achievements')} />
        )}
      </div>

      {registrationData.length > 0 && (
        <ChildStatsWidget children={registrationData} onViewLeaderboards={() => onNavigate?.('leaderboards')} />
      )}

      {/* Invite Friends CTA */}
      <button
        onClick={() => onNavigate('invite')}
        className={`w-full ${tc.cardBg} border ${tc.border} rounded-2xl p-4 flex items-center justify-center gap-3 hover:border-[var(--accent-primary)]/50 transition group`}
      >
        <Megaphone className={`w-5 h-5 ${tc.textMuted} group-hover:text-[var(--accent-primary)] transition`} />
        <span className={`text-sm font-medium ${tc.textSecondary} group-hover:text-[var(--accent-primary)] transition`}>
          Know someone who'd love to play? Invite them! →
        </span>
      </button>

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
          fees={paymentSummary.unpaidItems}
          players={registrationData}
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
