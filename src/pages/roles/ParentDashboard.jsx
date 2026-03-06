// =============================================================================
// ParentDashboard — single-column vertical scroll, Lynx design language
// Preserves ALL Supabase queries and data logic from the original
// =============================================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { supabase } from '../../lib/supabase'
import { ChevronRight, DollarSign, AlertTriangle, Award } from '../../constants/icons'
import { usePriorityItems } from '../../components/parent/PriorityCardsEngine'
import { ActionItemsSidebar, QuickRsvpModal } from '../../components/parent/ActionItemsSidebar'
import ParentChildHero from './ParentChildHero'
import {
  EventDetailModal, PaymentOptionsModal, AddChildModal,
  ReRegisterModal, AlertDetailModal,
} from './ParentModals'
import WelcomeBanner from '../../components/shared/WelcomeBanner'
import DashboardContainer from '../../components/layout/DashboardContainer'
import DashboardGridLayout from '../../components/layout/DashboardGrid'
import EditLayoutButton from '../../components/layout/EditLayoutButton'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

// ═══ MAIN COMPONENT ═══
function ParentDashboard({ roleContext, navigateToTeamWall, showToast, onNavigate }) {
  const { profile } = useAuth()
  const { orgName } = useOrgBranding()
  const { selectedSport } = useSport()
  const { isDark } = useTheme()
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
  const [editMode, setEditMode] = useState(false)

  const initialLoadDone = useRef(false)

  // Priority engine
  const organizationId = organization?.id || registrationData[0]?.season?.organizations?.id
  const priorityEngine = usePriorityItems({
    children: registrationData, teamIds, seasonId, organizationId,
  })

  const primarySport = registrationData[0]?.season?.sports || selectedSport || { name: 'Volleyball', icon: '🏐' }

  const activeChildIdForEffect = (registrationData[activeChildIdx] || registrationData[0])?.id
  const activeChildForWidget = useMemo(() => {
    const child = registrationData[activeChildIdx] || registrationData[0]
    return child ? [child] : []
  }, [activeChildIdForEffect])

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
    : upcomingEvents.slice(0, 3)

  const activeChildUnpaid = paymentSummary.unpaidItems.filter(p => p.player_id === activeChild?.id)
  const totalChildDue = activeChildUnpaid.reduce((sum, p) => sum + (p.amount || 0), 0)

  const actionItems = (priorityEngine?.items || []).filter(i => !i.playerId || i.playerId === activeChild?.id)
  const visibleAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high')

  // ═══ BUILD WIDGET ARRAY (dynamic — conditional cards) ═══
  // 24-col grid, 20px row height — matches reference screenshot layout
  const parentWidgets = useMemo(() => {
    let yPos = 0
    const widgets = []

    // 1. Welcome Banner — full width
    widgets.push({ id: 'welcome-banner', label: 'Welcome Banner', defaultLayout: { x: 0, y: yPos, w: 24, h: 6 }, minW: 2, minH: 2, maxH: 8, component: <WelcomeBanner role="parent" userName={profile?.full_name} seasonName={registrationData[0]?.season?.name} childName={(registrationData[activeChildIdx] || registrationData[0])?.first_name} isDark={isDark} /> })
    yPos += 6

    // 2. Athlete Cards — full width (inject level/XP for active child)
    const enrichedChildren = registrationData.map((child, idx) => {
      if (idx === activeChildIdx) return { ...child, _level: xpData.level, _xpPct: xpData.xpToNext > 0 ? (xpData.currentXp / xpData.xpToNext) * 100 : 0 }
      return { ...child, _level: 1, _xpPct: 0 }
    })
    widgets.push({ id: 'athlete-cards', label: 'My Athletes', defaultLayout: { x: 0, y: yPos, w: 24, h: 8 }, minW: 2, minH: 2, maxH: 16, component: <ParentChildHero children={enrichedChildren} activeChildIdx={activeChildIdx} onSelectChild={setActiveChildIdx} onAddChild={() => setShowAddChildModal(true)} isDark={isDark} /> })
    yPos += 8

    // 3. Action Required — conditional, pulse on action buttons
    if (actionItems.length > 0) {
      widgets.push({ id: 'action-required', label: 'Action Required', defaultLayout: { x: 0, y: yPos, w: 24, h: 5 }, minW: 2, minH: 2, maxH: 20, component: (
        <div className={`rounded-2xl border overflow-hidden h-full ${isDark ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Action Required</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-extrabold animate-soft-pulse">{actionItems.length}</span>
          </div>
          <div className={`border-t ${isDark ? 'border-amber-500/10' : 'border-amber-200'}`}>
            {actionItems.slice(0, 4).map((item, idx) => (
              <button key={idx} onClick={() => handlePriorityAction(item)} className={`w-full flex items-center gap-3 px-5 py-3 text-left transition ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-amber-100/50'} ${idx > 0 ? (isDark ? 'border-t border-amber-500/10' : 'border-t border-amber-100') : ''}`}>
                <span className="text-lg">{item.icon || '⚠️'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                  <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.description}</p>
                </div>
                <span className="animate-soft-pulse"><ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} /></span>
              </button>
            ))}
          </div>
        </div>
      ) })
      yPos += 5
    }

    // 4. Next Event (left, w:14) + Team Hub (right, w:10)
    if (activeChildEvents.length > 0) {
      widgets.push({ id: 'next-event', label: 'Next Event', defaultLayout: { x: 0, y: yPos, w: 14, h: 9 }, minW: 4, minH: 4, maxH: 12, componentKey: 'NextEventCard' })
    }
    if (activeTeam) {
      widgets.push({ id: 'team-hub', label: 'Team Hub', defaultLayout: { x: 14, y: yPos, w: 10, h: 9 }, minW: 2, minH: 2, maxH: 10, component: (
        <button onClick={() => navigateToTeamWall?.(activeTeam.id)} className={`w-full rounded-2xl border p-5 flex flex-col justify-center gap-4 text-left transition h-full ${isDark ? 'bg-lynx-charcoal border-white/[0.06] hover:bg-white/[0.04]' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: activeTeam.color || '#6366F1' }}>{activeTeam.name?.[0] || 'T'}</div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeTeam.name}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>View team wall, photos & updates</p>
            </div>
          </div>
          <span className="text-lynx-sky text-xs font-bold uppercase tracking-wider">View Hub →</span>
        </button>
      ) })
    }
    if (activeChildEvents.length > 0 || activeTeam) yPos += 9

    // 5. Three equal columns — Season Record | Balance Due | Team Chat
    widgets.push({ id: 'season-record', label: 'Season Record', defaultLayout: { x: 0, y: yPos, w: 8, h: 7 }, minW: 4, minH: 4, maxH: 10, componentKey: 'SeasonRecordCard' })
    if (totalChildDue > 0) {
      widgets.push({ id: 'balance-due', label: 'Balance Due', defaultLayout: { x: 8, y: yPos, w: 8, h: 7 }, minW: 2, minH: 2, maxH: 12, component: (
        <div className={`rounded-2xl border overflow-hidden h-full ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance Due</h3>
            <DollarSign className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          </div>
          <div className={`px-4 pb-4 ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-200'}`}>
            <p className="text-3xl font-extrabold text-red-500 mt-2">${totalChildDue.toFixed(2)}</p>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{activeChildUnpaid.length} unpaid item{activeChildUnpaid.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowPaymentModal(true)} className="w-full py-2 rounded-xl bg-lynx-sky text-lynx-navy font-bold text-sm transition hover:brightness-110 animate-soft-pulse">Pay Now</button>
          </div>
        </div>
      ) })
    }
    widgets.push({ id: 'team-chat', label: 'Team Chat', defaultLayout: { x: 16, y: yPos, w: 8, h: 7 }, minW: 4, minH: 3, maxH: 12, componentKey: 'ChatPreviewCard' })
    yPos += 7

    // 6. Three equal columns — Engagement Progress | Quick Links | (spacer)
    widgets.push({ id: 'engagement-progress', label: 'Engagement Progress', defaultLayout: { x: 0, y: yPos, w: 8, h: 5 }, minW: 4, minH: 3, maxH: 10, componentKey: 'EngagementProgressCard' })
    widgets.push({ id: 'quick-links', label: 'Quick Links', defaultLayout: { x: 8, y: yPos, w: 8, h: 7 }, minW: 4, minH: 4, maxH: 10, componentKey: 'QuickLinksCard' })
    yPos += 7

    // 7. Achievements — conditional
    if (childAchievements.length > 0) {
      widgets.push({ id: 'achievements', label: 'Achievements', defaultLayout: { x: 0, y: yPos, w: 24, h: 4 }, minW: 2, minH: 2, maxH: 16, component: (
        <div className={`rounded-2xl border overflow-hidden h-full ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Achievements</h3>
            </div>
            <button onClick={() => onNavigate?.('achievements')} className="text-xs font-bold uppercase tracking-wider text-lynx-sky hover:underline">View All</button>
          </div>
          <div className={`px-5 pb-4 flex flex-wrap gap-3 ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-200'}`}>
            {childAchievements.slice(0, 6).map(ach => {
              const badge = ach.achievements
              const rc = { common: isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600', uncommon: isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600', rare: isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600', epic: isDark ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-50 text-purple-600', legendary: isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-600' }
              return (<div key={ach.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${rc[badge?.rarity] || rc.common}`}><span className="text-lg">{badge?.icon || '🏅'}</span><span className="text-sm font-bold">{badge?.name || 'Badge'}</span></div>)
            })}
          </div>
        </div>
      ) })
    }

    return widgets
  }, [registrationData, activeChildIdx, actionItems, activeChildEvents, activeTeam, childAchievements, totalChildDue, isDark, profile?.full_name, paymentSummary, teamRecord, xpData])

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
      <DashboardContainer className={`space-y-6 py-12 ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>
        <div className="text-center">
          <span className="text-r-5xl block mb-4">🏐</span>
          <h2 className={`text-r-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Welcome to Lynx!</h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>You haven't registered any players yet.</p>
          <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'} mb-r-4`}>Get started by registering for an open season below.</p>
        </div>
        {openSeasons.length > 0 && (
          <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px] p-6`}>
            <h2 className={`text-r-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>Open Registrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openSeasons.map(season => (
                <a key={season.id} href={getRegistrationUrl(season)} target="_blank" rel="noopener noreferrer"
                  className={`${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'} rounded-xl p-4 flex items-center gap-4 transition`}>
                  <div className="w-14 h-14 rounded-xl bg-lynx-sky/20 flex items-center justify-center text-r-3xl">{season.sports?.icon || '🏐'}</div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{season.name}</p>
                    <p className={`text-r-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{season.organizations?.name}</p>
                  </div>
                  <span className="text-lynx-sky font-semibold">Register →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </DashboardContainer>
    )
  }

  // ═══ RENDER — WIDGET GRID ═══
  return (
    <DashboardContainer className={`space-y-5 ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>

      {/* Widget Grid */}
      <DashboardGridLayout
        widgets={parentWidgets}
        editMode={editMode}
        onLayoutChange={(layouts) => console.log('Parent layout changed:', layouts)}
        role="parent"
        sharedProps={{
          role: 'parent', isDark, onNavigate, profile, registrationData, activeChildIdx,
          actionItems, activeChildEvents, events: activeChildEvents, activeTeam,
          childAchievements, totalChildDue, paymentSummary, teams,
          userName: profile?.full_name, seasonName: registrationData[0]?.season?.name,
          // For componentKey-resolved widgets
          event: activeChildEvents[0],
          selectedTeam: activeTeamWithRecord,
          xpData,
          onRsvp: (evt) => setQuickRsvpEvent(evt),
        }}
      />

      {/* Edit Layout FAB */}
      <EditLayoutButton editMode={editMode} onToggle={() => setEditMode(!editMode)} />

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
    </DashboardContainer>
  )
}

export { ParentDashboard }
