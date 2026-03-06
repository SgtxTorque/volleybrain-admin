// =============================================================================
// SeasonRecordCard — Big W/L display with last game result
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Trophy } from 'lucide-react'

export default function SeasonRecordCard({ selectedTeam, onNavigate }) {
  const { isDark } = useTheme()
  const record = selectedTeam?._record || { wins: 0, losses: 0, lastResult: null }

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col overflow-hidden`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Season Record
        </h3>
      </div>

      <div className="flex items-center justify-center gap-4 flex-1">
        <div className="text-center">
          <p className="text-r-2xl font-extrabold text-emerald-500 tabular-nums whitespace-nowrap">{record.wins}</p>
          <p className={`text-[10px] font-bold uppercase tracking-[1px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Wins</p>
        </div>
        <div className={`text-r-xl font-light ${isDark ? 'text-white/10' : 'text-slate-200'}`}>|</div>
        <div className="text-center">
          <p className="text-r-2xl font-extrabold text-red-500 tabular-nums whitespace-nowrap">{record.losses}</p>
          <p className={`text-[10px] font-bold uppercase tracking-[1px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Losses</p>
        </div>
      </div>

      {record.lastResult && (
        <p className={`text-[10px] text-center mt-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Last: {record.lastResult}
        </p>
      )}
    </div>
  )
}
