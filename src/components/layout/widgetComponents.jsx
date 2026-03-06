// =============================================================================
// Widget Component Resolver — maps registry componentKeys to React components.
// Components that don't exist yet render a placeholder with "Component not built yet".
// =============================================================================

import React from 'react'

// ── Admin / Dashboard widgets ──
import OrgHealthHero from '../dashboard/OrgHealthHero'
import AdminSetupTracker from '../dashboard/AdminSetupTracker'
import AdminActionChecklist from '../dashboard/AdminActionChecklist'
import AdminQuickActions from '../dashboard/AdminQuickActions'
import OrgKpiRow from '../dashboard/OrgKpiRow'
import AllTeamsTable from '../dashboard/AllTeamsTable'
import OrgActionItems from '../dashboard/OrgActionItems'
import OrgUpcomingEvents from '../dashboard/OrgUpcomingEvents'
import PeopleComplianceRow from '../dashboard/PeopleComplianceRow'
import OrgFinancials from '../dashboard/OrgFinancials'
import OrgWallPreview from '../dashboard/OrgWallPreview'
import SeasonJourneyList from '../dashboard/SeasonJourneyList'
import AdminNotificationsCard from '../dashboard/AdminNotificationsCard'
import DashboardFilterCard from '../dashboard/DashboardFilterCard'
import PlaceholderWidget from '../dashboard/PlaceholderWidget'
import SpacerWidget from './SpacerWidget'

// ── Coach widgets ──
import CoachGameDayHeroV2 from '../coach/CoachGameDayHeroV2'
import CoachHeroCarousel from '../coach/CoachHeroCarousel'
import PracticeHeroCard from '../coach/PracticeHeroCard'
import SeasonSetupHeroCard from '../coach/SeasonSetupHeroCard'
import IdleHeroCard from '../coach/IdleHeroCard'
import CoachNotifications from '../coach/CoachNotifications'
import SquadRosterCard from '../coach/SquadRosterCard'
import CoachTools from '../coach/CoachTools'
import AlsoThisWeekCard from '../coach/AlsoThisWeekCard'
import CalendarStripCard from '../coach/CalendarStripCard'
import CoachActionItemsCard from '../coach/CoachActionItemsCard'
import TeamHealthCard from '../coach/TeamHealthCard'
import TeamReadinessCard from '../coach/TeamReadinessCard'
import TopPlayersCard from '../coach/TopPlayersCard'
import ChallengesCard from '../coach/ChallengesCard'
import TeamWallPreviewCard from '../coach/TeamWallPreviewCard'
import GameDayJourneyCard from '../coach/GameDayJourneyCard'
import AchievementsCard from '../coach/AchievementsCard'

// ── Shared widgets ──
import WelcomeBanner from '../shared/WelcomeBanner'
import ChatPreviewCard from '../shared/ChatPreviewCard'

// ── Parent widgets ──
import ParentChildHero from '../../pages/roles/ParentChildHero'
import NextEventCard from '../parent/NextEventCard'
import SeasonRecordCard from '../parent/SeasonRecordCard'
import EngagementProgressCard from '../parent/EngagementProgressCard'
import QuickLinksCard from '../parent/QuickLinksCard'

// ── Player widgets ──
import PlayerHeroCard from '../player/PlayerHeroCard'
import ScoutingReportCard from '../player/ScoutingReportCard'
import TrophyCaseCard from '../player/TrophyCaseCard'
import LastGameCard from '../player/LastGameCard'
import DailyChallengeCard from '../player/DailyChallengeCard'

/**
 * Maps componentKey → React component.
 * Keys match the componentKey field in widgetRegistry.js.
 */
const componentMap = {
  // Shared
  WelcomeBanner,
  ChatPreviewCard,

  // Admin / Dashboard
  OrgHealthHero,
  AdminSetupTracker,
  AdminActionChecklist,
  AdminQuickActions,
  OrgKpiRow,
  AllTeamsTable,
  OrgActionItems,
  OrgUpcomingEvents,
  PeopleComplianceRow,
  OrgFinancials,
  OrgWallPreview,
  SeasonJourneyList,
  AdminNotificationsCard,
  DashboardFilterCard,
  PlaceholderWidget,
  SpacerWidget,

  // Coach
  CoachGameDayHeroV2,
  CoachHeroCarousel,
  PracticeHeroCard,
  SeasonSetupHeroCard,
  IdleHeroCard,
  CoachNotifications,
  SquadRosterCard,
  CoachTools,
  AlsoThisWeekCard,
  CalendarStripCard,
  CoachActionItemsCard,
  TeamHealthCard,
  TeamReadinessCard,
  TopPlayersCard,
  ChallengesCard,
  TeamWallPreviewCard,
  GameDayJourneyCard,
  AchievementsCard,

  // Parent
  ParentChildHero,
  NextEventCard,
  SeasonRecordCard,
  EngagementProgressCard,
  QuickLinksCard,

  // Player
  PlayerHeroCard,
  ScoutingReportCard,
  TrophyCaseCard,
  LastGameCard,
  DailyChallengeCard,
}

/**
 * Placeholder component for widgets whose component hasn't been built yet
 */
function WidgetPlaceholder({ label, id }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
      <span className="text-2xl mb-2">🧩</span>
      <span className="text-r-sm font-bold text-slate-500">{label}</span>
      <span className="text-r-xs text-slate-400 mt-1">Component not built yet</span>
      <span className="text-r-xs text-slate-300 mt-1 font-mono">{id}</span>
    </div>
  )
}

/**
 * Resolve a componentKey to a rendered React element.
 * Returns a placeholder if the component doesn't exist.
 */
export function resolveWidget(componentKey, props = {}) {
  const Component = componentMap[componentKey]
  if (Component) {
    return <Component {...props} />
  }
  return <WidgetPlaceholder label={componentKey} id={componentKey} />
}

/**
 * Check if a component exists (is built and importable)
 */
export function widgetExists(componentKey) {
  return componentKey in componentMap
}
