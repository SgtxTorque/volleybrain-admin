// =============================================================================
// SeasonJourneyList — Vertical compact season cards with step trackers
// Sport emoji icons, step dots, next-step labels, per-season data
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// Sport emoji mapping
const SPORT_ICONS = {
  volleyball: '🏐',
  basketball: '🏀',
  soccer: '⚽',
  football: '🏈',
  baseball: '⚾',
  softball: '🥎',
  tennis: '🎾',
  swimming: '🏊',
  track: '🏃',
}

function getSportIcon(sportName) {
  if (!sportName) return '🏐'
  const key = sportName.toLowerCase()
  for (const [sport, icon] of Object.entries(SPORT_ICONS)) {
    if (key.includes(sport)) return icon
  }
  return sportName.slice(0, 2).toUpperCase()
}

const SPORT_COLORS = {
  volleyball: '#4BB9EC',
  basketball: '#F59E0B',
  soccer: '#22C55E',
  baseball: '#EF4444',
  softball: '#EC4899',
  football: '#8B5CF6',
  default: '#4BB9EC',
}

// Journey steps
const JOURNEY_STEPS = [
  { id: 'org-profile', label: 'Org Profile' },
  { id: 'create-season', label: 'Create Season' },
  { id: 'registration', label: 'Registration' },
  { id: 'create-teams', label: 'Create Teams' },
  { id: 'assign-coaches', label: 'Assign Coaches' },
  { id: 'roster-players', label: 'Roster Players' },
  { id: 'order-jerseys', label: 'Order Jerseys' },
  { id: 'build-schedule', label: 'Build Schedule' },
  { id: 'setup-payments', label: 'Setup Payments' },
  { id: 'go-live', label: 'Go Live' },
]

function getCompletedSteps(season, teamCount, playerCount) {
  const steps = []
  steps.push(true) // org-profile — always done if season exists
  steps.push(true) // create-season — this season exists
  const status = season.status?.toLowerCase() || ''
  steps.push(status === 'open' || status === 'active' || status === 'in_progress' || playerCount > 0) // registration
  steps.push(teamCount > 0) // create-teams
  steps.push((season.coach_count || 0) > 0 || teamCount > 0) // assign-coaches (approximate)
  steps.push(playerCount > 0) // roster-players
  steps.push(false) // order-jerseys — can't determine from data
  steps.push((season.event_count || 0) > 0) // build-schedule
  steps.push(false) // setup-payments — can't determine
  steps.push(status === 'active' || status === 'in_progress') // go-live
  return steps
}

function CompactSeasonCard({ season, sportName, sportColor, teamCount, playerCount, onNavigate }) {
  const { isDark } = useTheme()
  const completedSteps = getCompletedSteps(season, teamCount, playerCount)
  const completedCount = completedSteps.filter(Boolean).length
  const totalSteps = JOURNEY_STEPS.length

  // Find next incomplete step
  const nextStepIdx = completedSteps.findIndex(done => !done)
  const nextStep = nextStepIdx >= 0 ? JOURNEY_STEPS[nextStepIdx] : null

  const sportIcon = getSportIcon(sportName)

  const cardBg = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-slate-50 border border-slate-100'

  return (
    <div className={`${cardBg} rounded-xl p-3`}>
      {/* Row 1: Sport icon + Season name */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: `${sportColor}15` }}
        >
          {sportIcon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {season?.name || 'Season'}
          </p>
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {teamCount} teams · {playerCount} players
          </p>
        </div>
      </div>

      {/* Step tracker dots */}
      <div className="flex items-center gap-1 mb-2">
        {JOURNEY_STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[6px] font-bold ${
              completedSteps[idx]
                ? 'bg-emerald-500 text-white'
                : idx === nextStepIdx
                  ? 'bg-amber-500 text-white'
                  : isDark ? 'bg-white/[0.08] text-slate-500' : 'bg-slate-200 text-slate-400'
            }`}
            title={step.label}
          />
        ))}
        <span className={`ml-1.5 text-[10px] font-bold tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {completedCount}/{totalSteps}
        </span>
      </div>

      {/* Next step + Continue */}
      <div className="flex items-center justify-between">
        {nextStep ? (
          <span className={`text-[10px] truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {nextStep.label}
          </span>
        ) : (
          <span className={`text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            All steps complete
          </span>
        )}
        <button
          onClick={() => onNavigate?.('season-management', { seasonId: season?.id })}
          className="flex items-center gap-0.5 text-[11px] font-bold shrink-0 ml-1 transition-colors"
          style={{ color: sportColor }}
        >
          Continue
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default function SeasonJourneyList({ seasons = [], sports = [], teamCounts = {}, playerCounts = {}, onNavigate }) {
  const { isDark } = useTheme()
  const [showAll, setShowAll] = useState(false)

  const activeSeasons = seasons.filter(s => {
    const status = s.status?.toLowerCase() || ''
    return !['completed', 'archived'].includes(status)
  })

  const sorted = [...activeSeasons].sort((a, b) => {
    const aSteps = getCompletedSteps(a, teamCounts[a.id] || 0, playerCounts[a.id] || 0).filter(Boolean).length
    const bSteps = getCompletedSteps(b, teamCounts[b.id] || 0, playerCounts[b.id] || 0).filter(Boolean).length
    return aSteps - bSteps
  })

  if (sorted.length === 0) return null

  const MAX_VISIBLE = 4
  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE)
  const hasMore = sorted.length > MAX_VISIBLE

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col`}>
      {/* Header with View More top-right */}
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-xs font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Season Journey
        </h3>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] font-bold text-lynx-sky flex items-center gap-0.5"
          >
            {showAll ? 'Less' : `+${sorted.length - MAX_VISIBLE} more`}
            {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Season cards */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {visible.map(season => {
          const sport = sports.find(s => s.id === season.sport_id)
          const sportName = sport?.name || 'Volleyball'
          const sportKey = sportName.toLowerCase()
          const sportColor = SPORT_COLORS[sportKey] || SPORT_COLORS.default

          return (
            <CompactSeasonCard
              key={season.id}
              season={season}
              sportName={sportName}
              sportColor={sportColor}
              teamCount={teamCounts[season.id] || 0}
              playerCount={playerCounts[season.id] || 0}
              onNavigate={onNavigate}
            />
          )
        })}
      </div>
    </div>
  )
}
