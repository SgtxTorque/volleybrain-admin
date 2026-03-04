// =============================================================================
// LynxSidebar — Full navigation + utility sidebar
// 64px collapsed, 228px expanded on hover. Always dark navy.
// Holds all nav groups, role switcher, theme toggle, notifications, sign out.
// =============================================================================

import React from 'react'
import {
  LayoutDashboard, Users, UserCog, Shield, DollarSign,
  ClipboardList, Megaphone, Settings, Calendar, BarChart3,
  Trophy, Star, Zap, Target, Shirt, FileText, ChevronRight,
  MessageCircle, Bell, Award, Flame, UserCheck, Home,
  Building2, CreditCard, PieChart, TrendingUp, Download,
  CheckSquare, CalendarCheck, User, LogOut, Moon, Sun, Check
} from 'lucide-react'

// Icon lookup for nav items
const ICON_MAP = {
  dashboard: LayoutDashboard,
  home: Home,
  players: Users,
  parents: Users,
  coaches: UserCog,
  teams: Shield,
  payments: DollarSign,
  registrations: ClipboardList,
  waivers: FileText,
  blasts: Megaphone,
  settings: Settings,
  schedule: Calendar,
  reports: BarChart3,
  standings: Trophy,
  leaderboards: Star,
  gameprep: Zap,
  evaluations: Target,
  tryouts: ClipboardList,
  jerseys: Shirt,
  chats: MessageCircle,
  notifications: Bell,
  achievements: Award,
  challenges: Flame,
  shoutouts: Star,
  attendance: UserCheck,
  roster: Users,
  stats: BarChart3,
  teamwall: MessageCircle,
  'season-setup': Settings,
  // Additional icon mappings from spec
  'user-cog': UserCog,
  'building': Building2,
  'file-text': FileText,
  'credit-card': CreditCard,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'download': Download,
  'check-square': CheckSquare,
  'calendar-check': CalendarCheck,
  'bar-chart': BarChart3,
  'message': MessageCircle,
  'user': User,
  clipboard: ClipboardList,
  dollar: DollarSign,
  megaphone: Megaphone,
  calendar: Calendar,
  target: Target,
  star: Star,
  bell: Bell,
  shirt: Shirt,
  shield: Shield,
  volleyball: Star,
  users: Users,
}

// Paw logo SVG — compact Lynx brand mark
function LynxPaw({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="7" cy="5" r="2.2" />
      <circle cx="12" cy="3.5" r="2.2" />
      <circle cx="17" cy="5" r="2.2" />
      <ellipse cx="12" cy="13" rx="5.5" ry="6" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
    </svg>
  )
}

// =============================================================================
// NavItem — single navigation row
// =============================================================================
function NavItem({ item, isActive, onNavigate, indented = false }) {
  const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || LayoutDashboard

  return (
    <button
      onClick={() => onNavigate?.(item.id, item)}
      className={`
        relative w-full flex items-center gap-3 h-9 rounded-lg transition-colors duration-200
        ${isActive
          ? 'bg-lynx-sky/15 text-lynx-sky'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        }
      `}
      title={item.label}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-lynx-sky" />
      )}

      {/* Icon — always centered in 64px column */}
      <div className={`${indented ? 'w-16 min-w-[64px] pl-2' : 'w-16 min-w-[64px]'} flex items-center justify-center shrink-0`}>
        <Icon className="w-[18px] h-[18px]" />
      </div>

      {/* Label — hidden when collapsed, shown on hover */}
      <span className="text-[13px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate pr-2">
        {item.label}
      </span>

      {/* Badge — only visible when expanded */}
      {item.badge > 0 && (
        <span className="ml-auto mr-4 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
      {item.hasBadge && (
        <span className="ml-auto mr-4 w-2 h-2 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </button>
  )
}

// =============================================================================
// GroupHeader — section label for nav groups (not clickable)
// =============================================================================
function GroupHeader({ label, icon }) {
  const Icon = ICON_MAP[icon] || LayoutDashboard

  return (
    <div className="flex items-center h-8 mt-2">
      <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {label}
      </span>
    </div>
  )
}

// =============================================================================
// LynxSidebar
// =============================================================================
export default function LynxSidebar({
  // Navigation
  navGroups = [],
  activePage = '',
  activePathname = '',
  directTeamWallId = null,
  onNavigate,

  // Identity
  orgName = '',
  orgInitials = '',
  orgLogo = null,
  teamName = '',
  teamSub = '',

  // User / utility
  profile = null,
  activeView = 'admin',
  availableViews = [],
  onSwitchRole,
  onToggleTheme,
  onSignOut,
  onNavigateToProfile,
  isDark = false,
  notificationCount = 0,
  onOpenNotifications,

  // Platform admin
  isPlatformAdmin = false,
  onPlatformAnalytics,
  onPlatformSubscriptions,
  onPlatformAdmin,
}) {
  const isItemActive = (item) => {
    if (item.teamId) return directTeamWallId === item.teamId
    if (item.playerId) return activePage === `player-${item.playerId}`
    return activePage === item.id
  }

  const getRoleLabel = (viewId) => {
    switch (viewId) {
      case 'admin': return 'Admin'
      case 'coach': return 'Coach'
      case 'parent': return 'Parent'
      case 'player': return 'Player'
      default: return 'User'
    }
  }

  const displayName = profile?.full_name || 'User'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div
      className="group fixed left-0 top-0 z-40 h-screen flex flex-col
        w-16 hover:w-[228px] bg-[#0B1628]
        transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        border-r border-white/[0.06] overflow-hidden"
    >
      {/* ---- 1. Logo Row ---- */}
      <div className="flex items-center h-16 shrink-0">
        <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
          <LynxPaw className="w-7 h-7 text-lynx-sky" />
        </div>
        <span className="text-lg font-black text-white tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Lynx
        </span>
      </div>

      {/* ---- 2. Org/Team Identity ---- */}
      <div className="flex items-center gap-3 px-3 py-3 mx-2 rounded-lg bg-white/[0.04] mb-1">
        <div className="w-10 min-w-[40px] h-10 flex items-center justify-center shrink-0">
          {orgLogo ? (
            <img src={orgLogo} alt={orgName} className="w-9 h-9 rounded-lg object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-lynx-sky/20 flex items-center justify-center text-xs font-black text-lynx-sky">
              {orgInitials || '?'}
            </div>
          )}
        </div>
        <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-sm font-bold text-white truncate">{orgName || teamName || 'Organization'}</p>
          <p className="text-[11px] text-slate-400 truncate">{teamSub || 'Season Active'}</p>
        </div>
      </div>

      {/* ---- 3. Nav Items — groups with inline sub-items ---- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin">
        {navGroups.map((group, gIdx) => {
          if (group.type === 'single') {
            // Single item — render as a standard NavItem
            return (
              <NavItem
                key={group.id}
                item={{ ...group, icon: group.icon || group.id }}
                isActive={activePage === group.id && !directTeamWallId}
                onNavigate={(id) => onNavigate?.(id, group)}
              />
            )
          }

          // Group with children
          return (
            <div key={group.id || gIdx}>
              <GroupHeader label={group.label} icon={group.icon || group.id} />
              {group.items?.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={isItemActive(item)}
                  onNavigate={onNavigate}
                  indented
                />
              ))}
            </div>
          )
        })}
      </nav>

      {/* ---- 4. Divider + Utilities ---- */}
      <div className="border-t border-white/[0.06] shrink-0">
        {/* Platform admin links */}
        {isPlatformAdmin && (
          <div className="py-1">
            <NavItem
              item={{ id: 'platform-analytics', label: 'Analytics', icon: 'reports' }}
              isActive={activePage === 'platform-analytics'}
              onNavigate={() => onPlatformAnalytics?.()}
            />
            <NavItem
              item={{ id: 'platform-subscriptions', label: 'Subscriptions', icon: 'credit-card' }}
              isActive={activePage === 'platform-subscriptions'}
              onNavigate={() => onPlatformSubscriptions?.()}
            />
            <NavItem
              item={{ id: 'platform-admin', label: 'Platform Admin', icon: 'shield' }}
              isActive={activePage === 'platform-admin'}
              onNavigate={() => onPlatformAdmin?.()}
            />
          </div>
        )}

        {/* Notifications */}
        <button
          onClick={() => onOpenNotifications?.()}
          className="relative w-full flex items-center gap-3 h-9 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors duration-200"
          title="Notifications"
        >
          <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0 relative">
            <Bell className="w-[18px] h-[18px]" />
            {notificationCount > 0 && (
              <span className="absolute top-0.5 right-3 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
          <span className="text-[13px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Notifications
          </span>
          {notificationCount > 0 && (
            <span className="ml-auto mr-4 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      {/* ---- 5. Bottom User Section ---- */}
      <div className="border-t border-white/[0.06] shrink-0">
        {/* Expanded user details — only visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-h-0 group-hover:max-h-[400px] overflow-hidden transition-all">
          {/* My Profile */}
          <button
            onClick={() => onNavigateToProfile?.()}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="text-[13px] font-medium">My Profile</span>
          </button>

          {/* Switch Role */}
          {availableViews.length > 1 && (
            <div className="px-4 pt-2 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 mb-1">Switch Role</p>
              {availableViews.map(view => (
                <button
                  key={view.id}
                  onClick={() => onSwitchRole?.(view.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                    activeView === view.id ? 'bg-lynx-sky/15 text-lynx-sky' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-[13px] font-medium flex-1">{view.label}</span>
                  {activeView === view.id && <Check className="w-3.5 h-3.5 text-lynx-sky" />}
                </button>
              ))}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => onToggleTheme?.()}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-[13px] font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Sign out */}
          <button
            onClick={() => onSignOut?.()}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[13px] font-medium">Sign Out</span>
          </button>
        </div>

        {/* Avatar row — always visible */}
        <div className="flex items-center h-14 shrink-0">
          <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
              style={{ background: profile?.photo_url ? 'transparent' : 'rgba(75,185,236,0.2)', color: '#4BB9EC' }}>
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              ) : initial}
            </div>
          </div>
          <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-slate-500 truncate">{getRoleLabel(activeView)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
