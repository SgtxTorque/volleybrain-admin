// =============================================================================
// LynxSidebar — Full navigation + utility sidebar
// 64px collapsed, 228px expanded on hover. Always dark navy.
// Profile + role switcher at top. Collapsible nav groups. Utilities at bottom.
// =============================================================================

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, UserCog, Shield, DollarSign,
  ClipboardList, Megaphone, Settings, Calendar, BarChart3,
  Trophy, Star, Zap, Target, Shirt, FileText, ChevronRight,
  MessageCircle, Bell, Award, Flame, UserCheck, Home,
  Building2, CreditCard, PieChart, TrendingUp, Download,
  CheckSquare, CalendarCheck, User, LogOut, Moon, Sun, MapPin
} from 'lucide-react'

// Icon lookup for nav items
const ICON_MAP = {
  dashboard: LayoutDashboard, home: Home, players: Users, parents: Users,
  coaches: UserCog, teams: Shield, payments: DollarSign,
  registrations: ClipboardList, waivers: FileText, blasts: Megaphone,
  settings: Settings, schedule: Calendar, reports: BarChart3,
  standings: Trophy, leaderboards: Star, gameprep: Zap,
  evaluations: Target, tryouts: ClipboardList, jerseys: Shirt,
  chats: MessageCircle, notifications: Bell, achievements: Award,
  challenges: Flame, shoutouts: Star, attendance: UserCheck,
  roster: Users, stats: BarChart3, teamwall: MessageCircle,
  'season-setup': Settings, 'user-cog': UserCog, 'building': Building2,
  'file-text': FileText, 'credit-card': CreditCard, 'pie-chart': PieChart,
  'trending-up': TrendingUp, 'download': Download, 'check-square': CheckSquare,
  'calendar-check': CalendarCheck, 'bar-chart': BarChart3, 'message': MessageCircle,
  'user': User, clipboard: ClipboardList, dollar: DollarSign,
  megaphone: Megaphone, calendar: Calendar, target: Target, star: Star,
  bell: Bell, shirt: Shirt, shield: Shield, volleyball: Star, users: Users,
  'map-pin': MapPin,
}

// Paw logo SVG
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
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-lynx-sky" />
      )}
      <div className={`${indented ? 'w-16 min-w-[64px] pl-2' : 'w-16 min-w-[64px]'} flex items-center justify-center shrink-0`}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <span className="text-r-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate pr-2">
        {item.label}
      </span>
      {item.badge > 0 && (
        <span className="ml-auto mr-4 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-r-xs font-bold flex items-center justify-center px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
// CollapsibleGroupHeader — clickable section with expand/collapse chevron
// Hidden in collapsed sidebar (64px), visible in expanded sidebar (hover)
// =============================================================================
function CollapsibleGroupHeader({ label, icon, isExpanded, onToggle }) {
  const Icon = ICON_MAP[icon] || LayoutDashboard

  return (
    <button
      onClick={onToggle}
      className="hidden group-hover:flex w-full items-center h-8 mt-2 text-slate-500 hover:text-slate-300 transition-colors"
    >
      <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-r-xs font-bold uppercase tracking-wider whitespace-nowrap text-left">
        {label}
      </span>
      <ChevronRight
        className={`w-3.5 h-3.5 mr-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
      />
    </button>
  )
}

// =============================================================================
// LynxSidebar
// =============================================================================
export default function LynxSidebar({
  navGroups = [], activePage = '', activePathname = '', directTeamWallId = null, onNavigate,
  orgName = '', orgInitials = '', orgLogo = null, teamName = '', teamSub = '',
  profile = null, activeView = 'admin', availableViews = [], onSwitchRole,
  onToggleTheme, onSignOut, onNavigateToProfile, isDark = false,
  notificationCount = 0, onOpenNotifications,
  isPlatformAdmin = false, onPlatformAnalytics, onPlatformSubscriptions, onPlatformAdmin,
}) {
  const displayName = profile?.full_name || 'User'
  const avatarInitial = displayName.charAt(0).toUpperCase()

  const isItemActive = (item) => {
    if (item.teamId) return directTeamWallId === item.teamId
    if (item.playerId) return activePage === `player-${item.playerId}`
    return activePage === item.id
  }

  // Track which nav groups are expanded (by group.id)
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initialSet = new Set()
    for (const group of navGroups) {
      if (group.type !== 'single' && group.items) {
        if (group.items.some(item => {
          if (item.teamId) return directTeamWallId === item.teamId
          if (item.playerId) return activePage === `player-${item.playerId}`
          return activePage === item.id
        })) initialSet.add(group.id)
      }
    }
    return initialSet
  })

  // Auto-expand group when active page changes
  useEffect(() => {
    for (const group of navGroups) {
      if (group.type !== 'single' && group.items) {
        const hasActive = group.items.some(item => {
          if (item.teamId) return directTeamWallId === item.teamId
          if (item.playerId) return activePage === `player-${item.playerId}`
          return activePage === item.id
        })
        if (hasActive) {
          setExpandedGroups(prev => {
            if (prev.has(group.id)) return prev
            return new Set([...prev, group.id])
          })
          break
        }
      }
    }
  }, [activePage, directTeamWallId])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <div
      className="group fixed left-0 top-0 z-40 h-screen flex flex-col
        w-16 hover:w-56 xl:hover:w-60 bg-[#0B1628]
        transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        border-r border-white/[0.06] overflow-hidden"
    >
      {/* ---- 1. Logo Row ---- */}
      <div className="flex items-center h-14 shrink-0">
        <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
          <LynxPaw className="w-7 h-7 text-lynx-sky" />
        </div>
        <span className="text-r-lg font-extrabold text-white tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Lynx
        </span>
      </div>

      {/* ---- 2. Profile + Role Switcher (top, below logo) ---- */}
      <div className="shrink-0 mx-2 mb-1">
        <button
          onClick={() => onNavigateToProfile?.()}
          className="flex items-center gap-3 px-1 py-2 w-full rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-10 min-w-[40px] flex items-center justify-center shrink-0">
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
              style={{ background: profile?.photo_url ? 'transparent' : 'rgba(75,185,236,0.2)', color: '#4BB9EC' }}
            >
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              ) : avatarInitial}
            </div>
          </div>
          <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-left">
            <p className="text-r-base font-bold text-white truncate">{displayName}</p>
            <p className="text-r-xs text-slate-500 truncate">{orgName || 'Organization'}</p>
          </div>
        </button>

        {/* Role pills — visible on hover */}
        {availableViews.length > 1 && (
          <div className="flex flex-wrap gap-1 px-1 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {availableViews.map(view => (
              <button
                key={view.id}
                onClick={() => onSwitchRole?.(view.id)}
                className={`px-3 py-1 rounded-full text-r-xs font-bold transition-colors ${
                  activeView === view.id
                    ? 'bg-lynx-sky/15 text-lynx-sky'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-b border-white/[0.08] mx-3 shrink-0" />

      {/* ---- 3. Nav Items — collapsible groups ---- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin">
        {navGroups.map((group, gIdx) => {
          if (group.type === 'single') {
            return (
              <NavItem
                key={group.id}
                item={{ ...group, icon: group.icon || group.id }}
                isActive={activePage === group.id && !directTeamWallId}
                onNavigate={(id) => onNavigate?.(id, group)}
              />
            )
          }

          const isExpanded = expandedGroups.has(group.id)

          return (
            <div key={group.id || gIdx}>
              <CollapsibleGroupHeader
                label={group.label}
                icon={group.icon || group.id}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(group.id)}
              />
              {/*
                In collapsed sidebar (64px): all items visible as icons (max-h-[500px]).
                In expanded sidebar (hover): collapsed groups hide via group-hover:max-h-0.
              */}
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                isExpanded
                  ? 'max-h-[500px]'
                  : 'max-h-[500px] group-hover:max-h-0'
              }`}>
                {group.items?.map(item => (
                  <NavItem
                    key={item.id + (item.teamId || '') + (item.playerId || '')}
                    item={item}
                    isActive={isItemActive(item)}
                    onNavigate={onNavigate}
                    indented
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ---- 4. Divider + Utilities ---- */}
      <div className="border-t border-white/[0.06] shrink-0">
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
              <span className="absolute top-0.5 right-3 w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
          <span className="text-r-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Notifications
          </span>
          {notificationCount > 0 && (
            <span className="ml-auto mr-4 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-r-xs font-bold flex items-center justify-center px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      {/* ---- 5. Bottom Utility Section ---- */}
      <div className="border-t border-white/[0.06] shrink-0">
        {/* Expanded: theme + sign out */}
        <div className="max-h-0 group-hover:max-h-[120px] overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onToggleTheme?.()}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-r-sm font-semibold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={() => onSignOut?.()}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-r-sm font-semibold">Sign Out</span>
          </button>
        </div>

        {/* Collapsed: settings gear icon */}
        <div className="flex group-hover:hidden items-center h-10 shrink-0">
          <button
            onClick={() => onToggleTheme?.()}
            className="w-16 min-w-[64px] flex items-center justify-center shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>
    </div>
  )
}
