import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { supabase } from '../../lib/supabase'
import {
  Calendar, MapPin, Clock, Users, DollarSign, ChevronRight, ChevronLeft,
  Check, AlertTriangle, Plus, RefreshCw, X, ExternalLink, ClipboardList,
  MessageCircle, Megaphone, Target, Copy, CreditCard, Bell, Send,
  Award, BarChart3, Star, Trophy, User as UserCircle
} from '../../constants/icons'
// Import Dashboard Widgets
import TeamStandingsWidget from '../../components/widgets/parent/TeamStandingsWidget'
import ChildStatsWidget from '../../components/widgets/parent/ChildStatsWidget'
import ChildAchievementsWidget from '../../components/widgets/parent/ChildAchievementsWidget'
import { ParentChecklistWidget } from '../../components/parent/ParentOnboarding'
// Priority Cards Engine — Sprint 3.1
import { usePriorityItems, PriorityCardsList, ActionBadge } from '../../components/parent/PriorityCardsEngine'
import { ActionItemsSidebar, QuickRsvpModal } from '../../components/parent/ActionItemsSidebar'

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
      <div className={`bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl`} onClick={e => e.stopPropagation()}>
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
// MAIN PARENT DASHBOARD
// ============================================
// Badge definitions — shared with PlayerCardExpanded
const BADGE_DEFS = {
  'ace_sniper': { name: 'Ace Sniper', icon: '🏐', color: '#F59E0B', rarity: 'Rare' },
  'kill_shot': { name: 'Kill Shot', icon: '⚡', color: '#EF4444', rarity: 'Epic' },
  'heart_breaker': { name: 'Heart Breaker', icon: '💜', color: '#EC4899', rarity: 'Rare' },
  'ground_zero': { name: 'Ground Zero', icon: '💎', color: '#06B6D4', rarity: 'Uncommon' },
  'iron_fortress': { name: 'Iron Fortress', icon: '🛡️', color: '#6366F1', rarity: 'Legendary' },
  'puppet_master': { name: 'Puppet Master', icon: '🎭', color: '#F59E0B', rarity: 'Epic' },
  'ace_master': { name: 'Ace Master', icon: '🎯', color: '#10B981', rarity: 'Rare' },
  'dig_machine': { name: 'Dig Machine', icon: '💪', color: '#8B5CF6', rarity: 'Uncommon' },
  'mvp': { name: 'MVP', icon: '⭐', color: '#EF4444', rarity: 'Legendary' },
  'team_player': { name: 'Team Player', icon: '🤝', color: '#3B82F6', rarity: 'Common' },
  'first_practice': { name: 'First Practice', icon: '🌟', color: '#F59E0B', rarity: 'Common' },
  'perfect_attendance': { name: 'Perfect Attendance', icon: '⭐', color: '#10B981', rarity: 'Rare' },
  'attendance_streak_5': { name: '5 Game Streak', icon: '🔥', color: '#EF4444', rarity: 'Uncommon' },
  'attendance_streak_10': { name: '10 Game Streak', icon: '💥', color: '#EF4444', rarity: 'Rare' },
  'first_game': { name: 'Game Day', icon: '🎮', color: '#3B82F6', rarity: 'Common' },
  'first_win': { name: 'Winner', icon: '🥇', color: '#F59E0B', rarity: 'Common' },
  'tournament_ready': { name: 'Tournament Ready', icon: '🎯', color: '#8B5CF6', rarity: 'Rare' },
}

const RARITY_COLORS = { 'Common': '#6B7280', 'Uncommon': '#10B981', 'Rare': '#3B82F6', 'Epic': '#8B5CF6', 'Legendary': '#F59E0B' }

// Sport-aware leaderboard categories
const SPORT_LEADERBOARD = {
  volleyball: [
    { cat: 'Kills', color: '#f59e0b' }, { cat: 'Aces', color: '#3b82f6' },
    { cat: 'Digs', color: '#8b5cf6' }, { cat: 'Assists', color: '#10b981' },
  ],
  basketball: [
    { cat: 'Points', color: '#f59e0b' }, { cat: 'Rebounds', color: '#06b6d4' },
    { cat: 'Assists', color: '#10b981' }, { cat: 'Steals', color: '#8b5cf6' },
  ],
  soccer: [
    { cat: 'Goals', color: '#f59e0b' }, { cat: 'Assists', color: '#10b981' },
    { cat: 'Shots', color: '#06b6d4' }, { cat: 'Saves', color: '#8b5cf6' },
  ],
  baseball: [
    { cat: 'Hits', color: '#f59e0b' }, { cat: 'Runs', color: '#10b981' },
    { cat: 'RBIs', color: '#06b6d4' }, { cat: 'HRs', color: '#ef4444' },
  ],
  softball: [
    { cat: 'Hits', color: '#f59e0b' }, { cat: 'Runs', color: '#10b981' },
    { cat: 'RBIs', color: '#06b6d4' }, { cat: 'HRs', color: '#ef4444' },
  ],
  football: [
    { cat: 'Pass Yds', color: '#f59e0b' }, { cat: 'Rush Yds', color: '#06b6d4' },
    { cat: 'TDs', color: '#ef4444' }, { cat: 'Tackles', color: '#8b5cf6' },
  ],
  'flag football': [
    { cat: 'Pass Yds', color: '#f59e0b' }, { cat: 'Rush Yds', color: '#06b6d4' },
    { cat: 'TDs', color: '#ef4444' }, { cat: 'Tackles', color: '#8b5cf6' },
  ],
  hockey: [
    { cat: 'Goals', color: '#f59e0b' }, { cat: 'Assists', color: '#10b981' },
    { cat: 'Shots', color: '#06b6d4' }, { cat: 'Saves', color: '#8b5cf6' },
  ],
}

// Starter badges shown when player has no data yet
const STARTER_BADGES = [
  { badge_id: 'first_practice', hint: 'Attend your first practice' },
  { badge_id: 'first_game', hint: 'Play your first game' },
  { badge_id: 'first_win', hint: 'Win your first game' },
  { badge_id: 'attendance_streak_5', hint: 'Attend 5 events in a row' },
  { badge_id: 'team_player', hint: 'Be a great teammate this season' },
]

function ParentDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate }) {
  const { profile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { orgLogo, orgName, orgTagline, hasCustomBranding, accentColor: orgAccent } = useOrgBranding()
  const { selectedSport } = useSport()
  const journey = useJourney()
  const parentTutorial = useParentTutorial()

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

  // Active child / selected player-team combo
  const [activeChildIdx, setActiveChildIdx] = useState(0)
  const [dismissedAlerts, setDismissedAlerts] = useState([])
  const [teamRecord, setTeamRecord] = useState(null)
  const [playerBadges, setPlayerBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])

  // Chat preview state
  const [chatMessages, setChatMessages] = useState([])
  const [chatReplyText, setChatReplyText] = useState('')

  // Team hub preview state
  const [latestPost, setLatestPost] = useState(null)

  // Action Items sidebar state (Sprint 3.1)
  const [showActionSidebar, setShowActionSidebar] = useState(false)
  const [quickRsvpEvent, setQuickRsvpEvent] = useState(null)

  // Carousel scroll ref
  const carouselRef = useRef(null)

  // Guard: prevent double-load when both profile and roleContext arrive in sequence
  const initialLoadDone = useRef(false)

  // Get parent's name from profile or first child's parent_name
  const parentName = profile?.full_name?.split(' ')[0] || registrationData[0]?.parent_name?.split(' ')[0] || 'Parent'

  // Get primary team and sport for context
  const primaryTeam = teams[0]
  const primarySport = registrationData[0]?.season?.sports || { name: 'Volleyball', icon: '🏐' }
  const primarySeason = registrationData[0]?.season

  // Priority Cards Engine (Sprint 3.1)
  const organizationId = organization?.id || registrationData[0]?.season?.organizations?.id
  const priorityEngine = usePriorityItems({
    children: registrationData,
    teamIds,
    seasonId,
    organizationId,
  })

  // Handle priority card actions
  function handlePriorityAction(item) {
    switch (item.actionType) {
      case 'payment':
        setShowPaymentModal(true)
        break
      case 'waiver':
        onNavigate?.('waivers')
        break
      case 'rsvp':
        setQuickRsvpEvent(item.data)
        break
      case 'event-detail':
        setSelectedEventDetail(item.data)
        break
      default:
        break
    }
  }

  useEffect(() => {
    // Only load data once — whichever source arrives first wins.
    // Both loadParentData and loadParentDataFromProfile query the same data,
    // so there's no benefit to re-loading when the second source arrives.
    if (initialLoadDone.current) return

    if (roleContext?.children) {
      initialLoadDone.current = true
      loadParentData()
    } else if (profile?.id) {
      initialLoadDone.current = true
      loadParentDataFromProfile()
    }
  }, [roleContext?.children, profile?.id])

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
      console.error('Error loading parent data:', err)
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
      console.error('Error loading parent data:', err)
    }
    setLoading(false)
  }

  async function loadUpcomingEvents(teamIds, passedSeasonId = null) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const effectiveSeasonId = passedSeasonId || seasonId

      if (!teamIds?.length) {
        setUpcomingEvents([])
        return
      }

      let query = supabase
        .from('schedule_events')
        .select('*, teams!schedule_events_team_id_fkey(name, color)')
        .in('team_id', teamIds)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(10)

      if (effectiveSeasonId) {
        query = query.eq('season_id', effectiveSeasonId)
      }

      const { data, error } = await query
      setUpcomingEvents(data || [])
    } catch (err) {
      console.error('Error loading events:', err)
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

  // All secondary loaders accept a cancelled flag to prevent stale state updates
  async function loadTeamRecord(teamId, cancelled) {
    if (!teamId) return
    try {
      const { data, error } = await supabase
        .from('team_standings')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle()
      if (cancelled?.current) return
      if (error) {
        console.warn('team_standings query failed (table may not exist):', error.message)
        setTeamRecord(null)
        return
      }
      setTeamRecord(data)
    } catch (err) {
      if (cancelled?.current) return
      console.warn('team_standings fetch error:', err.message)
      setTeamRecord(null)
    }
  }

  async function loadPlayerBadges(playerId, cancelled) {
    if (!playerId) return
    try {
      const { data, error } = await supabase
        .from('player_badges')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
      if (cancelled?.current) return
      if (error) {
        console.warn('player_badges query failed:', error.message)
        setPlayerBadges([])
      } else {
        setPlayerBadges(data || [])
      }
    } catch {
      if (cancelled?.current) return
      setPlayerBadges([])
    }
    try {
      const { data, error } = await supabase
        .from('player_achievement_progress')
        .select('*')
        .eq('player_id', playerId)
      if (cancelled?.current) return
      if (error) {
        console.warn('player_achievement_progress query failed:', error.message)
        setBadgesInProgress([])
      } else {
        setBadgesInProgress(data || [])
      }
    } catch {
      if (cancelled?.current) return
      setBadgesInProgress([])
    }
  }

  async function loadLatestPost(teamId, cancelled) {
    if (!teamId) return
    try {
      const { data, error } = await supabase
        .from('team_posts')
        .select('*, profiles:author_id(full_name, avatar_url)')
        .eq('team_id', teamId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
      if (cancelled?.current) return
      if (error) {
        console.warn('team_posts query failed:', error.message)
        setLatestPost(null)
        return
      }
      setLatestPost(data?.[0] || null)
    } catch {
      if (cancelled?.current) return
      setLatestPost(null)
    }
  }

  async function loadChatMessages(teamId, cancelled) {
    if (!teamId) return
    try {
      const { data: channel, error: chErr } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('team_id', teamId)
        .eq('channel_type', 'team_chat')
        .maybeSingle()
      if (cancelled?.current) return
      if (chErr || !channel) {
        if (chErr) console.warn('chat_channels query failed:', chErr.message)
        setChatMessages([])
        return
      }
      const { data: messages, error: msgErr } = await supabase
        .from('chat_messages')
        .select('*, profiles:sender_id(full_name, avatar_url)')
        .eq('channel_id', channel.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(3)
      if (cancelled?.current) return
      if (msgErr) {
        console.warn('chat_messages query failed:', msgErr.message)
        setChatMessages([])
        return
      }
      setChatMessages((messages || []).reverse())
    } catch {
      if (cancelled?.current) return
      setChatMessages([])
    }
  }

  // Derive stable primitive IDs for dependency tracking (prevents re-fire on array reference change)
  const activeChildIdForEffect = (registrationData[activeChildIdx] || registrationData[0])?.id
  const activeTeamIdForEffect = (registrationData[activeChildIdx] || registrationData[0])?.team?.id

  // Re-load team record, badges, posts, chat when active child/team actually changes
  useEffect(() => {
    const cancelled = { current: false }
    if (activeTeamIdForEffect) {
      loadTeamRecord(activeTeamIdForEffect, cancelled)
      loadLatestPost(activeTeamIdForEffect, cancelled)
      loadChatMessages(activeTeamIdForEffect, cancelled)
    }
    if (activeChildIdForEffect) loadPlayerBadges(activeChildIdForEffect, cancelled)
    return () => { cancelled.current = true }
  }, [activeChildIdx, activeChildIdForEffect, activeTeamIdForEffect])

  // Stable reference for widget props — prevents re-firing widget useEffects on every render
  // MUST be before any early returns (Rules of Hooks)
  const activeChildForWidget = useMemo(() => {
    const child = registrationData[activeChildIdx] || registrationData[0]
    return child ? [child] : []
  }, [activeChildIdForEffect])

  function getStatusBadge(status) {
    switch (status) {
      case 'active':
        return { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' }
      case 'pending':
        return { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' }
      case 'waitlist':
        return { label: 'Waitlist', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' }
      default:
        return { label: status || 'Unknown', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }
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

  // =============================================
  // Derived state for active child
  // =============================================
  const activeChild = registrationData[activeChildIdx] || registrationData[0]
  const activeTeam = activeChild?.team
  const activeTeamColor = activeTeam?.color || '#6366F1'

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id))

  // Find active child's events
  const activeChildEvents = activeTeam
    ? upcomingEvents.filter(e => e.team_id === activeTeam.id)
    : upcomingEvents
  const nextChildEvent = activeChildEvents[0]

  // Active child's unpaid items
  const activeChildUnpaid = paymentSummary.unpaidItems.filter(p => p.player_id === activeChild?.id)

  // Build player+team combos for carousel
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

  // =============================================
  // RENDER — 3-COLUMN LAYOUT
  // =============================================
  return (
    <div data-tutorial="dashboard-header" className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">

        {/* ═══════════════════════════════════════ */}
        {/* LEFT SIDEBAR (280px) — Parent Command Center */}
        {/* ═══════════════════════════════════════ */}
        <aside className="hidden xl:flex w-[280px] shrink-0 flex-col border-r border-slate-200/60 bg-white overflow-y-auto p-5 space-y-5">

          {/* 3A. Org Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            {orgLogo ? (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                  <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{orgName}</p>
                  {orgTagline && <p className="text-xs text-slate-500 truncate">{orgTagline}</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  <VolleyballIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">VolleyBrain</p>
                </div>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{profile?.full_name || 'Parent'}</p>
                  <p className="text-xs text-slate-500">Parent</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3B. Parent Stats */}
          <div className="flex gap-2">
            {[
              { value: registrationData.length, label: 'Players' },
              { value: [...new Set(registrationData.map(c => c.season?.id).filter(Boolean))].length, label: 'Seasons' },
              { value: teamIds.length, label: 'Teams' },
            ].map(stat => (
              <div key={stat.label} className="flex-1 bg-slate-50 rounded-xl px-3 py-3 text-center">
                <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 uppercase font-semibold tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 3C. Payment Summary Card */}
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => paymentSummary.totalDue > 0 ? setShowPaymentModal(true) : onNavigate?.('payments')}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Payment Status</h3>
            {paymentSummary.totalDue > 0 ? (
              <>
                <p className="text-2xl font-black text-red-500">${paymentSummary.totalDue.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Balance due</p>
                {paymentSummary.totalPaid > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (paymentSummary.totalPaid / (paymentSummary.totalDue + paymentSummary.totalPaid)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">${paymentSummary.totalPaid.toFixed(2)} paid</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-600">All Paid Up</p>
                  <p className="text-xs text-slate-400">No outstanding balance</p>
                </div>
              </div>
            )}
          </div>

          {/* 3D. Needs Attention Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Needs Attention</h3>
              {priorityEngine.count > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  {priorityEngine.count}
                </span>
              )}
            </div>
            {priorityEngine.count > 0 ? (
              <div className="space-y-2">
                {priorityEngine.items.slice(0, 3).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handlePriorityAction(item)}
                    className="w-full flex items-center justify-between py-2 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        item.actionType === 'payment' ? 'bg-red-50 text-red-500' :
                        item.actionType === 'waiver' ? 'bg-purple-50 text-purple-500' :
                        item.actionType === 'rsvp' ? 'bg-blue-50 text-blue-500' :
                        'bg-amber-50 text-amber-500'
                      }`}>
                        {item.actionType === 'payment' ? '💰' : item.actionType === 'waiver' ? '📋' : item.actionType === 'rsvp' ? '📅' : '⚠️'}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-slate-900">{item.title || item.label}</div>
                        {item.subtitle && <div className="text-xs text-slate-500">{item.subtitle}</div>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
                  </button>
                ))}
                {priorityEngine.count > 3 && (
                  <button
                    onClick={() => setShowActionSidebar(true)}
                    className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition w-full text-left pt-1"
                  >
                    View All {priorityEngine.count} items →
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">All caught up!</p>
                  <p className="text-xs text-slate-400">Nothing needs your attention</p>
                </div>
              </div>
            )}
          </div>

          {/* 3E. Quick Actions (2x2 Grid) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Calendar', icon: Calendar, action: () => onNavigate?.('schedule') },
                { label: 'Team Hub', icon: Users, action: () => navigateToTeamWall?.(activeTeam?.id) },
                { label: 'Register', icon: ClipboardList, action: () => setShowAddChildModal(true) },
                { label: 'Payments', icon: CreditCard, action: () => onNavigate?.('payments') },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <btn.icon className="w-5 h-5 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-700">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3F. Badge Progress Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge Progress</h3>
              <button onClick={() => onNavigate('achievements')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
                View All →
              </button>
            </div>
            {playerBadges.length > 0 ? (
              <div className="flex gap-3 flex-wrap">
                {playerBadges.slice(0, 3).map((b, i) => {
                  const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280', rarity: 'Common' }
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                      >
                        {def.icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 text-center max-w-[60px] leading-tight">{def.name}</span>
                    </div>
                  )
                })}
              </div>
            ) : badgesInProgress.length > 0 ? (
              <div className="space-y-3">
                {badgesInProgress.slice(0, 2).map((b, i) => {
                  const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280' }
                  const pct = b.target > 0 ? Math.min((b.progress / b.target) * 100, 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                      >
                        {def.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700 truncate">{def.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{b.progress}/{b.target}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-2">No badges earned yet</p>
            )}
          </div>

          {/* Getting Started Checklist (compact) */}
          <ParentChecklistWidget
            onNavigate={onNavigate}
            onTeamHub={() => navigateToTeamWall?.(activeTeam?.id)}
            activeTeam={activeTeam}
            compact
          />
        </aside>

        {/* ═══════════════════════════════════════ */}
        {/* CENTER DASHBOARD (flex-1) — The Main Stage */}
        {/* ═══════════════════════════════════════ */}
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto py-6 px-6 min-w-0">

          {/* Alerts */}
          {visibleAlerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${
                alert.priority === 'urgent'
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/20'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                alert.priority === 'urgent' ? 'bg-white/20' : 'bg-amber-50'
              }`}>
                {alert.priority === 'urgent' ? '🚨' : '📣'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${alert.priority === 'urgent' ? 'text-white' : 'text-slate-900'}`}>{alert.title}</p>
                <p className={`text-xs mt-0.5 ${alert.priority === 'urgent' ? 'text-red-100' : 'text-slate-500'}`}>{alert.content}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDismissedAlerts(prev => [...prev, alert.id]); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                  alert.priority === 'urgent'
                    ? 'bg-white/25 text-white hover:bg-white/35'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                }`}
              >
                {alert.priority === 'urgent' ? 'Got It' : 'Dismiss'}
              </button>
            </div>
          ))}

          {/* Welcome Message */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Parent'} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {registrationData.length} {registrationData.length === 1 ? 'player' : 'players'} registered
              {activeTeam ? ` · ${activeTeam.name}` : ''}
            </p>
          </div>

          {/* 4A. Hero Player Card */}
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            data-tutorial="player-card"
          >
            {activeChild ? (
            <div className="flex" style={{ minHeight: '440px' }}>
              {/* Photo Column */}
              <div className="w-[280px] min-w-[280px] relative overflow-hidden flex-shrink-0 group">
                <div className="absolute inset-0" style={{
                  background: `linear-gradient(135deg, ${activeTeamColor} 0%, ${activeTeamColor}cc 40%, #1e293b 100%)`
                }} />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `radial-gradient(circle at 30% 50%, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
                {activeChild?.photo_url ? (
                  <img src={activeChild.photo_url} alt={activeChild.first_name} className="absolute inset-0 w-full h-full object-cover object-top z-[1]" />
                ) : (
                  <div className="absolute inset-0 z-[1] flex items-center justify-center">
                    <span className="text-[80px] font-black text-white/15 tracking-tighter">
                      {activeChild?.first_name?.[0]}{activeChild?.last_name?.[0]}
                    </span>
                  </div>
                )}

                {/* Upload photo button */}
                <label className="absolute inset-0 z-[3] flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !activeChild?.id) return

                      const ext = file.name.split('.').pop()
                      const filePath = `${activeChild.id}.${ext}`

                      const { error: uploadError } = await supabase.storage
                        .from('player-photos')
                        .upload(filePath, file, { upsert: true })

                      if (uploadError) {
                        showToast?.('Upload failed: ' + uploadError.message, 'error')
                        return
                      }

                      const { data: urlData } = supabase.storage
                        .from('player-photos')
                        .getPublicUrl(filePath)

                      const photoUrl = urlData?.publicUrl + '?t=' + Date.now()

                      const { error: updateError } = await supabase
                        .from('players')
                        .update({ photo_url: photoUrl })
                        .eq('id', activeChild.id)

                      if (updateError) {
                        showToast?.('Failed to save: ' + updateError.message, 'error')
                        return
                      }

                      setRegistrationData(prev => prev.map(p =>
                        p.id === activeChild.id ? { ...p, photo_url: photoUrl } : p
                      ))
                      showToast?.('Photo updated!', 'success')
                      parentTutorial?.completeStep?.('add_player_photo')
                    }}
                  />
                  <div className="text-center text-white">
                    <div className="text-3xl mb-1">📷</div>
                    <div className="text-xs font-bold">{activeChild?.photo_url ? 'Change Photo' : 'Upload Photo'}</div>
                  </div>
                </label>

                {/* Jersey number badge */}
                {activeChild?.jersey_number && (
                  <div className="absolute top-4 right-4 z-[3]">
                    <div className="text-4xl font-black text-white drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                      #{activeChild.jersey_number}
                    </div>
                  </div>
                )}

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-[2] px-5 pb-5 pt-16" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}>
                  <div className="uppercase font-black leading-none tracking-tight">
                    <span className="block text-sm text-white/70">{activeChild?.first_name}</span>
                    <span className="block text-2xl text-white mt-0.5">{activeChild?.last_name}</span>
                  </div>
                  <div className="mt-2">
                    {(() => {
                      const badge = getStatusBadge(activeChild?.registrationStatus)
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm ${
                          badge.label === 'Active' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' :
                          badge.label === 'Pending' ? 'bg-amber-500/30 text-amber-300 border border-amber-400/30' :
                          'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Info Column */}
              <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Top Identity Bar */}
                <div className="flex items-stretch border-b border-slate-200">
                  <div className="flex items-center justify-center px-6 border-r border-slate-200" style={{ minWidth: '90px' }}>
                    <span className="text-3xl font-black" style={{ color: activeTeamColor }}>
                      {activeChild?.jersey_number ? `#${activeChild.jersey_number}` : '—'}
                    </span>
                  </div>
                  <div className="flex-1 px-5 py-4 border-r border-slate-200">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: activeTeamColor }}>
                        {primarySport?.icon || '🏐'}
                      </div>
                      <div className="text-base font-bold text-slate-900">{activeTeam?.name || 'Unassigned'}</div>
                    </div>
                    <div className="text-sm text-slate-500">{activeChild?.position || 'Player'} · {primarySeason?.name || 'Current Season'}</div>
                  </div>
                  <div className="flex items-center gap-3 px-5">
                    {(() => {
                      const badge = getStatusBadge(activeChild?.registrationStatus)
                      return (
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${badge.bg} ${badge.text} border border-current/20`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      )
                    })()}
                    {activeChildUnpaid.length > 0 ? (
                      <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
                        ${activeChildUnpaid.reduce((s,p) => s + (parseFloat(p.amount)||0), 0).toFixed(2)} due
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Paid Up
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex border-b border-slate-200">
                  {[
                    { label: 'Player Card', icon: '🪪', action: () => onNavigate(`player-${activeChild?.id}`) },
                    { label: 'Team Hub', icon: '👥', action: () => navigateToTeamWall?.(activeTeam?.id) },
                    { label: 'Profile', icon: '👤', action: () => onNavigate(`player-profile-${activeChild?.id}`) },
                    { label: 'Achievements', icon: '🏆', action: () => onNavigate('achievements') },
                  ].map((btn, i, arr) => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-all
                        text-slate-500 hover:text-[var(--accent-primary)] hover:bg-slate-50
                        ${i < arr.length - 1 ? 'border-r border-slate-200' : ''}`}
                    >
                      <span className="text-xl">{btn.icon}</span>
                      <span className="text-xs font-medium text-slate-600">{btn.label}</span>
                    </button>
                  ))}
                </div>

                {/* What's Next + Gallery + Showcased Badge */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 px-5 py-4 space-y-4">
                    {/* What's Next */}
                    <div>
                      <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3">What's Next</div>
                      <div className="flex gap-3 flex-wrap">
                        {nextChildEvent ? (
                          <button
                            onClick={() => setSelectedEventDetail(nextChildEvent)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:border-amber-400 shadow-sm transition"
                          >
                            <span className="text-lg">{nextChildEvent.event_type === 'game' ? (primarySport?.icon || '🏐') : '🏋️'}</span>
                            <span>
                              {new Date(nextChildEvent.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {formatTime12(nextChildEvent.event_time)}
                            </span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 text-slate-400">
                            No upcoming events
                          </span>
                        )}
                        <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 shadow-sm">
                          {activeChildEvents.length} event{activeChildEvents.length !== 1 ? 's' : ''} scheduled
                        </span>
                      </div>
                    </div>

                    {/* Gallery Preview */}
                    {/* TODO: Wire to player photos/videos */}
                    <div>
                      <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Gallery</div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map(n => (
                          <div key={n} className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <span className="text-slate-300 text-lg">📷</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Showcased Badge */}
                    {/* TODO: Wire to player's showcased/featured badge */}
                    <div>
                      <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Showcased Badge</div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                          <span className="text-3xl">🏆</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">MVP Award</p>
                          <p className="text-xs text-slate-400">Featured badge</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div className="flex items-center justify-center text-slate-400" style={{ minHeight: '440px' }}>
                <div className="text-center">
                  <UserCircle className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-semibold text-slate-500">Loading player...</p>
                  <p className="text-sm text-slate-400 mt-1">Player information is loading</p>
                </div>
              </div>
            )}
          </div>

          {/* 4A Continued: Mini Player Carousel (multi-child) */}
          {playerTeamCombos.length > 1 && (
            <div className="relative">
              <div ref={carouselRef} className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {playerTeamCombos.map((combo) => (
                  <button
                    key={combo.idx}
                    onClick={() => setActiveChildIdx(combo.idx)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0 transition-all border ${
                      combo.idx === activeChildIdx
                        ? 'bg-white border-2 shadow-md'
                        : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm'
                    }`}
                    style={combo.idx === activeChildIdx ? { borderColor: combo.teamColor } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: combo.teamColor }}
                    >
                      {combo.photo ? (
                        <img src={combo.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        combo.firstName?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-bold text-slate-900 truncate">{combo.firstName}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: combo.teamColor }} />
                        <p className="text-xs text-slate-500 truncate">
                          {combo.teamName}
                          {combo.jersey ? ` · #${combo.jersey}` : ''}
                        </p>
                      </div>
                    </div>
                    {combo.hasPendingActions && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
                {/* Add child button in carousel */}
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl flex-shrink-0 border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-semibold">Add Child</span>
                </button>
              </div>
            </div>
          )}

          {/* 4B. Team Hub + Chat Preview Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Team Hub Preview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">Team Hub</h3>
                  {activeTeam && <span className="text-xs text-slate-400">· {activeTeam.name}</span>}
                </div>
                <button
                  onClick={() => navigateToTeamWall?.(activeTeam?.id)}
                  className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5">
                {latestPost ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      {latestPost.profiles?.avatar_url ? (
                        <img src={latestPost.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{latestPost.profiles?.full_name || 'Team Member'}</p>
                        <p className="text-xs text-slate-400">{new Date(latestPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3">{latestPost.content}</p>
                    {latestPost.reaction_count > 0 && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                        <span>❤️ {latestPost.reaction_count}</span>
                        {latestPost.comment_count > 0 && <span>💬 {latestPost.comment_count}</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No recent posts</p>
                    <button onClick={() => navigateToTeamWall?.(activeTeam?.id)} className="text-xs text-[var(--accent-primary)] font-semibold mt-2 hover:opacity-80 transition">
                      Visit Team Hub →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Preview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">Team Chat</h3>
                  {activeTeam && <span className="text-xs text-slate-400">· {activeTeam.name}</span>}
                </div>
                <button
                  onClick={() => onNavigate?.('chats')}
                  className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5">
                {chatMessages.length > 0 ? (
                  <div className="space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={msg.id || i} className="flex items-start gap-2">
                        {msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <UserCircle className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">{msg.profiles?.full_name || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No recent messages</p>
                  </div>
                )}
                {/* Quick reply stub */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onNavigate?.('chats')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-sm text-slate-400 hover:bg-slate-100 transition"
                  >
                    <Send className="w-4 h-4" />
                    Reply in chat...
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Upcoming Schedule</h3>
              </div>
              <button onClick={() => onNavigate('schedule')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1">
                Full Calendar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 4).map(event => {
                    const eventDate = new Date(event.event_date)
                    const isGame = event.event_type === 'game'
                    const evtTeamColor = event.teams?.color || activeTeamColor
                    const daysUntil = Math.ceil((eventDate - new Date()) / 86400000)
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEventDetail(event)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      >
                        <div className="text-center w-12 flex-shrink-0">
                          <div className="text-[9px] uppercase font-bold text-slate-400">{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-xl font-black text-slate-900 leading-tight">{eventDate.getDate()}</div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: isGame ? '#f59e0b' : '#3b82f6' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${isGame ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                              {isGame ? 'GAME' : 'PRACTICE'}
                            </span>
                            {event.opponent && <span className="text-xs font-semibold text-slate-600">vs {event.opponent}</span>}
                            {daysUntil === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-500">TODAY</span>}
                            {daysUntil === 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">TOMORROW</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {event.event_time && formatTime12(event.event_time)}{event.venue_name && ` · ${event.venue_name}`}
                          </div>
                          <div className="text-[10px] font-bold mt-0.5" style={{ color: evtTeamColor }}>{event.teams?.name}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">No upcoming events</p>
                  <p className="text-xs text-slate-400 mt-1">Check the schedule for past events</p>
                </div>
              )}
            </div>
          </div>

          {/* At a Glance Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamIds.length > 0 && (
              <TeamStandingsWidget
                teamId={activeTeam?.id || teamIds[0]}
                onViewStandings={() => onNavigate?.('standings')}
              />
            )}
            {registrationData.length > 0 && (
              <ChildStatsWidget
                children={activeChildForWidget}
                onViewLeaderboards={() => onNavigate?.('leaderboards')}
              />
            )}
          </div>

          {/* Registration Banner */}
          {openSeasons.length > 0 && (
            <div
              className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${activeTeamColor}12, ${activeTeamColor}06)`,
                border: `1px solid ${activeTeamColor}25`
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">New Season Registration Open!</p>
                  <p className="text-xs text-slate-500">{openSeasons[0].name} — {openSeasons[0].organizations?.name}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {registrationData.map(player => (
                  <button
                    key={player.id}
                    onClick={() => setShowReRegisterModal({ player, season: openSeasons[0] })}
                    className="px-5 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl text-xs font-bold hover:brightness-110 transition shadow-sm"
                  >
                    Register {player.first_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invite */}
          <button
            onClick={() => onNavigate('invite')}
            className="w-full rounded-2xl py-4 text-center text-sm font-medium bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-sm hover:shadow-md transition-all"
          >
            Know someone who'd love to play? <strong className="text-[var(--accent-primary)]">Invite them →</strong>
          </button>

          {/* Getting Started Checklist (visible on smaller screens) */}
          <div className="xl:hidden">
            <ParentChecklistWidget
              onNavigate={onNavigate}
              onTeamHub={() => navigateToTeamWall?.(activeTeam?.id)}
              activeTeam={activeTeam}
            />
          </div>
        </main>

        {/* ═══════════════════════════════════════ */}
        {/* RIGHT SIDEBAR (300px) — Player Context Panel */}
        {/* ═══════════════════════════════════════ */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col border-l border-slate-200/60 bg-white overflow-y-auto p-5 space-y-5">

          {/* 5A. Next 3 Upcoming Events — Hero Cards with Background Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming</h3>
              <button onClick={() => onNavigate('schedule')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
                Full Calendar →
              </button>
            </div>
            <div className="space-y-3">
              {activeChildEvents.slice(0, 3).map(event => {
                const eventDate = new Date(event.event_date)
                const eventType = event.event_type?.toLowerCase() || ''
                const isGame = eventType === 'game' || eventType === 'match' || eventType === 'game_day'
                const isPractice = eventType === 'practice' || eventType === 'training'
                const badgeLabel = isGame ? 'Game Day' : isPractice ? 'Practice' : 'Tournament'
                const badgeColor = isGame ? 'bg-red-500' : isPractice ? 'bg-cyan-500' : 'bg-purple-500'
                const bgImage = isPractice ? '/images/volleyball-practice.jpg' : '/images/volleyball-game.jpg'
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEventDetail(event)}
                    className="relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow shadow-md"
                    style={{
                      backgroundImage: `url(${bgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '130px',
                    }}
                  >
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
                    {/* Content */}
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                      <span className={`inline-block px-2 py-0.5 ${badgeColor} text-white text-[10px] font-bold uppercase rounded w-fit`}>
                        {badgeLabel}
                      </span>
                      <div>
                        <p className="text-white font-bold text-base leading-snug">
                          {event.opponent_name ? `vs ${event.opponent_name}` : event.title || badgeLabel}
                        </p>
                        <p className="text-white/80 text-xs mt-0.5">
                          {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {event.event_time && ` · ${formatTime12(event.event_time)}`}
                        </p>
                        {event.venue_name && <p className="text-white/60 text-xs truncate">{event.venue_name}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
              {activeChildEvents.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          {/* 5B. Season Record */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Season Record</h3>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-500">{teamRecord?.wins || 0}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Wins</div>
              </div>
              <div className="text-2xl font-bold text-slate-300">-</div>
              <div className="text-center">
                <div className="text-3xl font-black text-red-500">{teamRecord?.losses || 0}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Losses</div>
              </div>
              {(teamRecord?.ties || 0) > 0 && (
                <>
                  <div className="text-2xl font-bold text-slate-300">-</div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-amber-500">{teamRecord.ties}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Ties</div>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-center mt-2 text-slate-400">{activeTeam?.name}</p>
          </div>

          {/* 5C. Achievements Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Achievements</h3>
              <button onClick={() => onNavigate('achievements')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
                View All →
              </button>
            </div>
            {playerBadges.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {playerBadges.slice(0, 4).map((b, i) => {
                  const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280', rarity: 'Common' }
                  const rarityColor = RARITY_COLORS[def.rarity] || '#6B7280'
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${def.color}15`, border: `2px solid ${rarityColor}` }}
                      >
                        {def.icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 text-center max-w-[60px] leading-tight">{def.name}</span>
                    </div>
                  )
                })}
              </div>
            ) : badgesInProgress.length > 0 ? (
              <div className="space-y-3">
                {badgesInProgress.slice(0, 3).map((b, i) => {
                  const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280' }
                  const pct = b.target > 0 ? Math.min((b.progress / b.target) * 100, 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                      >
                        {def.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700 truncate">{def.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{b.progress}/{b.target}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Award className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="text-sm text-slate-400">No badges earned yet</p>
                <p className="text-xs text-slate-300 mt-1">Keep playing to unlock badges!</p>
              </div>
            )}
          </div>

          {/* 5D. Leaderboard Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Leaderboard</h3>
              <button onClick={() => onNavigate('leaderboards')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
                View All →
              </button>
            </div>
            <div className="space-y-1">
              {(SPORT_LEADERBOARD[activeChild?.season?.sports?.name?.toLowerCase()] || SPORT_LEADERBOARD.volleyball).map(stat => (
                <div key={stat.cat} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                  <span className="text-sm font-semibold text-slate-600">{stat.cat}</span>
                  {stat.rank ? (
                    <span className="text-sm font-black px-3 py-1 rounded-lg text-white shadow-sm" style={{ backgroundColor: stat.color }}>
                      #{stat.rank}
                    </span>
                  ) : (
                    <span className="text-sm font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-400">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5E. Player Stat Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Player Stats</h3>
              <button onClick={() => onNavigate('leaderboards')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
                Full Stats →
              </button>
            </div>
            {/* TODO: Wire to Supabase game_stats for actual player stats */}
            <div className="text-center py-4">
              <BarChart3 className="w-8 h-8 mx-auto text-slate-300 mb-1" />
              <p className="text-sm text-slate-400">Stats update after games</p>
              <p className="text-xs text-slate-300 mt-1">Check leaderboards for rankings</p>
            </div>
          </div>

          {/* Player Achievements (for the selected player) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Achievements</h3>
              <button onClick={() => onNavigate('achievements')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
                View All →
              </button>
            </div>
            {playerBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {playerBadges.slice(0, 4).map((b, i) => {
                  const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280', rarity: 'Common' }
                  const rarityColor = RARITY_COLORS[def.rarity] || '#6B7280'
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${def.color}15`, border: `2px solid ${rarityColor}` }}
                      >
                        {def.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-700 truncate">{def.name}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : badgesInProgress.length > 0 ? (
              <div className="space-y-2">
                {badgesInProgress.slice(0, 4).map((b, i) => {
                  const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280' }
                  const pct = b.target > 0 ? Math.min((b.progress / b.target) * 100, 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                      >
                        {def.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-700 truncate">{def.name}</div>
                        <div className="w-full h-1.5 rounded-full mt-1 bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Award className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="text-sm text-slate-400">No achievements yet</p>
                <p className="text-xs text-slate-300 mt-1">Play games to earn badges!</p>
              </div>
            )}
          </div>
        </aside>

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
