// =============================================================================
// TeamHealthCard — Performance + participation metrics (full width)
// Attendance %, average team rating, record, win rate
// NOT engagement — purely on-court performance and participation
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { TrendingUp } from 'lucide-react'

function ProgressBar({ value, max = 100, color = 'bg-lynx-sky', isDark }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={`h-2 rounded-full w-full ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
      <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function getHealthColor(pct) {
  if (pct >= 80) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function getBarColor(pct) {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getHealthLabel(pct) {
  if (pct >= 90) return 'On fire — this team is thriving'
  if (pct >= 75) return 'Looking good — keep building momentum'
  if (pct >= 50) return 'Developing — room to grow'
  return 'Needs work — time to rally the squad'
}

export default function TeamHealthCard({
  attendanceRate = 0,
  gameAttendance = 0,
  practiceAttendance = 0,
  avgRating = 0,
  record = { wins: 0, losses: 0 },
  winRate = 0,
}) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  const overallHealth = Math.round((attendanceRate * 0.4 + winRate * 0.3 + Math.min(avgRating * 10, 100) * 0.3))

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Team Health
          </h3>
        </div>
        <span className={`text-base font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {getHealthLabel(overallHealth)}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance */}
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Overall Attendance
          </p>
          <p className={`text-3xl font-black tabular-nums ${getHealthColor(attendanceRate)}`}>
            {attendanceRate}%
          </p>
          <ProgressBar value={attendanceRate} color={getBarColor(attendanceRate)} isDark={isDark} />
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Games: {gameAttendance}%
            </span>
            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Practices: {practiceAttendance}%
            </span>
          </div>
        </div>

        {/* Average Rating */}
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Avg Team Rating
          </p>
          <p className={`text-3xl font-black tabular-nums ${getHealthColor(avgRating * 10)}`}>
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </p>
          <ProgressBar value={avgRating} max={10} color={getBarColor(avgRating * 10)} isDark={isDark} />
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {avgRating >= 8 ? 'Elite level' : avgRating >= 6 ? 'Strong' : avgRating > 0 ? 'Developing' : 'No evaluations yet'}
          </p>
        </div>

        {/* Record */}
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Season Record
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 tabular-nums">{record.wins}</span>
            <span className={`text-xl font-bold ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>—</span>
            <span className="text-3xl font-black text-red-400 tabular-nums">{record.losses}</span>
          </div>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {record.wins + record.losses === 0 ? 'No games played yet' : `${record.wins + record.losses} games played`}
          </p>
        </div>

        {/* Win Rate */}
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Win Rate
          </p>
          <p className={`text-3xl font-black tabular-nums ${getHealthColor(winRate)}`}>
            {winRate}%
          </p>
          <ProgressBar value={winRate} color={getBarColor(winRate)} isDark={isDark} />
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {winRate >= 75 ? 'Dominant' : winRate >= 50 ? 'Competitive' : winRate > 0 ? 'Building' : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
