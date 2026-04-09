import { useEffect } from 'react'
import { useJourney } from '../../contexts/JourneyContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

// Badges awarded during the wizard — already shown on the success screen.
// We don't want them to fire a second celebration modal on the dashboard.
const WIZARD_BADGE_IDS = new Set(['founder', 'beta_tester', 'team_builder'])

// Tier 3: Onboarding/milestone badges that should render as a corner toast
// instead of a blocking full-screen modal. Quick, warm, then gone.
const TOAST_BADGE_IDS = new Set([
  'founder', 'beta_tester', 'open_for_business',
  'season_pro', 'team_builder', 'coach_connector',
  'roster_ready', 'scheduler',
])

// ============================================
// BADGE TOAST (Tier 3)
// ============================================
// Lightweight corner toast for onboarding badges. Auto-dismisses after 5s,
// doesn't block UI, has a close button. Lynx voice, playful but compact.
function BadgeToast({ badge, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  if (!badge) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: '#10284C',
        borderRadius: '14px',
        padding: '14px 18px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.28)',
        border: '1px solid rgba(75, 185, 236, 0.25)',
        maxWidth: '340px',
        animation: 'lynxBadgeToastIn 0.32s cubic-bezier(0.2, 0.9, 0.25, 1.05)',
      }}
    >
      {/* Badge visual */}
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '11px',
          background: 'rgba(255, 215, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0,
        }}
      >
        {(badge.badge_image_url || badge.icon_url) ? (
          <img
            src={badge.badge_image_url || badge.icon_url}
            alt={badge.name || 'Badge'}
            style={{ width: 28, height: 28, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <span>{badge.icon || '\uD83C\uDFC6'}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>
          {badge.name || 'Badge earned!'}
        </p>
        <p
          style={{
            fontSize: '11px',
            opacity: 0.75,
            margin: 0,
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {badge.description || 'Keep building — more achievements ahead.'}
        </p>
      </div>

      <button
        onClick={onClose}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.5)',
          cursor: 'pointer',
          fontSize: '15px',
          padding: '4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {'\u2715'}
      </button>

      <style>{`
        @keyframes lynxBadgeToastIn {
          from { transform: translateX(calc(100% + 40px)); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// BADGE CELEBRATION (full-screen modal, reserved for bigger milestones)
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

  // If the effect above is about to clear this celebration, don't render
  // anything — this prevents a single-frame flash of either modal or toast.
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
    // Tier 3: onboarding/milestone badges render as corner toasts, not modals.
    // Bigger milestones (game_day, full_roster, payment_pro, season_complete)
    // still get the full-screen celebration.
    const isToast = badgeId && TOAST_BADGE_IDS.has(badgeId)
    if (isToast) {
      return <BadgeToast badge={celebration.badge} onClose={journey.clearCelebration} />
    }
    return <BadgeCelebration badge={celebration.badge} onClose={journey.clearCelebration} />
  }

  return null
}
