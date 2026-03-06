// =============================================================================
// EngagementProgressCard — Level badge + XP progress bar
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Star } from 'lucide-react'

const TIER_CONFIG = {
  1: { label: 'Bronze', color: '#CD7F32', bg: 'bg-amber-900/20' },
  2: { label: 'Silver', color: '#C0C0C0', bg: 'bg-slate-500/20' },
  3: { label: 'Gold', color: '#FFD700', bg: 'bg-yellow-500/20' },
  4: { label: 'Bronze', color: '#CD7F32', bg: 'bg-amber-900/20' },
  5: { label: 'Silver', color: '#C0C0C0', bg: 'bg-slate-500/20' },
}

function getTier(level) {
  // Tiers cycle: 1-3 Bronze, 4-6 Silver, 7-9 Gold, 10+ Diamond
  if (level >= 10) return { label: 'Diamond', color: '#B9F2FF', bg: 'bg-cyan-500/20' }
  if (level >= 7) return { label: 'Gold', color: '#FFD700', bg: 'bg-yellow-500/20' }
  if (level >= 4) return { label: 'Silver', color: '#C0C0C0', bg: 'bg-slate-500/20' }
  return { label: 'Bronze', color: '#CD7F32', bg: 'bg-amber-900/20' }
}

export default function EngagementProgressCard({ xpData }) {
  const { isDark } = useTheme()

  const level = xpData?.level || 1
  const currentXp = xpData?.currentXp || 0
  const xpToNext = xpData?.xpToNext || 1000
  const progress = xpToNext > 0 ? Math.min(100, (currentXp / xpToNext) * 100) : 0
  const tier = getTier(level)

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4 h-full flex flex-col`}>
      <div className="flex items-center gap-1.5 mb-3">
        <Star className="w-3.5 h-3.5" style={{ color: tier.color }} />
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Engagement Progress
        </h3>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
          style={{ backgroundColor: tier.color + '20', color: tier.color }}
        >
          Lvl {level} {tier.label}
        </div>
      </div>

      {/* XP bar */}
      <div className="flex-1 flex flex-col justify-center">
        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${tier.color}, #4BB9EC)`,
            }}
          />
        </div>
        <p className={`text-xs mt-1.5 tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {currentXp} / {xpToNext} XP to Level {level + 1}
        </p>
      </div>
    </div>
  )
}
