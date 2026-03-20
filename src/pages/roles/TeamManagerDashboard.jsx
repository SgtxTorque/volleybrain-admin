// =============================================================================
// TeamManagerDashboard — Operational hub for Team Managers
// Fixed layout (not widget grid). Shows payment health, RSVP, roster, events.
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useTeamManagerData } from '../../hooks/useTeamManagerData'
import { supabase } from '../../lib/supabase'
import WelcomeBanner from '../../components/shared/WelcomeBanner'
import DashboardContainer from '../../components/layout/DashboardContainer'
import InviteCodeModal from '../../components/team-manager/InviteCodeModal'
import {
  DollarSign, Users, Calendar, CheckSquare, MessageCircle, Megaphone,
  ChevronRight, AlertCircle, Clock, MapPin, Share2, RefreshCw, CheckCircle2, Circle
} from '../../constants/icons'

function formatTime12(t) {
  if (!t) return 'TBD'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Main Dashboard ──
export function TeamManagerDashboard({ roleContext, showToast, navigateToTeamWall, onNavigate }) {
  const { profile } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const [showInviteModal, setShowInviteModal] = useState(false)

  const teamInfo = roleContext?.teamManagerInfo?.[0]
  const teamId = teamInfo?.team_id
  const teamName = teamInfo?.teams?.name || 'My Team'
  const teamColor = teamInfo?.teams?.color || '#4BB9EC'

  const { paymentHealth, nextEventRsvp, registrationStatus, rosterCount, upcomingEvents, loading, refresh } = useTeamManagerData(teamId)

  // ── Getting Started checklist ──
  const [hasEvents, setHasEvents] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    if (!teamId) return false
    return localStorage.getItem(`tm_setup_dismissed_${teamId}`) === 'true'
  })

  const checkEvents = useCallback(async () => {
    if (!teamId) return
    const { count, error } = await supabase
      .from('schedule_events')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
    if (!error) setHasEvents((count || 0) > 0)
  }, [teamId])

  useEffect(() => { checkEvents() }, [checkEvents])

  const hasPlayers = rosterCount > 0
  const hasPayments = (paymentHealth?.totalPayments || 0) > 0
  const hasInvitedParents = rosterCount > 2

  const checklistItems = [
    { id: 'roster', label: 'Add players to roster', done: hasPlayers, time: '~2 min', page: 'roster' },
    { id: 'event', label: 'Create first event', done: hasEvents, time: '~3 min', page: 'schedule' },
    { id: 'invite', label: 'Invite parents', done: hasInvitedParents, time: '~1 min', action: () => setShowInviteModal(true) },
    { id: 'payments', label: 'Set up payments', done: hasPayments, time: '~5 min', page: 'payments' },
  ]
  const allDone = checklistItems.every(item => item.done)

  const handleDismiss = () => {
    setDismissed(true)
    if (teamId) localStorage.setItem(`tm_setup_dismissed_${teamId}`, 'true')
  }

  const cardClass = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06] rounded-[14px]'
    : 'bg-white border border-lynx-silver rounded-[14px] shadow-soft-sm'

  return (
    <DashboardContainer>
      <div className="space-y-r-4 px-r-4">
        {/* ── Getting Started Checklist ── */}
        {!dismissed && !loading && (
          <div className={`${cardClass} p-5`}>
            {allDone ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className={`text-r-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Setup complete!</span>
                </div>
                <button onClick={handleDismiss} className={`text-r-sm font-semibold ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'}`}>
                  Dismiss
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Getting Started</h3>
                  <span className={`text-r-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {checklistItems.filter(i => i.done).length}/{checklistItems.length} complete
                  </span>
                </div>
                <p className={`text-r-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Complete these steps to get your team running</p>
                <div className="space-y-2">
                  {checklistItems.map(item => (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-[14px] transition ${
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-lynx-cloud'
                    }`}>
                      {item.done
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        : <Circle className={`w-5 h-5 shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                      }
                      <span className={`flex-1 text-r-sm font-medium ${
                        item.done
                          ? (isDark ? 'text-slate-500 line-through' : 'text-slate-400 line-through')
                          : (isDark ? 'text-white' : 'text-slate-900')
                      }`}>{item.label}</span>
                      <span className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.time}</span>
                      {!item.done && (
                        <button
                          onClick={() => item.action ? item.action() : onNavigate?.(item.page)}
                          className="text-r-xs font-bold text-lynx-sky hover:underline shrink-0"
                        >
                          {item.action ? 'Share Code' : item.id === 'roster' ? 'Add Players' : item.id === 'event' ? 'Create Event' : 'Set Up'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Team Identity Bar ── */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white text-r-xl font-bold"
              style={{ backgroundColor: teamColor }}>
              {teamName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <WelcomeBanner role="coach" userName={profile?.full_name} teamName={teamName} seasonName={selectedSeason?.name} isDark={isDark} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-r-sm font-semibold ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-lynx-cloud text-slate-600'}`}>
                <Users className="w-4 h-4" />
                {rosterCount} players
              </div>
              <button onClick={refresh} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-r-4">
          {/* Left: Operational Cards */}
          <div className="space-y-r-4">
            {/* Payment Health */}
            <PaymentHealthCard
              data={paymentHealth}
              loading={loading}
              isDark={isDark}
              cardClass={cardClass}
              onNavigate={onNavigate}
            />

            {/* RSVP Summary */}
            <RsvpSummaryCard
              data={nextEventRsvp}
              loading={loading}
              isDark={isDark}
              cardClass={cardClass}
              onNavigate={onNavigate}
            />

            {/* Roster Status */}
            <RosterStatusCard
              data={registrationStatus}
              rosterCount={rosterCount}
              loading={loading}
              isDark={isDark}
              cardClass={cardClass}
              onNavigate={onNavigate}
            />
          </div>

          {/* Right: Quick Actions + Upcoming Events */}
          <div className="space-y-r-4">
            {/* Quick Actions */}
            <div className={`${cardClass} p-5`}>
              <h3 className={`text-r-base font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Attendance', icon: CheckSquare, page: 'attendance', color: 'text-emerald-500' },
                  { label: 'Send Blast', icon: Megaphone, page: 'blasts', color: 'text-amber-500' },
                  { label: 'Schedule', icon: Calendar, page: 'schedule', color: 'text-lynx-sky' },
                  { label: 'Team Chat', icon: MessageCircle, page: 'chats', color: 'text-violet-500' },
                  { label: 'Payments', icon: DollarSign, page: 'payments', color: 'text-emerald-500' },
                  { label: 'Invite Code', icon: Share2, action: () => setShowInviteModal(true), color: 'text-lynx-sky' },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => action.action ? action.action() : onNavigate?.(action.page)}
                    className={`flex items-center gap-2.5 p-3 rounded-[14px] text-left transition-all ${
                      isDark ? 'hover:bg-white/[0.06] border border-white/[0.06]' : 'hover:bg-lynx-cloud border border-slate-100'
                    }`}
                  >
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                    <span className={`text-r-sm font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-r-base font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upcoming</h3>
                <button onClick={() => onNavigate?.('schedule')} className="text-r-xs font-semibold text-lynx-sky hover:underline">View All</button>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-16 rounded-[14px] animate-pulse ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`} />
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className={`text-r-sm text-center py-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 3).map(event => (
                    <div key={event.id} className={`flex items-center gap-3 p-3 rounded-[14px] transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-lynx-cloud'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-r-base ${
                        isDark ? 'bg-white/[0.06]' : 'bg-slate-100'
                      }`}>
                        {event.event_type === 'game' ? '🏐' : event.event_type === 'tournament' ? '🏆' : '⚡'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-r-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {event.title || event.event_type}
                        </p>
                        <p className={`text-r-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatEventDate(event.event_date)} · {formatTime12(event.event_time)}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Code Modal */}
      {showInviteModal && (
        <InviteCodeModal
          teamId={teamId}
          teamName={teamName}
          onClose={() => setShowInviteModal(false)}
          showToast={showToast}
        />
      )}
    </DashboardContainer>
  )
}

// ── Payment Health Card ──
function PaymentHealthCard({ data, loading, isDark, cardClass, onNavigate }) {
  if (loading) return <CardSkeleton isDark={isDark} cardClass={cardClass} />
  if (!data) return null

  const hasOverdue = data.overdueCount > 0

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <h3 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Payment Health</h3>
        </div>
        <button onClick={() => onNavigate?.('payments')} className="flex items-center gap-1 text-r-sm font-semibold text-lynx-sky hover:underline">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className={`p-3 rounded-[14px] ${hasOverdue ? (isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200') : (isDark ? 'bg-white/[0.04]' : 'bg-lynx-cloud')}`}>
          <p className={`text-r-xs font-semibold uppercase tracking-wider ${hasOverdue ? 'text-red-400' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>Overdue</p>
          <p className={`text-r-2xl font-bold mt-1 ${hasOverdue ? 'text-red-400' : (isDark ? 'text-white' : 'text-slate-900')}`}>{data.overdueCount}</p>
          {hasOverdue && <p className="text-r-xs text-red-400 font-medium">${data.overdueAmount.toLocaleString()}</p>}
        </div>
        <div className={`p-3 rounded-[14px] ${isDark ? 'bg-white/[0.04]' : 'bg-lynx-cloud'}`}>
          <p className={`text-r-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pending</p>
          <p className={`text-r-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.pendingCount}</p>
        </div>
        <div className={`p-3 rounded-[14px] ${isDark ? 'bg-white/[0.04]' : 'bg-lynx-cloud'}`}>
          <p className={`text-r-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Collected</p>
          <p className={`text-r-2xl font-bold mt-1 text-emerald-500`}>${data.collectedAmount.toLocaleString()}</p>
        </div>
      </div>

      {hasOverdue && (
        <button onClick={() => onNavigate?.('payments')} className="mt-4 w-full py-2.5 rounded-[14px] bg-red-500 text-white font-bold text-r-sm hover:bg-red-600 transition flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> Send Reminders
        </button>
      )}
    </div>
  )
}

// ── RSVP Summary Card ──
function RsvpSummaryCard({ data, loading, isDark, cardClass, onNavigate }) {
  if (loading) return <CardSkeleton isDark={isDark} cardClass={cardClass} />

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-lynx-sky" />
          <h3 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Next Event RSVP</h3>
        </div>
        <button onClick={() => onNavigate?.('schedule')} className="flex items-center gap-1 text-r-sm font-semibold text-lynx-sky hover:underline">
          Schedule <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!data ? (
        <p className={`text-r-sm text-center py-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming events</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className={`px-2.5 py-1 rounded-full text-r-xs font-bold uppercase ${
              data.eventType === 'game'
                ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')
                : (isDark ? 'bg-lynx-sky/10 text-lynx-sky' : 'bg-lynx-ice text-lynx-sky')
            }`}>
              {data.eventType}
            </div>
            <p className={`text-r-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.title}</p>
            <p className={`text-r-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatEventDate(data.eventDate)}</p>
          </div>

          {/* RSVP Progress Bar */}
          <div className="space-y-2">
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-white/[0.06]">
              {data.confirmed > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(data.confirmed / data.totalRoster) * 100}%` }} />}
              {data.maybe > 0 && <div className="bg-amber-400 transition-all" style={{ width: `${(data.maybe / data.totalRoster) * 100}%` }} />}
              {data.declined > 0 && <div className="bg-red-400 transition-all" style={{ width: `${(data.declined / data.totalRoster) * 100}%` }} />}
            </div>
            <div className="flex gap-4 text-r-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmed {data.confirmed}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Maybe {data.maybe}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Declined {data.declined}</span>
              {data.noResponse > 0 && <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} /> No Response {data.noResponse}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Roster Status Card ──
function RosterStatusCard({ data, rosterCount, loading, isDark, cardClass, onNavigate }) {
  if (loading) return <CardSkeleton isDark={isDark} cardClass={cardClass} />
  if (!data) return null

  const fillPercent = data.capacity > 0 ? Math.min(100, (data.filled / data.capacity) * 100) : 0

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-500" />
          <h3 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Roster Status</h3>
        </div>
        <button onClick={() => onNavigate?.('roster')} className="flex items-center gap-1 text-r-sm font-semibold text-lynx-sky hover:underline">
          View Roster <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-end gap-6">
        <div>
          <p className={`text-r-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rosterCount}</p>
          <p className={`text-r-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {data.capacity > 0 ? `of ${data.capacity} spots filled` : 'players rostered'}
          </p>
        </div>
        {data.pendingCount > 0 && (
          <div className={`px-3 py-1.5 rounded-full text-r-xs font-bold ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            {data.pendingCount} pending
          </div>
        )}
        <div className={`px-3 py-1.5 rounded-full text-r-xs font-bold ${
          data.isOpen
            ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
            : (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
        }`}>
          {data.isOpen ? 'Open' : 'Full'}
        </div>
      </div>

      {data.capacity > 0 && (
        <div className="mt-4">
          <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all ${fillPercent >= 90 ? 'bg-amber-500' : 'bg-lynx-sky'}`} style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Card Skeleton ──
function CardSkeleton({ isDark, cardClass }) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className={`h-6 w-40 rounded-lg mb-4 animate-pulse ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`} />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-20 rounded-[14px] animate-pulse ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`} />
        ))}
      </div>
    </div>
  )
}

export default TeamManagerDashboard
