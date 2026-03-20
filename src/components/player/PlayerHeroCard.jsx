// =============================================================================
// PlayerHeroCard — Dark hero identity card: name huge, team/position, OVR, XP
// Always dark theme — does NOT use isDark toggle
// =============================================================================

import { useState, useEffect } from 'react'

const TIER = (lvl) => {
  if (lvl >= 10) return { label: 'Diamond', color: '#B9F2FF' }
  if (lvl >= 7) return { label: 'Gold', color: '#FFD700' }
  if (lvl >= 4) return { label: 'Silver', color: '#C0C0C0' }
  return { label: 'Bronze', color: '#CD7F32' }
}

export default function PlayerHeroCard({
  viewingPlayer, displayName, primaryTeam,
  level, xp, xpProgress, xpToNext, overallRating, gamesPlayed,
}) {
  const [xpAnimated, setXpAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setXpAnimated(true), 400); return () => clearTimeout(t) }, [])

  const firstName = viewingPlayer?.first_name || ''
  const lastName = viewingPlayer?.last_name || ''
  const tier = TIER(level)

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden h-full flex flex-col"
      style={{ background: 'linear-gradient(135deg, #10284C, #162848, #10284C)', border: '1px solid rgba(75,185,236,0.15)' }}
    >
      {/* Top row: Name + OVR */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[2px] mb-1" style={{ color: '#4BB9EC' }}>Player</p>
          <h2 className="text-[40px] font-black leading-[0.92] tracking-wide text-white">{firstName}</h2>
          <h2 className="text-[40px] font-black leading-[0.92] tracking-wide text-white">{lastName}</h2>
        </div>
        <div
          className="w-20 h-20 rounded-full flex flex-col items-center justify-center shrink-0 animate-gold-glow"
          style={{ background: overallRating > 0 ? 'rgba(75,185,236,0.15)' : 'rgba(255,255,255,0.05)', border: overallRating > 0 ? '2px solid rgba(75,185,236,0.40)' : '2px solid rgba(255,255,255,0.10)' }}
        >
          <span className="text-4xl font-extrabold leading-none text-white">{overallRating > 0 ? overallRating : '—'}</span>
          <span className="text-[8px] font-bold uppercase tracking-[1.5px]" style={{ color: overallRating > 0 ? '#4BB9EC' : 'rgba(255,255,255,0.30)' }}>
            {overallRating > 0 ? 'OVR' : 'NEW'}
          </span>
        </div>
      </div>

      {/* Info row */}
      <p className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
        {primaryTeam?.name || '—'} · {viewingPlayer?.position || 'Player'}{viewingPlayer?.jersey_number ? ` · #${viewingPlayer.jersey_number}` : ''}
      </p>

      {/* Photo + pills */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0" style={{ border: '2px solid rgba(75,185,236,0.30)' }}>
          {viewingPlayer?.photo_url ? (
            <img src={viewingPlayer.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-black"
              style={{ background: primaryTeam?.color ? `linear-gradient(135deg, ${primaryTeam.color}40, ${primaryTeam.color}20)` : 'rgba(75,185,236,0.10)', color: 'rgba(255,255,255,0.40)' }}>
              {firstName[0]}{lastName[0]}
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold" style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30`, color: tier.color }}>
            LVL {level} {tier.label}
          </span>
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold" style={{ background: 'rgba(75,185,236,0.10)', border: '1px solid rgba(75,185,236,0.15)', color: '#4BB9EC' }}>
            {gamesPlayed || 0} GP
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* XP Bar */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>LVL {level}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: xpAnimated ? `${Math.max(xpProgress || 0, 3)}%` : '0%', background: '#4BB9EC', transition: 'width 1s ease-out' }}
          />
        </div>
        <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {xp % 1000}/{1000}
        </span>
      </div>
    </div>
  )
}
