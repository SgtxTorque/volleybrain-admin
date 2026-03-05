// =============================================================================
// CoachGameDayHeroV2 — Hero card for coach dashboard
// 50% taller than before, dark navy gradient, game image background support,
// GameDayJourney tracker embedded inside, live countdown, record + form badges
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

function FormBadge({ result }) {
  const isWin = result === 'W'
  return (
    <span className={`w-7 h-7 rounded-md flex items-center justify-center text-r-sm font-black ${
      isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {result}
    </span>
  )
}

// Journey steps embedded in hero
const JOURNEY_STEPS = [
  { id: 'rsvps', label: 'RSVPs', num: 1 },
  { id: 'lineup', label: 'Lineup', num: 2 },
  { id: 'attendance', label: 'Attendance', num: 3 },
  { id: 'scoring', label: 'Scoring', num: 4 },
  { id: 'stats', label: 'Stats', num: 5 },
  { id: 'report', label: 'Report', num: 6 },
]

function JourneyTracker({ activeStep = 0, onStepClick }) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.08]">
      {JOURNEY_STEPS.map((step, idx) => {
        const isCompleted = idx < activeStep
        const isCurrent = idx === activeStep
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => onStepClick?.(idx)}
              className="flex flex-col items-center gap-1 group/step"
              title={step.label}
            >
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center text-r-sm font-bold
                transition-colors cursor-pointer
                ${isCompleted
                  ? 'bg-lynx-sky/20 border-lynx-sky text-lynx-sky'
                  : isCurrent
                    ? 'bg-lynx-sky border-lynx-sky text-white'
                    : 'border-white/20 text-white/40'
                }
              `}>
                {step.num}
              </div>
              <span className={`text-r-xs font-medium whitespace-nowrap ${
                isCompleted || isCurrent ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {step.label}
              </span>
            </button>
            {idx < JOURNEY_STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 mt-[-16px] ${
                idx < activeStep ? 'bg-lynx-sky' : 'bg-white/[0.08]'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CoachGameDayHeroV2({
  nextGame,
  nextEvent,
  selectedTeam,
  teamRecord = { wins: 0, losses: 0, recentForm: [] },
  winRate = 0,
  onNavigate,
  gameImage = null,
  journeyStep = 0,
}) {
  const event = nextGame || nextEvent
  const countdown = useLiveCountdown(event)
  const isGame = event?.event_type === 'game'
  const isToday = event ? countdownText(event.event_date) === 'TODAY' : false

  // No upcoming events fallback — still shows record
  if (!event) {
    return (
      <div className="relative rounded-2xl overflow-hidden max-h-hero" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #122240 50%, #0B1628 100%)' }}>
        <DotGrid />
        <div className="relative z-10 p-r-6 flex flex-col justify-center h-full">
          <p className="text-r-base font-bold uppercase tracking-[1.5px] text-slate-500 mb-3">Season Record</p>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-r-5xl font-black text-emerald-400">{teamRecord.wins}</span>
            <span className="text-r-3xl font-bold text-slate-600">—</span>
            <span className="text-r-5xl font-black text-red-400">{teamRecord.losses}</span>
          </div>
          <p className="text-r-lg text-slate-400">{selectedTeam?.name} · {winRate}% win rate</p>
          {teamRecord.recentForm?.length > 0 && (
            <div className="flex items-center gap-1 mt-4">
              {teamRecord.recentForm.slice(0, 5).map((r, i) => (
                <FormBadge key={i} result={typeof r === 'object' ? (r.result === 'win' ? 'W' : 'L') : r} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden max-h-hero" style={{}}>
      {/* Background: game image or gradient */}
      {gameImage ? (
        <>
          <img src={gameImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1628]/90 via-[#0B1628]/70 to-[#0B1628]/50" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #0F2040 60%, #0B1628 100%)' }} />
      )}
      <DotGrid />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 40%, rgba(75,185,236,0.08) 0%, transparent 60%)' }} />

      <div className="relative z-10 p-r-6 flex gap-r-4 h-full">
        {/* Left — Event Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Live badge */}
            {isToday && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-r-sm font-bold uppercase tracking-widest bg-red-500/20 text-red-300 border border-red-500/30 self-start mb-3">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                {isGame ? 'GAME DAY' : 'TODAY'}
              </span>
            )}

            {!isToday && countdown && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-r-sm font-bold bg-white/10 text-white/70 self-start mb-3">
                <Clock className="w-3.5 h-3.5" />
                {countdown}
              </span>
            )}

            {/* Team label */}
            <p className="text-r-base font-bold uppercase tracking-wider text-slate-500 mb-1">
              {selectedTeam?.name}
            </p>

            {/* Matchup title */}
            <h2 className="text-r-4xl font-black text-white tracking-wide mb-3">
              {isGame && event.opponent_name
                ? `vs ${event.opponent_name}`
                : event.title || (isGame ? 'Game Day' : 'Practice')}
            </h2>

            {/* Date/Time/Venue */}
            <div className="flex items-center gap-3 text-r-base text-slate-400 mb-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDateShort(event.event_date)}
                {event.event_time ? ` · ${formatTime12(event.event_time)}` : ''}
              </span>
              {event.venue_name && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {event.venue_name}
                </span>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={() => onNavigate?.(isGame ? 'gameprep' : 'schedule')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lynx-sky hover:brightness-110 text-white text-r-lg font-bold self-start transition"
            >
              <Zap className="w-4 h-4" />
              {isGame ? 'START GAME DAY MODE' : 'View Schedule'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Journey tracker — embedded at bottom of left column */}
          {isGame && (
            <JourneyTracker
              activeStep={journeyStep}
              onStepClick={() => onNavigate?.('gameprep')}
            />
          )}
        </div>

        {/* Right — Record */}
        <div className="flex flex-col items-center justify-center min-w-[160px]">
          <p className="text-r-base font-bold uppercase tracking-[1.5px] text-slate-500 mb-3">
            Season Record
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-r-5xl font-black text-emerald-400 tabular-nums">{teamRecord.wins}</span>
            <span className="text-r-3xl font-bold text-slate-600">—</span>
            <span className="text-r-5xl font-black text-red-400 tabular-nums">{teamRecord.losses}</span>
          </div>
          <p className="text-r-base text-slate-500 mb-3">{winRate}% win rate</p>

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
