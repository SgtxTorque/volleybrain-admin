// =============================================================================
// TeamManagerDashboard — v2 layout, operational hub for Team Managers
// Preserves all data from useTeamManagerData hook
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTeamManagerData } from '../../hooks/useTeamManagerData'
import { supabase } from '../../lib/supabase'
import InviteCodeModal from '../../components/team-manager/InviteCodeModal'
import { CheckCircle2, Circle } from '../../constants/icons'
// V2 shared components
import { useTheme } from '../../contexts/ThemeContext'
import {
  TopBar, HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  WeeklyLoad, ThePlaybook, MilestoneCard, MascotNudge, V2DashboardLayout,
} from '../../components/v2'
// V2 team manager tab components
import TMRosterTab from '../../components/v2/team-manager/TMRosterTab'
import TMPaymentsTab from '../../components/v2/team-manager/TMPaymentsTab'
import TMScheduleTab from '../../components/v2/team-manager/TMScheduleTab'
import TMAttendanceTab from '../../components/v2/team-manager/TMAttendanceTab'

// ── Main Dashboard ──
export function TeamManagerDashboard({ roleContext, showToast, navigateToTeamWall, onNavigate, activeView, availableViews = [], onSwitchRole }) {
  const { profile } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark, toggleTheme } = useTheme()
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

  // ── Derived values for v2 ──
  const [activeTab, setActiveTab] = useState('roster')
  const firstName = profile?.full_name?.split(' ')[0] || 'Manager'

  const totalPaymentAmount = (paymentHealth?.collectedAmount || 0) + (paymentHealth?.overdueAmount || 0) + (paymentHealth?.pendingAmount || 0)
  const collectionPct = totalPaymentAmount > 0 ? `${Math.round((paymentHealth.collectedAmount / totalPaymentAmount) * 100)}%` : '—'

  const heroStats = [
    { label: 'Players', value: rosterCount, color: rosterCount > 0 ? 'sky' : 'muted' },
    { label: 'Capacity', value: registrationStatus?.capacity || '—' },
    { label: 'Events', value: upcomingEvents.length },
    { label: 'Collection', value: collectionPct },
  ]

  const attentionItems = [
    ...(paymentHealth?.overdueCount > 0 ? [{
      icon: '💰', label: `${paymentHealth.overdueCount} overdue payment${paymentHealth.overdueCount !== 1 ? 's' : ''}`,
      type: 'coral', onClick: () => onNavigate?.('payments'),
    }] : []),
    ...(registrationStatus?.pendingCount > 0 ? [{
      icon: '📋', label: `${registrationStatus.pendingCount} pending registration${registrationStatus.pendingCount !== 1 ? 's' : ''}`,
      type: 'amber', onClick: () => onNavigate?.('registrations'),
    }] : []),
    ...(!hasEvents ? [{
      icon: '📅', label: 'No events scheduled yet',
      type: 'sky', onClick: () => onNavigate?.('schedule'),
    }] : []),
  ]

  const playbookItems = [
    { icon: '✅', label: 'Attendance', onClick: () => onNavigate?.('attendance') },
    { icon: '📢', label: 'Send Blast', onClick: () => onNavigate?.('blasts') },
    { icon: '📅', label: 'Schedule', onClick: () => onNavigate?.('schedule') },
    { icon: '💬', label: 'Team Chat', onClick: () => onNavigate?.('chats') },
    { icon: '💳', label: 'Payments', onClick: () => onNavigate?.('payments') },
    { icon: '🔗', label: 'Invite Code', onClick: () => setShowInviteModal(true) },
  ]

  const tmTabs = [
    { id: 'roster', label: 'Roster' },
    { id: 'payments', label: 'Payments' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'attendance', label: 'Attendance' },
  ]

  return (
    <>
      <TopBar
        roleLabel="Lynx Team Manager"
        navLinks={[
          { label: 'Dashboard', pageId: 'dashboard', isActive: true, onClick: () => onNavigate?.('dashboard') },
          { label: 'Schedule', pageId: 'schedule', onClick: () => onNavigate?.('schedule') },
          { label: 'Registrations', pageId: 'registrations', onClick: () => onNavigate?.('registrations') },
        ]}
        searchPlaceholder="Search..."
        onSearchClick={() => document.dispatchEvent(new CustomEvent('command-palette-open'))}
        avatarInitials={`${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`}
        onSettingsClick={() => onNavigate?.('organization')}
        onNotificationClick={() => onNavigate?.('notifications')}
        onThemeToggle={toggleTheme}
        isDark={isDark}
        availableRoles={availableViews.map(v => ({ id: v.id, label: `Lynx ${v.label}`, subtitle: v.description }))}
        activeRoleId={activeView}
        onRoleSwitch={onSwitchRole}
      />
      <V2DashboardLayout
        mainContent={
          <>
            {/* Hero Card */}
            <HeroCard
              orgLine={`${teamName} · ${selectedSeason?.name || 'Current Season'}`}
              greeting={`Your team is looking good, ${firstName}.`}
              subLine={`${rosterCount} players · ${upcomingEvents[0]?.title || 'No upcoming events'}`}
              stats={heroStats}
            />

            {/* Attention Strip */}
            {attentionItems.length > 0 && (
              <AttentionStrip items={attentionItems} />
            )}

            {/* Getting Started Checklist */}
            {!dismissed && !loading && (
              <div className="rounded-2xl p-5 border" style={{ background: 'var(--v2-white)', borderColor: 'var(--v2-border-subtle)', fontFamily: 'var(--v2-font)' }}>
                {allDone ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-sm font-bold" style={{ color: 'var(--v2-text-primary)' }}>Setup complete!</span>
                    </div>
                    <button onClick={handleDismiss} className="text-xs font-semibold bg-transparent border-none cursor-pointer" style={{ color: 'var(--v2-text-muted)' }}>
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--v2-text-muted)' }}>Getting Started</span>
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--v2-text-muted)' }}>
                        {checklistItems.filter(i => i.done).length}/{checklistItems.length}
                      </span>
                    </div>
                    <p className="text-xs mb-3.5" style={{ color: 'var(--v2-text-secondary)' }}>Complete these steps to get your team running</p>
                    {checklistItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: 'var(--v2-border-subtle)' }}>
                        {item.done
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          : <Circle className="w-5 h-5 shrink-0" style={{ color: 'var(--v2-text-muted)' }} />
                        }
                        <span className={`flex-1 text-[13px] font-medium ${item.done ? 'line-through' : ''}`} style={{ color: item.done ? 'var(--v2-text-muted)' : 'var(--v2-text-primary)' }}>{item.label}</span>
                        <span className="text-[11px]" style={{ color: 'var(--v2-text-muted)' }}>{item.time}</span>
                        {!item.done && (
                          <button
                            onClick={() => item.action ? item.action() : onNavigate?.(item.page)}
                            className="text-[11px] font-bold bg-transparent border-none cursor-pointer"
                            style={{ color: 'var(--v2-sky)' }}
                          >
                            {item.action ? 'Share Code' : item.id === 'roster' ? 'Add Players' : item.id === 'event' ? 'Create Event' : 'Set Up'}
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Body Tabs */}
            <BodyTabs
              tabs={tmTabs}
              activeTabId={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'roster' && (
                <TMRosterTab data={registrationStatus} rosterCount={rosterCount} loading={loading} onNavigate={onNavigate} />
              )}
              {activeTab === 'payments' && (
                <TMPaymentsTab data={paymentHealth} loading={loading} onNavigate={onNavigate} />
              )}
              {activeTab === 'schedule' && (
                <TMScheduleTab events={upcomingEvents} loading={loading} onNavigate={onNavigate} />
              )}
              {activeTab === 'attendance' && (
                <TMAttendanceTab data={nextEventRsvp} loading={loading} onNavigate={onNavigate} />
              )}
            </BodyTabs>

            {/* Mascot Nudge */}
            <MascotNudge
              message={
                paymentHealth?.overdueCount > 0
                  ? `Heads up — ${paymentHealth.overdueCount} payment${paymentHealth.overdueCount > 1 ? 's are' : ' is'} overdue ($${paymentHealth.overdueAmount?.toLocaleString()}). A quick reminder can go a long way.`
                  : !hasEvents
                    ? 'No events on the calendar yet. Add your first practice or game to get things rolling!'
                    : rosterCount < 6
                      ? `Only ${rosterCount} player${rosterCount !== 1 ? 's' : ''} on the roster. Share the invite code to fill up your team.`
                      : upcomingEvents.length > 0
                        ? `Next up: ${upcomingEvents[0]?.title || upcomingEvents[0]?.event_type}. Your team is locked in — keep it going!`
                        : 'Everything looks great! Your team is humming along.'
              }
            />
          </>
        }
        sideContent={
          <>
            {/* Financial Snapshot */}
            <FinancialSnapshot
              title="Team Finances"
              collected={paymentHealth?.collectedAmount || 0}
              outstanding={(paymentHealth?.overdueAmount || 0) + (paymentHealth?.pendingAmount || 0)}
              breakdown={[
                { label: 'Collected', amount: paymentHealth?.collectedAmount || 0 },
                { label: 'Overdue', amount: paymentHealth?.overdueAmount || 0 },
                { label: 'Pending', amount: paymentHealth?.pendingAmount || 0 },
              ]}
            />

            {/* Upcoming Events */}
            <WeeklyLoad
              title="Upcoming"
              events={upcomingEvents.slice(0, 5).map(e => ({
                label: e.title || e.event_type,
                date: e.event_date,
                time: e.event_time,
                type: e.event_type,
              }))}
            />

            {/* The Playbook */}
            <ThePlaybook actions={playbookItems} />

            {/* Milestone Card */}
            <MilestoneCard
              variant="sky"
              title="Team Progress"
              xpCurrent={rosterCount * 50 + (paymentHealth?.collectedAmount || 0) / 10}
              xpGoal={1000}
              level={Math.floor((rosterCount * 50) / 1000) + 1}
            />
          </>
        }
      />

      {/* Invite Code Modal */}
      {showInviteModal && (
        <InviteCodeModal
          teamId={teamId}
          teamName={teamName}
          onClose={() => setShowInviteModal(false)}
          showToast={showToast}
        />
      )}
    </>
  )
}

export default TeamManagerDashboard
