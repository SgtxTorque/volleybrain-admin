// =============================================================================
// DashboardContainer — Wraps dashboard content with responsive padding
// Content fills available space to the right of the sidebar
// =============================================================================

export default function DashboardContainer({ children, className = '' }) {
  return (
    <div className={`w-full py-r-4 ${className}`}>
      {children}
    </div>
  )
}
