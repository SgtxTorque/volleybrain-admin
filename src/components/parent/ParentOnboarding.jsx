import { useState, useEffect, useRef } from 'react'
import { useParentTutorial, PARENT_CHECKLIST } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { X, ChevronLeft, ChevronRight, SkipForward, Check } from 'lucide-react'

// ============================================
// SPOTLIGHT OVERLAY
// Shows a darkened overlay with a "spotlight" hole
// highlighting the target element
// ============================================

export function SpotlightOverlay() {
  const tutorial = useParentTutorial()
  const { accent, isDark } = useTheme()
  const [targetRect, setTargetRect] = useState(null)
  const [tooltipStyle, setTooltipStyle] = useState({})

  // Find and measure target element
  useEffect(() => {
    if (!tutorial?.isActive) {
      setTargetRect(null)
      return
    }

    const currentStep = tutorial.currentStep
    if (!currentStep?.target) {
      setTargetRect(null)
      return
    }

    const findTarget = () => {
      const target = document.querySelector(currentStep.target)
      if (target) {
        const rect = target.getBoundingClientRect()
        const padding = 12
        setTargetRect({
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        })

        // Calculate tooltip position
        const position = currentStep.position || 'bottom'
        const tooltipWidth = 340
        const tooltipHeight = 220
        let top, left

        switch (position) {
          case 'top':
            top = rect.top + window.scrollY - tooltipHeight - 24
            left = rect.left + rect.width / 2 - tooltipWidth / 2
            break
          case 'bottom':
            top = rect.bottom + window.scrollY + 24
            left = rect.left + rect.width / 2 - tooltipWidth / 2
            break
          case 'left':
            top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2
            left = rect.left - tooltipWidth - 24
            break
          case 'right':
            top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2
            left = rect.right + 24
            break
          default:
            top = rect.bottom + window.scrollY + 24
            left = rect.left
        }

        // Keep tooltip in viewport
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
        top = Math.max(80, top)

        setTooltipStyle({ top, left, width: tooltipWidth })
      } else {
        setTargetRect(null)
      }
    }

    // Initial find with delay for DOM to settle
    const timeout = setTimeout(findTarget, 150)

    // Re-find on resize/scroll
    window.addEventListener('resize', findTarget)
    window.addEventListener('scroll', findTarget, true)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', findTarget)
      window.removeEventListener('scroll', findTarget, true)
    }
  }, [tutorial?.isActive, tutorial?.currentStep?.id])

  // Early return if not active
  if (!tutorial?.isActive) return null

  const { currentStep, currentStepIndex, totalSteps, nextStep, prevStep, skipTutorial, progress } = tutorial
  
  // Safety check - if no current step, close the tutorial
  if (!currentStep) {
    console.warn('SpotlightOverlay: No current step found, closing tutorial')
    setTimeout(() => skipTutorial?.(), 0)
    return null
  }

  const isWelcome = currentStep.id === 'welcome'
  const isComplete = currentStep.id === 'complete'
  const hasTarget = !!currentStep.target && !!targetRect

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay background */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight cutout - only if we have a target */}
      {hasTarget && (
        <>
          {/* Clear area (the spotlight hole) - uses massive box-shadow to create the effect */}
          <div
            className="absolute"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              borderRadius: 16,
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.85)`,
              backgroundColor: 'transparent',
            }}
          />
          {/* Glowing border around target */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 3,
              left: targetRect.left - 3,
              width: targetRect.width + 6,
              height: targetRect.height + 6,
              borderRadius: 18,
              border: `3px solid ${accent.primary}`,
              boxShadow: `0 0 20px ${accent.primary}, 0 0 40px ${accent.primary}50`,
              animation: 'pulse 2s infinite',
            }}
          />
        </>
      )}

      {/* Always-visible close button in top-right */}
      <button
        onClick={skipTutorial}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white bg-white/20 hover:bg-white/30 transition z-[10000]"
        title="Close tutorial"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Tooltip / Content Card - always centered if no target */}
      <div
        className="absolute rounded-2xl shadow-2xl overflow-hidden"
        style={{
          ...(hasTarget 
            ? tooltipStyle 
            : { 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                width: 400,
              }
          ),
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        {/* Progress bar */}
        <div className="h-1.5" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: accent.primary }}
          />
        </div>

        <div className="p-6">
          {/* Icon for welcome/complete screens */}
          {(isWelcome || isComplete) && (
            <div className="text-center mb-4">
              <span className="text-6xl">{isWelcome ? '👋' : '🎉'}</span>
            </div>
          )}

          {/* Title */}
          <h3 
            className={`text-xl font-bold ${(isWelcome || isComplete) ? 'text-center' : ''}`}
            style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
          >
            {currentStep.title}
          </h3>

          {/* Description */}
          <p 
            className={`mt-3 text-sm leading-relaxed ${(isWelcome || isComplete) ? 'text-center' : ''}`}
            style={{ color: isDark ? '#94a3b8' : '#64748b' }}
          >
            {currentStep.description}
          </p>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              {currentStepIndex > 0 && !isComplete && (
                <button
                  onClick={prevStep}
                  className="p-2.5 rounded-xl transition hover:scale-105"
                  style={{ 
                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                    color: isDark ? '#e2e8f0' : '#475569'
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <span 
                className="text-sm font-medium"
                style={{ color: isDark ? '#64748b' : '#94a3b8' }}
              >
                {currentStepIndex + 1} of {totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!isComplete && (
                <button
                  onClick={skipTutorial}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80 flex items-center gap-1.5"
                  style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={isComplete ? skipTutorial : nextStep}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition hover:scale-105"
                style={{ backgroundColor: accent.primary }}
              >
                {isWelcome ? "Let's Go!" : isComplete ? 'Done! 🎉' : 'Next'}
                {!isComplete && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// HORIZONTAL JOURNEY BAR
// Shows progress through onboarding steps
// ============================================

export function ParentJourneyBar({ onNavigate, onTeamHub, activeTeam }) {
  const tutorial = useParentTutorial()
  const tc = useThemeClasses()
  const { accent, isDark } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!tutorial || tutorial.loading) return null

  const { checklistItems, checklistProgress, completeStep } = tutorial
  const completedCount = checklistItems.filter(i => i.completed).length
  const isAllComplete = completedCount === checklistItems.length

  // Don't show if everything is complete
  if (isAllComplete) return null

  // Find current (first incomplete) step
  const currentStepIndex = checklistItems.findIndex(i => !i.completed)
  const currentStep = checklistItems[currentStepIndex] || checklistItems[0]

  // Handle item click - navigate or show info
  const handleItemClick = (item) => {
    if (item.completed) return
    
    // Special handling for Team Hub
    if (item.id === 'join_team_hub' && onTeamHub && activeTeam) {
      completeStep?.('join_team_hub')
      onTeamHub()
      return
    }
    
    // Regular navigation
    if (item.navTo && onNavigate) {
      onNavigate(item.navTo)
    }
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ 
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      }}
    >
      {/* Main bar - always visible */}
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: accent.primary + '20', color: accent.primary }}
            >
              ✓
            </div>
            <div>
              <h3 className="font-bold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                Getting Started
              </h3>
              <p className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                {completedCount} of {checklistItems.length} complete
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Percentage */}
            <span 
              className="text-sm font-bold"
              style={{ color: accent.primary }}
            >
              {Math.round(checklistProgress)}%
            </span>
            
            {/* Expand/collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg transition hover:scale-105"
              style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
            >
              <ChevronRight 
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              />
            </button>
          </div>
        </div>

        {/* Horizontal step indicators */}
        <div className="flex items-center gap-1">
          {checklistItems.map((item, idx) => {
            const isComplete = item.completed
            const isCurrent = idx === currentStepIndex
            const isClickable = !isComplete && (item.navTo || item.id === 'join_team_hub')
            
            return (
              <div key={item.id} className="flex-1 flex items-center">
                {/* Step indicator */}
                <button
                  onClick={() => handleItemClick(item)}
                  className={`relative flex-1 h-2 rounded-full transition-all duration-300 ${
                    isClickable ? 'cursor-pointer hover:scale-y-150' : ''
                  }`}
                  style={{ 
                    backgroundColor: isComplete 
                      ? accent.primary 
                      : isCurrent 
                        ? accent.primary + '40'
                        : isDark ? '#334155' : '#e2e8f0'
                  }}
                  title={item.title}
                >
                  {/* Pulse animation on current step */}
                  {isCurrent && !isComplete && (
                    <span 
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{ backgroundColor: accent.primary + '30' }}
                    />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Current step callout */}
        {currentStep && !isExpanded && (
          <button
            onClick={() => handleItemClick(currentStep)}
            className="mt-3 w-full flex items-center gap-3 p-3 rounded-xl transition hover:scale-[1.01]"
            style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
          >
            <span className="text-xl">{currentStep.icon}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                Next: {currentStep.title}
              </p>
              <p className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                {currentStep.description}
              </p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: accent.primary }} />
          </button>
        )}
      </div>

      {/* Expanded view - all steps */}
      {isExpanded && (
        <div 
          className="px-4 pb-4 space-y-2 border-t"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
        >
          <div className="pt-3" />
          {checklistItems.map((item, idx) => {
            const isComplete = item.completed
            const isCurrent = idx === currentStepIndex
            const isClickable = !isComplete && (item.navTo || item.id === 'join_team_hub')
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={isComplete}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isComplete 
                    ? 'opacity-60' 
                    : isCurrent 
                      ? 'ring-2 hover:scale-[1.01]'
                      : 'hover:scale-[1.01]'
                }`}
                style={{ 
                  backgroundColor: isComplete 
                    ? (isDark ? '#0f172a50' : '#f1f5f950')
                    : isCurrent
                      ? (isDark ? '#0f172a' : '#f8fafc')
                      : (isDark ? '#0f172a80' : '#f8fafc80'),
                  ringColor: isCurrent ? accent.primary : 'transparent',
                }}
              >
                {/* Icon / Check */}
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ 
                    backgroundColor: isComplete ? '#10b981' + '20' : accent.primary + '15',
                    color: isComplete ? '#10b981' : accent.primary
                  }}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : item.icon}
                </div>
                
                {/* Text */}
                <div className="flex-1 text-left">
                  <p 
                    className={`text-sm font-semibold ${isComplete ? 'line-through' : ''}`}
                    style={{ color: isComplete ? (isDark ? '#64748b' : '#94a3b8') : (isDark ? '#e2e8f0' : '#1e293b') }}
                  >
                    {item.title}
                  </p>
                  {!isComplete && (
                    <p className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Arrow for clickable items */}
                {isClickable && (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                )}
              </button>
            )
          })}

          {/* Replay tutorial button */}
          <button
            onClick={() => tutorial.startTutorial()}
            className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80 flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              color: isDark ? '#94a3b8' : '#64748b'
            }}
          >
            🎓 Replay Tutorial
          </button>
        </div>
      )}
    </div>
  )
}

// Keep old name as alias for backwards compatibility
export const ParentChecklistWidget = ParentJourneyBar

// ============================================
// FLOATING HELP BUTTON
// Always visible, opens tutorial/help
// ============================================

export function FloatingHelpButton() {
  const tutorial = useParentTutorial()
  const { accent, isDark } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  if (!tutorial || tutorial.isActive) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu */}
      {showMenu && (
        <div 
          className="absolute bottom-16 right-0 rounded-xl shadow-xl overflow-hidden min-w-52"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          }}
        >
          <button
            onClick={() => { tutorial.startTutorial(); setShowMenu(false) }}
            className="w-full px-4 py-3.5 text-left text-sm font-medium flex items-center gap-3 transition"
            style={{ 
              color: isDark ? '#e2e8f0' : '#1e293b',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            🎓 Take the Tour
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-3.5 text-left text-sm font-medium flex items-center gap-3 transition"
            style={{ 
              color: isDark ? '#e2e8f0' : '#1e293b',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ❓ Help Center
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-3.5 text-left text-sm font-medium flex items-center gap-3 transition"
            style={{ 
              color: isDark ? '#e2e8f0' : '#1e293b',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            💬 Contact Support
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-xl font-bold transition hover:scale-110"
        style={{ 
          backgroundColor: accent.primary,
          boxShadow: `0 4px 20px ${accent.primary}50`
        }}
      >
        {showMenu ? '✕' : '?'}
      </button>
    </div>
  )
}

export default SpotlightOverlay
