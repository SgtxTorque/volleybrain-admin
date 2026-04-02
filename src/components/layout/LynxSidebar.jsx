// =============================================================================
// LynxSidebar — V2 SlimSidebar
// Permanently 60px wide. Icon-only navigation. White bg, navy active state.
// Player dark mode: midnight bg, gold active state.
// Backward-compatible: same props interface, same onNavigate callback.
// =============================================================================

import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard, Users, UserCog, Shield, DollarSign,
  ClipboardList, Megaphone, Settings, Calendar, BarChart3,
  Trophy, Star, Zap, Target, Shirt, FileText, ChevronRight, LayoutGrid,
  ChevronDown, Check,
  MessageCircle, Bell, Award, Flame, UserCheck, Home,
  Building2, CreditCard, PieChart, TrendingUp, Download,
  CheckSquare, CalendarCheck, User, LogOut, MapPin,
  Search, Heart, Mail, PlayCircle, ListOrdered
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
  mail: Mail, email: Mail,
  'play-circle': PlayCircle, 'list-ordered': ListOrdered, 'clipboard-list': ClipboardList,
  'layout-grid': LayoutGrid,
}


// Role icon mapping for the role switcher
const ROLE_ICON_MAP = {
  admin: Shield,
  coach: UserCog,
  parent: Heart,
  player: Star,
  team_manager: ClipboardList,
}

// Role colors for the indicator dot
const ROLE_COLORS = {
  admin: 'var(--v2-navy)',
  coach: '#2563EB',
  parent: '#EC4899',
  player: 'var(--v2-gold)',
  team_manager: '#8B5CF6',
}


// =============================================================================
// RoleSwitcher — compact role indicator + popover
// =============================================================================
function RoleSwitcher({ activeView, availableViews, onSwitchRole, isPlayer }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const popoverRef = useRef(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPopoverPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      })
    }
    setOpen(!open)
  }

  // Hide if 1 or fewer roles
  if (!availableViews || availableViews.length <= 1) return null

  const ActiveIcon = ROLE_ICON_MAP[activeView] || Shield
  const activeColor = ROLE_COLORS[activeView] || 'var(--v2-navy)'

  return (
    <div style={{ flexShrink: 0, marginBottom: 8 }}>
      {/* Indicator button */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Switch Role"
        style={{
          width: 34, height: 26, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 2,
          border: 'none', cursor: 'pointer',
          background: isPlayer ? 'rgba(255,255,255,0.08)' : 'var(--v2-surface)',
          color: isPlayer ? 'var(--v2-gold)' : activeColor,
          transition: 'background 0.15s ease',
        }}
      >
        <ActiveIcon style={{ width: 14, height: 14 }} />
        <ChevronDown style={{ width: 10, height: 10, opacity: 0.5 }} />
      </button>

      {/* Popover — rendered with position:fixed to escape sidebar overflow clipping */}
      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            transform: 'translateY(-50%)',
            width: 240,
            background: '#FFFFFF',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid var(--v2-border-subtle)',
            padding: 6,
            zIndex: 9999,
          }}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--v2-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Switch Role
          </div>
          {availableViews.map(view => {
            const RoleIcon = ROLE_ICON_MAP[view.id] || Shield
            const isActive = view.id === activeView
            return (
              <button
                key={view.id}
                onClick={() => { onSwitchRole?.(view.id); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  background: isActive ? 'var(--v2-navy)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--v2-text-primary)',
                  transition: 'background 0.12s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--v2-surface)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <RoleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{view.label}</div>
                  {view.description && (
                    <div style={{
                      fontSize: 11, fontWeight: 500, lineHeight: 1.2, marginTop: 1,
                      color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--v2-text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {view.description}
                    </div>
                  )}
                </div>
                {isActive && <Check style={{ width: 14, height: 14, flexShrink: 0, opacity: 0.7 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


// =============================================================================
// NavItem — always expanded with label, left border accent for active state
// =============================================================================
function NavItem({ item, isActive, onNavigate, isPlayer }) {
  const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || LayoutDashboard

  return (
    <button
      onClick={() => onNavigate?.(item.id, item)}
      className="v2-sidebar-btn"
      data-active={isActive || undefined}
      data-player={isPlayer || undefined}
      style={{
        width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
        borderLeft: isActive ? `3px solid ${isPlayer ? 'var(--v2-gold)' : '#4BB9EC'}` : '3px solid transparent',
        ...(isActive ? {
          background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
          color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
        } : {}),
      }}
    >
      <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
      <span style={{
        fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {item.label}
      </span>
      {item.badge > 0 && (
        <span className="v2-sidebar-badge">{item.badge > 9 ? '9+' : item.badge}</span>
      )}
      {item.hasBadge && !item.badge && (
        <span className="v2-sidebar-dot" />
      )}
    </button>
  )
}


// =============================================================================
// LynxSidebar — V2
// =============================================================================
export default function LynxSidebar({
  navGroups = [], activePage = '', directTeamWallId = null, onNavigate,
  orgName = '',
  profile = null, activeView = 'admin', availableViews = [], onSwitchRole,
  onToggleTheme, onSignOut, onNavigateToProfile, isDark = false,
  notificationCount = 0, onOpenNotifications,
  isPlatformAdmin = false, onEnterPlatformMode,
  onSettingsClick,
}) {
  const isPlayer = activeView === 'player'

  // Accordion state — track which groups are expanded
  // Auto-expand the group containing the active page
  const getActiveGroupId = () => {
    for (const group of navGroups) {
      if (group.type === 'group' && group.items) {
        for (const item of group.items) {
          if (item.id === activePage || (item.teamId && directTeamWallId === item.teamId) || (item.playerId && (activePage === `player-${item.playerId}` || activePage === `player-profile-${item.playerId}`))) {
            return group.id
          }
        }
      }
    }
    return null
  }

  const [expandedGroups, setExpandedGroups] = useState(new Set())

  // Auto-expand active group when activePage changes
  // Exception: parent "myplayers" group with 4+ children stays collapsed unless
  // the user navigates to a child profile page (which lives inside that group)
  useEffect(() => {
    const activeGroupId = getActiveGroupId()
    if (activeGroupId) {
      // Check if this is the "myplayers" group with 4+ dynamic children
      const group = navGroups.find(g => g.id === activeGroupId)
      if (group?.id === 'myplayers' && group.items?.length >= 4) {
        // Only auto-expand if active page is actually a child profile inside this group
        const isChildProfile = group.items.some(item =>
          item.playerId && (activePage === `player-${item.playerId}` || activePage === `player-profile-${item.playerId}`)
        )
        if (!isChildProfile) return // Keep collapsed
      }
      setExpandedGroups(prev => {
        const next = new Set(prev)
        next.add(activeGroupId)
        return next
      })
    }
  }, [activePage, directTeamWallId])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const isItemActive = (item) => {
    if (item.teamId) return directTeamWallId === item.teamId
    if (item.playerId) return activePage === `player-${item.playerId}`
    return activePage === item.id
  }

  return (
    <div
      className="v2-sidebar lynx-sidebar"
      data-player={isPlayer || undefined}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: 'var(--v2-sidebar-width)',
        height: '100vh',
        background: isPlayer ? 'var(--v2-midnight)' : 'var(--v2-white)',
        borderRight: 'none',
        display: 'flex', flexDirection: 'column',
        alignItems: 'stretch',
        padding: '14px 10px 20px',
        zIndex: 200,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ---- Logo ---- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginBottom: 16, paddingLeft: 2 }}>
        <img src="/lynx-logo.png" alt="Lynx" style={{ height: 28, objectFit: 'contain' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }} />
        <div style={{
          display: 'none', width: 34, height: 34, borderRadius: 10,
          background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
          color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
          alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 17, flexShrink: 0,
        }}>L</div>
      </div>

      {/* ---- Nav Items with Section Headers ---- */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, width: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="lynx-sidebar-nav">
        {navGroups.map((group) => {
          if (group.type === 'single') {
            const singleItem = { ...group, icon: group.icon || group.id }
            const active = activePage === group.id && !directTeamWallId
            return (
              <NavItem
                key={group.id}
                item={singleItem}
                isActive={active}
                onNavigate={onNavigate}
                isPlayer={isPlayer}
              />
            )
          }

          // Collapsible group
          const isExpanded = expandedGroups.has(group.id)
          const hasActiveChild = (group.items || []).some(item =>
            item.id === activePage ||
            (item.teamId && directTeamWallId === item.teamId) ||
            (item.playerId && (activePage === `player-${item.playerId}` || activePage === `player-profile-${item.playerId}`))
          )
          const GroupIcon = ICON_MAP[group.icon] || ICON_MAP[group.id] || LayoutDashboard

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="v2-sidebar-btn"
                data-player={isPlayer || undefined}
                style={{
                  width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
                  ...(hasActiveChild && !isExpanded ? {
                    color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
                    fontWeight: 700,
                  } : {}),
                }}
              >
                <GroupIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span style={{
                  flex: 1, textAlign: 'left',
                  fontSize: 12.5, fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {group.label}
                </span>
                <ChevronRight style={{
                  width: 12, height: 12, flexShrink: 0,
                  transition: 'transform 0.15s ease',
                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                  opacity: 0.4,
                }} />
              </button>
              {isExpanded && (
                <div style={{ paddingLeft: 8, overflow: 'hidden' }}>
                  {(group.items || []).map(item => (
                    <NavItem
                      key={item.id + (item.teamId || '') + (item.playerId || '')}
                      item={item}
                      isActive={isItemActive(item)}
                      onNavigate={onNavigate}
                      isPlayer={isPlayer}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ---- Bottom Utilities ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, flexShrink: 0, paddingTop: 8 }}>
        {/* Separator */}
        <div style={{
          width: '100%', height: 1, marginBottom: 4,
          background: isPlayer ? 'rgba(255,255,255,0.08)' : 'var(--v2-border-subtle)',
        }} />

        {/* Platform Mode */}
        {isPlatformAdmin && (
          <button
            onClick={() => onEnterPlatformMode?.()}
            className="v2-sidebar-btn"
            style={{
              width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
              color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-amber)',
            }}
          >
            <Shield style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Platform Mode</span>
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => onSettingsClick ? onSettingsClick() : onNavigate?.('organization')}
          className="v2-sidebar-btn"
          data-player={isPlayer || undefined}
          style={{ width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10 }}
        >
          <Settings style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Settings</span>
        </button>

        {/* Sign Out */}
        <button
          onClick={() => onSignOut?.()}
          className="v2-sidebar-btn"
          style={{
            width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
            color: isPlayer ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.5)',
          }}
        >
          <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Sign Out</span>
        </button>
      </div>

      {/* ---- Inline styles for sidebar buttons + scrollbar ---- */}
      <style>{`
        .v2-sidebar-btn {
          width: 100%;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-left: 12px;
          gap: 10px;
          position: relative;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          flex-shrink: 0;
          color: var(--v2-text-muted);
          background: transparent;
        }
        .v2-sidebar-btn:hover {
          background: var(--v2-surface);
          color: var(--v2-text-secondary);
        }
        .v2-sidebar-btn[data-player]:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
        }
        .v2-sidebar-btn[data-player] {
          color: rgba(255,255,255,0.35);
        }
        .v2-sidebar-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          background: #EF4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          line-height: 1;
        }
        .v2-sidebar-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--v2-amber);
        }
        /* Hidden scrollbar — still scrollable */
        .lynx-sidebar::-webkit-scrollbar { width: 0px; display: none; }
        .lynx-sidebar { scrollbar-width: none; -ms-overflow-style: none; }
        .lynx-sidebar-nav::-webkit-scrollbar { width: 0; display: none; }
        @media (max-width: 700px) {
          .v2-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
