import { useState } from 'react'
import { useJourney, JOURNEY_BADGES } from '../../contexts/JourneyContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

// ============================================
// JOURNEY TIMELINE (Full View)
// ============================================
export function JourneyTimeline({ onNavigate, expanded = false }) {
  const journey = useJourney()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const [isExpanded, setIsExpanded] = useState(expanded)

  if (!journey || journey.loading || journey.isDismissed) return null

  const { steps, completedSteps, progressPercent, currentStepIndex, isComplete, earnedBadges } = journey

  return (
    <div className={`rounded-2xl border overflow-hidden ${tc.card}`}>
      {/* Header - Always visible */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: accent.primary + '20' }}
          >
            🎯
          </div>
          <div>
            <h3 className={`font-semibold ${tc.text}`}>Your Journey</h3>
            <p className={`text-sm ${tc.textMuted}`}>
              {isComplete ? 'All steps complete! 🎉' : `${journey.completedCount}/${journey.totalSteps} steps complete`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini progress */}
          <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div 
              className="h-full rounded-full transition-all" 
              style={{ width: `${progressPercent}%`, backgroundColor: accent.primary }}
            />
          </div>
          <span className={`text-lg ${isExpanded ? 'rotate-180' : ''} transition-transform`}>▼</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Visual Timeline */}
          <div className="relative py-4">
            {/* Timeline line */}
            <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 rounded-full" />
            <div 
              className="absolute top-1/2 left-6 h-1 -translate-y-1/2 rounded-full transition-all duration-500"
              style={{ 
                width: `calc(${Math.min(progressPercent, 100)}% - 24px)`, 
                backgroundColor: accent.primary 
              }}
            />
            
            {/* Step nodes */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id)
                const isCurrent = index === currentStepIndex
                const isFuture = index > currentStepIndex

                return (
                  <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                    {/* Node */}
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all ${
                        isCompleted 
                          ? 'text-white border-white dark:border-slate-800' 
                          : isCurrent 
                            ? 'border-white dark:border-slate-800 animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                      style={{ 
                        backgroundColor: isCompleted || isCurrent ? accent.primary : undefined,
                        color: isCompleted || isCurrent ? '#fff' : undefined
                      }}
                    >
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    {/* Label */}
                    <span className={`text-xs mt-2 text-center ${isCompleted || isCurrent ? tc.text : tc.textMuted}`}>
                      {step.title.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Step Card */}
          {!isComplete && journey.currentStep && (
            <div 
              className="p-4 rounded-xl border-2 border-dashed"
              style={{ borderColor: accent.primary + '50', backgroundColor: accent.primary + '05' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{journey.currentStep.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold ${tc.text}`}>Next: {journey.currentStep.title}</p>
                  <p className={`text-sm ${tc.textMuted}`}>{journey.currentStep.description}</p>
                </div>
                <button
                  onClick={() => {
                    const navMap = {
                      create_org: 'setup',
                      create_season: 'setup',
                      add_teams: 'teams',
                      join_create_team: 'teams',
                      add_roster: 'teams',
                      add_coaches: 'coaches',
                      assign_coach: 'coaches',
                      register_players: 'registrations',
                      create_schedule: 'schedule',
                      first_practice: 'schedule',
                      first_game: 'schedule',
                      view_roster: 'teams',
                      create_lineup: 'gameprep',
                      plan_practice: 'schedule',
                      game_prep: 'gameprep',
                    }
                    if (navMap[journey.currentStep.id]) {
                      onNavigate(navMap[journey.currentStep.id])
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: accent.primary }}
                >
                  Start →
                </button>
              </div>
            </div>
          )}

          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div>
              <p className={`text-sm font-medium ${tc.textMuted} mb-2`}>Badges Earned ({earnedBadges.length})</p>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map(badgeId => {
                  const badge = JOURNEY_BADGES[badgeId]
                  if (!badge) return null
                  return (
                    <div 
                      key={badgeId}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${tc.cardBgAlt}`}
                      title={badge.description}
                    >
                      <span>{badge.icon}</span>
                      <span className={`text-sm font-medium ${tc.text}`}>{badge.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dismiss options */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => journey.dismissJourney('day')}
              className={`text-sm ${tc.textMuted} hover:underline`}
            >
              Hide for today
            </button>
            <button 
              onClick={() => journey.dismissJourney('forever')}
              className={`text-sm ${tc.textMuted} hover:underline`}
            >
              Don't show again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// MINI JOURNEY WIDGET (For Sidebar)
// ============================================
export function JourneyWidget({ onNavigate }) {
  const journey = useJourney()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const [showFull, setShowFull] = useState(false)

  if (!journey || journey.loading || journey.isDismissed || journey.isComplete) return null

  return (
    <>
      {/* Sidebar Mini Widget */}
      <div 
        onClick={() => setShowFull(true)}
        className={`mx-3 mb-4 p-3 rounded-xl cursor-pointer transition-all hover:shadow-md ${tc.card}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎯</span>
          <span className={`text-sm font-semibold ${tc.text}`}>Setup Progress</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
          <div 
            className="h-full rounded-full transition-all" 
            style={{ width: `${journey.progressPercent}%`, backgroundColor: accent.primary }}
          />
        </div>
        <p className={`text-xs ${tc.textMuted} mt-1`}>
          {journey.completedCount}/{journey.totalSteps} • {journey.currentStep?.title}
        </p>
      </div>

      {/* Full Journey Modal */}
      {showFull && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl ${tc.pageBg}`}>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-inherit">
              <h2 className={`text-xl font-bold ${tc.text}`}>Your VolleyBrain Journey</h2>
              <button 
                onClick={() => setShowFull(false)}
                className={`p-2 rounded-lg ${tc.hoverBg}`}
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <JourneyTimeline onNavigate={(page) => { setShowFull(false); onNavigate(page); }} expanded={true} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================
// BADGE CELEBRATION MODAL
// ============================================
export function BadgeCelebration({ badge, onClose }) {
  const tc = useThemeClasses()
  const { accent } = useTheme()

  if (!badge) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div 
        className={`text-center p-8 rounded-3xl max-w-sm ${tc.pageBg}`}
        style={{ animation: 'bounceIn 0.5s ease-out' }}
      >
        <div className="text-6xl mb-4 animate-bounce">{badge.icon}</div>
        <h2 className={`text-2xl font-bold ${tc.text} mb-2`}>Badge Earned!</h2>
        <p className="text-xl font-semibold mb-1" style={{ color: accent.primary }}>{badge.name}</p>
        <p className={`${tc.textMuted} mb-6`}>{badge.description}</p>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl text-white font-semibold"
          style={{ backgroundColor: accent.primary }}
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  )
}

// ============================================
// JOURNEY CELEBRATION WRAPPER
// ============================================
export function JourneyCelebrations() {
  const journey = useJourney()
  
  if (!journey || journey.journeyData.celebrationQueue.length === 0) return null
  
  const celebration = journey.journeyData.celebrationQueue[0]
  
  if (celebration.type === 'badge') {
    return <BadgeCelebration badge={celebration.badge} onClose={journey.clearCelebration} />
  }
  
  return null
}

// ============================================
// BADGE SHOWCASE (For Profile Page)
// ============================================
export function BadgeShowcase() {
  const journey = useJourney()
  const tc = useThemeClasses()
  const { accent } = useTheme()

  if (!journey) return null

  const allBadges = Object.values(JOURNEY_BADGES)
  const earned = journey.earnedBadges

  return (
    <div className={`p-6 rounded-2xl border ${tc.card}`}>
      <h3 className={`text-lg font-bold ${tc.text} mb-4`}>
        🏆 Badges ({earned.length}/{allBadges.length})
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {allBadges.map(badge => {
          const isEarned = earned.includes(badge.id)
          return (
            <div 
              key={badge.id}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                isEarned 
                  ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30' 
                  : 'bg-slate-100 dark:bg-slate-800 opacity-40'
              }`}
              title={`${badge.name}: ${badge.description}`}
            >
              <span className={`text-2xl ${isEarned ? '' : 'grayscale'}`}>{badge.icon}</span>
              <span className={`text-xs mt-1 text-center font-medium ${isEarned ? tc.text : tc.textMuted}`}>
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
