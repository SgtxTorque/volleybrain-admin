// =============================================================================
// AdminRegistrationsTab — V2 registrations summary for admin dashboard tabs
// Props-only. Compact 1x6 stat chips + funnel + player list + view all.
// =============================================================================

import { parseLocalDate } from '../../../lib/date-helpers'

export default function AdminRegistrationsTab({
  stats = {},
  registrationPlayers = [],
  onNavigate,
}) {
  const items = [
    { label: 'Total', value: stats.totalRegistrations || 0, color: 'var(--v2-text-primary)', bg: 'var(--v2-surface)' },
    { label: 'Pending', value: stats.pending || 0, color: (stats.pending || 0) > 0 ? '#D97706' : 'var(--v2-text-muted)', bg: (stats.pending || 0) > 0 ? 'rgba(245,158,11,0.08)' : 'var(--v2-surface)' },
    { label: 'Approved', value: stats.approved || 0, color: 'var(--v2-green)', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Rostered', value: stats.rostered || stats.rosteredPlayers || 0, color: 'var(--v2-sky)', bg: 'rgba(75,185,236,0.08)' },
    { label: 'Waitlisted', value: stats.waitlisted || 0, color: 'var(--v2-purple)', bg: 'rgba(139,92,246,0.08)' },
    { label: 'Denied', value: stats.denied || 0, color: 'var(--v2-coral)', bg: 'rgba(239,68,68,0.08)' },
  ]

  // Filter to players not fully at the finish line (not rostered/active)
  const needsAttention = registrationPlayers.filter(p => {
    const status = p.registrations?.[0]?.status
    return !['rostered', 'active'].includes(status)
  })

  // Sort: pending first, then approved, then everything else
  const statusOrder = { pending: 0, submitted: 0, new: 0, approved: 1, waitlisted: 2, withdrawn: 3, denied: 3 }
  const sorted = [...needsAttention].sort((a, b) => {
    const sa = a.registrations?.[0]?.status || ''
    const sb = b.registrations?.[0]?.status || ''
    return (statusOrder[sa] ?? 9) - (statusOrder[sb] ?? 9)
  }).slice(0, 10)

  const allComplete = registrationPlayers.length > 0 && needsAttention.length === 0

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'Pending', bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
      submitted: { label: 'Pending', bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
      new: { label: 'New', bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
      approved: { label: 'Approved', bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
      rostered: { label: 'Rostered', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
      active: { label: 'Rostered', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
      waitlisted: { label: 'Waitlisted', bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
      denied: { label: 'Denied', bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
      withdrawn: { label: 'Withdrawn', bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
    }
    const s = map[status] || { label: status || '—', bg: 'var(--v2-surface)', color: 'var(--v2-text-muted)' }
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        background: s.bg, color: s.color, whiteSpace: 'nowrap',
      }}>
        {s.label}
      </span>
    )
  }

  const getAge = (dob) => {
    if (!dob) return null
    const d = parseLocalDate(dob)
    const diff = Date.now() - d.getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  const gradients = [
    'linear-gradient(135deg, #4BB9EC, #2E8BC0)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #F43F5E, #E11D48)',
  ]

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Compact 1x6 stat chips */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            flex: '1 1 0',
            minWidth: 80,
            background: item.bg,
            borderRadius: 10, padding: '12px 8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>
              {item.value}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2, letterSpacing: '0.03em' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity bar */}
      {stats.capacity > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--v2-text-muted)', marginBottom: 6 }}>
            <span>Capacity</span>
            <span>{stats.totalRegistrations || 0} / {stats.capacity}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--v2-surface)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'var(--v2-sky)',
              width: `${Math.min(100, ((stats.totalRegistrations || 0) / stats.capacity) * 100)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Registration funnel visual */}
      <div style={{
        padding: 16, background: 'var(--v2-surface)', borderRadius: 10,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 10, letterSpacing: '0.04em' }}>
          Registration Funnel
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { label: 'Submitted', count: stats.totalRegistrations || 0, color: 'var(--v2-text-primary)' },
            { label: 'Approved', count: stats.approved || 0, color: 'var(--v2-green)' },
            { label: 'Rostered', count: stats.rostered || stats.rosteredPlayers || 0, color: 'var(--v2-sky)' },
          ].map((step, i) => {
            const total = stats.totalRegistrations || 1
            const pct = Math.max(4, (step.count / total) * 100)
            return (
              <div key={i} style={{ flex: `${pct} 0 0`, minWidth: 40 }}>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: step.color, opacity: 0.7,
                  marginBottom: 4,
                }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: step.color, textAlign: 'center' }}>
                  {step.count}
                </div>
                <div style={{ fontSize: 9, color: 'var(--v2-text-muted)', textAlign: 'center' }}>
                  {step.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Player registration list */}
      {allComplete ? (
        <div style={{
          padding: '24px 16px', textAlign: 'center', marginBottom: 20,
          background: 'rgba(16,185,129,0.06)', borderRadius: 10,
          border: '1px solid rgba(16,185,129,0.15)',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>&#10003;</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-green)' }}>
            All registrations complete
          </div>
          <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Every player is rostered and ready to go.
          </div>
        </div>
      ) : sorted.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 140px 120px 80px',
            gap: 8, padding: '10px 12px',
            background: 'var(--v2-surface)',
            borderRadius: '10px 10px 0 0',
            borderBottom: '1px solid var(--v2-border-subtle)',
          }}>
            {['', 'Player', 'Parent', 'Contact', 'Status'].map((h, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Player rows */}
          {sorted.map((p, i) => {
            const status = p.registrations?.[0]?.status
            const age = getAge(p.date_of_birth)
            const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()
            return (
              <div key={p.id || i} style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 140px 120px 80px',
                gap: 8, padding: '10px 12px',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
                alignItems: 'center',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: gradients[i % gradients.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#FFFFFF',
                }}>
                  {initials}
                </div>

                {/* Player name + age/grade */}
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                    {p.first_name} {p.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                    {age ? `Age ${age}` : ''}{age && p.grade ? ' · ' : ''}{p.grade ? `Gr ${p.grade}` : ''}
                  </div>
                </div>

                {/* Parent */}
                <div style={{ fontSize: 13, color: 'var(--v2-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.parent_name || '—'}
                </div>

                {/* Contact */}
                <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.parent_phone || p.parent_email || '—'}
                </div>

                {/* Status */}
                <div>
                  {getStatusBadge(status)}
                </div>
              </div>
            )
          })}

          {needsAttention.length > 10 && (
            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                +{needsAttention.length - 10} more
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <button
        onClick={() => onNavigate?.('registrations')}
        style={{
          width: '100%', padding: 10, borderRadius: 10,
          fontSize: 12, fontWeight: 700,
          background: 'var(--v2-navy)', color: '#FFFFFF',
          border: 'none', cursor: 'pointer',
          transition: 'opacity 0.15s ease',
        }}
      >
        View All Registrations &rarr;
      </button>
    </div>
  )
}
