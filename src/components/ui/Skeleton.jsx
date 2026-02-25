import { useTheme } from '../../contexts/ThemeContext'

// ============================================
// SKELETON / SHIMMER LOADING COMPONENTS
// ============================================

// Base shimmer animation keyframes (injected once)
const shimmerCSS = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`

let injected = false
function injectShimmerCSS() {
  if (injected) return
  const style = document.createElement('style')
  style.textContent = shimmerCSS
  document.head.appendChild(style)
  injected = true
}

function ShimmerBase({ className = '', style = {}, rounded = 'rounded-lg' }) {
  const { isDark } = useTheme()
  injectShimmerCSS()

  const base = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const highlight = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'

  return (
    <div
      className={`${rounded} ${className}`}
      style={{
        background: `linear-gradient(90deg, ${base} 0%, ${highlight} 40%, ${base} 80%)`,
        backgroundSize: '800px 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

// ---- Primitive Shapes ----

export function SkeletonLine({ width = '100%', height = '14px', className = '' }) {
  return <ShimmerBase className={className} style={{ width, height }} rounded="rounded" />
}

export function SkeletonCircle({ size = '40px', className = '' }) {
  return <ShimmerBase className={className} style={{ width: size, height: size }} rounded="rounded-full" />
}

export function SkeletonRect({ width = '100%', height = '120px', className = '' }) {
  return <ShimmerBase className={className} style={{ width, height }} />
}

// ---- Composite Skeletons ----

export function SkeletonCard({ className = '' }) {
  const { isDark } = useTheme()
  return (
    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-white/[0.06]' : 'bg-white border-slate-200'} ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size="36px" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="60%" height="16px" />
          <SkeletonLine width="40%" height="12px" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLine width="100%" />
        <SkeletonLine width="85%" />
        <SkeletonLine width="70%" />
      </div>
    </div>
  )
}

export function SkeletonMetricCard({ className = '' }) {
  const { isDark } = useTheme()
  return (
    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-white/[0.06]' : 'bg-white border-slate-200'} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <SkeletonLine width="80px" height="12px" />
        <SkeletonCircle size="28px" />
      </div>
      <SkeletonLine width="50%" height="28px" className="mb-2" />
      <SkeletonLine width="60%" height="12px" />
    </div>
  )
}

export function SkeletonTableRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine width={i === 0 ? '70%' : `${50 + Math.random() * 30}%`} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 5, className = '' }) {
  const { isDark } = useTheme()
  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/60 border-white/[0.06]' : 'bg-white border-slate-200'} ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLine key={i} width={`${60 + Math.random() * 40}px`} height="12px" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Metric cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>
      {/* Content cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Table */}
      <SkeletonTable rows={4} cols={5} />
    </div>
  )
}

export function SkeletonList({ items = 5, className = '' }) {
  const { isDark } = useTheme()
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          <SkeletonCircle size="36px" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width={`${55 + Math.random() * 25}%`} height="14px" />
            <SkeletonLine width={`${35 + Math.random() * 25}%`} height="11px" />
          </div>
          <SkeletonLine width="60px" height="24px" />
        </div>
      ))}
    </div>
  )
}

// ---- Page-level Skeleton Presets ----

export function SkeletonTeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonLine width="140px" height="24px" />
        <SkeletonRect width="120px" height="36px" className="rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonRegistrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonLine width="180px" height="24px" />
        <div className="flex gap-2">
          <SkeletonRect width="100px" height="36px" className="rounded-xl" />
          <SkeletonRect width="100px" height="36px" className="rounded-xl" />
        </div>
      </div>
      {/* Status tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRect key={i} width="80px" height="32px" className="rounded-full" />
        ))}
      </div>
      <SkeletonTable rows={6} cols={6} />
    </div>
  )
}

export function SkeletonSchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonLine width="160px" height="24px" />
        <div className="flex gap-2">
          <SkeletonRect width="36px" height="36px" className="rounded-lg" />
          <SkeletonRect width="36px" height="36px" className="rounded-lg" />
          <SkeletonRect width="120px" height="36px" className="rounded-xl" />
        </div>
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonLine key={i} width="100%" height="14px" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonRect key={i} width="100%" height="80px" className="rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonPaymentsPage() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  )
}
