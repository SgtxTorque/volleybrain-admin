import { useState } from 'react'
import {
  LayoutDashboard, Building2, Users, CreditCard, BarChart3,
  MessageSquare, FileText, Settings, ChevronRight,
  LogOut, Moon, Sun, ArrowLeft, Shield, Search, Bell
} from 'lucide-react'

const SECTION_NAV = {
  overview: [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  ],
  organizations: [
    { id: 'organizations', label: 'All Organizations', icon: Building2 },
  ],
  users: [
    { id: 'users', label: 'All Users', icon: Users },
  ],
  subscriptions: [
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  ],
  analytics: [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ],
  engagement: [
    { id: 'engagement', label: 'Engagement', icon: BarChart3 },
  ],
  funnel: [
    { id: 'funnel', label: 'Registration Funnel', icon: BarChart3 },
  ],
  support: [
    { id: 'support', label: 'Support Inbox', icon: MessageSquare },
  ],
  notifications: [
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ],
  email: [
    { id: 'email', label: 'Email Center', icon: MessageSquare },
  ],
  features: [
    { id: 'features', label: 'Feature Requests', icon: Building2 },
  ],
  compliance: [
    { id: 'compliance', label: 'Compliance', icon: Shield },
  ],
  audit: [
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ],
  settings: [
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
}

export default function PlatformSidebar({
  activeSection = 'overview',
  platformStats = {},
  onExitPlatformMode,
  orgName = 'My Club',
  orgInitials = 'MC',
  isDark = false,
  onToggleTheme,
  onSignOut,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const bg = isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]'
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-slate-200'
  const textPrimary = isDark ? 'text-slate-200' : 'text-slate-700'
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400'
  const hoverBg = isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-200/60'
  const activeBg = isDark ? 'bg-sky-500/10' : 'bg-sky-50'
  const activeText = 'text-[#4BB9EC]'

  const navItems = SECTION_NAV[activeSection] || SECTION_NAV.overview

  return (
    <div
      className={`group fixed left-0 top-14 z-30 h-[calc(100vh-56px)] flex flex-col
        w-16 hover:w-60 ${bg}
        transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        border-r ${borderColor} overflow-hidden`}
    >
      {/* Logo + Platform label */}
      <div className="flex items-center h-12 shrink-0">
        <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-[#4BB9EC]" />
        </div>
        <span className={`text-sm font-bold ${textPrimary} opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap`}>
          Platform
        </span>
      </div>

      {/* Stats line */}
      <div className="px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <p className={`text-[11px] ${textMuted} pl-3`}>
          {platformStats.orgCount || 0} orgs · {platformStats.userCount || 0} users
        </p>
      </div>

      {/* Divider */}
      <div className={`border-b ${borderColor} mx-3 shrink-0`} />

      {/* Search (expanded only) */}
      {activeSection === 'organizations' && (
        <div className="mx-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${borderColor} ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <Search className={`w-3.5 h-3.5 ${textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search orgs..."
              className={`flex-1 bg-transparent text-xs outline-none ${textPrimary} placeholder:${textMuted}`}
            />
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              className={`relative w-full flex items-center gap-3 h-9 rounded-lg transition-colors duration-200 ${
                isActive
                  ? `${activeBg} ${activeText}`
                  : `${textPrimary} ${hoverBg}`
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#4BB9EC]" />
              )}
              <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate pr-2">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Bottom utilities */}
      <div className={`border-t ${borderColor} shrink-0`}>
        {/* Exit to Org */}
        <div className="max-h-0 group-hover:max-h-[60px] overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={onExitPlatformMode}
            className={`w-full flex items-center gap-3 px-4 py-2 ${textPrimary} ${hoverBg} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold truncate">Exit to {orgName}</span>
          </button>
        </div>

        {/* Theme toggle */}
        <div className="max-h-0 group-hover:max-h-[40px] overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-1.5 ${textMuted} hover:${textPrimary} transition-colors`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="text-xs font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* Sign out */}
        <div className="max-h-0 group-hover:max-h-[40px] overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>

        {/* Collapsed icons */}
        <div className="flex group-hover:hidden items-center h-10 shrink-0">
          <button
            onClick={onSignOut}
            className="w-16 min-w-[64px] flex items-center justify-center shrink-0 text-red-400/60 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}
