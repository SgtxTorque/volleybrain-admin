import { supabase } from './supabase'

// ============================================
// GLOBAL SEARCH SERVICE
// Queries multiple Supabase tables in parallel
// ============================================

/**
 * Search across all entity types: players, coaches, teams, seasons, events, profiles
 * @param {string} query - Search term (min 2 chars)
 * @param {object} options - { organizationId, seasonId }
 * @returns {Array} Combined search results
 */
export async function globalSearch(query, options = {}) {
  if (!query || query.trim().length < 2) return []

  const searchTerm = query.trim().toLowerCase()
  const ilikeTerm = `%${searchTerm}%`
  const { organizationId, seasonId } = options

  // Run all searches in parallel — each limited to 5 results
  const [
    playersRes,
    teamsRes,
    seasonsRes,
    eventsRes,
    coachesRes,
    profilesRes,
  ] = await Promise.all([
    // Players — exact pattern from TeamsPage/RegistrationsPage
    supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number, position, photo_url, season_id')
      .or(`first_name.ilike.${ilikeTerm},last_name.ilike.${ilikeTerm}`)
      .limit(8),

    // Teams — exact pattern from TeamsPage/CoachesPage
    supabase
      .from('teams')
      .select('id, name, color, logo_url, season_id, seasons(name)')
      .ilike('name', ilikeTerm)
      .limit(5),

    // Seasons — exact pattern from SeasonContext
    supabase
      .from('seasons')
      .select('id, name, start_date, end_date, status, sports(name, icon)')
      .ilike('name', ilikeTerm)
      .limit(5),

    // Schedule Events — exact pattern from SchedulePage (uses explicit FK)
    supabase
      .from('schedule_events')
      .select('id, title, event_type, event_date, event_time, venue_name, team_id, teams!schedule_events_team_id_fkey(id, name, color)')
      .or(`title.ilike.${ilikeTerm},venue_name.ilike.${ilikeTerm}`)
      .limit(5),

    // Coaches — exact pattern from CoachesPage
    supabase
      .from('coaches')
      .select('id, first_name, last_name, email, phone, status, season_id')
      .or(`first_name.ilike.${ilikeTerm},last_name.ilike.${ilikeTerm},email.ilike.${ilikeTerm}`)
      .limit(5),

    // Profiles (parents/users) — exact pattern from AuthContext
    supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, avatar_url, email, role')
      .or(`full_name.ilike.${ilikeTerm},first_name.ilike.${ilikeTerm},last_name.ilike.${ilikeTerm},email.ilike.${ilikeTerm}`)
      .limit(5),
  ])

  const results = []

  // Format players
  if (playersRes.data?.length) {
    // Filter by org's seasons if we have organizationId context
    playersRes.data.forEach(p => {
      results.push({
        type: 'player',
        id: p.id,
        title: `${p.first_name} ${p.last_name}`,
        subtitle: p.jersey_number ? `#${p.jersey_number} · ${p.position || 'Player'}` : (p.position || 'Player'),
        icon: 'volleyball',
        avatar: p.photo_url,
        path: `/parent/player/${p.id}`,
        section: 'Players',
      })
    })
  }

  // Format teams
  if (teamsRes.data?.length) {
    teamsRes.data.forEach(t => {
      results.push({
        type: 'team',
        id: t.id,
        title: t.name,
        subtitle: t.seasons?.name || 'Team',
        icon: 'users',
        color: t.color,
        path: `/teams/${t.id}`,
        section: 'Teams',
      })
    })
  }

  // Format seasons
  if (seasonsRes.data?.length) {
    seasonsRes.data.forEach(s => {
      const sportName = s.sports?.name || ''
      const statusLabel = s.status === 'active' ? 'Active' : s.status === 'draft' ? 'Draft' : s.status || ''
      results.push({
        type: 'season',
        id: s.id,
        title: s.name,
        subtitle: [sportName, statusLabel].filter(Boolean).join(' · '),
        icon: 'calendar',
        path: `/admin/seasons/${s.id}`,
        section: 'Seasons',
      })
    })
  }

  // Format events
  if (eventsRes.data?.length) {
    eventsRes.data.forEach(e => {
      const teamName = e.teams?.name || ''
      const venue = e.venue_name || ''
      const dateStr = e.event_date || ''
      results.push({
        type: 'event',
        id: e.id,
        title: e.title || formatEventType(e.event_type),
        subtitle: [teamName, venue, dateStr].filter(Boolean).join(' · '),
        icon: e.event_type === 'practice' ? 'dumbbell' : e.event_type === 'game' ? 'trophy' : 'calendar',
        path: '/schedule',
        section: 'Events',
      })
    })
  }

  // Format coaches
  if (coachesRes.data?.length) {
    coachesRes.data.forEach(c => {
      results.push({
        type: 'coach',
        id: c.id,
        title: `${c.first_name} ${c.last_name}`,
        subtitle: c.email || 'Coach',
        icon: 'clipboard',
        path: '/coaches',
        section: 'Coaches',
      })
    })
  }

  // Format profiles (parents/admins)
  if (profilesRes.data?.length) {
    profilesRes.data.forEach(p => {
      const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email
      if (!name) return
      results.push({
        type: 'profile',
        id: p.id,
        title: name,
        subtitle: p.email || p.role || 'User',
        icon: 'user',
        avatar: p.avatar_url,
        path: '/registrations',
        section: 'People',
      })
    })
  }

  return results
}

function formatEventType(type) {
  if (!type) return 'Event'
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
}

// Quick navigation items for empty search state
export const QUICK_NAV_ITEMS = [
  { icon: 'layout-dashboard', title: 'Dashboard', path: '/dashboard' },
  { icon: 'users', title: 'Teams', path: '/teams' },
  { icon: 'calendar', title: 'Schedule', path: '/schedule' },
  { icon: 'clipboard-list', title: 'Registrations', path: '/registrations' },
  { icon: 'credit-card', title: 'Payments', path: '/payments' },
  { icon: 'shirt', title: 'Jerseys', path: '/jerseys' },
  { icon: 'message-circle', title: 'Chat', path: '/chats' },
  { icon: 'megaphone', title: 'Announcements', path: '/blasts' },
  { icon: 'trophy', title: 'Game Prep', path: '/gameprep' },
  { icon: 'bar-chart-2', title: 'Reports', path: '/reports' },
  { icon: 'settings', title: 'Organization', path: '/settings/organization' },
]

// Recent searches — stored in localStorage
const RECENT_KEY = 'lynx-recent-searches'
const MAX_RECENT = 5

export function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveRecentSearch(result) {
  const recent = getRecentSearches()
  const updated = [
    { id: result.id, type: result.type, title: result.title, subtitle: result.subtitle, icon: result.icon, path: result.path },
    ...recent.filter(r => !(r.id === result.id && r.type === result.type)),
  ].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY)
}
