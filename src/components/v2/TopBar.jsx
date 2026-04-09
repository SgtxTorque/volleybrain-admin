// =============================================================================
// TopBar — V2 sticky top navigation bar
// Props-only: receives all data from parent dashboard page.
// Brand label doubles as role switcher dropdown trigger.
// =============================================================================

import { useState, useRef, useEffect } from 'react'
import { Search, Bell, Settings, Moon, Sun, ChevronDown, Check } from 'lucide-react'

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
  // Role switcher props
  availableRoles = [],
  activeRoleId,
  onRoleSwitch,
  // Organization context
  orgName,
}) {
  const isPlayerDark = isDark
  const [roleOpen, setRoleOpen] = useState(false)
  const roleRef = useRef(null)

  const hasMultipleRoles = availableRoles.length > 1 && onRoleSwitch

  // Close dropdown on click outside
  useEffect(() => {
    if (!roleOpen) return
    function handleClickOutside(e) {
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setRoleOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [roleOpen])

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
      {/* ---- Brand Label / Role Switcher ---- */}
      <div ref={roleRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          className="v2-topbar-brand"
          onClick={hasMultipleRoles ? () => setRoleOpen(!roleOpen) : undefined}
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: isPlayerDark ? 'var(--v2-gold)' : 'var(--v2-navy)',
            paddingLeft: 72,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: hasMultipleRoles ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'inherit',
          }}
        >
          {roleLabel}
          {hasMultipleRoles && (
            <ChevronDown style={{
              width: 14, height: 14,
              transition: 'transform 0.15s ease',
              transform: roleOpen ? 'rotate(180deg)' : 'none',
              opacity: 0.6,
            }} />
          )}
        </button>

        {/* Role Dropdown */}
        {roleOpen && hasMultipleRoles && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 72,
            marginTop: 6,
            width: 240,
            background: '#FFFFFF',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid var(--v2-border-subtle)',
            padding: 6,
            zIndex: 300,
          }}>
            <div style={{
              padding: '6px 10px 4px',
              fontSize: 11, fontWeight: 700,
              color: 'var(--v2-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Switch Role
            </div>
            {availableRoles.map(role => {
              const isActive = role.id === activeRoleId
              return (
                <button
                  key={role.id}
                  onClick={() => { onRoleSwitch(role.id); setRoleOpen(false) }}
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
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--v2-surface)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--v2-navy)' : 'transparent' }}
                >
                  {role.icon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{role.icon}</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{role.label}</div>
                    {role.subtitle && (
                      <div style={{
                        fontSize: 11, fontWeight: 500, lineHeight: 1.2, marginTop: 1,
                        color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--v2-text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {role.subtitle}
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

      {/* ---- Organization Name ---- */}
      {orgName && (
        <span
          className="v2-topbar-org"
          style={{
            marginLeft: 12,
            paddingLeft: 12,
            borderLeft: isPlayerDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--v2-border-subtle)',
            fontSize: 13,
            fontWeight: 600,
            color: isPlayerDark ? 'rgba(255,255,255,0.5)' : 'var(--v2-text-secondary)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {orgName}
        </span>
      )}

      {/* ---- Nav Links ---- */}
      <nav className="v2-topbar-nav" style={{ display: 'flex', gap: 4, marginLeft: 16, flexShrink: 0 }}>
        {navLinks.map(link => {
          const locked = Boolean(link.isLocked)
          return (
            <button
              key={link.pageId}
              onClick={locked ? (e) => { e.preventDefault(); e.stopPropagation() } : link.onClick}
              title={locked ? (link.lockTooltip || 'Not available yet') : undefined}
              aria-disabled={locked}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 600,
                border: 'none',
                cursor: locked ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                background: link.isActive
                  ? (isPlayerDark ? 'rgba(255,215,0,0.08)' : 'var(--v2-surface)')
                  : 'transparent',
                color: locked
                  ? 'var(--v2-text-muted)'
                  : link.isActive
                    ? (isPlayerDark ? 'var(--v2-gold)' : 'var(--v2-navy)')
                    : 'var(--v2-text-secondary)',
                opacity: locked ? 0.55 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {locked && (
                <span aria-hidden="true" style={{ fontSize: 11, lineHeight: 1, opacity: 0.8 }}>🔒</span>
              )}
              {link.label}
            </button>
          )
        })}
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
          .v2-topbar-org { display: none !important; }
        }
      `}</style>
    </header>
  )
}
