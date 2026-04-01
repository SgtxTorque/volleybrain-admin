// =============================================================================
// V2DashboardLayout — Shared page-level layout skeleton for all role dashboards
// 2-column grid: main content (1fr) + sidebar (340px).
// Optional 3-column: main (1fr) + engagement (220px) + sidebar (340px).
// Props-only. Does NOT replace current dashboard pages — they adopt this in Phase 2-6.
// =============================================================================

export default function V2DashboardLayout({
  mainContent,
  engagementContent,
  sideContent,
  variant = 'light',
}) {
  const hasEngagement = !!engagementContent
  return (
    <div
      className="v2-dashboard"
      data-variant={variant}
      style={{
        padding: '28px 32px 80px',
        fontFamily: 'var(--v2-font)',
      }}
    >
      <div
        className={`v2-dashboard-grid ${hasEngagement ? 'v2-dashboard-grid--3col' : ''}`}
        style={{
          display: 'grid',
          gridTemplateColumns: hasEngagement ? '1fr 220px 340px' : '1fr 340px',
          gap: 24,
        }}
      >
        {/* Main column */}
        <div
          className="v2-dashboard-main"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 0,
          }}
        >
          {mainContent}
        </div>

        {/* Engagement column (optional) */}
        {hasEngagement && (
          <div
            className="v2-dashboard-engage"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {engagementContent}
          </div>
        )}

        {/* Sidebar column */}
        <div
          className="v2-dashboard-side"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {sideContent}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1400px) {
          .v2-dashboard-grid--3col {
            grid-template-columns: 1fr 340px !important;
          }
          .v2-dashboard-engage {
            grid-column: 1 / -1;
            display: grid !important;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px !important;
          }
        }
        @media (max-width: 1100px) {
          .v2-dashboard { padding: 20px 24px 80px !important; }
          .v2-dashboard-grid { grid-template-columns: 1fr !important; }
          .v2-dashboard-engage {
            grid-template-columns: 1fr 1fr !important;
          }
          .v2-dashboard-side {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 16px !important;
          }
          .v2-dashboard-side > :first-child {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 700px) {
          .v2-dashboard { padding: 16px 16px 80px !important; }
          .v2-dashboard-engage {
            grid-template-columns: 1fr !important;
          }
          .v2-dashboard-side {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
