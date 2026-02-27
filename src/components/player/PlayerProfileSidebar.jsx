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
 * PlayerProfileSidebar — Left 240px column
 * Profile hero, XP/level, streak, compact stats, quick links
 * ALL colors via CSS variables (--player-*)
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

  return (
    <aside
      className="w-[240px] shrink-0 overflow-y-auto h-full p-4 space-y-4"
      style={{ background: 'var(--player-card)', borderRight: '1px solid var(--player-border)' }}
    >
      {/* 1. Player Profile Hero */}
      <div className="text-center">
        <div className="relative inline-block mx-auto mb-3">
          <div
            className="w-[140px] h-[140px] rounded-xl overflow-hidden mx-auto"
            style={{ boxShadow: '0 0 20px var(--player-accent-glow)', border: '2px solid var(--player-accent)' }}
          >
            {viewingPlayer?.photo_url ? (
              <img src={viewingPlayer.photo_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--player-bg)' }}>
                <span className="text-4xl font-black" style={{ color: 'var(--player-text-muted)' }}>
                  {viewingPlayer?.first_name?.[0]}{viewingPlayer?.last_name?.[0]}
                </span>
              </div>
            )}
          </div>
          {/* Level badge */}
          <div
            className="absolute -top-2 -left-2 w-10 h-10 rounded-full flex flex-col items-center justify-center"
            style={{ background: 'var(--player-bg)', border: '2px solid var(--player-accent)' }}
          >
            <span className="text-[8px] font-bold uppercase leading-none" style={{ color: 'var(--player-text-muted)' }}>LVL</span>
            <span className="text-sm font-black leading-none" style={{ color: 'var(--player-text)' }}>{level}</span>
          </div>
          {/* Overall rating */}
          {overallRating > 0 && (
            <div
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--player-accent)' }}
            >
              <span className="text-white font-black text-lg">{overallRating}</span>
            </div>
          )}
        </div>

        <h2 className="text-xl font-black truncate" style={{ color: 'var(--player-text)' }}>{displayName}</h2>
        {primaryTeam && (
          <span
            className="inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mt-1.5"
            style={{ background: 'var(--player-accent)', color: '#fff' }}
          >
            {primaryTeam.name}
          </span>
        )}
        <p className="text-xs mt-1.5" style={{ color: 'var(--player-text-secondary)' }}>
          {viewingPlayer?.position || 'Player'}
          {viewingPlayer?.jersey_number ? ` · #${viewingPlayer.jersey_number}` : ''}
        </p>
      </div>

      {/* 2. Level / XP Bar */}
      <div className="rounded-xl p-3" style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--player-text-secondary)' }}>
            <Sparkles className="w-3 h-3 inline mr-1" style={{ color: 'var(--player-accent)' }} />
            Level {level}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--player-text-muted)' }}>{xpToNext} XP to next</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--player-border)' }}>
          <div
            className="h-full rounded-full player-shimmer relative"
            style={{
              width: xpAnimated ? `${Math.max(xpProgress, 3)}%` : '0%',
              background: `linear-gradient(90deg, var(--player-accent), var(--player-accent), transparent 200%)`,
              transition: 'width 1s ease-out',
            }}
          />
        </div>
        <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--player-text-muted)' }}>
          {xp.toLocaleString()} XP Total
        </p>

        {/* Games / Trophies / Points counters */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {[
            { value: gamesPlayed, label: 'Games' },
            { value: badges.length, label: 'Trophies' },
            { value: seasonStats?.total_points || 0, label: 'Points' },
          ].map(s => (
            <div key={s.label} className="text-center py-1.5 rounded-lg" style={{ background: 'var(--player-card)' }}>
              <p className="text-sm font-black" style={{ color: 'var(--player-text)' }}>{s.value}</p>
              <p className="text-[9px] uppercase tracking-wide font-bold" style={{ color: 'var(--player-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Streak Counter */}
      <div
        className="rounded-xl p-3 text-center"
        style={{
          background: streak > 0 ? 'var(--player-bg)' : 'var(--player-card)',
          border: streak > 0 ? '1px solid var(--player-accent)' : '1px solid var(--player-border)',
          boxShadow: streak > 0 ? '0 0 12px var(--player-accent-glow)' : 'none',
        }}
      >
        {streak > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-xl font-black" style={{ color: 'var(--player-accent)' }}>{streak}</span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--player-text-secondary)' }}>Day Streak</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg" style={{ opacity: 0.3 }}>🔥</span>
            <span className="text-xs font-bold" style={{ color: 'var(--player-text-muted)' }}>Start a streak!</span>
          </div>
        )}
      </div>

      {/* 4. Season Stats Preview (compact) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--player-text-muted)' }}>Season Stats</h3>
          <button onClick={() => onNavigate?.('leaderboards')} className="text-[10px] font-bold hover:opacity-80" style={{ color: 'var(--player-accent)' }}>
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
                className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg"
                style={{ background: 'var(--player-bg)' }}
              >
                <StatIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--player-accent)' }} />
                <span className="text-xs font-semibold flex-1" style={{ color: 'var(--player-text-secondary)' }}>{stat.label}</span>
                <span className="text-sm font-black" style={{ color: 'var(--player-text)' }}>{value}</span>
                {rank && rank <= 10 ? (
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{
                      background: rank <= 3 ? 'var(--player-accent-glow)' : 'var(--player-border)',
                      color: rank <= 3 ? 'var(--player-accent)' : 'var(--player-text-muted)',
                    }}
                  >
                    #{rank}
                  </span>
                ) : (
                  <span className="text-[9px] w-5 text-center" style={{ color: 'var(--player-text-muted)' }}>—</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. Quick Links (2x2 dark grid) */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--player-text-muted)' }}>Quick Links</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'Team Hub', action: () => primaryTeam && navigateToTeamWall?.(primaryTeam.id) },
            { icon: Trophy, label: 'Leaderboards', action: () => onNavigate?.('leaderboards') },
            { icon: Award, label: 'Trophies', action: () => onNavigate?.('achievements') },
            { icon: BarChart3, label: 'Standings', action: () => onNavigate?.('standings') },
          ].map(link => {
            const Icon = link.icon
            return (
              <button
                key={link.label}
                onClick={link.action}
                className="rounded-xl p-3 text-center group"
                style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--player-accent)' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--player-text-secondary)' }}>
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
