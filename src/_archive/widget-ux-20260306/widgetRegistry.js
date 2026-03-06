/**
 * Widget Registry — master list of all available dashboard cards.
 *
 * Each entry defines:
 * - id: unique identifier (kebab-case) — must match existing widget IDs in dashboards
 * - label: human-readable name shown in the library panel and drag handle
 * - description: short description of what this card shows
 * - category: grouping for the library panel
 * - roles: which roles can use this widget ['admin', 'coach', 'parent']
 * - defaultSize: { w, h } in 24-col / 20px-row grid units
 * - minSize: { w, h } minimum dimensions
 * - componentKey: string key used to resolve the actual React component
 * - icon: emoji for the library panel
 */

export const WIDGET_CATEGORIES = {
  OVERVIEW: 'Overview & Health',
  SCHEDULE: 'Schedule & Events',
  ROSTER: 'Roster & Players',
  FINANCIALS: 'Payments & Financials',
  COMMUNICATION: 'Communication & Social',
  ACTIONS: 'Actions & Tasks',
  PROGRESS: 'Progress & Journeys',
  ACHIEVEMENTS: 'Achievements & Stats',
}

export const widgetRegistry = [
  // ══════════════════════════════════════
  // OVERVIEW & HEALTH
  // ══════════════════════════════════════
  {
    id: 'welcome-banner',
    label: 'Welcome Banner',
    description: 'Personalized greeting with time-of-day awareness and motivational messages',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 6 },
    minSize: { w: 2, h: 2 },
    componentKey: 'WelcomeBanner',
    icon: '👋',
  },
  {
    id: 'org-health-hero',
    label: 'Organization Health',
    description: 'Health score ring, KPI pills, and needs-attention items for the whole org',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 14, h: 20 },
    minSize: { w: 2, h: 2 },
    componentKey: 'OrgHealthHero',
    icon: '🏥',
  },
  {
    id: 'team-health',
    label: 'Team Health',
    description: 'Attendance rate, game attendance, practice attendance, record, win rate',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'TeamHealthCard',
    icon: '📊',
  },
  {
    id: 'kpi-row',
    label: 'KPI Stats Row',
    description: 'Key numbers — players, families, coaches, teams, events',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 2, h: 2 },
    componentKey: 'OrgKpiRow',
    icon: '📈',
  },
  {
    id: 'all-teams-table',
    label: 'All Teams',
    description: 'Teams table with record, players, health bars, status',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 16 },
    minSize: { w: 2, h: 2 },
    componentKey: 'AllTeamsTable',
    icon: '🏟️',
  },
  {
    id: 'people-compliance',
    label: 'People & Compliance',
    description: 'Players, Parents, Coaches, Organization compliance status cards',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 2, h: 2 },
    componentKey: 'PeopleComplianceRow',
    icon: '🛡️',
  },
  {
    id: 'dashboard-filters',
    label: 'Dashboard Filters',
    description: 'Season, sport, and team filters that control all dashboard data',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 2, h: 2 },
    componentKey: 'DashboardFilterCard',
    icon: '🔍',
  },
  {
    id: 'placeholder',
    label: 'Placeholder',
    description: 'Empty card to reserve space — add as many as you want',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 2, h: 2 },
    componentKey: 'PlaceholderWidget',
    icon: '⬜',
    allowMultiple: true,
  },
  {
    id: 'spacer',
    label: 'Spacer',
    description: 'Invisible spacing widget — no outline, no text. Use for layout gaps.',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
    componentKey: 'SpacerWidget',
    icon: '⬜',
    allowMultiple: true,
  },

  // ══════════════════════════════════════
  // SCHEDULE & EVENTS
  // ══════════════════════════════════════
  {
    id: 'gameday-hero',
    label: 'Game Day Hero',
    description: 'Next match hero card — opponent, countdown, record, form badges',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 14, h: 18 },
    minSize: { w: 2, h: 2 },
    componentKey: 'CoachGameDayHeroV2',
    icon: '🏐',
  },
  {
    id: 'calendar-strip',
    label: 'Calendar Strip',
    description: 'Week-view calendar — scroll through days, see events per day',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 14 },
    minSize: { w: 2, h: 2 },
    componentKey: 'CalendarStripCard',
    icon: '📅',
  },
  {
    id: 'org-upcoming-events',
    label: 'Upcoming Events',
    description: 'Next 3-5 upcoming events with type indicators',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 16 },
    minSize: { w: 2, h: 2 },
    componentKey: 'OrgUpcomingEvents',
    icon: '📋',
  },
  {
    id: 'practice-hero',
    label: 'Practice Hero',
    description: 'Practice event hero card with attendance and practice plan',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 9, h: 12 },
    minSize: { w: 6, h: 8 },
    componentKey: 'PracticeHeroCard',
    icon: '⚡',
  },
  {
    id: 'also-this-week',
    label: 'Also This Week',
    description: 'Flat text card cycling through remaining events this week',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 14, h: 8 },
    minSize: { w: 2, h: 2 },
    componentKey: 'AlsoThisWeekCard',
    icon: '📌',
  },

  // ══════════════════════════════════════
  // ROSTER & PLAYERS
  // ══════════════════════════════════════
  {
    id: 'squad-roster',
    label: 'Squad Roster',
    description: 'Player roster list with photos, positions, and status indicators',
    category: WIDGET_CATEGORIES.ROSTER,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 10, h: 16 },
    minSize: { w: 2, h: 2 },
    componentKey: 'SquadRosterCard',
    icon: '👥',
  },
  {
    id: 'top-players',
    label: 'Top Players',
    description: 'Top performing players by various stats',
    category: WIDGET_CATEGORIES.ROSTER,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'TopPlayersCard',
    icon: '⭐',
  },
  {
    id: 'child-hero',
    label: 'My Players',
    description: 'Child player cards — photo, team, jersey, position',
    category: WIDGET_CATEGORIES.ROSTER,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'ParentChildHero',
    icon: '🧒',
  },

  // ══════════════════════════════════════
  // PAYMENTS & FINANCIALS
  // ══════════════════════════════════════
  {
    id: 'org-financials',
    label: 'Financial Summary',
    description: 'Collected vs outstanding amounts, collection progress bar',
    category: WIDGET_CATEGORIES.FINANCIALS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 16 },
    minSize: { w: 2, h: 2 },
    componentKey: 'OrgFinancials',
    icon: '💰',
  },
  {
    id: 'balance-due',
    label: 'Balance Due',
    description: 'Outstanding balance with pay button — only shows if money is owed',
    category: WIDGET_CATEGORIES.FINANCIALS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'BalanceDueCard',
    icon: '💳',
  },

  // ══════════════════════════════════════
  // COMMUNICATION & SOCIAL
  // ══════════════════════════════════════
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Auto-cycling org-wide notifications for admin, tabbed feed for coach',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 10, h: 5 },
    minSize: { w: 2, h: 2 },
    componentKey: 'AdminNotificationsCard',
    icon: '🔔',
  },
  {
    id: 'org-wall-preview',
    label: 'Team Wall',
    description: 'Latest post from the team wall',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 16 },
    minSize: { w: 2, h: 2 },
    componentKey: 'OrgWallPreview',
    icon: '📱',
  },
  {
    id: 'team-wall-preview',
    label: 'Team Wall (Coach)',
    description: 'Coach-scoped team wall preview card',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'TeamWallPreviewCard',
    icon: '📱',
  },
  {
    id: 'team-chat',
    label: 'Team Chat',
    description: 'Latest team chat messages with quick preview',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 6, h: 8 },
    minSize: { w: 4, h: 4 },
    componentKey: 'ChatPreviewCard',
    icon: '💬',
  },
  {
    id: 'team-hub',
    label: 'Team Hub Preview',
    description: 'Quick link to team wall, photos, and updates',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 6 },
    minSize: { w: 2, h: 2 },
    componentKey: 'TeamHubPreview',
    icon: '🏠',
  },

  // ══════════════════════════════════════
  // ACTIONS & TASKS
  // ══════════════════════════════════════
  {
    id: 'action-checklist',
    label: 'Action Checklist',
    description: 'Detailed action items sorted by urgency with Handle buttons',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'AdminActionChecklist',
    icon: '✅',
  },
  {
    id: 'action-items',
    label: 'Action Items',
    description: 'Coach tasks — stats to enter, RSVPs pending, evals due',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 14 },
    minSize: { w: 2, h: 2 },
    componentKey: 'CoachActionItemsCard',
    icon: '📝',
  },
  {
    id: 'org-action-items',
    label: 'Action Items (Admin)',
    description: 'Admin action items sidebar panel',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 16 },
    minSize: { w: 2, h: 2 },
    componentKey: 'OrgActionItems',
    icon: '📝',
  },
  {
    id: 'action-required',
    label: 'Action Required',
    description: 'Parent tasks — payments, RSVPs, waivers, emergency contacts',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'ActionRequiredCard',
    icon: '⚠️',
  },
  {
    id: 'quick-actions-top',
    label: 'Quick Actions',
    description: 'Admin shortcut buttons with counter badges',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 2, h: 2 },
    componentKey: 'AdminQuickActions',
    icon: '⚡',
  },
  {
    id: 'coach-tools',
    label: 'Coach Tools',
    description: 'Coach shortcut buttons — Send Blast, Build Lineup, Enter Stats',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 12 },
    minSize: { w: 2, h: 2 },
    componentKey: 'CoachTools',
    icon: '⚡',
  },

  // ══════════════════════════════════════
  // PROGRESS & JOURNEYS
  // ══════════════════════════════════════
  {
    id: 'setup-tracker',
    label: 'Setup Tracker',
    description: 'Admin onboarding progress bar — shows next setup step',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 6 },
    minSize: { w: 2, h: 2 },
    componentKey: 'AdminSetupTracker',
    icon: '🚀',
  },
  {
    id: 'season-journey',
    label: 'Season Journey',
    description: 'Vertical list of seasons with progress bars and blocker labels',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 10, h: 20 },
    minSize: { w: 2, h: 2 },
    componentKey: 'SeasonJourneyList',
    icon: '🗺️',
  },
  {
    id: 'gameday-journey',
    label: 'Game Day Journey',
    description: 'Step-by-step game day workflow tracker',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 14, h: 8 },
    minSize: { w: 2, h: 2 },
    componentKey: 'GameDayJourneyCard',
    icon: '🎯',
  },
  {
    id: 'season-setup-hero',
    label: 'Season Setup',
    description: 'Coach setup task tracker — roster, evals, positions, uniforms',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 9, h: 12 },
    minSize: { w: 6, h: 8 },
    componentKey: 'SeasonSetupHeroCard',
    icon: '🔧',
  },
  {
    id: 'team-readiness',
    label: 'Team Readiness',
    description: 'Checklist — roster verified, evaluations done, positions set',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 12 },
    minSize: { w: 2, h: 2 },
    componentKey: 'TeamReadinessCard',
    icon: '🏁',
  },
  {
    id: 'challenges',
    label: 'Challenges',
    description: 'Active team challenges and create new challenge button',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'ChallengesCard',
    icon: '🔥',
  },

  // ══════════════════════════════════════
  // ACHIEVEMENTS & STATS
  // ══════════════════════════════════════
  {
    id: 'achievements',
    label: 'Achievements',
    description: 'Player badges and achievements with rarity tiers',
    category: WIDGET_CATEGORIES.ACHIEVEMENTS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 2, h: 2 },
    componentKey: 'AchievementsCard',
    icon: '🏆',
  },

  // ══════════════════════════════════════
  // PARENT-SPECIFIC
  // ══════════════════════════════════════
  {
    id: 'next-event',
    label: 'Next Event',
    description: 'Dark hero card for next upcoming event with RSVP + Directions',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 14, h: 8 },
    minSize: { w: 6, h: 5 },
    componentKey: 'NextEventCard',
    icon: '📅',
  },
  {
    id: 'season-record',
    label: 'Season Record',
    description: 'Big W/L numbers with last game result',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 7, h: 6 },
    minSize: { w: 4, h: 4 },
    componentKey: 'SeasonRecordCard',
    icon: '🏆',
  },
  {
    id: 'engagement-progress',
    label: 'Engagement Progress',
    description: 'Level badge and XP progress bar to next level',
    category: WIDGET_CATEGORIES.ACHIEVEMENTS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 7, h: 5 },
    minSize: { w: 4, h: 3 },
    componentKey: 'EngagementProgressCard',
    icon: '⭐',
  },
  {
    id: 'quick-links',
    label: 'Quick Links',
    description: 'Parent navigation shortcuts — schedule, payments, roster',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 10, h: 6 },
    minSize: { w: 4, h: 4 },
    componentKey: 'QuickLinksCard',
    icon: '🔗',
  },

  // ── Player widgets ──
  {
    id: 'player-hero',
    label: 'Player Hero',
    description: 'Dark hero identity card — name, team, OVR badge, XP bar',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent', 'player'],
    defaultSize: { w: 14, h: 10 },
    minSize: { w: 6, h: 6 },
    componentKey: 'PlayerHeroCard',
    icon: '🎮',
  },
  {
    id: 'scouting-report',
    label: 'Scouting Report',
    description: 'Discrete 5-segment skill bars for player evaluation',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent', 'player'],
    defaultSize: { w: 10, h: 14 },
    minSize: { w: 6, h: 8 },
    componentKey: 'ScoutingReportCard',
    icon: '📊',
  },
  {
    id: 'trophy-case',
    label: 'Trophy Case',
    description: 'Badge grid with tier colors and glow animations',
    category: WIDGET_CATEGORIES.ACHIEVEMENTS,
    roles: ['admin', 'coach', 'parent', 'player'],
    defaultSize: { w: 10, h: 10 },
    minSize: { w: 6, h: 6 },
    componentKey: 'TrophyCaseCard',
    icon: '🏆',
  },
  {
    id: 'last-game',
    label: 'Last Game',
    description: 'Stats from the most recent game — kills, aces, digs, blocks',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent', 'player'],
    defaultSize: { w: 7, h: 5 },
    minSize: { w: 4, h: 4 },
    componentKey: 'LastGameCard',
    icon: '🏐',
  },
  {
    id: 'daily-challenge',
    label: 'Daily Challenge',
    description: 'Active challenge with progress bar and XP reward',
    category: WIDGET_CATEGORIES.ACHIEVEMENTS,
    roles: ['admin', 'coach', 'parent', 'player'],
    defaultSize: { w: 7, h: 5 },
    minSize: { w: 4, h: 3 },
    componentKey: 'DailyChallengeCard',
    icon: '⚡',
  },
]

/**
 * Get widgets available for a specific role
 */
export function getWidgetsForRole(role) {
  return widgetRegistry.filter(w => w.roles.includes(role))
}

/**
 * Get widgets grouped by category for a specific role
 */
export function getWidgetsByCategory(role) {
  const available = getWidgetsForRole(role)
  const grouped = {}
  for (const widget of available) {
    if (!grouped[widget.category]) {
      grouped[widget.category] = []
    }
    grouped[widget.category].push(widget)
  }
  return grouped
}

/**
 * Find a registry entry by widget ID
 */
export function getWidgetById(id) {
  return widgetRegistry.find(w => w.id === id)
}
