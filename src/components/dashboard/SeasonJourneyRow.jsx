// =============================================================================
// SeasonJourneyRow — Multi-sport season journey tracker row
// Shows one card per active sport/season with progress steps, team/player counts.
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Circle, Check, ChevronRight } from 'lucide-react'

// Journey step definitions for admin org director
const JOURNEY_STEPS = [
  { id: 'setup', label: 'Setup' },
  { id: 'tryouts', label: 'Tryouts' },
  { id: 'rosters', label: 'Rosters' },
  { id: 'season', label: 'Season' },
  { id: 'playoffs', label: 'Playoffs' },
  { id: 'wrapup', label: 'Wrap-up' },
]

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

// Map season status to journey step index
function getActiveStepIndex(season) {
  if (!season) return 0
  const status = season.status?.toLowerCase() || ''
  if (status === 'completed' || status === 'archived') return 5
  if (status === 'playoffs') return 4
  if (status === 'active' || status === 'in_progress') return 3
  if (status === 'rostering') return 2
  if (status === 'tryouts') return 1
  return 0 // setup / draft / planning
}

// =============================================================================
// Single Sport Journey Card
// =============================================================================
function SportJourneyCard({ season, sportName, sportColor, teamCount, playerCount, onNavigate }) {
  const { isDark } = useTheme()
  const activeIdx = getActiveStepIndex(season)
  const progressPct = Math.round(((activeIdx + 1) / JOURNEY_STEPS.length) * 100)

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
      {/* Top accent bar */}
      <div className="h-1" style={{ backgroundColor: sportColor }} />

      <div className="p-6">
        {/* Header: sport + season */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${sportColor}20` }}>
              <Circle className="w-3 h-3" style={{ color: sportColor }} />
            </div>
            <div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {sportName || 'Sport'}
              </p>
              <p className={`text-lg ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {season?.name || 'Season'}
              </p>
            </div>
          </div>
          <span className="text-4xl font-black tabular-nums" style={{ color: sportColor }}>
            {progressPct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className={`h-1.5 rounded-full overflow-hidden mb-3 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: sportColor }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-between mb-3">
          {JOURNEY_STEPS.map((step, idx) => {
            const isDone = idx < activeIdx
            const isActive = idx === activeIdx
            const isUpcoming = idx > activeIdx

            return (
              <div key={step.id} className="flex flex-col items-center gap-1">
                {isDone ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: sportColor }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : isActive ? (
                  <div
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#0B1628]"
                    style={{ borderColor: sportColor, boxShadow: `0 0 8px ${sportColor}40` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sportColor }} />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`} />
                )}
                <span className={`text-base font-medium ${
                  isDone || isActive
                    ? (isDark ? 'text-slate-300' : 'text-slate-600')
                    : (isDark ? 'text-slate-600' : 'text-slate-300')
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer: counts + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {teamCount || 0} teams
            </span>
            <span className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {playerCount || 0} players
            </span>
          </div>
          <button
            onClick={() => onNavigate?.('seasons')}
            className="flex items-center gap-1 text-lg font-semibold transition-colors"
            style={{ color: sportColor }}
          >
            Continue
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main Row Component
// =============================================================================
export default function SeasonJourneyRow({ seasons = [], sports = [], teamCounts = {}, playerCounts = {}, onNavigate }) {
  // Only show seasons that are active (not completed/archived)
  const activeSeasons = seasons.filter(s => {
    const status = s.status?.toLowerCase() || ''
    return !['completed', 'archived'].includes(status)
  }).slice(0, 3) // Max 3 cards

  if (activeSeasons.length === 0) return null

  return (
    <div className={`grid gap-4 ${
      activeSeasons.length === 1 ? 'grid-cols-1' :
      activeSeasons.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }`}>
      {activeSeasons.map(season => {
        const sport = sports.find(s => s.id === season.sport_id)
        const sportName = sport?.name || 'Volleyball'
        const sportKey = sportName.toLowerCase()
        const sportColor = SPORT_COLORS[sportKey] || SPORT_COLORS.default

        return (
          <SportJourneyCard
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
  )
}
