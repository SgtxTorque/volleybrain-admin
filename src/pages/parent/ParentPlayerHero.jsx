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
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardCls} rounded-t-[14px] overflow-hidden`}>
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
                className="px-4 py-1.5 rounded-full text-r-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: teamColor, color: '#fff' }}
              >
                {seasonName ? `${seasonName} ` : ''}{teamName}
              </span>
              {overallRating !== null && (
                <div
                  className="w-16 h-16 rounded-xl border-2 flex items-center justify-center"
                  style={{ borderColor: posColor }}
                >
                  <span className={`text-r-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {overallRating}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-r-3xl font-black text-amber-400 uppercase tracking-tight">
              {p.first_name || 'Player'}
            </h1>
            <h2 className={`text-r-3xl font-black uppercase tracking-tight -mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {p.last_name || ''}
            </h2>
            <p className="text-slate-400 mt-2">
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
        <div className={`flex justify-around py-3 border-t ${isDark ? 'border-white/[0.06] bg-slate-800/30' : 'border-slate-200 bg-slate-50/80'}`}>
          {perGameStats.map(stat => (
            <div key={stat.key} className="text-center">
              <span className={`text-r-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stat.value}
              </span>
              <p className="text-r-xs uppercase font-semibold text-slate-400">{stat.label}/G</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
