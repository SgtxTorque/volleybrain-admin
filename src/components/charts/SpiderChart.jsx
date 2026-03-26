/**
 * SpiderChart — SVG radar chart for skill ratings
 * @param {Object} props
 * @param {Array<{label: string, value: number}>} props.data — skill ratings
 * @param {Array<{label: string, value: number}>} [props.compareData] — optional overlay for comparison
 * @param {number} [props.maxValue=5] — maximum value on the scale
 * @param {number} [props.size=280] — width/height of the chart
 * @param {string} [props.color='#4BB9EC'] — primary fill color
 * @param {string} [props.compareColor='#94A3B8'] — comparison fill color
 * @param {string} [props.compareStrokeDash] — optional dash pattern for compare stroke (e.g. "4,4")
 * @param {boolean} [props.isDark] — dark mode flag
 */
export default function SpiderChart({
  data,
  compareData,
  maxValue = 5,
  size = 280,
  color = '#4BB9EC',
  compareColor = '#94A3B8',
  compareStrokeDash,
  isDark,
}) {
  if (!data || data.length < 3) return null

  const center = size / 2
  const radius = (size - 60) / 2
  const angleStep = (2 * Math.PI) / data.length

  function getPoint(index, value) {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / maxValue) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  function getPolygonPoints(values) {
    return values.map((d, i) => {
      const pt = getPoint(i, d.value)
      return `${pt.x},${pt.y}`
    }).join(' ')
  }

  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const rings = Array.from({ length: 5 }, (_, i) => ((i + 1) / 5) * maxValue)

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid rings */}
      {rings.map(level => {
        const points = data.map((_, i) => {
          const pt = getPoint(i, level)
          return `${pt.x},${pt.y}`
        }).join(' ')
        return (
          <polygon key={level} points={points} fill="none"
            stroke={gridColor} strokeWidth="1" />
        )
      })}

      {/* Axis lines */}
      {data.map((_, i) => {
        const pt = getPoint(i, maxValue)
        return (
          <line key={i} x1={center} y1={center} x2={pt.x} y2={pt.y}
            stroke={gridColor} strokeWidth="1" />
        )
      })}

      {/* Comparison data (if provided) */}
      {compareData && compareData.length === data.length && (
        <>
          <polygon
            points={getPolygonPoints(compareData)}
            fill={`${compareColor}30`}
            stroke={compareColor}
            strokeWidth="2.5"
            strokeDasharray={compareStrokeDash || undefined}
          />
          {compareData.map((d, i) => {
            const pt = getPoint(i, d.value)
            return (
              <circle key={`c-${i}`} cx={pt.x} cy={pt.y} r="3"
                fill={compareColor} stroke="white" strokeWidth="1.5" />
            )
          })}
        </>
      )}

      {/* Primary data — solid fill */}
      <polygon
        points={getPolygonPoints(data)}
        fill={`${color}35`}
        stroke={color}
        strokeWidth="2.5"
      />

      {/* Data points */}
      {data.map((d, i) => {
        const pt = getPoint(i, d.value)
        return (
          <circle key={i} cx={pt.x} cy={pt.y} r="4"
            fill={color} stroke="white" strokeWidth="2" />
        )
      })}

      {/* Labels */}
      {data.map((d, i) => {
        const labelPt = getPoint(i, maxValue + 0.8)
        return (
          <text key={i} x={labelPt.x} y={labelPt.y}
            textAnchor="middle" dominantBaseline="middle"
            className={`text-[12px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
