import {
  ClipboardList, UserCheck, Star, BarChart3, MessageCircle, Check
} from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * CoachCommandStrip — 6 smart status tiles in a row
 * Each tile shows an icon, value, label, and a status dot.
 */
export default function CoachCommandStrip({
  roster,
  nextEvent,
  nextGame,
  rsvpCounts,
  weeklyShoutouts,
  pendingStats,
  unreadMessages,
  lineupCount,
  onNavigate,
  onShowShoutout,
  openTeamChat,
  selectedTeam,
}) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'
  const primaryText = isDark ? 'text-white' : 'text-slate-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'

  // Attendance tile
  const nextRsvp = nextEvent ? rsvpCounts?.[nextEvent.id] : null
  const attendanceMarked = nextRsvp?.going || 0
  const attendanceTotal = roster?.length || 0
  const attendanceStatus = !nextEvent ? 'bg-slate-400' : attendanceMarked === attendanceTotal && attendanceTotal > 0 ? 'bg-emerald-500' : attendanceMarked > 0 ? 'bg-amber-500' : 'bg-slate-400'

  // Lineups tile
  const lineupStatus = !nextGame ? 'bg-slate-400' : lineupCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'

  // RSVPs tile
  const rsvpResponded = nextRsvp?.total || 0
  const rsvpPercent = attendanceTotal > 0 ? (rsvpResponded / attendanceTotal) * 100 : 0
  const rsvpStatus = !nextEvent ? 'bg-slate-400' : rsvpPercent >= 80 ? 'bg-emerald-500' : rsvpPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'

  // Shoutouts tile
  const shoutoutStatus = weeklyShoutouts >= 3 ? 'bg-emerald-500' : weeklyShoutouts >= 1 ? 'bg-amber-500' : 'bg-slate-400'

  // Stats tile
  const statsStatus = pendingStats === 0 ? 'bg-emerald-500' : 'bg-red-500'

  // Messages tile
  const msgStatus = unreadMessages > 0 ? 'bg-amber-500' : 'bg-emerald-500'

  const tiles = [
    {
      icon: Check, label: 'Attendance',
      value: nextEvent ? `${attendanceMarked}/${attendanceTotal}` : '—',
      status: attendanceStatus,
      action: () => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') },
    },
    {
      icon: ClipboardList, label: 'Lineups',
      value: lineupCount > 0 ? `${lineupCount} set` : 'None',
      status: lineupStatus,
      action: () => onNavigate?.('gameprep'),
    },
    {
      icon: UserCheck, label: 'RSVPs',
      value: nextEvent ? `${rsvpResponded}/${attendanceTotal}` : '—',
      status: rsvpStatus,
      action: () => onNavigate?.('schedule'),
    },
    {
      icon: Star, label: 'Shoutouts',
      value: `${weeklyShoutouts} week`,
      status: shoutoutStatus,
      action: () => onShowShoutout?.(),
    },
    {
      icon: BarChart3, label: 'Stats',
      value: pendingStats > 0 ? `${pendingStats} need` : '0',
      status: statsStatus,
      action: () => onNavigate?.('gameprep'),
    },
    {
      icon: MessageCircle, label: 'Messages',
      value: unreadMessages > 0 ? `${unreadMessages} new` : '0',
      status: msgStatus,
      action: () => openTeamChat?.(selectedTeam?.id),
    },
  ]

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {tiles.map(tile => {
        const Icon = tile.icon
        return (
          <button
            key={tile.label}
            onClick={tile.action}
            className={`${cardBg} rounded-xl shadow-sm p-3 text-center hover:shadow-md transition group`}
          >
            <Icon className="w-5 h-5 mx-auto mb-1 text-lynx-sky" />
            <p className={`text-lg font-bold ${primaryText}`}>{tile.value}</p>
            <p className={`text-[10px] uppercase tracking-wider font-bold ${secondaryText}`}>{tile.label}</p>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1 ${tile.status}`} />
          </button>
        )
      })}
    </div>
  )
}
