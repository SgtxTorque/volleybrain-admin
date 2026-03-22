// =============================================================================
// SeasonCarousel — Horizontal scrollable season cards for admin dashboard
// Props-only. Includes scroll arrows and richer card data.
// =============================================================================

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function SeasonCarousel({
  seasons = [],
  perSeasonTeamCounts = {},
  perSeasonPlayerCounts = {},
  perSeasonActionCounts = {},
  perSeasonActionDetails = {},
  selectedSeasonId,
  onSeasonSelect,
  onViewAll,
}) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(checkScroll)
    observer.observe(el)
    return () => observer.disconnect()
  }, [seasons.length])

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }

  if (seasons.length === 0) return null

  const getStatusBadge = (season) => {
    const s = season.status?.toLowerCase() || ''
    if (s === 'active' || s === 'in_progress') return { label: 'Mid-Season', bg: 'rgba(16,185,129,0.12)', color: '#059669', barColor: 'var(--v2-green)' }
    if (s === 'open' || s === 'registration') return { label: 'Registration Open', bg: 'rgba(75,185,236,0.12)', color: '#0284C7', barColor: 'var(--v2-sky)' }
    if (s === 'setup' || s === 'draft') return { label: 'Setup Phase', bg: 'rgba(245,158,11,0.12)', color: '#D97706', barColor: 'var(--v2-amber)' }
    if (s === 'completed' || s === 'archived') return { label: 'Completed', bg: 'rgba(100,116,139,0.12)', color: '#64748B', barColor: '#94A3B8' }
    return { label: s || 'Active', bg: 'rgba(75,185,236,0.12)', color: '#0284C7', barColor: 'var(--v2-sky)' }
  }

  const formatDateRange = (season) => {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
    const start = fmt(season.start_date)
    const end = fmt(season.end_date)
    if (start && end) return `${start} – ${end}`
    if (start) return `Starts ${start}`
    return null
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)', position: 'relative' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--v2-text-muted)',
        }}>
          Active Seasons
        </span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--v2-sky)',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            View All →
          </button>
        )}
      </div>

      {/* Scroll container with arrows */}
      <div style={{ position: 'relative' }}>
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-1)}
            style={{
              position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
              width: 32, height: 32, borderRadius: '50%',
              background: '#FFFFFF', border: '1px solid var(--v2-border-subtle)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16, color: 'var(--v2-text-secondary)' }} />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy(1)}
            style={{
              position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
              width: 32, height: 32, borderRadius: '50%',
              background: '#FFFFFF', border: '1px solid var(--v2-border-subtle)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
            }}
          >
            <ChevronRight style={{ width: 16, height: 16, color: 'var(--v2-text-secondary)' }} />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="v2-season-carousel"
          style={{
            display: 'flex', gap: 14, overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {seasons.map(season => {
            const badge = getStatusBadge(season)
            const teamCount = perSeasonTeamCounts[season.id] || 0
            const playerCount = perSeasonPlayerCounts[season.id] || 0
            const actionCount = perSeasonActionCounts[season.id] || 0
            const actionDetails = perSeasonActionDetails[season.id] || []
            const isSelected = season.id === selectedSeasonId
            const dateRange = formatDateRange(season)

            return (
              <div
                key={season.id}
                onClick={() => onSeasonSelect?.(season.id)}
                style={{
                  minWidth: 240, flex: '1 0 240px',
                  background: 'var(--v2-white)',
                  borderRadius: 'var(--v2-radius)',
                  boxShadow: isSelected ? '0 0 0 2px var(--v2-sky)' : 'var(--v2-card-shadow)',
                  border: '1px solid var(--v2-border-subtle)',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = isSelected
                    ? '0 0 0 2px var(--v2-sky), 0 4px 16px rgba(0,0,0,0.1)'
                    : '0 4px 16px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = isSelected ? '0 0 0 2px var(--v2-sky)' : 'var(--v2-card-shadow)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* Status badge + attention pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    background: badge.bg, color: badge.color,
                    padding: '3px 8px', borderRadius: 6,
                  }}>
                    {badge.label}
                  </span>
                  {isSelected && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--v2-sky)',
                    }}>
                      Selected
                    </span>
                  )}
                  <span style={{ flex: 1 }} />
                  {actionCount > 0 && (
                    <div style={{ position: 'relative' }} className="v2-action-pill-wrap">
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 8,
                        fontSize: 11, fontWeight: 700,
                        background: '#EF4444', color: '#FFFFFF',
                        boxShadow: '0 1px 4px rgba(239,68,68,0.3)',
                        cursor: 'default',
                      }}>
                        ⚠ {actionCount}
                      </span>
                      {actionDetails.length > 0 && (
                        <div className="v2-action-pill-tooltip" style={{
                          position: 'absolute', right: 0, top: '100%', marginTop: 6,
                          width: 200, borderRadius: 10,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          border: '1px solid var(--v2-border-subtle)',
                          background: 'var(--v2-white)',
                          padding: '8px 10px',
                          zIndex: 50,
                          opacity: 0, pointerEvents: 'none',
                          transition: 'opacity 0.15s ease',
                        }}>
                          {actionDetails.map((item, idx) => (
                            <div key={idx} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '4px 2px', fontSize: 11, color: 'var(--v2-text-secondary)',
                            }}>
                              <span>{item.label}</span>
                              <span style={{ fontWeight: 700, color: '#EF4444' }}>{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Season name */}
                <div style={{
                  fontSize: 15, fontWeight: 700, color: 'var(--v2-navy)',
                  marginBottom: 2,
                }}>
                  {season.name}
                </div>

                {/* Date range */}
                {dateRange && (
                  <div style={{ fontSize: 11, color: 'var(--v2-text-muted)', marginBottom: 6 }}>
                    {dateRange}
                  </div>
                )}

                {/* Sport name (if available) */}
                {season.sport_name && (
                  <div style={{ fontSize: 11, color: 'var(--v2-text-muted)', marginBottom: 6 }}>
                    {season.sport_name}
                  </div>
                )}

                {/* Stats row */}
                <div style={{
                  display: 'flex', gap: 16, marginBottom: 12,
                  fontSize: 12, color: 'var(--v2-text-secondary)',
                }}>
                  <span><strong style={{ color: 'var(--v2-navy)' }}>{teamCount}</strong> team{teamCount !== 1 ? 's' : ''}</span>
                  <span><strong style={{ color: 'var(--v2-navy)' }}>{playerCount}</strong> player{playerCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{
                    height: 4, borderRadius: 2,
                    background: 'var(--v2-surface)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: badge.barColor,
                      width: `${Math.min(Math.max(teamCount * 10 + playerCount * 2, 10), 100)}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Footer arrow */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: 'var(--v2-sky)' }}>→</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .v2-season-carousel::-webkit-scrollbar { display: none; }
        .v2-season-carousel { -ms-overflow-style: none; scrollbar-width: none; }
        .v2-action-pill-wrap:hover .v2-action-pill-tooltip {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  )
}
