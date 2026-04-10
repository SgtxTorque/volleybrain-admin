// =============================================================================
// KidCards — V2 horizontal scrolling child player cards for parent dashboard
// Props-only. Fixed-size cards with OVR, navy action buttons.
// =============================================================================

import { useRef, useState, useEffect } from 'react'

export default function KidCards({
  children = [],
  selectedChildId,
  onChildSelect,
  onViewProfile,
  onViewPlayerCard,
  onMessageCoach,
  onCreatePlayerPass,
  onManagePlayerPass,
}) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const gradients = [
    'linear-gradient(135deg, #4BB9EC, #2E8BC0)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #F43F5E, #E11D48)',
  ]

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [children.length])

  const scrollBy = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' })
  }

  const statusBadge = (status) => {
    const map = {
      active: { label: 'Active', bg: '#DCFCE7', color: '#166534', hint: '' },
      rostered: { label: 'Active', bg: '#DCFCE7', color: '#166534', hint: '' },
      pending: { label: 'Awaiting Placement', bg: '#DBEAFE', color: '#1E40AF', hint: 'Your child will be assigned to a team soon.' },
      approved: { label: 'Approved', bg: '#DBEAFE', color: '#1E40AF', hint: '' },
      waitlisted: { label: 'Waitlisted', bg: 'rgba(139,92,246,0.1)', color: '#7C3AED', hint: 'On the waitlist — you\'ll be notified if a spot opens.' },
    }
    const s = map[status] || map.active
    return s
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)', position: 'relative' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          color: 'var(--v2-text-muted)', letterSpacing: '0.04em',
        }}>
          My Players
        </div>
        {(canScrollLeft || canScrollRight) && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canScrollLeft}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: canScrollLeft ? 'var(--v2-navy)' : 'var(--v2-surface)',
                border: 'none',
                cursor: canScrollLeft ? 'pointer' : 'default',
                opacity: canScrollLeft ? 1 : 0.4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: canScrollLeft ? '#FFFFFF' : 'var(--v2-text-muted)',
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canScrollRight}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: canScrollRight ? 'var(--v2-navy)' : 'var(--v2-surface)',
                border: 'none',
                cursor: canScrollRight ? 'pointer' : 'default',
                opacity: canScrollRight ? 1 : 0.4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: canScrollRight ? '#FFFFFF' : 'var(--v2-text-muted)',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children.map((child, i) => {
          const isSelected = child.id === selectedChildId
          const initials = child.initials || `${child.firstName?.[0] || ''}${child.lastName?.[0] || ''}`.toUpperCase()
          const gradient = child.avatarGradient || gradients[i % gradients.length]
          const sBadge = statusBadge(child.registrationStatus)

          return (
            <div
              key={child.id}
              onClick={() => onChildSelect?.(child.id)}
              style={{
                minWidth: 260,
                maxWidth: 300,
                flexShrink: 0,
                scrollSnapAlign: 'start',
                background: isSelected ? 'rgba(75,185,236,0.03)' : '#FFFFFF',
                borderRadius: 14,
                padding: 20,
                border: isSelected ? '2px solid var(--v2-sky)' : '1px solid var(--v2-border-subtle)',
                boxShadow: isSelected ? '0 4px 12px rgba(75,185,236,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Status pill — top right */}
              <div style={{ position: 'absolute', top: 12, right: 12, textAlign: 'right', maxWidth: 160 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  background: sBadge.bg, color: sBadge.color, textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  {sBadge.label}
                </span>
                {sBadge.hint && (
                  <p style={{ fontSize: 9, color: 'var(--v2-text-muted)', marginTop: 3, lineHeight: 1.3 }}>
                    {sBadge.hint}
                  </p>
                )}
              </div>

              {/* Top — avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: child.photoUrl ? 12 : '50%',
                  background: gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: '#FFFFFF',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {child.photoUrl ? (
                    <img src={child.photoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    initials
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--v2-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {child.firstName} {child.lastName}
                  </div>
                  {child.teamName && (
                    <div style={{ fontSize: 12, color: 'var(--v2-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {child.teamName}
                    </div>
                  )}
                  {(child.sportName || child.seasonName) && (
                    <div style={{ fontSize: 11, color: 'var(--v2-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[child.sportName, child.seasonName].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats grid — OVR, Record, Next */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8, marginBottom: child.badgeOrStreak ? 12 : 12,
              }}>
                <div style={{ textAlign: 'center', background: 'var(--v2-surface)', borderRadius: 8, padding: '8px 4px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-green)' }}>
                    {child.overallRating || '—'}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                    OVR
                  </div>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--v2-surface)', borderRadius: 8, padding: '8px 4px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-text-primary)' }}>
                    {child.record || '—'}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                    Record
                  </div>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--v2-surface)', borderRadius: 8, padding: '8px 4px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-text-primary)' }}>
                    {child.nextEvent || '—'}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                    Next
                  </div>
                </div>
              </div>

              {/* Badge/Streak chip */}
              {child.badgeOrStreak && (
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--v2-text-secondary)',
                  padding: '4px 8px', background: 'rgba(245,158,11,0.08)',
                  borderRadius: 6, display: 'inline-block', marginBottom: 12,
                }}>
                  {child.badgeOrStreak}
                </div>
              )}

              {/* Action buttons — both navy */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onViewProfile?.(child.id) }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: 'var(--v2-navy)', color: 'white',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
                >
                  Profile
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onViewPlayerCard?.(child.id) }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: 'var(--v2-navy)', color: 'white',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
                >
                  Player Card
                </button>
              </div>
              {/* Message Coach button */}
              {child.coachName && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMessageCoach?.(child.teamId, child.coachUserId, child.coachName) }}
                  style={{
                    width: '100%', marginTop: 8, padding: '7px 12px', borderRadius: 8,
                    border: '1px solid rgba(75,185,236,0.25)',
                    background: 'rgba(75,185,236,0.06)', color: 'var(--v2-sky, #4BB9EC)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(75,185,236,0.12)'; e.currentTarget.style.borderColor = 'rgba(75,185,236,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(75,185,236,0.06)'; e.currentTarget.style.borderColor = 'rgba(75,185,236,0.25)' }}
                >
                  💬 Message {child.coachName.split(' ')[0]}
                </button>
              )}
              {/* Player Pass button */}
              {child.playerAccountEnabled ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onManagePlayerPass?.(child) }}
                  style={{
                    width: '100%', marginTop: 8, padding: '7px 12px', borderRadius: 8,
                    border: '1px solid rgba(16,185,129,0.25)',
                    background: 'rgba(16,185,129,0.06)', color: '#10B981',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.06)' }}
                >
                  &#9889; Manage Player Login
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onCreatePlayerPass?.(child) }}
                  style={{
                    width: '100%', marginTop: 8, padding: '7px 12px', borderRadius: 8,
                    border: '1px solid rgba(139,92,246,0.25)',
                    background: 'rgba(139,92,246,0.06)', color: '#8B5CF6',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)' }}
                >
                  &#9889; Create Player Login
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Hide scrollbar via inline style tag */}
      <style>{`
        div[style*="scrollbar-width: none"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
