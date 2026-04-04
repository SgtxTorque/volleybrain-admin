import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTheme, useThemeClasses } from './contexts/ThemeContext'
import { SportProvider, useSport } from './contexts/SportContext'
import { SeasonProvider, useSeason } from './contexts/SeasonContext'
import { ParentTutorialProvider } from './contexts/ParentTutorialContext'
import { OrgBrandingProvider, useOrgBranding } from './contexts/OrgBrandingContext'
import { supabase } from './lib/supabase'
import { useAppNavigate, useCurrentPageId, useDocumentTitle } from './hooks/useAppNavigate'
import { getPathForPage } from './lib/routes'

// Icons
import { 
  Building2, Users, ChevronDown, ChevronLeft, ChevronRight, Check,
  LogOut, Shield, UserCog, User, Home, Calendar, DollarSign,
  MessageCircle, Target, CheckSquare, Star, LayoutDashboard, Megaphone,
  Trophy, Bell, Settings, Zap, BarChart3, Moon, Sun, Clock, TrendingUp,
  Award, CreditCard, UserPlus, X, ClipboardList
} from './constants/icons'
import { VolleyballIcon } from './constants/icons'

// UI Components
import { ToastContainer, useToast, Icon, ErrorBoundary, CommandPalette, useCommandPalette } from './components/ui'

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
import LynxSidebar from './components/layout/LynxSidebar'
import TopBar from './components/v2/TopBar'
import FloatingChatButton from './components/layout/FloatingChatButton'
import SetupHelper from './components/SetupHelper'

// Parent Onboarding Components
import { SpotlightOverlay, FloatingHelpButton } from './components/parent/ParentOnboarding'

// Dashboard Pages
import { DashboardPage } from './pages/dashboard'

// Role-specific Dashboards
import { ParentDashboard, CoachDashboard, PlayerDashboard } from './pages/roles'
import { TeamManagerDashboard } from './pages/roles/TeamManagerDashboard'
import TeamManagerSetup from './pages/team-manager/TeamManagerSetup'

// Parent Portal Pages
import { PlayerProfilePage, ParentPlayerCardPage, ParentMessagesPage, InviteFriendsPage, ParentPaymentsPage, MyStuffPage, ParentRegistrationHub, ClaimAccountPage } from './pages/parent'

// Public Pages
import { OrgDirectoryPage } from './pages/public'

// Team Wall (authenticated — has lightbox, shared FeedPost, photo grid)
import { TeamWallPage } from './pages/teams/TeamWallPage'
import TeamHubSelectorPage from './pages/teams/TeamHubSelectorPage'

// Core Admin Pages
import { RegistrationsPage } from './pages/registrations'
import { PaymentsPage } from './pages/payments'
import { TeamsPage } from './pages/teams'
import { CoachesPage } from './pages/coaches'
import { StaffPage } from './pages/staff/StaffPage'
import { StaffPortalPage } from './pages/staff-portal/StaffPortalPage'
import { JerseysPage } from './pages/jerseys'
import { SchedulePage, CoachAvailabilityPage } from './pages/schedule'
import { AttendancePage } from './pages/attendance'
import { ChatsPage } from './pages/chats'
import { BlastsPage } from './pages/blasts'
import { GamePrepPage } from './pages/gameprep'
import LineupsPage from './pages/lineups/LineupsPage'
import { TeamStandingsPage } from './pages/standings'
import { SeasonLeaderboardsPage } from './pages/leaderboards'
import { ReportsPage, RegistrationFunnelPage } from './pages/reports'

// Admin Pages
import SeasonManagementPage from './pages/admin/SeasonManagementPage'

// Settings Pages
import { SeasonsPage, WaiversPage, PaymentSetupPage, OrganizationPage, RegistrationTemplatesPage, DataExportPage, SubscriptionPage } from './pages/settings'
import { VenueManagerPage } from './pages/settings/VenueManagerPage'

// Stats Pages
import { PlayerStatsPage } from './pages/stats/PlayerStatsPage'

// Drill & Practice Plan Pages
import { DrillLibraryPage } from './pages/drills'
import { PracticePlansPage, PracticePlanBuilder, ReflectionTemplatesPage } from './pages/practice-plans'

// Achievements Pages
import { AchievementsCatalogPage } from './pages/achievements'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import EmailPage from './pages/email/EmailPage'

// Platform Admin (lazy loaded)
const PlatformAnalyticsPage = lazy(() => import('./pages/platform/PlatformAnalyticsPage'))
const PlatformSubscriptionsPage = lazy(() => import('./pages/platform/PlatformSubscriptionsPage'))
const PlatformOverview = lazy(() => import('./pages/platform/PlatformOverview'))
const PlatformOrganizations = lazy(() => import('./pages/platform/PlatformOrganizations'))
const PlatformOrgDetail = lazy(() => import('./pages/platform/PlatformOrgDetail'))
const PlatformUsersPage = lazy(() => import('./pages/platform/PlatformUsers'))
const PlatformSupport = lazy(() => import('./pages/platform/PlatformSupport'))
const PlatformAuditLog = lazy(() => import('./pages/platform/PlatformAuditLog'))
const PlatformSettings = lazy(() => import('./pages/platform/PlatformSettings'))
const PlatformNotifications = lazy(() => import('./pages/platform/PlatformNotifications'))
const PlatformEmailCenter = lazy(() => import('./pages/platform/PlatformEmailCenter'))
const PlatformFeatureRequests = lazy(() => import('./pages/platform/PlatformFeatureRequests'))
const PlatformCompliance = lazy(() => import('./pages/platform/PlatformCompliance'))
const PlatformEngagement = lazy(() => import('./pages/platform/PlatformEngagement'))
const PlatformRegistrationFunnel = lazy(() => import('./pages/platform/PlatformRegistrationFunnel'))
const PlatformContentManager = lazy(() => import('./pages/platform/PlatformContentManager'))
const PlatformSystemHealth = lazy(() => import('./pages/platform/PlatformSystemHealth'))
const PlatformDatabaseTools = lazy(() => import('./pages/platform/PlatformDatabaseTools'))
const PlatformTeam = lazy(() => import('./pages/platform/PlatformTeam'))
const PlatformIntegrations = lazy(() => import('./pages/platform/PlatformIntegrations'))
const PlatformMyProfile = lazy(() => import('./pages/platform/PlatformMyProfile'))
const PlatformShell = lazy(() => import('./components/platform/PlatformShell'))

// Profile
import { MyProfilePage } from './pages/profile/MyProfilePage'

// Auth
import RouteGuard from './components/auth/RouteGuard'

// Archives
import { SeasonArchivePage } from './pages/archives'

// Roster Manager
import RosterManagerPage from './pages/roster/RosterManagerPage'

// ============================================
// NAV DROPDOWN COMPONENT
// ============================================
function NavDropdown({ label, items, currentPage, onNavigate, isActive, directTeamWallId, navPosition }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  // In light mode, buttons on the left (>50% of bar) sit on light bg, right side on dark bg
  const onDarkBg = isDark || navPosition === 'dark'

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!items || items.length === 0) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-5 py-2 text-lg rounded-full transition-all duration-200 whitespace-nowrap font-bold ${
          isActive
            ? onDarkBg
              ? 'bg-white/15 text-white'
              : 'bg-[#10284C]/10 text-[#10284C]'
            : onDarkBg
              ? 'text-white/80 hover:text-white hover:bg-white/10'
              : 'text-[#10284C]/70 hover:text-[#10284C] hover:bg-[#10284C]/[0.06]'
        }`}
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-3 w-56 rounded-xl overflow-hidden z-50 animate-slide-down ${
          isDark
            ? 'bg-lynx-charcoal border border-lynx-border-dark shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
            : 'bg-white border border-lynx-silver shadow-[0_8px_40px_rgba(0,0,0,0.1)]'
        }`}>
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id, item)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-lg transition-colors duration-150 ${
                (item.teamId && directTeamWallId === item.teamId) || currentPage === item.id
                  ? isDark
                    ? 'bg-lynx-sky/15 text-lynx-sky font-semibold'
                    : 'bg-[#4BB9EC]/10 text-[#10284C] font-semibold'
                  : isDark
                    ? 'text-white/90 hover:text-white hover:bg-white/[0.06]'
                    : 'text-slate-700 hover:text-[#10284C] hover:bg-slate-50'
              }`}
            >
              <NavIcon name={item.icon} className="w-4 h-4" />
              <span>{item.label}</span>
              {item.hasBadge && <JerseyNavBadge collapsed={false} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// NOTIFICATION DROPDOWN COMPONENT
// ============================================
function NotificationDropdown({ tc, organization, isDark }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen && organization?.id) {
      loadNotifications()
    }
  }, [isOpen, organization?.id])

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!organization?.id) return
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [organization?.id])

  const [unreadCount, setUnreadCount] = useState(0)

  async function loadUnreadCount() {
    try {
      const { count } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    } catch (err) {
      // Table may not exist yet - silently fail
      console.warn('admin_notifications table may not exist:', err.message)
    }
  }

  async function loadNotifications() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data || [])
    } catch (err) {
      console.warn('Error loading notifications:', err.message)
    }
    setLoading(false)
  }

  async function markAsRead(notifId) {
    await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notifId)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    if (!organization?.id) return
    await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('organization_id', organization.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function dismissNotification(notifId, e) {
    e.stopPropagation()
    await supabase.from('admin_notifications').delete().eq('id', notifId)
    setNotifications(prev => prev.filter(n => n.id !== notifId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  function getNotifIcon(type) {
    switch(type) {
      case 'jersey_change': return '👕'
      case 'payment_received': return '💰'
      case 'waiver_signed': return '📝'
      case 'registration_new': return '🆕'
      case 'rsvp_update': return '✅'
      default: return '🔔'
    }
  }

  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const mins = Math.floor((now - date) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative w-9 h-9 flex items-center justify-center rounded-full transition hover:bg-white/10">
        <Bell className="w-5 h-5 text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-96 rounded-xl overflow-hidden z-50 animate-slide-down bg-lynx-charcoal border border-lynx-border-dark shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className={`p-3 border-b ${tc.border} flex items-center justify-between`}>
            <span className={`font-semibold ${tc.text}`}>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-lynx-sky hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className={`text-sm ${tc.textMuted}`}>Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <div className={`text-sm ${tc.textMuted}`}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-3 border-b ${tc.border} ${tc.hoverBg} cursor-pointer transition ${!notif.is_read ? (isDark ? 'bg-lynx-charcoal/60' : 'bg-blue-50/50') : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl mt-0.5">{getNotifIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-lynx-sky shrink-0" />}
                        <p className={`font-medium text-sm ${tc.text} truncate`}>{notif.title}</p>
                      </div>
                      <p className={`text-xs ${tc.textMuted} mt-0.5 line-clamp-2`}>{notif.message}</p>
                      <p className={`text-xs ${tc.textMuted} mt-1 opacity-60`}>{timeAgo(notif.created_at)}</p>
                    </div>
                    <button 
                      onClick={(e) => dismissNotification(notif.id, e)}
                      className={`p-1 rounded ${tc.hoverBg} ${tc.textMuted} hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0`}
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className={`p-3 border-t ${tc.border}`}>
              <button className={`w-full text-center text-sm ${tc.textSecondary} hover:text-lynx-sky`}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// USER PROFILE DROPDOWN COMPONENT
// ============================================
function UserProfileDropdown({
  profile, activeView, showRoleSwitcher, setShowRoleSwitcher, getAvailableViews,
  setActiveView, signOut, tc, accent, accentColor, changeAccent,
  accentColors, isDark, toggleTheme
}) {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRoleSwitcher(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowRoleSwitcher])

  const getRoleLabel = () => {
    switch(activeView) {
      case 'admin': return 'Admin'
      case 'coach': return 'Coach'
      case 'team_manager': return 'Team Manager'
      case 'parent': return 'Parent'
      case 'player': return 'Player'
      default: return 'User'
    }
  }

  const getDisplayName = () => {
    if (activeView === 'coach') {
      return `Coach ${profile?.full_name?.split(' ')[1] || profile?.full_name?.split(' ')[0] || 'User'}`
    }
    return profile?.full_name || 'User'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-full transition hover:bg-white/10"
        onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-white/20"
          style={{
            background: profile?.photo_url ? 'transparent' : accent.primary,
            color: '#000',
          }}>
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile?.full_name?.charAt(0) || '?'
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-bold text-white">{getDisplayName()}</span>
          <span className="text-[11px] font-semibold text-white/60">{getRoleLabel()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform text-white/80 ${showRoleSwitcher ? 'rotate-180' : ''}`} />
      </button>

      {showRoleSwitcher && (
        <div className={`absolute right-0 top-full mt-3 w-72 rounded-xl overflow-hidden z-50 animate-slide-down ${
          isDark
            ? 'bg-lynx-charcoal backdrop-blur-2xl border border-lynx-border-dark shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
            : 'bg-white backdrop-blur-2xl border border-lynx-silver shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
        }`}>
          <div className={`p-4 border-b ${tc.border} flex items-center gap-3`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold overflow-hidden"
              style={{ background: profile?.photo_url ? 'transparent' : accent.primary, color: '#000' }}>
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{profile?.full_name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <p className={`text-base font-bold ${tc.text}`}>{profile?.full_name || 'User'}</p>
              <p className={`text-sm ${tc.textMuted} flex items-center gap-1`}>
                {activeView === 'admin' && <Shield className={`w-3.5 h-3.5 ${isDark ? '' : 'text-[#10284C]'}`} />}
                {activeView === 'coach' && <UserCog className={`w-3.5 h-3.5 ${isDark ? '' : 'text-[#10284C]'}`} />}
                {activeView === 'team_manager' && <ClipboardList className={`w-3.5 h-3.5 ${isDark ? '' : 'text-[#10284C]'}`} />}
                {activeView === 'parent' && <Users className={`w-3.5 h-3.5 ${isDark ? '' : 'text-[#10284C]'}`} />}
                {activeView === 'player' && <VolleyballIcon className={`w-3.5 h-3.5 ${isDark ? '' : 'text-[#10284C]'}`} />}
                {getRoleLabel()}
              </p>
            </div>
          </div>

          <div className={`p-2 border-b ${tc.border}`}>
            <button
              onClick={() => { setShowRoleSwitcher(false); navigate('/profile'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${tc.hoverBg}`}
            >
              <User className={`w-5 h-5 ${isDark ? 'text-lynx-sky' : 'text-[#10284C]'}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-base ${tc.text}`}>My Profile</p>
                <p className={`text-sm ${tc.textMuted} truncate`}>Edit your personal info</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${tc.textMuted}`} />
            </button>
          </div>

          <div className={`p-2 border-b ${tc.border}`}>
            <p className={`text-sm ${tc.textMuted} px-2 py-1`}>Switch View</p>
            {getAvailableViews().map(view => (
              <button key={view.id}
                onClick={() => { setActiveView(view.id); localStorage.setItem('lynx_active_view', view.id); setShowRoleSwitcher(false); navigate('/dashboard'); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                  activeView === view.id ? 'bg-lynx-sky/20' : tc.hoverBg
                }`}>
                <NavIcon name={view.icon} className={`w-5 h-5 ${isDark ? '' : 'text-[#10284C]'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base ${activeView === view.id ? 'text-lynx-sky' : tc.text}`}>{view.label}</p>
                  <p className={`text-sm ${tc.textMuted} truncate`}>{view.description}</p>
                </div>
                {activeView === view.id && <Check className="w-4 h-4 text-lynx-sky" />}
              </button>
            ))}
          </div>

          <div className={`p-2 flex gap-2`}>
            <button onClick={toggleTheme}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg ${tc.hoverBg} ${tc.textSecondary} text-base`}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button onClick={signOut}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 text-base`}>
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// ============================================
// MAIN APP COMPONENT
// ============================================
// ── Background Layer ─────────────────────────────────────────────────
const BACKGROUND_GRADIENTS = {
  ocean: 'linear-gradient(135deg, #0F172A, #1E3A5F)',
  sunset: 'linear-gradient(135deg, #1E293B, #7C3AED, #EC4899)',
  aurora: 'linear-gradient(135deg, #0F172A, #059669, #0EA5E9)',
  'cotton-candy': 'linear-gradient(135deg, #F0F9FF, #FCE7F3)',
  peach: 'linear-gradient(135deg, #FFFBEB, #FED7AA)',
  sky: 'linear-gradient(135deg, #E0F2FE, #BFDBFE)',
  lavender: 'linear-gradient(135deg, #F5F3FF, #DDD6FE)',
  mint: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)',
  fire: 'linear-gradient(135deg, #1E293B, #DC2626, #F97316)',
  royal: 'linear-gradient(135deg, #1E293B, #4F46E5, #7C3AED)',
}

const BACKGROUND_SOLIDS = {
  midnight: '#0F172A', slate: '#1E293B', navy: '#1E3A5F', charcoal: '#374151',
  white: '#FFFFFF', cream: '#FFFBEB', ice: '#F0F9FF', mist: '#F1F5F9',
}

const BACKGROUND_PATTERNS = {
  volleyball: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='14' fill='none' stroke='white' stroke-width='0.8'/%3E%3Cline x1='20' y1='30' x2='40' y2='30' stroke='white' stroke-width='0.4'/%3E%3Cline x1='30' y1='20' x2='30' y2='40' stroke='white' stroke-width='0.4'/%3E%3C/svg%3E")`,
  hexagons: `url("data:image/svg+xml,%3Csvg width='50' height='43' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='25,2 45,13 45,33 25,43 5,33 5,13' fill='none' stroke='white' stroke-width='0.6'/%3E%3C/svg%3E")`,
  'court-lines': `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4' y='4' width='72' height='72' fill='none' stroke='white' stroke-width='0.6'/%3E%3Cline x1='4' y1='40' x2='76' y2='40' stroke='white' stroke-width='0.8'/%3E%3C/svg%3E")`,
  'diagonal-stripes': 'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 20px)',
  triangles: `url("data:image/svg+xml,%3Csvg width='60' height='52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='30,4 56,48 4,48' fill='none' stroke='white' stroke-width='0.6'/%3E%3C/svg%3E")`,
  dots: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='1.5' fill='white'/%3E%3C/svg%3E")`,
}

function OrgBackgroundLayer({ isDark }) {
  const { background } = useOrgBranding()

  const sidebarOffset = { left: 'var(--v2-sidebar-width)' }

  // Default gradient if no org background set
  if (!background) {
    return (
      <div className={`fixed inset-0 pointer-events-none ${
        isDark
          ? 'bg-gradient-to-br from-lynx-midnight via-lynx-midnight to-lynx-charcoal'
          : 'bg-gradient-to-br from-[#E8EAF0] via-[#F0F1F5] to-[#F5F0EB]'
      }`} style={sidebarOffset} />
    )
  }

  const opacity = background.opacity || 0.08

  if (background.type === 'solid') {
    const color = BACKGROUND_SOLIDS[background.value] || background.value || '#0F172A'
    return <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: color, ...sidebarOffset }} />
  }

  if (background.type === 'gradient') {
    const grad = BACKGROUND_GRADIENTS[background.value]
    if (!grad) return <div className="fixed inset-0 pointer-events-none bg-lynx-midnight" style={sidebarOffset} />
    return <div className="fixed inset-0 pointer-events-none" style={{ background: grad, ...sidebarOffset }} />
  }

  if (background.type === 'pattern') {
    const pattern = BACKGROUND_PATTERNS[background.value]
    if (!pattern) return <div className="fixed inset-0 pointer-events-none bg-lynx-midnight" style={sidebarOffset} />
    return (
      <div className="fixed inset-0 pointer-events-none" style={sidebarOffset}>
        <div className="absolute inset-0 bg-lynx-midnight" />
        <div className="absolute inset-0" style={{ backgroundImage: pattern, backgroundRepeat: 'repeat', opacity }} />
      </div>
    )
  }

  if (background.type === 'custom' && background.value) {
    return (
      <div className="fixed inset-0 pointer-events-none" style={sidebarOffset}>
        <div className={`absolute inset-0 ${isDark ? 'bg-lynx-midnight' : 'bg-[#F0F1F5]'}`} />
        <img
          src={background.value}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity }}
        />
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 pointer-events-none ${
      isDark
        ? 'bg-gradient-to-br from-lynx-midnight via-lynx-midnight to-lynx-charcoal'
        : 'bg-gradient-to-br from-[#E8EAF0] via-[#F0F1F5] to-[#F5F0EB]'
    }`} style={sidebarOffset} />
  )
}

// ============================================
// TEAM WALL ROUTE WRAPPER — extracts teamId from URL params
// ============================================
function TeamWallRoute({ showToast, activeView }) {
  const { teamId } = useParams()
  const navigate = useNavigate()
  return (
    <TeamWallPage
      teamId={teamId}
      showToast={showToast}
      onBack={() => navigate(-1)}
      onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))}
      activeView={activeView}
    />
  )
}

// ============================================
// PARENT PLAYER ROUTE WRAPPERS
// ============================================
function ParentPlayerCardRoute({ roleContext, showToast, activeView }) {
  const { playerId } = useParams()
  return <ParentPlayerCardPage playerId={playerId} roleContext={roleContext} showToast={showToast} activeView={activeView} />
}

function PlayerProfileRoute({ roleContext, showToast, activeView }) {
  const { playerId } = useParams()
  const navigate = useNavigate()
  return <PlayerProfilePage playerId={playerId} roleContext={roleContext} showToast={showToast} activeView={activeView} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} />
}

// ============================================
// ROUTED CONTENT — renders the correct page based on URL
// ============================================
function RoutedContent({ activeView, roleContext, showToast, selectedPlayerForView, setSelectedPlayerForView, getAvailableViews, setActiveView, onRefreshRoles }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navigateToTeamWall = (teamId) => navigate(`/teams/${teamId}`)

  return (
    <div key={location.pathname} className="animate-page-in">
    <Routes>
      {/* Dashboard — role-dependent */}
      <Route path="/dashboard" element={
        activeView === 'admin' ? <DashboardPage onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} activeView={activeView} availableViews={getAvailableViews()} onSwitchRole={(viewId) => { setActiveView(viewId); localStorage.setItem('lynx_active_view', viewId); navigate('/dashboard') }} /> :
        activeView === 'coach' ? <CoachDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} activeView={activeView} availableViews={getAvailableViews()} onSwitchRole={(viewId) => { setActiveView(viewId); localStorage.setItem('lynx_active_view', viewId); navigate('/dashboard') }} /> :
        activeView === 'team_manager' ? (
          roleContext?.teamManagerInfo?.length > 0
            ? <TeamManagerDashboard roleContext={roleContext} showToast={showToast} navigateToTeamWall={navigateToTeamWall} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} activeView={activeView} availableViews={getAvailableViews()} onSwitchRole={(viewId) => { setActiveView(viewId); localStorage.setItem('lynx_active_view', viewId); navigate('/dashboard') }} />
            : <TeamManagerSetup roleContext={roleContext} showToast={showToast} onComplete={() => onRefreshRoles?.()} />
        ) :
        activeView === 'parent' ? <ParentDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} activeView={activeView} availableViews={getAvailableViews()} onSwitchRole={(viewId) => { setActiveView(viewId); localStorage.setItem('lynx_active_view', viewId); navigate('/dashboard') }} /> :
        activeView === 'player' ? <PlayerDashboard roleContext={{...roleContext, role: roleContext?.isAdmin ? 'admin' : roleContext?.isCoach ? 'head_coach' : 'player'}} navigateToTeamWall={navigateToTeamWall} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} showToast={showToast} onPlayerChange={setSelectedPlayerForView} activeView={activeView} availableViews={getAvailableViews()} onSwitchRole={(viewId) => { setActiveView(viewId); localStorage.setItem('lynx_active_view', viewId); navigate('/dashboard') }} /> :
        <div className="flex items-center justify-center h-[50vh] text-center">
          <div>
            <p className="text-lg font-semibold">No dashboard available for this role.</p>
            <p className="text-sm text-gray-500 mt-2">Try switching to a different role using the sidebar.</p>
          </div>
        </div>
      } />

      {/* Team Wall — /teams/:teamId */}
      <Route path="/teams/:teamId" element={<TeamWallRoute showToast={showToast} activeView={activeView} />} />

      {/* Team Hubs — admin selector */}
      <Route path="/team-hubs" element={
        <RouteGuard allow={['admin']} activeView={activeView}>
          <TeamHubSelectorPage showToast={showToast} navigateToTeamWall={navigateToTeamWall} />
        </RouteGuard>
      } />

      {/* Parent-specific routes */}
      <Route path="/parent/player/:playerId/profile" element={<RouteGuard allow={['parent', 'admin', 'coach']} activeView={activeView}><PlayerProfileRoute roleContext={roleContext} showToast={showToast} activeView={activeView} /></RouteGuard>} />
      <Route path="/parent/player/:playerId" element={<RouteGuard allow={['parent', 'admin', 'coach']} activeView={activeView}><ParentPlayerCardRoute roleContext={roleContext} showToast={showToast} activeView={activeView} /></RouteGuard>} />
      <Route path="/messages" element={<RouteGuard allow={['parent']} activeView={activeView}><ParentMessagesPage roleContext={roleContext} showToast={showToast} /></RouteGuard>} />
      <Route path="/invite" element={<RouteGuard allow={['parent']} activeView={activeView}><InviteFriendsPage roleContext={roleContext} showToast={showToast} /></RouteGuard>} />
      <Route path="/my-stuff" element={<RouteGuard allow={['parent', 'player']} activeView={activeView}><MyStuffPage roleContext={roleContext} showToast={showToast} /></RouteGuard>} />
      <Route path="/parent/register" element={<RouteGuard allow={['parent']} activeView={activeView}><ParentRegistrationHub roleContext={roleContext} showToast={showToast} /></RouteGuard>} />
      <Route path="/claim-account" element={<ClaimAccountPage showToast={showToast} />} />

      {/* Roster Manager — admin + coach */}
      <Route path="/roster" element={<RouteGuard allow={['admin', 'coach', 'team_manager']} activeView={activeView}><RosterManagerPage showToast={showToast} roleContext={roleContext} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} /></RouteGuard>} />

      {/* Core pages */}
      <Route path="/teams" element={<RouteGuard allow={['admin']} activeView={activeView}><TeamsPage showToast={showToast} navigateToTeamWall={navigateToTeamWall} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} /></RouteGuard>} />
      <Route path="/coaches" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><StaffPortalPage showToast={showToast} /></RouteGuard>} />
      <Route path="/staff" element={<RouteGuard allow={['admin']} activeView={activeView}><StaffPortalPage showToast={showToast} /></RouteGuard>} />
      <Route path="/registrations" element={<RouteGuard allow={['admin']} activeView={activeView}><RegistrationsPage showToast={showToast} /></RouteGuard>} />
      <Route path="/jerseys" element={<RouteGuard allow={['admin']} activeView={activeView}><JerseysPage showToast={showToast} /></RouteGuard>} />
      <Route path="/schedule" element={<SchedulePage showToast={showToast} activeView={activeView} roleContext={roleContext} />} />
      <Route path="/schedule/availability" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><CoachAvailabilityPage showToast={showToast} activeView={activeView} roleContext={roleContext} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} /></RouteGuard>} />

      {/* Practice Planning */}
      <Route path="/drills" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><DrillLibraryPage showToast={showToast} /></RouteGuard>} />
      <Route path="/practice-plans" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><PracticePlansPage showToast={showToast} /></RouteGuard>} />
      <Route path="/practice-plans/:planId" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><PracticePlanBuilder showToast={showToast} /></RouteGuard>} />
      <Route path="/reflection-templates" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><ReflectionTemplatesPage showToast={showToast} /></RouteGuard>} />

      <Route path="/attendance" element={<RouteGuard allow={['admin', 'coach', 'team_manager']} activeView={activeView}><AttendancePage showToast={showToast} /></RouteGuard>} />
      <Route path="/payments" element={
        activeView === 'parent'
          ? <ParentPaymentsPage roleContext={roleContext} showToast={showToast} />
          : <RouteGuard allow={['admin', 'team_manager']} activeView={activeView}><PaymentsPage showToast={showToast} /></RouteGuard>
      } />
      <Route path="/gameprep" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><GamePrepPage showToast={showToast} /></RouteGuard>} />
      <Route path="/lineups" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><LineupsPage showToast={showToast} /></RouteGuard>} />
      <Route path="/standings" element={<TeamStandingsPage showToast={showToast} />} />
      <Route path="/leaderboards" element={<SeasonLeaderboardsPage showToast={showToast} />} />
      <Route path="/chats" element={<ChatsPage showToast={showToast} activeView={activeView} roleContext={roleContext} />} />
      <Route path="/blasts" element={<RouteGuard allow={['admin', 'coach', 'team_manager']} activeView={activeView}><BlastsPage showToast={showToast} activeView={activeView} roleContext={roleContext} /></RouteGuard>} />
      <Route path="/notifications" element={<RouteGuard allow={['admin']} activeView={activeView}><NotificationsPage showToast={showToast} /></RouteGuard>} />
      <Route path="/email" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><EmailPage showToast={showToast} activeView={activeView} /></RouteGuard>} />
      <Route path="/reports" element={<RouteGuard allow={['admin']} activeView={activeView}><ReportsPage showToast={showToast} /></RouteGuard>} />
      <Route path="/reports/funnel" element={<RouteGuard allow={['admin']} activeView={activeView}><RegistrationFunnelPage showToast={showToast} /></RouteGuard>} />
      <Route path="/archives" element={<SeasonArchivePage showToast={showToast} />} />
      <Route path="/directory" element={<OrgDirectoryPage isEmbedded />} />
      <Route path="/achievements" element={
        <AchievementsCatalogPage
          playerId={activeView === 'player' ? selectedPlayerForView?.id : roleContext?.children?.[0]?.id}
          showToast={showToast}
          playerName={activeView === 'player' ? (selectedPlayerForView ? `${selectedPlayerForView.first_name}'s` : 'My') : (roleContext?.children?.[0]?.first_name ? `${roleContext.children[0].first_name}'s` : 'Player')}
          isAdminPreview={activeView === 'player' && roleContext?.isAdmin}
        />
      } />

      {/* Stats */}
      <Route path="/stats" element={
        <PlayerStatsPage
          playerId={activeView === 'player' ? selectedPlayerForView?.id : roleContext?.children?.[0]?.id}
          showToast={showToast}
        />
      } />
      <Route path="/stats/:playerId" element={
        <RouteGuard allow={['admin', 'coach', 'parent']} activeView={activeView}>
          <PlayerStatsPage showToast={showToast} />
        </RouteGuard>
      } />

      {/* Admin — Season Management */}
      <Route path="/admin/seasons/:seasonId" element={<RouteGuard allow={['admin']} activeView={activeView}><SeasonManagementPage showToast={showToast} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} /></RouteGuard>} />
      <Route path="/admin/seasons" element={<RouteGuard allow={['admin']} activeView={activeView}><SeasonManagementPage showToast={showToast} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} /></RouteGuard>} />

      {/* Settings — admin only */}
      <Route path="/settings/seasons" element={<RouteGuard allow={['admin']} activeView={activeView}><SeasonsPage showToast={showToast} /></RouteGuard>} />
      <Route path="/settings/templates" element={<RouteGuard allow={['admin']} activeView={activeView}><RegistrationTemplatesPage showToast={showToast} /></RouteGuard>} />
      <Route path="/settings/waivers" element={<RouteGuard allow={['admin']} activeView={activeView}><WaiversPage showToast={showToast} /></RouteGuard>} />
      <Route path="/settings/payment-setup" element={<RouteGuard allow={['admin']} activeView={activeView}><PaymentSetupPage showToast={showToast} /></RouteGuard>} />
      <Route path="/settings/organization" element={<RouteGuard allow={['admin']} activeView={activeView}><OrganizationPage showToast={showToast} /></RouteGuard>} />
      <Route path="/settings/data-export" element={<RouteGuard allow={['admin']} activeView={activeView}><DataExportPage showToast={showToast} /></RouteGuard>} />
      <Route path="/settings/subscription" element={<RouteGuard allow={['admin']} activeView={activeView}><SubscriptionPage showToast={showToast} /></RouteGuard>} />
      <Route path="/settings/venues" element={<RouteGuard allow={['admin']} activeView={activeView}><VenueManagerPage showToast={showToast} /></RouteGuard>} />

      {/* Profile */}
      <Route path="/profile" element={<MyProfilePage showToast={showToast} />} />

      {/* Platform Admin routes handled by PlatformShell in platform appMode */}

      {/* Default: redirect / to /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all: redirect unknown paths to /dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </div>
  )
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function MainApp() {
  const { profile, organization, signOut, user, isPlatformAdmin } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent, accentColor, changeAccent, accentColors, toggleTheme } = useTheme()
  const { toasts, showToast, removeToast } = useToast()
  const cmdPalette = useCommandPalette()
  const mainLocation = useLocation()

  // Document title updates
  useDocumentTitle()

  const [appMode, setAppMode] = useState(() =>
    (window.location.pathname.startsWith('/platform') && isPlatformAdmin) ? 'platform' : 'org'
  ) // 'org' | 'platform'

  // Sync appMode with URL changes (browser back/forward)
  useEffect(() => {
    const isPlatformUrl = mainLocation.pathname.startsWith('/platform')
    if (isPlatformUrl && isPlatformAdmin && appMode !== 'platform') setAppMode('platform')
    else if (isPlatformUrl && !isPlatformAdmin) navigate('/dashboard', { replace: true })
    else if (!isPlatformUrl && appMode === 'platform') setAppMode('org')
  }, [mainLocation.pathname, isPlatformAdmin])
  const [activeView, setActiveView] = useState('admin')
  const [userRoles, setUserRoles] = useState([])
  const [roleContext, setRoleContext] = useState(null)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)
  const [selectedPlayerForView, setSelectedPlayerForView] = useState(null)

  useEffect(() => {
    if (profile?.id && organization?.id) {
      loadRoleContext()
    }
  }, [profile?.id, organization?.id])

  async function loadRoleContext() {
    try {
      const { data: roles } = await supabase
        .from('user_roles').select('*')
        .eq('user_id', profile.id).eq('organization_id', organization.id).eq('is_active', true)

      setUserRoles(roles || [])

      const { data: coachLink } = await supabase
        .from('coaches').select('*, team_coaches(team_id, role, teams(id, name, color))')
        .eq('profile_id', profile.id).maybeSingle()

      const { data: teamManagerStaff } = await supabase
        .from('team_staff')
        .select('team_id, staff_role, is_active, teams(id, name, color, season_id)')
        .eq('user_id', profile.id)
        .eq('staff_role', 'team_manager')
        .eq('is_active', true)

      // Get org season IDs to scope children to active organization
      const { data: orgSeasons } = await supabase
        .from('seasons').select('id').eq('organization_id', organization.id)
      const orgSeasonIds = orgSeasons?.map(s => s.id) || []

      const { data: children } = orgSeasonIds.length > 0
        ? await supabase
            .from('players').select('*, team_players(team_id, jersey_number, teams(id, name, color, season_id)), season:seasons(id, name, sports(name, icon), organizations(id, name, slug, settings))')
            .eq('parent_account_id', profile.id)
            .in('season_id', orgSeasonIds)
        : { data: [] }

      // TODO: needs profile_id linkage — players table has no profile_id column to link a profile to a player self-record
      const playerSelf = null

      setRoleContext({
        roles: roles || [],
        isAdmin: roles?.some(r => r.role === 'league_admin' || r.role === 'admin'),
        isCoach: !!coachLink,
        coachInfo: coachLink,
        isTeamManager: (teamManagerStaff && teamManagerStaff.length > 0) || roles?.some(r => r.role === 'team_manager'),
        teamManagerInfo: teamManagerStaff || [],
        isParent: roles?.some(r => r.role === 'parent') && children?.length > 0,
        children: children || [],
        isPlayer: !!playerSelf,
        playerInfo: playerSelf
      })

      // Build list of available roles for this user
      const availableRoles = []
      if (roles?.some(r => r.role === 'league_admin' || r.role === 'admin')) availableRoles.push('admin')
      if (coachLink) availableRoles.push('coach')
      if ((teamManagerStaff && teamManagerStaff.length > 0) || roles?.some(r => r.role === 'team_manager')) availableRoles.push('team_manager')
      if (children?.length > 0) availableRoles.push('parent')
      if (playerSelf) availableRoles.push('player')
      if (availableRoles.length === 0) availableRoles.push('player')

      // Check if user previously selected a role (persists across refresh)
      const savedView = localStorage.getItem('lynx_active_view')
      if (savedView && availableRoles.includes(savedView)) {
        setActiveView(savedView)
      } else {
        // Default to highest privilege role
        setActiveView(availableRoles[0])
      }
    } catch (err) {
      console.error('Error loading role context:', err)
    }
  }

  const getAvailableViews = () => {
    const views = []
    if (roleContext?.isAdmin) {
      views.push({ id: 'admin', label: 'Admin', icon: 'shield', description: 'Full league management' })
    }
    if (roleContext?.isCoach) {
      const teamNames = roleContext.coachInfo?.team_coaches?.map(tc => tc.teams?.name).filter(Boolean).join(', ')
      views.push({ id: 'coach', label: 'Coach', icon: 'user-cog', description: teamNames || 'Team management' })
    }
    if (roleContext?.isTeamManager) {
      const teamNames = roleContext.teamManagerInfo?.map(ts => ts.teams?.name).filter(Boolean).join(', ')
      views.push({ id: 'team_manager', label: 'Team Manager', icon: 'clipboard', description: teamNames || 'Team operations' })
    }
    if (roleContext?.isParent && roleContext.children?.length > 0) {
      const childNames = roleContext.children.map(c => c.first_name).join(', ')
      views.push({ id: 'parent', label: 'Parent', icon: 'users', description: childNames })
    }
    if (roleContext?.isPlayer) {
      views.push({ id: 'player', label: 'Player', icon: 'volleyball', description: roleContext.playerInfo?.first_name })
    }
    if ((roleContext?.isAdmin || roleContext?.isCoach) && !roleContext?.isPlayer) {
      views.push({ id: 'player', label: 'Player', icon: 'volleyball', description: 'Preview player view' })
    }
    return views
  }

  // ── Nav groups — role-specific, computed at MainApp scope ──
  const navigate = useNavigate()
  const page = useCurrentPageId()
  const directTeamWallId = mainLocation.pathname.match(/^\/teams\/([^/]+)$/)?.[1] || null

  // Contextual top bar links — what shows in the top bar based on current page
  const CONTEXTUAL_NAV = {
    dashboard:     ['schedule', 'registrations', 'payments', 'teams'],
    teams:         ['coaches', 'jerseys', 'registrations'],
    coaches:       ['teams', 'jerseys', 'schedule'],
    registrations: ['templates', 'registration-funnel', 'payments'],
    payments:      ['paymentsetup', 'registrations', 'reports'],
    schedule:      ['attendance', 'coach-availability', 'gameprep'],
    // Compete section — shared contextual links
    gameprep:      ['attendance', 'standings', 'leaderboards'],
    attendance:    ['gameprep', 'standings', 'leaderboards'],
    standings:     ['gameprep', 'attendance', 'leaderboards'],
    leaderboards:  ['gameprep', 'attendance', 'standings'],
    achievements:  ['leaderboards', 'standings', 'gameprep'],
    // Practice section — shared contextual links
    drills:            ['practice-plans', 'schedule', 'gameprep'],
    'practice-plans':  ['drills', 'schedule', 'gameprep'],
    chats:         ['blasts', 'notifications', 'schedule'],
    blasts:        ['chats', 'notifications'],
    notifications: ['chats', 'blasts'],
    reports:       ['registration-funnel', 'season-archives', 'org-directory'],
    seasons:       ['organization', 'venues', 'waivers'],
    organization:  ['seasons', 'paymentsetup', 'venues'],
    jerseys:       ['teams', 'coaches', 'registrations'],
    templates:     ['registrations', 'waivers', 'registration-funnel'],
    waivers:       ['templates', 'registrations', 'organization'],
    paymentsetup:  ['payments', 'registrations', 'organization'],
    venues:        ['schedule', 'organization', 'seasons'],
  }

  // Page ID to label mapping for top bar display
  const PAGE_LABELS = {
    dashboard: 'Dashboard', teams: 'Teams', coaches: 'Staff', registrations: 'Registrations',
    payments: 'Payments', schedule: 'Schedule', attendance: 'Attendance', gameprep: 'Game Prep',
    standings: 'Standings', leaderboards: 'Leaderboards', chats: 'Chats', blasts: 'Announcements',
    notifications: 'Notifications', reports: 'Reports', seasons: 'Seasons', organization: 'Settings',
    jerseys: 'Jerseys', templates: 'Reg Forms', waivers: 'Waivers', paymentsetup: 'Pay Setup',
    venues: 'Venues', 'coach-availability': 'Availability', 'registration-funnel': 'Funnel',
    'season-archives': 'Archives', 'org-directory': 'Directory', 'data-export': 'Export',
    subscription: 'Subscription', roster: 'Roster', achievements: 'Achievements',
    stats: 'My Stats', 'my-stuff': 'My Stuff', 'parent-register': 'Registration',
    'team-hub': 'Team Hub',
    drills: 'Drill Library',
    'practice-plans': 'Practice Plans',
  }

  // ── Contextual nav maps per role ──
  const COACH_CONTEXTUAL_NAV = {
    dashboard:          ['schedule', 'attendance', 'gameprep'],
    roster:             ['schedule', 'chats', 'standings'],
    schedule:           ['dashboard', 'attendance', 'chats'],
    // Compete section
    gameprep:           ['attendance', 'standings', 'leaderboards'],
    attendance:         ['gameprep', 'standings', 'leaderboards'],
    standings:          ['gameprep', 'attendance', 'leaderboards'],
    leaderboards:       ['gameprep', 'attendance', 'standings'],
    achievements:       ['leaderboards', 'standings', 'gameprep'],
    // Practice section
    drills:             ['practice-plans', 'schedule', 'gameprep'],
    'practice-plans':   ['drills', 'schedule', 'gameprep'],
    chats:              ['dashboard', 'schedule', 'roster'],
    blasts:             ['chats', 'schedule', 'dashboard'],
    'coach-availability': ['schedule', 'dashboard', 'season-archives'],
    'season-archives':  ['dashboard', 'org-directory', 'schedule'],
    'org-directory':    ['dashboard', 'season-archives', 'chats'],
  }

  const PARENT_CONTEXTUAL_NAV = {
    dashboard:          ['schedule', 'payments', 'achievements'],
    schedule:           ['dashboard', 'achievements', 'chats'],
    payments:           ['parent-register', 'schedule', 'dashboard'],
    'parent-register':  ['payments', 'schedule', 'dashboard'],
    chats:              ['dashboard', 'schedule', 'team-hub'],
    'team-hub':         ['chats', 'schedule', 'achievements'],
    achievements:       ['dashboard', 'schedule', 'chats'],
    'my-stuff':         ['dashboard', 'season-archives', 'org-directory'],
    'season-archives':  ['dashboard', 'my-stuff', 'org-directory'],
    'org-directory':    ['dashboard', 'my-stuff', 'season-archives'],
  }

  const PLAYER_CONTEXTUAL_NAV = {
    dashboard:          ['schedule', 'leaderboards', 'achievements'],
    schedule:           ['dashboard', 'achievements', 'leaderboards'],
    achievements:       ['schedule', 'leaderboards', 'stats'],
    stats:              ['leaderboards', 'standings', 'schedule'],
    leaderboards:       ['stats', 'standings', 'achievements'],
    standings:          ['leaderboards', 'stats', 'schedule'],
    'my-stuff':         ['dashboard', 'schedule', 'achievements'],
  }

  const TM_CONTEXTUAL_NAV = {
    dashboard:          ['schedule', 'attendance', 'payments'],
    roster:             ['schedule', 'chats', 'standings'],
    schedule:           ['dashboard', 'attendance', 'chats'],
    attendance:         ['schedule', 'standings', 'leaderboards'],
    standings:          ['leaderboards', 'achievements', 'attendance'],
    leaderboards:       ['standings', 'achievements', 'attendance'],
    achievements:       ['leaderboards', 'standings', 'schedule'],
    chats:              ['dashboard', 'schedule', 'roster'],
    blasts:             ['chats', 'schedule', 'dashboard'],
    payments:           ['schedule', 'dashboard', 'chats'],
    'season-archives':  ['dashboard', 'org-directory', 'schedule'],
    'org-directory':    ['dashboard', 'season-archives', 'chats'],
  }

  // Select the correct contextual nav map based on active role
  const getContextualNav = () => {
    switch (activeView) {
      case 'admin': return CONTEXTUAL_NAV
      case 'coach': return COACH_CONTEXTUAL_NAV
      case 'parent': return PARENT_CONTEXTUAL_NAV
      case 'player': return PLAYER_CONTEXTUAL_NAV
      case 'team_manager': return TM_CONTEXTUAL_NAV
      default: return {}
    }
  }

  const adminNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'dashboard' },

    // --- TEAMS & ROSTERS ---
    { id: 'teams-rosters', label: 'Teams & Rosters', type: 'group', icon: 'shield', items: [
      { id: 'teams', label: 'Team Management', icon: 'shield' },
      { id: 'coaches', label: 'Staff Portal', icon: 'users' },
      { id: 'jerseys', label: 'Jersey Management', icon: 'shirt', hasBadge: true },
    ]},

    // --- REGISTRATION ---
    { id: 'registration', label: 'Registration', type: 'group', icon: 'clipboard', items: [
      { id: 'registrations', label: 'Registrations', icon: 'clipboard' },
      { id: 'templates', label: 'Registration Forms', icon: 'file-text' },
      { id: 'registration-funnel', label: 'Registration Funnel', icon: 'trending-up' },
    ]},

    // --- PAYMENTS ---
    { id: 'money', label: 'Payments', type: 'group', icon: 'dollar', items: [
      { id: 'payments', label: 'Payment Admin', icon: 'dollar' },
      { id: 'paymentsetup', label: 'Payment Setup', icon: 'credit-card' },
    ]},

    // --- SCHEDULE & EVENTS ---
    { id: 'scheduling', label: 'Schedule & Events', type: 'group', icon: 'calendar', items: [
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'attendance', label: 'Attendance & RSVP', icon: 'check-square' },
      { id: 'coach-availability', label: 'Coach Availability', icon: 'calendar-check' },
    ]},

    // --- PRACTICE ---
    { id: 'practice', label: 'Practice', type: 'group', icon: 'clipboard-list', items: [
      { id: 'drills', label: 'Drill Library', icon: 'play-circle' },
      { id: 'practice-plans', label: 'Practice Plans', icon: 'list-ordered' },
      { id: 'reflection-templates', label: 'Reflections', icon: 'clipboard-list' },
    ]},

    // --- COMPETE ---
    { id: 'game', label: 'Compete', type: 'group', icon: 'gameprep', items: [
      { id: 'gameprep', label: 'Game Prep', icon: 'target' },
      { id: 'lineups', label: 'Lineups', icon: 'layout-grid' },
      { id: 'standings', label: 'Standings', icon: 'star' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
      { id: 'achievements', label: 'Achievements', icon: 'achievements' },
    ]},

    // --- COMMUNICATION ---
    { id: 'communication', label: 'Communication', type: 'group', icon: 'chats', items: [
      { id: 'chats', label: 'Chats', icon: 'message' },
      { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
      { id: 'notifications', label: 'Push Notifications', icon: 'bell' },
      { id: 'email', label: 'Email', icon: 'mail' },
    ]},

    // --- REPORTS ---
    { id: 'insights', label: 'Reports', type: 'group', icon: 'reports', items: [
      { id: 'reports', label: 'Reports & Analytics', icon: 'pie-chart' },
      { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
      { id: 'org-directory', label: 'Org Directory', icon: 'building' },
    ]},

    // --- SETTINGS ---
    { id: 'setup', label: 'Settings', type: 'group', icon: 'settings', items: [
      { id: 'seasons', label: 'Season Management', icon: 'calendar' },
      { id: 'waivers', label: 'Waivers', icon: 'file-text' },
      { id: 'venues', label: 'Venues', icon: 'map-pin' },
      { id: 'organization', label: 'Organization', icon: 'building' },
      { id: 'data-export', label: 'Data Export', icon: 'download' },
      { id: 'subscription', label: 'Subscription', icon: 'credit-card' },
    ]},
  ]

  const coachNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'dashboard' },
    { id: 'myteams', label: 'My Teams', type: 'group', icon: 'teams', items: [
      { id: 'roster', label: 'Roster Manager', icon: 'users' },
      ...(roleContext?.coachInfo?.team_coaches?.map(tc_item => ({
        id: `teamwall-${tc_item.team_id}`,
        label: tc_item.teams?.name + (tc_item.role === 'head' ? ' ⭐' : ''),
        icon: 'users',
        teamId: tc_item.team_id,
      })) || [])
    ]},
    { id: 'scheduling', label: 'Schedule & Events', type: 'group', icon: 'schedule', items: [
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'attendance', label: 'Attendance', icon: 'check-square' },
    ]},
    { id: 'practice', label: 'Practice', type: 'group', icon: 'clipboard-list', items: [
      { id: 'drills', label: 'Drill Library', icon: 'play-circle' },
      { id: 'practice-plans', label: 'Practice Plans', icon: 'list-ordered' },
      { id: 'reflection-templates', label: 'Reflections', icon: 'clipboard-list' },
    ]},
    { id: 'gameday', label: 'Compete', type: 'group', icon: 'gameprep', items: [
      { id: 'gameprep', label: 'Game Prep', icon: 'target' },
      { id: 'lineups', label: 'Lineups', icon: 'layout-grid' },
      { id: 'standings', label: 'Standings', icon: 'star' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
      { id: 'achievements', label: 'Achievements', icon: 'achievements' },
    ]},
    { id: 'communication', label: 'Communication', type: 'group', icon: 'chats', items: [
      { id: 'chats', label: 'Team Chat', icon: 'message' },
      { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
    ]},
    { id: 'mystuff', label: 'My Stuff', type: 'group', icon: 'user', items: [
      { id: 'coach-availability', label: 'My Availability', icon: 'calendar' },
      { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
      { id: 'org-directory', label: 'Org Directory', icon: 'building' },
    ]},
  ]

  const parentNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'home' },
    { id: 'myplayers', label: 'My Players', type: 'group', icon: 'users', items:
      roleContext?.children?.map(child => ({
        id: `player-profile-${child.id}`,
        label: child.first_name,
        icon: 'user',
        playerId: child.id,
        teams: child.team_players,
      })) || []
    },
    { id: 'scheduling', label: 'Schedule & Events', type: 'group', icon: 'schedule', items: [
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    ]},
    { id: 'money', label: 'Payments & Registration', type: 'group', icon: 'payments', items: [
      { id: 'payments', label: 'Payments', icon: 'dollar' },
      { id: 'parent-register', label: 'Registration', icon: 'clipboard' },
    ]},
    { id: 'social', label: 'Social', type: 'group', icon: 'chats', items: [
      { id: 'chats', label: 'Chat', icon: 'message' },
      { id: 'team-hub', label: 'Team Hub', icon: 'users' },
      { id: 'achievements', label: 'Achievements', icon: 'achievements' },
    ]},
    { id: 'mystuff', label: 'My Stuff', type: 'group', icon: 'user', items: [
      { id: 'my-stuff', label: 'My Stuff', icon: 'user' },
      { id: 'season-archives', label: 'Archives', icon: 'trophy' },
      { id: 'org-directory', label: 'Directory', icon: 'building' },
    ]},
  ]

  const playerNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'dashboard' },
    { id: 'myteams', label: 'My Team', type: 'group', icon: 'teams', items: [
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'achievements', label: 'Achievements', icon: 'achievements' },
      ...(roleContext?.playerInfo?.team_players?.map(tp => ({
        id: `teamwall-${tp.team_id}`,
        label: tp.teams?.name,
        icon: 'users',
        teamId: tp.team_id,
      })) || [])
    ]},
    { id: 'competition', label: 'Stats & Competition', type: 'group', icon: 'stats', items: [
      { id: 'stats', label: 'My Stats', icon: 'bar-chart' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'star' },
      { id: 'standings', label: 'Standings', icon: 'trophy' },
    ]},
    { id: 'mystuff', label: 'My Stuff', type: 'group', icon: 'user', items: [
      { id: 'my-stuff', label: 'Profile & Stats', icon: 'user' },
    ]},
  ]

  const teamManagerNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'dashboard' },
    { id: 'myteams', label: 'My Teams', type: 'group', icon: 'teams', items: [
      { id: 'roster', label: 'Roster Manager', icon: 'users' },
      ...(roleContext?.teamManagerInfo?.map(ts => ({
        id: `teamwall-${ts.team_id}`,
        label: ts.teams?.name || 'Team',
        icon: 'users',
        teamId: ts.team_id,
      })) || [])
    ]},
    { id: 'scheduling', label: 'Schedule & Events', type: 'group', icon: 'schedule', items: [
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'attendance', label: 'Attendance', icon: 'check-square' },
    ]},
    { id: 'gameday', label: 'Compete', type: 'group', icon: 'gameprep', items: [
      { id: 'standings', label: 'Standings', icon: 'star' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
      { id: 'achievements', label: 'Achievements', icon: 'achievements' },
    ]},
    { id: 'communication', label: 'Communication', type: 'group', icon: 'chats', items: [
      { id: 'chats', label: 'Team Chat', icon: 'message' },
      { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
    ]},
    { id: 'operations', label: 'Team Ops', type: 'group', icon: 'settings', items: [
      { id: 'payments', label: 'Payments', icon: 'dollar' },
    ]},
    { id: 'mystuff', label: 'My Stuff', type: 'group', icon: 'user', items: [
      { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
      { id: 'org-directory', label: 'Org Directory', icon: 'building' },
    ]},
  ]

  function getNavGroups() {
    switch (activeView) {
      case 'admin': return adminNavGroups
      case 'coach': return coachNavGroups
      case 'team_manager': return teamManagerNavGroups
      case 'parent': return parentNavGroups
      case 'player': return playerNavGroups
      default: return []
    }
  }

  const currentNavGroups = getNavGroups()

  // Shared navigation handler — same logic for sidebar and top nav
  function handleNavigation(itemId, item) {
    if (item?.teamId) {
      navigate(`/teams/${item.teamId}`)
      return
    }
    if (item?.playerId) {
      navigate(`/parent/player/${item.playerId}`)
      return
    }
    if (itemId === 'team-hub') {
      const firstTeamId = roleContext?.children?.[0]?.team_players?.[0]?.team_id
      if (firstTeamId) {
        navigate(`/teams/${firstTeamId}`)
        return
      }
      showToast?.('No team found. Your child may not be assigned to a team yet.', 'info')
      return
    }
    navigate(getPathForPage(itemId))
  }

  const orgName = organization?.name || 'My Club'
  const orgInitials = (organization?.name || 'MC').substring(0, 2).toUpperCase()

  const handleExitPlatformMode = () => {
    setAppMode('org')
    navigate('/dashboard')
  }

  const handleEnterPlatformMode = () => {
    setAppMode('platform')
    navigate('/platform/overview')
  }

  // ── Platform Mode ──
  if (appMode === 'platform') {
    return (
      <>
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" /></div>}>
        <PlatformShell
          profile={profile}
          orgName={orgName}
          orgInitials={orgInitials}
          platformStats={{}}
          onExitPlatformMode={handleExitPlatformMode}
          onSignOut={signOut}
        >
          <ErrorBoundary>
            <Routes>
              <Route path="/platform/overview" element={<PlatformOverview showToast={showToast} />} />
              <Route path="/platform/organizations/:orgId" element={<PlatformOrgDetail showToast={showToast} />} />
              <Route path="/platform/organizations" element={<PlatformOrganizations showToast={showToast} />} />
              <Route path="/platform/users" element={<PlatformUsersPage showToast={showToast} />} />
              <Route path="/platform/subscriptions" element={<PlatformSubscriptionsPage showToast={showToast} />} />
              <Route path="/platform/analytics" element={<PlatformAnalyticsPage showToast={showToast} />} />
              <Route path="/platform/engagement" element={<PlatformEngagement showToast={showToast} />} />
              <Route path="/platform/funnel" element={<PlatformRegistrationFunnel showToast={showToast} />} />
              <Route path="/platform/support" element={<PlatformSupport showToast={showToast} />} />
              <Route path="/platform/notifications" element={<PlatformNotifications showToast={showToast} />} />
              <Route path="/platform/email" element={<PlatformEmailCenter showToast={showToast} />} />
              <Route path="/platform/features" element={<PlatformFeatureRequests showToast={showToast} />} />
              <Route path="/platform/compliance" element={<PlatformCompliance showToast={showToast} />} />
              <Route path="/platform/audit" element={<PlatformAuditLog showToast={showToast} />} />
              <Route path="/platform/content" element={<PlatformContentManager showToast={showToast} />} />
              <Route path="/platform/system" element={<PlatformSystemHealth showToast={showToast} />} />
              <Route path="/platform/database" element={<PlatformDatabaseTools showToast={showToast} />} />
              <Route path="/platform/team" element={<PlatformTeam showToast={showToast} />} />
              <Route path="/platform/integrations" element={<PlatformIntegrations showToast={showToast} />} />
              <Route path="/platform/profile" element={<PlatformMyProfile showToast={showToast} />} />
              <Route path="/platform/settings" element={<PlatformSettings showToast={showToast} />} />
              <Route path="/platform" element={<Navigate to="/platform/overview" replace />} />
              <Route path="*" element={<Navigate to="/platform/overview" replace />} />
            </Routes>
          </ErrorBoundary>
        </PlatformShell>
        </Suspense>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <CommandPalette isOpen={cmdPalette.isOpen} onClose={cmdPalette.close} />
      </>
    )
  }

  // ── Org Mode (default) ──
  return (
    <OrgBrandingProvider>
    <SportProvider>
    <SeasonProvider>
    <ParentTutorialProvider activeView={activeView}>
      <div className={`flex min-h-screen transition-colors duration-500 ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
        {/* Background layer — org branding or default gradient */}
        <OrgBackgroundLayer isDark={isDark} />
        <JourneyCelebrations />

        {/* Parent Tutorial Spotlight Overlay */}
        {activeView === 'parent' && <SpotlightOverlay />}

        {/* Sidebar — full nav + utilities */}
        <LynxSidebar
          navGroups={currentNavGroups}
          activePage={page}
          directTeamWallId={directTeamWallId}
          onNavigate={handleNavigation}
          orgName={orgName}
          profile={profile}
          activeView={activeView}
          availableViews={getAvailableViews()}
          onSwitchRole={(viewId) => { setActiveView(viewId); localStorage.setItem('lynx_active_view', viewId); navigate('/dashboard'); }}
          onToggleTheme={toggleTheme}
          onSignOut={signOut}
          onNavigateToProfile={() => navigate('/profile')}
          isDark={isDark}
          notificationCount={0}
          onOpenNotifications={() => navigate('/notifications')}
          isPlatformAdmin={isPlatformAdmin}
          onEnterPlatformMode={handleEnterPlatformMode}
          onSettingsClick={() => navigate(activeView === 'admin' ? getPathForPage('organization') : '/profile')}
        />

        {/* Main Content — offset by sidebar width (64px), capped at 2400px on ultrawide */}
        <div className="flex-1 min-h-screen relative z-10 min-w-[480px] overflow-x-hidden" style={{ paddingLeft: 'var(--v2-sidebar-width)' }}>
          <div className={`w-full h-full 3xl:max-w-[2400px] 3xl:mx-auto ${
            mainLocation.pathname === '/dashboard' || mainLocation.pathname.startsWith('/teams/')
              ? 'overflow-hidden'
              : 'overflow-auto animate-slide-up'
          }`}>
            <TopBar
              roleLabel={`Lynx ${activeView === 'team_manager' ? 'Team Manager' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}`}
              navLinks={[
                { label: PAGE_LABELS[page] || page, pageId: page, isActive: true, onClick: () => {} },
                ...(getContextualNav()[page] || []).map(linkId => ({
                  label: PAGE_LABELS[linkId] || linkId,
                  pageId: linkId,
                  isActive: false,
                  onClick: () => navigate(getPathForPage(linkId)),
                })),
              ]}
              searchPlaceholder="Search..."
              onSearchClick={() => document.dispatchEvent(new CustomEvent('command-palette-open'))}
              hasNotifications={false}
              onNotificationClick={() => navigate(getPathForPage('notifications'))}
              avatarInitials={`${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`}
              onAvatarClick={() => navigate('/profile')}
              onSettingsClick={() => navigate(activeView === 'admin' ? getPathForPage('organization') : '/profile')}
              onThemeToggle={toggleTheme}
              isDark={isDark}
              availableRoles={getAvailableViews().map(v => ({ id: v.id, label: `Lynx ${v.label}`, subtitle: v.description }))}
              activeRoleId={activeView}
              onRoleSwitch={(viewId) => { setActiveView(viewId); localStorage.setItem('lynx_active_view', viewId); navigate('/dashboard') }}
              orgName={organization?.name}
            />
            <ErrorBoundary>
              <RoutedContent
                activeView={activeView}
                roleContext={roleContext}
                showToast={showToast}
                selectedPlayerForView={selectedPlayerForView}
                setSelectedPlayerForView={setSelectedPlayerForView}
                getAvailableViews={getAvailableViews}
                setActiveView={setActiveView}
                onRefreshRoles={loadRoleContext}
              />
            </ErrorBoundary>
          </div>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <CommandPalette isOpen={cmdPalette.isOpen} onClose={cmdPalette.close} />
        <BlastAlertChecker />

        {/* Floating buttons */}
        {activeView === 'parent' && <FloatingHelpButton />}
        <SetupHelper onNavigate={(pageId) => navigate(getPathForPage(pageId))} />
        <FloatingChatButton onNavigate={(pageId) => navigate(getPathForPage(pageId))} />
      </div>
    </ParentTutorialProvider>
    </SeasonProvider>
    </SportProvider>
    </OrgBrandingProvider>
  )
}

export { MainApp }
