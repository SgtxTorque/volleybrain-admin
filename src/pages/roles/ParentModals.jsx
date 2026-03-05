// =============================================================================
// ParentModals — extracted from ParentDashboard.jsx
// EventDetailModal, PaymentOptionsModal, AddChildModal, ReRegisterModal, AlertDetailModal
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useSport } from '../../contexts/SportContext'
import { supabase } from '../../lib/supabase'
import { Calendar, MapPin, Users, AlertTriangle, Megaphone } from '../../constants/icons'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

// ═══ EVENT DETAIL MODAL ═══
export function EventDetailModal({ event, teams, venues, onClose, activeView }) {
  const { isDark } = useTheme()
  const { selectedSport } = useSport()
  const primarySport = selectedSport || { name: 'Volleyball', icon: '🏐' }
  if (!event) return null

  const team = teams?.find(t => t.id === event.team_id)
  const venue = venues?.find(v => v.id === event.venue_id)
  const eventDate = event.event_date ? new Date(event.event_date) : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: team?.color || '#6366F1' }}>
              {event.event_type === 'practice' ? <span className="text-3xl">{primarySport?.icon || '🏐'}</span> :
               event.event_type === 'game' ? <span className="text-3xl">{primarySport?.icon || '🏐'}</span> : '📅'}
            </div>
            <div>
              <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.title || event.event_type}</h2>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{team?.name}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className={`w-5 h-5 text-slate-400`} />
            <div>
              <p className={`${isDark ? 'text-white' : 'text-slate-900'}`}>{eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {event.event_time && <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatTime12(event.event_time)}</p>}
            </div>
          </div>

          {(event.location || venue || event.venue_name) && (
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 text-slate-400`} />
              <div>
                <p className={`${isDark ? 'text-white' : 'text-slate-900'}`}>{event.venue_name || event.location || venue?.name}</p>
                {(venue?.address || event.venue_address) && <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event.venue_address || venue?.address}</p>}
              </div>
            </div>
          )}

          {(event.opponent || event.opponent_name) && (
            <div className="flex items-center gap-3">
              <Users className={`w-5 h-5 text-slate-400`} />
              <p className={`${isDark ? 'text-white' : 'text-slate-900'}`}>vs {event.opponent_name || event.opponent}</p>
            </div>
          )}

          {event.notes && (
            <div className={`${isDark ? 'bg-white/[0.06]' : 'bg-brand-off-white'} rounded-xl p-4`}>
              <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{event.notes}</p>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-medium transition ${isDark ? 'border border-white/[0.06] text-white hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-900 hover:bg-brand-off-white'}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ PAYMENT OPTIONS MODAL ═══
export function PaymentOptionsModal({ amount, organization, fees = [], players = [], onClose, showToast }) {
  const { isDark } = useTheme()
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
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl w-full max-w-lg shadow-2xl`}>
        <div className={`p-5 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Make a Payment</h2>
          <div className="flex items-center justify-between mt-2">
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-lg`}>Total Due</p>
            <p className="text-4xl font-bold text-[var(--accent-primary)]">${amount?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {fees.length > 0 && (
            <div className={`${isDark ? 'bg-white/[0.06]' : 'bg-brand-off-white'} rounded-xl overflow-hidden`}>
              <button onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                className={`w-full p-3 flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'} hover:opacity-80`}>
                <span className="font-medium text-lg">Fee Breakdown</span>
                <span className={`transition-transform ${showFeeBreakdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showFeeBreakdown && (
                <div className={`px-3 pb-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
                  {Object.entries(feesByPlayer).map(([playerName, playerFees]) => (
                    <div key={playerName} className="mt-3">
                      <p className={`text-base font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-1`}>{playerName}</p>
                      {playerFees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between text-lg py-1">
                          <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{fee.fee_name}</span>
                          <span className={`${isDark ? 'text-white' : 'text-slate-900'}`}>${fee.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className={`flex justify-between font-semibold pt-2 mt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
                    <span className={`${isDark ? 'text-white' : 'text-slate-900'}`}>Total</span>
                    <span className="text-[var(--accent-primary)]">${amount?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasPaymentMethods && (
            <div className={`${isDark ? 'bg-white/[0.06]' : 'bg-brand-off-white'} rounded-xl p-3`}>
              <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Include this note with your payment:</p>
              <div className="flex items-center gap-2">
                <code className={`flex-1 text-lg ${isDark ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-200/60'} px-2 py-1 rounded`}>
                  {paymentNote}
                </code>
                <button onClick={() => copyToClipboard(paymentNote, 'Note')}
                  className={`text-base px-2 py-1 rounded ${copied === 'Note' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'}`}>
                  {copied === 'Note' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {hasPaymentMethods && (
            <div className="space-y-2">
              <p className={`text-base font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Payment Methods</p>
              {organization?.payment_venmo && (
                <a href={`https://venmo.com/${organization.payment_venmo.replace('@', '')}?txn=pay&amount=${amount?.toFixed(2) || '0'}&note=${encodeURIComponent(paymentNote)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[#008CFF]/10 hover:bg-[#008CFF]/20 rounded-xl transition group">
                  <div className="w-10 h-10 rounded-full bg-[#008CFF] flex items-center justify-center text-white font-bold text-xl">V</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#008CFF]">Venmo</p>
                    <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>@{organization.payment_venmo.replace('@', '')}</p>
                  </div>
                  <span className="text-[#008CFF] group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}
              {organization?.payment_zelle && (
                <div className="flex items-center gap-3 p-3 bg-[#6D1ED4]/10 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#6D1ED4] flex items-center justify-center text-white font-bold text-xl">Z</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#6D1ED4]">Zelle</p>
                    <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{organization.payment_zelle}</p>
                  </div>
                  <button onClick={() => copyToClipboard(organization.payment_zelle, 'Zelle')}
                    className={`text-lg px-3 py-1 rounded-lg transition ${copied === 'Zelle' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-[#6D1ED4]/20 text-[#6D1ED4] hover:bg-[#6D1ED4]/30'}`}>
                    {copied === 'Zelle' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              )}
              {organization?.payment_cashapp && (
                <a href={`https://cash.app/${organization.payment_cashapp.replace('$', '')}/${amount?.toFixed(2) || '0'}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[#00D632]/10 hover:bg-[#00D632]/20 rounded-xl transition group">
                  <div className="w-10 h-10 rounded-full bg-[#00D632] flex items-center justify-center text-white font-bold text-xl">$</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#00D632]">Cash App</p>
                    <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{organization.payment_cashapp}</p>
                  </div>
                  <span className="text-[#00D632] group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}
            </div>
          )}

          {organization?.payment_instructions && (
            <div className={`${isDark ? 'bg-white/[0.06]' : 'bg-brand-off-white'} rounded-xl p-3`}>
              <p className={`text-base font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2`}>Additional Instructions</p>
              <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'} whitespace-pre-wrap`}>{organization.payment_instructions}</p>
            </div>
          )}

          {!hasPaymentMethods && !organization?.payment_instructions && (
            <div className={`${isDark ? 'bg-white/[0.06]' : 'bg-brand-off-white'} rounded-xl p-6 text-center`}>
              <p className="text-4xl mb-2">💳</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Payment methods coming soon!</p>
              <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Contact your league administrator for payment options.</p>
            </div>
          )}

          {hasPaymentMethods && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
              <span className="text-amber-500">💡</span>
              <p className={`${isDark ? 'text-amber-400' : 'text-amber-700'} text-lg`}>
                After sending payment, your admin will mark it as paid within 1-2 business days.
              </p>
            </div>
          )}
        </div>

        <div className={`p-5 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} space-y-2`}>
          {amount > 100 && (
            <button onClick={() => showToast?.('Payment plan requests coming soon!', 'info')}
              className={`w-full py-2 rounded-xl text-lg transition ${isDark ? 'border border-white/[0.06] text-slate-400 hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-500 hover:bg-brand-off-white'}`}>
              Need a payment plan? Contact admin
            </button>
          )}
          <button onClick={onClose} className={`w-full py-2.5 rounded-xl font-medium transition ${isDark ? 'bg-white/10 hover:bg-white/[0.15] text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ ADD CHILD MODAL ═══
export function AddChildModal({ existingChildren, onClose, showToast }) {
  const { isDark } = useTheme()
  const [openSeasons, setOpenSeasons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOpenSeasons() }, [])

  async function loadOpenSeasons() {
    try {
      const orgIds = [...new Set((existingChildren || []).map(c => c.season?.organizations?.id).filter(Boolean))]
      const now = new Date().toISOString()
      let query = supabase.from('seasons')
        .select('*, sports(name, icon), organizations(id, name, slug, settings)')
        .lte('registration_opens', now)
        .or(`registration_closes.is.null,registration_closes.gte.${now}`)
        .in('status', ['upcoming', 'active'])
      if (orgIds.length > 0) query = query.in('organization_id', orgIds)
      const { data } = await query
      setOpenSeasons(data || [])
    } catch (err) { console.error('Error loading seasons:', err) }
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
    prefillParams.forEach((value, key) => { if (value) cleanParams.append(key, value) })
    return `${registrationBaseUrl}/register/${orgSlug}/${season.id}?${cleanParams.toString()}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl`}>
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Another Child</h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-lg mt-1`}>Select a season to register a sibling</p>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : openSeasons.length > 0 ? (
            <>
              {templateChild && (
                <div className={`${isDark ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'} rounded-xl p-4 mb-4`}>
                  <p className={`${isDark ? 'text-emerald-400' : 'text-emerald-700'} text-lg`}>
                    Parent info will be pre-filled from {templateChild.first_name}'s registration
                  </p>
                </div>
              )}
              {openSeasons.map(season => (
                <a key={season.id} href={getSiblingRegistrationUrl(season)} target="_blank" rel="noopener noreferrer"
                  className={`${isDark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-brand-off-white hover:bg-slate-100'} rounded-xl p-4 flex items-center gap-4 transition block`}>
                  <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-3xl">
                    {season.sports?.icon || '🏐'}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{season.name}</p>
                    <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{season.organizations?.name}</p>
                  </div>
                  <span className="text-[var(--accent-primary)] font-semibold">Register →</span>
                </a>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className={`w-12 h-12 mx-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} mt-2`}>No open registrations at this time</p>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <button onClick={onClose} className={`w-full py-2 rounded-xl transition ${isDark ? 'border border-white/[0.06] text-white hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-900 hover:bg-brand-off-white'}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ RE-REGISTER MODAL ═══
export function ReRegisterModal({ player, season, onClose, showToast }) {
  const { isDark } = useTheme()
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
  prefillParams.forEach((value, key) => { if (value) cleanParams.append(key, value) })
  const registrationUrl = `${registrationBaseUrl}/register/${orgSlug}/${season.id}?${cleanParams.toString()}`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl w-full max-w-md shadow-xl`}>
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Re-Register {player.first_name}</h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-lg mt-1`}>for {season.name}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className={`${isDark ? 'bg-white/[0.06]' : 'bg-brand-off-white'} rounded-xl p-4`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-3xl">
                {season.sports?.icon || '🏅'}
              </div>
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{season.name}</p>
                <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{season.organizations?.name}</p>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'} rounded-xl p-4`}>
            <p className={`${isDark ? 'text-emerald-400' : 'text-emerald-700'} text-lg`}>
              {player.first_name}'s information will be pre-filled to save time!
            </p>
          </div>
        </div>

        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex gap-3`}>
          <button onClick={onClose} className={`flex-1 py-2 rounded-xl transition ${isDark ? 'border border-white/[0.06] text-white hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-900 hover:bg-brand-off-white'}`}>
            Cancel
          </button>
          <a href={registrationUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-center hover:brightness-110 transition">
            Open Registration →
          </a>
        </div>
      </div>
    </div>
  )
}

// ═══ ALERT DETAIL MODAL ═══
export function AlertDetailModal({ alert, onClose }) {
  const { isDark } = useTheme()
  if (!alert) return null

  const createdDate = new Date(alert.created_at)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl w-full max-w-lg shadow-xl`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              alert.priority === 'urgent' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500') : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
            }`}>
              {alert.priority === 'urgent' ? <AlertTriangle className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
            </div>
            <div>
              <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{alert.title}</h2>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{createdDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} whitespace-pre-wrap`}>{alert.content}</p>
        </div>

        <div className={`p-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-medium transition ${isDark ? 'border border-white/[0.06] text-white hover:bg-white/[0.06]' : 'border border-lynx-silver text-slate-900 hover:bg-brand-off-white'}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
