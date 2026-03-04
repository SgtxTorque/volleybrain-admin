// =============================================================================
// CoachGameDayHeroV2 — Compact hero card for coach dashboard
// Shows next game matchup or practice with countdown, record display, form badges.
// =============================================================================

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, Zap, ChevronRight } from 'lucide-react'

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'TODAY'
  if (diffDays === 1) return 'TOMORROW'
  if (diffDays < 0) return 'PAST'
  return `${diffDays}d`
}

// Live countdown hook
function useLiveCountdown(event) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!event?.event_date) { setText(''); return }
    function compute() {
      const now = new Date()
      let target = new Date(event.event_date + 'T00:00:00')
      if (event.event_time) {
        const [h, m] = event.event_time.split(':')
        target.setHours(parseInt(h), parseInt(m), 0)
      }
      const diffMs = target - now
      if (diffMs <= 0) { setText('NOW'); return }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      let parts = []
      if (days > 0) parts.push(`${days}d`)
      if (hours > 0) parts.push(`${hours}h`)
      parts.push(`${mins}m`)
      setText(parts.join(' '))
    }
    compute()
    const timer = setInterval(compute, 60000)
    return () => clearInterval(timer)
  }, [event?.id, event?.event_date])

  return text
}

// Form badge (W/L)
function FormBadge({ result }) {
  const isWin = result === 'W'
  return (
    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
      isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {result}
    </span>
  )
}

export default function CoachGameDayHeroV2({
  nextGame,
  nextEvent,
  selectedTeam,
  teamRecord = { wins: 0, losses: 0, recentForm: [] },
  winRate = 0,
  onNavigate,
}) {
  const event = nextGame || nextEvent
  const countdown = useLiveCountdown(event)
  const isGame = event?.event_type === 'game'
  const isToday = event ? countdownText(event.event_date) === 'TODAY' : false

  // No upcoming events fallback
  if (!event) {
    return (
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #122240 50%, #0B1628 100%)', minHeight: '240px' }}>
        <DotGrid />
        <div className="relative z-10 p-6 flex flex-col justify-center h-full">
          <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 mb-2">Season Record</p>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-black text-emerald-400">{teamRecord.wins}</span>
            <span className="text-2xl font-bold text-slate-600">—</span>
            <span className="text-5xl font-black text-red-400">{teamRecord.losses}</span>
          </div>
          <p className="text-sm text-slate-400">{selectedTeam?.name} · {winRate}% win rate</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #0F2040 60%, #0B1628 100%)', minHeight: '240px' }}>
      <DotGrid />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(75,185,236,0.08) 0%, transparent 60%)' }} />

      <div className="relative z-10 p-5 flex gap-6 h-full">
        {/* Left — Event Info */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Live badge */}
          {isToday && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-300 border border-red-500/30 self-start mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {isGame ? 'GAME DAY' : 'TODAY'}
            </span>
          )}

          {!isToday && countdown && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-white/70 self-start mb-2">
              <Clock className="w-3 h-3" />
              {countdown}
            </span>
          )}

          {/* Team label */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {selectedTeam?.name}
          </p>

          {/* Matchup title */}
          <h2 className="text-3xl font-black text-white tracking-wide mb-2">
            {isGame && event.opponent_name
              ? `vs ${event.opponent_name}`
              : event.title || (isGame ? 'Game Day' : 'Practice')}
          </h2>

          {/* Date/Time/Venue */}
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateShort(event.event_date)}
              {event.event_time ? ` · ${formatTime12(event.event_time)}` : ''}
            </span>
            {event.venue_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.venue_name}
              </span>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => onNavigate?.(isGame ? 'gameprep' : 'schedule')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lynx-sky hover:brightness-110 text-white text-sm font-semibold self-start transition"
          >
            <Zap className="w-3.5 h-3.5" />
            {isGame ? 'Open Game Day' : 'View Schedule'}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Right — Record */}
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 mb-2">
            Season Record
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl font-black text-emerald-400 tabular-nums">{teamRecord.wins}</span>
            <span className="text-xl font-bold text-slate-600">—</span>
            <span className="text-6xl font-black text-red-400 tabular-nums">{teamRecord.losses}</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">{winRate}% win rate</p>

          {/* Recent form */}
          {teamRecord.recentForm?.length > 0 && (
            <div className="flex items-center gap-1">
              {teamRecord.recentForm.slice(0, 5).map((r, i) => (
                <FormBadge key={i} result={typeof r === 'object' ? (r.result === 'win' ? 'W' : 'L') : r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Dot grid overlay
function DotGrid() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
  )
}
