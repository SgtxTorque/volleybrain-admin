// =============================================================================
// SeasonJourneyList — Vertical compact season cards (right of hero)
// Each card shows season name, sport badge, completion %, power bar, blocker.
// Sorted by urgency (lowest completion first).
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// Sport accent colors
const SPORT_COLORS = {
  volleyball: '#4BB9EC',
  basketball: '#F59E0B',
  soccer: '#22C55E',
  baseball: '#EF4444',
  softball: '#EC4899',
  football: '#8B5CF6',
  default: '#4BB9EC',
}

// Journey step definitions
const JOURNEY_STEPS = [
  { id: 'setup', label: 'Setup' },
  { id: 'tryouts', label: 'Tryouts' },
  { id: 'rosters', label: 'Rosters' },
  { id: 'season', label: 'Season' },
  { id: 'playoffs', label: 'Playoffs' },
  { id: 'wrapup', label: 'Wrap-up' },
]

// Map season status to journey step index
function getActiveStepIndex(season) {
  if (!season) return 0
  const status = season.status?.toLowerCase() || ''
  if (status === 'completed' || status === 'archived') return 5
  if (status === 'playoffs') return 4
  if (status === 'active' || status === 'in_progress') return 3
  if (status === 'rostering') return 2
  if (status === 'tryouts') return 1
  return 0
}

// Determine the main blocker for a season
function getBlocker(season, teamCount, playerCount) {
  if (playerCount === 0) return 'No players registered'
  if (teamCount === 0) return 'No teams created'
  const status = season.status?.toLowerCase() || ''
  if (status === 'draft' || status === 'planning') return 'Season not started'
  return null
}

// =============================================================================
// Single compact season card
// =============================================================================
function CompactSeasonCard({ season, sportName, sportColor, teamCount, playerCount, onNavigate }) {
  const { isDark } = useTheme()
  const activeIdx = getActiveStepIndex(season)
  const progressPct = Math.round(((activeIdx + 1) / JOURNEY_STEPS.length) * 100)
  const blocker = getBlocker(season, teamCount, playerCount)

  // Color by threshold
  const pctColor = progressPct >= 75 ? 'text-emerald-500' : progressPct >= 40 ? 'text-amber-500' : 'text-red-500'
  const barColor = progressPct >= 75 ? 'bg-emerald-500' : progressPct >= 40 ? 'bg-amber-500' : 'bg-red-500'

  // Sport badge abbreviation
  const sportAbbr = (sportName || 'SP').slice(0, 2).toUpperCase()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-xl p-4`}>
      {/* Row 1: Season name + sport badge — left. Completion % — right */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
            style={{ backgroundColor: `${sportColor}20`, color: sportColor }}
          >
            {sportAbbr}
          </span>
          <span className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {season?.name || 'Season'}
          </span>
        </div>
        <span className={`text-2xl font-extrabold tabular-nums shrink-0 ml-2 ${pctColor}`}>
          {progressPct}%
        </span>
      </div>

      {/* Row 2: Power bar */}
      <div className={`h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Row 3: Blocker + counts + Continue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {blocker ? (
            <span className={`text-sm truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Blocker: {blocker}
            </span>
          ) : (
            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {teamCount} teams · {playerCount} players
            </span>
          )}
        </div>
        <button
          onClick={() => onNavigate?.('season-management', { seasonId: season?.id })}
          className="flex items-center gap-1 text-sm font-bold shrink-0 ml-2 transition-colors"
          style={{ color: sportColor }}
        >
          Continue
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Main List Component
// =============================================================================
export default function SeasonJourneyList({ seasons = [], sports = [], teamCounts = {}, playerCounts = {}, onNavigate }) {
  const { isDark } = useTheme()
  const [showAll, setShowAll] = useState(false)

  // Only show seasons that are active (not completed/archived)
  const activeSeasons = seasons.filter(s => {
    const status = s.status?.toLowerCase() || ''
    return !['completed', 'archived'].includes(status)
  })

  // Sort by urgency — lowest completion first
  const sorted = [...activeSeasons].sort((a, b) => {
    const aIdx = getActiveStepIndex(a)
    const bIdx = getActiveStepIndex(b)
    return aIdx - bIdx
  })

  if (sorted.length === 0) return null

  const MAX_VISIBLE = 6
  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE)
  const hasMore = sorted.length > MAX_VISIBLE

  return (
    <div className="flex flex-col gap-2 h-full">
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

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className={`text-center py-2 text-sm font-semibold rounded-xl transition-colors ${
            isDark ? 'text-lynx-sky hover:bg-white/[0.04]' : 'text-lynx-sky hover:bg-slate-50'
          }`}
        >
          + {sorted.length - MAX_VISIBLE} more season{sorted.length - MAX_VISIBLE !== 1 ? 's' : ''}
          <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
        </button>
      )}

      {hasMore && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className={`text-center py-2 text-sm font-semibold rounded-xl transition-colors ${
            isDark ? 'text-lynx-sky hover:bg-white/[0.04]' : 'text-lynx-sky hover:bg-slate-50'
          }`}
        >
          Show less
          <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
        </button>
      )}
    </div>
  )
}
