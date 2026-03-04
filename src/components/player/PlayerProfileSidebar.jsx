import { useState, useEffect } from 'react'
import {
  Zap, Target, Shield, Users, Trophy, Award,
  BarChart3, ChevronRight, Sparkles
} from '../../constants/icons'

const STAT_DEFS = [
  { key: 'kills', label: 'Kills', field: 'total_kills', icon: Zap },
  { key: 'aces', label: 'Aces', field: 'total_aces', icon: Target },
  { key: 'digs', label: 'Digs', field: 'total_digs', icon: Shield },
  { key: 'assists', label: 'Assists', field: 'total_assists', icon: Users },
]

/**
 * PlayerProfileSidebar — Left 260px column
 * Mobile HeroIdentityCard parity: gradient card with display name,
 * OVR badge with gold glow pulse, XP bar with cyan fill + shimmer,
 * streak banner (gold-tinted), counters, season stats, quick links.
 * Dark theme: #0D1B3E bg, #10284C cards
 */
export default function PlayerProfileSidebar({
  viewingPlayer,
  displayName,
  primaryTeam,
  level,
  xp,
  xpProgress,
  xpToNext,
  overallRating,
  seasonStats,
  rankings,
  gamesPlayed,
  badges,
  onNavigate,
  navigateToTeamWall,
}) {
  const [xpAnimated, setXpAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setXpAnimated(true), 400); return () => clearTimeout(t) }, [])

  // Mock streak (TODO: Wire to real attendance/login streak data)
  const streak = gamesPlayed > 0 ? Math.min(gamesPlayed * 2 + 3, 30) : 0
  const firstName = viewingPlayer?.first_name || ''
  const lastName = viewingPlayer?.last_name || ''

  return (
    <aside
      className="w-[260px] shrink-0 overflow-y-auto h-full p-5 space-y-4 scrollbar-hide"
      style={{ background: '#0D1B3E', borderRight: '1px solid rgba(255,255,255,0.06)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* ── Hero Identity Card (matches mobile HeroIdentityCard) ── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #10284C, #162848, #10284C)',
          border: '1px solid rgba(75,185,236,0.15)',
        }}
      >
        {/* Top row: Name + OVR */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[2px] mb-1" style={{ color: 'rgba(75,185,236,0.60)' }}>
              {primaryTeam?.name || 'My Team'}
            </p>
            <h2 className="text-[32px] font-black leading-[0.95] tracking-wide" style={{ color: '#fff' }}>
              {firstName}
            </h2>
            <h2 className="text-[32px] font-black leading-[0.95] tracking-wide" style={{ color: '#fff' }}>
              {lastName}
            </h2>
          </div>
          {/* OVR Badge — gold glow pulse */}
          {overallRating > 0 && (
            <div
              className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 player-ovr-pulse"
              style={{
                background: 'rgba(255,215,0,0.10)',
                border: '2px solid rgba(255,215,0,0.40)',
                boxShadow: '0 0 12px rgba(255,215,0,0.25)',
              }}
            >
              <span className="text-[28px] font-black leading-none" style={{ color: '#FFD700' }}>{overallRating}</span>
              <span className="text-[8px] font-bold uppercase tracking-[1.5px] leading-none" style={{ color: 'rgba(255,215,0,0.60)' }}>OVR</span>
            </div>
          )}
        </div>

        {/* Info row */}
        <p className="text-[11px] font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {primaryTeam?.name || '—'} · {viewingPlayer?.position || 'Player'}{viewingPlayer?.jersey_number ? ` · #${viewingPlayer.jersey_number}` : ''}
        </p>

        {/* Photo + pills row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ border: '2px solid rgba(75,185,236,0.30)' }}>
            {viewingPlayer?.photo_url ? (
              <img src={viewingPlayer.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.30)' }}>
                {firstName[0]}{lastName[0]}
              </div>
            )}
          </div>
          <div className="flex gap-1.5">
            <span
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold"
              style={{ background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.15)', color: '#FFD700' }}
            >
              LVL {level}
            </span>
            <span
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold"
              style={{ background: 'rgba(75,185,236,0.10)', border: '1px solid rgba(75,185,236,0.15)', color: '#4BB9EC' }}
            >
              {gamesPlayed} GP
            </span>
          </div>
        </div>

        {/* XP Bar (mobile parity: cyan fill + gold shimmer) */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>LVL {level}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full relative player-shimmer"
              style={{
                width: xpAnimated ? `${Math.max(xpProgress, 3)}%` : '0%',
                background: '#4BB9EC',
                transition: 'width 1s ease-out',
              }}
            />
          </div>
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {xp % 1000}/{1000}
          </span>
        </div>
      </div>

      {/* ── Streak Banner (matches mobile StreakBanner — gold-tinted) ── */}
      {streak >= 2 && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(255,215,0,0.06)',
            border: '1px solid rgba(255,215,0,0.15)',
          }}
        >
          <span className="text-xl">🔥</span>
          <div className="flex-1">
            <p className="text-[13px] font-bold" style={{ color: '#FFD700' }}>{streak}-day streak!</p>
            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.30)' }}>Keep it going</p>
          </div>
        </div>
      )}

      {/* ── Counters Row (Games / Badges / Points) ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: gamesPlayed, label: 'Games' },
          { value: badges.length, label: 'Badges' },
          { value: seasonStats?.total_points || 0, label: 'Points' },
        ].map(s => (
          <div key={s.label} className="text-center py-2 rounded-xl" style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-black" style={{ color: '#fff' }}>{s.value}</p>
            <p className="text-[9px] uppercase tracking-wide font-bold" style={{ color: 'rgba(255,255,255,0.30)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Season Stats (compact) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: 'rgba(255,255,255,0.15)' }}>Season Stats</p>
          <button onClick={() => onNavigate?.('leaderboards')} className="text-[10px] font-bold hover:opacity-80" style={{ color: '#4BB9EC' }}>
            View All →
          </button>
        </div>
        <div className="space-y-1">
          {STAT_DEFS.map(stat => {
            const value = seasonStats?.[stat.field] || 0
            const rank = rankings[stat.key]
            const StatIcon = stat.icon
            return (
              <div
                key={stat.key}
                className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <StatIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4BB9EC' }} />
                <span className="text-xs font-semibold flex-1" style={{ color: 'rgba(255,255,255,0.60)' }}>{stat.label}</span>
                <span className="text-sm font-black" style={{ color: '#fff' }}>{value}</span>
                {rank && rank <= 10 ? (
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{
                      background: rank <= 3 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
                      color: rank <= 3 ? '#FFD700' : 'rgba(255,255,255,0.30)',
                    }}
                  >
                    #{rank}
                  </span>
                ) : (
                  <span className="text-[9px] w-5 text-center" style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Quick Links (2x2 dark grid) ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[1.2px] mb-2" style={{ color: 'rgba(255,255,255,0.15)' }}>Quick Links</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'Team Hub', action: () => primaryTeam && navigateToTeamWall?.(primaryTeam.id) },
            { icon: Trophy, label: 'Leaders', action: () => onNavigate?.('leaderboards') },
            { icon: Award, label: 'Trophies', action: () => onNavigate?.('achievements') },
            { icon: BarChart3, label: 'Standings', action: () => onNavigate?.('standings') },
          ].map(link => {
            const Icon = link.icon
            return (
              <button
                key={link.label}
                onClick={link.action}
                className="rounded-xl p-3 text-center hover:brightness-110 transition"
                style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: '#4BB9EC' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  {link.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
