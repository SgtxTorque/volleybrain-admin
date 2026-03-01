import {
  Swords, ClipboardCheck, Heart, Users, BarChart3, ClipboardList
} from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * CoachCommandStrip — 6 smart status tiles measuring rolling team health
 * Tiles: Game Prep, Attendance, Engagement, Roster, Stats, Lineups
 * Each tile has an icon, value, label, and status pill (Healthy / Needs Work / Behind / No Data)
 */
export default function CoachCommandStrip({
  nextGame,
  lineupSetForNextGame,
  rsvpPercentNextGame,
  lastGameStatsEntered,
  avgAttendanceLast3,
  weeklyEngagement,
  rosterCount,
  rosterIssues,
  pendingStats,
  lineupsSet,
  upcomingGamesCount,
  onNavigate,
}) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'
  const primaryText = isDark ? 'text-white' : 'text-slate-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'

  // Status pill variants
  const STATUS = {
    healthy: {
      pillClasses: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
      dotColor: 'bg-emerald-500',
      text: 'Healthy'
    },
    attention: {
      pillClasses: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
      dotColor: 'bg-amber-500',
      text: 'Needs Work'
    },
    behind: {
      pillClasses: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
      dotColor: 'bg-red-500',
      text: 'Behind'
    },
    noData: {
      pillClasses: isDark ? 'bg-white/[0.06] text-slate-500' : 'bg-slate-100 text-slate-400',
      dotColor: isDark ? 'bg-slate-600' : 'bg-slate-300',
      text: 'No Data'
    }
  }

  // === Tile 1: Game Prep ===
  let gamePrepValue = 'No games'
  let gamePrepDetail = ''
  let gamePrepStatus = STATUS.noData
  if (nextGame) {
    const allGood = lineupSetForNextGame && rsvpPercentNextGame >= 80 && lastGameStatsEntered
    const gameDate = new Date(nextGame.event_date + 'T00:00:00')
    const now = new Date()
    const hoursUntil = (gameDate - now) / (1000 * 60 * 60)
    const daysUntil = Math.ceil(hoursUntil / 24)

    gamePrepValue = nextGame.opponent_name || 'Game'

    // Countdown nudge
    if (gameDate.toDateString() === now.toDateString()) {
      gamePrepDetail = 'TODAY'
    } else if (daysUntil === 1) {
      gamePrepDetail = 'TOMORROW'
    } else if (daysUntil <= 3) {
      gamePrepDetail = `in ${daysUntil} days`
    }

    // Lineup warning
    if (!lineupSetForNextGame && daysUntil <= 3) {
      gamePrepDetail += gamePrepDetail ? ' · No lineup' : 'No lineup set'
    }

    if (allGood) {
      gamePrepStatus = STATUS.healthy
    } else if (hoursUntil < 24 && hoursUntil > 0) {
      gamePrepStatus = STATUS.behind
    } else {
      gamePrepStatus = STATUS.attention
    }
  }

  // === Tile 2: Attendance ===
  const attendanceValue = avgAttendanceLast3 != null ? `${avgAttendanceLast3}%` : '—'
  let attendanceStatus = STATUS.noData
  if (avgAttendanceLast3 != null) {
    if (avgAttendanceLast3 >= 85) attendanceStatus = STATUS.healthy
    else if (avgAttendanceLast3 >= 70) attendanceStatus = STATUS.attention
    else attendanceStatus = STATUS.behind
  }

  // === Tile 3: Engagement ===
  const engagementTotal = (weeklyEngagement?.shoutouts || 0) + (weeklyEngagement?.challenges || 0) + (weeklyEngagement?.posts || 0)
  const engagementValue = engagementTotal > 0 ? `${engagementTotal} acts` : '—'
  let engagementStatus = STATUS.noData
  if (engagementTotal > 0) {
    if (engagementTotal >= 8) engagementStatus = STATUS.healthy
    else if (engagementTotal >= 3) engagementStatus = STATUS.attention
    else engagementStatus = STATUS.behind
  }

  // === Tile 4: Roster ===
  const rosterValue = `${rosterCount} players`
  let rosterStatus = STATUS.healthy
  if (rosterIssues >= 3) rosterStatus = STATUS.behind
  else if (rosterIssues >= 1) rosterStatus = STATUS.attention
  else if (rosterCount === 0) rosterStatus = STATUS.noData

  // === Tile 5: Stats ===
  const statsValue = pendingStats > 0 ? `${pendingStats} need` : 'All done'
  let statsStatus = STATUS.healthy
  if (pendingStats >= 2) statsStatus = STATUS.behind
  else if (pendingStats === 1) statsStatus = STATUS.attention

  // === Tile 6: Lineups ===
  let lineupsValue = '—'
  let lineupsStatus = STATUS.noData
  if (upcomingGamesCount > 0) {
    lineupsValue = `${lineupsSet}/${upcomingGamesCount} set`
    if (lineupsSet >= upcomingGamesCount) lineupsStatus = STATUS.healthy
    else if (lineupsSet > 0) lineupsStatus = STATUS.attention
    else lineupsStatus = STATUS.behind
  }

  const tiles = [
    { icon: Swords, label: 'Game Prep', value: gamePrepValue, detail: gamePrepDetail, status: gamePrepStatus, action: () => onNavigate?.('gameprep') },
    { icon: ClipboardCheck, label: 'Attendance', value: attendanceValue, status: attendanceStatus, action: () => onNavigate?.('attendance') },
    { icon: Heart, label: 'Engagement', value: engagementValue, status: engagementStatus, action: () => onNavigate?.('teams') },
    { icon: Users, label: 'Roster', value: rosterValue, status: rosterStatus, action: () => onNavigate?.('teams') },
    { icon: BarChart3, label: 'Stats', value: statsValue, detail: pendingStats > 0 ? `${pendingStats} need scores` : '', status: statsStatus, action: () => onNavigate?.('gameprep') },
    { icon: ClipboardList, label: 'Lineups', value: lineupsValue, status: lineupsStatus, action: () => onNavigate?.('gameprep') },
  ]

  return (
    <div className="max-w-[800px] mx-auto w-full">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {tiles.map(tile => {
          const Icon = tile.icon
          return (
            <button
              key={tile.label}
              onClick={tile.action}
              className={`${cardBg} rounded-xl shadow-sm px-3 py-2.5 text-center hover:shadow-md transition group`}
            >
              <Icon className="w-5 h-5 mx-auto mb-1 text-lynx-sky" />
              <p className={`text-lg font-bold ${primaryText} truncate`}>{tile.value}</p>
              {tile.detail && (
                <p className="text-[10px] font-bold text-amber-500 truncate">{tile.detail}</p>
              )}
              <p className={`text-[10px] uppercase tracking-wider font-bold ${secondaryText}`}>{tile.label}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-1.5 ${tile.status.pillClasses}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tile.status.dotColor}`} />
                {tile.status.text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
