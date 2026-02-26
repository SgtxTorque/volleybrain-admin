// =============================================================================
// LevelBadge — Compact circular level indicator with tier colors
// =============================================================================

import { getLevelTier } from '../../lib/engagement-constants'

const SIZES = {
  small: { badge: 20, font: 10, border: 1 },
  medium: { badge: 28, font: 13, border: 1.5 },
  large: { badge: 40, font: 18, border: 2 },
}

export default function LevelBadge({ level, size = 'small', className = '' }) {
  if (!level || level <= 0) return null

  const tier = getLevelTier(level)
  const dims = SIZES[size]

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full ${className}`}
      style={{
        width: dims.badge,
        height: dims.badge,
        borderWidth: dims.border,
        borderStyle: 'solid',
        borderColor: tier.color,
        backgroundColor: tier.color + '20',
      }}
    >
      <span
        className="font-extrabold leading-none"
        style={{ fontSize: dims.font, color: tier.color }}
      >
        {level}
      </span>
    </div>
  )
}
