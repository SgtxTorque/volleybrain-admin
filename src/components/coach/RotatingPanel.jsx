import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * RotatingPanel — Auto-rotating card container
 * Rotates between children every `interval` ms, pauses on hover.
 */
export default function RotatingPanel({ children, interval = 8000 }) {
  const { isDark } = useTheme()
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const panelCount = React.Children.count(children)

  useEffect(() => {
    if (paused || panelCount <= 1) return
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % panelCount)
    }, interval)
    return () => clearInterval(timer)
  }, [paused, panelCount, interval])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative h-full flex flex-col"
    >
      <div className="flex-1 min-h-0">
        {React.Children.toArray(children)[activeIndex]}
      </div>

      {panelCount > 1 && (
        <div className="flex gap-1.5 justify-center py-2">
          {Array.from({ length: panelCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition ${
                i === activeIndex ? 'bg-lynx-sky' : isDark ? 'bg-white/20' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
