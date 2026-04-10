// =============================================================================
// CoachMarkOverlay — Spotlight tooltip renderer
// Mounts once near the root and renders the active coach-mark (if any) via
// a portal. Positions a tooltip relative to the target element, dims the
// rest of the page, and draws a spotlight ring around the target.
// No external libraries — portal + fixed-position divs.
// =============================================================================

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCoachMarks } from '../../contexts/CoachMarkContext'

const TOOLTIP_WIDTH = 280

export function CoachMarkOverlay() {
  const ctx = useCoachMarks()
  const [targetRect, setTargetRect] = useState(null)
  const [tick, setTick] = useState(0)

  const currentMark = ctx?.currentMark
  const totalInGroup = ctx?.totalInGroup || 0
  const currentIndex = ctx?.currentIndex || 0
  const nextMark = ctx?.nextMark
  const dismissAll = ctx?.dismissAll
  const skipCurrent = ctx?.skipCurrent

  // Resolve the target element for the current mark
  useEffect(() => {
    if (!currentMark?.target) {
      setTargetRect(null)
      return
    }

    let cancelled = false
    let attempts = 0

    function resolve() {
      if (cancelled) return
      const el = document.querySelector(currentMark.target)
      if (!el) {
        // Retry a few frames to allow the page to render
        attempts += 1
        if (attempts < 20) {
          requestAnimationFrame(resolve)
          return
        }
        // Target never showed — skip this mark
        if (skipCurrent) skipCurrent()
        return
      }
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch (_) {}
    }

    resolve()

    // Re-measure on resize/scroll so the tooltip stays attached
    function reflow() { setTick(t => t + 1) }
    window.addEventListener('resize', reflow)
    window.addEventListener('scroll', reflow, true)

    return () => {
      cancelled = true
      window.removeEventListener('resize', reflow)
      window.removeEventListener('scroll', reflow, true)
    }
  }, [currentMark, skipCurrent])

  // Re-measure target on tick (scroll/resize)
  useEffect(() => {
    if (!currentMark?.target) return
    const el = document.querySelector(currentMark.target)
    if (el) setTargetRect(el.getBoundingClientRect())
  }, [tick, currentMark?.target])

  if (!currentMark || !targetRect) return null

  // Clamp tooltip position to viewport
  const vw = window.innerWidth
  const vh = window.innerHeight
  const half = TOOLTIP_WIDTH / 2
  const targetCenterX = targetRect.left + targetRect.width / 2
  const clampedLeft = Math.max(16, Math.min(vw - TOOLTIP_WIDTH - 16, targetCenterX - half))

  let tooltipStyle = {
    position: 'fixed',
    zIndex: 10001,
    width: `${TOOLTIP_WIDTH}px`,
    maxWidth: '90vw',
  }

  if (currentMark.position === 'bottom') {
    tooltipStyle = { ...tooltipStyle, top: Math.min(vh - 180, targetRect.bottom + 12), left: clampedLeft }
  } else if (currentMark.position === 'top') {
    tooltipStyle = { ...tooltipStyle, bottom: Math.min(vh - 40, vh - targetRect.top + 12), left: clampedLeft }
  } else if (currentMark.position === 'right') {
    const rightLeft = Math.min(vw - TOOLTIP_WIDTH - 16, targetRect.right + 12)
    tooltipStyle = { ...tooltipStyle, top: Math.max(16, Math.min(vh - 180, targetRect.top + targetRect.height / 2 - 60)), left: rightLeft }
  } else if (currentMark.position === 'left') {
    tooltipStyle = { ...tooltipStyle, top: Math.max(16, Math.min(vh - 180, targetRect.top + targetRect.height / 2 - 60)), right: Math.max(16, vw - targetRect.left + 12) }
  } else {
    // Default: bottom
    tooltipStyle = { ...tooltipStyle, top: Math.min(vh - 180, targetRect.bottom + 12), left: clampedLeft }
  }

  // Spotlight cutout — use clipPath to dim everything except the target
  const pad = 6
  const cutoutLeft = Math.max(0, targetRect.left - pad)
  const cutoutTop = Math.max(0, targetRect.top - pad)
  const cutoutRight = Math.min(vw, targetRect.right + pad)
  const cutoutBottom = Math.min(vh, targetRect.bottom + pad)

  const spotlightClip = `polygon(
    0 0, 100% 0, 100% 100%, 0 100%, 0 0,
    ${cutoutLeft}px ${cutoutTop}px,
    ${cutoutLeft}px ${cutoutBottom}px,
    ${cutoutRight}px ${cutoutBottom}px,
    ${cutoutRight}px ${cutoutTop}px,
    ${cutoutLeft}px ${cutoutTop}px
  )`

  const isLast = currentIndex >= totalInGroup - 1

  return createPortal(
    <>
      {/* Dim overlay with spotlight cutout */}
      <div
        onClick={dismissAll}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(8, 16, 32, 0.55)',
          clipPath: spotlightClip,
          WebkitClipPath: spotlightClip,
          cursor: 'pointer',
          animation: 'lynxCoachMarkFade 0.25s ease-out',
        }}
      />

      {/* Spotlight ring */}
      <div
        style={{
          position: 'fixed',
          zIndex: 10000,
          left: cutoutLeft,
          top: cutoutTop,
          width: cutoutRight - cutoutLeft,
          height: cutoutBottom - cutoutTop,
          borderRadius: '10px',
          border: '2px solid #4BB9EC',
          boxShadow: '0 0 0 4px rgba(75, 185, 236, 0.25), 0 0 24px rgba(75, 185, 236, 0.35)',
          pointerEvents: 'none',
          animation: 'lynxCoachMarkPulse 2s ease-in-out infinite',
        }}
      />

      {/* Tooltip card */}
      <div style={tooltipStyle}>
        <div
          style={{
            background: '#10284C',
            borderRadius: '14px',
            padding: '16px 18px',
            color: 'white',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            border: '1px solid rgba(75, 185, 236, 0.25)',
            animation: 'lynxCoachMarkPop 0.22s ease-out',
          }}
        >
          {/* Mascot + title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px' }}>🐾</span>
            <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
              {currentMark.title}
            </p>
          </div>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: '0 0 14px', lineHeight: 1.45 }}>
            {currentMark.body}
          </p>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', opacity: 0.5 }}>
              {currentIndex + 1} of {totalInGroup}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isLast && (
                <button
                  onClick={dismissAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '6px 4px',
                  }}
                >
                  Skip all
                </button>
              )}
              <button
                onClick={nextMark}
                style={{
                  background: '#4BB9EC',
                  border: 'none',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '7px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {isLast ? 'Got it!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframes (scoped global) */}
      <style>{`
        @keyframes lynxCoachMarkFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lynxCoachMarkPop {
          from { opacity: 0; transform: translateY(4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lynxCoachMarkPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(75, 185, 236, 0.25), 0 0 24px rgba(75, 185, 236, 0.35); }
          50% { box-shadow: 0 0 0 6px rgba(75, 185, 236, 0.35), 0 0 32px rgba(75, 185, 236, 0.45); }
        }
      `}</style>
    </>,
    document.body
  )
}
