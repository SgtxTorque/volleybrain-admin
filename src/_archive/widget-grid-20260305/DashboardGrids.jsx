// =============================================================================
// DashboardGrids — Standard responsive grid layouts used across dashboards
// Handles breakpoints automatically: mobile → tablet → laptop → desktop
// =============================================================================

// Hero + sidebar (60/40 split, stacks on small screens)
export function HeroGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-r-4 items-stretch ${className}`}>
      {children}
    </div>
  )
}

// Two equal columns (stacks on small screens)
export function TwoColGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-r-4 ${className}`}>
      {children}
    </div>
  )
}

// Three columns (stacks to 2+1 on medium, full stack on small)
export function ThreeColGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-r-4 ${className}`}>
      {children}
    </div>
  )
}

// Four stat cards (2x2 on medium, 4 across on large)
export function StatGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-r-3 ${className}`}>
      {children}
    </div>
  )
}

// KPI row (scrolls horizontally on small screens, grid on large)
export function KPIGrid({ children, className = '' }) {
  return (
    <div className={`flex gap-r-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible ${className}`}>
      {children}
    </div>
  )
}
