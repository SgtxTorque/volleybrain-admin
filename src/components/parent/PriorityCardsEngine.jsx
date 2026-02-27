import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  DollarSign, FileText, Calendar, Clock, ChevronRight,
  AlertTriangle, Check, X, Bell
} from '../../constants/icons'

// ============================================
// PRIORITY LEVELS — higher = more urgent
// ============================================
const PRIORITY = {
  PAYMENT_OVERDUE: 100,
  WAIVER_UNSIGNED: 90,
  RSVP_MISSING: 70,
  GAME_UPCOMING_24H: 60,
  GAME_UPCOMING_48H: 40,
  PAYMENT_UPCOMING: 30,
  EVENT_INFO: 10,
}

// ============================================
// usePriorityItems — the scanning engine hook
// ============================================
export function usePriorityItems({ children, teamIds, seasonId, organizationId }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const playerIds = useMemo(() => (children || []).map(c => c.id).filter(Boolean), [children])

  const scan = useCallback(async () => {
    if (!playerIds.length) {
      setItems([])
      setLoading(false)
      return
    }

    const allItems = []

    try {
      // 1. UNPAID FEES
      try {
        const { data: payments, error: paymentsErr } = await supabase
          .from('payments')
          .select('*, players(id, first_name, last_name)')
          .in('player_id', playerIds)
          .eq('paid', false)

        if (paymentsErr) {
          console.warn('PriorityCards: payments query failed:', paymentsErr.message)
        } else if (payments) {
          for (const p of payments) {
            const isOverdue = p.due_date && new Date(p.due_date) < new Date()
            allItems.push({
              id: `payment-${p.id}`,
              type: 'payment',
              priority: isOverdue ? PRIORITY.PAYMENT_OVERDUE : PRIORITY.PAYMENT_UPCOMING,
              title: isOverdue ? 'Payment Overdue' : 'Payment Due',
              subtitle: `${p.fee_name || p.description || 'Fee'} — ${p.players?.first_name || 'Player'}`,
              amount: parseFloat(p.amount) || 0,
              icon: 'dollar',
              color: isOverdue ? '#EF4444' : '#F59E0B',
              actionLabel: 'Pay Now',
              actionType: 'payment',
              data: p,
            })
          }
        }
      } catch (err) {
        console.warn('PriorityCards: payments fetch error:', err.message)
      }

      // 2. UNSIGNED WAIVERS
      if (organizationId) {
        try {
          const { data: waivers, error: waiversErr } = await supabase
            .from('waivers')
            .select('id, name, is_required')
            .eq('organization_id', organizationId)
            .eq('is_active', true)

          if (waiversErr) {
            console.warn('PriorityCards: waivers query failed (table/column may not exist):', waiversErr.message)
          } else if (waivers?.length) {
            const waiverIds = waivers.map(w => w.id)

            let signatures = []
            try {
              const { data: sigs, error: sigsErr } = await supabase
                .from('waiver_signatures')
                .select('waiver_id, player_id')
                .in('waiver_id', waiverIds)
                .in('player_id', playerIds)

              if (sigsErr) {
                console.warn('PriorityCards: waiver_signatures query failed:', sigsErr.message)
              } else {
                signatures = sigs || []
              }
            } catch (err) {
              console.warn('PriorityCards: waiver_signatures fetch error:', err.message)
            }

            const signedSet = new Set(
              signatures.map(s => `${s.waiver_id}:${s.player_id}`)
            )

            for (const waiver of waivers) {
              for (const child of (children || [])) {
                const key = `${waiver.id}:${child.id}`
                if (!signedSet.has(key)) {
                  allItems.push({
                    id: `waiver-${waiver.id}-${child.id}`,
                    type: 'waiver',
                    priority: PRIORITY.WAIVER_UNSIGNED,
                    title: 'Waiver Needed',
                    subtitle: `"${waiver.name}" for ${child.first_name}`,
                    icon: 'file',
                    color: '#8B5CF6',
                    actionLabel: 'Sign Now',
                    actionType: 'waiver',
                    data: { waiver, player: child },
                  })
                }
              }
            }
          }
        } catch (err) {
          console.warn('PriorityCards: waivers fetch error:', err.message)
        }
      }

      // 3. EVENTS WITHOUT RSVP + UPCOMING GAMES
      if (teamIds?.length) {
        try {
          const today = new Date()
          const todayStr = today.toISOString().split('T')[0]
          const futureStr = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

          let eventsQuery = supabase
            .from('schedule_events')
            .select('*, teams!schedule_events_team_id_fkey(name, color)')
            .in('team_id', teamIds)
            .gte('event_date', todayStr)
            .lte('event_date', futureStr)
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true })

          if (seasonId) {
            eventsQuery = eventsQuery.eq('season_id', seasonId)
          }

          const { data: events, error: eventsErr } = await eventsQuery

          if (eventsErr) {
            console.warn('PriorityCards: schedule_events query failed:', eventsErr.message)
          } else if (events?.length) {
            // Get existing RSVPs for this user
            const eventIds = events.map(e => e.id)
            let rsvps = []
            try {
              const { data: rsvpData, error: rsvpErr } = await supabase
                .from('event_rsvps')
                .select('event_id, status')
                .in('event_id', eventIds)
                .eq('responded_by', user?.id)

              if (rsvpErr) {
                console.warn('PriorityCards: event_rsvps query failed (table/column may not exist):', rsvpErr.message)
              } else {
                rsvps = rsvpData || []
              }
            } catch (err) {
              console.warn('PriorityCards: event_rsvps fetch error:', err.message)
            }

            const rsvpMap = new Map(rsvps.map(r => [r.event_id, r.status]))

            for (const event of events) {
              const eventDate = new Date(event.event_date + 'T' + (event.event_time || '00:00'))
              const hoursUntil = (eventDate - today) / (1000 * 60 * 60)
              const hasRsvp = rsvpMap.has(event.id)
              const isGame = event.event_type === 'game'

              // Missing RSVP
              if (!hasRsvp && event.rsvp_enabled !== false) {
                allItems.push({
                  id: `rsvp-${event.id}`,
                  type: 'rsvp',
                  priority: PRIORITY.RSVP_MISSING,
                  title: 'RSVP Needed',
                  subtitle: `${event.title || event.event_type} — ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
                  icon: 'calendar',
                  color: '#3B82F6',
                  actionLabel: 'RSVP',
                  actionType: 'rsvp',
                  data: event,
                })
              }

              // Upcoming game in <48hrs
              if (isGame && hoursUntil > 0 && hoursUntil <= 48) {
                allItems.push({
                  id: `game-${event.id}`,
                  type: 'game',
                  priority: hoursUntil <= 24 ? PRIORITY.GAME_UPCOMING_24H : PRIORITY.GAME_UPCOMING_48H,
                  title: hoursUntil <= 24 ? 'Game Day!' : 'Game Tomorrow',
                  subtitle: `${event.opponent ? `vs ${event.opponent}` : event.title || 'Game'} — ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${event.event_time ? ' ' + formatTime12(event.event_time) : ''}`,
                  icon: 'clock',
                  color: hoursUntil <= 24 ? '#EF4444' : '#F59E0B',
                  actionLabel: 'View Details',
                  actionType: 'event-detail',
                  data: event,
                })
              }
            }
          }
        } catch (err) {
          console.warn('PriorityCards: events fetch error:', err.message)
        }
      }

      // Sort by priority (highest first)
      allItems.sort((a, b) => b.priority - a.priority)
      setItems(allItems)
    } catch (err) {
      console.warn('PriorityCardsEngine scan error:', err.message)
    }

    setLoading(false)
  }, [playerIds, teamIds, seasonId, organizationId, user?.id])

  useEffect(() => {
    scan()
  }, [scan])

  return { items, loading, refresh: scan, count: items.length }
}

// ============================================
// HELPER: format time to 12-hour
// ============================================
function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

// ============================================
// ICON MAP
// ============================================
function CardIcon({ type, className }) {
  switch (type) {
    case 'dollar': return <DollarSign className={className} />
    case 'file': return <FileText className={className} />
    case 'calendar': return <Calendar className={className} />
    case 'clock': return <Clock className={className} />
    default: return <Bell className={className} />
  }
}

// ============================================
// PriorityCard — single action card
// ============================================
function PriorityCard({ item, onAction, compact = false }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border transition-all cursor-pointer ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3'
      } ${isDark
        ? 'bg-lynx-charcoal/80 border-lynx-border-dark hover:border-slate-500 hover:bg-slate-750'
        : 'bg-white border-lynx-silver hover:border-slate-300 hover:shadow-md'
      }`}
      onClick={() => onAction?.(item)}
    >
      {/* Icon */}
      <div
        className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: `${item.color}18`, border: `2px solid ${item.color}35` }}
      >
        <CardIcon type={item.icon} className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: item.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: item.color }}>{item.title}</span>
          {item.amount > 0 && (
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold ${tc.text}`}>${item.amount.toFixed(2)}</span>
          )}
        </div>
        <p className={`${compact ? 'text-[10px]' : 'text-xs'} ${tc.textMuted} truncate`}>{item.subtitle}</p>
      </div>

      {/* Action button */}
      <button
        onClick={(e) => { e.stopPropagation(); onAction?.(item) }}
        className={`${compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'} rounded-lg font-bold text-white flex-shrink-0 transition-all hover:brightness-110 shadow-sm`}
        style={{ backgroundColor: item.color }}
      >
        {item.actionLabel}
      </button>
    </div>
  )
}

// ============================================
// PriorityCardsList — renders all priority cards
// ============================================
export function PriorityCardsList({ items, onAction, maxItems = 5, compact = false }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [expanded, setExpanded] = useState(false)

  if (!items?.length) return null

  const visibleItems = expanded ? items : items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  return (
    <div className="space-y-2">
      {visibleItems.map(item => (
        <PriorityCard key={item.id} item={item} onAction={onAction} compact={compact} />
      ))}
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className={`w-full py-2 text-xs font-semibold text-center rounded-lg transition ${
            isDark ? 'text-slate-400 hover:text-slate-300 hover:bg-lynx-charcoal' : 'text-slate-500 hover:text-slate-700 hover:bg-lynx-cloud'
          }`}
        >
          Show {items.length - maxItems} more items...
        </button>
      )}
    </div>
  )
}

// ============================================
// ActionBadge — shows count of pending items
// ============================================
export function ActionBadge({ count, onClick, className = '' }) {
  if (!count) return null

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
        bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 animate-pulse ${className}`}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      {count} {count === 1 ? 'Action' : 'Actions'} Needed
    </button>
  )
}

export { PriorityCard }
