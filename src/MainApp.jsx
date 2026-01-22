import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useTheme, useThemeClasses } from './contexts/ThemeContext'
import { SportProvider, useSport } from './contexts/SportContext'
import { SeasonProvider, useSeason } from './contexts/SeasonContext'
import { JourneyProvider } from './contexts/JourneyContext'
import { supabase } from './lib/supabase'

// Icons
import { 
  Building2, Users, ChevronDown, ChevronLeft, ChevronRight, Check,
  LogOut, Shield, UserCog, User, Home, Calendar, DollarSign, 
  MessageCircle, Target, CheckSquare, Star, LayoutDashboard, Megaphone
} from './constants/icons'
import { VolleyballIcon } from './constants/icons'

// UI Components
import { Toast, Icon } from './components/ui'

// Layout Components
import { 
  NavIcon, 
  HeaderSportSelector, 
  HeaderSeasonSelector, 
  HeaderCoachTeamSelector, 
  HeaderChildSelector,
  ThemeToggleButton,
  AccentColorPicker,
  JerseyNavBadge,
  BlastAlertChecker,
  JourneyCelebrations
} from './components/layout'

// Dashboard Pages
import { DashboardPage } from './pages/dashboard'

// Role-specific Dashboards
import { ParentDashboard, CoachDashboard, PlayerDashboard } from './pages/roles'

// Parent Portal Pages
import { PlayerProfilePage, ParentMessagesPage, InviteFriendsPage, ParentPaymentsPage } from './pages/parent'

// Public Pages
import { TeamWallPage } from './pages/public'

// Core Admin Pages
import { RegistrationsPage } from './pages/registrations'
import { PaymentsPage } from './pages/payments'
import { TeamsPage } from './pages/teams'
import { CoachesPage } from './pages/coaches'
import { JerseysPage } from './pages/jerseys'
import { SchedulePage } from './pages/schedule'
import { AttendancePage } from './pages/attendance'
import { ChatsPage } from './pages/chats'
import { BlastsPage } from './pages/blasts'
import { GamePrepPage } from './pages/gameprep'
import { TeamStandingsPage } from './pages/standings'
import { SeasonLeaderboardsPage } from './pages/leaderboards'
import { ReportsPage } from './pages/reports'

// Settings Pages
import { SeasonsPage, WaiversPage, PaymentSetupPage, OrganizationPage } from './pages/settings'

function MainApp() {
  const { profile, organization, signOut, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark, colors } = useTheme()
  const [page, setPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Direct team wall access via URL hash
  const [directTeamWallId, setDirectTeamWallId] = useState(null)

  // Parse hash on load and hash changes
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash
      // Pattern: #/team/<team-id>
      const teamMatch = hash.match(/^#\/team\/(.+)$/)
      if (teamMatch) {
        setDirectTeamWallId(teamMatch[1])
      } else {
        setDirectTeamWallId(null)
      }
    }
    
    // Check on mount
    handleHashChange()
    
    // Listen for changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Helper to navigate to team wall (updates URL)
  const navigateToTeamWall = (teamId) => {
    window.location.hash = `/team/${teamId}`
  }

  // Helper to exit team wall view
  const exitTeamWall = () => {
    window.location.hash = ''
    setDirectTeamWallId(null)
  }

  // Helper to navigate away from team wall to another page
  const navigateFromTeamWall = (targetPage) => {
    window.location.hash = ''
    setDirectTeamWallId(null)
    setPage(targetPage)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Role switching state
  const [activeView, setActiveView] = useState('admin') // 'admin', 'coach', 'parent', 'player'
  const [userRoles, setUserRoles] = useState([])
  const [roleContext, setRoleContext] = useState(null)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)

  // Load user's role context
  useEffect(() => {
    if (profile?.id && organization?.id) {
      loadRoleContext()
    }
  }, [profile?.id, organization?.id])

  async function loadRoleContext() {
    try {
      // Get all active roles for this user in this org
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', profile.id)
        .eq('organization_id', organization.id)
        .eq('is_active', true)

      setUserRoles(roles || [])

      // Check if user is linked as a coach
      const { data: coachLink } = await supabase
        .from('coaches')
        .select('*, team_coaches(team_id, role, teams(id, name, color))')
        .eq('profile_id', profile.id)
        .maybeSingle()

      // Check if user has children (parent context)
      const { data: children } = await supabase
        .from('players')
        .select('id, first_name, last_name, photo_url, team_players(team_id, teams(id, name, color))')
        .eq('parent_account_id', profile.id)

      // Player self-account feature not yet implemented
      // (would allow players with their own accounts to access their data)
      const playerSelf = null

      setRoleContext({
        roles: roles || [],
        isAdmin: roles?.some(r => r.role === 'league_admin' || r.role === 'admin'),
        isCoach: !!coachLink,
        coachInfo: coachLink,
        isParent: roles?.some(r => r.role === 'parent') && children?.length > 0,
        children: children || [],
        isPlayer: !!playerSelf,
        playerInfo: playerSelf
      })

      // Set default view based on available roles
      if (roles?.some(r => r.role === 'league_admin' || r.role === 'admin')) {
        setActiveView('admin')
      } else if (coachLink) {
        setActiveView('coach')
      } else if (children?.length > 0) {
        setActiveView('parent')
      } else if (playerSelf) {
        setActiveView('player')
      }

    } catch (err) {
      console.error('Error loading role context:', err)
    }
  }

  // Get available views based on role context
  const getAvailableViews = () => {
    const views = []
    if (roleContext?.isAdmin) {
      views.push({ id: 'admin', label: 'Admin', icon: 'shield', description: 'Full league management' })
    }
    if (roleContext?.isCoach) {
      const teamNames = roleContext.coachInfo?.team_coaches?.map(tc => tc.teams?.name).filter(Boolean).join(', ')
      views.push({ id: 'coach', label: 'Coach', icon: 'user-cog', description: teamNames || 'Team management' })
    }
    if (roleContext?.isParent && roleContext.children?.length > 0) {
      const childNames = roleContext.children.map(c => c.first_name).join(', ')
      views.push({ id: 'parent', label: 'Parent', icon: 'users', description: childNames })
    }
    if (roleContext?.isPlayer) {
      views.push({ id: 'player', label: 'Player', icon: 'volleyball', description: roleContext.playerInfo?.first_name })
    }
    return views
  }

  const [expandedGroups, setExpandedGroups] = useState({ people: false, operations: false, game: false, communication: false, insights: false, setup: false })
  const [coachGameDayExpanded, setCoachGameDayExpanded] = useState(true)

  const navGroups = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', type: 'single' },
    { 
      id: 'people', 
      label: 'People', 
      icon: 'users',
      type: 'group',
      items: [
        { id: 'teams', label: 'Teams & Rosters', icon: 'users' },
        { id: 'coaches', label: 'Coaches', icon: 'user-cog' },
      ]
    },
    { 
      id: 'operations', 
      label: 'Operations', 
      icon: 'zap',
      type: 'group',
      items: [
        { id: 'registrations', label: 'Registrations', icon: 'clipboard' },
        { id: 'jerseys', label: 'Jerseys', icon: 'shirt', hasBadge: true },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'attendance', label: 'Attendance & RSVP', icon: 'check-square' },
        { id: 'payments', label: 'Payments', icon: 'dollar' },
      ]
    },
    { 
      id: 'game', 
      label: 'Game Day', 
      icon: 'target',
      type: 'group',
      items: [
        { id: 'gameprep', label: 'Game Prep', icon: 'target' },
        { id: 'standings', label: 'Standings', icon: 'star' },
        { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
      ]
    },
    { 
      id: 'communication', 
      label: 'Communication', 
      icon: 'message',
      type: 'group',
      items: [
        { id: 'chats', label: 'Chats', icon: 'message' },
        { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
      ]
    },
    { 
      id: 'insights', 
      label: 'Insights', 
      icon: 'bar-chart',
      type: 'group',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: 'pie-chart' },
      ]
    },
    { 
      id: 'setup', 
      label: 'Setup', 
      icon: 'settings',
      type: 'group',
      items: [
        { id: 'seasons', label: 'Seasons', icon: 'calendar' },
        { id: 'waivers', label: 'Waivers', icon: 'file-text' },
        { id: 'paymentsetup', label: 'Payment Setup', icon: 'credit-card' },
        { id: 'organization', label: 'Organization', icon: 'building' },
      ]
    },
  ]

  // Accordion-style toggle - only one group open at a time
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const isCurrentlyOpen = prev[groupId]
      // Close all groups, then open clicked one if it was closed
      const allClosed = { people: false, operations: false, game: false, communication: false, insights: false, setup: false }
      return isCurrentlyOpen ? allClosed : { ...allClosed, [groupId]: true }
    })
  }

  return (
    <SportProvider>
    <SeasonProvider>
      <div className={`flex flex-col min-h-screen ${tc.pageBg}`}>
        <JourneyCelebrations />
        
        {/* Top Header Bar */}
        <header className={`h-14 ${tc.cardBg} border-b ${tc.border} flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50`}>
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <VolleyballIcon className="w-7 h-7 text-[var(--accent-primary)]" />
            <span className={`font-bold text-lg ${tc.text}`}>VolleyBrain</span>
          </div>
          
          {/* Center: Context Breadcrumb (Admin only) */}
          {activeView === 'admin' && (
            <div className="flex items-center gap-2">
              {/* Organization Badge */}
              {organization && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                  <Building2 className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-sm font-medium text-[var(--accent-primary)]">{organization.name}</span>
                </div>
              )}
              
              {/* Sport Selector */}
              <HeaderSportSelector />
              
              {/* Season Selector */}
              <HeaderSeasonSelector />
            </div>
          )}
          
          {/* Center: Context - Coach View */}
          {activeView === 'coach' && roleContext?.coachInfo && (
            <div className="flex items-center gap-2">
              {/* Team Selector (if coaching multiple teams) */}
              {roleContext.coachInfo.team_coaches?.length > 1 ? (
                <HeaderCoachTeamSelector 
                  teams={roleContext.coachInfo.team_coaches} 
                  onSelectTeam={navigateToTeamWall}
                />
              ) : roleContext.coachInfo.team_coaches?.length === 1 ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                  <Users className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-sm font-medium text-[var(--accent-primary)]">
                    {roleContext.coachInfo.team_coaches[0].teams?.name}
                  </span>
                  {roleContext.coachInfo.team_coaches[0].role === 'head' && (
                    <span className="text-xs bg-[var(--accent-primary)]/20 px-1.5 py-0.5 rounded text-[var(--accent-primary)]">Head Coach</span>
                  )}
                </div>
              ) : null}
              
              {/* Season indicator */}
              <HeaderSeasonSelector />
            </div>
          )}
          
          {/* Center: Context - Parent View */}
          {activeView === 'parent' && roleContext?.children && (
            <div className="flex items-center gap-2">
              {/* Child/Player Selector */}
              {roleContext.children.length > 1 ? (
                <HeaderChildSelector 
                  children={roleContext.children}
                  onSelectChild={(childId) => setPage(`player-${childId}`)}
                  navigateToTeamWall={navigateToTeamWall}
                />
              ) : roleContext.children.length === 1 ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                    {roleContext.children[0].photo_url ? (
                      <img src={roleContext.children[0].photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-[var(--accent-primary)]" />
                    )}
                    <span className="text-sm font-medium text-[var(--accent-primary)]">
                      {roleContext.children[0].first_name} {roleContext.children[0].last_name}
                    </span>
                  </div>
                  {/* Show team if only one */}
                  {roleContext.children[0].team_players?.length === 1 && (
                    <button 
                      onClick={() => navigateToTeamWall(roleContext.children[0].team_players[0].team_id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${tc.hoverBg} transition`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ background: roleContext.children[0].team_players[0].teams?.color || '#EAB308' }}
                      />
                      <span className={`text-sm ${tc.text}`}>
                        {roleContext.children[0].team_players[0].teams?.name}
                      </span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}
          
          {/* Center: Context - Player View */}
          {activeView === 'player' && roleContext?.playerInfo && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                <VolleyballIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-sm font-medium text-[var(--accent-primary)]">
                  {roleContext.playerInfo.team_players?.[0]?.teams?.name || 'My Team'}
                </span>
                {roleContext.playerInfo.team_players?.[0]?.jersey_number && (
                  <span className="text-xs bg-[var(--accent-primary)] text-white px-2 py-0.5 rounded-full font-bold">
                    #{roleContext.playerInfo.team_players[0].jersey_number}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Right: User Profile & View Switcher */}
          <div className="relative">
            <button 
              className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition ${tc.hoverBgAlt}`}
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            >
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                {profile?.full_name?.charAt(0) || '?'}
              </div>
              <div className="text-left hidden sm:block">
                <p className={`text-sm font-medium ${tc.text}`}>{profile?.full_name || 'User'}</p>
                <p className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                  {activeView === 'admin' && <Shield className="w-3 h-3" />}
                  {activeView === 'coach' && <UserCog className="w-3 h-3" />}
                  {activeView === 'parent' && <Users className="w-3 h-3" />}
                  {activeView === 'player' && <VolleyballIcon className="w-3 h-3" />}
                  {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 ${tc.textMuted} transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Role Switcher Dropdown */}
            {showRoleSwitcher && (
              <div className={`absolute right-0 top-full mt-2 w-64 ${tc.cardBg} rounded-xl border ${tc.border} shadow-xl overflow-hidden z-50`}>
                <div className={`p-2 border-b ${tc.border}`}>
                  <p className={`text-xs ${tc.textMuted} px-2`}>Switch View</p>
                </div>
                {getAvailableViews().map(view => (
                  <button
                    key={view.id}
                    onClick={() => {
                      setActiveView(view.id)
                      setShowRoleSwitcher(false)
                      setPage('dashboard')
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      activeView === view.id 
                        ? 'bg-[var(--accent-primary)]/20' 
                        : `${tc.hoverBg}`
                    }`}
                  >
                    <NavIcon name={view.icon} className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${activeView === view.id ? 'text-[var(--accent-primary)]' : tc.text}`}>
                        {view.label}
                      </p>
                      <p className={`text-xs ${tc.textMuted} truncate`}>{view.description}</p>
                    </div>
                    {activeView === view.id && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                  </button>
                ))}
                <div className={`p-2 border-t ${tc.border} flex gap-2`}>
                  <ThemeToggleButton collapsed={false} />
                  <button 
                    onClick={signOut} 
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${tc.hoverBg} ${tc.textSecondary} text-sm`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        
        <div className="flex flex-1 pt-14">
          {/* Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-16' : 'w-56'} fixed top-14 left-0 h-[calc(100vh-3.5rem)] ${tc.cardBg} border-r ${tc.border} flex flex-col transition-all duration-300 z-40`}>
            
            {/* Collapse Toggle */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-end'} px-2 py-2 border-b ${tc.border}`}>
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
                className={`p-2 rounded-lg ${tc.hoverBgAlt} ${tc.textSecondary}`}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation - varies by active view */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {activeView === 'admin' && (
                // Full Admin Navigation
                <>
                  {navGroups.map(group => (
                    group.type === 'single' ? (
                      <button key={group.id} onClick={() => { exitTeamWall(); setPage(group.id); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                          page === group.id && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                        }`}
                        title={sidebarCollapsed ? group.label : undefined}
                      >
                        <NavIcon name={group.icon} className="w-5 h-5" />
                        {!sidebarCollapsed && <span>{group.label}</span>}
                      </button>
                    ) : (
                      <div key={group.id} className="mb-1">
                        <button
                          onClick={() => !sidebarCollapsed && toggleGroup(group.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm ${
                            group.items.some(item => item.id === page) && !directTeamWallId
                              ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                              : `${tc.textMuted} ${tc.hoverBg}`
                          }`}
                          title={sidebarCollapsed ? group.label : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <NavIcon name={group.icon} className="w-5 h-5" />
                            {!sidebarCollapsed && <span className="font-medium text-xs uppercase tracking-wider">{group.label}</span>}
                          </div>
                          {!sidebarCollapsed && (
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedGroups[group.id] ? 'rotate-180' : ''}`} />
                          )}
                        </button>
                        {(expandedGroups[group.id] || sidebarCollapsed) && (
                          <div className={`${sidebarCollapsed ? '' : 'ml-3 mt-1 pl-3 border-l border-slate-700'} space-y-0.5`}>
                            {group.items.map(item => (
                              <button key={item.id} onClick={() => { exitTeamWall(); setPage(item.id); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                                  page === item.id && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                                }`}
                                title={sidebarCollapsed ? item.label : undefined}
                              >
                                <span className="relative">
                                  <NavIcon name={item.icon} className="w-4 h-4" />
                                  {item.hasBadge && sidebarCollapsed && <JerseyNavBadge collapsed={true} />}
                                </span>
                                {!sidebarCollapsed && (
                                  <>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.hasBadge && <JerseyNavBadge collapsed={false} />}
                                  </>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </>
              )}

            {activeView === 'coach' && (
              // Coach Navigation
              <>
                <button onClick={() => { exitTeamWall(); setPage('dashboard'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'dashboard' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>

                {/* My Teams */}
                <p className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${tc.textMuted}`}>My Teams</p>
                {roleContext?.coachInfo?.team_coaches?.map(tc_item => (
                  <button 
                    key={tc_item.team_id}
                    onClick={() => navigateToTeamWall(tc_item.team_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      directTeamWallId === tc_item.team_id ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>{tc_item.teams?.name}</span>
                    {tc_item.role === 'head' && <Star className="w-4 h-4 text-[var(--accent-primary)]" />}
                  </button>
                ))}

                <div className={`my-3 border-t ${tc.border}`}></div>

                <button onClick={() => { exitTeamWall(); setPage('schedule'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'schedule' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Calendar className="w-5 h-5" />
                  <span>Schedule</span>
                </button>

                {/* Game Day Collapsible Section */}
                <button 
                  onClick={() => setCoachGameDayExpanded(!coachGameDayExpanded)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    ['gameprep', 'standings', 'leaderboards'].includes(page) && !directTeamWallId
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' 
                      : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}
                >
                  <Target className="w-5 h-5" />
                  <span className="flex-1 text-left">Game Day</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${coachGameDayExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {coachGameDayExpanded && (
                  <div className="ml-4 space-y-1">
                    <button onClick={() => { exitTeamWall(); setPage('gameprep'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                        page === 'gameprep' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                      }`}>
                      <Target className="w-4 h-4" />
                      <span>Game Prep</span>
                    </button>

                    <button onClick={() => { exitTeamWall(); setPage('standings'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                        page === 'standings' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                      }`}>
                      <Star className="w-4 h-4" />
                      <span>Standings</span>
                    </button>

                    <button onClick={() => { exitTeamWall(); setPage('leaderboards'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                        page === 'leaderboards' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                      }`}>
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Leaderboards</span>
                    </button>
                  </div>
                )}

                <button onClick={() => { exitTeamWall(); setPage('attendance'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'attendance' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <CheckSquare className="w-5 h-5" />
                  <span>Attendance</span>
                </button>

                <div className={`my-3 border-t ${tc.border}`}></div>
                <p className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${tc.textMuted}`}>Communication</p>

                <button onClick={() => { exitTeamWall(); setPage('chats'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'chats' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <MessageCircle className="w-5 h-5" />
                  <span>Team Chats</span>
                </button>

                <button onClick={() => { exitTeamWall(); setPage('blasts'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'blasts' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Megaphone className="w-5 h-5" />
                  <span>Announcements</span>
                </button>
              </>
            )}

            {activeView === 'parent' && (
              // Enhanced Parent Navigation
              <>
                <button onClick={() => { exitTeamWall(); setPage('dashboard'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'dashboard' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Home className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Home</span>}
                </button>

                {/* My Players - Clickable */}
                {!sidebarCollapsed && (
                  <p className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${tc.textMuted}`}>My Players</p>
                )}
                {roleContext?.children?.map(child => (
                  <div key={child.id} className="mb-2">
                    <button
                      onClick={() => { exitTeamWall(); setPage(`player-${child.id}`); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition ${
                        page === `player-${child.id}` ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : `${tc.textSecondary} ${tc.hoverBg}`
                      }`}
                    >
                      {child.photo_url ? (
                        <img src={child.photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/30 flex items-center justify-center text-xs font-bold text-[var(--accent-primary)]">
                          {child.first_name?.[0]}
                        </div>
                      )}
                      {!sidebarCollapsed && <span className="text-sm font-medium flex-1">{child.first_name}</span>}
                      {!sidebarCollapsed && <span className="text-xs opacity-50">→</span>}
                    </button>
                    {!sidebarCollapsed && child.team_players?.map(tp => (
                      <button 
                        key={tp.team_id}
                        onClick={() => navigateToTeamWall(tp.team_id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 ml-4 rounded-lg transition-all text-xs group ${
                          directTeamWallId === tp.team_id 
                            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' 
                            : `${tc.textMuted} hover:text-[var(--accent-primary)] ${tc.hoverBg}`
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: tp.teams?.color || '#EAB308' }} />
                        <span className="flex-1">{tp.teams?.name}</span>
                        <span className="text-[10px] opacity-50 group-hover:opacity-100">Team →</span>
                      </button>
                    ))}
                  </div>
                ))}

                <div className={`my-3 border-t ${tc.border}`}></div>

                <button onClick={() => { exitTeamWall(); setPage('schedule'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'schedule' ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Calendar className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Schedule</span>}
                </button>

                <button onClick={() => { exitTeamWall(); setPage('standings'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'standings' ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Star className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Standings</span>}
                </button>

                <button onClick={() => { exitTeamWall(); setPage('leaderboards'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'leaderboards' ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <LayoutDashboard className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Leaderboards</span>}
                </button>

                <button onClick={() => { exitTeamWall(); setPage('chats'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'chats' || page === 'messages' ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <MessageCircle className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Chats</span>}
                </button>

                <button onClick={() => { exitTeamWall(); setPage('payments'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'payments' ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <DollarSign className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Payments</span>}
                </button>

                <button onClick={() => { exitTeamWall(); setPage('invite'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'invite' ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <span className="text-lg">🔗</span>
                  {!sidebarCollapsed && <span>Invite Friends</span>}
                </button>
              </>
            )}

            {activeView === 'player' && (
              // Player Navigation
              <>
                <button onClick={() => { exitTeamWall(); setPage('dashboard'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'dashboard' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>

                {/* My Teams */}
                <p className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${tc.textMuted}`}>My Teams</p>
                {roleContext?.playerInfo?.team_players?.map(tp => (
                  <button 
                    key={tp.team_id}
                    onClick={() => navigateToTeamWall(tp.team_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      directTeamWallId === tp.team_id ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ background: tp.teams?.color || '#EAB308' }}
                    ></span>
                    <span>{tp.teams?.name}</span>
                  </button>
                ))}

                <div className={`my-3 border-t ${tc.border}`}></div>

                <button onClick={() => { exitTeamWall(); setPage('schedule'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'schedule' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Calendar className="w-5 h-5" />
                  <span>Schedule</span>
                </button>

                <button onClick={() => { exitTeamWall(); setPage('standings'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'standings' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <Star className="w-5 h-5" />
                  <span>Standings</span>
                </button>

                <button onClick={() => { exitTeamWall(); setPage('leaderboards'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    page === 'leaderboards' && !directTeamWallId ? 'bg-[var(--accent-primary)] text-white font-semibold' : `${tc.textSecondary} ${tc.hoverBg}`
                  }`}>
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Leaderboards</span>
                </button>
              </>
            )}
          </nav>

          {/* Theme Toggle & Sign Out - shrink-0 keeps it at bottom */}
          <div className={`p-4 border-t ${tc.border} shrink-0`}>
            <div className={`flex ${sidebarCollapsed ? 'flex-col' : 'flex-row'} gap-2`}>
              <AccentColorPicker />
              <ThemeToggleButton collapsed={sidebarCollapsed} />
              <button onClick={signOut}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${tc.textSecondary} hover:text-red-400 hover:bg-red-500/10 transition text-sm`}>
                <LogOut className="w-4 h-4" />
                {!sidebarCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 p-8 overflow-auto ${sidebarCollapsed ? 'ml-16' : 'ml-56'} transition-all duration-300`}>
          {/* Direct Team Wall Access via URL */}
          {directTeamWallId ? (
            <TeamWallPage 
              teamId={directTeamWallId}
              showToast={showToast}
              onBack={exitTeamWall}
              onNavigate={navigateFromTeamWall}
            />
          ) : (
            <>
              {page === 'dashboard' && activeView === 'admin' && <DashboardPage onNavigate={setPage} />}
              {page === 'dashboard' && activeView === 'coach' && <CoachDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={setPage} />}
              {page === 'dashboard' && activeView === 'parent' && <ParentDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={setPage} />}
              {page === 'dashboard' && activeView === 'player' && <PlayerDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} onNavigate={setPage} />}
              {/* Parent Portal - Player Profile Pages */}
              {page.startsWith('player-') && activeView === 'parent' && <PlayerProfilePage playerId={page.replace('player-', '')} roleContext={roleContext} showToast={showToast} />}
              {/* Parent Portal - Messages */}
              {page === 'messages' && activeView === 'parent' && <ParentMessagesPage roleContext={roleContext} showToast={showToast} />}
              {/* Parent Portal - Invite Friends */}
              {page === 'invite' && activeView === 'parent' && <InviteFriendsPage roleContext={roleContext} showToast={showToast} />}
              {/* Parent Portal - Payments (privacy-aware) */}
              {page === 'payments' && activeView === 'parent' && <ParentPaymentsPage roleContext={roleContext} showToast={showToast} />}
              {page === 'registrations' && <RegistrationsPage showToast={showToast} />}
              {page === 'payments' && activeView === 'admin' && <PaymentsPage showToast={showToast} />}
              {page === 'teams' && <TeamsPage showToast={showToast} navigateToTeamWall={navigateToTeamWall} onNavigate={setPage} />}
              {page === 'coaches' && <CoachesPage showToast={showToast} />}
              {page === 'jerseys' && <JerseysPage showToast={showToast} />}
              {page === 'schedule' && <SchedulePage showToast={showToast} activeView={activeView} roleContext={roleContext} />}
              {page === 'attendance' && <AttendancePage showToast={showToast} />}
              {page === 'gameprep' && <GamePrepPage showToast={showToast} />}
              {page === 'standings' && <TeamStandingsPage showToast={showToast} />}
              {page === 'leaderboards' && <SeasonLeaderboardsPage showToast={showToast} />}
              {page === 'seasons' && <SeasonsPage showToast={showToast} />}
              {page === 'waivers' && <WaiversPage showToast={showToast} />}
              {page === 'paymentsetup' && <PaymentSetupPage showToast={showToast} />}
              {page === 'organization' && <OrganizationPage showToast={showToast} />}
              {page === 'chats' && <ChatsPage showToast={showToast} activeView={activeView} roleContext={roleContext} />}
              {page === 'blasts' && <BlastsPage showToast={showToast} activeView={activeView} roleContext={roleContext} />}
              {page === 'reports' && <ReportsPage showToast={showToast} />}
            </>
          )}
        </div>
        </div>

        {/* Toast */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* Blast Alert Checker - Handles its own state inside SeasonProvider */}
        <BlastAlertChecker />
      </div>
    </SeasonProvider>
    </SportProvider>
  )
}

export { MainApp }
