// =============================================================================
// ParentDashboard — v2 fixed layout, props-only components
// Preserves ALL Supabase queries and data logic from the original
// =============================================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { supabase } from '../../lib/supabase'
import { OrphanPlayerBanner } from '../parent/ClaimAccountPage'
import { usePriorityItems } from '../../components/parent/PriorityCardsEngine'
import { ActionItemsSidebar, QuickRsvpModal } from '../../components/parent/ActionItemsSidebar'
import {
  EventDetailModal, PaymentOptionsModal, AddChildModal,
  ReRegisterModal, AlertDetailModal,
} from './ParentModals'
// V2 shared components
import {
  TopBar, HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  ThePlaybook, MilestoneCard, MascotNudge, V2DashboardLayout,
} from '../../components/v2'
// V2 parent-specific components
import KidCards from '../../components/v2/parent/KidCards'
import ParentScheduleTab from '../../components/v2/parent/ParentScheduleTab'
import ParentPaymentsTab from '../../components/v2/parent/ParentPaymentsTab'
import ParentFormsTab from '../../components/v2/parent/ParentFormsTab'
import ParentReportCardTab from '../../components/v2/parent/ParentReportCardTab'
import BadgeShowcase from '../../components/v2/parent/BadgeShowcase'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

// ═══ MAIN COMPONENT ═══
function ParentDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate, activeView, availableViews = [], onSwitchRole }) {
  const { profile } = useAuth()
  const { orgName } = useOrgBranding()
  const { selectedSport } = useSport()
  const { isDark, toggleTheme } = useTheme()
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
  const [childAchievements, setChildAchievements] = useState([])
  const [teamRecord, setTeamRecord] = useState({ wins: 0, losses: 0, lastResult: null })
  const [xpData, setXpData] = useState({ level: 1, currentXp: 0, xpToNext: 1000 })
  const [activeChildIdx, setActiveChildIdx] = useState(0)

  // Modal state
  const [selectedEventDetail, setSelectedEventDetail] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [showReRegisterModal, setShowReRegisterModal] = useState(null)
  const [showActionSidebar, setShowActionSidebar] = useState(false)
  const [quickRsvpEvent, setQuickRsvpEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('schedule')

  const initialLoadDone = useRef(false)

  // Priority engine
  const organizationId = organization?.id || registrationData[0]?.season?.organizations?.id
  const priorityEngine = usePriorityItems({
    children: registrationData, teamIds, seasonId, organizationId,
  })

  const primarySport = registrationData[0]?.season?.sports || selectedSport || { name: 'Volleyball', icon: '🏐' }

  // ═══ DATA LOADING (preserved exactly) ═══
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

  useEffect(() => { loadOpenSeasons() }, [])

  // Load achievements when active child changes
  useEffect(() => {
    const child = registrationData[activeChildIdx] || registrationData[0]
    if (child?.id) loadChildAchievements(child.id)
  }, [activeChildIdx, registrationData.length])

  // Load team record when active child's team changes
  useEffect(() => {
    const child = registrationData[activeChildIdx] || registrationData[0]
    const team = child?.team
    if (team?.id) loadTeamRecord(team.id, seasonId)
    else setTeamRecord({ wins: 0, losses: 0, lastResult: null })
  }, [activeChildIdx, registrationData.length, seasonId])

  // Load XP data when active child changes
  useEffect(() => {
    const child = registrationData[activeChildIdx] || registrationData[0]
    if (child?.id) loadXpData(child.id)
    else setXpData({ level: 1, currentXp: 0, xpToNext: 1000 })
  }, [activeChildIdx, registrationData.length])

  async function loadParentDataFromProfile() {
    if (!profile?.id) { setLoading(false); return }
    try {
      const { data: players } = await supabase
        .from('players')
        .select(`*, team_players(team_id, jersey_number, teams(id, name, color, season_id)),
          season:seasons(id, name, sports(name, icon), organizations(id, name, slug, settings))`)
        .eq('parent_account_id', profile.id)

      if (players && players.length > 0) {
        const regData = players.map(p => {
          const teamPlayer = p.team_players?.[0]
          return { ...p, team: teamPlayer?.teams, jersey_number: teamPlayer?.jersey_number || p.jersey_number,
            registrationStatus: teamPlayer ? 'active' : 'pending' }
        })
        setRegistrationData(regData)
        const tIds = [...new Set(regData.map(p => p.team?.id).filter(Boolean))]
        setTeamIds(tIds)
        const currentSeasonId = regData[0]?.season?.id
        if (currentSeasonId) setSeasonId(currentSeasonId)
        if (tIds.length > 0) {
          const { data: teamsData } = await supabase.from('teams').select('*').in('id', tIds)
          setTeams(teamsData || [])
        }
        if (regData[0]?.season?.organizations) setOrganization(regData[0].season.organizations)
        await loadUpcomingEvents(tIds, currentSeasonId)
        await loadPaymentSummary(regData)
        await loadAlerts(regData[0]?.season?.organizations?.id)
        parentTutorial?.loadChecklistData?.(regData)
      }
    } catch (err) { console.warn('Error loading parent data:', err) }
    setLoading(false)
  }

  async function loadParentData() {
    try {
      const children = roleContext.children || []
      const regData = children.map(c => ({
        ...c, team: c.team_players?.[0]?.teams,
        jersey_number: c.team_players?.[0]?.jersey_number || c.jersey_number,
        registrationStatus: c.team_players?.[0] ? 'active' : 'pending',
      }))
      setRegistrationData(regData)
      const tIds = [...new Set(children.flatMap(c => c.team_players?.map(tp => tp.team_id) || []).filter(Boolean))]
      setTeamIds(tIds)
      if (tIds.length > 0) {
        const { data: teamsData } = await supabase.from('teams').select('*').in('id', tIds)
        setTeams(teamsData || [])
        const currentSeasonId = teamsData?.[0]?.season_id
        if (currentSeasonId) setSeasonId(currentSeasonId)
        await loadUpcomingEvents(tIds, currentSeasonId)
      } else {
        await loadUpcomingEvents([], null)
      }
      await loadPaymentSummary(regData)
      if (children[0]?.season?.organizations) setOrganization(children[0].season.organizations)
      const orgId = children[0]?.season?.organizations?.id || children[0]?.season?.organization_id
      if (orgId) await loadAlerts(orgId)
      parentTutorial?.loadChecklistData?.(regData)
    } catch (err) { console.warn('Error loading parent data:', err) }
    setLoading(false)
  }

  async function loadUpcomingEvents(teamIdsList, passedSeasonId = null) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const effectiveSeasonId = passedSeasonId || seasonId
      if (!teamIdsList?.length) { setUpcomingEvents([]); return }
      let query = supabase.from('schedule_events')
        .select('*, teams!schedule_events_team_id_fkey(name, color)')
        .in('team_id', teamIdsList).gte('event_date', today)
        .order('event_date', { ascending: true }).order('event_time', { ascending: true }).limit(10)
      if (effectiveSeasonId) query = query.eq('season_id', effectiveSeasonId)
      const { data } = await query
      setUpcomingEvents(data || [])
    } catch (err) { console.warn('Error loading events:', err); setUpcomingEvents([]) }
  }

  async function loadPaymentSummary(players) {
    if (!players?.length) return
    try {
      const playerIds = players.map(p => p.id)
      const { data: payments } = await supabase.from('payments').select('*').in('player_id', playerIds)
      if (payments) {
        const unpaid = payments.filter(p => !p.paid)
        const totalDue = unpaid.reduce((sum, p) => sum + (p.amount || 0), 0)
        const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0)
        setPaymentSummary({ totalDue, totalPaid, unpaidItems: unpaid })
      }
    } catch (err) { console.warn('Error loading payments:', err) }
  }

  async function loadAlerts(orgId) {
    if (!orgId) return
    try {
      const { data } = await supabase.from('announcements').select('*')
        .eq('organization_id', orgId).eq('is_active', true)
        .order('created_at', { ascending: false }).limit(5)
      setAlerts(data || [])
    } catch (err) { console.warn('Error loading alerts:', err) }
  }

  async function loadChildAchievements(playerId) {
    if (!playerId) return
    try {
      const { data } = await supabase.from('player_achievements')
        .select('*, achievements(name, icon, description, rarity)')
        .eq('player_id', playerId)
        .order('earned_at', { ascending: false })
        .limit(8)
      setChildAchievements(data || [])
    } catch (err) { console.warn('Error loading achievements:', err) }
  }

  async function loadTeamRecord(teamId, sid) {
    if (!teamId) return
    try {
      let query = supabase.from('schedule_events')
        .select('id, event_date, opponent_name, our_score, opponent_score')
        .eq('team_id', teamId).eq('event_type', 'game')
        .not('our_score', 'is', null)
      if (sid) query = query.eq('season_id', sid)
      const { data: games } = await query
      if (games && games.length > 0) {
        let wins = 0, losses = 0
        const sorted = [...games].sort((a, b) => (b.event_date || '').localeCompare(a.event_date || ''))
        games.forEach(g => { if ((g.our_score || 0) > (g.opponent_score || 0)) wins++; else losses++ })
        const last = sorted[0]
        const lastResult = last ? `${(last.our_score || 0) > (last.opponent_score || 0) ? 'Won' : 'Lost'} ${last.our_score}-${last.opponent_score}` : null
        setTeamRecord({ wins, losses, lastResult })
      } else { setTeamRecord({ wins: 0, losses: 0, lastResult: null }) }
    } catch (err) { console.warn('Error loading team record:', err) }
  }

  async function loadXpData(playerId) {
    if (!playerId) return
    try {
      const { data: ledger } = await supabase.from('xp_ledger')
        .select('xp_amount').eq('player_id', playerId)
      const totalXp = (ledger || []).reduce((sum, r) => sum + (r.xp_amount || 0), 0)
      const level = Math.floor(totalXp / 1000) + 1
      setXpData({ level, currentXp: totalXp % 1000, xpToNext: 1000 })
    } catch (err) { console.warn('Error loading XP data:', err) }
  }

  async function loadOpenSeasons() {
    try {
      // Match mobile app: use registration_open boolean instead of date-based checks
      const { data } = await supabase.from('seasons')
        .select('*, sports(name, icon), organizations(id, name, slug, settings)')
        .eq('registration_open', true)
        .order('created_at', { ascending: false })
      setOpenSeasons(data || [])
    } catch (err) { console.warn('Error loading open seasons:', err) }
  }

  // ═══ CALLBACKS ═══
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

  // ═══ DERIVED STATE ═══
  const activeChild = registrationData[activeChildIdx] || registrationData[0]
  const activeTeam = activeChild?.team
  const activeTeamWithRecord = activeTeam ? { ...activeTeam, _record: teamRecord } : null
  const activeChildEvents = activeTeam
    ? upcomingEvents.filter(e => e.team_id === activeTeam.id).slice(0, 3)
    : []

  const activeChildUnpaid = paymentSummary.unpaidItems.filter(p => p.player_id === activeChild?.id)
  const totalChildDue = activeChildUnpaid.reduce((sum, p) => sum + (p.amount || 0), 0)

  const actionItems = (priorityEngine?.items || []).filter(i => !i.playerId || i.playerId === activeChild?.id)
  const visibleAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high')

  // Derive unique seasons from children registrations for the season switcher
  // (must be before conditional returns to maintain hook order)
  const parentSeasons = useMemo(() => {
    const seen = new Map()
    for (const child of registrationData) {
      const s = child.season
      if (s?.id && !seen.has(s.id)) seen.set(s.id, { id: s.id, name: s.name })
    }
    return [...seen.values()]
  }, [registrationData])

  // ═══ CONDITIONAL RETURNS ═══
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (registrationData.length === 0) {
    return (
      <div style={{ padding: '48px 24px', fontFamily: 'var(--v2-font, inherit)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🏐</span>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--v2-navy)', marginBottom: 8 }}>Welcome!</h2>
          <p style={{ color: 'var(--v2-text-secondary)' }}>You haven't registered any players yet.</p>
          <p style={{ color: 'var(--v2-text-muted)', marginBottom: 16 }}>Get started by registering for an open season below.</p>
        </div>
        {openSeasons.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid var(--v2-border-subtle)', borderRadius: 14, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--v2-text-primary)', marginBottom: 16 }}>Open Registrations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {openSeasons.map(season => (
                <a key={season.id} href={getRegistrationUrl(season)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, background: 'var(--v2-surface)', textDecoration: 'none' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(75,185,236,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{season.sports?.icon || '🏐'}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: 'var(--v2-text-primary)' }}>{season.name}</p>
                    <p style={{ fontSize: 14, color: 'var(--v2-text-muted)' }}>{season.organizations?.name}</p>
                  </div>
                  <span style={{ color: 'var(--v2-sky)', fontWeight: 600 }}>Register →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══ DERIVED VALUES FOR V2 ═══
  const familyName = profile?.last_name
    ? `The ${profile.last_name} Family`
    : profile?.full_name || 'Your Family'

  const eventsThisWeek = (() => {
    const now = new Date()
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
    return upcomingEvents.filter(e => new Date(e.event_date) <= endOfWeek).length
  })()

  const getParentGreeting = () => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const firstName = profile?.full_name?.split(' ')[0] || ''
    if (paymentSummary.totalDue > 0) return `${timeGreeting}, ${firstName}. You have a balance due.`
    if (eventsThisWeek > 0) return `${timeGreeting}, ${firstName}. ${eventsThisWeek} event${eventsThisWeek > 1 ? 's' : ''} this week!`
    return `${timeGreeting}, ${firstName}.`
  }

  const heroStats = [
    { label: 'Kids', value: registrationData.length },
    { label: 'This Week', value: eventsThisWeek },
    { label: 'Due', value: paymentSummary.totalDue > 0 ? `$${Number(paymentSummary.totalDue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0' },
    { label: 'Badges', value: childAchievements.length },
  ]

  // Map registrationData to KidCards format
  const kidCardsData = registrationData.map((child, idx) => ({
    id: child.id,
    firstName: child.first_name || '',
    lastName: child.last_name || '',
    teamName: child.team?.name || child.team_players?.[0]?.teams?.name || '',
    avatarGradient: `linear-gradient(135deg, ${child.team?.color || '#4BB9EC'}, ${child.team?.color || '#4BB9EC'}88)`,
    initials: `${(child.first_name || '')[0] || ''}${(child.last_name || '')[0] || ''}`.toUpperCase(),
    attendance: '—',
    record: idx === activeChildIdx ? `${teamRecord.wins}-${teamRecord.losses}` : '—',
    nextEvent: activeChildEvents[0] ? new Date(activeChildEvents[0].event_date).toLocaleDateString('en-US', { weekday: 'short' }) : '—',
    badgeOrStreak: childAchievements.length > 0 && idx === activeChildIdx
      ? `🏅 ${childAchievements.length} badge${childAchievements.length > 1 ? 's' : ''}`
      : null,
  }))

  // Map childAchievements for BadgeShowcase
  const showcaseBadges = childAchievements.map(ach => ({
    name: ach.achievements?.name || 'Badge',
    emoji: ach.achievements?.icon || '🏅',
    tier: ach.achievements?.rarity || 'common',
    childName: activeChild?.first_name,
    earnedDate: ach.earned_at ? new Date(ach.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
  }))

  // Map priority items for attention strip
  const attentionItems = actionItems.map(item => ({
    icon: item.icon || '⚠️',
    label: item.title,
    type: item.actionType === 'payment' ? 'coral' : item.actionType === 'waiver' ? 'amber' : 'sky',
    onClick: () => handlePriorityAction(item),
  }))

  // Playbook actions for parent
  const playbookItems = [
    { icon: '📅', label: 'RSVP', onClick: () => onNavigate?.('schedule') },
    { icon: '💳', label: 'Pay Now', onClick: () => setShowPaymentModal(true) },
    { icon: '📝', label: 'Forms', onClick: () => onNavigate?.('waivers') },
    { icon: '💬', label: 'Message', onClick: () => onNavigate?.('chats') },
    { icon: '📊', label: 'Report Card', onClick: () => setActiveTab('report-card') },
    { icon: '🏅', label: 'Badges', onClick: () => onNavigate?.('achievements') },
  ]

  // Tab definitions
  const parentTabs = [
    { key: 'schedule', label: 'Schedule' },
    { key: 'payments', label: 'Payments' },
    { key: 'forms', label: 'Forms & Waivers' },
    { key: 'report-card', label: 'Report Card' },
  ]

  // ═══ RENDER — V2 LAYOUT ═══
  return (
    <>
      <TopBar
        roleLabel="Lynx Parent"
        navLinks={[
          { label: 'Home', pageId: 'dashboard', isActive: true, onClick: () => onNavigate?.('dashboard') },
          { label: 'Schedule', pageId: 'schedule', onClick: () => onNavigate?.('schedule') },
          { label: 'Payments', pageId: 'payments', onClick: () => onNavigate?.('payments') },
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

      {/* Orphan Player Banner */}
      <div style={{ padding: '0 24px' }}>
        <OrphanPlayerBanner onNavigate={onNavigate} />
      </div>

      <V2DashboardLayout
        mainContent={
          <>
            {/* Hero Card */}
            <HeroCard
              orgLine={familyName}
              greeting={getParentGreeting()}
              subLine={`${orgName || organization?.name || ''} ${registrationData[0]?.season?.name ? '· ' + registrationData[0].season.name : ''}`}
              stats={heroStats}
            />

            {/* Kid Cards */}
            <KidCards
              children={kidCardsData}
              selectedChildId={activeChild?.id}
              onChildSelect={(childId) => {
                const idx = registrationData.findIndex(c => c.id === childId)
                if (idx >= 0) setActiveChildIdx(idx)
              }}
            />

            {/* Attention Strip */}
            {attentionItems.length > 0 && (
              <AttentionStrip items={attentionItems} />
            )}

            {/* Body Tabs */}
            <BodyTabs
              tabs={parentTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'schedule' && (
                <ParentScheduleTab
                  events={upcomingEvents}
                  children={registrationData.map(c => ({
                    ...c,
                    team: c.team || c.team_players?.[0]?.teams,
                  }))}
                  onRsvp={(evt) => setQuickRsvpEvent(evt)}
                  onEventClick={(evt) => setSelectedEventDetail(evt)}
                />
              )}
              {activeTab === 'payments' && (
                <ParentPaymentsTab
                  paymentSummary={paymentSummary}
                  onPayNow={() => setShowPaymentModal(true)}
                  onViewAll={() => onNavigate?.('payments')}
                />
              )}
              {activeTab === 'forms' && (
                <ParentFormsTab
                  priorityItems={priorityEngine?.items || []}
                  onAction={handlePriorityAction}
                  onNavigate={onNavigate}
                />
              )}
              {activeTab === 'report-card' && (
                <ParentReportCardTab
                  achievements={childAchievements}
                  xpData={xpData}
                  teamRecord={teamRecord}
                  childName={activeChild?.first_name}
                  onViewAll={() => onNavigate?.('achievements')}
                />
              )}
            </BodyTabs>

            {/* Mascot Nudge */}
            <MascotNudge
              message={
                childAchievements.length > 0
                  ? `${activeChild?.first_name || 'Your player'} earned ${childAchievements.length} badge${childAchievements.length > 1 ? 's' : ''}! Check them out.`
                  : paymentSummary.totalDue > 0
                    ? `You have $${Number(paymentSummary.totalDue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due. Tap Pay Now to settle up.`
                    : 'Everything looks great! Enjoy the season.'
              }
            />
          </>
        }
        sideContent={
          <>
            {/* Family Balance */}
            <FinancialSnapshot
              title="Family Balance"
              collected={paymentSummary.totalPaid}
              outstanding={paymentSummary.totalDue}
              breakdown={[
                { label: 'Paid', amount: paymentSummary.totalPaid },
                { label: 'Due', amount: paymentSummary.totalDue },
              ]}
              ctaLabel={paymentSummary.totalDue > 0 ? 'Pay Balance Now' : undefined}
              onCta={paymentSummary.totalDue > 0 ? () => setShowPaymentModal(true) : undefined}
            />

            {/* Badge Showcase */}
            <BadgeShowcase badges={showcaseBadges} />

            {/* The Playbook */}
            <ThePlaybook actions={playbookItems} />

            {/* Milestone Card */}
            <MilestoneCard
              variant="gold"
              title={`${activeChild?.first_name || 'Player'}'s Progress`}
              xpCurrent={xpData.currentXp}
              xpGoal={xpData.xpToNext}
              level={xpData.level}
            />
          </>
        }
      />

      {/* ═══ MODALS ═══ */}
      {selectedEventDetail && (
        <EventDetailModal event={selectedEventDetail} teams={teams} venues={[]}
          onClose={() => setSelectedEventDetail(null)} activeView="parent" />
      )}
      {showPaymentModal && (
        <PaymentOptionsModal amount={paymentSummary.totalDue} organization={organization}
          fees={paymentSummary.unpaidItems} players={registrationData}
          onClose={() => setShowPaymentModal(false)} showToast={showToast} />
      )}
      {showAddChildModal && (
        <AddChildModal existingChildren={registrationData}
          onClose={() => setShowAddChildModal(false)} showToast={showToast} />
      )}
      {showReRegisterModal && (
        <ReRegisterModal player={showReRegisterModal.player} season={showReRegisterModal.season}
          onClose={() => setShowReRegisterModal(null)} showToast={showToast} />
      )}
      {selectedAlert && (
        <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
      <ActionItemsSidebar items={priorityEngine.items} onAction={handlePriorityAction}
        onClose={() => setShowActionSidebar(false)} isOpen={showActionSidebar} />
      {quickRsvpEvent && (
        <QuickRsvpModal event={quickRsvpEvent} userId={profile?.id}
          onClose={() => setQuickRsvpEvent(null)}
          onRsvp={() => { priorityEngine.refresh(); setQuickRsvpEvent(null) }}
          showToast={showToast} />
      )}
    </>
  )
}

export { ParentDashboard }
