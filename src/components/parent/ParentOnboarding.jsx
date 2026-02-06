import { useState, useEffect, useRef } from 'react'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'

// ============================================
// SPOTLIGHT OVERLAY
// Shows a darkened overlay with a "spotlight" hole
// highlighting the target element
// ============================================

export function SpotlightOverlay() {
  const tutorial = useParentTutorial()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const [targetRect, setTargetRect] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  // Find and measure target element
  useEffect(() => {
    if (!tutorial?.isActive || !tutorial?.currentStep?.target) {
      setTargetRect(null)
      return
    }

    const findTarget = () => {
      const target = document.querySelector(tutorial.currentStep.target)
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          element: target,
        })

        // Calculate tooltip position
        const position = tutorial.currentStep.position || 'bottom'
        let tooltipTop = 0
        let tooltipLeft = 0
        const tooltipWidth = 320
        const tooltipHeight = 200

        switch (position) {
          case 'top':
            tooltipTop = rect.top - tooltipHeight - 20
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
            break
          case 'bottom':
            tooltipTop = rect.bottom + 20
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
            break
          case 'left':
            tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2
            tooltipLeft = rect.left - tooltipWidth - 20
            break
          case 'right':
            tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2
            tooltipLeft = rect.right + 20
            break
          default:
            tooltipTop = rect.bottom + 20
            tooltipLeft = rect.left
        }

        // Keep tooltip in viewport
        tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16))
        tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16))

        setTooltipPosition({ top: tooltipTop, left: tooltipLeft })
      } else {
        setTargetRect(null)
      }
    }

    // Initial find
    findTarget()

    // Re-find on resize/scroll
    const handleUpdate = () => setTimeout(findTarget, 100)
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate, true)

    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate, true)
    }
  }, [tutorial?.isActive, tutorial?.currentStep])

  if (!tutorial?.isActive) return null

  const { currentStep, currentStepIndex, totalSteps, nextStep, prevStep, skipTutorial, progress } = tutorial
  const isWelcome = currentStep?.id === 'welcome'
  const isComplete = currentStep?.id === 'complete'
  const hasTarget = !!currentStep?.target && targetRect

  // Handle clicking on the target element
  const handleTargetClick = () => {
    if (currentStep?.action === 'click' && currentStep?.completeStep) {
      tutorial.completeStep(currentStep.completeStep)
    }
    nextStep()
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hasTarget && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Glowing border around target */}
      {hasTarget && (
        <div
          className="absolute border-2 rounded-xl pointer-events-none animate-pulse"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderColor: accent.primary,
            boxShadow: `0 0 20px ${accent.primary}50, 0 0 40px ${accent.primary}30`,
          }}
        />
      )}

      {/* Clickable area over target */}
      {hasTarget && currentStep?.action === 'click' && (
        <div
          className="absolute cursor-pointer"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          onClick={handleTargetClick}
        />
      )}

      {/* Tooltip / Content Card */}
      <div
        className={`absolute ${tc.cardBg} rounded-2xl shadow-2xl border ${tc.border} overflow-hidden`}
        style={{
          top: hasTarget ? tooltipPosition.top : '50%',
          left: hasTarget ? tooltipPosition.left : '50%',
          transform: hasTarget ? 'none' : 'translate(-50%, -50%)',
          width: isWelcome || isComplete ? 400 : 320,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: accent.primary }}
          />
        </div>

        <div className="p-5">
          {/* Icon for welcome/complete screens */}
          {(isWelcome || isComplete) && (
            <div className="text-center mb-4">
              <span className="text-5xl">{isWelcome ? '👋' : '🎉'}</span>
            </div>
          )}

          {/* Title */}
          <h3 className={`text-lg font-bold ${tc.text} ${(isWelcome || isComplete) ? 'text-center' : ''}`}>
            {currentStep?.title}
          </h3>

          {/* Description */}
          <p className={`mt-2 text-sm ${tc.textMuted} ${(isWelcome || isComplete) ? 'text-center' : ''}`}>
            {currentStep?.description}
          </p>

          {/* Action hint for click steps */}
          {currentStep?.action === 'click' && hasTarget && (
            <div 
              className="mt-3 px-3 py-2 rounded-lg text-sm font-medium text-center"
              style={{ backgroundColor: accent.primary + '20', color: accent.primary }}
            >
              👆 Tap the highlighted area to continue
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && !isComplete && (
                <button
                  onClick={prevStep}
                  className={`p-2 rounded-lg ${tc.cardBgAlt} ${tc.text} hover:opacity-80 transition`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <span className={`text-xs ${tc.textMuted}`}>
                {currentStepIndex + 1} of {totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isComplete && (
                <button
                  onClick={skipTutorial}
                  className={`px-3 py-2 rounded-lg text-sm ${tc.textMuted} hover:opacity-80 transition flex items-center gap-1`}
                >
                  <SkipForward className="w-3 h-3" />
                  Skip
                </button>
              )}
              
              {(currentStep?.action === 'next' || isWelcome) && (
                <button
                  onClick={nextStep}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1 hover:opacity-90 transition"
                  style={{ backgroundColor: accent.primary }}
                >
                  {isWelcome ? "Let's Go!" : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {isComplete && (
                <button
                  onClick={skipTutorial}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                  style={{ backgroundColor: accent.primary }}
                >
                  Done! 🎉
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Arrow pointer (for positioned tooltips) */}
        {hasTarget && (
          <div
            className="absolute w-4 h-4 rotate-45"
            style={{
              backgroundColor: tc.cardBg?.includes('bg-') ? undefined : '#1e293b',
              ...(currentStep?.position === 'top' && { bottom: -8, left: '50%', marginLeft: -8 }),
              ...(currentStep?.position === 'bottom' && { top: -8, left: '50%', marginLeft: -8 }),
              ...(currentStep?.position === 'left' && { right: -8, top: '50%', marginTop: -8 }),
              ...(currentStep?.position === 'right' && { left: -8, top: '50%', marginTop: -8 }),
            }}
          />
        )}
      </div>
    </div>
  )
}

// ============================================
// PARENT CHECKLIST WIDGET
// Shows progress on essential tasks
// ============================================

export function ParentChecklistWidget({ onNavigate }) {
  const tutorial = useParentTutorial()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const [isExpanded, setIsExpanded] = useState(true)

  if (!tutorial || tutorial.loading) return null

  const { checklistItems, checklistProgress } = tutorial
  const completedCount = checklistItems.filter(i => i.completed).length
  const isAllComplete = completedCount === checklistItems.length

  // Don't show if everything is complete
  if (isAllComplete) return null

  return (
    <div className={`rounded-2xl border overflow-hidden ${tc.card}`}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: accent.primary + '20' }}
          >
            ✅
          </div>
          <div>
            <h3 className={`font-semibold ${tc.text}`}>Getting Started</h3>
            <p className={`text-sm ${tc.textMuted}`}>
              {completedCount}/{checklistItems.length} tasks complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-200 dark:text-slate-700"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke={accent.primary}
                strokeWidth="4"
                fill="none"
                strokeDasharray={100}
                strokeDashoffset={100 - checklistProgress}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${tc.text}`}>
              {Math.round(checklistProgress)}%
            </span>
          </div>
          <span className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* Checklist items */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {checklistItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition cursor-pointer ${
                item.completed
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/10'
                  : `${tc.cardBgAlt} hover:scale-[1.01]`
              }`}
              onClick={() => !item.completed && item.navTo && onNavigate(item.navTo)}
            >
              <span className="text-xl">{item.completed ? '✓' : item.icon}</span>
              <div className="flex-1">
                <p className={`font-medium text-sm ${item.completed ? 'text-emerald-500 line-through' : tc.text}`}>
                  {item.title}
                </p>
                {!item.completed && (
                  <p className={`text-xs ${tc.textMuted}`}>{item.description}</p>
                )}
              </div>
              {!item.completed && item.navTo && (
                <ChevronRight className={`w-4 h-4 ${tc.textMuted}`} />
              )}
            </div>
          ))}

          {/* Restart tutorial button */}
          <button
            onClick={() => tutorial.startTutorial()}
            className={`w-full mt-3 py-2 rounded-lg text-sm ${tc.textMuted} hover:opacity-80 transition border ${tc.border}`}
          >
            🎓 Replay Tutorial
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// FLOATING HELP BUTTON
// Always visible, opens tutorial/help
// ============================================

export function FloatingHelpButton() {
  const tutorial = useParentTutorial()
  const { accent } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  if (!tutorial || tutorial.isActive) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu */}
      {showMenu && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-48">
          <button
            onClick={() => { tutorial.startTutorial(); setShowMenu(false) }}
            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            🎓 Take the Tour
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            ❓ Help Center
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            💬 Contact Support
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-xl hover:scale-105 transition"
        style={{ backgroundColor: accent.primary }}
      >
        {showMenu ? '✕' : '?'}
      </button>
    </div>
  )
}

export default SpotlightOverlay
