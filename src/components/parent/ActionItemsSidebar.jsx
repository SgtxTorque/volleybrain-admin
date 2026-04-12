import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, ChevronRight, AlertTriangle, CheckCircle2 } from '../../constants/icons'
import { PriorityCardsList } from './PriorityCardsEngine'

// ============================================
// ACTION ITEMS SIDEBAR — Desktop panel
// Equivalent of mobile "Needs Attention" bottom sheet
// ============================================
export function ActionItemsSidebar({ items, onAction, onClose, isOpen }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  if (!isOpen) return null

  const paymentItems = items.filter(i => i.type === 'payment')
  const waiverItems = items.filter(i => i.type === 'waiver')
  const rsvpItems = items.filter(i => i.type === 'rsvp')
  const gameItems = items.filter(i => i.type === 'game')

  const totalDue = paymentItems.reduce((sum, i) => sum + (i.amount || 0), 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div className={`fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl transition-transform ${
        isDark ? 'bg-lynx-midnight border-l border-lynx-border-dark' : 'bg-white border-l border-lynx-silver'
      }`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b ${tc.border} flex items-center justify-between flex-shrink-0`}>
          <div>
            <h2 className={`text-lg font-bold ${tc.text} flex items-center gap-2`}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Action Items
            </h2>
            <p className={`text-sm ${tc.textMuted}`}>
              {items.length} {items.length === 1 ? 'item needs' : 'items need'} your attention
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              isDark ? 'hover:bg-lynx-charcoal text-slate-400' : 'hover:bg-slate-100 text-lynx-slate'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className={`text-lg font-bold ${tc.text}`}>All Caught Up!</h3>
              <p className={`text-sm ${tc.textMuted} mt-1`}>No pending action items right now.</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className={`grid grid-cols-${Math.min(4, [paymentItems, waiverItems, rsvpItems, gameItems].filter(a => a.length).length)} gap-3`}>
                {paymentItems.length > 0 && (
                  <SummaryStat label="Payments" count={paymentItems.length} color="#EF4444" extra={`$${totalDue.toFixed(0)}`} />
                )}
                {waiverItems.length > 0 && (
                  <SummaryStat label="Waivers" count={waiverItems.length} color="#8B5CF6" />
                )}
                {rsvpItems.length > 0 && (
                  <SummaryStat label="RSVPs" count={rsvpItems.length} color="#3B82F6" />
                )}
                {gameItems.length > 0 && (
                  <SummaryStat label="Games" count={gameItems.length} color="#F59E0B" />
                )}
              </div>

              {/* Grouped items */}
              {paymentItems.length > 0 && (
                <SectionGroup title="Payments Due" icon="💰" count={paymentItems.length} color="#EF4444">
                  <PriorityCardsList items={paymentItems} onAction={onAction} compact />
                </SectionGroup>
              )}

              {waiverItems.length > 0 && (
                <SectionGroup title="Waivers to Sign" icon="📝" count={waiverItems.length} color="#8B5CF6">
                  <PriorityCardsList items={waiverItems} onAction={onAction} compact />
                </SectionGroup>
              )}

              {rsvpItems.length > 0 && (
                <SectionGroup title="RSVP Needed" icon="📅" count={rsvpItems.length} color="#3B82F6">
                  <PriorityCardsList items={rsvpItems} onAction={onAction} compact />
                </SectionGroup>
              )}

              {gameItems.length > 0 && (
                <SectionGroup title="Upcoming Games" icon="🏐" count={gameItems.length} color="#F59E0B">
                  <PriorityCardsList items={gameItems} onAction={onAction} compact />
                </SectionGroup>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ============================================
// SUMMARY STAT — mini stat card
// ============================================
function SummaryStat({ label, count, color, extra }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  return (
    <div
      className={`rounded-xl p-3 text-center ${isDark ? 'bg-lynx-charcoal' : 'bg-lynx-cloud'}`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="text-xl font-black" style={{ color }}>{extra || count}</div>
      <div className={`text-xs uppercase font-bold ${tc.textMuted}`}>{label}</div>
    </div>
  )
}

// ============================================
// SECTION GROUP — collapsible section
// ============================================
function SectionGroup({ title, icon, count, color, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between mb-2 group`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className={`text-sm font-bold ${tc.text}`}>{title}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {count}
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 ${tc.textMuted} transition-transform ${collapsed ? '' : 'rotate-90'}`} />
      </button>
      {!collapsed && children}
    </div>
  )
}

// ============================================
// QUICK RSVP MODAL — for inline RSVP from cards
// ============================================
export function QuickRsvpModal({ event, userId, playerId, onClose, onRsvp, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [submitting, setSubmitting] = useState(false)

  if (!event) return null

  const eventDate = new Date(event.event_date)

  async function handleRsvp(status) {
    if (!playerId) {
      showToast?.('Unable to RSVP — no player linked to this event.', 'error')
      return
    }
    setSubmitting(true)
    const rsvpStatus = status === 'yes' ? 'going' : status === 'no' ? 'not_going' : 'maybe'
    try {
      // Check if RSVP already exists for this player + event
      const { data: existing } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('event_id', event.id)
        .eq('player_id', playerId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('event_rsvps')
          .update({ status: rsvpStatus, responded_by: userId, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: event.id,
            player_id: playerId,
            responded_by: userId,
            status: rsvpStatus,
            responded_at: new Date().toISOString(),
          })
        if (error) throw error
      }

      showToast?.(status === 'yes' ? 'RSVP confirmed!' : 'RSVP updated.', 'success')
      onRsvp?.(event.id, rsvpStatus)

      // BATON PASS: Notify coach(es) about RSVP update
      if (event.team_id) {
        try {
          const { data: teamCoaches } = await supabase
            .from('team_coaches')
            .select('coach_id, coaches(user_id)')
            .eq('team_id', event.team_id)
          const { data: rsvpCounts } = await supabase
            .from('event_rsvps')
            .select('status')
            .eq('event_id', event.id)
          const confirmed = (rsvpCounts || []).filter(r => ['yes', 'going', 'confirmed'].includes(r.status)).length
          const total = (rsvpCounts || []).length
          const coachUserIds = (teamCoaches || []).map(c => c.coaches?.user_id).filter(Boolean)
          if (coachUserIds.length > 0) {
            const notifications = coachUserIds.map(coachId => ({
              user_id: coachId,
              type: 'rsvp_update',
              title: 'RSVP Update',
              body: `${confirmed} of ${total} players confirmed for ${event.title || event.event_type || 'upcoming event'}.`,
              data: {
                event_id: event.id,
                team_id: event.team_id,
                confirmed_count: confirmed,
                total_count: total,
                action_url: '/schedule',
              },
              read: false,
            }))
            await supabase.from('notifications').insert(notifications)
          }
        } catch (notifErr) {
          console.error('Baton pass failed (RSVP→coach):', notifErr)
        }
      }

      onClose()
    } catch (err) {
      console.error('RSVP error:', err)
      showToast?.('Failed to RSVP: ' + err.message, 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-sm shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${tc.border}`}>
          <h3 className={`text-lg font-bold ${tc.text}`}>RSVP</h3>
          <p className={`text-sm ${tc.textMuted} mt-1`}>
            {event.title || event.event_type} — {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          {event.teams?.name && (
            <p className="text-xs font-bold mt-1" style={{ color: event.teams?.color || 'var(--accent-primary)' }}>
              {event.teams.name}
            </p>
          )}
        </div>

        <div className="p-5 space-y-3">
          <p className={`text-sm font-medium ${tc.text}`}>Will you attend?</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRsvp('yes')}
              disabled={submitting}
              className="py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition disabled:opacity-50"
            >
              Yes
            </button>
            <button
              onClick={() => handleRsvp('maybe')}
              disabled={submitting}
              className={`py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 ${
                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Maybe
            </button>
            <button
              onClick={() => handleRsvp('no')}
              disabled={submitting}
              className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition disabled:opacity-50"
            >
              No
            </button>
          </div>
        </div>

        <div className={`p-5 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-2 rounded-xl border ${tc.border} ${tc.text} text-sm`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
