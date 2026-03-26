// DEPRECATED: The ParentPlayerHero component is no longer rendered.
// It was replaced by the inline left-column identity card in ParentPlayerCardPage.jsx.
// This file is kept ONLY for its exported constants (badgeDefinitions, rarityColors).

import { useTheme } from '../../contexts/ThemeContext'

// ============================================
// BADGE DEFINITIONS (shared with tabs)
// ============================================
export const badgeDefinitions = {
  'ace_sniper': { name: 'Ace Sniper', icon: '\u{1F3D0}', color: '#F59E0B', rarity: 'Rare' },
  'kill_shot': { name: 'Kill Shot', icon: '\u26A1', color: '#EF4444', rarity: 'Epic' },
  'heart_breaker': { name: 'Heart Breaker', icon: '\u{1F49C}', color: '#EC4899', rarity: 'Rare' },
  'ground_zero': { name: 'Ground Zero', icon: '\u{1F48E}', color: '#06B6D4', rarity: 'Uncommon' },
  'iron_fortress': { name: 'Iron Fortress', icon: '\u{1F6E1}\uFE0F', color: '#6366F1', rarity: 'Legendary' },
  'puppet_master': { name: 'Puppet Master', icon: '\u{1F3AD}', color: '#F59E0B', rarity: 'Epic' },
  'ace_master': { name: 'Ace Master', icon: '\u{1F3AF}', color: '#10B981', rarity: 'Rare' },
  'dig_machine': { name: 'Dig Machine', icon: '\u{1F4AA}', color: '#8B5CF6', rarity: 'Uncommon' },
  'mvp': { name: 'MVP', icon: '\u2B50', color: '#EF4444', rarity: 'Legendary' },
  'team_player': { name: 'Team Player', icon: '\u{1F91D}', color: '#3B82F6', rarity: 'Common' },
}

export const rarityColors = {
  'Common': '#6B7280',
  'Uncommon': '#10B981',
  'Rare': '#3B82F6',
  'Epic': '#8B5CF6',
  'Legendary': '#F59E0B',
}

// ============================================
// PARENT PLAYER HERO CARD
// ============================================
export default function ParentPlayerHero({
  player,
  posInfo,
  posColor,
  teamName,
  teamColor,
  seasonName,
  jerseyNumber,
  overallRating,
  badges,
  perGameStats,
  sc,
}) {
  const { isDark } = useTheme()
  const p = player

  const cardCls = isDark
    ? 'bg-[#132240] border border-white/[0.06]'
    : 'bg-white border border-[#E8ECF2]'

  return (
    <div className={`${cardCls} rounded-t-[14px] overflow-hidden`} style={{ fontFamily: 'var(--v2-font)' }}>
      <div className="relative flex" style={{ minHeight: '280px' }}>
        {/* Player photo or fallback */}
        <div className="w-[280px] shrink-0 relative overflow-hidden">
          {p.photo_url ? (
            <>
              <img src={p.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
              <div
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? 'linear-gradient(to right, transparent 60%, rgba(15,23,42,0.8) 100%)'
                    : 'linear-gradient(to right, transparent 60%, rgba(255,255,255,0.9) 100%)',
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${posColor}40, #1e293b)`
                  : `linear-gradient(135deg, ${posColor}30, #f1f5f9)`,
              }}
            >
              <div className="text-center">
                <span className="text-8xl font-black" style={{ color: posColor }}>
                  {jerseyNumber || '?'}
                </span>
                <p className="text-r-lg font-bold mt-2 text-slate-400">
                  {p.first_name?.[0]}{p.last_name?.[0]}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="flex-1 p-6 flex flex-col justify-between relative">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(135deg, ${posColor}${isDark ? '20' : '15'}, transparent 50%)`,
            }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <span
                className="px-4 py-1.5 rounded-full text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ backgroundColor: teamColor, color: '#fff' }}
              >
                {seasonName ? `${seasonName} ` : ''}{teamName}
              </span>
              {overallRating !== null && (() => {
                const ovrColor = overallRating >= 80 ? '#22C55E' : overallRating >= 50 ? '#F59E0B' : '#EF4444'
                return (
                  <div
                    className="w-16 h-16 rounded-full border-[3px] flex items-center justify-center shadow-lg"
                    style={{ borderColor: ovrColor, boxShadow: `0 0 16px ${ovrColor}30` }}
                  >
                    <span className="text-2xl font-extrabold" style={{ color: ovrColor, letterSpacing: '-0.03em' }}>
                      {overallRating}
                    </span>
                  </div>
                )
              })()}
            </div>

            <h1 className="text-3xl font-extrabold uppercase" style={{ color: '#FFD700', letterSpacing: '-0.03em' }}>
              {p.first_name || 'Player'}
            </h1>
            <h2 className={`text-3xl font-extrabold uppercase -mt-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ letterSpacing: '-0.03em' }}>
              {p.last_name || ''}
            </h2>
            <p className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {posInfo.full} <span className="mx-2">&bull;</span> #{jerseyNumber || '-'}
            </p>

            {badges.length > 0 && (
              <div className="flex gap-2 mt-3">
                {badges.slice(0, 4).map((b, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`,
                      border: `2px solid ${badgeDefinitions[b.badge_id]?.color || '#6B7280'}`,
                    }}
                  >
                    {badgeDefinitions[b.badge_id]?.icon || '\u{1F3C5}'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-game stats bar */}
      {perGameStats && (
        <div className={`flex items-center justify-around py-3.5 border-t ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[#E8ECF2] bg-[#F8F9FB]'}`}>
          {perGameStats.map((stat, i) => (
            <div key={stat.key} className="text-center flex-1 relative">
              {i > 0 && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 ${isDark ? 'bg-white/[0.06]' : 'bg-[#E8ECF2]'}`} />}
              <span className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ letterSpacing: '-0.03em' }}>
                {stat.value}
              </span>
              <p className={`text-[10.5px] font-bold uppercase tracking-[0.08em] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}/G</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
