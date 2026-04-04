// Route configuration: maps old page IDs to URL paths
// Used by useAppNavigate hook and route definitions

export const ROUTES = {
  // Dashboards (role-based)
  'dashboard': '/dashboard',

  // Club Management
  'teams': '/teams',
  'coaches': '/coaches',
  'staff': '/staff',
  'team-hubs': '/team-hubs',

  // Operations
  'registrations': '/registrations',
  'jerseys': '/jerseys',
  'schedule': '/schedule',
  'attendance': '/attendance',
  'payments': '/payments',
  'coach-availability': '/schedule/availability',

  // Roster
  'roster': '/roster',

  // Practice
  'drills': '/drills',
  'practice-plans': '/practice-plans',
  'reflection-templates': '/reflection-templates',

  // Game Day
  'gameprep': '/gameprep',
  'lineups': '/lineups',
  'standings': '/standings',
  'leaderboards': '/leaderboards',

  // Communication
  'chats': '/chats',
  'blasts': '/blasts',
  'notifications': '/notifications',
  'email': '/email',

  // Insights
  'reports': '/reports',
  'registration-funnel': '/reports/funnel',
  'season-archives': '/archives',
  'org-directory': '/directory',

  // Season Management (guided workflow)
  'season-management': '/admin/seasons',

  // Settings
  'seasons': '/settings/seasons',
  'templates': '/settings/templates',
  'waivers': '/settings/waivers',
  'paymentsetup': '/settings/payment-setup',
  'organization': '/settings/organization',
  'venues': '/settings/venues',
  'data-export': '/settings/data-export',
  'subscription': '/settings/subscription',

  // Stats
  'stats': '/stats',

  // Achievements
  'achievements': '/achievements',

  // Profile
  'my-profile': '/profile',

  // Platform Mode
  'platform-overview': '/platform/overview',
  'platform-organizations': '/platform/organizations',
  'platform-users': '/platform/users',
  'platform-subscriptions': '/platform/subscriptions',
  'platform-analytics': '/platform/analytics',
  'platform-support': '/platform/support',
  'platform-notifications': '/platform/notifications',
  'platform-audit': '/platform/audit',
  'platform-settings': '/platform/settings',

  // Parent-specific
  'messages': '/messages',
  'invite': '/invite',
  'my-stuff': '/my-stuff',
  'parent-register': '/parent/register',
  'claim-account': '/claim-account',
}

// Reverse map: URL path → old page ID (for matching active nav items)
export const PATH_TO_PAGE_ID = Object.fromEntries(
  Object.entries(ROUTES).map(([pageId, path]) => [path, pageId])
)

// Get URL path for a page ID. Handles dynamic pages like player-{id} and teamwall-{id}
// Optional params object for passing dynamic route data (e.g., { seasonId })
export function getPathForPage(pageId, params) {
  if (!pageId) return '/dashboard'

  // Dynamic: player profile (parent viewing child)
  if (pageId.startsWith('player-profile-')) {
    const playerId = pageId.replace('player-profile-', '')
    return `/parent/player/${playerId}/profile`
  }
  if (pageId.startsWith('player-') && !pageId.startsWith('player-profile-')) {
    const playerId = pageId.replace('player-', '')
    return `/parent/player/${playerId}`
  }

  // Dynamic: season management with season ID
  if (pageId === 'season-management') {
    const seasonId = params?.seasonId
    return seasonId ? `/admin/seasons/${seasonId}` : '/admin/seasons'
  }

  // Dynamic: chat with specific channel
  if (pageId.startsWith('chat-')) {
    const channelId = pageId.replace('chat-', '')
    return `/chats/${channelId}`
  }

  // Dynamic: team wall
  if (pageId.startsWith('teamwall-')) {
    const teamId = pageId.replace('teamwall-', '')
    return `/teams/${teamId}`
  }

  return ROUTES[pageId] || '/dashboard'
}

// Get page ID from a URL path (for nav highlighting)
export function getPageIdFromPath(pathname) {
  // Dynamic routes
  const playerProfileMatch = pathname.match(/^\/parent\/player\/([^/]+)\/profile$/)
  if (playerProfileMatch) return `player-profile-${playerProfileMatch[1]}`

  const playerMatch = pathname.match(/^\/parent\/player\/([^/]+)$/)
  if (playerMatch) return `player-${playerMatch[1]}`

  const chatMatch = pathname.match(/^\/chats\/([^/]+)$/)
  if (chatMatch) return 'chats'

  const teamWallMatch = pathname.match(/^\/teams\/([^/]+)$/)
  if (teamWallMatch) return `teamwall-${teamWallMatch[1]}`

  // Season management with optional seasonId
  const seasonMatch = pathname.match(/^\/admin\/seasons\/([^/]+)$/)
  if (seasonMatch) return 'season-management'

  return PATH_TO_PAGE_ID[pathname] || 'dashboard'
}

// Document titles per route
export const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/teams': 'Team Management',
  '/coaches': 'Staff Portal',
  '/staff': 'Staff Portal',
  '/team-hubs': 'Team Hubs',
  '/registrations': 'Registrations',
  '/jerseys': 'Jerseys',
  '/schedule': 'Schedule',
  '/schedule/availability': 'Coach Availability',
  '/attendance': 'Attendance & RSVP',
  '/payments': 'Payments',
  '/roster': 'Roster Manager',
  '/drills': 'Drill Library',
  '/practice-plans': 'Practice Plans',
  '/reflection-templates': 'Reflection Templates',
  '/gameprep': 'Game Prep',
  '/lineups': 'Lineups',
  '/standings': 'Standings',
  '/leaderboards': 'Leaderboards',
  '/chats': 'Chats',
  '/blasts': 'Announcements',
  '/notifications': 'Push Notifications',
  '/email': 'Email',
  '/reports': 'Reports & Analytics',
  '/reports/funnel': 'Registration Funnel',
  '/archives': 'Season Archives',
  '/directory': 'Org Directory',
  '/admin/seasons': 'Season Management',
  '/settings/seasons': 'Season Management',
  '/settings/templates': 'Registration Forms',
  '/settings/waivers': 'Waivers',
  '/settings/payment-setup': 'Payment Setup',
  '/settings/organization': 'Organization Settings',
  '/settings/venues': 'Venue Manager',
  '/settings/data-export': 'Data Export',
  '/settings/subscription': 'Subscription',
  '/stats': 'My Stats',
  '/achievements': 'Achievements',
  '/profile': 'My Profile',
  '/platform/overview': 'Platform Overview',
  '/platform/organizations': 'Platform Organizations',
  '/platform/users': 'Platform Users',
  '/platform/subscriptions': 'Platform Subscriptions',
  '/platform/analytics': 'Platform Analytics',
  '/platform/support': 'Platform Support',
  '/platform/notifications': 'Platform Notifications',
  '/platform/audit': 'Platform Audit Log',
  '/platform/settings': 'Platform Settings',
  '/messages': 'Messages',
  '/invite': 'Invite Friends',
  '/my-stuff': 'My Stuff',
  '/parent/register': 'Registration Hub',
  '/claim-account': 'Claim Account',
}
