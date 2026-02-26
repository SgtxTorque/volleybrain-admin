// =============================================================================
// HexBadge — CSS hexagonal badge with value and label (web equivalent)
// =============================================================================

const SIZE_MAP = {
  large: { dim: 56, value: 20, label: 9 },
  medium: { dim: 40, value: 14, label: 7 },
  small: { dim: 28, value: 10, label: 6 },
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
  const { dim, value: valueFontSize, label: labelFontSize } = SIZE_MAP[size]

  // CSS clip-path hexagon
  const clipPath = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex items-center justify-center transition-transform hover:scale-110"
        style={{
          width: dim + 4,
          height: dim + 4,
        }}
      >
        {/* Outer border hex */}
        <div
          className="absolute inset-0"
          style={{
            clipPath,
            backgroundColor: borderColor,
          }}
        />
        {/* Inner fill hex */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            clipPath,
            backgroundColor: bgColor,
          }}
        >
          <span
            className="font-black text-center leading-none"
            style={{ fontSize: valueFontSize, color: valueColor, letterSpacing: '0.5px' }}
          >
            {value}
          </span>
        </div>
      </div>
      {size !== 'small' && (
        <span
          className="font-bold uppercase tracking-wider text-center"
          style={{ fontSize: labelFontSize, color: labelColor }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
