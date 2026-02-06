import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
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
import { ParentChecklistWidget } from '../../components/parent/ParentOnboarding'

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
              {event.event_type === 'practice' ? <span className="text-2xl">{primarySport?.icon || '🏐'}</span> : 
               event.event_type === 'game' ? <span className="text-2xl">{primarySport?.icon || '🏐'}</span> : '📅'}
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
  
  // Active child state for multi-child tabs
  const [activeChildIdx, setActiveChildIdx] = useState(0)
  const [dismissedAlerts, setDismissedAlerts] = useState([])
  const [teamRecord, setTeamRecord] = useState(null)
  const [playerBadges, setPlayerBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])

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
          team_players(team_id, jersey_number, teams(id, name, color, season_id)),
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
            jersey_number: teamPlayer?.jersey_number || p.jersey_number,
            registrationStatus: teamPlayer ? 'active' : 'pending'
          }
        })
        
        setRegistrationData(regData)
        
        // Get unique team IDs and set season
        const tIds = [...new Set(regData.map(p => p.team?.id).filter(Boolean))]
        setTeamIds(tIds)
        
        const currentSeasonId = regData[0]?.season?.id
        if (currentSeasonId) {
          setSeasonId(currentSeasonId)
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

        // Load upcoming events - pass seasonId directly since setState is async
        await loadUpcomingEvents(tIds, currentSeasonId)
        
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
        jersey_number: c.team_players?.[0]?.jersey_number || c.jersey_number,
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
        const currentSeasonId = teamsData?.[0]?.season_id
        if (currentSeasonId) {
          setSeasonId(currentSeasonId)
        }
        
        // Pass seasonId directly since state update is async
        await loadUpcomingEvents(tIds, currentSeasonId)
      } else {
        // No team IDs - still try to load events without team filter
        await loadUpcomingEvents([], null)
      }
      
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

  async function loadUpcomingEvents(teamIds, passedSeasonId = null) {
    console.log('ParentDashboard loadUpcomingEvents - Team IDs:', teamIds, 'Season ID:', passedSeasonId || seasonId)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const effectiveSeasonId = passedSeasonId || seasonId
      
      // If no team IDs, we can't load team-specific events
      if (!teamIds?.length) {
        console.log('ParentDashboard loadUpcomingEvents - No team IDs, skipping')
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
      
      // Add season filter if available
      if (effectiveSeasonId) {
        query = query.eq('season_id', effectiveSeasonId)
      }
      
      const { data, error } = await query
      console.log('ParentDashboard loadUpcomingEvents - Result:', data?.length, 'events', 'Error:', error)
      
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

  // Load team record/standings for the active child's team
  async function loadTeamRecord(teamId) {
    if (!teamId) return
    try {
      const { data } = await supabase
        .from('team_standings')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle()
      setTeamRecord(data)
    } catch (err) {
      console.error('Error loading team record:', err)
    }
  }

  async function loadPlayerBadges(playerId) {
    if (!playerId) return
    // Load earned badges
    try {
      const { data } = await supabase
        .from('player_badges')
        .select('*')
        .eq('player_id', playerId)
        .order('earned_at', { ascending: false })
      setPlayerBadges(data || [])
    } catch {
      setPlayerBadges([])
    }
    // Load in-progress achievements
    try {
      const { data } = await supabase
        .from('player_achievement_progress')
        .select('*')
        .eq('player_id', playerId)
      setBadgesInProgress(data || [])
    } catch {
      setBadgesInProgress([])
    }
  }

  // Re-load team record and badges when active child tab changes
  useEffect(() => {
    const activeChild = registrationData[activeChildIdx]
    const teamId = activeChild?.team?.id
    if (teamId) loadTeamRecord(teamId)
    if (activeChild?.id) loadPlayerBadges(activeChild.id)
  }, [activeChildIdx, registrationData])

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
    : upcomingEvents // Show all events if no active team
  const nextChildEvent = activeChildEvents[0]

  // Active child's unpaid items
  const activeChildUnpaid = paymentSummary.unpaidItems.filter(p => p.player_id === activeChild?.id)

  return (
    <div className="space-y-5" data-tutorial="dashboard-header">

      {/* ═══ ALERTS ═══ */}
      {visibleAlerts.map(alert => (
        <div 
          key={alert.id}
          className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${
            alert.priority === 'urgent'
              ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/20'
              : `${tc.cardBg} border ${tc.border}`
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
            alert.priority === 'urgent' ? 'bg-white/20' : isDark ? 'bg-amber-500/15' : 'bg-amber-50'
          }`}>
            {alert.priority === 'urgent' ? '🚨' : '📣'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${alert.priority === 'urgent' ? 'text-white' : tc.text}`}>{alert.title}</p>
            <p className={`text-xs mt-0.5 ${alert.priority === 'urgent' ? 'text-red-100' : tc.textMuted}`}>{alert.content}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setDismissedAlerts(prev => [...prev, alert.id]); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
              alert.priority === 'urgent' 
                ? 'bg-white/25 text-white hover:bg-white/35 backdrop-blur' 
                : `${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} ${tc.textSecondary}`
            }`}
          >
            {alert.priority === 'urgent' ? 'Got It ✓' : 'Dismiss'}
          </button>
        </div>
      ))}

      {/* ═══ GETTING STARTED CHECKLIST ═══ */}
      <ParentChecklistWidget onNavigate={onNavigate} />

      {/* ═══ CHILD TABS (2+ children) ═══ */}
      {registrationData.length > 1 && (
        <div className="flex gap-1 -mb-3 relative z-[2]">
          {registrationData.map((child, idx) => {
            const childTeamColor = child.team?.color || '#6366F1'
            const isActive = idx === activeChildIdx
            return (
              <button
                key={child.id}
                onClick={() => setActiveChildIdx(idx)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-t-2xl text-sm font-bold transition-all ${
                  isActive 
                    ? `${tc.text} shadow-sm` 
                    : `${tc.textMuted} hover:text-[var(--text-secondary)]`
                }`}
                style={isActive ? { 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderTop: `3px solid ${childTeamColor}`,
                  borderLeft: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRight: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                } : {
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: childTeamColor }} />
                {child.season?.sports?.icon || '🏐'} {child.first_name}
              </button>
            )
          })}
        </div>
      )}

      {/* ═══ PLAYER HERO CARD ═══ */}
      <div 
        className="overflow-hidden shadow-xl"
        data-tutorial="player-card"
        style={{ 
          borderRadius: registrationData.length > 1 ? '0 20px 20px 20px' : '20px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        {/* ── Hero Top: Photo + Player Identity ── */}
        <div className="flex" style={{ minHeight: '340px' }}>
          
          {/* Photo Column — wider for visual impact */}
          <div className="w-[320px] min-w-[320px] relative overflow-hidden flex-shrink-0 group">
            {/* Rich gradient background */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${activeTeamColor} 0%, ${activeTeamColor}cc 40%, ${isDark ? '#0f172a' : '#1e293b'} 100%)`
            }} />
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 30% 50%, white 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} />
            {/* Player photo */}
            {activeChild?.photo_url ? (
              <img src={activeChild.photo_url} alt={activeChild.first_name} className="absolute inset-0 w-full h-full object-cover z-[1]" />
            ) : (
              <div className="absolute inset-0 z-[1] flex items-center justify-center">
                <span className="text-[100px] font-black text-white/15 tracking-tighter">
                  {activeChild?.first_name?.[0]}{activeChild?.last_name?.[0]}
                </span>
              </div>
            )}

            {/* Upload photo button — overlays on hover */}
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
                  
                  // Upload to player-photos bucket
                  const { error: uploadError } = await supabase.storage
                    .from('player-photos')
                    .upload(filePath, file, { upsert: true })
                  
                  if (uploadError) {
                    showToast?.('Upload failed: ' + uploadError.message, 'error')
                    return
                  }
                  
                  // Get public URL
                  const { data: urlData } = supabase.storage
                    .from('player-photos')
                    .getPublicUrl(filePath)
                  
                  const photoUrl = urlData?.publicUrl + '?t=' + Date.now()
                  
                  // Update player record
                  const { error: updateError } = await supabase
                    .from('players')
                    .update({ photo_url: photoUrl })
                    .eq('id', activeChild.id)
                  
                  if (updateError) {
                    showToast?.('Failed to save: ' + updateError.message, 'error')
                    return
                  }
                  
                  // Update local state
                  setRegistrationData(prev => prev.map(p => 
                    p.id === activeChild.id ? { ...p, photo_url: photoUrl } : p
                  ))
                  showToast?.('Photo updated!', 'success')
                }}
              />
              <div className="text-center text-white">
                <div className="text-3xl mb-1">📷</div>
                <div className="text-xs font-bold">{activeChild?.photo_url ? 'Change Photo' : 'Upload Photo'}</div>
              </div>
            </label>
            {/* Jersey number floating badge */}
            {activeChild?.jersey_number && (
              <div className="absolute top-4 right-4 z-[3]">
                <div className="text-4xl font-black text-white drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  #{activeChild.jersey_number}
                </div>
              </div>
            )}
            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-[2] px-5 pb-5 pt-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}>
              <div className="uppercase font-black leading-none tracking-tight">
                <span className="block text-base text-white/70">{activeChild?.first_name}</span>
                <span className="block text-3xl text-white mt-0.5">{activeChild?.last_name}</span>
              </div>
              {/* Status badge */}
              <div className="mt-2">
                {(() => {
                  const badge = getStatusBadge(activeChild?.registrationStatus)
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm ${
                      badge.label === 'Active' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' :
                      badge.label === 'Pending' ? 'bg-amber-500/30 text-amber-300 border border-amber-400/30' :
                      'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        badge.label === 'Active' ? 'bg-emerald-400' : badge.label === 'Pending' ? 'bg-amber-400' : 'bg-blue-400'
                      }`} />
                      {badge.label}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Info Column */}
          <div className={`flex-1 flex flex-col min-w-0 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            
            {/* Top Identity Bar: Jersey # | Team + Position | Season | Status */}
            <div className={`flex items-stretch border-b ${tc.border}`}>
              {/* Jersey Number - big and bold */}
              <div className={`flex items-center justify-center px-6 border-r ${tc.border}`} style={{ minWidth: '90px' }}>
                <span className="text-4xl font-black" style={{ color: activeTeamColor }}>
                  {activeChild?.jersey_number ? `#${activeChild.jersey_number}` : '—'}
                </span>
              </div>
              {/* Team + Position */}
              <div className={`flex-1 px-5 py-4 border-r ${tc.border}`}>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: activeTeamColor }}>
                    {primarySport?.icon || '🏐'}
                  </div>
                  <div className={`text-lg font-bold ${tc.text}`}>{activeTeam?.name || 'Unassigned'}</div>
                </div>
                <div className={`text-sm ${tc.textMuted}`}>{activeChild?.position || 'Player'} • {primarySeason?.name || 'Current Season'}</div>
              </div>
              {/* Status + Payment */}
              <div className="flex items-center gap-3 px-6">
                {(() => {
                  const badge = getStatusBadge(activeChild?.registrationStatus)
                  return (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                      badge.label === 'Active' ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200') :
                      badge.label === 'Pending' ? (isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200') :
                      (isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200')
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        badge.label === 'Active' ? 'bg-emerald-400' : badge.label === 'Pending' ? 'bg-amber-400' : 'bg-blue-400'
                      }`} />
                      {badge.label}
                    </span>
                  )
                })()}
                {activeChildUnpaid.length > 0 ? (
                  <button onClick={() => setShowPaymentModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'} transition`}>
                    💰 ${activeChildUnpaid.reduce((s,p) => s + (parseFloat(p.amount)||0), 0).toFixed(2)} due
                  </button>
                ) : (
                  <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    ✅ Paid Up
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex border-b ${tc.border}`}>
              {[
                { label: 'Player Card', icon: '🪪', action: () => onNavigate(`player-${activeChild?.id}`) },
                { label: 'Team Hub', icon: '👥', action: () => navigateToTeamWall?.(activeTeam?.id) },
                { label: 'Profile', icon: '👤', action: () => onNavigate(`player-profile-${activeChild?.id}`) },
                { label: 'Achievements', icon: '🏆', action: () => onNavigate('achievements') },
              ].map((btn, i, arr) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 text-sm font-semibold transition-all
                    ${tc.textMuted} hover:text-[var(--accent-primary)] ${isDark ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50'}
                    ${i < arr.length - 1 ? `border-r ${tc.border}` : ''}`}
                >
                  <span className="text-2xl">{btn.icon}</span>
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>

            {/* What's New — NO payment here (it's in the top bar) */}
            <div className={`px-6 py-4 border-b ${tc.border}`}>
              <div className={`text-xs uppercase tracking-widest font-bold ${tc.textMuted} mb-3 flex items-center gap-2`}>
                ✨ What's New
              </div>
              <div className="flex gap-3 flex-wrap">
                {nextChildEvent ? (
                  <button 
                    onClick={() => setSelectedEventDetail(nextChildEvent)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      isDark ? 'bg-slate-700/60 border-slate-600 text-slate-200 hover:border-amber-500/50' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 shadow-sm'
                    }`}
                  >
                    <span className="text-lg">{nextChildEvent.event_type === 'game' ? (primarySport?.icon || '🏐') : '🏋️'}</span>
                    <span>Next: <strong>
                      {new Date(nextChildEvent.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {formatTime12(nextChildEvent.event_time)}
                      {nextChildEvent.opponent ? ` vs ${nextChildEvent.opponent}` : ''}
                    </strong></span>
                  </button>
                ) : (
                  <span className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-700/40 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                    📅 No upcoming events scheduled
                  </span>
                )}
                <span className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border ${isDark ? 'bg-slate-700/40 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                  🏐 {activeChildEvents.length} upcoming event{activeChildEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Bottom Section: Badges + Season Record + Leaderboard */}
            <div className="flex flex-1 min-h-0">
              {/* Badges — real data with 3 states */}
              <div className={`flex-1 px-6 py-5`}>
                <div className={`text-xs uppercase tracking-widest font-bold ${tc.textMuted} mb-4 flex items-center gap-2`}>
                  🏆 {playerBadges.length > 0 ? 'Recent Badges' : badgesInProgress.length > 0 ? 'Badge Progress' : 'Badges to Earn'}
                </div>

                {/* State 1: Has earned badges */}
                {playerBadges.length > 0 && (
                  <div className="flex gap-4 flex-wrap">
                    {playerBadges.slice(0, 5).map((b, i) => {
                      const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280', rarity: 'Common' }
                      const rarityColor = RARITY_COLORS[def.rarity] || '#6B7280'
                      return (
                        <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                          <div 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md transition-transform group-hover:scale-110"
                            style={{ 
                              background: `linear-gradient(135deg, ${def.color}33, ${def.color}15)`,
                              border: `2px solid ${rarityColor}`,
                              boxShadow: `0 4px 12px ${def.color}20`
                            }}
                          >
                            {def.icon}
                          </div>
                          <span className={`text-xs font-bold ${tc.textMuted} text-center max-w-[80px] leading-tight`}>{def.name}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* State 2: No earned badges but has in-progress */}
                {playerBadges.length === 0 && badgesInProgress.length > 0 && (
                  <div className="space-y-3">
                    {badgesInProgress.slice(0, 3).map((b, i) => {
                      const def = BADGE_DEFS[b.badge_id] || { name: b.badge_id, icon: '🏅', color: '#6B7280' }
                      const pct = b.target > 0 ? Math.min((b.progress / b.target) * 100, 100) : 0
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div 
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: `${def.color}20`, border: `2px solid ${def.color}44` }}
                          >
                            {def.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold ${tc.text} uppercase truncate`}>{def.name}</span>
                              <span className={`text-[10px] font-semibold ${tc.textMuted} ml-2 flex-shrink-0`}>{b.progress}/{b.target}</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: def.color }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* State 3: Nothing earned, nothing in progress — show starter teasers */}
                {playerBadges.length === 0 && badgesInProgress.length === 0 && (
                  <div className="space-y-2.5">
                    {STARTER_BADGES.slice(0, 4).map((starter, i) => {
                      const def = BADGE_DEFS[starter.badge_id] || { name: starter.badge_id, icon: '🏅', color: '#6B7280' }
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 grayscale opacity-40"
                            style={{ background: isDark ? '#1e293b' : '#f1f5f9', border: `2px solid ${isDark ? '#334155' : '#e2e8f0'}` }}
                          >
                            {def.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold ${tc.textMuted} block truncate`}>{def.name}</span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{starter.hint}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {/* Season Record + Leaderboard */}
              <div className={`w-[260px] flex-shrink-0 border-l ${tc.border}`}>
                {/* Season Record */}
                <div className={`px-6 py-4 border-b ${tc.border}`}>
                  <div className={`text-xs uppercase tracking-widest font-bold ${tc.textMuted} mb-3 flex items-center gap-2`}>
                    📋 Season Record
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-black text-emerald-500">{teamRecord?.wins || 0}</div>
                      <div className={`text-[10px] uppercase font-bold ${tc.textMuted}`}>Wins</div>
                    </div>
                    <div className={`text-xl font-bold ${tc.textMuted}`}>-</div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-red-500">{teamRecord?.losses || 0}</div>
                      <div className={`text-[10px] uppercase font-bold ${tc.textMuted}`}>Losses</div>
                    </div>
                    {(teamRecord?.ties || 0) > 0 && (
                      <>
                        <div className={`text-xl font-bold ${tc.textMuted}`}>-</div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-amber-500">{teamRecord.ties}</div>
                          <div className={`text-[10px] uppercase font-bold ${tc.textMuted}`}>Ties</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* Leaderboard Rankings */}
                <div className="px-6 py-4">
                  <div className={`text-xs uppercase tracking-widest font-bold ${tc.textMuted} mb-3 flex items-center gap-2`}>
                    📊 Leaderboard
                  </div>
                  <div className="space-y-1">
                    {(SPORT_LEADERBOARD[activeChild?.season?.sports?.name?.toLowerCase()] || SPORT_LEADERBOARD.volleyball).map(stat => (
                      <div key={stat.cat} className={`flex items-center justify-between py-2 border-b last:border-b-0 ${tc.border}`}>
                        <span className={`text-sm font-semibold ${tc.textSecondary}`}>{stat.cat}</span>
                        {stat.rank ? (
                          <span className="text-sm font-black px-3 py-1 rounded-lg text-white shadow-sm" style={{ backgroundColor: stat.color }}>
                            #{stat.rank}
                          </span>
                        ) : (
                          <span className={`text-sm font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>—</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ADD ANOTHER CHILD ═══ */}
      <button
        onClick={() => setShowAddChildModal(true)}
        className={`w-full py-3.5 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all
          ${isDark ? 'border-slate-600 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400' : 'border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'}`}
      >
        + Add Another Child
      </button>

      {/* ═══ TEAM HUB PREVIEW ═══ */}
      {activeTeam && (
        <>
          <div className={`text-[10px] uppercase tracking-widest font-bold ${tc.textMuted} flex items-center gap-3 mt-1`}>
            TEAM <span className={`flex-1 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          </div>
          <button 
            onClick={() => navigateToTeamWall?.(activeTeam.id)}
            className={`w-full rounded-2xl overflow-hidden text-left transition-all shadow-md hover:shadow-lg ${isDark ? 'hover:ring-1 hover:ring-slate-600' : 'hover:ring-2 hover:ring-slate-200'}`}
            style={{ border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}
          >
            <div className="h-14 flex items-center px-6 gap-3" style={{ background: `linear-gradient(135deg, ${activeTeamColor}, ${activeTeamColor}aa)` }}>
              <span className="text-xl">{primarySport?.icon || '🏐'}</span>
              <span className="text-white font-bold text-sm flex-1">{activeTeam.name} — Team Hub</span>
              <span className="text-white/60 text-xl">→</span>
            </div>
            <div className={`px-6 py-3 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <p className={`text-sm ${tc.textSecondary}`}>
                <strong className={tc.text}>Latest:</strong> Tap to see team updates, chat, and game info
              </p>
            </div>
          </button>
        </>
      )}

      {/* ═══ PARENT BADGES ═══ */}
      <div className={`text-[10px] uppercase tracking-widest font-bold ${tc.textMuted} flex items-center gap-3 mt-1`}>
        YOUR BADGES <span className={`flex-1 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      </div>
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5 shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-sm font-bold ${tc.text} flex items-center gap-2`}>⭐ Parent Badges</h4>
          <button onClick={() => onNavigate('achievements')} className="text-xs text-[var(--accent-primary)] font-semibold hover:underline">View All →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '📋', name: 'RSVP Champ', desc: 'RSVP to 10+ events', progress: 100, color: '#10b981' },
            { icon: '🤝', name: 'Volunteer Beast', desc: 'Volunteer 5+ times', progress: 60, color: '#3b82f6' },
            { icon: '📊', name: 'Scorekeeper', desc: 'Keep score 3+ games', progress: 33, color: '#8b5cf6' },
            { icon: '🏅', name: 'Super Fan', desc: 'Attend every game', progress: 80, color: '#f59e0b', locked: true },
          ].map((badge, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                badge.locked ? 'opacity-40 grayscale' : ''
              } ${isDark ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm shadow-sm'}`}
            >
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                style={badge.progress >= 100 && !badge.locked ? {
                  background: `linear-gradient(135deg, ${badge.color}25, ${badge.color}10)`,
                  border: `2px solid ${badge.color}40`,
                } : {
                  background: isDark ? '#1e293b' : '#f8fafc',
                  border: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                }}
              >
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${tc.text} truncate`}>{badge.name}</div>
                <div className={`text-[10px] ${tc.textMuted} truncate`}>{badge.desc}</div>
                {badge.progress < 100 && (
                  <div className={`w-full h-1.5 rounded-full mt-1.5 overflow-hidden ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${badge.progress}%`, backgroundColor: badge.color }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SCHEDULE ═══ */}
      <div className={`text-[10px] uppercase tracking-widest font-bold ${tc.textMuted} flex items-center gap-3 mt-1`} data-tutorial="schedule-section">
        SCHEDULE <span className={`flex-1 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      </div>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${tc.text} flex items-center gap-2`}>📅 Upcoming</h3>
        <button onClick={() => onNavigate('schedule')} className="text-xs text-[var(--accent-primary)] font-semibold hover:underline">View All →</button>
      </div>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all shadow-sm
                  ${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'} border`}
              >
                {/* Date block */}
                <div className="text-center w-12 flex-shrink-0">
                  <div className={`text-[9px] uppercase font-bold ${tc.textMuted}`}>{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`text-xl font-black ${tc.text} leading-tight`}>{eventDate.getDate()}</div>
                  <div className={`text-[9px] uppercase font-bold ${tc.textMuted}`}>{eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
                {/* Color bar */}
                <div className="w-1 h-10 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: isGame ? '#f59e0b' : '#3b82f6' }} />
                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${isGame ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-500'}`}>
                      {isGame ? '🏐 GAME' : '🏋️ PRACTICE'}
                    </span>
                    {event.opponent && <span className={`text-xs font-semibold ${tc.textSecondary}`}>vs {event.opponent}</span>}
                    {daysUntil === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 animate-pulse">TODAY</span>}
                    {daysUntil === 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">TOMORROW</span>}
                  </div>
                  <div className={`text-xs ${tc.textMuted} mt-0.5`}>
                    {event.event_time && formatTime12(event.event_time)}{event.venue_name && ` • ${event.venue_name}`}
                  </div>
                  <div className="text-[10px] font-bold mt-0.5" style={{ color: evtTeamColor }}>{event.teams?.name}</div>
                </div>
                <ChevronRight className={`w-4 h-4 ${tc.textMuted} flex-shrink-0`} />
              </button>
            )
          })}
        </div>
      ) : (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl py-10 text-center`}>
          <Calendar className={`w-10 h-10 mx-auto ${tc.textMuted} mb-2`} />
          <p className={`text-sm font-medium ${tc.textSecondary}`}>No upcoming events</p>
          <p className={`text-xs ${tc.textMuted} mt-1`}>Check the schedule for past events</p>
        </div>
      )}

      {/* ═══ AT A GLANCE ═══ */}
      <div className={`text-[10px] uppercase tracking-widest font-bold ${tc.textMuted} flex items-center gap-3 mt-1`}>
        AT A GLANCE <span className={`flex-1 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teamIds.length > 0 && (
          <TeamStandingsWidget 
            teamId={activeTeam?.id || teamIds[0]} 
            onViewStandings={() => onNavigate?.('standings')}
          />
        )}
        {registrationData.length > 0 && (
          <ChildStatsWidget 
            children={[activeChild]}
            onViewLeaderboards={() => onNavigate?.('leaderboards')}
          />
        )}
      </div>

      {/* ═══ REGISTRATION ═══ */}
      {openSeasons.length > 0 && (
        <div 
          className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap shadow-md"
          style={{ 
            background: `linear-gradient(135deg, ${activeTeamColor}18, ${activeTeamColor}08)`, 
            border: `1px solid ${activeTeamColor}30` 
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className={`text-sm font-bold ${tc.text}`}>New Season Registration Open!</p>
              <p className={`text-xs ${tc.textMuted}`}>{openSeasons[0].name} — {openSeasons[0].organizations?.name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {registrationData.map(player => (
              <button
                key={player.id}
                onClick={() => setShowReRegisterModal({ player, season: openSeasons[0] })}
                className="px-5 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl text-xs font-bold hover:brightness-110 transition shadow-md"
              >
                Register {player.first_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ INVITE ═══ */}
      <button
        onClick={() => onNavigate('invite')}
        className={`w-full rounded-2xl py-4 text-center text-sm font-medium transition-all
          ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-sm hover:shadow-md'} border`}
      >
        📣 Know someone who'd love to play? <strong className="text-[var(--accent-primary)]">Invite them →</strong>
      </button>

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
    </div>
  )
}

export { ParentDashboard }
