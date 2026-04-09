import { useEffect } from 'react'
import { useJourney } from '../../contexts/JourneyContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

// Badges awarded during the wizard — already shown on the success screen.
// We don't want them to fire a second celebration modal on the dashboard.
const WIZARD_BADGE_IDS = new Set(['founder', 'beta_tester', 'team_builder'])

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
        {/* Badge visual */}
        <div className="mb-4 animate-bounce flex justify-center">
          {(badge.badge_image_url || badge.icon_url) ? (
            <img
              src={badge.badge_image_url || badge.icon_url}
              alt={badge.name || 'Badge'}
              style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block' }}
            />
          ) : null}
          <span className="text-6xl" style={{ display: (badge.badge_image_url || badge.icon_url) ? 'none' : 'block' }}>{badge.icon || '🏅'}</span>
        </div>
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
  const { profile } = useAuth()

  const celebration = journey?.journeyData?.celebrationQueue?.[0]

  // If the queued celebration is a badge that was already shown on the wizard
  // success screen, silently clear it so we don't double-fire a modal on the
  // dashboard. Also skip ANY badge that was queued as part of onboarding
  // completion (within the last 10 seconds) as a defense-in-depth safeguard.
  useEffect(() => {
    if (!journey || !celebration) return
    if (celebration.type !== 'badge') return

    const badgeId = celebration.badge?.id
    const isWizardBadge = badgeId && WIZARD_BADGE_IDS.has(badgeId)

    const completedAt = profile?.onboarding_data?.completed_at
    const onboardingJustCompleted = completedAt
      && (Date.now() - new Date(completedAt).getTime()) < 10000

    if (isWizardBadge || onboardingJustCompleted) {
      journey.clearCelebration()
    }
  }, [celebration, journey, profile?.onboarding_data?.completed_at])

  if (!journey || !celebration) return null

  // If the effect above is about to clear this celebration, don't render the
  // modal at all — this prevents a single-frame flash.
  const badgeId = celebration.badge?.id
  if (celebration.type === 'badge' && badgeId && WIZARD_BADGE_IDS.has(badgeId)) {
    return null
  }
  const completedAt = profile?.onboarding_data?.completed_at
  if (
    celebration.type === 'badge'
    && completedAt
    && (Date.now() - new Date(completedAt).getTime()) < 10000
  ) {
    return null
  }

  if (celebration.type === 'badge') {
    return <BadgeCelebration badge={celebration.badge} onClose={journey.clearCelebration} />
  }

  return null
}
