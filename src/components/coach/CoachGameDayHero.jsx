import { Calendar, MapPin, Clock, ClipboardList, Zap, UserCheck, Timer, Shield } from '../../constants/icons'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return hour12 + ':' + minutes + ' ' + ampm
  } catch {
    return timeStr
  }
}

function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  if (diff < 0) return `${Math.abs(diff)}d ago`
  if (diff <= 7) return `${diff}d`
  return `${Math.ceil(diff / 7)}w`
}

function formatDateLong(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * CoachGameDayHero — The centerpiece hero card showing next game or practice
 */
export default function CoachGameDayHero({
  nextGame,
  nextEvent,
  selectedTeam,
  teamRecord,
  winRate,
  selectedSeason,
  onNavigate,
  onShowWarmupTimer,
}) {
  // Next game hero
  if (nextGame) {
    const isToday = countdownText(nextGame.event_date) === 'TODAY'
    const isTomorrow = countdownText(nextGame.event_date) === 'TOMORROW'

    return (
      <div
        className="relative rounded-xl overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(/images/volleyball-game.jpg)`,
          minHeight: '220px',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${selectedTeam?.color || '#3B82F6'}dd, ${selectedTeam?.color || '#3B82F6'}99, rgba(15,23,42,0.90))` }} />
        <div className="relative z-10 p-6">
          {/* Label */}
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white/90">
            {isToday ? 'GAME DAY' : 'Next Game Day'}
          </span>

          {/* VS Display */}
          <div className="flex items-center justify-center gap-6 my-6">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center text-white text-2xl font-black border-2 border-white/20"
                style={{ backgroundColor: selectedTeam?.color || '#3B82F6' }}
              >
                {selectedTeam?.name?.charAt(0)}
              </div>
              <p className="text-white/80 text-sm font-semibold mt-2 max-w-[120px] truncate">{selectedTeam?.name}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-sm font-bold uppercase tracking-wider">VS</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center bg-white/10 border-2 border-white/20 text-2xl">
                🏐
              </div>
              <p className="text-white/80 text-sm font-semibold mt-2 max-w-[120px] truncate">{nextGame.opponent_name || 'TBD'}</p>
            </div>
          </div>

          {/* Date / Time / Venue */}
          <div className="flex items-center justify-center gap-4 text-white/60 text-sm mb-5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDateLong(nextGame.event_date)}
              {nextGame.event_time ? ` · ${formatTime12(nextGame.event_time)}` : ''}
            </span>
            {nextGame.venue_name && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {nextGame.venue_name}
              </span>
            )}
          </div>

          {/* Countdown badge */}
          {(isToday || isTomorrow) && (
            <div className="flex justify-center mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isToday ? 'bg-red-500/30 text-red-200 border border-red-400/30' : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
              }`}>
                {isToday ? 'TODAY' : 'TOMORROW'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate?.('gameprep')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold"
            >
              <ClipboardList className="w-4 h-4" />
              Lineup Builder
            </button>
            <button
              onClick={() => onNavigate?.('gameprep')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold"
            >
              <Zap className="w-4 h-4" />
              Game Day Hub
            </button>
            <button
              onClick={() => onNavigate?.('schedule')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold"
            >
              <UserCheck className="w-4 h-4" />
              RSVP Status
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Next practice hero
  if (nextEvent && nextEvent.event_type !== 'game') {
    return (
      <div
        className="relative rounded-xl overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(/images/volleyball-practice.jpg)`,
          minHeight: '180px',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${selectedTeam?.color || '#3B82F6'}cc, rgba(30,41,59,0.90))` }} />
        <div className="relative z-10 p-6">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white/90">
            {countdownText(nextEvent.event_date) === 'TODAY' ? 'Practice Today' : 'Next Practice'}
          </span>

          <div className="mt-4 mb-5">
            <p className="text-2xl font-black text-white">
              {nextEvent.title || 'Team Practice'}
            </p>
            <div className="flex items-center gap-4 text-white/60 text-sm mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDateLong(nextEvent.event_date)}
                {nextEvent.event_time ? ` · ${formatTime12(nextEvent.event_time)}` : ''}
              </span>
              {nextEvent.venue_name && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {nextEvent.venue_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold"
            >
              <UserCheck className="w-4 h-4" />
              Take Attendance
            </button>
            <button
              onClick={() => onShowWarmupTimer?.()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold"
            >
              <Timer className="w-4 h-4" />
              Start Warmup
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No upcoming events — Season Record fallback
  return (
    <div className="bg-white border border-lynx-silver rounded-xl shadow-sm p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Season Record</p>
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-black text-emerald-500">{teamRecord.wins}</span>
          <span className="text-3xl font-bold text-slate-300">-</span>
          <span className="text-5xl font-black text-red-500">{teamRecord.losses}</span>
          <span className="text-sm ml-2 text-slate-500">{winRate}% win rate</span>
        </div>
      </div>
      <p className="text-sm mt-2 text-slate-500">{selectedTeam?.name} · {selectedSeason?.name}</p>
      <div className="mt-4">
        <button
          onClick={() => onNavigate?.('schedule')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
        >
          <Calendar className="w-4 h-4" />
          View Schedule
        </button>
      </div>
    </div>
  )
}
