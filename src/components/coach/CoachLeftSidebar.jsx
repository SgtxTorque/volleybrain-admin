import {
  Check, Send, Timer, Users, MessageCircle, Star,
  ChevronRight, AlertCircle
} from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * CoachLeftSidebar — Left column (240px) of Coach Dashboard
 * Team header, coach-level stats, onboarding placeholder, needs attention, quick actions
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
  onShowShoutout,
}) {
  const { isDark } = useTheme()
  const sportName = selectedTeam?.seasons?.sports?.name || 'Volleyball'
  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'
  const primaryText = isDark ? 'text-white' : 'text-slate-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'

  return (
    <aside className={`hidden xl:flex w-[240px] shrink-0 flex-col ${isDark ? 'bg-lynx-midnight border-r border-lynx-border-dark' : 'bg-white border-r border-lynx-silver/50'} overflow-y-auto p-5 space-y-5 h-full scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* 1. Team Header / Coach Identity Card */}
      <div>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: selectedTeam?.color || '#4BB9EC' }}
          >
            {selectedTeam?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${primaryText} truncate`}>{selectedTeam?.name}</p>
            <p className={`text-xs ${secondaryText}`}>{selectedSeason?.name} · {sportName}</p>
            <p className={`text-xs ${secondaryText}`}>
              {selectedTeam?.coachRole === 'head' ? 'Head Coach' : 'Assistant'} · {coachName}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Coach Stat Badges (row of 3) */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { value: totalPlayers, label: 'Players', color: primaryText },
          { value: teamsCount, label: 'Teams', color: 'text-lynx-sky' },
          { value: `${winRate}%`, label: 'Win %', color: 'text-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className={`text-center p-2 rounded-xl ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className={`text-xs uppercase tracking-wide ${secondaryText} font-bold`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 3. Coach Onboarding Journey — placeholder */}
      {/* TODO: Wire to JourneyContext once coach journey steps are defined */}
      <div className={`${cardBg} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Coach Setup</span>
          <span className="text-xs font-bold text-lynx-sky">3/7</span>
        </div>
        <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'} overflow-hidden mb-2`}>
          <div className="h-full rounded-full bg-lynx-sky" style={{ width: '43%' }} />
        </div>
        <button className={`flex items-center gap-2 text-xs font-semibold ${secondaryText} hover:text-lynx-sky w-full`}>
          <span>NEXT:</span>
          <span className={primaryText}>Set up your lineup</span>
          <ChevronRight className="w-3 h-3 ml-auto" />
        </button>
      </div>

      {/* 4. Needs Attention */}
      <div className={`${cardBg} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Needs Attention</h3>
          {needsAttentionItems?.length > 0 && (
            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
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

      {/* 5. Quick Actions — now includes "Give Shoutout" */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText} mb-3`}>Quick Actions</h3>
        <div className="space-y-0.5">
          {[
            {
              icon: Check, label: 'Take Attendance',
              onClick: () => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') },
            },
            { icon: Send, label: 'Message Parents', onClick: () => onShowCoachBlast?.() },
            { icon: Timer, label: 'Start Warmup', onClick: () => onShowWarmupTimer?.() },
            { icon: Star, label: 'Give Shoutout', onClick: () => onShowShoutout?.() },
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

    </aside>
  )
}
