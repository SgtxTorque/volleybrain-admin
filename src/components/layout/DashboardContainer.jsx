// =============================================================================
// DashboardContainer — Wraps dashboard content with responsive padding
// Content fills available space to the right of the sidebar
// =============================================================================

export default function DashboardContainer({ children, className = '' }) {
  return (
    <div className={`w-full px-r-4 py-r-4 ${className}`}>
      {children}
    </div>
  )
}
