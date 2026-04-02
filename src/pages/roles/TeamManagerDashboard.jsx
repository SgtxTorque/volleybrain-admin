// =============================================================================
// TeamManagerDashboard — v2 layout, operational hub for Team Managers
// Preserves all data from useTeamManagerData hook
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTeamManagerData } from '../../hooks/useTeamManagerData'
import { supabase } from '../../lib/supabase'
import { getLevelFromXP, getLevelTier } from '../../lib/engagement-constants'
import InviteCodeModal from '../../components/team-manager/InviteCodeModal'
import EngagementLevelCard from '../../components/engagement/EngagementLevelCard'
import EngagementActivityCard from '../../components/engagement/EngagementActivityCard'
import EngagementBadgesCard from '../../components/engagement/EngagementBadgesCard'
import EngagementTeamPulseCard from '../../components/engagement/EngagementTeamPulseCard'
import { CheckCircle2, Circle } from '../../constants/icons'
// V2 shared components
import { useTheme } from '../../contexts/ThemeContext'
import {
  HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  WeeklyLoad, ThePlaybook, MilestoneCard, MascotNudge, V2DashboardLayout,
} from '../../components/v2'
// V2 team manager tab components
import TMRosterTab from '../../components/v2/team-manager/TMRosterTab'
import TMPaymentsTab from '../../components/v2/team-manager/TMPaymentsTab'
import TMScheduleTab from '../../components/v2/team-manager/TMScheduleTab'
import TMAttendanceTab from '../../components/v2/team-manager/TMAttendanceTab'

// ── Main Dashboard ──
export function TeamManagerDashboard({ roleContext, showToast, navigateToTeamWall, onNavigate, activeView, availableViews = [], onSwitchRole }) {
  const { profile, user } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark, toggleTheme } = useTheme()
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Engagement column state
  const [tmBadges, setTmBadges] = useState([])
  const [totalAchievements, setTotalAchievements] = useState(0)
  const [weeklyEventsCreated, setWeeklyEventsCreated] = useState(0)
  const [weeklyBlasts, setWeeklyBlasts] = useState(0)
  const [weeklyPayments, setWeeklyPayments] = useState(0)
  const [waiversDone, setWaiversDone] = useState(0)
  const [tmPulseData, setTmPulseData] = useState({ active: 0, drifting: 0, inactive: 0 })
  const [tmNextBadgeProgress, setTmNextBadgeProgress] = useState(null)

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

  // Load engagement column data
  useEffect(() => {
    if (!teamId || !user?.id) return
    loadTmEngagementData()
  }, [teamId, user?.id])

  async function loadTmEngagementData() {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString()

    // E1. TM badges
    try {
      const { data: badgeData } = await supabase
        .from('player_achievements')
        .select('id, earned_at, achievement:achievement_id(id, name, icon, icon_url, badge_image_url, rarity)')
        .eq('player_id', user?.id)
        .order('earned_at', { ascending: false })
        .limit(10)
      setTmBadges((badgeData || []).map(b => ({ name: b.achievement?.name || 'Badge', icon: b.achievement?.icon || '🏅', badge_image_url: b.achievement?.badge_image_url, rarity: b.achievement?.rarity })))
    } catch { setTmBadges([]) }

    // E2. Total active achievements
    try {
      const { count: totalAch } = await supabase
        .from('achievements')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      setTotalAchievements(totalAch || 0)
    } catch { setTotalAchievements(0) }

    // E3. Events created this week
    try {
      const { count: eventCount } = await supabase
        .from('schedule_events')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .gte('created_at', weekAgoStr)
      setWeeklyEventsCreated(eventCount || 0)
    } catch { setWeeklyEventsCreated(0) }

    // E4. Blasts sent this week
    try {
      const { count: blastCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user?.id)
        .gte('created_at', weekAgoStr)
      setWeeklyBlasts(blastCount || 0)
    } catch { setWeeklyBlasts(0) }

    // E5. Payments processed this week
    try {
      const { count: payCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('paid', true)
        .gte('paid_date', weekAgo.toISOString().split('T')[0])
      setWeeklyPayments(payCount || 0)
    } catch { setWeeklyPayments(0) }

    // E6. Waivers completed this season
    try {
      const { count: waiverCount } = await supabase
        .from('waiver_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
      setWaiversDone(waiverCount || 0)
    } catch { setWaiversDone(0) }

    // E7. Team pulse (XP activity per player)
    try {
      const { data: allPlayers } = await supabase
        .from('team_players')
        .select('player_id')
        .eq('team_id', teamId)
      const playerIds = (allPlayers || []).map(p => p.player_id)
      if (playerIds.length > 0) {
        const { data: xpActivity } = await supabase
          .from('xp_ledger')
          .select('player_id, created_at')
          .in('player_id', playerIds)
          .order('created_at', { ascending: false })
        const now = new Date()
        const latestByPlayer = {}
        for (const entry of (xpActivity || [])) {
          if (!latestByPlayer[entry.player_id]) latestByPlayer[entry.player_id] = entry.created_at
        }
        let active = 0, drifting = 0, inactive = 0
        for (const pid of playerIds) {
          const last = latestByPlayer[pid]
          if (!last) { inactive++; continue }
          const days = Math.floor((now - new Date(last)) / (1000 * 60 * 60 * 24))
          if (days <= 7) active++
          else if (days <= 21) drifting++
          else inactive++
        }
        setTmPulseData({ active, drifting, inactive })
      } else { setTmPulseData({ active: 0, drifting: 0, inactive: 0 }) }
    } catch { setTmPulseData({ active: 0, drifting: 0, inactive: 0 }) }

    // E8. Next badge hint
    try {
      const { data: progressData } = await supabase
        .from('player_achievement_progress')
        .select('achievement_id, current_value, target_value, achievements(id, name, stat_key, threshold)')
        .eq('player_id', user?.id)
      if (progressData && progressData.length > 0) {
        let best = null
        for (const p of progressData) {
          if (!p.target_value || p.target_value <= 0) continue
          const ratio = (p.current_value || 0) / p.target_value
          if (ratio >= 1) continue
          if (!best || ratio > best.ratio) {
            best = { ratio, remaining: Math.ceil(p.target_value - (p.current_value || 0)), action: p.achievements?.stat_key || 'actions', badgeName: p.achievements?.name || 'next badge' }
          }
        }
        setTmNextBadgeProgress(best)
      } else { setTmNextBadgeProgress(null) }
    } catch { setTmNextBadgeProgress(null) }
  }

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

  // ── Engagement column computed values ──
  const tmXp = profile?.total_xp || 0
  const tmLevelInfo = getLevelFromXP(tmXp)
  const tmTier = getLevelTier(tmLevelInfo.level)

  const tmActivities = [
    { icon: '📅', label: 'Events created', count: weeklyEventsCreated, bg: '#FAEEDA', color: '#B45309' },
    { icon: '📢', label: 'Blasts sent', count: weeklyBlasts, bg: '#EEEDFE', color: '#7C3AED' },
    { icon: '💰', label: 'Payments tracked', count: weeklyPayments, bg: '#E6F1FB', color: '#2563EB' },
    { icon: '📝', label: 'Waivers collected', count: waiversDone, bg: '#E1F5EE', color: '#059669' },
  ]

  const tmNextBadgeHint = tmNextBadgeProgress
    ? `${tmNextBadgeProgress.remaining} more ${tmNextBadgeProgress.action} for ${tmNextBadgeProgress.badgeName}`
    : null

  return (
    <>
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

            {/* INNER FLEX: Content + Engagement Column side by side (starts below nudge) */}
            <div style={{ display: 'flex', gap: 16, marginTop: -10 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

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
                    <p className="text-xs mb-2" style={{ color: 'var(--v2-text-secondary)' }}>Complete these steps to get your team running</p>
                    {checklistItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: 'var(--v2-border-subtle)' }}>
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
            </div>

            {/* ENGAGEMENT COLUMN — 280px fixed, real data */}
            <div
              className="tm-engagement-column"
              style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <EngagementLevelCard
                levelInfo={tmLevelInfo}
                tierName={tmTier.name}
                xp={tmXp}
                onNavigateAchievements={() => onNavigate?.('achievements')}
              />
              <EngagementActivityCard
                activities={tmActivities}
                nextBadgeHint={tmNextBadgeHint}
              />
              <EngagementBadgesCard
                earnedCount={tmBadges.length}
                totalCount={totalAchievements}
                badges={tmBadges}
                onNavigateAchievements={() => onNavigate?.('achievements')}
              />
              <EngagementTeamPulseCard
                active={tmPulseData.active}
                drifting={tmPulseData.drifting}
                inactive={tmPulseData.inactive}
              />
            </div>
            </div>

            {/* Responsive: hide engagement column on narrow screens */}
            <style>{`
              @media (max-width: 1200px) {
                .tm-engagement-column { display: none !important; }
              }
            `}</style>
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

            {/* MilestoneCard removed — replaced by engagement column */}
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
