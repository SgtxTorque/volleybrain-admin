// =============================================================================
// EngagementTeamPulseCard — Shared team pulse card for all role dashboards
// Props:
//   active, drifting, inactive = numbers
//   title = string (default "Team Pulse")
// =============================================================================

export default function EngagementTeamPulseCard({ active = 0, drifting = 0, inactive = 0, title = 'Team Pulse' }) {
  const total = active + drifting + inactive || 1
  const activePct = (active / total) * 100
  const driftingPct = (drifting / total) * 100
  const inactivePct = (inactive / total) * 100

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      padding: 14, border: '1px solid #E8ECF2',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#334155', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1D9E75' }}>{active}</div>
          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Active</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EF9F27' }}>{drifting}</div>
          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Drifting</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#E24B4A' }}>{inactive}</div>
          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Inactive</div>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', background: '#F1F5F9' }}>
        {activePct > 0 && (
          <div style={{ width: `${activePct}%`, background: '#1D9E75', transition: 'width 0.5s ease' }} />
        )}
        {driftingPct > 0 && (
          <div style={{ width: `${driftingPct}%`, background: '#EF9F27', transition: 'width 0.5s ease' }} />
        )}
        {inactivePct > 0 && (
          <div style={{ width: `${inactivePct}%`, background: '#E24B4A', transition: 'width 0.5s ease' }} />
        )}
      </div>
    </div>
  )
}
