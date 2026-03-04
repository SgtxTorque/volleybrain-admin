// =============================================================================
// LynxSidebar — Collapsible icon sidebar (64px collapsed, 228px expanded)
// Shared by Admin and Coach dashboards. Always dark navy regardless of theme.
// Pure CSS hover expansion via Tailwind group + group-hover.
// =============================================================================

import React from 'react'
import {
  LayoutDashboard, Users, UserCog, Shield, DollarSign,
  ClipboardList, Megaphone, Settings, Calendar, BarChart3,
  Trophy, Star, Zap, Target, Shirt, FileText, ChevronRight,
  MessageCircle, Bell, Award, Flame, UserCheck, Home
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
function NavItem({ item, isActive, onNavigate }) {
  const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || LayoutDashboard

  return (
    <button
      onClick={() => onNavigate?.(item.path || item.id)}
      className={`
        relative w-full flex items-center gap-3 h-10 rounded-lg transition-colors duration-200
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
      <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px]" />
      </div>

      {/* Label — hidden when collapsed, shown on hover */}
      <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {item.label}
      </span>

      {/* Badge — only visible when expanded */}
      {item.badge > 0 && (
        <span className="ml-auto mr-4 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </button>
  )
}

// =============================================================================
// SectionLabel — group header for nav sections
// =============================================================================
function SectionLabel({ label }) {
  return (
    <div className="px-5 pt-4 pb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">
        {label}
      </span>
    </div>
  )
}

// =============================================================================
// LynxSidebar
// =============================================================================
export default function LynxSidebar({
  navItems = [],
  orgName = '',
  orgInitials = '',
  orgLogo = null,
  teamName = '',
  teamSub = '',
  userName = '',
  userRole = '',
  activePath = '/dashboard',
  onNavigate,
  contextSlot = null,
}) {
  return (
    <div
      className="group fixed left-0 top-0 z-40 h-screen flex flex-col
        w-16 hover:w-[228px] bg-[#0B1628]
        transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        border-r border-white/[0.06] overflow-hidden"
    >
      {/* ---- Logo Row ---- */}
      <div className="flex items-center h-16 shrink-0">
        <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
          <LynxPaw className="w-7 h-7 text-lynx-sky" />
        </div>
        <span className="text-lg font-black text-white tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Lynx
        </span>
      </div>

      {/* ---- Org/Team Identity ---- */}
      <div className="flex items-center gap-3 px-3 py-3 mx-2 rounded-lg bg-white/[0.04] mb-1">
        {/* Avatar circle — always visible */}
        <div className="w-10 min-w-[40px] h-10 flex items-center justify-center shrink-0">
          {orgLogo ? (
            <img
              src={orgLogo}
              alt={orgName}
              className="w-9 h-9 rounded-lg object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-lynx-sky/20 flex items-center justify-center text-xs font-black text-lynx-sky">
              {orgInitials || '?'}
            </div>
          )}
        </div>
        {/* Text — hidden when collapsed */}
        <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-sm font-bold text-white truncate">{orgName || teamName || 'Organization'}</p>
          <p className="text-[11px] text-slate-400 truncate">{teamSub || 'Season Active'}</p>
        </div>
      </div>

      {/* ---- Context Slot (season/sport switcher for admin) ---- */}
      {contextSlot && (
        <div className="px-3 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {contextSlot}
        </div>
      )}

      {/* ---- Nav Items ---- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin">
        {navItems.map((item, idx) => {
          if (item.type === 'section') {
            return <SectionLabel key={`section-${idx}`} label={item.label} />
          }
          const isActive = activePath === item.path || activePath === `/${item.id}`
          return (
            <NavItem
              key={item.id || idx}
              item={item}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          )
        })}
      </nav>

      {/* ---- Bottom User Row ---- */}
      <div className="border-t border-white/[0.06] flex items-center h-14 shrink-0">
        <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-lynx-sky/20 flex items-center justify-center text-xs font-bold text-lynx-sky">
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
        <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-sm font-semibold text-white truncate">{userName}</p>
          <p className="text-[11px] text-slate-500 truncate">{userRole}</p>
        </div>
      </div>
    </div>
  )
}
