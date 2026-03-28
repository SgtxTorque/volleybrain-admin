// =============================================================================
// ParentChildHero — trading card carousel for parent dashboard
// Scroll-snap carousel, View Profile button, full names, scroll arrows for 5+
// =============================================================================

import { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, ExternalLink } from '../../constants/icons'
import { getLevelTier } from '../../lib/engagement-constants'

function PlayerCard({ child, isActive, onClick, onViewProfile, parentName }) {
  const teamColor = child.team?.color || '#6366F1'
  const position = child.position || child.team_position || '—'
  const jersey = child.jersey_number
  const level = child._level || 1
  const xpPct = child._xpPct || 0
  const tierConfig = getLevelTier(level)
  const TIER = { label: tierConfig.name, color: tierConfig.color }

  return (
    <div className="snap-start flex-shrink-0" style={{ width: 220 }}>
      <button onClick={onClick}
        className={`w-full relative overflow-hidden rounded-[14px] text-left transition-all ${
          isActive ? 'ring-2 ring-lynx-sky shadow-lg scale-[1.02]' : 'hover:ring-1 hover:ring-white/20'
        }`}
        style={{ background: `linear-gradient(135deg, #0B1628 0%, ${teamColor}30 100%)` }}>
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

        <div className="relative flex items-center gap-3 p-3">
          {/* Photo / Jersey fallback */}
          {child.photo_url ? (
            <img src={child.photo_url} alt={child.first_name}
              className="w-14 h-14 rounded-xl object-cover border-2 border-white/10 flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-r-2xl border-2 border-white/10 flex-shrink-0"
              style={{ backgroundColor: teamColor }}>
              {jersey || '?'}
            </div>
          )}

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-lynx-sky truncate">
              {child.team?.name || 'No Team'}
            </p>
            <h3 className="text-r-lg font-extrabold text-white leading-tight">
              {child.first_name}
            </h3>
            <h3 className="text-r-sm font-bold text-white/70 leading-tight">
              {child.last_name || ''}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {jersey && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                  #{jersey}
                </span>
              )}
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                {position}
              </span>
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ backgroundColor: TIER.color + '20', color: TIER.color }}>
                Lv.{level}
              </span>
            </div>
            {/* XP Progress bar */}
            <div className="mt-1.5 h-1 rounded-full overflow-hidden bg-white/[0.08]">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xpPct}%`, backgroundColor: TIER.color }} />
            </div>
          </div>
        </div>
      </button>

      {/* View Profile button — outside the card so it has its own click target */}
      {onViewProfile && (
        <button
          onClick={(e) => { e.stopPropagation(); onViewProfile(child) }}
          className="mt-1.5 w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
        >
          View Profile <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default function ParentChildHero({
  children, activeChildIdx, onSelectChild, onAddChild, onViewProfile, isDark, parentName,
}) {
  const scrollRef = useRef(null)

  // Scroll selected child into view
  useEffect(() => {
    if (scrollRef.current && children?.length > 1) {
      const container = scrollRef.current
      const cardWidth = 220 + 12 // width + gap
      const scrollTo = activeChildIdx * cardWidth - (container.offsetWidth / 2 - cardWidth / 2)
      container.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' })
    }
  }, [activeChildIdx, children?.length])

  if (!children?.length) return null

  const showArrows = children.length > 4

  const scrollBy = (dir) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  // Single child — full-width
  if (children.length === 1) {
    return (
      <div style={{ maxWidth: 320 }}>
        <PlayerCard child={children[0]} isActive={true}
          onClick={() => onSelectChild(0)}
          onViewProfile={onViewProfile} parentName={parentName} />
      </div>
    )
  }

  // Multiple children — scroll-snap carousel
  return (
    <div className="relative h-full">
      {/* Left arrow */}
      {showArrows && (
        <button onClick={() => scrollBy(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors -ml-1">
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-1 scrollbar-hide h-full"
      >
        {children.map((child, idx) => (
          <PlayerCard key={child.id} child={child}
            isActive={idx === activeChildIdx}
            onClick={() => onSelectChild(idx)}
            onViewProfile={onViewProfile}
            parentName={parentName} />
        ))}
        {onAddChild && (
          <div className="snap-start flex-shrink-0" style={{ width: 160 }}>
            <button onClick={onAddChild}
              className={`w-full h-full rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center py-8 transition ${
                isDark ? 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60' : 'border-slate-200 text-slate-400 hover:border-lynx-sky hover:text-lynx-sky'
              }`}>
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-r-sm font-bold uppercase tracking-wider">Add Child</span>
            </button>
          </div>
        )}
      </div>

      {/* Right arrow */}
      {showArrows && (
        <button onClick={() => scrollBy(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors -mr-1">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
