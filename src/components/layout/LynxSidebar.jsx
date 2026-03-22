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
  Trophy, Star, Zap, Target, Shirt, FileText, ChevronRight,
  ChevronDown, Check,
  MessageCircle, Bell, Award, Flame, UserCheck, Home,
  Building2, CreditCard, PieChart, TrendingUp, Download,
  CheckSquare, CalendarCheck, User, LogOut, MapPin,
  Search, Heart
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
// NavItem — icon button with optional label on hover-expand
// =============================================================================
function NavItem({ item, isActive, onNavigate, isPlayer, expanded }) {
  const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || LayoutDashboard

  return (
    <button
      onClick={() => onNavigate?.(item.id, item)}
      className="v2-sidebar-btn"
      data-active={isActive || undefined}
      data-player={isPlayer || undefined}
      data-expanded={expanded || undefined}
      title={expanded ? undefined : item.label}
      style={{
        ...(expanded ? { width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10 } : {}),
        ...(isActive ? {
          background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
          color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
        } : {}),
      }}
    >
      <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
      {expanded && (
        <span style={{
          fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {item.label}
        </span>
      )}
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
}) {
  const isPlayer = activeView === 'player'
  const [expanded, setExpanded] = useState(false)

  const isItemActive = (item) => {
    if (item.teamId) return directTeamWallId === item.teamId
    if (item.playerId) return activePage === `player-${item.playerId}`
    return activePage === item.id
  }

  // Flatten nav groups to get all renderable items for icon-only display
  const flatItems = []
  for (const group of navGroups) {
    if (group.type === 'single') {
      flatItems.push({ ...group, icon: group.icon || group.id, _isSingle: true })
    } else if (group.items) {
      // Add a separator marker
      flatItems.push({ _separator: true, id: `sep-${group.id}` })
      for (const item of group.items) {
        flatItems.push(item)
      }
    }
  }

  return (
    <div
      className="v2-sidebar"
      data-player={isPlayer || undefined}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: expanded ? 220 : 'var(--v2-sidebar-width)',
        height: '100vh',
        background: isPlayer ? 'var(--v2-midnight)' : 'var(--v2-white)',
        borderRight: isPlayer
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid var(--v2-border-subtle)',
        display: 'flex', flexDirection: 'column',
        alignItems: expanded ? 'stretch' : 'center',
        padding: expanded ? '14px 10px 20px' : '14px 0 20px',
        zIndex: 200,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.2s ease, padding 0.2s ease',
        boxShadow: expanded ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* ---- Logo ---- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginBottom: 16, ...(expanded ? { paddingLeft: 2 } : {}) }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
            color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 17,
            flexShrink: 0,
          }}
        >
          L
        </div>
        {expanded && (
          <span style={{
            fontSize: 15, fontWeight: 800,
            color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            Lynx
          </span>
        )}
      </div>

      {/* ---- Nav Items ---- */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: expanded ? 'stretch' : 'center', gap: 2, width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        {flatItems.map((item, idx) => {
          if (item._separator) {
            return (
              <div
                key={item.id}
                style={{
                  width: expanded ? '100%' : 24, height: 1, margin: '6px 0',
                  background: isPlayer ? 'rgba(255,255,255,0.08)' : 'var(--v2-border-subtle)',
                  flexShrink: 0,
                }}
              />
            )
          }

          const active = item._isSingle
            ? (activePage === item.id && !directTeamWallId)
            : isItemActive(item)

          return (
            <NavItem
              key={item.id + (item.teamId || '') + (item.playerId || '')}
              item={item}
              isActive={active}
              onNavigate={onNavigate}
              isPlayer={isPlayer}
              expanded={expanded}
            />
          )
        })}
      </nav>

      {/* ---- Bottom Utilities ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: expanded ? 'stretch' : 'center', gap: 2, flexShrink: 0, paddingTop: 8 }}>
        {/* Separator */}
        <div style={{
          width: expanded ? '100%' : 24, height: 1, marginBottom: 4,
          background: isPlayer ? 'rgba(255,255,255,0.08)' : 'var(--v2-border-subtle)',
        }} />

        {/* Platform Mode */}
        {isPlatformAdmin && (
          <button
            onClick={() => onEnterPlatformMode?.()}
            title={expanded ? undefined : 'Platform Mode'}
            className="v2-sidebar-btn"
            data-expanded={expanded || undefined}
            style={{
              color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-amber)',
              ...(expanded ? { width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10 } : {}),
            }}
          >
            <Shield style={{ width: 18, height: 18, flexShrink: 0 }} />
            {expanded && <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Platform Mode</span>}
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => onNavigate?.('organization')}
          title={expanded ? undefined : 'Settings'}
          className="v2-sidebar-btn"
          data-player={isPlayer || undefined}
          data-expanded={expanded || undefined}
          style={expanded ? { width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10 } : undefined}
        >
          <Settings style={{ width: 18, height: 18, flexShrink: 0 }} />
          {expanded && <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Settings</span>}
        </button>

        {/* Sign Out */}
        <button
          onClick={() => onSignOut?.()}
          title={expanded ? undefined : 'Sign Out'}
          className="v2-sidebar-btn"
          data-expanded={expanded || undefined}
          style={{
            color: isPlayer ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.5)',
            ...(expanded ? { width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10 } : {}),
          }}
        >
          <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
          {expanded && <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Sign Out</span>}
        </button>
      </div>

      {/* ---- Inline styles for sidebar buttons ---- */}
      <style>{`
        .v2-sidebar-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
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
        @media (max-width: 700px) {
          .v2-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
