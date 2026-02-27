// =============================================================================
// OrgSidebar — Left sidebar matching v0 org-sidebar.tsx
// Org card, stats, collections progress, needs attention, quick actions
// =============================================================================

import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import {
  AlertTriangle, ClipboardCheck, DollarSign, FileWarning,
  Megaphone, UserPlus, CreditCard
} from 'lucide-react'

function getOrgInitials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function StatItem({ value, label, isDark }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  )
}

function AttentionItem({ icon, label, badge, badgeColor, onClick, isDark }) {
  if (!badge || badge === '0' || badge === 0) return null
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
      }`}
    >
      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{icon}</span>
      <span className={`flex-1 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
        {badge}
      </span>
    </button>
  )
}

function QuickAction({ icon, label, badge, onClick, isDark }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isDark
          ? 'bg-slate-700/60 border border-white/[0.06]'
          : 'bg-white border border-slate-100'
      }`}
    >
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {icon}
      <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{label}</span>
    </button>
  )
}

export default function OrgSidebar({ stats, season, onNavigate }) {
  const { isDark, accent } = useTheme()
  const { orgName, orgLogo } = useOrgBranding()

  const initials = getOrgInitials(orgName)

  // Collections progress
  const totalExpected = stats.totalExpected || stats.totalCollected || 0
  const totalCollected = stats.totalCollected || 0
  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <aside className={`flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto border-r py-8 pl-6 pr-4 ${
      isDark ? 'border-white/[0.06] bg-slate-900' : 'border-slate-200/50 bg-slate-50'
    }`}>
      {/* Org Card */}
      <div className={`flex flex-col items-center gap-4 rounded-2xl p-6 shadow-sm ${
        isDark ? 'bg-slate-800 border border-white/[0.06]' : 'bg-white'
      }`}>
        {orgLogo ? (
          <img
            src={orgLogo}
            alt={orgName}
            className="h-16 w-16 rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
            style={{ backgroundColor: accent.primary || '#2c3e50' }}
          >
            {initials}
          </div>
        )}
        <div className="text-center">
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {orgName || 'My Organization'}
          </h2>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {season?.name || 'No season selected'}
            {season?.status ? ` · ${season.status.charAt(0).toUpperCase() + season.status.slice(1)}` : ''}
          </p>
        </div>
        <div className="flex w-full items-center justify-around pt-2">
          <StatItem value={stats.totalRegistrations || 0} label="PLAYERS" isDark={isDark} />
          <StatItem value={stats.teams || 0} label="TEAMS" isDark={isDark} />
          <StatItem value={stats.coachCount || 0} label="COACHES" isDark={isDark} />
        </div>
      </div>

      {/* Collections Progress */}
      <div className={`rounded-2xl p-5 shadow-sm ${
        isDark ? 'bg-slate-800 border border-white/[0.06]' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Collections</span>
          <span className="text-sm font-semibold" style={{ color: accent.primary || '#0d9488' }}>{collectionPct}%</span>
        </div>
        <div className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, collectionPct)}%`, backgroundColor: accent.primary || '#0d9488' }}
          />
        </div>
        <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          ${totalCollected.toLocaleString()} / ${totalExpected.toLocaleString()}
        </p>
      </div>

      {/* Needs Attention */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 px-1 pb-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Needs Attention
          </span>
        </div>
        <AttentionItem
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Pending registrations"
          badge={stats.pending > 0 ? String(stats.pending) : null}
          badgeColor={isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}
          onClick={() => onNavigate('registrations')}
          isDark={isDark}
        />
        <AttentionItem
          icon={<DollarSign className="h-4 w-4" />}
          label="Overdue payments"
          badge={stats.pastDue > 0 ? `$${stats.pastDue.toLocaleString()}` : null}
          badgeColor={isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}
          onClick={() => onNavigate('payments')}
          isDark={isDark}
        />
        <AttentionItem
          icon={<FileWarning className="h-4 w-4" />}
          label="Unsigned waivers"
          badge={stats.unsignedWaivers > 0 ? String(stats.unsignedWaivers) : null}
          badgeColor={isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-700'}
          onClick={() => onNavigate('waivers')}
          isDark={isDark}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <span className={`px-1 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Quick Actions
        </span>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={<ClipboardCheck className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />}
            label="Regs"
            badge={stats.pending}
            onClick={() => onNavigate('registrations')}
            isDark={isDark}
          />
          <QuickAction
            icon={<CreditCard className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
            label="Payments"
            onClick={() => onNavigate('payments')}
            isDark={isDark}
          />
          <QuickAction
            icon={<UserPlus className={`h-5 w-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />}
            label="Invite"
            onClick={() => onNavigate('registrations')}
            isDark={isDark}
          />
          <QuickAction
            icon={<Megaphone className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />}
            label="Blast"
            onClick={() => onNavigate('blasts')}
            isDark={isDark}
          />
        </div>
      </div>
    </aside>
  )
}
