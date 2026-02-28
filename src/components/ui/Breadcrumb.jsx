import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { PAGE_TITLES } from '../../lib/routes'

// ============================================
// BREADCRUMB — Shows navigation path
// ============================================

// Map path segments to readable labels
const SEGMENT_LABELS = {
  dashboard: 'Dashboard',
  teams: 'Teams',
  coaches: 'Coaches',
  registrations: 'Registrations',
  jerseys: 'Jerseys',
  schedule: 'Schedule',
  availability: 'Availability',
  attendance: 'Attendance',
  payments: 'Payments',
  gameprep: 'Game Prep',
  standings: 'Standings',
  leaderboards: 'Leaderboards',
  chats: 'Chats',
  blasts: 'Announcements',
  notifications: 'Notifications',
  reports: 'Reports',
  funnel: 'Registration Funnel',
  archives: 'Season Archives',
  directory: 'Org Directory',
  settings: 'Settings',
  seasons: 'Seasons',
  templates: 'Registration Forms',
  waivers: 'Waivers',
  'payment-setup': 'Payment Setup',
  organization: 'Organization',
  'data-export': 'Data Export',
  subscription: 'Subscription',
  achievements: 'Achievements',
  profile: 'My Profile',
  platform: 'Platform',
  admin: 'Admin',
  analytics: 'Analytics',
  subscriptions: 'Subscriptions',
  parent: 'Parent',
  player: 'Player',
  messages: 'Messages',
  invite: 'Invite Friends',
}

function isUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export function Breadcrumb({ teamName, playerName }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, accent } = useTheme()

  const pathname = location.pathname
  if (pathname === '/dashboard' || pathname === '/' || pathname.startsWith('/teams/')) return null

  const segments = pathname.split('/').filter(Boolean)
  const crumbs = []

  // Always start with Dashboard
  crumbs.push({ label: 'Dashboard', path: '/dashboard', isHome: true })

  let builtPath = ''
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    builtPath += '/' + seg

    // Skip UUIDs (show entity name prop instead)
    if (isUUID(seg)) {
      // Use the provided team/player name or show a short ID
      if (segments[i - 1] === 'teams' || (segments[i - 1] === 'player')) {
        // Don't add — the entity name will be added below
      }
      continue
    }

    const label = SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
    const isLast = i === segments.length - 1 || (i === segments.length - 2 && isUUID(segments[i + 1]))

    crumbs.push({ label, path: builtPath, isLast })
  }

  // Append team/player name for dynamic routes
  if (teamName && pathname.match(/^\/teams\/[^/]+$/)) {
    crumbs.push({ label: teamName, path: pathname, isLast: true })
  }
  if (playerName && pathname.includes('/parent/player/')) {
    crumbs.push({ label: playerName, path: pathname, isLast: true })
  }

  // Mark the last crumb
  if (crumbs.length > 0) {
    crumbs[crumbs.length - 1].isLast = true
  }

  return (
    <nav className="flex items-center gap-1 text-sm mb-4 flex-wrap" aria-label="Breadcrumb">
      {crumbs.map((crumb, idx) => (
        <div key={idx} className="flex items-center gap-1">
          {idx > 0 && (
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isDark ? '#475569' : '#94a3b8' }} />
          )}
          {crumb.isLast ? (
            <span
              className="font-medium"
              style={{ color: accent.primary }}
            >
              {crumb.isHome ? <Home className="w-3.5 h-3.5" /> : crumb.label}
            </span>
          ) : (
            <button
              onClick={() => navigate(crumb.path)}
              className="hover:underline transition-colors"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              {crumb.isHome ? <Home className="w-3.5 h-3.5" /> : crumb.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}
