// =============================================================================
// HexBadge — Hexagonal badge with CSS hex shape and glow effect
// =============================================================================

import React from 'react'

const SIZE_MAP = {
  large: 56,
  medium: 40,
  small: 28,
}

const FONT_SIZE = {
  large: { value: 20, label: 9 },
  medium: { value: 14, label: 7 },
  small: { value: 10, label: 6 },
}

function getHexPoints(cx, cy, r) {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    })
    .join(' ')
}

export default function HexBadge({
  size = 'medium',
  borderColor,
  value,
  label,
  valueColor = '#FFFFFF',
  labelColor = '#94A3B8',
  bgColor = 'rgba(255,255,255,0.08)',
}) {
  const dim = SIZE_MAP[size]
  const fonts = FONT_SIZE[size]
  const svgSize = dim + 4
  const center = svgSize / 2
  const radius = dim / 2
  const points = getHexPoints(center, center, radius)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="absolute inset-0"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <polygon
            points={points}
            fill={bgColor}
            stroke={borderColor}
            strokeWidth={2}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-black text-center"
          style={{ fontSize: fonts.value, color: valueColor, letterSpacing: '0.5px' }}
        >
          {value}
        </div>
      </div>
      {size !== 'small' && (
        <span
          className="mt-1 font-bold uppercase text-center"
          style={{ fontSize: fonts.label, color: labelColor, letterSpacing: '1px' }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
