// =============================================================================
// LynxSidebar — V2 SlimSidebar
// Permanently 60px wide. Icon-only navigation. White bg, navy active state.
// Player dark mode: midnight bg, gold active state.
// Backward-compatible: same props interface, same onNavigate callback.
// =============================================================================

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProgram } from '../../contexts/ProgramContext'
import { useSeason } from '../../contexts/SeasonContext'
import {
  LayoutDashboard, Users, UserCog, Shield, DollarSign,
  ClipboardList, Megaphone, Settings, Calendar, BarChart3,
  Trophy, Star, Zap, Target, Shirt, FileText, ChevronRight, LayoutGrid,
  ChevronDown, Check, Menu, X, Layers,
  MessageCircle, Bell, Award, Flame, UserCheck, Home,
  Building2, CreditCard, PieChart, TrendingUp, Download,
  CheckSquare, CalendarCheck, User, LogOut, MapPin,
  Search, Heart, Mail, PlayCircle, ListOrdered, Lock,
  AlertTriangle
} from 'lucide-react'

// =============================================================================
// PROGRESSIVE NAV PREREQUISITES (admin only)
// Groups with prereqs are shown muted + locked until the requirement is met
// =============================================================================
const ADMIN_NAV_PREREQS = {
  'teams-rosters': { needs: 'season', tooltip: 'Create a season to unlock teams & rosters' },
  'registration':  { needs: 'season', tooltip: 'Create a season to open registration' },
  'scheduling':    { needs: 'season', tooltip: 'Create a season to schedule events' },
  'practice':      { needs: 'season', tooltip: 'Create a season to plan practices' },
  'game':          { needs: 'season', tooltip: 'Create a season to access game day' },
  'communication': { needs: 'orgSetup', tooltip: 'Finish club setup to unlock messaging' },
  'money':         { needs: 'orgSetup', tooltip: 'Finish club setup to unlock payments' },
  'insights':      { needs: 'season', tooltip: 'Reports appear once you have a season' },
}

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
function NavItem({ item, isActive, onNavigate, isPlayer, isLocked = false, lockTooltip = '' }) {
  const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || LayoutDashboard

  const handleClick = () => {
    if (isLocked) return // swallowed — tooltip communicates why
    onNavigate?.(item.id, item)
  }

  return (
    <button
      onClick={handleClick}
      className="v2-sidebar-btn"
      data-active={isActive || undefined}
      data-player={isPlayer || undefined}
      title={isLocked ? lockTooltip : ''}
      aria-disabled={isLocked || undefined}
      style={{
        width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
        borderLeft: isActive ? `3px solid ${isPlayer ? 'var(--v2-gold)' : '#4BB9EC'}` : '3px solid transparent',
        ...(isActive ? {
          background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
          color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
        } : {}),
        ...(isLocked ? {
          opacity: 0.45,
          cursor: 'not-allowed',
        } : {}),
      }}
    >
      <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
      <span style={{
        flex: 1, textAlign: 'left',
        fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {item.label}
      </span>
      {isLocked && (
        <Lock style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.7 }} />
      )}
      {!isLocked && item.badge > 0 && (
        <span className="v2-sidebar-badge">{item.badge > 9 ? '9+' : item.badge}</span>
      )}
      {!isLocked && item.hasBadge && !item.badge && (
        <span className="v2-sidebar-dot" />
      )}
    </button>
  )
}


// =============================================================================
// ProgramsSidebarSection — shows programs with nested seasons
// =============================================================================
const STATUS_PRIORITY = { active: 0, upcoming: 1, draft: 2, completed: 3, archived: 4 }

function ProgramsSidebarSection({ isPlayer, onNavigate }) {
  const navigate = useNavigate()
  const { programs, selectedProgram, selectProgram } = useProgram()
  const { allSeasons, selectedSeason, selectSeason } = useSeason()
  const [expandedPrograms, setExpandedPrograms] = useState(new Set())

  // Auto-expand the program that contains the selected season
  useEffect(() => {
    if (selectedSeason?.program_id) {
      setExpandedPrograms(prev => {
        if (prev.has(selectedSeason.program_id)) return prev
        const next = new Set(prev)
        next.add(selectedSeason.program_id)
        return next
      })
    }
  }, [selectedSeason?.program_id])

  const orphanedSeasons = (allSeasons || []).filter(s => !s.program_id)

  // Show section if there are programs OR orphaned seasons to surface
  if ((!programs || programs.length === 0) && orphanedSeasons.length === 0) return null

  const toggleProgram = (programId) => {
    setExpandedPrograms(prev => {
      const next = new Set(prev)
      if (next.has(programId)) next.delete(programId)
      else next.add(programId)
      return next
    })
  }

  const getSeasonsForProgram = (programId) => {
    return (allSeasons || [])
      .filter(s => s.program_id === programId)
      .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99))
  }

  const statusDot = (status) => {
    if (status === 'active') return { background: '#10B981', boxShadow: '0 0 4px rgba(16,185,129,0.4)' }
    if (status === 'upcoming') return { background: '#F59E0B' }
    if (status === 'draft') return { background: '#94A3B8' }
    return { background: '#64748B', opacity: 0.5 }
  }

  return (
    <div data-coachmark="sidebar-programs" style={{ marginBottom: 4 }}>
      {/* Section header */}
      <div style={{
        padding: '6px 12px 4px',
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: isPlayer ? 'rgba(255,255,255,0.25)' : 'var(--v2-text-muted)',
      }}>
        Programs
      </div>

      {programs.map(program => {
        const seasons = getSeasonsForProgram(program.id)
        const isExpanded = expandedPrograms.has(program.id)
        const isSelected = selectedProgram?.id === program.id
        const icon = program.icon || program.sport?.icon || '📋'

        return (
          <div key={program.id}>
            {/* Program row */}
            <button
              onClick={() => {
                selectProgram(program)
                toggleProgram(program.id)
                navigate(`/programs/${program.id}`)
              }}
              className="v2-sidebar-btn"
              data-player={isPlayer || undefined}
              style={{
                width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 8,
                ...(isSelected ? {
                  background: isPlayer ? 'rgba(245,158,11,0.12)' : 'var(--v2-surface)',
                  color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
                  fontWeight: 700,
                } : {}),
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0, width: 18, textAlign: 'center' }}>{icon}</span>
              <span style={{
                flex: 1, textAlign: 'left',
                fontSize: 12.5, fontWeight: isSelected ? 700 : 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {program.name}
              </span>
              {seasons.length > 0 && (
                <ChevronRight style={{
                  width: 11, height: 11, flexShrink: 0,
                  transition: 'transform 0.15s ease',
                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                  opacity: 0.35,
                }} />
              )}
            </button>

            {/* Nested seasons */}
            {isExpanded && seasons.length > 0 && (
              <div style={{ paddingLeft: 12 }}>
                {seasons.map(season => {
                  const isActiveSeason = selectedSeason?.id === season.id
                  return (
                    <button
                      key={season.id}
                      onClick={() => {
                        selectSeason(season)
                        selectProgram(program)
                        navigate(`/programs/${program.id}`)
                      }}
                      className="v2-sidebar-btn"
                      data-player={isPlayer || undefined}
                      style={{
                        width: '100%', justifyContent: 'flex-start', paddingLeft: 16, gap: 8,
                        height: 30,
                        ...(isActiveSeason ? {
                          background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
                          color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
                          fontWeight: 700,
                          borderLeft: `3px solid ${isPlayer ? 'var(--v2-gold)' : '#4BB9EC'}`,
                        } : {
                          borderLeft: '3px solid transparent',
                        }),
                      }}
                    >
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        ...statusDot(season.status),
                      }} />
                      <span style={{
                        fontSize: 11.5, fontWeight: isActiveSeason ? 700 : 500,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {season.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Unlinked Seasons — orphaned seasons not assigned to any program */}
      {orphanedSeasons.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            padding: '6px 12px 4px',
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: '#D97706',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <AlertTriangle style={{ width: 11, height: 11 }} />
            Unlinked Seasons
          </div>
          {orphanedSeasons.map(season => {
            const isActiveSeason = selectedSeason?.id === season.id
            return (
              <button
                key={season.id}
                onClick={() => {
                  selectSeason(season)
                  navigate('/settings/seasons')
                }}
                className="v2-sidebar-btn"
                data-player={isPlayer || undefined}
                title="This season isn't linked to a program. Edit it to assign a program."
                style={{
                  width: '100%', justifyContent: 'flex-start', paddingLeft: 16, gap: 8,
                  height: 30,
                  ...(isActiveSeason ? {
                    background: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
                    color: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
                    fontWeight: 700,
                  } : {}),
                }}
              >
                <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0, color: '#D97706' }} />
                <span style={{
                  fontSize: 11.5, fontWeight: isActiveSeason ? 700 : 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {season.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
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

  // ---- Progressive unlock state (admin only) ----
  const { organization } = useAuth()
  const { allSeasons } = useSeason()
  const hasOrgSetup = Boolean(organization?.settings?.setup_complete)
  const hasSeason = Boolean((allSeasons || []).length > 0)
  const unlockState = { orgSetup: hasOrgSetup, season: hasSeason }

  // Compute lock state for a given group id (admin view only)
  const getGroupLock = (groupId) => {
    if (activeView !== 'admin') return null
    const req = ADMIN_NAV_PREREQS[groupId]
    if (!req) return null
    return unlockState[req.needs] ? null : { tooltip: req.tooltip }
  }

  // Track previously-locked groups so we can highlight ones that just unlocked
  const [previouslyLocked, setPreviouslyLocked] = useState(null)
  const [justUnlocked, setJustUnlocked] = useState(new Set())

  useEffect(() => {
    if (activeView !== 'admin') return
    const currentlyLocked = new Set(
      Object.keys(ADMIN_NAV_PREREQS).filter(groupId => getGroupLock(groupId))
    )
    if (previouslyLocked === null) {
      // First run — just capture state, no celebration
      setPreviouslyLocked(currentlyLocked)
      return
    }
    // Find items that were locked but are now unlocked
    const unlocked = [...previouslyLocked].filter(id => !currentlyLocked.has(id))
    if (unlocked.length > 0) {
      setJustUnlocked(new Set(unlocked))
      // Clear the celebration after 2.5s
      const t = setTimeout(() => setJustUnlocked(new Set()), 2500)
      setPreviouslyLocked(currentlyLocked)
      return () => clearTimeout(t)
    }
    setPreviouslyLocked(currentlyLocked)
  }, [activeView, hasOrgSetup, hasSeason])

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on navigate
  const handleMobileNavigate = (pageId, params) => {
    setMobileMenuOpen(false)
    onNavigate?.(pageId, params)
  }

  return (
    <>
    {/* ---- Mobile Header Bar (visible < 1024px) ---- */}
    <div className="lynx-mobile-header" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 250,
      height: 52, background: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
      borderBottom: isPlayer ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--v2-border-subtle)',
      display: 'none', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', fontFamily: 'var(--v2-font)',
    }}>
      <button onClick={() => setMobileMenuOpen(true)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        color: isPlayer ? 'rgba(255,255,255,0.7)' : 'var(--v2-navy)',
      }}>
        <Menu style={{ width: 22, height: 22 }} />
      </button>
      <span className="truncate max-w-[200px]" style={{ fontWeight: 800, fontSize: 14, color: isPlayer ? '#FFFFFF' : 'var(--v2-navy)', letterSpacing: '-0.01em' }}>
        {orgName || 'Lynx'}
      </span>
      {onOpenNotifications && (
      <button onClick={() => onOpenNotifications()} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative',
        color: isPlayer ? 'rgba(255,255,255,0.5)' : 'var(--v2-text-muted)',
      }}>
        <Bell style={{ width: 20, height: 20 }} />
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8,
            background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{notificationCount > 9 ? '9+' : notificationCount}</span>
        )}
      </button>
      )}
    </div>

    {/* ---- Mobile Slide-Out Overlay ---- */}
    {mobileMenuOpen && (
      <div className="lynx-mobile-overlay" style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileMenuOpen(false)} />
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
          background: isPlayer ? 'var(--v2-midnight)' : '#FFFFFF',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--v2-font)',
        }}>
          {/* Close header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: isPlayer ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--v2-border-subtle)',
          }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: isPlayer ? '#FFFFFF' : 'var(--v2-navy)' }}>Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: isPlayer ? 'rgba(255,255,255,0.5)' : 'var(--v2-text-muted)',
            }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
          {/* Nav items — reuse the same groups */}
          <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {navGroups.map((group) => {
              if (group.type === 'single') {
                const active = activePage === group.id && !directTeamWallId
                const IconComp = ICON_MAP[group.icon] || ICON_MAP[group.id] || Home
                return (
                  <button key={group.id} onClick={() => handleMobileNavigate(group.id)}
                    className="v2-sidebar-btn" data-player={isPlayer || undefined}
                    style={{
                      width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
                      background: active ? (isPlayer ? 'rgba(245,158,11,0.12)' : 'var(--v2-surface)') : 'transparent',
                      color: active ? (isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)') : undefined,
                      fontWeight: active ? 700 : 600,
                    }}>
                    <IconComp style={{ width: 18, height: 18, flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{group.label}</span>
                  </button>
                )
              }
              // Group with items
              const isExpanded = expandedGroups.has(group.id)
              return (
                <div key={group.id}>
                  <button onClick={() => toggleGroup(group.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer',
                      color: isPlayer ? 'rgba(255,255,255,0.35)' : 'var(--v2-text-muted)',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                    <ChevronDown style={{ width: 12, height: 12, transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                    {group.label}
                  </button>
                  {isExpanded && group.items?.map(item => {
                    const active = isItemActive(item)
                    const IconComp = ICON_MAP[item.icon] || ICON_MAP[item.id] || Star
                    return (
                      <button key={item.id} onClick={() => {
                        if (item.teamId) handleMobileNavigate(`teamwall-${item.teamId}`)
                        else if (item.playerId) handleMobileNavigate(`player-profile-${item.playerId}`)
                        else handleMobileNavigate(item.id)
                      }}
                        className="v2-sidebar-btn" data-player={isPlayer || undefined}
                        style={{
                          width: '100%', justifyContent: 'flex-start', paddingLeft: 28, gap: 10,
                          background: active ? (isPlayer ? 'rgba(245,158,11,0.12)' : 'var(--v2-surface)') : 'transparent',
                          color: active ? (isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)') : undefined,
                          fontWeight: active ? 700 : 600,
                        }}>
                        <IconComp style={{ width: 16, height: 16, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5 }}>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </nav>
          {/* Bottom actions */}
          <div style={{ padding: '8px 10px 16px', borderTop: isPlayer ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--v2-border-subtle)' }}>
            <button onClick={() => { setMobileMenuOpen(false); onSignOut?.() }}
              className="v2-sidebar-btn"
              style={{ width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10, color: 'rgba(239,68,68,0.6)' }}>
              <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ---- Desktop Sidebar ---- */}
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
      <nav data-coachmark="sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, width: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="lynx-sidebar-nav">
        {navGroups.map((group, groupIndex) => {
          if (group.type === 'single') {
            const singleItem = { ...group, icon: group.icon || group.id }
            const active = activePage === group.id && !directTeamWallId
            // Show Programs section after Dashboard for admin/coach views
            const showPrograms = groupIndex === 0 && (activeView === 'admin' || activeView === 'coach')
            return (
              <div key={group.id}>
                <NavItem
                  item={singleItem}
                  isActive={active}
                  onNavigate={onNavigate}
                  isPlayer={isPlayer}
                />
                {showPrograms && <ProgramsSidebarSection isPlayer={isPlayer} onNavigate={onNavigate} />}
              </div>
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

          // Progressive unlock (admin only): is this group locked?
          const groupLock = getGroupLock(group.id)
          const isGroupLocked = Boolean(groupLock)
          const isJustUnlocked = justUnlocked.has(group.id)

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className={`v2-sidebar-btn${isJustUnlocked ? ' v2-sidebar-unlock-pulse' : ''}`}
                data-player={isPlayer || undefined}
                title={isGroupLocked ? groupLock.tooltip : ''}
                style={{
                  width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
                  ...(hasActiveChild && !isExpanded ? {
                    color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
                    fontWeight: 700,
                  } : {}),
                  ...(isGroupLocked ? { opacity: 0.45 } : {}),
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
                {isGroupLocked ? (
                  <Lock style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.7 }} />
                ) : (
                  <ChevronRight style={{
                    width: 12, height: 12, flexShrink: 0,
                    transition: 'transform 0.15s ease',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    opacity: 0.4,
                  }} />
                )}
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
                      isLocked={isGroupLocked}
                      lockTooltip={isGroupLocked ? groupLock.tooltip : ''}
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

        {/* Platform Mode — hidden on mobile/tablet, visible on desktop only */}
        {isPlatformAdmin && (
          <div className="hidden lg:block">
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
          </div>
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
        /* Progressive unlock celebration — pulse + glow briefly */
        @keyframes lynxUnlockPulse {
          0%   { box-shadow: 0 0 0 0 rgba(75,185,236,0.6); transform: scale(1); }
          40%  { box-shadow: 0 0 0 6px rgba(75,185,236,0); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(75,185,236,0); transform: scale(1); }
        }
        .v2-sidebar-unlock-pulse {
          animation: lynxUnlockPulse 1.2s ease-out 2;
          background: rgba(75,185,236,0.08) !important;
        }
        /* Mobile: hide desktop sidebar, show mobile header */
        @media (max-width: 1023px) {
          .v2-sidebar { display: none !important; }
          .lynx-mobile-header { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .lynx-mobile-header { display: none !important; }
        }
      `}</style>
    </div>
    </>
  )
}
