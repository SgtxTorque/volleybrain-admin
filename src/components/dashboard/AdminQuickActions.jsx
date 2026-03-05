// =============================================================================
// AdminQuickActions — Grid of task-oriented action buttons with counter badges
// Responsive 3×2 grid that fits within 12×5 card slot
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import {
  ClipboardCheck, DollarSign, Users, Send, CalendarPlus, BarChart3
} from 'lucide-react'

const ACTIONS = [
  { id: 'approve-reg',  icon: ClipboardCheck, label: 'Approve Regs', page: 'registrations', countKey: 'pendingRegistrations' },
  { id: 'record-pay',   icon: DollarSign,     label: 'Payments',     page: 'payments',      countKey: 'overduePayments' },
  { id: 'assign-play',  icon: Users,          label: 'Assign Players', page: 'teams',       countKey: 'unrosteredPlayers' },
  { id: 'send-remind',  icon: Send,           label: 'Reminders',    page: 'blasts',        countKey: 'overdueFamilies' },
  { id: 'create-sched', icon: CalendarPlus,   label: 'Schedule',     page: 'schedule',      countKey: 'teamsNoSchedule' },
  { id: 'view-reports', icon: BarChart3,       label: 'Reports',      page: 'reports',       countKey: null },
]

export default function AdminQuickActions({ counts = {}, onNavigate }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-2xl overflow-hidden h-full ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
    }`}>
      <div className="p-3 h-full flex flex-col">
        {/* Header */}
        <h3 className={`text-xs font-bold uppercase tracking-[1.2px] mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Quick Actions
        </h3>

        {/* 3×2 Grid */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            const count = action.countKey ? (counts[action.countKey] || 0) : 0

            return (
              <button
                key={action.id}
                onClick={() => onNavigate?.(action.page)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04]'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                <Icon className="w-4 h-4 text-lynx-sky" />
                <span className={`text-r-xs font-medium text-center leading-tight truncate w-full ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>
                  {action.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
