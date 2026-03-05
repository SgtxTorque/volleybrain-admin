// =============================================================================
// ParentChildHero — trading card aesthetic for parent dashboard
// Single child = full-width card, multiple = horizontal scroll
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight, Plus } from '../../constants/icons'

function PlayerCard({ child, isActive, onClick, isDark }) {
  const teamColor = child.team?.color || '#6366F1'
  const position = child.position || child.team_position || '—'
  const jersey = child.jersey_number

  return (
    <button onClick={onClick}
      className={`relative overflow-hidden rounded-[14px] text-left transition-all ${
        isActive ? 'ring-2 ring-lynx-sky shadow-lg' : 'hover:ring-1 hover:ring-white/20'
      }`}
      style={{ minWidth: 320, background: `linear-gradient(135deg, #0B1628 0%, ${teamColor}30 100%)` }}>
      {/* Dot grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

      <div className="relative flex items-center gap-4 p-5">
        {/* Photo / Jersey fallback */}
        {child.photo_url ? (
          <img src={child.photo_url} alt={child.first_name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-4xl border-2 border-white/10 flex-shrink-0"
            style={{ backgroundColor: teamColor }}>
            {jersey || '?'}
          </div>
        )}

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold uppercase tracking-wider text-lynx-sky">
            {child.team?.name || 'No Team'}
          </p>
          <h3 className="text-3xl font-extrabold text-white truncate">
            {child.first_name} {child.last_name || ''}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            {jersey && (
              <span className="text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                #{jersey}
              </span>
            )}
            <span className="text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
              {position}
            </span>
            {child.registrationStatus === 'active' && (
              <span className="text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Active
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
      </div>
    </button>
  )
}

export default function ParentChildHero({
  children, activeChildIdx, onSelectChild, onAddChild, isDark,
}) {
  if (!children?.length) return null

  // Single child — full-width
  if (children.length === 1) {
    return (
      <PlayerCard child={children[0]} isActive={true} onClick={() => {}} isDark={isDark} />
    )
  }

  // Multiple children — horizontal scroll
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {children.map((child, idx) => (
        <PlayerCard key={child.id} child={child}
          isActive={idx === activeChildIdx}
          onClick={() => onSelectChild(idx)}
          isDark={isDark} />
      ))}
      {onAddChild && (
        <button onClick={onAddChild}
          className={`flex-shrink-0 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center px-8 transition ${
            isDark ? 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50' : 'border-slate-200 text-slate-400 hover:border-lynx-sky hover:text-lynx-sky'
          }`}
          style={{ minWidth: 160 }}>
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-sm font-bold uppercase tracking-wider">Add Child</span>
        </button>
      )}
    </div>
  )
}
