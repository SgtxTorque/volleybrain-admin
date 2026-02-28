import {
  Check, Send, Timer, Users, MessageCircle,
  ChevronRight, Calendar, Target, AlertCircle
} from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * CoachLeftSidebar — Left column (240px) of Coach Dashboard
 * Team header, coach-level stats, needs attention, quick actions, quick links
 */
export default function CoachLeftSidebar({
  selectedTeam,
  coachName,
  totalPlayers,
  teamsCount,
  winRate,
  needsAttentionItems,
  selectedSeason,
  onNavigate,
  navigateToTeamWall,
  openTeamChat,
  onShowCoachBlast,
  onShowWarmupTimer,
}) {
  const { isDark } = useTheme()
  const sportName = selectedTeam?.seasons?.sports?.name || 'Volleyball'

  return (
    <aside className={`w-[240px] shrink-0 ${isDark ? 'bg-lynx-midnight' : 'bg-white'} overflow-y-auto p-5 space-y-5 h-full scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Team Header */}
      <div>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: selectedTeam?.color || '#3B82F6' }}
          >
            {selectedTeam?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{selectedTeam?.name}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{selectedSeason?.name} · {sportName}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              {selectedTeam?.coachRole === 'head' ? 'Head Coach' : 'Assistant'} · {coachName}
            </p>
          </div>
        </div>
      </div>

      {/* Coach Stat Badges (coach-level, not team-specific) */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { value: totalPlayers, label: 'Players', color: isDark ? 'text-white' : 'text-slate-900' },
          { value: teamsCount, label: 'Teams', color: 'text-blue-500' },
          { value: `${winRate}%`, label: 'Win %', color: 'text-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className={`text-center p-2 rounded-xl ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-lynx-slate'} font-bold`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Needs Attention */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Needs Attention</h3>
          {needsAttentionItems?.length > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
              {needsAttentionItems.length} item{needsAttentionItems.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {needsAttentionItems?.length > 0 ? (
          <div className="space-y-1.5">
            {needsAttentionItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'} text-left`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto text-slate-400" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-emerald-500 font-semibold">All caught up!</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'} mb-3`}>Quick Actions</h3>
        <div className="space-y-0.5">
          {[
            {
              icon: Check, label: 'Take Attendance',
              onClick: () => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') },
            },
            { icon: Send, label: 'Message Parents', onClick: () => onShowCoachBlast?.() },
            { icon: Timer, label: 'Start Warmup', onClick: () => onShowWarmupTimer?.() },
            { icon: Users, label: 'Team Hub', onClick: () => navigateToTeamWall?.(selectedTeam?.id) },
            { icon: MessageCircle, label: 'Team Chat', onClick: () => openTeamChat?.(selectedTeam?.id) },
          ].map(action => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`w-full flex items-center gap-3 py-2.5 px-3 ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'} rounded-xl cursor-pointer text-left`}
              >
                <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{action.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'} mb-3`}>Quick Links</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Calendar, label: 'Schedule', page: 'schedule' },
            { icon: Check, label: 'Attendance', page: 'attendance' },
            { icon: Target, label: 'Game Prep', page: 'gameprep' },
            { icon: MessageCircle, label: 'Messages', page: 'chats' },
          ].map(action => {
            const Icon = action.icon
            return (
              <button
                key={action.page}
                onClick={() => onNavigate?.(action.page)}
                className={`flex items-center gap-2 p-2.5 rounded-xl ${isDark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-lynx-cloud hover:bg-slate-100'} text-left`}
              >
                <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
