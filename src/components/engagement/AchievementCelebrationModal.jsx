// =============================================================================
// AchievementCelebrationModal — Full-screen celebration for desktop
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Share2, Trophy, X } from 'lucide-react'
import { RARITY_CONFIG } from '../../lib/engagement-constants'
import { useTheme } from '../../contexts/ThemeContext'

// =============================================================================
// Confetti System (CSS-based for web)
// =============================================================================

const PARTICLE_COUNT = 30
const PARTICLE_COLORS = ['#FFD700', '#FF3B3B', '#3B82F6', '#A855F7', '#10B981', '#F97316', '#EC4899']

function Confetti({ active }) {
  if (!active) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const duration = 2 + Math.random() * 1.5
        const size = 6 + Math.random() * 8
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${left}%`,
              top: '-20px',
              width: size,
              height: size,
              backgroundColor: color,
              animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          70% { opacity: 0.8; }
          100% { transform: translateY(100vh) rotate(${360 + Math.random() * 720}deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export default function AchievementCelebrationModal({ unseen, onDismiss, onViewAllTrophies }) {
  const { isDark } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfetti, setShowConfetti] = useState(true)
  const [animateIn, setAnimateIn] = useState(false)

  const current = unseen?.[currentIndex]
  const isLast = currentIndex >= (unseen?.length || 1) - 1

  useEffect(() => {
    setAnimateIn(false)
    setShowConfetti(true)
    const t = setTimeout(() => setAnimateIn(true), 50)
    const t2 = setTimeout(() => setShowConfetti(false), 3000)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [currentIndex])

  if (!unseen?.length || !current?.achievements) return null

  const ach = current.achievements
  const rarity = ach.rarity || 'common'
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common

  let howEarned = ach.how_to_earn || ach.description || ''
  if (current.gameName) howEarned += howEarned ? ` — ${current.gameName}` : current.gameName
  if (current.gameDate) howEarned += ` on ${current.gameDate}`

  const handleNext = () => setCurrentIndex(prev => prev + 1)
  const handleDone = () => onDismiss()

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center">
      <Confetti active={showConfetti} />

      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.85)', opacity: animateIn ? 1 : 0 }}
        onClick={handleDone}
      />

      {/* Content */}
      <div
        className="relative max-w-sm w-full mx-4 flex flex-col items-center text-center transition-all duration-500"
        style={{
          transform: animateIn ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(30px)',
          opacity: animateIn ? 1 : 0,
        }}
      >
        {/* Close */}
        <button
          onClick={handleDone}
          className="absolute top-0 right-0 p-2 rounded-full transition hover:bg-white/10"
        >
          <X className="w-5 h-5 text-white/50" />
        </button>

        {/* Counter */}
        {unseen.length > 1 && (
          <p className="text-xs font-semibold tracking-widest text-white/30 mb-2">
            {currentIndex + 1} of {unseen.length}
          </p>
        )}

        {/* Header */}
        <h2
          className="text-sm font-black tracking-[4px] uppercase mb-6"
          style={{ color: rarityConfig.glowColor }}
        >
          ACHIEVEMENT UNLOCKED
        </h2>

        {/* Badge */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-5 transition-transform duration-700"
          style={{
            background: `${rarityConfig.glowColor}20`,
            boxShadow: `0 0 40px ${rarityConfig.glowColor}30, 0 0 80px ${rarityConfig.glowColor}15`,
            transform: animateIn ? 'scale(1)' : 'scale(0.3)',
          }}
        >
          <span className="text-5xl">{ach.icon || '🏆'}</span>
        </div>

        {/* Name */}
        <h3 className="text-2xl font-extrabold text-white mb-2">{ach.name}</h3>

        {/* Rarity pill */}
        <div
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full mb-4"
          style={{ background: rarityConfig.bg }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: rarityConfig.text }} />
          <span
            className="text-xs font-extrabold uppercase tracking-wider"
            style={{ color: rarityConfig.text }}
          >
            {rarityConfig.label}
          </span>
        </div>

        {/* How earned */}
        {howEarned && (
          <p className="text-sm text-white/50 leading-relaxed mb-3 max-w-xs">{howEarned}</p>
        )}

        {/* Stat value */}
        {current.stat_value_at_unlock != null && ach.stat_key && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl mb-5"
            style={{
              background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.1)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.15)'}`,
            }}
          >
            <span className="text-xs font-bold text-white">
              {current.stat_value_at_unlock} {ach.stat_key.replace('total_', '').replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={onViewAllTrophies}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,.15)', color: '#FFD700' }}
          >
            <Trophy className="w-4 h-4" />
            View All
          </button>
        </div>

        {/* Next / Done */}
        <button
          onClick={isLast ? handleDone : handleNext}
          className="px-12 py-3.5 rounded-xl text-sm font-extrabold text-black transition hover:opacity-90"
          style={{
            background: rarityConfig.glowColor,
            boxShadow: `0 4px 20px ${rarityConfig.glowColor}40`,
          }}
        >
          {isLast ? 'Done' : `Next (${currentIndex + 2}/${unseen.length})`}
        </button>
      </div>
    </div>
  )
}
