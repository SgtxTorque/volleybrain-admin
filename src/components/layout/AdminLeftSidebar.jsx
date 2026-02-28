// =============================================================================
// AdminLeftSidebar — Single continuous panel: org logo, stats, collections,
// needs attention, quick actions (2x2 grid)
// =============================================================================

import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import {
  ClipboardList, DollarSign, UserPlus, Megaphone,
  Zap, FileWarning, Flame, FileText
} from 'lucide-react'

// =============================================================================
// Helper: get initials from org name
// =============================================================================
function getOrgInitials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

// =============================================================================
// Attention Item
// =============================================================================
function AttentionItem({ icon: Icon, label, value, isAmount, onClick, isDark }) {
  if (value == null || value <= 0) return null
  const display = isAmount ? `$${Number(value).toLocaleString()}` : value
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2.5 text-left transition rounded-lg px-1
        ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-lynx-cloud'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
        <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </div>
      <span className={`text-sm font-bold flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
      <span className={`${isAmount ? 'text-base font-black text-orange-500' : 'text-sm font-bold'} ${!isAmount ? (isDark ? 'text-orange-400' : 'text-orange-600') : ''}`}>
        {display}
      </span>
    </button>
  )
}

// =============================================================================
// Quick Action Tile (small square)
// =============================================================================
function QuickActionTile({ icon: Icon, label, badge, onClick, isDark, iconColor }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition
        ${isDark
          ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]'
          : 'bg-lynx-cloud hover:bg-slate-100 border border-lynx-silver/60'
        }`}
    >
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-lynx-sky text-white text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
      <Icon className="w-5 h-5" style={{ color: iconColor }} />
      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
    </button>
  )
}

// =============================================================================
// Divider
// =============================================================================
function Divider({ isDark }) {
  return <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
}

// =============================================================================
// Component
// =============================================================================
export default function AdminLeftSidebar({ stats, season, onNavigate }) {
  const { isDark, accent } = useTheme()
  const { orgName, orgLogo } = useOrgBranding()

  const panelClass = isDark
    ? 'bg-lynx-charcoal/90 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
    : 'bg-white border border-lynx-silver/60 shadow-[0_2px_20px_rgba(0,0,0,0.06)]'

  const initials = getOrgInitials(orgName)

  // Collections progress
  const totalExpected = stats.totalExpected || stats.totalCollected || 0
  const totalCollected = stats.totalCollected || 0
  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <div className={`rounded-xl overflow-hidden ${panelClass}`}>
      {/* ---- Org Identity ---- */}
      <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center">
        {orgLogo ? (
          <img
            src={orgLogo}
            alt={orgName}
            className="w-16 h-16 rounded-full object-cover mb-3"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-xl font-black text-white"
            style={{ backgroundColor: accent.primary }}
          >
            {initials}
          </div>
        )}
        <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {orgName || 'My Organization'}
        </h3>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {season?.name || 'No season selected'}{season?.status ? ` · ${season.status.charAt(0).toUpperCase() + season.status.slice(1)}` : ''}
        </p>
      </div>

      <Divider isDark={isDark} />

      {/* ---- Stat Numbers Row ---- */}
      <div className="px-5 py-4 flex items-center justify-around">
        <div className="text-center">
          <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {stats.totalRegistrations || 0}
          </p>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
            Players
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {stats.teams || 0}
          </p>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
            Teams
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {stats.coachCount || 0}
          </p>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
            Coaches
          </p>
        </div>
      </div>

      <Divider isDark={isDark} />

      {/* ---- Collections Bar ---- */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Collections</span>
          <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{collectionPct}%</span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, collectionPct)}%`, backgroundColor: accent.primary }}
          />
        </div>
        <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
          ${totalCollected.toLocaleString()} / ${totalExpected.toLocaleString()}
        </p>
      </div>

      <Divider isDark={isDark} />

      {/* ---- Needs Attention ---- */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Needs Attention
          </h4>
        </div>
        <div>
          <AttentionItem
            icon={ClipboardList}
            label="Pending registrations"
            value={stats.pending}
            onClick={() => onNavigate('registrations')}
            isDark={isDark}
          />
          <AttentionItem
            icon={Flame}
            label="Overdue payments"
            value={stats.pastDue > 0 ? stats.pastDue : null}
            isAmount
            onClick={() => onNavigate('payments')}
            isDark={isDark}
          />
          <AttentionItem
            icon={FileWarning}
            label="Unsigned waivers"
            value={stats.unsignedWaivers}
            onClick={() => onNavigate('waivers')}
            isDark={isDark}
          />
        </div>
      </div>

      <Divider isDark={isDark} />

      {/* ---- Quick Actions (2x2 grid) ---- */}
      <div className="px-5 py-4 pb-5">
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickActionTile
            icon={ClipboardList}
            label="Regs"
            badge={stats.pending}
            onClick={() => onNavigate('registrations')}
            isDark={isDark}
            iconColor={isDark ? '#94A3B8' : '#64748B'}
          />
          <QuickActionTile
            icon={DollarSign}
            label="Payments"
            onClick={() => onNavigate('payments')}
            isDark={isDark}
            iconColor={isDark ? '#60A5FA' : '#3B82F6'}
          />
          <QuickActionTile
            icon={UserPlus}
            label="Invite"
            onClick={() => onNavigate('registrations')}
            isDark={isDark}
            iconColor={isDark ? '#818CF8' : '#6366F1'}
          />
          <QuickActionTile
            icon={Megaphone}
            label="Blast"
            onClick={() => onNavigate('blasts')}
            isDark={isDark}
            iconColor={isDark ? '#F87171' : '#EF4444'}
          />
        </div>
      </div>
    </div>
  )
}
