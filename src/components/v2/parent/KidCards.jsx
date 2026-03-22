// =============================================================================
// KidCards — V2 horizontal scrolling child player cards for parent dashboard
// Props-only.
// =============================================================================

import { useRef, useState, useEffect } from 'react'

export default function KidCards({
  children = [],
  selectedChildId,
  onChildSelect,
  onViewProfile,
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
      active: { label: 'Active', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
      rostered: { label: 'Active', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
      pending: { label: 'Pending', bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
      approved: { label: 'Approved', bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
      waitlisted: { label: 'Waitlisted', bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
    }
    const s = map[status] || map.active
    return s
  }

  const isSingle = children.length === 1

  return (
    <div style={{ padding: '16px 24px', fontFamily: 'var(--v2-font)', position: 'relative' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          color: 'var(--v2-text-muted)', letterSpacing: '0.04em',
        }}>
          My Players
        </div>
        {!isSingle && (canScrollLeft || canScrollRight) && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canScrollLeft}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: canScrollLeft ? '#FFFFFF' : 'var(--v2-surface)',
                border: '1px solid var(--v2-border-subtle)',
                cursor: canScrollLeft ? 'pointer' : 'default',
                opacity: canScrollLeft ? 1 : 0.4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: 'var(--v2-text-muted)',
                boxShadow: canScrollLeft ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canScrollRight}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: canScrollRight ? '#FFFFFF' : 'var(--v2-surface)',
                border: '1px solid var(--v2-border-subtle)',
                cursor: canScrollRight ? 'pointer' : 'default',
                opacity: canScrollRight ? 1 : 0.4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: 'var(--v2-text-muted)',
                boxShadow: canScrollRight ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
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
          overflowX: isSingle ? 'visible' : 'auto',
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
                minWidth: isSingle ? '100%' : 280,
                maxWidth: isSingle ? '100%' : 320,
                flexShrink: 0,
                scrollSnapAlign: 'start',
                background: isSelected ? 'rgba(75,185,236,0.04)' : '#FFFFFF',
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
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  background: sBadge.bg, color: sBadge.color, textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  {sBadge.label}
                </span>
              </div>

              {/* Top — avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: '#FFFFFF',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {child.photoUrl ? (
                    <img src={child.photoUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    initials
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); onViewProfile?.(child.id) }}
                    style={{ fontSize: 15, fontWeight: 700, color: 'var(--v2-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
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

              {/* Stats grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8, marginBottom: child.badgeOrStreak ? 12 : 0,
              }}>
                <div style={{ textAlign: 'center', background: 'var(--v2-surface)', borderRadius: 8, padding: '8px 4px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-green)' }}>
                    {child.attendance || '—'}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                    Attend
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
                  borderRadius: 6, display: 'inline-block',
                }}>
                  {child.badgeOrStreak}
                </div>
              )}

              {/* View Profile link */}
              {onViewProfile && (
                <div
                  onClick={(e) => { e.stopPropagation(); onViewProfile(child.id) }}
                  style={{
                    marginTop: 10, fontSize: 11, fontWeight: 700,
                    color: 'var(--v2-sky)', cursor: 'pointer',
                  }}
                >
                  View Profile &rarr;
                </div>
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
