// =============================================================================
// DashboardContainer — Wraps dashboard content with max-width + responsive padding
// Prevents content from stretching on ultrawide monitors (2560px+)
// Centers content within 1600px max-width
// =============================================================================

export default function DashboardContainer({ children, className = '' }) {
  return (
    <div className={`w-full max-w-dashboard mx-auto px-r-4 py-r-4 ${className}`}>
      {children}
    </div>
  )
}
