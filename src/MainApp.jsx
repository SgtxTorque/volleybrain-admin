import { useState, useEffect, useRef } from 'react'
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
  Award, CreditCard, UserPlus, X
} from './constants/icons'
import { VolleyballIcon } from './constants/icons'

// UI Components
import { ToastContainer, useToast, Icon, ErrorBoundary, Breadcrumb, CommandPalette, useCommandPalette } from './components/ui'

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

// Parent Onboarding Components
import { SpotlightOverlay, ParentChecklistWidget, FloatingHelpButton } from './components/parent/ParentOnboarding'

// Dashboard Pages
import { DashboardPage } from './pages/dashboard'

// Role-specific Dashboards
import { ParentDashboard, CoachDashboard, PlayerDashboard } from './pages/roles'

// Parent Portal Pages
import { PlayerProfilePage, ParentPlayerCardPage, ParentMessagesPage, InviteFriendsPage, ParentPaymentsPage, MyStuffPage } from './pages/parent'

// Public Pages
import { TeamWallPage, OrgDirectoryPage } from './pages/public'

// Core Admin Pages
import { RegistrationsPage } from './pages/registrations'
import { PaymentsPage } from './pages/payments'
import { TeamsPage } from './pages/teams'
import { CoachesPage } from './pages/coaches'
import { JerseysPage } from './pages/jerseys'
import { SchedulePage, CoachAvailabilityPage } from './pages/schedule'
import { AttendancePage } from './pages/attendance'
import { ChatsPage } from './pages/chats'
import { BlastsPage } from './pages/blasts'
import { GamePrepPage } from './pages/gameprep'
import { TeamStandingsPage } from './pages/standings'
import { SeasonLeaderboardsPage } from './pages/leaderboards'
import { ReportsPage, RegistrationFunnelPage } from './pages/reports'

// Settings Pages
import { SeasonsPage, WaiversPage, PaymentSetupPage, OrganizationPage, RegistrationTemplatesPage, DataExportPage, SubscriptionPage } from './pages/settings'

// Achievements Pages
import { AchievementsCatalogPage } from './pages/achievements'
import { NotificationsPage } from './pages/notifications/NotificationsPage'

// Platform Admin
import { PlatformAdminPage } from './pages/platform/PlatformAdminPage'
import { PlatformAnalyticsPage } from './pages/platform/PlatformAnalyticsPage'
import { PlatformSubscriptionsPage } from './pages/platform/PlatformSubscriptionsPage'

// Profile
import { MyProfilePage } from './pages/profile/MyProfilePage'

// Archives
import { SeasonArchivePage } from './pages/archives'

// ============================================
// NAV DROPDOWN COMPONENT
// ============================================
function NavDropdown({ label, items, currentPage, onNavigate, isActive, directTeamWallId }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const tc = useThemeClasses()
  const { isDark } = useTheme()

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
        className={`flex items-center gap-1 px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
          isActive
            ? 'bg-white/15 text-white'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-3 w-56 rounded-2xl overflow-hidden z-50 animate-slide-down ${
          isDark
            ? 'bg-slate-800/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_40px_rgba(0,0,0,0.1)]'
        }`}>
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id, item)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-150 ${
                (item.teamId && directTeamWallId === item.teamId) || currentPage === item.id
                  ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold' 
                  : `${tc.text} ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'}`
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
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full transition hover:bg-white/10">
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-full mt-3 w-96 rounded-2xl overflow-hidden z-50 animate-slide-down ${
          isDark 
            ? 'bg-slate-800 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]' 
            : 'bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
        }`}>
          <div className={`p-3 border-b ${tc.border} flex items-center justify-between`}>
            <span className={`font-semibold ${tc.text}`}>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[var(--accent-primary)] hover:underline">Mark all read</button>
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
                  className={`p-3 border-b ${tc.border} ${tc.hoverBg} cursor-pointer transition ${!notif.is_read ? (isDark ? 'bg-slate-800/60' : 'bg-blue-50/50') : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl mt-0.5">{getNotifIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />}
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
              <button className={`w-full text-center text-sm ${tc.textSecondary} hover:text-[var(--accent-primary)]`}>
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
      <button className="flex items-center gap-2 px-2 py-1.5 rounded-full transition hover:bg-white/10"
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
        <span className="text-sm font-medium hidden sm:block text-white">{getDisplayName()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform text-white/70 ${showRoleSwitcher ? 'rotate-180' : ''}`} />
      </button>

      {showRoleSwitcher && (
        <div className={`absolute right-0 top-full mt-3 w-72 rounded-2xl overflow-hidden z-50 animate-slide-down ${
          isDark 
            ? 'bg-slate-800 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]' 
            : 'bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
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
              <p className={`font-semibold ${tc.text}`}>{profile?.full_name || 'User'}</p>
              <p className={`text-sm ${tc.textMuted} flex items-center gap-1`}>
                {activeView === 'admin' && <Shield className="w-3 h-3" />}
                {activeView === 'coach' && <UserCog className="w-3 h-3" />}
                {activeView === 'parent' && <Users className="w-3 h-3" />}
                {activeView === 'player' && <VolleyballIcon className="w-3 h-3" />}
                {getRoleLabel()}
              </p>
            </div>
          </div>

          <div className={`p-2 border-b ${tc.border}`}>
            <button
              onClick={() => { setShowRoleSwitcher(false); navigate('/profile'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${tc.hoverBg}`}
            >
              <User className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${tc.text}`}>My Profile</p>
                <p className={`text-xs ${tc.textMuted} truncate`}>Edit your personal info</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${tc.textMuted}`} />
            </button>
          </div>

          <div className={`p-2 border-b ${tc.border}`}>
            <p className={`text-xs ${tc.textMuted} px-2 py-1`}>Switch View</p>
            {getAvailableViews().map(view => (
              <button key={view.id}
                onClick={() => { setActiveView(view.id); setShowRoleSwitcher(false); navigate('/dashboard'); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                  activeView === view.id ? 'bg-[var(--accent-primary)]/20' : tc.hoverBg
                }`}>
                <NavIcon name={view.icon} className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${activeView === view.id ? 'text-[var(--accent-primary)]' : tc.text}`}>{view.label}</p>
                  <p className={`text-xs ${tc.textMuted} truncate`}>{view.description}</p>
                </div>
                {activeView === view.id && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
              </button>
            ))}
          </div>

          <div className={`p-3 border-b ${tc.border}`}>
            <p className={`text-xs ${tc.textMuted} mb-2`}>Accent Color</p>
            <div className="flex gap-2">
              {Object.entries(accentColors).map(([key, value]) => (
                <button key={key} onClick={() => changeAccent(key)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${accentColor === key ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                  style={{ background: value.primary }} title={key.charAt(0).toUpperCase() + key.slice(1)} />
              ))}
            </div>
          </div>

          <div className={`p-2 flex gap-2`}>
            <button onClick={toggleTheme}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg ${tc.hoverBg} ${tc.textSecondary} text-sm`}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button onClick={signOut}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 text-sm`}>
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
// HORIZONTAL NAV BAR COMPONENT
// ============================================
function HorizontalNavBar({
  activeView, profile, showRoleSwitcher, setShowRoleSwitcher,
  getAvailableViews, setActiveView, signOut,
  tc, accent, accentColor, changeAccent, accentColors, isDark, toggleTheme,
  roleContext, organization, isPlatformAdmin
}) {
  const navigate = useNavigate()
  const page = useCurrentPageId()
  const location = useLocation()
  const directTeamWallId = location.pathname.match(/^\/teams\/([^/]+)$/)?.[1] || null
  // Admin navigation with dropdowns
  const adminNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single' },
    { id: 'people', label: 'People', type: 'dropdown', items: [
      { id: 'teams', label: 'Teams & Rosters', icon: 'users' },
      { id: 'coaches', label: 'Coaches', icon: 'user-cog' },
    ]},
    { id: 'operations', label: 'Operations', type: 'dropdown', items: [
      { id: 'registrations', label: 'Registrations', icon: 'clipboard' },
      { id: 'jerseys', label: 'Jerseys', icon: 'shirt', hasBadge: true },
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'attendance', label: 'Attendance & RSVP', icon: 'check-square' },
      { id: 'payments', label: 'Payments', icon: 'dollar' },
      { id: 'coach-availability', label: 'Coach Availability', icon: 'calendar-check' },
    ]},
    { id: 'game', label: 'Game Day', type: 'dropdown', items: [
      { id: 'gameprep', label: 'Game Prep', icon: 'target' },
      { id: 'standings', label: 'Standings', icon: 'star' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
    ]},
    { id: 'communication', label: 'Communication', type: 'dropdown', items: [
      { id: 'chats', label: 'Chats', icon: 'message' },
      { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
      { id: 'notifications', label: 'Push Notifications', icon: 'bell' },
    ]},
    { id: 'insights', label: 'Insights', type: 'dropdown', items: [
      { id: 'reports', label: 'Reports & Analytics', icon: 'pie-chart' },
      { id: 'registration-funnel', label: 'Registration Funnel', icon: 'trending-up' },
      { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
      { id: 'org-directory', label: 'Org Directory', icon: 'building' },
    ]},
    { id: 'setup', label: 'Setup', type: 'dropdown', items: [
  { id: 'seasons', label: 'Seasons', icon: 'calendar' },
  { id: 'templates', label: 'Registration Forms', icon: 'clipboard' },
  { id: 'waivers', label: 'Waivers', icon: 'file-text' },
  { id: 'paymentsetup', label: 'Payment Setup', icon: 'credit-card' },
  { id: 'organization', label: 'Organization', icon: 'building' },
  { id: 'data-export', label: 'Data Export', icon: 'download' },
  { id: 'subscription', label: 'Subscription', icon: 'credit-card' },
]},
  ]

  // Coach navigation
  const coachNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single' },
    { id: 'myteams', label: 'My Teams', type: 'dropdown', items: 
      roleContext?.coachInfo?.team_coaches?.map(tc_item => ({
        id: `teamwall-${tc_item.team_id}`,
        label: tc_item.teams?.name + (tc_item.role === 'head' ? ' ⭐' : ''),
        icon: 'users',
        teamId: tc_item.team_id,
      })) || []
    },
    { id: 'schedule', label: 'Schedule', type: 'single' },
    { id: 'coach-availability', label: 'My Availability', type: 'single' },
    { id: 'gameday', label: 'Game Day', type: 'dropdown', items: [
      { id: 'gameprep', label: 'Game Prep', icon: 'target' },
      { id: 'standings', label: 'Standings', icon: 'star' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
    ]},
    { id: 'attendance', label: 'Attendance', type: 'single' },
    { id: 'communication', label: 'Communication', type: 'dropdown', items: [
      { id: 'chats', label: 'Team Chats', icon: 'message' },
      { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
    ]},
    { id: 'insights', label: 'Insights', type: 'dropdown', items: [
      { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
      { id: 'org-directory', label: 'Org Directory', icon: 'building' },
    ]},
  ]

  // Parent navigation
  const parentNavGroups = [
    { id: 'dashboard', label: 'Home', type: 'single' },
    { id: 'myplayers', label: 'My Players', type: 'dropdown', items: 
      roleContext?.children?.map(child => ({
        id: `player-${child.id}`,
        label: child.first_name,
        icon: 'user',
        playerId: child.id,
        teams: child.team_players,
      })) || []
    },
    { id: 'schedule', label: 'Schedule', type: 'single' },
    { id: 'standings', label: 'Standings', type: 'single' },
    { id: 'leaderboards', label: 'Leaderboards', type: 'single' },
    { id: 'achievements', label: 'Achievements', type: 'single' },
    { id: 'chats', label: 'Chats', type: 'single' },
    { id: 'payments', label: 'Payments', type: 'single' },
    { id: 'season-archives', label: 'Archives', type: 'single' },
    { id: 'org-directory', label: 'Directory', type: 'single' },
    { id: 'my-stuff', label: 'My Stuff', type: 'single' },
  ]

  // Player navigation
  const playerNavGroups = [
    { id: 'dashboard', label: 'Home', type: 'single' },
    { id: 'myteams', label: 'My Teams', type: 'dropdown', items:
      roleContext?.playerInfo?.team_players?.map(tp => ({
        id: `teamwall-${tp.team_id}`,
        label: tp.teams?.name,
        icon: 'users',
        teamId: tp.team_id,
      })) || []
    },
    { id: 'schedule', label: 'Schedule', type: 'single' },
    { id: 'standings', label: 'Standings', type: 'single' },
    { id: 'leaderboards', label: 'Leaderboards', type: 'single' },
    { id: 'achievements', label: 'Achievements', type: 'single' },
  ]

  const getNavItems = () => {
    switch(activeView) {
      case 'admin': return adminNavGroups
      case 'coach': return coachNavGroups
      case 'parent': return parentNavGroups
      case 'player': return playerNavGroups
      default: return []
    }
  }

  const navItems = getNavItems()

  const isGroupActive = (group) => {
    if (group.type === 'single') return page === group.id && !directTeamWallId
    if (group.items) {
      return group.items.some(item => {
        if (item.teamId) return directTeamWallId === item.teamId
        if (item.playerId) return page === `player-${item.playerId}`
        return item.id === page
      })
    }
    return false
  }

  const handleNavigate = (itemId, item) => {
    if (item?.teamId) {
      navigate(`/teams/${item.teamId}`)
      return
    }
    if (item?.playerId) {
      navigate(`/parent/player/${item.playerId}`)
      return
    }
    navigate(getPathForPage(itemId))
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-50 w-full bg-[#2c3e50] shadow-md">
      
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          <VolleyballIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-widest text-white">VOLLEYBRAIN</span>
      </div>

      {/* CENTER: Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map(item => {
          if (item.type === 'single') {
            const isActive = page === item.id && !directTeamWallId
            return (
              <button key={item.id} onClick={() => handleNavigate(item.id)}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}>
                {item.label}
              </button>
            )
          } else if (item.items && item.items.length > 0) {
            return (
              <NavDropdown key={item.id} label={item.label} items={item.items} currentPage={page}
                onNavigate={(id, navItem) => handleNavigate(id, navItem)}
                isActive={isGroupActive(item)} directTeamWallId={directTeamWallId} />
            )
          }
          return null
        })}
      </nav>

      {/* RIGHT: Platform Admin + Notifications + Profile */}
      <div className="flex items-center gap-3">
        {isPlatformAdmin && (
          <>
            <button
              onClick={() => navigate('/platform/analytics')}
              title="Platform Analytics"
              className={`relative p-2 rounded-full transition ${
                page === 'platform-analytics'
                  ? 'bg-white/15 text-white'
                  : 'hover:bg-white/10 text-white/70'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/platform/subscriptions')}
              title="Platform Subscriptions"
              className={`relative p-2 rounded-full transition ${
                page === 'platform-subscriptions'
                  ? 'bg-white/15 text-white'
                  : 'hover:bg-white/10 text-white/70'
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/platform/admin')}
              title="Platform Admin"
              className={`relative p-2 rounded-full transition ${
                page === 'platform-admin'
                  ? 'bg-white/15 text-white'
                  : 'hover:bg-white/10 text-white/70'
              }`}
            >
              <Shield className="w-5 h-5" />
            </button>
          </>
        )}
        <NotificationDropdown tc={tc} organization={organization} isDark={isDark} />
        <UserProfileDropdown
          profile={profile} activeView={activeView} showRoleSwitcher={showRoleSwitcher}
          setShowRoleSwitcher={setShowRoleSwitcher} getAvailableViews={getAvailableViews}
          setActiveView={setActiveView} signOut={signOut} tc={tc}
          accent={accent} accentColor={accentColor} changeAccent={changeAccent}
          accentColors={accentColors} isDark={isDark} toggleTheme={toggleTheme} />
      </div>
    </header>
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

  // Default gradient if no org background set
  if (!background) {
    return (
      <div className={`fixed inset-0 pointer-events-none ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800'
          : 'bg-gradient-to-br from-[#E8EAF0] via-[#F0F1F5] to-[#F5F0EB]'
      }`} />
    )
  }

  const opacity = background.opacity || 0.08

  if (background.type === 'solid') {
    const color = BACKGROUND_SOLIDS[background.value] || background.value || '#0F172A'
    return <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: color }} />
  }

  if (background.type === 'gradient') {
    const grad = BACKGROUND_GRADIENTS[background.value]
    if (!grad) return <div className="fixed inset-0 pointer-events-none bg-slate-900" />
    return <div className="fixed inset-0 pointer-events-none" style={{ background: grad }} />
  }

  if (background.type === 'pattern') {
    const pattern = BACKGROUND_PATTERNS[background.value]
    if (!pattern) return <div className="fixed inset-0 pointer-events-none bg-slate-900" />
    return (
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0" style={{ backgroundImage: pattern, backgroundRepeat: 'repeat', opacity }} />
      </div>
    )
  }

  if (background.type === 'custom' && background.value) {
    return (
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute inset-0 ${isDark ? 'bg-slate-900' : 'bg-[#F0F1F5]'}`} />
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
        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800'
        : 'bg-gradient-to-br from-[#E8EAF0] via-[#F0F1F5] to-[#F5F0EB]'
    }`} />
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
      onNavigate={(pageId) => navigate(getPathForPage(pageId))}
      activeView={activeView}
    />
  )
}

// ============================================
// PARENT PLAYER ROUTE WRAPPERS
// ============================================
function ParentPlayerCardRoute({ roleContext, showToast }) {
  const { playerId } = useParams()
  return <ParentPlayerCardPage playerId={playerId} roleContext={roleContext} showToast={showToast} />
}

function PlayerProfileRoute({ roleContext, showToast }) {
  const { playerId } = useParams()
  const navigate = useNavigate()
  return <PlayerProfilePage playerId={playerId} roleContext={roleContext} showToast={showToast} onNavigate={(pageId) => navigate(getPathForPage(pageId))} />
}

// ============================================
// ROUTED CONTENT — renders the correct page based on URL
// ============================================
function RoutedContent({ activeView, roleContext, showToast, selectedPlayerForView, setSelectedPlayerForView }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navigateToTeamWall = (teamId) => navigate(`/teams/${teamId}`)

  return (
    <div key={location.pathname} className="animate-page-in">
    <Routes>
      {/* Dashboard — role-dependent */}
      <Route path="/dashboard" element={
        activeView === 'admin' ? <DashboardPage onNavigate={(pageId) => navigate(getPathForPage(pageId))} /> :
        activeView === 'coach' ? <CoachDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={(pageId) => navigate(getPathForPage(pageId))} /> :
        activeView === 'parent' ? <ParentDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={(pageId) => navigate(getPathForPage(pageId))} /> :
        activeView === 'player' ? <PlayerDashboard roleContext={{...roleContext, role: roleContext?.isAdmin ? 'admin' : roleContext?.isCoach ? 'head_coach' : 'player'}} navigateToTeamWall={navigateToTeamWall} onNavigate={(pageId) => navigate(getPathForPage(pageId))} showToast={showToast} onPlayerChange={setSelectedPlayerForView} /> :
        <DashboardPage onNavigate={(pageId) => navigate(getPathForPage(pageId))} />
      } />

      {/* Team Wall — /teams/:teamId */}
      <Route path="/teams/:teamId" element={<TeamWallRoute showToast={showToast} activeView={activeView} />} />

      {/* Parent-specific routes */}
      <Route path="/parent/player/:playerId/profile" element={<PlayerProfileRoute roleContext={roleContext} showToast={showToast} />} />
      <Route path="/parent/player/:playerId" element={<ParentPlayerCardRoute roleContext={roleContext} showToast={showToast} />} />
      <Route path="/messages" element={<ParentMessagesPage roleContext={roleContext} showToast={showToast} />} />
      <Route path="/invite" element={<InviteFriendsPage roleContext={roleContext} showToast={showToast} />} />
      <Route path="/my-stuff" element={<MyStuffPage roleContext={roleContext} showToast={showToast} />} />

      {/* Core pages */}
      <Route path="/teams" element={<TeamsPage showToast={showToast} navigateToTeamWall={navigateToTeamWall} onNavigate={(pageId) => navigate(getPathForPage(pageId))} />} />
      <Route path="/coaches" element={<CoachesPage showToast={showToast} />} />
      <Route path="/registrations" element={<RegistrationsPage showToast={showToast} />} />
      <Route path="/jerseys" element={<JerseysPage showToast={showToast} />} />
      <Route path="/schedule" element={<SchedulePage showToast={showToast} activeView={activeView} roleContext={roleContext} />} />
      <Route path="/schedule/availability" element={<CoachAvailabilityPage showToast={showToast} activeView={activeView} roleContext={roleContext} onNavigate={(pageId) => navigate(getPathForPage(pageId))} />} />
      <Route path="/attendance" element={<AttendancePage showToast={showToast} />} />
      <Route path="/payments" element={
        activeView === 'parent'
          ? <ParentPaymentsPage roleContext={roleContext} showToast={showToast} />
          : <PaymentsPage showToast={showToast} />
      } />
      <Route path="/gameprep" element={<GamePrepPage showToast={showToast} />} />
      <Route path="/standings" element={<TeamStandingsPage showToast={showToast} />} />
      <Route path="/leaderboards" element={<SeasonLeaderboardsPage showToast={showToast} />} />
      <Route path="/chats" element={<ChatsPage showToast={showToast} activeView={activeView} roleContext={roleContext} />} />
      <Route path="/blasts" element={<BlastsPage showToast={showToast} activeView={activeView} roleContext={roleContext} />} />
      <Route path="/notifications" element={<NotificationsPage showToast={showToast} />} />
      <Route path="/reports" element={<ReportsPage showToast={showToast} />} />
      <Route path="/reports/funnel" element={<RegistrationFunnelPage showToast={showToast} />} />
      <Route path="/archives" element={<SeasonArchivePage showToast={showToast} />} />
      <Route path="/directory" element={<OrgDirectoryPage isEmbedded />} />
      <Route path="/achievements" element={
        <AchievementsCatalogPage
          playerId={activeView === 'player' ? selectedPlayerForView?.id : roleContext?.children?.[0]?.id}
          showToast={showToast}
          playerName={activeView === 'player' ? (selectedPlayerForView ? `${selectedPlayerForView.first_name}'s` : 'My') : `${roleContext?.children?.[0]?.first_name}'s`}
          isAdminPreview={activeView === 'player' && roleContext?.isAdmin}
        />
      } />

      {/* Settings */}
      <Route path="/settings/seasons" element={<SeasonsPage showToast={showToast} />} />
      <Route path="/settings/templates" element={<RegistrationTemplatesPage showToast={showToast} />} />
      <Route path="/settings/waivers" element={<WaiversPage showToast={showToast} />} />
      <Route path="/settings/payment-setup" element={<PaymentSetupPage showToast={showToast} />} />
      <Route path="/settings/organization" element={<OrganizationPage showToast={showToast} />} />
      <Route path="/settings/data-export" element={<DataExportPage showToast={showToast} />} />
      <Route path="/settings/subscription" element={<SubscriptionPage showToast={showToast} />} />

      {/* Profile */}
      <Route path="/profile" element={<MyProfilePage showToast={showToast} />} />

      {/* Platform Admin */}
      <Route path="/platform/admin" element={<PlatformAdminPage showToast={showToast} />} />
      <Route path="/platform/analytics" element={<PlatformAnalyticsPage showToast={showToast} />} />
      <Route path="/platform/subscriptions" element={<PlatformSubscriptionsPage showToast={showToast} />} />

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

      const { data: children } = await supabase
        .from('players').select('*, team_players(team_id, jersey_number, teams(id, name, color, season_id)), season:seasons(id, name, sports(name, icon), organizations(id, name, slug, settings))')
        .eq('parent_account_id', profile.id)

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
    if ((roleContext?.isAdmin || roleContext?.isCoach) && !roleContext?.isPlayer) {
      views.push({ id: 'player', label: 'Player', icon: 'volleyball', description: 'Preview player view' })
    }
    return views
  }

  return (
    <OrgBrandingProvider>
    <SportProvider>
    <SeasonProvider>
    <ParentTutorialProvider>
      <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        {/* Background layer — org branding or default gradient */}
        <OrgBackgroundLayer isDark={isDark} />
        <JourneyCelebrations />

        {/* Parent Tutorial Spotlight Overlay */}
        {activeView === 'parent' && <SpotlightOverlay />}

        {/* Horizontal Nav Bar */}
        <HorizontalNavBar
          activeView={activeView} profile={profile}
          showRoleSwitcher={showRoleSwitcher} setShowRoleSwitcher={setShowRoleSwitcher}
          getAvailableViews={getAvailableViews} setActiveView={setActiveView} signOut={signOut}
          tc={tc} accent={accent}
          accentColor={accentColor} changeAccent={changeAccent} accentColors={accentColors}
          isDark={isDark} toggleTheme={toggleTheme} roleContext={roleContext}
          organization={organization}
          isPlatformAdmin={isPlatformAdmin}
        />

        {/* Main Content Area — React Router */}
        <div className={`flex-1 relative z-10 ${
          (activeView === 'admin' && mainLocation.pathname === '/dashboard') || mainLocation.pathname.startsWith('/teams/')
            ? 'overflow-hidden'
            : 'px-4 sm:px-6 lg:px-8 py-6 overflow-auto max-w-[1440px] mx-auto w-full animate-slide-up'
        }`}>
          <Breadcrumb />
          <ErrorBoundary>
            <RoutedContent
              activeView={activeView}
              roleContext={roleContext}
              showToast={showToast}
              selectedPlayerForView={selectedPlayerForView}
              setSelectedPlayerForView={setSelectedPlayerForView}
            />
          </ErrorBoundary>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <CommandPalette isOpen={cmdPalette.isOpen} onClose={cmdPalette.close} />
        <BlastAlertChecker />

        {/* Parent Floating Help Button */}
        {activeView === 'parent' && <FloatingHelpButton />}
      </div>
    </ParentTutorialProvider>
    </SeasonProvider>
    </SportProvider>
    </OrgBrandingProvider>
  )
}

export { MainApp }
