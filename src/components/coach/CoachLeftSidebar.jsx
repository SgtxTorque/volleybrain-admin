import {
  Check, Send, Timer, Users, MessageCircle,
  ChevronRight, Calendar, Target
} from '../../constants/icons'

/**
 * CoachLeftSidebar — Left column (240px) of Coach Dashboard
 * Team Command Center: team header, stats, season record, quick actions, quick links
 */
export default function CoachLeftSidebar({
  selectedTeam,
  coachName,
  rosterCount,
  teamRecord,
  winRate,
  selectedSeason,
  onNavigate,
  navigateToTeamWall,
  openTeamChat,
  onShowCoachBlast,
  onShowWarmupTimer,
}) {
  const sportName = selectedTeam?.seasons?.sports?.name || 'Volleyball'
  const sportIcon = selectedTeam?.seasons?.sports?.icon || '🏐'

  return (
    <aside className="w-[240px] shrink-0 border-r border-slate-200/50 bg-white overflow-y-auto p-5 space-y-5 h-full">
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
            <p className="text-sm font-bold text-slate-900 truncate">{selectedTeam?.name}</p>
            <p className="text-xs text-slate-500">{selectedSeason?.name} · {sportName}</p>
            <p className="text-xs text-slate-400">
              {selectedTeam?.coachRole === 'head' ? 'Head Coach' : 'Assistant'} · {coachName}
            </p>
          </div>
        </div>
      </div>

      {/* Team Stat Badges */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { value: rosterCount, label: 'Players', color: 'text-slate-900' },
          { value: teamRecord.wins, label: 'Wins', color: 'text-emerald-500' },
          { value: teamRecord.losses, label: 'Losses', color: 'text-red-500' },
          { value: `${winRate}%`, label: 'Win %', color: 'text-blue-500' },
        ].map(stat => (
          <div key={stat.label} className="text-center p-2 rounded-xl bg-slate-50">
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Season Record Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Season Record</h3>
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="text-center">
            <div className="text-3xl font-black text-emerald-500">{teamRecord.wins}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Wins</div>
          </div>
          <div className="text-2xl font-bold text-slate-300">-</div>
          <div className="text-center">
            <div className="text-3xl font-black text-red-500">{teamRecord.losses}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Losses</div>
          </div>
        </div>
        <p className="text-xs text-center text-slate-400 mb-3">{winRate}% win rate</p>

        {/* Recent Form */}
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recent Form</p>
        <div className="flex gap-1.5">
          {teamRecord.recentForm.length > 0 ? (
            teamRecord.recentForm.map((g, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  g.result === 'win'
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                    : g.result === 'loss'
                      ? 'bg-red-500/15 text-red-500 border border-red-500/25'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {g.result === 'win' ? 'W' : g.result === 'loss' ? 'L' : 'T'}
              </div>
            ))
          ) : (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-7 h-7 rounded-lg border border-dashed border-slate-200" />
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick Actions</h3>
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
                className="w-full flex items-center gap-3 py-2.5 px-3 hover:bg-slate-50 rounded-xl cursor-pointer text-left"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick Links</h3>
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
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
