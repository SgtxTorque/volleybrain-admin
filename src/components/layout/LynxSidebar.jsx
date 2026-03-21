// =============================================================================
// LynxSidebar — V2 SlimSidebar
// Permanently 60px wide. Icon-only navigation. White bg, navy active state.
// Player dark mode: midnight bg, gold active state.
// Backward-compatible: same props interface, same onNavigate callback.
// =============================================================================

import {
  LayoutDashboard, Users, UserCog, Shield, DollarSign,
  ClipboardList, Megaphone, Settings, Calendar, BarChart3,
  Trophy, Star, Zap, Target, Shirt, FileText, ChevronRight,
  MessageCircle, Bell, Award, Flame, UserCheck, Home,
  Building2, CreditCard, PieChart, TrendingUp, Download,
  CheckSquare, CalendarCheck, User, LogOut, MapPin,
  Search
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


// =============================================================================
// NavItem — single icon button
// =============================================================================
function NavItem({ item, isActive, onNavigate, isPlayer }) {
  const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || LayoutDashboard

  return (
    <button
      onClick={() => onNavigate?.(item.id, item)}
      className="v2-sidebar-btn"
      data-active={isActive || undefined}
      data-player={isPlayer || undefined}
      title={item.label}
      style={isActive ? {
        background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
        color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
      } : undefined}
    >
      <Icon style={{ width: 18, height: 18 }} />
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
  navGroups = [], activePage = '', activePathname = '', directTeamWallId = null, onNavigate,
  orgName = '', orgInitials = '', orgLogo = null, teamName = '', teamSub = '',
  profile = null, activeView = 'admin', availableViews = [], onSwitchRole,
  onToggleTheme, onSignOut, onNavigateToProfile, isDark = false,
  notificationCount = 0, onOpenNotifications,
  isPlatformAdmin = false, onEnterPlatformMode,
}) {
  const isPlayer = activeView === 'player'

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
      style={{
        position: 'fixed', top: 0, left: 0,
        width: 'var(--v2-sidebar-width)', height: '100vh',
        background: isPlayer ? 'var(--v2-midnight)' : 'var(--v2-white)',
        borderRight: isPlayer
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid var(--v2-border-subtle)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14px 0 20px',
        zIndex: 200,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ---- Logo ---- */}
      <div
        style={{
          width: 34, height: 34, borderRadius: 10,
          background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
          color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 17,
          flexShrink: 0,
          marginBottom: 16,
        }}
      >
        L
      </div>

      {/* ---- Nav Items ---- */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        {flatItems.map((item, idx) => {
          if (item._separator) {
            return (
              <div
                key={item.id}
                style={{
                  width: 24, height: 1, margin: '6px 0',
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
            />
          )
        })}
      </nav>

      {/* ---- Bottom Utilities ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, paddingTop: 8 }}>
        {/* Separator */}
        <div style={{
          width: 24, height: 1, marginBottom: 4,
          background: isPlayer ? 'rgba(255,255,255,0.08)' : 'var(--v2-border-subtle)',
        }} />

        {/* Platform Mode */}
        {isPlatformAdmin && (
          <button
            onClick={() => onEnterPlatformMode?.()}
            title="Platform Mode"
            className="v2-sidebar-btn"
            style={{
              color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-amber)',
            }}
          >
            <Shield style={{ width: 18, height: 18 }} />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => onNavigate?.('organization')}
          title="Settings"
          className="v2-sidebar-btn"
          data-player={isPlayer || undefined}
        >
          <Settings style={{ width: 18, height: 18 }} />
        </button>

        {/* Sign Out */}
        <button
          onClick={() => onSignOut?.()}
          title="Sign Out"
          className="v2-sidebar-btn"
          style={{
            color: isPlayer ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.5)',
          }}
        >
          <LogOut style={{ width: 18, height: 18 }} />
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
