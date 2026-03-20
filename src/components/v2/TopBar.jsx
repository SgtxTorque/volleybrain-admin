// =============================================================================
// TopBar — V2 sticky top navigation bar
// Props-only: receives all data from parent dashboard page.
// =============================================================================

import { Search, Bell, Settings, Moon, Sun } from 'lucide-react'

export default function TopBar({
  roleLabel = 'Lynx Admin',
  navLinks = [],
  searchPlaceholder = 'Search...',
  onSearchClick,
  notificationCount = 0,
  hasNotifications = false,
  avatarInitials = '',
  avatarGradient = 'linear-gradient(135deg, var(--v2-sky), var(--v2-navy))',
  onSettingsClick,
  onNotificationClick,
  onAvatarClick,
  onThemeToggle,
  isDark = false,
}) {
  const isPlayerDark = isDark

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        height: 'var(--v2-topbar-height)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: isPlayerDark ? 'rgba(6,14,26,0.9)' : 'rgba(255,255,255,0.92)',
        borderBottom: isPlayerDark
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid var(--v2-border-subtle)',
        padding: '0 24px',
        fontFamily: 'var(--v2-font)',
      }}
    >
      {/* ---- Brand Label ---- */}
      <span
        className="v2-topbar-brand"
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: isPlayerDark ? 'var(--v2-gold)' : 'var(--v2-navy)',
          paddingLeft: 72,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {roleLabel}
      </span>

      {/* ---- Nav Links ---- */}
      <nav className="v2-topbar-nav" style={{ display: 'flex', gap: 4, marginLeft: 16, flexShrink: 0 }}>
        {navLinks.map(link => (
          <button
            key={link.pageId}
            onClick={link.onClick}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: link.isActive
                ? (isPlayerDark ? 'rgba(255,215,0,0.08)' : 'var(--v2-surface)')
                : 'transparent',
              color: link.isActive
                ? (isPlayerDark ? 'var(--v2-gold)' : 'var(--v2-navy)')
                : 'var(--v2-text-secondary)',
            }}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* ---- Spacer ---- */}
      <div style={{ marginLeft: 'auto' }} />

      {/* ---- Search Trigger ---- */}
      <button
        onClick={onSearchClick}
        className="v2-topbar-search"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 14px',
          borderRadius: 10,
          fontSize: 13,
          border: isPlayerDark
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid var(--v2-border-subtle)',
          background: isPlayerDark ? 'rgba(255,255,255,0.04)' : 'var(--v2-surface)',
          color: 'var(--v2-text-muted)',
          cursor: 'pointer',
          marginRight: 8,
          whiteSpace: 'nowrap',
        }}
      >
        <Search style={{ width: 14, height: 14 }} />
        <span>{searchPlaceholder}</span>
        <kbd
          className="v2-topbar-kbd"
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: 4,
            background: isPlayerDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            border: isPlayerDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            color: 'var(--v2-text-muted)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* ---- Theme Toggle ---- */}
      <button
        onClick={onThemeToggle}
        title={isDark ? 'Light Mode' : 'Dark Mode'}
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          background: 'transparent',
          color: 'var(--v2-text-muted)',
          marginRight: 4,
        }}
      >
        {isDark ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />}
      </button>

      {/* ---- Notification Bell ---- */}
      <button
        onClick={onNotificationClick}
        title="Notifications"
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          background: 'transparent',
          color: 'var(--v2-text-muted)',
          position: 'relative',
          marginRight: 4,
        }}
      >
        <Bell style={{ width: 18, height: 18 }} />
        {(hasNotifications || notificationCount > 0) && (
          <span style={{
            position: 'absolute',
            top: 6, right: 6,
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#EF4444',
          }} />
        )}
      </button>

      {/* ---- Settings Gear ---- */}
      <button
        onClick={onSettingsClick}
        title="Settings"
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          background: 'transparent',
          color: 'var(--v2-text-muted)',
          marginRight: 8,
        }}
      >
        <Settings style={{ width: 18, height: 18 }} />
      </button>

      {/* ---- Avatar ---- */}
      <button
        onClick={onAvatarClick}
        title="Profile"
        style={{
          width: 32, height: 32, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          background: isPlayerDark
            ? 'linear-gradient(135deg, var(--v2-gold), #FFA500)'
            : avatarGradient,
          color: isPlayerDark ? 'var(--v2-midnight)' : '#FFFFFF',
          fontSize: 12, fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {avatarInitials}
      </button>

      {/* ---- Responsive styles ---- */}
      <style>{`
        @media (max-width: 700px) {
          .v2-topbar-nav { display: none !important; }
          .v2-topbar-kbd { display: none !important; }
          .v2-topbar-brand { padding-left: 16px !important; }
        }
      `}</style>
    </header>
  )
}
