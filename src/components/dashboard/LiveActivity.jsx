// =============================================================================
// LiveActivity — Right sidebar matching v0 live-activity.tsx
// Scrollable feed of recent activity items with colored icon avatars
// =============================================================================

import React from 'react'
import { DollarSign, ClipboardCheck, FileCheck, Trophy } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const ACTIVITY_CONFIG = {
  payment: {
    Icon: DollarSign,
    bgLight: 'bg-amber-100',
    bgDark: 'bg-amber-500/15',
    textLight: 'text-amber-600',
    textDark: 'text-amber-400',
  },
  registration: {
    Icon: ClipboardCheck,
    bgLight: 'bg-teal-100',
    bgDark: 'bg-teal-500/15',
    textLight: 'text-teal-600',
    textDark: 'text-teal-400',
  },
  waiver: {
    Icon: FileCheck,
    bgLight: 'bg-emerald-100',
    bgDark: 'bg-emerald-500/15',
    textLight: 'text-emerald-600',
    textDark: 'text-emerald-400',
  },
  game: {
    Icon: Trophy,
    bgLight: 'bg-purple-100',
    bgDark: 'bg-purple-500/15',
    textLight: 'text-purple-600',
    textDark: 'text-purple-400',
  },
}

function timeAgo(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function LiveActivity({ activities }) {
  const { isDark } = useTheme()

  return (
    <aside className={`flex w-[330px] shrink-0 flex-col gap-4 overflow-y-auto border-l py-8 pl-6 pr-6 ${
      isDark ? 'border-white/[0.06] bg-slate-900' : 'border-slate-200/50 bg-slate-50'
    }`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Live Activity
      </h3>

      <div className="flex flex-col">
        {activities && activities.length > 0 ? (
          activities.slice(0, 15).map((activity, i) => {
            const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.registration
            const Icon = config.Icon

            return (
              <div
                key={i}
                className={`flex items-start gap-3 py-4 ${
                  i > 0 ? (isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-200') : ''
                }`}
              >
                {/* Icon Avatar */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isDark ? config.bgDark : config.bgLight
                }`}>
                  <Icon className={`h-3.5 w-3.5 ${isDark ? config.textDark : config.textLight}`} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activity.action}
                    {activity.highlight && (
                      <span> &mdash; {activity.highlight}</span>
                    )}
                  </p>
                  <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {activity.name}
                    {activity.name && activity.timestamp && ' · '}
                    {activity.timestamp && timeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center">
            <ClipboardCheck className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No recent activity</p>
          </div>
        )}
      </div>
    </aside>
  )
}
