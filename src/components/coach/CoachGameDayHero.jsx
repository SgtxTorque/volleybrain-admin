import { useState, useEffect } from 'react'
import { Calendar, MapPin, ClipboardList, Zap, UserCheck, Timer, Shield, Clock } from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'
import { formatTime12, countdownText, formatDateLong } from '../../lib/date-helpers'

/**
 * CoachGameDayHero — Compact hero card with live countdown timer
 * Shows next game (VS display) or practice, or season record fallback.
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
  const { isDark } = useTheme()
  const [liveCountdown, setLiveCountdown] = useState('')

  // Live countdown timer — updates every minute
  useEffect(() => {
    const event = nextGame || nextEvent
    if (!event?.event_date) { setLiveCountdown(''); return }

    function computeCountdown() {
      const now = new Date()
      let target = new Date(event.event_date + 'T00:00:00')
      if (event.event_time) {
        const [h, m] = event.event_time.split(':')
        target.setHours(parseInt(h), parseInt(m), 0)
      }
      const diffMs = target - now
      if (diffMs <= 0) { setLiveCountdown('NOW'); return }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      let parts = []
      if (days > 0) parts.push(`${days}d`)
      if (hours > 0) parts.push(`${hours}h`)
      parts.push(`${mins}m`)
      setLiveCountdown(parts.join(' '))
    }

    computeCountdown()
    const timer = setInterval(computeCountdown, 60000)
    return () => clearInterval(timer)
  }, [nextGame?.id, nextEvent?.id, nextGame?.event_date, nextEvent?.event_date])

  // Next game hero
  if (nextGame) {
    const isToday = countdownText(nextGame.event_date) === 'TODAY'
    const isTomorrow = countdownText(nextGame.event_date) === 'TOMORROW'

    return (
      <div
        className="relative rounded-xl overflow-hidden bg-cover bg-center h-full"
        style={{
          backgroundImage: `url(/images/volleyball-game.jpg)`,
          minHeight: '280px',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${selectedTeam?.color || '#4BB9EC'}dd, ${selectedTeam?.color || '#4BB9EC'}99, rgba(15,23,42,0.90))` }} />
        <div className="relative z-10 p-5 flex flex-col h-full">
          {/* Label */}
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white/90 self-start">
            {isToday ? 'GAME DAY' : 'Next Game Day'}
          </span>

          {/* VS Display */}
          <div className="flex items-center justify-center gap-5 my-4 flex-1">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-black border-2 border-white/20"
                style={{ backgroundColor: selectedTeam?.color || '#4BB9EC' }}
              >
                {selectedTeam?.name?.charAt(0)}
              </div>
              <p className="text-white/80 text-xs font-semibold mt-1.5 max-w-[100px] truncate">{selectedTeam?.name}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">VS</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center bg-white/10 border-2 border-white/20 text-xl">
                🏐
              </div>
              <p className="text-white/80 text-xs font-semibold mt-1.5 max-w-[100px] truncate">{nextGame.opponent_name || 'TBD'}</p>
            </div>
          </div>

          {/* Live Countdown */}
          {liveCountdown && (
            <div className="flex justify-center mb-3">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isToday ? 'bg-red-500/30 text-red-200 border border-red-400/30'
                  : isTomorrow ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                  : 'bg-white/15 text-white/80'
              }`}>
                <Clock className="w-3 h-3" />
                {liveCountdown === 'NOW' ? 'GAME TIME' : liveCountdown}
              </span>
            </div>
          )}

          {/* Date / Time / Venue */}
          <div className="flex items-center justify-center gap-3 text-white/60 text-xs mb-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateLong(nextGame.event_date)}
              {nextGame.event_time ? ` · ${formatTime12(nextGame.event_time)}` : ''}
            </span>
            {nextGame.venue_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {nextGame.venue_name}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onNavigate?.('gameprep')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/15 hover:bg-white/25 text-white text-xs font-semibold"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Lineup Builder
            </button>
            <button
              onClick={() => onNavigate?.('gameprep')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/15 hover:bg-white/25 text-white text-xs font-semibold"
            >
              <Zap className="w-3.5 h-3.5" />
              Game Day Hub
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
        className="relative rounded-xl overflow-hidden bg-cover bg-center h-full"
        style={{
          backgroundImage: `url(/images/volleyball-practice.jpg)`,
          minHeight: '280px',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${selectedTeam?.color || '#4BB9EC'}cc, rgba(30,41,59,0.90))` }} />
        <div className="relative z-10 p-5 flex flex-col h-full">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white/90 self-start">
            {countdownText(nextEvent.event_date) === 'TODAY' ? 'Practice Today' : 'Next Practice'}
          </span>

          <div className="mt-3 mb-3 flex-1">
            <p className="text-xl font-black text-white">
              {nextEvent.title || 'Team Practice'}
            </p>

            {/* Live Countdown */}
            {liveCountdown && (
              <div className="flex mt-2 mb-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white/80">
                  <Clock className="w-3 h-3" />
                  {liveCountdown === 'NOW' ? 'STARTING NOW' : liveCountdown}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-white/60 text-xs mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateLong(nextEvent.event_date)}
                {nextEvent.event_time ? ` · ${formatTime12(nextEvent.event_time)}` : ''}
              </span>
              {nextEvent.venue_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {nextEvent.venue_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { sessionStorage.setItem('attendanceTeamId', selectedTeam?.id); onNavigate?.('attendance') }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/15 hover:bg-white/25 text-white text-xs font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Take Attendance
            </button>
            <button
              onClick={() => onShowWarmupTimer?.()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/15 hover:bg-white/25 text-white text-xs font-semibold"
            >
              <Timer className="w-3.5 h-3.5" />
              Start Warmup
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No upcoming events — Season Record fallback
  return (
    <div className={`${isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-5 h-full flex flex-col justify-center`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Season Record</p>
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-emerald-500">{teamRecord.wins}</span>
          <span className={`text-2xl font-bold ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>-</span>
          <span className="text-4xl font-black text-red-500">{teamRecord.losses}</span>
          <span className={`text-sm ml-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{winRate}% win rate</span>
        </div>
      </div>
      <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{selectedTeam?.name} · {selectedSeason?.name}</p>
      <div className="mt-3">
        <button
          onClick={() => onNavigate?.('schedule')}
          className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold ${
            isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-200' : 'bg-lynx-cloud hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          View Schedule
        </button>
      </div>
    </div>
  )
}
