// =============================================================================
// AttendancePanel — player checklist with attendance status toggles
// =============================================================================

import { positionColors } from './CourtPlayerCard'

const STATUS_CYCLE = ['here', 'absent', 'unknown']
const STATUS_LABELS = { here: 'Here', absent: 'Absent', unknown: '?' }
const STATUS_COLORS = {
  here: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  absent: { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/30' },
  unknown: { bg: 'bg-amber-500/15', text: 'text-amber-400', ring: 'ring-amber-500/30' },
}

function rsvpToAttendance(rsvpStatus) {
  if (rsvpStatus === 'yes' || rsvpStatus === 'attending') return 'here'
  if (rsvpStatus === 'no') return 'absent'
  return 'unknown'
}

export default function AttendancePanel({ roster, rsvps, attendance, onToggle, theme }) {
  const hereCount = roster.filter(p => {
    const status = attendance?.[p.id] || rsvpToAttendance(rsvps?.[p.id])
    return status === 'here'
  }).length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <h3 className="font-bold text-xl" style={{ color: theme.textPrimary }}>Attendance</h3>
        <span className="text-emerald-400 font-bold text-base">{hereCount} / {roster.length}</span>
      </div>

      {/* Player list */}
      <div className="max-h-64 overflow-y-auto">
        {roster.map(player => {
          const status = attendance?.[player.id] || rsvpToAttendance(rsvps?.[player.id])
          const colors = STATUS_COLORS[status] || STATUS_COLORS.unknown
          const posColor = positionColors[player?.position || player?.team_position] || '#6366F1'

          return (
            <div key={player.id}
              className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-white/[0.02]"
              style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
              {/* Avatar */}
              {player.photo_url ? (
                <img src={player.photo_url} className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: posColor }}>
                  {player.jersey_number || '?'}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate" style={{ color: theme.textPrimary }}>
                  #{player.jersey_number} {player.first_name} {player.last_name?.[0]}.
                </p>
              </div>

              {/* Status chip — clickable to toggle */}
              <button
                onClick={() => {
                  const nextIdx = (STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length
                  onToggle?.(player.id, STATUS_CYCLE[nextIdx])
                }}
                className={`px-3 py-1 rounded-full text-sm font-extrabold uppercase tracking-wider ring-1 transition ${colors.bg} ${colors.text} ${colors.ring}`}>
                {STATUS_LABELS[status]}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
