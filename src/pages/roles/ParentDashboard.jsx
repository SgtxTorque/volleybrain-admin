import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSport } from '../../contexts/SportContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { supabase } from '../../lib/supabase'
import {
  Calendar, MapPin, Users, AlertTriangle, Megaphone
} from '../../constants/icons'
import { usePriorityItems } from '../../components/parent/PriorityCardsEngine'
import { ActionItemsSidebar, QuickRsvpModal } from '../../components/parent/ActionItemsSidebar'
import ParentLeftSidebar from '../../components/parent/ParentLeftSidebar'
import ParentCenterDashboard from '../../components/parent/ParentCenterDashboard'
import ParentRightPanel from '../../components/parent/ParentRightPanel'

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
  const { selectedSport } = useSport()
  const primarySport = selectedSport || { name: 'Volleyball', icon: '🏐' }
  if (!event) return null

  const team = teams?.find(t => t.id === event.team_id)
  const venue = venues?.find(v => v.id === event.venue_id)
  const eventDate = event.event_date ? new Date(event.event_date) : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: team?.color || '#6366F1' }}>
              {event.event_type === 'practice' ? <span className="text-2xl">{primarySport?.icon || '🏐'}</span> :
               event.event_type === 'game' ? <span className="text-2xl">{primarySport?.icon || '🏐'}</span> : '📅'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{event.title || event.event_type}</h2>
              <p className="text-slate-500">{team?.name}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-900">{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className="text-slate-500">{formatTime12(event.event_time)}</p>}
            </div>
          </div>

          {(event.location || venue || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-900">{event.venue_name || event.location || venue?.name}</p>
                {(venue?.address || event.venue_address) && <p className="text-sm text-slate-500">{event.venue_address || venue?.address}</p>}
              </div>
            </div>
          )}

          {(event.opponent || event.opponent_name) && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-400" />
              <p className="text-slate-900">vs {event.opponent_name || event.opponent}</p>
            </div>
          )}

          {event.notes && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">{event.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 transition">
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

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId)
    return player ? `${player.first_name} ${player.last_name}` : 'Unknown'
  }

  const getPlayerFirstName = (playerId) => {
    const player = players.find(p => p.id === playerId)
    return player?.first_name || 'Player'
  }

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

  const feesByPlayer = fees.reduce((acc, fee) => {
    const name = getPlayerName(fee.player_id)
    if (!acc[name]) acc[name] = []
    acc[name].push(fee)
    return acc
  }, {})

  const hasPaymentMethods = organization?.payment_venmo || organization?.payment_zelle || organization?.payment_cashapp

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Make a Payment</h2>
          <div className="flex items-center justify-between mt-2">
            <p className="text-slate-500 text-sm">Total Due</p>
            <p className="text-2xl font-bold text-[var(--accent-primary)]">${amount?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {fees.length > 0 && (
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                className="w-full p-3 flex items-center justify-between text-slate-900 hover:opacity-80"
              >
                <span className="font-medium text-sm">Fee Breakdown</span>
                <span className={`transition-transform ${showFeeBreakdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showFeeBreakdown && (
                <div className="px-3 pb-3 border-t border-slate-200">
                  {Object.entries(feesByPlayer).map(([playerName, playerFees]) => (
                    <div key={playerName} className="mt-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{playerName}</p>
                      {playerFees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-slate-600">{fee.fee_name}</span>
                          <span className="text-slate-900">${fee.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 mt-2 border-t border-slate-200">
                    <span className="text-slate-900">Total</span>
                    <span className="text-[var(--accent-primary)]">${amount?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasPaymentMethods && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Include this note with your payment:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-slate-900 bg-slate-200/60 px-2 py-1 rounded">
                  {paymentNote}
                </code>
                <button
                  onClick={() => copyToClipboard(paymentNote, 'Note')}
                  className={`text-xs px-2 py-1 rounded ${copied === 'Note' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'}`}
                >
                  {copied === 'Note' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {hasPaymentMethods && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Methods</p>

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
                    <p className="text-sm text-slate-500">@{organization.payment_venmo.replace('@', '')}</p>
                  </div>
                  <span className="text-[#008CFF] group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}

              {organization?.payment_zelle && (
                <div className="flex items-center gap-3 p-3 bg-[#6D1ED4]/10 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#6D1ED4] flex items-center justify-center text-white font-bold text-lg">Z</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#6D1ED4]">Zelle</p>
                    <p className="text-sm text-slate-500">{organization.payment_zelle}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(organization.payment_zelle, 'Zelle')}
                    className={`text-sm px-3 py-1 rounded-lg transition ${copied === 'Zelle' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-[#6D1ED4]/20 text-[#6D1ED4] hover:bg-[#6D1ED4]/30'}`}
                  >
                    {copied === 'Zelle' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              )}

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
                    <p className="text-sm text-slate-500">{organization.payment_cashapp}</p>
                  </div>
                  <span className="text-[#00D632] group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}
            </div>
          )}

          {organization?.payment_instructions && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Additional Instructions</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{organization.payment_instructions}</p>
            </div>
          )}

          {!hasPaymentMethods && !organization?.payment_instructions && (
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">💳</p>
              <p className="font-medium text-slate-900">Payment methods coming soon!</p>
              <p className="text-sm text-slate-500 mt-1">Contact your league administrator for payment options.</p>
            </div>
          )}

          {hasPaymentMethods && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
              <span className="text-amber-500">💡</span>
              <p className="text-amber-700 text-sm">
                After sending payment, your admin will mark it as paid within 1-2 business days.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 space-y-2">
          {amount > 100 && (
            <button
              onClick={() => {
                showToast?.('Payment plan requests coming soon!', 'info')
              }}
              className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
            >
              Need a payment plan? Contact admin
            </button>
          )}
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-900 font-medium hover:bg-slate-200 transition">
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add Another Child</h2>
          <p className="text-slate-500 text-sm mt-1">Select a season to register a sibling</p>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : openSeasons.length > 0 ? (
            <>
              {templateChild && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <p className="text-emerald-700 text-sm">
                    Parent info will be pre-filled from {templateChild.first_name}'s registration
                  </p>
                </div>
              )}
              {openSeasons.map(season => (
                <a
                  key={season.id}
                  href={getSiblingRegistrationUrl(season)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-100 transition block"
                >
                  <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
                    {season.sports?.icon || '🏐'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{season.name}</p>
                    <p className="text-sm text-slate-500">{season.organizations?.name}</p>
                  </div>
                  <span className="text-[var(--accent-primary)] font-semibold">Register →</span>
                </a>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-slate-400" />
              <p className="text-slate-500 mt-2">No open registrations at this time</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <button onClick={onClose} className="w-full py-2 rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 transition">
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
  const [copied, setCopied] = useState(false)

  const orgSlug = season.organizations?.slug || 'black-hornets'
  const registrationBaseUrl = season.organizations?.settings?.registration_url || window.location.origin

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Re-Register {player.first_name}</h2>
          <p className="text-slate-500 text-sm mt-1">for {season.name}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
                {season.sports?.icon || '🏅'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{season.name}</p>
                <p className="text-sm text-slate-500">{season.organizations?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-emerald-700 text-sm">
              {player.first_name}'s information will be pre-filled to save time!
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 transition">
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
  if (!alert) return null

  const createdDate = new Date(alert.created_at)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              alert.priority === 'urgent' ? 'bg-red-50 text-red-500' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
            }`}>
              {alert.priority === 'urgent' ? <AlertTriangle className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{alert.title}</h2>
              <p className="text-slate-500">{createdDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-slate-600 whitespace-pre-wrap">{alert.content}</p>
        </div>

        <div className="p-6 border-t border-slate-200">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PARENT DASHBOARD — THIN SHELL
// ============================================
function ParentDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate }) {
  // ============================================
  // ALL HOOKS — BEFORE ANY CONDITIONAL RETURNS
  // ============================================
  const { profile } = useAuth()
  const { orgLogo, orgName, orgTagline } = useOrgBranding()
  const { selectedSport } = useSport()
  const parentTutorial = useParentTutorial()

  // Core state
  const [loading, setLoading] = useState(true)
  const [registrationData, setRegistrationData] = useState([])
  const [teams, setTeams] = useState([])
  const [teamIds, setTeamIds] = useState([])
  const [seasonId, setSeasonId] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [organization, setOrganization] = useState(null)
  const [paymentSummary, setPaymentSummary] = useState({ totalDue: 0, totalPaid: 0, unpaidItems: [] })
  const [openSeasons, setOpenSeasons] = useState([])
  const [alerts, setAlerts] = useState([])
  const [activeChildIdx, setActiveChildIdx] = useState(0)
  const [dismissedAlerts, setDismissedAlerts] = useState([])

  // Modal state
  const [selectedEventDetail, setSelectedEventDetail] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [showReRegisterModal, setShowReRegisterModal] = useState(null)
  const [showActionSidebar, setShowActionSidebar] = useState(false)
  const [quickRsvpEvent, setQuickRsvpEvent] = useState(null)

  // Refs
  const carouselRef = useRef(null)
  const initialLoadDone = useRef(false)

  // Priority engine (Sprint 3.1)
  const organizationId = organization?.id || registrationData[0]?.season?.organizations?.id
  const priorityEngine = usePriorityItems({
    children: registrationData,
    teamIds,
    seasonId,
    organizationId,
  })

  // Derived sport/season
  const primarySport = registrationData[0]?.season?.sports || selectedSport || { name: 'Volleyball', icon: '🏐' }
  const primarySeason = registrationData[0]?.season

  // Stable reference for widget props — prevents re-firing widget useEffects on every render
  const activeChildIdForEffect = (registrationData[activeChildIdx] || registrationData[0])?.id
  const activeChildForWidget = useMemo(() => {
    const child = registrationData[activeChildIdx] || registrationData[0]
    return child ? [child] : []
  }, [activeChildIdForEffect])

  // ============================================
  // DATA LOADING
  // ============================================
  useEffect(() => {
    if (initialLoadDone.current) return
    if (roleContext?.children) {
      initialLoadDone.current = true
      loadParentData()
    } else if (profile?.id) {
      initialLoadDone.current = true
      loadParentDataFromProfile()
    }
  }, [roleContext?.children, profile?.id])

  useEffect(() => {
    loadOpenSeasons()
  }, [])

  async function loadParentDataFromProfile() {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    try {
      const { data: players } = await supabase
        .from('players')
        .select(`
          *,
          team_players(team_id, jersey_number, teams(id, name, color, season_id)),
          season:seasons(id, name, sports(name, icon), organizations(id, name, slug, settings))
        `)
        .eq('parent_account_id', profile.id)

      if (players && players.length > 0) {
        const regData = players.map(p => {
          const teamPlayer = p.team_players?.[0]
          return {
            ...p,
            team: teamPlayer?.teams,
            jersey_number: teamPlayer?.jersey_number || p.jersey_number,
            registrationStatus: teamPlayer ? 'active' : 'pending'
          }
        })

        setRegistrationData(regData)

        const tIds = [...new Set(regData.map(p => p.team?.id).filter(Boolean))]
        setTeamIds(tIds)

        const currentSeasonId = regData[0]?.season?.id
        if (currentSeasonId) {
          setSeasonId(currentSeasonId)
        }

        if (tIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('*')
            .in('id', tIds)
          setTeams(teamsData || [])
        }

        if (regData[0]?.season?.organizations) {
          setOrganization(regData[0].season.organizations)
        }

        await loadUpcomingEvents(tIds, currentSeasonId)
        await loadPaymentSummary(regData)
        await loadAlerts(regData[0]?.season?.organizations?.id)
        parentTutorial?.loadChecklistData?.(regData)
      }
    } catch (err) {
      console.warn('Error loading parent data:', err)
    }
    setLoading(false)
  }

  async function loadParentData() {
    try {
      const children = roleContext.children || []

      const regData = children.map(c => ({
        ...c,
        team: c.team_players?.[0]?.teams,
        jersey_number: c.team_players?.[0]?.jersey_number || c.jersey_number,
        registrationStatus: c.team_players?.[0] ? 'active' : 'pending'
      }))

      setRegistrationData(regData)

      const tIds = [...new Set(children.flatMap(c =>
        c.team_players?.map(tp => tp.team_id) || []
      ).filter(Boolean))]
      setTeamIds(tIds)

      if (tIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .in('id', tIds)
        setTeams(teamsData || [])

        const currentSeasonId = teamsData?.[0]?.season_id
        if (currentSeasonId) {
          setSeasonId(currentSeasonId)
        }

        await loadUpcomingEvents(tIds, currentSeasonId)
      } else {
        await loadUpcomingEvents([], null)
      }

      await loadPaymentSummary(regData)

      if (children[0]?.season?.organizations) {
        setOrganization(children[0].season.organizations)
      }

      const orgId = children[0]?.season?.organizations?.id || children[0]?.season?.organization_id
      if (orgId) {
        await loadAlerts(orgId)
      }

      parentTutorial?.loadChecklistData?.(regData)
    } catch (err) {
      console.warn('Error loading parent data:', err)
    }
    setLoading(false)
  }

  async function loadUpcomingEvents(teamIdsList, passedSeasonId = null) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const effectiveSeasonId = passedSeasonId || seasonId

      if (!teamIdsList?.length) {
        setUpcomingEvents([])
        return
      }

      let query = supabase
        .from('schedule_events')
        .select('*, teams!schedule_events_team_id_fkey(name, color)')
        .in('team_id', teamIdsList)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(10)

      if (effectiveSeasonId) {
        query = query.eq('season_id', effectiveSeasonId)
      }

      const { data } = await query
      setUpcomingEvents(data || [])
    } catch (err) {
      console.warn('Error loading events:', err)
      setUpcomingEvents([])
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
      console.warn('Error loading payments:', err)
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
      console.warn('Error loading alerts:', err)
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
      console.warn('Error loading open seasons:', err)
    }
  }

  // ============================================
  // CALLBACKS
  // ============================================
  const handlePriorityAction = useCallback((item) => {
    switch (item.actionType) {
      case 'payment': setShowPaymentModal(true); break
      case 'waiver': onNavigate?.('waivers'); break
      case 'rsvp': setQuickRsvpEvent(item.data); break
      case 'event-detail': setSelectedEventDetail(item.data); break
      default: break
    }
  }, [onNavigate])

  const handlePhotoUploaded = useCallback((childId, photoUrl) => {
    setRegistrationData(prev => prev.map(p =>
      p.id === childId ? { ...p, photo_url: photoUrl } : p
    ))
    parentTutorial?.completeStep?.('add_player_photo')
  }, [parentTutorial])

  function getRegistrationUrl(season) {
    const orgSlug = season.organizations?.slug || 'black-hornets'
    const baseUrl = season.organizations?.settings?.registration_url || window.location.origin
    return `${baseUrl}/register/${orgSlug}/${season.id}`
  }

  // ============================================
  // CONDITIONAL RETURNS — only AFTER all hooks
  // ============================================
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
      <div className="max-w-2xl mx-auto space-y-6 py-12">
        <div className="text-center">
          <VolleyballIcon className="w-20 h-20 text-[var(--accent-primary)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to VolleyBrain!</h2>
          <p className="text-slate-500">You haven't registered any players yet.</p>
          <p className="text-slate-400 mb-6">Get started by registering for an open season below.</p>
        </div>

        {openSeasons.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Open Registrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openSeasons.map(season => (
                <a
                  key={season.id}
                  href={getRegistrationUrl(season)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-100 transition"
                >
                  <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
                    {season.sports?.icon || '🏐'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{season.name}</p>
                    <p className="text-sm text-slate-500">{season.organizations?.name}</p>
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

  // ============================================
  // DERIVED STATE (after conditional returns)
  // ============================================
  const activeChild = registrationData[activeChildIdx] || registrationData[0]
  const activeTeam = activeChild?.team
  const activeTeamColor = activeTeam?.color || '#6366F1'

  const activeChildEvents = activeTeam
    ? upcomingEvents.filter(e => e.team_id === activeTeam.id)
    : upcomingEvents

  const activeChildUnpaid = paymentSummary.unpaidItems.filter(p => p.player_id === activeChild?.id)

  const playerTeamCombos = registrationData.map((child, idx) => ({
    idx,
    playerId: child.id,
    playerName: `${child.first_name} ${child.last_name || ''}`.trim(),
    firstName: child.first_name,
    teamId: child.team?.id,
    teamName: child.team?.name || 'No team',
    teamColor: child.team?.color || '#6366F1',
    photo: child.photo_url,
    jersey: child.jersey_number,
    position: child.position,
    sport: child.season?.sports || primarySport,
    status: child.registrationStatus,
    hasPendingActions: activeChildUnpaid.length > 0 || priorityEngine.items.some(i => i.playerId === child.id),
  }))

  // ============================================
  // RENDER — 3-COLUMN LAYOUT
  // ============================================
  return (
    <div data-tutorial="dashboard-header" className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">

      {/* LEFT SIDEBAR (280px) */}
      <ParentLeftSidebar
        orgLogo={orgLogo}
        orgName={orgName}
        orgTagline={orgTagline}
        profile={profile}
        registrationData={registrationData}
        teamIds={teamIds}
        seasonId={seasonId}
        organizationId={organizationId}
        organization={organization}
        paymentSummary={paymentSummary}
        activeTeam={activeTeam}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        onShowPayment={() => setShowPaymentModal(true)}
        onShowAddChild={() => setShowAddChildModal(true)}
        handlePriorityAction={handlePriorityAction}
        onShowActionSidebar={() => setShowActionSidebar(true)}
        priorityEngine={priorityEngine}
      />

      {/* CENTER DASHBOARD (flex-1) */}
      <ParentCenterDashboard
        profile={profile}
        activeChild={activeChild}
        activeTeam={activeTeam}
        activeTeamColor={activeTeamColor}
        activeChildEvents={activeChildEvents}
        activeChildUnpaid={activeChildUnpaid}
        playerTeamCombos={playerTeamCombos}
        activeChildIdx={activeChildIdx}
        activeChildForWidget={activeChildForWidget}
        registrationData={registrationData}
        upcomingEvents={upcomingEvents}
        openSeasons={openSeasons}
        teamIds={teamIds}
        alerts={alerts}
        dismissedAlerts={dismissedAlerts}
        onDismissAlert={(id) => setDismissedAlerts(prev => [...prev, id])}
        onSelectChild={setActiveChildIdx}
        onShowAddChild={() => setShowAddChildModal(true)}
        onShowPayment={() => setShowPaymentModal(true)}
        onShowEventDetail={setSelectedEventDetail}
        onShowReRegister={(player, season) => setShowReRegisterModal({ player, season })}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        showToast={showToast}
        onPhotoUploaded={handlePhotoUploaded}
        primarySport={primarySport}
        primarySeason={primarySeason}
        carouselRef={carouselRef}
      />

      {/* RIGHT PANEL (300px) */}
      <ParentRightPanel
        activeChild={activeChild}
        activeTeam={activeTeam}
        activeTeamColor={activeTeamColor}
        activeChildEvents={activeChildEvents}
        seasonId={seasonId}
        onNavigate={onNavigate}
        onShowEventDetail={setSelectedEventDetail}
        sportName={primarySport?.name}
      />

      {/* ═══ MODALS ═══ */}
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

      {/* Action Items Sidebar (Sprint 3.1) */}
      <ActionItemsSidebar
        items={priorityEngine.items}
        onAction={handlePriorityAction}
        onClose={() => setShowActionSidebar(false)}
        isOpen={showActionSidebar}
      />

      {/* Quick RSVP Modal (Sprint 3.1) */}
      {quickRsvpEvent && (
        <QuickRsvpModal
          event={quickRsvpEvent}
          userId={profile?.id}
          onClose={() => setQuickRsvpEvent(null)}
          onRsvp={() => {
            priorityEngine.refresh()
            setQuickRsvpEvent(null)
          }}
          showToast={showToast}
        />
      )}
    </div>
  )
}

export { ParentDashboard }
