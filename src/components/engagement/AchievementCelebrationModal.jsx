// =============================================================================
// AchievementCelebrationModal — Full-screen unlock celebration (desktop)
// =============================================================================

import { useState, useEffect, useRef } from 'react'
import { Share2, Trophy, ArrowRight } from 'lucide-react'
import { RARITY_CONFIG } from '../../lib/engagement-constants'
import { useTheme } from '../../contexts/ThemeContext'

// =============================================================================
// Confetti System (CSS-based)
// =============================================================================

const PARTICLE_COUNT = 30
const PARTICLE_COLORS = ['#FFD700', '#FF3B3B', '#3B82F6', '#A855F7', '#10B981', '#F97316', '#EC4899']

function Confetti({ active }) {
  if (!active) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 2
        const duration = 2 + Math.random() * 1.5
        const size = 6 + Math.random() * 8
        const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
        const rotation = Math.random() * 720

        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${left}%`,
              top: '-10px',
              width: size,
              height: size,
              backgroundColor: color,
              animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
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

  const current = unseen?.[currentIndex]
  const isLast = currentIndex >= (unseen?.length || 0) - 1

  // Reset confetti on index change
  useEffect(() => {
    setShowConfetti(false)
    const t = setTimeout(() => setShowConfetti(true), 50)
    return () => clearTimeout(t)
  }, [currentIndex])

  if (!current?.achievements) return null

  const ach = current.achievements
  const rarity = ach.rarity || 'common'
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common

  const handleNext = () => setCurrentIndex((prev) => prev + 1)

  // Build "how earned" context string
  let howEarned = ach.how_to_earn || ach.description || ''

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onDismiss} />

      {/* Confetti */}
      <Confetti active={showConfetti} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-8 animate-modal-in">
        {/* Counter for multi-unlock */}
        {(unseen?.length || 0) > 1 && (
          <p className="text-xs font-semibold text-slate-400 tracking-widest mb-2">
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

        {/* Badge with glow */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-5 animate-bounce-once"
          style={{
            backgroundColor: rarityConfig.glowColor + '20',
            boxShadow: `0 0 40px ${rarityConfig.glowColor}40, 0 0 80px ${rarityConfig.glowColor}20`,
          }}
        >
          <span className="text-6xl">{ach.icon || '🏆'}</span>
        </div>

        {/* Achievement name */}
        <h3 className="text-2xl font-extrabold text-white text-center mb-2">
          {ach.name}
        </h3>

        {/* Rarity pill */}
        <span
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4"
          style={{ backgroundColor: rarityConfig.bg, color: rarityConfig.color }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rarityConfig.color }} />
          {rarityConfig.label}
        </span>

        {/* How earned */}
        {howEarned && (
          <p className="text-sm text-slate-300 text-center leading-5 mb-3 max-w-xs">
            {howEarned}
          </p>
        )}

        {/* Stat value */}
        {current.stat_value_at_unlock != null && ach.stat_key && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-600 bg-slate-800/50 text-sm font-bold text-white mb-5">
            {current.stat_value_at_unlock} {ach.stat_key.replace('total_', '').replace(/_/g, ' ')}
          </span>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <button
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-600 bg-slate-800/50 text-white text-sm font-semibold hover:bg-slate-700/50 transition"
            onClick={onViewAllTrophies}
          >
            <Trophy size={16} className="text-yellow-400" />
            View All
          </button>
        </div>

        {/* Next / Done button */}
        <button
          className="px-12 py-3.5 rounded-2xl font-extrabold text-base text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: rarityConfig.glowColor }}
          onClick={isLast ? onDismiss : handleNext}
        >
          {isLast ? 'Done' : (
            <span className="flex items-center gap-2">
              Next <ArrowRight size={16} />
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes bounceOnce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-once {
          animation: bounceOnce 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
