// =============================================================================
// AdminQuickActions — Grid of task-oriented action buttons with counter badges
// Badges show live counts of pending items from Supabase data
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import {
  ClipboardCheck, DollarSign, Users, Send, CalendarPlus, BarChart3
} from 'lucide-react'

const ACTIONS = [
  { id: 'approve-reg',  icon: ClipboardCheck, label: 'Approve Registrations', page: 'registrations', countKey: 'pendingRegistrations' },
  { id: 'record-pay',   icon: DollarSign,     label: 'Record Payments',       page: 'payments',      countKey: 'overduePayments' },
  { id: 'assign-play',  icon: Users,          label: 'Assign Players',        page: 'teams',         countKey: 'unrosteredPlayers' },
  { id: 'send-remind',  icon: Send,           label: 'Send Reminders',        page: 'blasts',        countKey: 'overdueFamilies' },
  { id: 'create-sched', icon: CalendarPlus,   label: 'Create Schedule',       page: 'schedule',      countKey: 'teamsNoSchedule' },
  { id: 'view-reports', icon: BarChart3,       label: 'View Reports',          page: 'reports',       countKey: null },
]

/**
 * @param {Object} props
 * @param {Object} props.counts - { pendingRegistrations, overduePayments, unrosteredPlayers, overdueFamilies, teamsNoSchedule }
 * @param {Function} props.onNavigate
 */
export default function AdminQuickActions({ counts = {}, onNavigate }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-2xl overflow-hidden ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <h3 className={`text-xl font-bold tracking-wide uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Quick Actions
        </h3>
      </div>

      {/* Grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            const count = action.countKey ? (counts[action.countKey] || 0) : 0

            return (
              <button
                key={action.id}
                onClick={() => onNavigate?.(action.page)}
                className={`relative flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl transition-all ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04]'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {/* Counter badge */}
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
                    {count > 99 ? '99+' : count}
                  </span>
                )}

                <Icon className={`w-6 h-6 ${isDark ? 'text-lynx-sky' : 'text-lynx-sky'}`} />
                <span className={`text-base font-medium text-center leading-tight ${
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
