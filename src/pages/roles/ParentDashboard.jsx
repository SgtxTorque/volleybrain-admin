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

  // ═══ BUILD WIDGET ARRAY (hardcoded layout — Carlos's export) ═══
  const parentWidgets = useMemo(() => {
    const enrichedChildren = registrationData.map((child, idx) => {
      if (idx === activeChildIdx) return { ...child, _level: xpData.level, _xpPct: xpData.xpToNext > 0 ? (xpData.currentXp / xpData.xpToNext) * 100 : 0 }
      return { ...child, _level: 1, _xpPct: 0 }
    })

    return [
      // 1. Welcome Banner (11×4 at 0,0)
      { id: 'welcome-banner', label: 'Welcome Banner',
        defaultLayout: { x: 0, y: 0, w: 11, h: 4 }, minW: 4, minH: 2, maxH: 8,
        component: <WelcomeBanner role="parent" userName={profile?.full_name} seasonName={registrationData[0]?.season?.name} childName={activeChild?.first_name} isDark={isDark} /> },

      // 2. Parent Journey (11×4 at 11,0)
      { id: 'parent-journey', label: 'Season Onboarding',
        defaultLayout: { x: 11, y: 0, w: 11, h: 4 }, minW: 8, minH: 3,
        componentKey: 'ParentJourneyCard' },

      // 3. Spacer Divider (1×1 at 0,4)
      { id: 'spacer-divider', label: 'Spacer',
        defaultLayout: { x: 0, y: 4, w: 1, h: 1 }, minW: 1, minH: 1,
        componentKey: 'SpacerWidget' },

      // 3b. Spacer Divider 2 (17×1 at 3,4)
      { id: 'spacer-divider-2', label: 'Spacer',
        defaultLayout: { x: 3, y: 4, w: 17, h: 1 }, minW: 1, minH: 1,
        componentKey: 'SpacerWidget' },

      // 4. Action Required (9×7 at 0,5) — always present, empty state when no items
      { id: 'action-required', label: 'Action Required',
        defaultLayout: { x: 0, y: 5, w: 9, h: 7 }, minW: 4, minH: 4, maxH: 20,
        component: (
          <div className={`rounded-2xl border overflow-hidden h-full ${isDark ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Action Required</h3>
              </div>
              {actionItems.length > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-extrabold">{actionItems.length}</span>}
            </div>
            <div className={`border-t overflow-y-auto ${isDark ? 'border-amber-500/10' : 'border-amber-200'}`} style={{ maxHeight: 'calc(100% - 36px)' }}>
              {actionItems.length > 0 ? actionItems.slice(0, 4).map((item, idx) => (
                <button key={idx} onClick={() => handlePriorityAction(item)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-amber-100/50'} ${idx > 0 ? (isDark ? 'border-t border-amber-500/10' : 'border-t border-amber-100') : ''}`}>
                  <span className="text-base">{item.icon || '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-r-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                    <p className={`text-r-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.description}</p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                </button>
              )) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-2xl mb-1">✅</span>
                  <p className={`text-r-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>All caught up!</p>
                  <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No action items right now</p>
                </div>
              )}
            </div>
          </div>
        ) },

      // 5. Athlete Cards (8×7 at 10,5)
      { id: 'athlete-cards', label: 'My Athletes',
        defaultLayout: { x: 10, y: 5, w: 8, h: 7 }, minW: 4, minH: 4, maxH: 16,
        component: <ParentChildHero children={enrichedChildren} activeChildIdx={activeChildIdx} onSelectChild={setActiveChildIdx} onAddChild={() => setShowAddChildModal(true)} isDark={isDark} /> },

      // 6. Engagement Progress (4×6 at 19,5)
      { id: 'engagement-progress', label: 'Engagement Progress',
        defaultLayout: { x: 19, y: 5, w: 4, h: 6 }, minW: 4, minH: 3, maxH: 10,
        componentKey: 'EngagementProgressCard' },

      // 7. Achievements (4×6 at 19,11) — always present, empty state when none
      { id: 'achievements', label: 'Achievements',
        defaultLayout: { x: 19, y: 11, w: 4, h: 6 }, minW: 4, minH: 3, maxH: 16,
        component: (
          <div className={`rounded-2xl border overflow-hidden h-full ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Achievements</h3>
              </div>
              <button onClick={() => onNavigate?.('achievements')} className="text-[10px] font-bold uppercase tracking-wider text-lynx-sky hover:underline">All</button>
            </div>
            <div className={`px-3 pb-2 overflow-y-auto ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-200'}`} style={{ maxHeight: 'calc(100% - 32px)' }}>
              {childAchievements.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 pt-2">
                  {childAchievements.slice(0, 6).map(ach => {
                    const badge = ach.achievements
                    return (<div key={ach.id} className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}><span className="w-8 h-8 flex items-center justify-center text-lg">{badge?.icon || '🏅'}</span><span className={`text-[9px] font-bold truncate w-full text-center px-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{badge?.name || 'Badge'}</span></div>)
                  })}
                  {childAchievements.length > 6 && (
                    <div className={`flex flex-col items-center justify-center py-1.5 rounded-lg ${isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                      <span className="text-r-xs font-bold">+{childAchievements.length - 6}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-3 text-center">
                  <span className="text-xl mb-1">🏅</span>
                  <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No badges yet</p>
                </div>
              )}
            </div>
          </div>
        ) },

      // 8. Next Event (9×9 at 0,12)
      { id: 'next-event', label: 'Next Event',
        defaultLayout: { x: 0, y: 12, w: 9, h: 9 }, minW: 4, minH: 4, maxH: 12,
        componentKey: 'NextEventCard' },

      // 9. Calendar Strip (8×9 at 10,12)
      { id: 'calendar-strip', label: 'Calendar Strip',
        defaultLayout: { x: 10, y: 12, w: 8, h: 9 }, minW: 6, minH: 4, maxH: 16,
        componentKey: 'CalendarStripCard' },

      // 10. Team Hub (4×9 at 19,17) — always present, empty state when no team
      { id: 'team-hub', label: 'Team Hub',
        defaultLayout: { x: 19, y: 17, w: 4, h: 9 }, minW: 4, minH: 4, maxH: 12,
        component: activeTeam ? (
          <button onClick={() => navigateToTeamWall?.(activeTeam.id)} className={`w-full rounded-2xl border p-3 flex flex-col justify-center gap-3 text-left transition h-full ${isDark ? 'bg-lynx-charcoal border-white/[0.06] hover:bg-white/[0.04]' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-r-sm" style={{ backgroundColor: activeTeam.color || '#6366F1' }}>{activeTeam.name?.[0] || 'T'}</div>
            <p className={`font-semibold text-r-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeTeam.name}</p>
            <p className={`text-r-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>View team wall, photos & updates</p>
            <span className="text-lynx-sky text-[10px] font-bold uppercase tracking-wider mt-auto">View Hub →</span>
          </button>
        ) : (
          <div className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 h-full ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
            <span className="text-xl">🏠</span>
            <p className={`text-r-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No team assigned</p>
          </div>
        ) },

      // 11. Quick Links (4×9 at 0,21)
      { id: 'quick-links', label: 'Quick Links',
        defaultLayout: { x: 0, y: 21, w: 4, h: 9 }, minW: 4, minH: 4, maxH: 10,
        componentKey: 'QuickLinksCard' },

      // 12. Balance Due (4×8 at 5,21) — always present, empty state when $0
      { id: 'balance-due', label: 'Balance Due',
        defaultLayout: { x: 5, y: 21, w: 4, h: 8 }, minW: 4, minH: 4, maxH: 12,
        component: (
          <div className={`rounded-2xl border overflow-hidden h-full ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
            <div className="px-3 py-2 flex items-center justify-between">
              <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance Due</h3>
              <DollarSign className={`w-3.5 h-3.5 ${totalChildDue > 0 ? (isDark ? 'text-red-400' : 'text-red-500') : (isDark ? 'text-green-400' : 'text-green-500')}`} />
            </div>
            <div className={`px-3 pb-3 ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-200'}`}>
              {totalChildDue > 0 ? (
                <>
                  <p className="text-r-2xl font-extrabold text-red-500 mt-2 whitespace-nowrap">${totalChildDue.toFixed(2)}</p>
                  <p className={`text-r-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{activeChildUnpaid.length} unpaid</p>
                  <button onClick={() => setShowPaymentModal(true)} className="w-full py-2 rounded-xl bg-lynx-sky text-lynx-navy font-bold text-r-sm transition hover:brightness-110">Pay Now</button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-3 text-center">
                  <span className="text-xl mb-1">✅</span>
                  <p className={`text-r-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>Paid Up</p>
                  <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No balance due</p>
                </div>
              )}
            </div>
          </div>
        ) },

      // 13. Season Record (4×8 at 10,21)
      { id: 'season-record', label: 'Season Record',
        defaultLayout: { x: 10, y: 21, w: 4, h: 8 }, minW: 4, minH: 4, maxH: 10,
        componentKey: 'SeasonRecordCard' },

      // 14. Give Shoutout (4×8 at 14,21)
      { id: 'give-shoutout', label: 'Give Shoutout',
        defaultLayout: { x: 14, y: 21, w: 4, h: 8 }, minW: 4, minH: 4,
        componentKey: 'GiveShoutoutCard' },

      // 15. Spacer Bottom (1×1 at 0,30)
      { id: 'spacer-bottom', label: 'Spacer',
        defaultLayout: { x: 0, y: 30, w: 1, h: 1 }, minW: 1, minH: 1,
        componentKey: 'SpacerWidget' },

      // 16. Team Chat (4×8 at 19,26)
      { id: 'team-chat', label: 'Team Chat',
        defaultLayout: { x: 19, y: 26, w: 4, h: 8 }, minW: 4, minH: 3, maxH: 12,
        componentKey: 'ChatPreviewCard' },
    ]
  }, [registrationData, activeChildIdx, actionItems, activeChildEvents, activeTeam, childAchievements, totalChildDue, isDark, profile?.full_name, paymentSummary, teamRecord, xpData])

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

      {/* ── Season + Child Switcher — fixed UI above grid ── */}
      {(parentSeasons.length > 1 || registrationData.length > 1) && (
        <div className="flex items-center gap-4 flex-wrap">
          {/* Season filter — only when children span multiple seasons */}
          {parentSeasons.length > 1 && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Season</span>
              {parentSeasons.map(s => (
                <button key={s.id} onClick={() => setSeasonId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-r-sm font-semibold transition-colors ${
                    seasonId === s.id
                      ? 'bg-lynx-sky text-white'
                      : isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>{s.name}</button>
              ))}
            </div>
          )}
          {/* Child switcher — only when multiple children */}
          {registrationData.length > 1 && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Player</span>
              {registrationData.map((child, idx) => (
                <button
                  key={child.id}
                  onClick={() => setActiveChildIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-r-sm font-semibold transition-colors whitespace-nowrap ${
                    idx === activeChildIdx
                      ? 'bg-lynx-sky text-white'
                      : isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {child.first_name}
                  {child.team_players?.[0]?.teams?.name && (
                    <span className={`text-[10px] ${idx === activeChildIdx ? 'text-white/70' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {child.team_players[0].teams.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
