import { useState, useEffect, useRef } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useTheme, useThemeClasses } from './contexts/ThemeContext'
import { SportProvider, useSport } from './contexts/SportContext'
import { SeasonProvider, useSeason } from './contexts/SeasonContext'
import { supabase } from './lib/supabase'

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
import { PlayerProfilePage, ParentPlayerCardPage, ParentMessagesPage, InviteFriendsPage, ParentPaymentsPage } from './pages/parent'

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
import { SeasonsPage, WaiversPage, PaymentSetupPage, OrganizationPage, RegistrationTemplatesPage } from './pages/settings'

// Achievements Pages
import { AchievementsCatalogPage } from './pages/achievements'

// ============================================
// NAV DROPDOWN COMPONENT
// ============================================
function NavDropdown({ label, items, currentPage, onNavigate, isActive, directTeamWallId }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const tc = useThemeClasses()

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
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all"
        style={{
          background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
        }}
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl border shadow-xl overflow-hidden z-50 ${tc.cardBg} ${tc.border}`}>
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id, item)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition ${
                (item.teamId && directTeamWallId === item.teamId) || currentPage === item.id
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' 
                  : `${tc.text} ${tc.hoverBg}`
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
function NotificationDropdown({ tc, organization }) {
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
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-lg hover:bg-white/10 transition">
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-96 rounded-xl border shadow-xl overflow-hidden z-50 ${tc.cardBg} ${tc.border}`}>
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
                  className={`p-3 border-b ${tc.border} ${tc.hoverBg} cursor-pointer transition ${!notif.is_read ? (tc.isDark ? 'bg-slate-800/60' : 'bg-blue-50/50') : ''}`}
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
  setActiveView, setPage, signOut, tc, accent, accentColor, changeAccent, 
  accentColors, isDark, toggleTheme
}) {
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
      <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition hover:bg-white/10"
        onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-white/20"
          style={{ background: profile?.photo_url ? 'transparent' : accent.primary, color: '#000' }}>
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile?.full_name?.charAt(0) || '?'
          )}
        </div>
        <span className="text-white text-sm font-medium hidden sm:block">{getDisplayName()}</span>
        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} />
      </button>

      {showRoleSwitcher && (
        <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-xl overflow-hidden z-50 ${tc.cardBg} ${tc.border}`}>
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
            <p className={`text-xs ${tc.textMuted} px-2 py-1`}>Switch View</p>
            {getAvailableViews().map(view => (
              <button key={view.id}
                onClick={() => { setActiveView(view.id); setShowRoleSwitcher(false); setPage('dashboard'); }}
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
// REGISTRATION SELECTOR MODAL - For Parents
// ============================================
function RegistrationSelectorModal({ isOpen, onClose, roleContext, organization, tc }) {
  const [openSeasons, setOpenSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  
  const children = roleContext?.children || []

  useEffect(() => {
    if (isOpen) {
      loadOpenSeasons()
    }
  }, [isOpen])

  async function loadOpenSeasons() {
    setLoading(true)
    try {
      const now = new Date().toISOString()
      
      // Get all open seasons for orgs the parent is connected to
      const orgIds = [...new Set(children.map(c => c.organization_id).filter(Boolean))]
      if (organization?.id && !orgIds.includes(organization.id)) {
        orgIds.push(organization.id)
      }
      
      let query = supabase
        .from('seasons')
        .select('*, sports(id, name, icon), organizations(id, name, slug, settings)')
        .lte('registration_opens', now)
        .or(`registration_closes.is.null,registration_closes.gte.${now}`)
        .in('status', ['upcoming', 'active'])
      
      if (orgIds.length > 0) {
        query = query.in('organization_id', orgIds)
      }
      
      const { data } = await query.order('registration_opens', { ascending: false })
      setOpenSeasons(data || [])
    } catch (err) {
      console.error('Error loading seasons:', err)
    }
    setLoading(false)
  }

  function getRegistrationUrl(season, child = null) {
    const orgSlug = season.organizations?.slug || organization?.slug || 'register'
    const baseUrl = season.organizations?.settings?.registration_url || window.location.origin
    
    // Build prefill params if we have a child template
    const templateChild = child || children[0]
    if (templateChild) {
      const prefillParams = new URLSearchParams({
        prefill: 'true',
        parent_name: templateChild.parent_name || '',
        parent_email: templateChild.parent_email || '',
        parent_phone: templateChild.parent_phone || '',
      })
      
      // If registering for specific child, include their info
      if (child) {
        prefillParams.append('first_name', child.first_name || '')
        prefillParams.append('last_name', child.last_name || '')
        prefillParams.append('birth_date', child.birth_date || child.dob || '')
      }
      
      const cleanParams = new URLSearchParams()
      prefillParams.forEach((value, key) => {
        if (value) cleanParams.append(key, value)
      })
      
      return `${baseUrl}/register/${orgSlug}/${season.id}?${cleanParams.toString()}`
    }
    
    return `${baseUrl}/register/${orgSlug}/${season.id}`
  }

  // Check if child is already registered for this season
  function isChildRegistered(child, season) {
    return child.season_id === season.id
  }

  // Group seasons by sport
  const seasonsBySport = openSeasons.reduce((acc, season) => {
    const sportName = season.sports?.name || 'Other'
    const sportIcon = season.sports?.icon || '🏆'
    const key = `${sportIcon} ${sportName}`
    if (!acc[key]) acc[key] = []
    acc[key].push(season)
    return acc
  }, {})

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg shadow-2xl`}>
        {/* Header */}
        <div className={`p-5 border-b ${tc.border}`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>Register for a Season</h2>
          <p className={`${tc.textMuted} text-sm mt-1`}>Select a season to register your child</p>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className={`${tc.textMuted} mt-2`}>Loading seasons...</p>
            </div>
          ) : Object.keys(seasonsBySport).length === 0 ? (
            <div className={`text-center py-8 ${tc.cardBgAlt} rounded-xl`}>
              <p className="text-4xl mb-2">📅</p>
              <p className={`font-medium ${tc.text}`}>No Open Registrations</p>
              <p className={`text-sm ${tc.textMuted} mt-1`}>Check back later for new seasons!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(seasonsBySport).map(([sportLabel, seasons]) => (
                <div key={sportLabel}>
                  <h3 className={`text-sm font-semibold ${tc.textMuted} uppercase tracking-wide mb-3`}>
                    {sportLabel}
                  </h3>
                  <div className="space-y-3">
                    {seasons.map(season => (
                      <div key={season.id} className={`${tc.cardBgAlt} rounded-xl p-4`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className={`font-semibold ${tc.text}`}>{season.name}</h4>
                            <p className={`text-sm ${tc.textMuted}`}>
                              {season.organizations?.name}
                              {season.start_date && ` • Starts ${new Date(season.start_date).toLocaleDateString()}`}
                            </p>
                          </div>
                          {season.early_bird_deadline && new Date(season.early_bird_deadline) > new Date() && (
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-full font-medium">
                              🐦 Early Bird
                            </span>
                          )}
                        </div>
                        
                        {/* Registration buttons for each child */}
                        <div className="space-y-2">
                          {children.length > 0 ? (
                            <>
                              {children.map(child => {
                                const registered = isChildRegistered(child, season)
                                return (
                                  <a
                                    key={child.id}
                                    href={registered ? undefined : getRegistrationUrl(season, child)}
                                    target={registered ? undefined : "_blank"}
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-between p-2 rounded-lg transition ${
                                      registered 
                                        ? `${tc.cardBg} cursor-default` 
                                        : 'bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                                        registered 
                                          ? 'bg-emerald-500/20 text-emerald-600' 
                                          : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                      }`}>
                                        {child.first_name?.[0]}{child.last_name?.[0]}
                                      </div>
                                      <span className={`text-sm font-medium ${registered ? tc.textMuted : tc.text}`}>
                                        {child.first_name} {child.last_name}
                                      </span>
                                    </div>
                                    {registered ? (
                                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Registered</span>
                                    ) : (
                                      <span className="text-xs text-[var(--accent-primary)] font-medium">Register →</span>
                                    )}
                                  </a>
                                )
                              })}
                              {/* Add new child option */}
                              <a
                                href={getRegistrationUrl(season)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed ${tc.border} hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition`}
                              >
                                <UserPlus className="w-4 h-4 text-[var(--accent-primary)]" />
                                <span className="text-sm font-medium text-[var(--accent-primary)]">Register New Child</span>
                              </a>
                            </>
                          ) : (
                            <a
                              href={getRegistrationUrl(season)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span className="font-medium">Register Now</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`p-5 border-t ${tc.border}`}>
          <button 
            onClick={onClose} 
            className={`w-full py-2.5 rounded-xl ${tc.cardBgAlt} ${tc.text} font-medium hover:opacity-80 transition`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// INFO HEADER BAR COMPONENT - 1:1 Mockup Copy
// ============================================
function InfoHeaderBar({ activeView, roleContext, organization, tc, setPage, selectedTeamId, setSelectedTeamId }) {
  const { selectedSeason, seasons: allSeasons, selectSeason } = useSeason()
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    nextGame: null,
    nextPractice: null,
    record: { wins: 0, losses: 0 },
    winStreak: 0,
    totalPlayers: 0,
    rosteredPlayers: 0,
    activeTeams: 0,
    totalCollected: 0,
    totalExpected: 0,
    balanceDue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showRegModal, setShowRegModal] = useState(false)
  const [showSeasonSelector, setShowSeasonSelector] = useState(false)

  // Get the coach's primary team
  const getCoachPrimaryTeam = () => {
    if (!roleContext?.coachInfo?.team_coaches?.length) return null
    const teamId = selectedTeamId || roleContext.coachInfo.team_coaches.find(tc => tc.role === 'head')?.team_id || roleContext.coachInfo.team_coaches[0]?.team_id
    return roleContext.coachInfo.team_coaches.find(tc => tc.team_id === teamId)
  }

  const primaryTeam = getCoachPrimaryTeam()

  // Fetch real stats based on season and role
  useEffect(() => {
    if (selectedSeason?.id) {
      fetchStats()
    }
  }, [selectedSeason?.id, activeView, selectedTeamId, roleContext])

  async function fetchStats() {
    setLoading(true)
    try {
      const seasonId = selectedSeason?.id

      if (activeView === 'admin') {
        // Fetch teams for this season
        const { data: teams, count: teamCount } = await supabase
          .from('teams')
          .select('id', { count: 'exact' })
          .eq('season_id', seasonId)
        
        const teamIds = teams?.map(t => t.id) || []
        
        // Get ACTUAL rostered count from team_players (source of truth)
        let rosteredCount = 0
        if (teamIds.length > 0) {
          const { data: teamPlayers } = await supabase
            .from('team_players')
            .select('player_id')
            .in('team_id', teamIds)
          // Count unique players (a player could theoretically be on multiple teams)
          rosteredCount = new Set(teamPlayers?.map(tp => tp.player_id) || []).size
        }
        
        // Get total registered players for this season
        const { data: allPlayers } = await supabase
          .from('players')
          .select('id, registrations(status)')
          .eq('season_id', seasonId)
        
        // Count players who are approved/rostered/active (eligible to be on a team)
        const eligiblePlayers = allPlayers?.filter(p => 
          ['approved', 'rostered', 'active'].includes(p.registrations?.[0]?.status)
        ).length || 0
        
        const totalPlayers = allPlayers?.length || 0
        
        // Fetch payments
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, paid')
          .eq('season_id', seasonId)

        const paidPayments = payments?.filter(p => p.paid) || []
        const totalCollected = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        const totalExpected = payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0

        setStats(prev => ({
          ...prev,
          totalPlayers: rosteredCount,
          eligiblePlayers,
          totalRegistrations: totalPlayers,
          activeTeams: teamCount || 0,
          totalCollected,
          totalExpected,
        }))
      }

      if (activeView === 'coach' && primaryTeam?.team_id) {
        // Fetch coach stats for selected team
        const teamId = primaryTeam.team_id

        // Get team record from games
        const { data: games } = await supabase
          .from('games')
          .select('team_score, opponent_score, status')
          .eq('team_id', teamId)
          .eq('status', 'completed')

        let wins = 0, losses = 0
        games?.forEach(g => {
          if (g.team_score > g.opponent_score) wins++
          else if (g.team_score < g.opponent_score) losses++
        })

        // Calculate win streak
        let streak = 0
        const sortedGames = games?.sort((a, b) => new Date(b.date) - new Date(a.date)) || []
        for (const g of sortedGames) {
          if (g.team_score > g.opponent_score) streak++
          else break
        }

        // Get next game
        const { data: nextGameData } = await supabase
          .from('games')
          .select('*, opponent_teams(name)')
          .eq('team_id', teamId)
          .in('status', ['scheduled', 'upcoming'])
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle()

        // Get next practice
        const { data: nextPracticeData } = await supabase
          .from('events')
          .select('*')
          .eq('team_id', teamId)
          .eq('event_type', 'practice')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle()

        setStats(prev => ({
          ...prev,
          record: { wins, losses },
          winStreak: streak,
          nextGame: nextGameData,
          nextPractice: nextPracticeData,
        }))
      }

      if (activeView === 'parent' && roleContext?.children?.length > 0) {
        // Get all team IDs across all children
        const allTeamIds = [...new Set(
          roleContext.children.flatMap(c => c.team_players?.map(tp => tp.team_id) || []).filter(Boolean)
        )]
        const playerIds = roleContext.children.map(c => c.id)
        
        console.log('InfoHeaderBar Parent Stats - Team IDs:', allTeamIds, 'Player IDs:', playerIds)

        if (allTeamIds.length > 0) {
          // Get next upcoming event across all children's teams
          const today = new Date().toISOString().split('T')[0]
          let query = supabase
            .from('schedule_events')
            .select('*, teams!schedule_events_team_id_fkey(name, color)')
            .in('team_id', allTeamIds)
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true })
            .limit(1)
          
          // Also filter by season if available
          if (seasonId) {
            query = query.eq('season_id', seasonId)
          }
          
          const { data: nextEvent, error: eventError } = await query.maybeSingle()
          console.log('InfoHeaderBar Parent Stats - Next Event:', nextEvent, 'Error:', eventError)

          // Get balance due from payments (correct columns: amount + paid boolean)
          const { data: payments } = await supabase
            .from('payments')
            .select('amount, paid')
            .in('player_id', playerIds)

          const balanceDue = (payments || [])
            .filter(p => !p.paid)
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

          setStats(prev => ({
            ...prev,
            record: { wins: 0, losses: 0 },
            nextPractice: nextEvent,
            nextGame: null,
            balanceDue,
          }))
        }
      }

    } catch (err) {
      console.error('Error fetching stats:', err)
    }
    setLoading(false)
  }

  // Format date for display
  const formatEventDate = (dateStr, timeStr) => {
    if (!dateStr) return 'TBD'
    const date = new Date(dateStr)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[date.getDay()]
    
    if (timeStr) {
      const time = new Date(`2000-01-01T${timeStr}`)
      return `${dayName} ${time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    }
    return dayName
  }

  // Calculate team morale based on recent performance
  const getTeamMorale = () => {
    if (stats.winStreak >= 3) return { label: 'High', color: '#10B981' }
    if (stats.winStreak >= 1) return { label: 'Good', color: '#F59E0B' }
    if (stats.record.wins > stats.record.losses) return { label: 'Good', color: '#F59E0B' }
    return { label: 'Building', color: '#6B7280' }
  }

  const morale = getTeamMorale()

  return (
    <div 
      className="bg-white border-b border-slate-200 shadow-sm"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Stats Row - Centered */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center gap-0">
          
          {/* ═══ COACH VIEW ═══ */}
          {activeView === 'coach' && (
            <>
              {/* Next Game */}
              <button 
                onClick={() => setPage('schedule')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg group"
              >
                <div className="w-11 h-11 rounded-lg bg-[#3B82F6] flex items-center justify-center shadow-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Next Game:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">
                    {stats.nextGame ? formatEventDate(stats.nextGame.date, stats.nextGame.time) : 'No games scheduled'}
                  </span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* Record */}
              <button 
                onClick={() => setPage('standings')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg group"
              >
                <div className="w-11 h-11 rounded-lg bg-[#EF4444] flex items-center justify-center shadow-sm">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Record:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">{stats.record.wins}-{stats.record.losses}</span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* Win Streak */}
              <button 
                onClick={() => setPage('standings')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg group"
              >
                <div className="w-11 h-11 rounded-lg bg-[#F59E0B] flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Win Streak:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">{stats.winStreak} Wins</span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* Team Morale */}
              <div className="flex items-center gap-4 px-6 py-2">
                <div className="w-11 h-11 rounded-lg bg-[#10B981] flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Team Morale:</span>
                  <span className="text-lg">👍</span>
                  <span className="font-bold text-sm" style={{ color: morale.color }}>{morale.label}</span>
                </div>
              </div>
            </>
          )}

          {/* ═══ ADMIN VIEW ═══ */}
          {activeView === 'admin' && (
            <>
              {/* Season/Sport Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowSeasonSelector(!showSeasonSelector)}
                  className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
                >
                  <div className="w-11 h-11 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shadow-sm">
                    {selectedSeason?.sports?.icon ? (
                      <span className="text-xl">{selectedSeason.sports.icon}</span>
                    ) : (
                      <VolleyballIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-slate-500 text-sm">Season:</span>
                    <span className="text-slate-900 font-bold text-sm ml-2">{selectedSeason?.name || 'Select Season'}</span>
                    <ChevronDown className={`inline w-3 h-3 ml-1 text-slate-400 transition-transform ${showSeasonSelector ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                {/* Season Dropdown */}
                {showSeasonSelector && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSeasonSelector(false)} />
                    <div className="absolute top-full left-0 mt-1 w-72 rounded-xl shadow-xl border border-slate-200 bg-white overflow-hidden z-50 max-h-80 overflow-y-auto">
                      {allSeasons.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">No seasons found</div>
                      ) : (
                        allSeasons.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { 
                              selectSeason(s)
                              setShowSeasonSelector(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50 ${
                              selectedSeason?.id === s.id ? 'bg-[var(--accent-primary)]/10' : ''
                            }`}
                          >
                            <span className="text-lg">{s.sports?.icon || '🏆'}</span>
                            <div className="flex-1 text-left">
                              <p className={`font-medium ${selectedSeason?.id === s.id ? 'text-[var(--accent-primary)]' : 'text-slate-800'}`}>{s.name}</p>
                              <p className="text-xs text-slate-500">{s.sports?.name || 'Sport'}</p>
                            </div>
                            {s.status === 'active' && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Active</span>
                            )}
                            {selectedSeason?.id === s.id && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* Rostered Players - Shows X/Y format */}
              <button 
                onClick={() => setPage('teams')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg group"
                title="Click to manage rosters"
              >
                <div className="w-11 h-11 rounded-lg bg-[#3B82F6] flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center">
                    <span className="text-slate-500 text-sm">Rostered:</span>
                    <span className="text-slate-900 font-bold text-sm ml-2">
                      {stats.totalPlayers}
                      <span className="text-slate-400 font-normal">/{stats.eligiblePlayers || stats.totalRegistrations || 0}</span>
                    </span>
                  </div>
                  {stats.eligiblePlayers > stats.totalPlayers && (
                    <div className="text-xs text-orange-500 group-hover:underline">
                      ({stats.eligiblePlayers - stats.totalPlayers} unrostered)
                    </div>
                  )}
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* Active Teams */}
              <button 
                onClick={() => setPage('teams')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
              >
                <div className="w-11 h-11 rounded-lg bg-[#8B5CF6] flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Active Teams:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">{stats.activeTeams}</span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* Financials */}
              <button 
                onClick={() => setPage('payments')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
              >
                <div className="w-11 h-11 rounded-lg bg-[#10B981] flex items-center justify-center shadow-sm">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Collected:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">
                    ${stats.totalCollected.toLocaleString()}
                    <span className="text-slate-400 font-normal">/${stats.totalExpected.toLocaleString()}</span>
                  </span>
                </div>
              </button>
            </>
          )}

          {/* ═══ PARENT VIEW ═══ */}
          {activeView === 'parent' && (
            <div className="flex items-center w-full">
              {/* Welcome greeting — left side */}
              <div className="flex items-center gap-3">
                {selectedSeason?.sports?.icon && <span className="text-xl">{selectedSeason.sports.icon}</span>}
                <div>
                  <div className="text-slate-900 font-extrabold text-base tracking-tight">Welcome back, {profile?.full_name?.split(' ')[0] || 'Parent'}! 👋</div>
                  <div className="text-slate-400 text-xs font-medium">
                    {selectedSeason?.sports?.name || 'Sports'} • {selectedSeason?.name || 'Current Season'}
                    {organization?.name && ` • ${organization.name}`}
                  </div>
                </div>
              </div>

              {/* Spacer to push remaining items to center-right */}
              <div className="flex-1" />

              {/* Center-grouped items */}
              <div className="flex items-center gap-0">
                {/* Next Event - with type, day, date, time */}
                <button 
                  onClick={() => setPage('schedule')}
                  className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
                >
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-sm ${
                    stats.nextPractice?.event_type === 'game' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'
                  }`}>
                    <span className="text-lg">{stats.nextPractice?.event_type === 'game' ? '🏐' : '📅'}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-500 text-sm">Next:</span>
                    <span className="text-slate-900 font-bold text-sm ml-2">
                      {stats.nextPractice 
                        ? `${stats.nextPractice.event_type === 'game' ? 'Game' : 'Practice'} — ${formatEventDate(stats.nextPractice.event_date, stats.nextPractice.event_time)}`
                        : 'Nothing scheduled'}
                    </span>
                  </div>
                </button>

                {/* Divider */}
                <div className="w-px h-10 bg-slate-200 mx-2" />

                {/* Messages */}
                <button 
                  onClick={() => setPage('chats')}
                  className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
                >
                  <div className="w-11 h-11 rounded-lg bg-[#8B5CF6] flex items-center justify-center shadow-sm">
                    <span className="text-lg">💬</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-500 text-sm">Messages</span>
                  </div>
                </button>

                {/* Divider */}
                <div className="w-px h-10 bg-slate-200 mx-2" />

                {/* Balance */}
                <button 
                  onClick={() => setPage('payments')}
                  className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
                >
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-sm ${stats.balanceDue > 0 ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`}>
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    {stats.balanceDue > 0 ? (
                      <>
                        <span className="text-slate-500 text-sm">Balance Due:</span>
                        <span className="text-[#EF4444] font-bold text-sm ml-2">${stats.balanceDue.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-[#10B981] font-bold text-sm">All Caught Up! ✓</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ═══ PLAYER VIEW ═══ */}
          {activeView === 'player' && (
            <>
              {/* Next Practice */}
              <button 
                onClick={() => setPage('schedule')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
              >
                <div className="w-11 h-11 rounded-lg bg-[#3B82F6] flex items-center justify-center shadow-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Next Practice:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">Mon 6:00 PM</span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* Next Game */}
              <button 
                onClick={() => setPage('schedule')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
              >
                <div className="w-11 h-11 rounded-lg bg-[#F59E0B] flex items-center justify-center shadow-sm">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Next Game:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">Sat 10:00 AM</span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-slate-200 mx-2" />

              {/* My Achievements */}
              <button 
                onClick={() => setPage('achievements')}
                className="flex items-center gap-4 px-6 py-2 hover:bg-slate-50 transition rounded-lg"
              >
                <div className="w-11 h-11 rounded-lg bg-[#8B5CF6] flex items-center justify-center shadow-sm">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-sm">Achievements:</span>
                  <span className="text-slate-900 font-bold text-sm ml-2">12 Earned</span>
                </div>
              </button>
            </>
          )}

        </div>
      </div>
      
      {/* Registration Selector Modal for Parents */}
      <RegistrationSelectorModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        roleContext={roleContext}
        organization={organization}
        tc={tc}
      />
    </div>
  )
}

// CheckCircle icon (add since we need it)
function CheckCircle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

// ============================================
// HORIZONTAL NAV BAR COMPONENT
// ============================================
function HorizontalNavBar({ 
  page, setPage, activeView, profile, showRoleSwitcher, setShowRoleSwitcher,
  getAvailableViews, setActiveView, signOut, exitTeamWall, directTeamWallId,
  tc, accent, accentColor, changeAccent, accentColors, isDark, toggleTheme,
  roleContext, navigateToTeamWall, organization
}) {
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
    ]},
    { id: 'game', label: 'Game Day', type: 'dropdown', items: [
      { id: 'gameprep', label: 'Game Prep', icon: 'target' },
      { id: 'standings', label: 'Standings', icon: 'star' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
    ]},
    { id: 'communication', label: 'Communication', type: 'dropdown', items: [
      { id: 'chats', label: 'Chats', icon: 'message' },
      { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
    ]},
    { id: 'insights', label: 'Insights', type: 'dropdown', items: [
      { id: 'reports', label: 'Reports & Analytics', icon: 'pie-chart' },
    ]},
    { id: 'setup', label: 'Setup', type: 'dropdown', items: [
  { id: 'seasons', label: 'Seasons', icon: 'calendar' },
  { id: 'templates', label: 'Registration Forms', icon: 'clipboard' },
  { id: 'waivers', label: 'Waivers', icon: 'file-text' },
  { id: 'paymentsetup', label: 'Payment Setup', icon: 'credit-card' },
  { id: 'organization', label: 'Organization', icon: 'building' },
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
      navigateToTeamWall(item.teamId)
      return
    }
    if (item?.playerId) {
      exitTeamWall()
      setPage(`player-${item.playerId}`)
      return
    }
    exitTeamWall()
    setPage(itemId)
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50"
      style={{ background: accent.navBar, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
      
      {/* LEFT: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent.primary }}>
          <VolleyballIcon className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-white">Volley<span className="text-slate-400">Brain</span></span>
      </div>

      {/* CENTER: Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map(item => {
          if (item.type === 'single') {
            const isActive = page === item.id && !directTeamWallId
            return (
              <button key={item.id} onClick={() => handleNavigate(item.id)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                style={{ background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent', color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)' }}>
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

      {/* RIGHT: Notifications + Profile */}
      <div className="flex items-center gap-3">
        <NotificationDropdown tc={tc} organization={organization} />
        <UserProfileDropdown 
          profile={profile} activeView={activeView} showRoleSwitcher={showRoleSwitcher}
          setShowRoleSwitcher={setShowRoleSwitcher} getAvailableViews={getAvailableViews}
          setActiveView={setActiveView} setPage={setPage} signOut={signOut} tc={tc}
          accent={accent} accentColor={accentColor} changeAccent={changeAccent}
          accentColors={accentColors} isDark={isDark} toggleTheme={toggleTheme} />
      </div>
    </header>
  )
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function MainApp() {
  const { profile, organization, signOut, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent, accentColor, changeAccent, accentColors, toggleTheme } = useTheme()
  const [page, setPage] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const [directTeamWallId, setDirectTeamWallId] = useState(null)
  const [selectedTeamId, setSelectedTeamId] = useState(null)

  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash
      const teamMatch = hash.match(/^#\/team\/(.+)$/)
      if (teamMatch) {
        setDirectTeamWallId(teamMatch[1])
      } else {
        setDirectTeamWallId(null)
      }
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateToTeamWall = (teamId) => {
    window.location.hash = `/team/${teamId}`
  }

  const exitTeamWall = () => {
    window.location.hash = ''
    setDirectTeamWallId(null)
  }

  const navigateFromTeamWall = (targetPage) => {
    window.location.hash = ''
    setDirectTeamWallId(null)
    setPage(targetPage)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

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
    <SportProvider>
    <SeasonProvider>
      <div className={`flex flex-col min-h-screen ${tc.pageBg}`}>
        <JourneyCelebrations />
        
        {/* Horizontal Nav Bar */}
        <HorizontalNavBar 
          page={page} setPage={setPage} activeView={activeView} profile={profile}
          showRoleSwitcher={showRoleSwitcher} setShowRoleSwitcher={setShowRoleSwitcher}
          getAvailableViews={getAvailableViews} setActiveView={setActiveView} signOut={signOut}
          exitTeamWall={exitTeamWall} directTeamWallId={directTeamWallId} tc={tc} accent={accent}
          accentColor={accentColor} changeAccent={changeAccent} accentColors={accentColors}
          isDark={isDark} toggleTheme={toggleTheme} roleContext={roleContext}
          navigateToTeamWall={navigateToTeamWall} organization={organization}
        />
        
        {/* Info Header Bar */}
        <div className="mt-14">
          <InfoHeaderBar 
            activeView={activeView} roleContext={roleContext} organization={organization}
            tc={tc} setPage={setPage} selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-auto">
          {directTeamWallId ? (
            <TeamWallPage teamId={directTeamWallId} showToast={showToast} onBack={exitTeamWall} onNavigate={navigateFromTeamWall} />
          ) : (
            <>
              {page === 'dashboard' && activeView === 'admin' && <DashboardPage onNavigate={setPage} />}
              {page === 'dashboard' && activeView === 'coach' && <CoachDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={setPage} />}
              {page === 'dashboard' && activeView === 'parent' && <ParentDashboard roleContext={roleContext} navigateToTeamWall={navigateToTeamWall} showToast={showToast} onNavigate={setPage} />}
              {page === 'dashboard' && activeView === 'player' && <PlayerDashboard roleContext={{...roleContext, role: roleContext?.isAdmin ? 'admin' : roleContext?.isCoach ? 'head_coach' : 'player'}} navigateToTeamWall={navigateToTeamWall} onNavigate={setPage} showToast={showToast} onPlayerChange={setSelectedPlayerForView} />}
              
              {page.startsWith('player-profile-') && activeView === 'parent' && <PlayerProfilePage playerId={page.replace('player-profile-', '')} roleContext={roleContext} showToast={showToast} onNavigate={setPage} />}
              {page.startsWith('player-') && !page.startsWith('player-profile-') && activeView === 'parent' && <ParentPlayerCardPage playerId={page.replace('player-', '')} roleContext={roleContext} showToast={showToast} />}
              {page === 'messages' && activeView === 'parent' && <ParentMessagesPage roleContext={roleContext} showToast={showToast} />}
              {page === 'invite' && activeView === 'parent' && <InviteFriendsPage roleContext={roleContext} showToast={showToast} />}
              {page === 'payments' && activeView === 'parent' && <ParentPaymentsPage roleContext={roleContext} showToast={showToast} />}
              
              {page === 'registrations' && (activeView === 'admin' || activeView === 'coach') && <RegistrationsPage showToast={showToast} />}
              {page === 'payments' && activeView === 'admin' && <PaymentsPage showToast={showToast} />}
              {page === 'teams' && (activeView === 'admin' || activeView === 'coach') && <TeamsPage showToast={showToast} navigateToTeamWall={navigateToTeamWall} onNavigate={setPage} />}
              {page === 'coaches' && activeView === 'admin' && <CoachesPage showToast={showToast} />}
              {page === 'jerseys' && activeView === 'admin' && <JerseysPage showToast={showToast} />}
              {page === 'schedule' && <SchedulePage showToast={showToast} activeView={activeView} roleContext={roleContext} />}
              {page === 'attendance' && (activeView === 'admin' || activeView === 'coach') && <AttendancePage showToast={showToast} />}
              {page === 'gameprep' && (activeView === 'admin' || activeView === 'coach') && <GamePrepPage showToast={showToast} />}
              {page === 'standings' && <TeamStandingsPage showToast={showToast} />}
              {page === 'leaderboards' && <SeasonLeaderboardsPage showToast={showToast} />}
              {page === 'seasons' && activeView === 'admin' && <SeasonsPage showToast={showToast} />}
              {page === 'templates' && activeView === 'admin' && <RegistrationTemplatesPage showToast={showToast} />}
              {page === 'waivers' && activeView === 'admin' && <WaiversPage showToast={showToast} />}
              {page === 'paymentsetup' && activeView === 'admin' && <PaymentSetupPage showToast={showToast} />}
              {page === 'organization' && activeView === 'admin' && <OrganizationPage showToast={showToast} setPage={setPage} />}
              {page === 'chats' && <ChatsPage showToast={showToast} activeView={activeView} roleContext={roleContext} />}
              {page === 'blasts' && activeView === 'admin' && <BlastsPage showToast={showToast} activeView={activeView} roleContext={roleContext} />}
              {page === 'reports' && activeView === 'admin' && <ReportsPage showToast={showToast} />}
              
              {page === 'achievements' && (activeView === 'parent' || activeView === 'player') && (
                <AchievementsCatalogPage 
                  playerId={activeView === 'player' ? selectedPlayerForView?.id : roleContext?.children?.[0]?.id}
                  showToast={showToast}
                  playerName={activeView === 'player' ? (selectedPlayerForView ? `${selectedPlayerForView.first_name}'s` : 'My') : `${roleContext?.children?.[0]?.first_name}'s`}
                  isAdminPreview={activeView === 'player' && roleContext?.isAdmin}
                />
              )}
            </>
          )}
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <BlastAlertChecker />
      </div>
    </SeasonProvider>
    </SportProvider>
  )
}

export { MainApp }
