// =============================================================================
// ParentDashboard — v2 fixed layout, props-only components
// Preserves ALL Supabase queries and data logic from the original
// =============================================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { getLevelFromXP, getLevelTier } from '../../lib/engagement-constants'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { supabase } from '../../lib/supabase'
import { getPrimaryTeam, getPrimaryTeamInfo, getAllTeams } from '../../lib/team-utils'
import { OrphanPlayerBanner } from '../parent/ClaimAccountPage'
import { usePriorityItems } from '../../components/parent/PriorityCardsEngine'
import { ActionItemsSidebar, QuickRsvpModal } from '../../components/parent/ActionItemsSidebar'
import { ParentJourneyBar } from '../../components/parent/ParentOnboarding'
import {
  EventDetailModal, PaymentOptionsModal, AddChildModal,
  ReRegisterModal, AlertDetailModal,
} from './ParentModals'
// V2 shared components
import {
  HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  ThePlaybook, MascotNudge, V2DashboardLayout,
} from '../../components/v2'
// V2 parent-specific components
import KidCards from '../../components/v2/parent/KidCards'
import ParentScheduleTab from '../../components/v2/parent/ParentScheduleTab'
import ParentPaymentsTab from '../../components/v2/parent/ParentPaymentsTab'
import ParentFormsTab from '../../components/v2/parent/ParentFormsTab'
import ParentReportCardTab from '../../components/v2/parent/ParentReportCardTab'
import EngagementLevelCard from '../../components/engagement/EngagementLevelCard'
import EngagementActivityCard from '../../components/engagement/EngagementActivityCard'
import EngagementBadgesCard from '../../components/engagement/EngagementBadgesCard'
import EngagementTeamPulseCard from '../../components/engagement/EngagementTeamPulseCard'
import CreatePlayerPassModal from '../../components/parent/CreatePlayerPassModal'
import ManagePlayerPassModal from '../../components/parent/ManagePlayerPassModal'

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
  const { profile, organization } = useAuth()
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
  const [orgDetails, setOrgDetails] = useState(null)
  const [paymentSummary, setPaymentSummary] = useState({ totalDue: 0, totalPaid: 0, unpaidItems: [] })
  const [openSeasons, setOpenSeasons] = useState([])
  const [alerts, setAlerts] = useState([])
  const [childAchievements, setChildAchievements] = useState([])
  const [teamRecord, setTeamRecord] = useState({ wins: 0, losses: 0, lastResult: null })
  const [xpData, setXpData] = useState({ level: 1, currentXp: 0, xpToNext: 100, tierName: 'Rookie' })
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

  // Engagement column state
  const [parentBadges, setParentBadges] = useState([])
  const [totalAchievements, setTotalAchievements] = useState(0)
  const [weeklyRsvps, setWeeklyRsvps] = useState(0)
  const [weeklyShoutouts, setWeeklyShoutouts] = useState(0)
  const [weeklyPhotos, setWeeklyPhotos] = useState(0)
  const [volunteerSignups, setVolunteerSignups] = useState(0)
  const [parentPulseData, setParentPulseData] = useState({ active: 0, drifting: 0, inactive: 0 })
  const [parentNextBadgeProgress, setParentNextBadgeProgress] = useState(null)
  const [teamCoachMap, setTeamCoachMap] = useState({}) // { teamId: { userId, name } }
  const [playerPassChild, setPlayerPassChild] = useState(null) // child to create Player Pass for
  const [managePassChild, setManagePassChild] = useState(null) // child to manage Player Pass for

  const initialLoadDone = useRef(false)

  // Priority engine
  const organizationId = organization?.id || orgDetails?.id || registrationData[0]?.season?.organizations?.id
  const priorityEngine = usePriorityItems({
    children: registrationData, teamIds, seasonId, organizationId,
  })

  const primarySport = registrationData[0]?.season?.sports || selectedSport || { name: 'Sport', icon: '🏆' }

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

  useEffect(() => { loadOpenSeasons() }, [organization?.id])

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

  // Re-run checklist when registrationData changes (e.g. after navigation back with fresh data)
  useEffect(() => {
    if (registrationData.length > 0) {
      parentTutorial?.loadChecklistData?.(registrationData)
    }
  }, [registrationData])

  // Re-check checklist when window regains focus (catches photo uploads from profile page)
  useEffect(() => {
    function handleFocus() {
      if (registrationData.length > 0) {
        parentTutorial?.loadChecklistData?.(registrationData)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [parentTutorial, registrationData])

  // Load engagement column data when registrationData is available
  useEffect(() => {
    if (registrationData.length === 0 || !profile?.id) return
    loadParentEngagementData()
  }, [registrationData.length, profile?.id])

  async function loadParentEngagementData() {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString()
    const childIds = registrationData.map(c => c.id).filter(Boolean)

    // E1. Parent badges (from profile user)
    try {
      const { data: badgeData } = await supabase
        .from('player_achievements')
        .select('id, earned_at, achievement:achievement_id(id, name, icon, icon_url, badge_image_url, rarity)')
        .eq('player_id', profile.id)
        .order('earned_at', { ascending: false })
        .limit(10)
      setParentBadges((badgeData || []).map(b => ({ name: b.achievement?.name || 'Badge', icon: b.achievement?.icon || '🏅', badge_image_url: b.achievement?.badge_image_url, rarity: b.achievement?.rarity })))
    } catch { setParentBadges([]) }

    // E2. Total active achievements
    try {
      const { count: totalAch } = await supabase
        .from('achievements')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      setTotalAchievements(totalAch || 0)
    } catch { setTotalAchievements(0) }

    // E3. RSVPs submitted this week (for parent's children)
    try {
      if (childIds.length > 0) {
        const { count: rsvpCount } = await supabase
          .from('event_rsvps')
          .select('*', { count: 'exact', head: true })
          .in('player_id', childIds)
          .gte('created_at', weekAgoStr)
        setWeeklyRsvps(rsvpCount || 0)
      } else { setWeeklyRsvps(0) }
    } catch { setWeeklyRsvps(0) }

    // E4. Shoutouts given by parent this week
    try {
      const { count: shoutCount } = await supabase
        .from('shoutouts')
        .select('*', { count: 'exact', head: true })
        .eq('given_by', profile.id)
        .gte('created_at', weekAgoStr)
      setWeeklyShoutouts(shoutCount || 0)
    } catch { setWeeklyShoutouts(0) }

    // E5. Photos uploaded this week
    try {
      const { count: photoCount } = await supabase
        .from('team_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .eq('post_type', 'photo')
        .gte('created_at', weekAgoStr)
      setWeeklyPhotos(photoCount || 0)
    } catch { setWeeklyPhotos(0) }

    // E6. Volunteer signups this season
    try {
      if (teamIds.length > 0) {
        const { count: volCount } = await supabase
          .from('event_volunteers')
          .select('*', { count: 'exact', head: true })
          .eq('volunteer_id', profile.id)
        setVolunteerSignups(volCount || 0)
      } else { setVolunteerSignups(0) }
    } catch { setVolunteerSignups(0) }

    // E7. Kids' pulse — On Team / New (awaiting placement) / Inactive
    try {
      if (registrationData.length > 0) {
        let active = 0, drifting = 0, inactive = 0
        for (const child of registrationData) {
          const status = child.registrationStatus || child.status || 'active'
          if (['active', 'rostered', 'assigned'].includes(status)) active++
          else if (['pending', 'approved'].includes(status)) drifting++ // "New" — awaiting team placement
          else inactive++
        }
        setParentPulseData({ active, drifting, inactive })
      } else { setParentPulseData({ active: 0, drifting: 0, inactive: 0 }) }
    } catch { setParentPulseData({ active: 0, drifting: 0, inactive: 0 }) }

    // E8. Next badge hint
    try {
      const { data: progressData } = await supabase
        .from('player_achievement_progress')
        .select('achievement_id, current_value, target_value, achievements(id, name, stat_key, threshold)')
        .eq('player_id', profile.id)
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
        setParentNextBadgeProgress(best)
      } else { setParentNextBadgeProgress(null) }
    } catch { setParentNextBadgeProgress(null) }
  }

  async function loadChildEvals(regData) {
    try {
      const childIds = regData.map(c => c.id).filter(Boolean)
      if (childIds.length === 0) return regData
      const { data: evals } = await supabase
        .from('player_skill_ratings')
        .select('player_id, overall_rating, created_at')
        .in('player_id', childIds)
        .order('created_at', { ascending: false })
      const childEvals = {}
      ;(evals || []).forEach(ev => {
        if (!childEvals[ev.player_id]) childEvals[ev.player_id] = ev.overall_rating
      })
      const updated = regData.map(c => ({ ...c, overallRating: childEvals[c.id] || null }))
      setRegistrationData(updated)
      return updated
    } catch (err) {
      console.warn('Child eval query failed:', err)
      return regData
    }
  }

  async function loadParentDataFromProfile() {
    if (!profile?.id) { setLoading(false); return }
    try {
      // Scope children to active organization
      let playersQuery = supabase
        .from('players')
        .select(`*, team_players(team_id, jersey_number, teams(id, name, color, season_id)),
          season:seasons(id, name, sports(name, icon), organizations(id, name, slug, settings))`)
        .eq('parent_account_id', profile.id)
      if (organization?.id) {
        const { data: orgSeasons } = await supabase.from('seasons').select('id').eq('organization_id', organization.id)
        const orgSeasonIds = orgSeasons?.map(s => s.id) || []
        if (orgSeasonIds.length > 0) playersQuery = playersQuery.in('season_id', orgSeasonIds)
      }
      const { data: players } = await playersQuery

      if (players && players.length > 0) {
        const regData = players.map(p => {
          const teamPlayer = getPrimaryTeam(p.team_players)
          return { ...p, team: teamPlayer?.teams, jersey_number: teamPlayer?.jersey_number || p.jersey_number,
            registrationStatus: teamPlayer ? 'active' : 'pending' }
        })
        setRegistrationData(regData)
        await loadChildEvals(regData)
        // Include ALL of each player's teams so multi-team kids' data loads for every team
        const tIds = [...new Set(regData.flatMap(p => (p.team_players || []).map(tp => tp.team_id)).filter(Boolean))]
        setTeamIds(tIds)
        const currentSeasonId = regData[0]?.season?.id
        if (currentSeasonId) setSeasonId(currentSeasonId)
        if (tIds.length > 0) {
          const { data: teamsData } = await supabase.from('teams').select('*').in('id', tIds)
          setTeams(teamsData || [])
          loadTeamCoaches(tIds)
        }
        if (regData[0]?.season?.organizations) setOrgDetails(regData[0].season.organizations)
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
      const regData = children.map(c => {
        const teamPlayer = getPrimaryTeam(c.team_players)
        return {
          ...c, team: teamPlayer?.teams,
          jersey_number: teamPlayer?.jersey_number || c.jersey_number,
          registrationStatus: teamPlayer ? 'active' : 'pending',
        }
      })
      setRegistrationData(regData)
      await loadChildEvals(regData)
      const tIds = [...new Set(children.flatMap(c => c.team_players?.map(tp => tp.team_id) || []).filter(Boolean))]
      setTeamIds(tIds)
      if (tIds.length > 0) {
        const { data: teamsData } = await supabase.from('teams').select('*').in('id', tIds)
        setTeams(teamsData || [])
        const currentSeasonId = teamsData?.[0]?.season_id
        if (currentSeasonId) setSeasonId(currentSeasonId)
        await loadUpcomingEvents(tIds, currentSeasonId)
        // Load head coaches for each team
        loadTeamCoaches(tIds)
      } else {
        await loadUpcomingEvents([], null)
      }
      await loadPaymentSummary(regData)
      if (children[0]?.season?.organizations) setOrgDetails(children[0].season.organizations)
      const orgId = children[0]?.season?.organizations?.id || children[0]?.season?.organization_id
      if (orgId) await loadAlerts(orgId)
      parentTutorial?.loadChecklistData?.(regData)
    } catch (err) { console.warn('Error loading parent data:', err) }
    setLoading(false)
  }

  async function loadTeamCoaches(tIds) {
    try {
      const { data: coaches } = await supabase
        .from('team_coaches')
        .select('team_id, role, coaches(id, user_id, first_name, last_name)')
        .in('team_id', tIds)
      if (coaches) {
        const map = {}
        for (const tc of coaches) {
          // Prefer head_coach, fallback to any coach
          if (!map[tc.team_id] || tc.role === 'head_coach') {
            const c = tc.coaches
            if (c) {
              map[tc.team_id] = {
                userId: c.user_id,
                name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Coach',
              }
            }
          }
        }
        setTeamCoachMap(map)
      }
    } catch (err) { console.warn('Error loading team coaches:', err) }
  }

  async function handleMessageCoach(teamId, coachUserId, coachName) {
    if (!coachUserId) {
      showToast?.('No coach assigned to this team yet', 'info')
      return
    }
    try {
      // Check for existing DM channel between this parent and coach
      const { data: myChannels } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', profile.id)
      const myChannelIds = (myChannels || []).map(m => m.channel_id)

      let dmChannelId = null
      if (myChannelIds.length > 0) {
        const { data: dmChannels } = await supabase
          .from('chat_channels')
          .select('id, channel_type, channel_members(user_id)')
          .eq('channel_type', 'dm')
          .in('id', myChannelIds)
        for (const ch of (dmChannels || [])) {
          const memberIds = (ch.channel_members || []).map(m => m.user_id)
          if (memberIds.includes(coachUserId)) {
            dmChannelId = ch.id
            break
          }
        }
      }

      if (!dmChannelId) {
        // Create new DM channel
        const parentName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Parent'
        const { data: newChannel, error } = await supabase
          .from('chat_channels')
          .insert({
            name: `${parentName} ↔ ${coachName}`,
            channel_type: 'dm',
            team_id: teamId,
            season_id: seasonId,
            created_by: profile.id,
          })
          .select()
          .single()

        if (error) {
          showToast?.('Error creating conversation. Please try again.', 'error')
          return
        }
        dmChannelId = newChannel.id

        // Add both members
        await supabase.from('channel_members').insert([
          { channel_id: dmChannelId, user_id: profile.id, display_name: parentName, member_role: 'member', can_post: true, can_moderate: false },
          { channel_id: dmChannelId, user_id: coachUserId, display_name: coachName, member_role: 'member', can_post: true, can_moderate: true },
        ])
      }

      // Navigate to chat with this channel selected
      onNavigate?.(`chat-${dmChannelId}`)
    } catch (err) {
      console.error('Error in handleMessageCoach:', err)
      showToast?.('Error opening conversation. Please try again.', 'error')
    }
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
        const today = new Date().toISOString().split('T')[0]
        const unpaid = payments.filter(p => !p.paid)
        const pastDue = unpaid.filter(p => !p.due_date || p.due_date <= today)
        const upcoming = unpaid.filter(p => p.due_date && p.due_date > today)
        const pastDueTotal = pastDue.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        const upcomingTotal = upcoming.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        const totalDue = pastDueTotal + upcomingTotal
        const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        setPaymentSummary({ totalDue, totalPaid, pastDueTotal, upcomingTotal, pastDueCount: pastDue.length, upcomingCount: upcoming.length, unpaidItems: unpaid })
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
        .select('*, achievements(name, icon, icon_url, badge_image_url, description, rarity)')
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
      const info = getLevelFromXP(totalXp)
      setXpData({ level: info.level, currentXp: info.currentXp, xpToNext: info.xpToNext, tierName: info.tier })
    } catch (err) { console.warn('Error loading XP data:', err) }
  }

  async function loadOpenSeasons() {
    try {
      if (!organization?.id) return
      // Match mobile app: use registration_open boolean instead of date-based checks
      const { data } = await supabase.from('seasons')
        .select('*, sports(name, icon), organizations(id, name, slug, settings)')
        .eq('registration_open', true)
        .eq('organization_id', organization.id)
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
    const orgSlug = season.organizations?.slug || 'my-club'
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
  const kidCardsData = registrationData.map((child, idx) => {
    const primaryTeamInfo = getPrimaryTeamInfo(child.team_players)
    const allTeams = getAllTeams(child.team_players)
    const primaryTeamId = child.team?.id || getPrimaryTeam(child.team_players)?.team_id || null
    const primaryName = child.team?.name || primaryTeamInfo?.name || ''
    const extraCount = Math.max(0, allTeams.length - 1)
    const teamName = primaryName && extraCount > 0 ? `${primaryName} +${extraCount} more` : primaryName
    return {
      id: child.id,
      firstName: child.first_name || '',
      lastName: child.last_name || '',
      teamName,
      sportName: child.season?.sports?.name || '',
      seasonName: child.season?.name || '',
      photoUrl: child.photo_url || null,
      registrationStatus: child.registrationStatus || 'active',
      teamId: primaryTeamId,
      avatarGradient: `linear-gradient(135deg, ${child.team?.color || '#4BB9EC'}, ${child.team?.color || '#4BB9EC'}88)`,
      initials: `${(child.first_name || '')[0] || ''}${(child.last_name || '')[0] || ''}`.toUpperCase(),
      overallRating: child.overallRating || null,
      record: idx === activeChildIdx ? `${teamRecord.wins}-${teamRecord.losses}` : '—',
      nextEvent: activeChildEvents[0] ? new Date(activeChildEvents[0].event_date).toLocaleDateString('en-US', { weekday: 'short' }) : '—',
      badgeOrStreak: childAchievements.length > 0 && idx === activeChildIdx
        ? `🏅 ${childAchievements.length} badge${childAchievements.length > 1 ? 's' : ''}`
        : null,
      coachUserId: teamCoachMap[primaryTeamId]?.userId || null,
      coachName: teamCoachMap[primaryTeamId]?.name || null,
      playerAccountEnabled: !!child.player_account_enabled,
      playerUsername: child.player_username || null,
    }
  })

  // Map priority items for attention strip (use all children so count matches sidebar)
  const allActionItems = priorityEngine?.items || []
  const attentionItems = allActionItems.map(item => ({
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

  // ── Engagement column computed values ──
  const parentXp = profile?.total_xp || 0
  const parentLevelInfo = getLevelFromXP(parentXp)
  const parentTier = getLevelTier(parentLevelInfo.level)

  const parentActivities = [
    { icon: '📅', label: 'RSVPs submitted', count: weeklyRsvps, bg: '#FAEEDA', color: '#B45309' },
    { icon: '⭐', label: 'Shoutouts given', count: weeklyShoutouts, bg: '#EEEDFE', color: '#7C3AED' },
    { icon: '📷', label: 'Photos uploaded', count: weeklyPhotos, bg: '#E6F1FB', color: '#2563EB' },
    { icon: '🤝', label: 'Volunteer signups', count: volunteerSignups, bg: '#E1F5EE', color: '#059669' },
  ]

  const parentNextBadgeHint = parentNextBadgeProgress
    ? `${parentNextBadgeProgress.remaining} more ${parentNextBadgeProgress.action} for ${parentNextBadgeProgress.badgeName}`
    : null

  // Tab definitions (BodyTabs expects `id` not `key`)
  const parentTabs = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'payments', label: 'Payments' },
    { id: 'forms', label: 'Forms & Waivers' },
    { id: 'report-card', label: 'Report Card' },
  ]

  // ═══ RENDER — V2 LAYOUT ═══
  return (
    <>
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
              subLine={`${orgName || orgDetails?.name || organization?.name || ''} ${registrationData[0]?.season?.name ? '· ' + registrationData[0].season.name : ''}`}
              stats={heroStats}
            />

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

            {/* Attention Strip */}
            {attentionItems.length > 0 && (
              <AttentionStrip
                message={`${attentionItems.length} item${attentionItems.length !== 1 ? 's' : ''} need${attentionItems.length === 1 ? 's' : ''} attention`}
                ctaLabel="REVIEW NOW →"
                onClick={() => setShowActionSidebar(true)}
              />
            )}

            {/* Parent Onboarding Journey Bar — shows progress for new parents */}
            <ParentJourneyBar
              onNavigate={onNavigate}
              onTeamHub={() => activeTeam && navigateToTeamWall?.(activeTeam.id)}
              activeTeam={activeTeam}
            />

            {/* OPEN REGISTRATIONS BANNER — shows for returning parents who may need to register for a new season */}
            {(() => {
              const registeredSeasonIds = new Set(registrationData.map(c => c.season?.id).filter(Boolean))
              const unregisteredSeasons = openSeasons.filter(s => !registeredSeasonIds.has(s.id))
              if (unregisteredSeasons.length === 0) return null
              return (
                <div style={{
                  background: isDark ? 'rgba(75,185,236,0.08)' : '#e8f6fd',
                  border: `1px solid ${isDark ? 'rgba(75,185,236,0.2)' : '#b8e2f8'}`,
                  borderRadius: 14, padding: '14px 18px', marginBottom: 2,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>📝</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#e2e8f0' : '#10284C', margin: 0 }}>
                        {unregisteredSeasons.length === 1
                          ? `Registration is open for ${unregisteredSeasons[0].name}!`
                          : `${unregisteredSeasons.length} seasons have open registration!`
                        }
                      </p>
                      <p style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', margin: '2px 0 0' }}>
                        Register now to secure your spot.
                      </p>
                    </div>
                    <a
                      href={getRegistrationUrl(unregisteredSeasons[0])}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px', background: '#4BB9EC', color: '#fff',
                        fontSize: 13, fontWeight: 600, borderRadius: 14,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      Register →
                    </a>
                  </div>
                </div>
              )
            })()}

            {/* INNER FLEX: Content + Engagement Column side by side */}
            <div className="lynx-parent-layout" style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* MY PLAYERS — Kid Cards horizontal scroll */}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <KidCards
                children={kidCardsData}
                selectedChildId={activeChild?.id}
                onChildSelect={(childId) => {
                  const idx = registrationData.findIndex(c => c.id === childId)
                  if (idx >= 0) setActiveChildIdx(idx)
                }}
                onViewProfile={(playerId) => onNavigate?.(`player-profile-${playerId}`)}
                onViewPlayerCard={(playerId) => onNavigate?.(`player-${playerId}`)}
                onMessageCoach={(teamId, coachUserId, coachName) => handleMessageCoach(teamId, coachUserId, coachName)}
                onCreatePlayerPass={(child) => setPlayerPassChild(child)}
                onManagePlayerPass={(child) => setManagePassChild(child)}
              />
            </div>

            <BodyTabs
              tabs={parentTabs}
              activeTabId={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'schedule' && (
                <ParentScheduleTab
                  events={upcomingEvents}
                  children={registrationData.map(c => ({
                    ...c,
                    team: c.team || getPrimaryTeamInfo(c.team_players),
                  }))}
                  onRsvp={(evt) => setQuickRsvpEvent(evt)}
                  onEventClick={(evt) => setSelectedEventDetail(evt)}
                />
              )}
              {activeTab === 'payments' && (
                <ParentPaymentsTab
                  paymentSummary={paymentSummary}
                  children={registrationData}
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
            </div>

            {/* ENGAGEMENT COLUMN — 280px fixed, real data */}
            <div
              className="parent-engagement-column"
              style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <EngagementLevelCard
                levelInfo={parentLevelInfo}
                tierName={parentTier.name}
                xp={parentXp}
                onNavigateAchievements={() => onNavigate?.('achievements')}
              />
              <EngagementActivityCard
                activities={parentActivities}
                nextBadgeHint={parentNextBadgeHint}
              />
              <EngagementBadgesCard
                earnedCount={parentBadges.length}
                totalCount={totalAchievements}
                badges={parentBadges}
                onNavigateAchievements={() => onNavigate?.('achievements')}
              />
              <EngagementTeamPulseCard
                active={parentPulseData.active}
                drifting={parentPulseData.drifting}
                inactive={parentPulseData.inactive}
                title="My Kids"
                labels={{ active: 'On Team', drifting: 'New', inactive: 'Inactive' }}
              />
            </div>
            </div>

            {/* Responsive: hide engagement column on narrow screens */}
            <style>{`
              @media (max-width: 1200px) {
                .parent-engagement-column { display: none !important; }
              }
            `}</style>
          </>
        }
        sideContent={
          <>
            {/* Family Balance */}
            <FinancialSnapshot
              overline="Family Balance"
              heading={registrationData[0]?.season?.name || 'Current Season'}
              headingSub="Season Fees"
              collectedPct={
                (paymentSummary.totalPaid + paymentSummary.totalDue) > 0
                  ? Math.round((paymentSummary.totalPaid / (paymentSummary.totalPaid + paymentSummary.totalDue)) * 100)
                  : 100
              }
              receivedAmount={`$${Number(paymentSummary.totalPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              receivedLabel="Paid"
              outstandingAmount={paymentSummary.pastDueTotal > 0 ? `$${Number(paymentSummary.pastDueTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined}
              outstandingLabel="Due Now"
              breakdown={paymentSummary.upcomingTotal > 0 ? [
                { label: 'Upcoming', amount: paymentSummary.upcomingTotal, color: '#EAA900' },
              ] : undefined}
              dueDateText={
                paymentSummary.totalDue === 0 && paymentSummary.totalPaid > 0
                  ? '✓ All Paid'
                  : paymentSummary.pastDueTotal > 0
                    ? 'Balance due — tap below to pay'
                    : paymentSummary.upcomingTotal > 0
                      ? 'No balance due now — upcoming fees scheduled'
                      : null
              }
              primaryAction={
                paymentSummary.totalDue > 0
                  ? { label: 'Pay Balance Now →', onClick: () => onNavigate?.('payments'), variant: 'success' }
                  : null
              }
              secondaryAction={
                paymentSummary.totalDue > 0
                  ? { label: 'View Details', onClick: () => setShowPaymentModal(true) }
                  : null
              }
            />

            {/* The Playbook */}
            <ThePlaybook actions={playbookItems} />

            {/* Team Chat + Team Hub buttons */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              fontFamily: 'var(--v2-font)',
            }}>
              <button
                onClick={() => {
                  const child = kidCardsData.find(c => c.id === activeChild?.id) || kidCardsData[0]
                  if (child?.teamId) onNavigate?.('chats')
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 6,
                  padding: '14px 10px', borderRadius: 'var(--v2-radius)', border: 'none',
                  background: 'var(--v2-navy)', color: 'white',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
              >
                <span style={{ fontSize: 20 }}>💬</span>
                Team Chat
              </button>
              <button
                onClick={() => {
                  const child = kidCardsData.find(c => c.id === activeChild?.id) || kidCardsData[0]
                  if (child?.teamId) {
                    onNavigate?.(`teamwall-${child.teamId}`)
                  } else {
                    showToast?.(`Team Hub will be available once ${child?.firstName || 'your child'} is assigned to a team.`, 'info')
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 6,
                  padding: '14px 10px', borderRadius: 'var(--v2-radius)', border: 'none',
                  background: 'var(--v2-navy)', color: 'white',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
              >
                <span style={{ fontSize: 20 }}>🏟️</span>
                Team Hub
              </button>
            </div>
          </>
        }
      />

      {/* ═══ MODALS ═══ */}
      {selectedEventDetail && (
        <EventDetailModal event={selectedEventDetail} teams={teams} venues={[]}
          onClose={() => setSelectedEventDetail(null)} activeView="parent" />
      )}
      {showPaymentModal && (
        <PaymentOptionsModal amount={paymentSummary.totalDue} organization={orgDetails || organization}
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
          playerId={
            // Find the child player that belongs to this event's team
            (roleContext?.children || []).find(c =>
              c.team_players?.some(tp => tp.team_id === quickRsvpEvent?.team_id)
            )?.id || (roleContext?.children || [])[0]?.id
          }
          onClose={() => setQuickRsvpEvent(null)}
          onRsvp={() => { priorityEngine.refresh(); setQuickRsvpEvent(null) }}
          showToast={showToast} />
      )}
      {playerPassChild && (
        <CreatePlayerPassModal
          player={playerPassChild}
          seasonId={seasonId}
          organizationId={organization?.id}
          parentProfileId={profile?.id}
          onClose={() => {
            setPlayerPassChild(null)
            // Refresh registration data to pick up the new player_account_enabled flag
            loadParentData()
          }}
          onSuccess={() => {
            showToast?.('Player Pass created!', 'success')
          }}
        />
      )}
      {managePassChild && (
        <ManagePlayerPassModal
          player={managePassChild}
          onClose={() => setManagePassChild(null)}
          onRefresh={() => loadParentData()}
          showToast={showToast}
        />
      )}
    </>
  )
}

export { ParentDashboard }
