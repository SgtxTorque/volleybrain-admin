import { useJourney } from '../../contexts/JourneyContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

// ============================================
// BADGE CELEBRATION
// ============================================
function BadgeCelebration({ badge, onClose }) {
  const tc = useThemeClasses()
  const { accent } = useTheme()

  if (!badge) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div 
        className={`text-center p-8 rounded-xl max-w-sm ${tc.pageBg}`}
        style={{ animation: 'bounceIn 0.5s ease-out' }}
      >
        {/* Confetti effect placeholder */}
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
// JOURNEY CELEBRATIONS
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
