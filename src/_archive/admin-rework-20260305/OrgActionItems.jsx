// =============================================================================
// OrgActionItems — Prioritized action list with icons, descriptions, counts
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ClipboardList, DollarSign, FileText, UserCog, ChevronRight, Zap } from 'lucide-react'

const SEVERITY_COLORS = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#4BB9EC',
}

function ActionItem({ icon: Icon, label, count, severity, onClick, isDark }) {
  if (!count || count <= 0) return null
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <span className={`text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{count}</span>
      <ChevronRight className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
    </button>
  )
}

export default function OrgActionItems({ stats = {}, onNavigate }) {
  const { isDark } = useTheme()

  const items = [
    { icon: ClipboardList, label: 'Pending registrations', count: stats.pending, severity: 'critical', page: 'registrations' },
    { icon: DollarSign, label: 'Overdue payments', count: stats.pastDue > 0 ? Math.ceil(stats.pastDue / 100) : 0, severity: 'warning', page: 'payments' },
    { icon: FileText, label: 'Unsigned waivers', count: stats.unsignedWaivers, severity: 'info', page: 'waivers' },
    { icon: UserCog, label: 'Teams need a coach', count: (stats.teams || 0) > (stats.teamsWithCoach || 0) ? (stats.teams - stats.teamsWithCoach) : 0, severity: 'info', page: 'coaches' },
  ].filter(i => i.count > 0)

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Action Items
        </h3>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-emerald-500 text-sm font-semibold">All clear!</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nothing needs attention.</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {items.map((item, idx) => (
            <ActionItem
              key={idx}
              icon={item.icon}
              label={item.label}
              count={item.count}
              severity={item.severity}
              onClick={() => onNavigate?.(item.page)}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  )
}
