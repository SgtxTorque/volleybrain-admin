// =============================================================================
// CoachEngagementColumn — 4 stacked engagement cards for the coach dashboard
// Cards: CoachLevelCard, CoachActivityCard, CoachBadgesCard, TeamPulseCard
// =============================================================================

import { Lock, Trophy } from '../../../constants/icons'

// ── Card 1: Coach Level / XP Hero ──
export function CoachLevelCard({ levelInfo, tierName, xp, onNavigateAchievements }) {
  const level = levelInfo?.level || 1
  const progress = levelInfo?.progress || 0
  const xpToNext = levelInfo?.nextLevelXp || 1000
  const displayXp = xp || 0

  // Format XP display
  const fmtXp = (n) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : n

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0B1628, #162D50)',
        borderRadius: 14,
        padding: 14,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        background: 'radial-gradient(circle, rgba(75,185,236,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '1.5px solid #4BB9EC',
          background: 'rgba(75,185,236,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          ⭐
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>
            {tierName || 'Rising Star'}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.3 }}>
            Level {level} — {fmtXp(displayXp)} / {fmtXp(xpToNext)} XP
          </div>
        </div>
      </div>

      {/* XP Progress bar */}
      <div style={{
        height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
        marginBottom: 8, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: '#4BB9EC',
          width: `${Math.min(progress, 100)}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Trophy case link */}
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={onNavigateAchievements}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, color: '#FFD700',
            padding: 0,
          }}
        >
          Trophy case →
        </button>
      </div>
    </div>
  )
}

// ── Card 2: Coaching Activity ──
export function CoachActivityCard({ shoutouts = 0, challenges = 0, statsEntered = 0, evalsDone = 0, nextBadgeHint }) {
  const rows = [
    { icon: '⭐', label: 'Shoutouts', count: shoutouts, bg: '#FAEEDA', color: '#B45309' },
    { icon: '✅', label: 'Challenges', count: challenges, bg: '#EEEDFE', color: '#7C3AED' },
    { icon: '📊', label: 'Stats entered', count: statsEntered, bg: '#E6F1FB', color: '#2563EB' },
    { icon: '👤', label: 'Evals done', count: evalsDone, bg: '#E1F5EE', color: '#059669' },
  ]

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      padding: 14, border: '1px solid #E8ECF2',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#0F6E56', textTransform: 'uppercase' }}>
          Your Activity
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#085041',
          background: '#E1F5EE', borderRadius: 10, padding: '2px 8px',
        }}>
          Week
        </span>
      </div>

      {/* Activity rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F8FAFC', borderRadius: 8, padding: '6px 8px',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: row.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, flexShrink: 0,
            }}>
              {row.icon}
            </div>
            <span style={{ fontSize: 12, color: '#334155', fontWeight: 500, flex: 1 }}>
              {row.label}
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              {row.count}
            </span>
          </div>
        ))}
      </div>

      {/* Next badge nudge */}
      {nextBadgeHint && (
        <div style={{
          marginTop: 8, background: '#FAEEDA', borderRadius: 8,
          padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>⭐</span>
          <span style={{ fontSize: 11, color: '#633806', fontWeight: 600, lineHeight: 1.3 }}>
            {nextBadgeHint}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Card 3: Recent Badges ──
export function CoachBadgesCard({ earnedCount = 0, totalCount = 0, badges = [], onNavigateAchievements }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14,
      padding: 14, border: '1px solid #E8ECF2',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#334155', textTransform: 'uppercase' }}>
          Badges
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>
          {earnedCount}/{totalCount}
        </span>
      </div>

      {/* Badge grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 32px)',
        gap: 4, justifyContent: 'center',
      }}>
        {badges.slice(0, 10).map((badge, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 6,
            background: '#162D50', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {badge.imageUrl ? (
              <img
                src={badge.imageUrl}
                alt={badge.name || ''}
                style={{ width: 32, height: 32, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            ) : (
              <span style={{ fontSize: 16 }}>{badge.icon || '🏅'}</span>
            )}
          </div>
        ))}
        {badges.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center',
            fontSize: 11, color: '#94A3B8', padding: '8px 0',
          }}>
            No badges earned yet
          </div>
        )}
      </div>

      {/* View all link */}
      {badges.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            onClick={onNavigateAchievements}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, color: '#3B82F6', padding: 0,
            }}
          >
            View all →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Card 4: Team Pulse ──
export function TeamPulseCard({ active = 0, drifting = 0, inactive = 0 }) {
  const total = active + drifting + inactive || 1
  const activePct = (active / total) * 100
  const driftingPct = (drifting / total) * 100
  const inactivePct = (inactive / total) * 100

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      padding: 14, border: '1px solid #E8ECF2',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#334155', textTransform: 'uppercase' }}>
          Team Pulse
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1D9E75' }}>{active}</div>
          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Active</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EF9F27' }}>{drifting}</div>
          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Drifting</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#E24B4A' }}>{inactive}</div>
          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Inactive</div>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', background: '#F1F5F9' }}>
        {activePct > 0 && (
          <div style={{ width: `${activePct}%`, background: '#1D9E75', transition: 'width 0.5s ease' }} />
        )}
        {driftingPct > 0 && (
          <div style={{ width: `${driftingPct}%`, background: '#EF9F27', transition: 'width 0.5s ease' }} />
        )}
        {inactivePct > 0 && (
          <div style={{ width: `${inactivePct}%`, background: '#E24B4A', transition: 'width 0.5s ease' }} />
        )}
      </div>
    </div>
  )
}
