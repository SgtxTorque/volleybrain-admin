// =============================================================================
// ScoutingReportCard — Uses real coach skill ratings (player_skill_ratings)
// when available, falls back to derived stats from season totals.
// Mobile parity: player_skill_ratings table with 1-10 scale, 9 skills.
// Always dark theme — does NOT use isDark toggle
// =============================================================================

// Mobile skill fields from player_skill_ratings table (1-10 scale)
const COACH_SKILLS = [
  { key: 'serving_rating', label: 'Serving' },
  { key: 'passing_rating', label: 'Passing' },
  { key: 'setting_rating', label: 'Setting' },
  { key: 'attacking_rating', label: 'Hitting' },
  { key: 'blocking_rating', label: 'Blocking' },
  { key: 'defense_rating', label: 'Defense' },
  { key: 'hustle_rating', label: 'Hustle' },
  { key: 'coachability_rating', label: 'Coachability' },
  { key: 'teamwork_rating', label: 'Teamwork' },
]

// Fallback: derive ratings from season stats when no coach evaluations exist
const DERIVED_SKILLS = [
  { key: 'hitting', label: 'Hitting', stat: 'total_kills', thresholds: [1, 3, 6, 10] },
  { key: 'serving', label: 'Serving', stat: 'total_aces', thresholds: [0.5, 1, 2, 4] },
  { key: 'passing', label: 'Passing', stat: 'total_digs', thresholds: [2, 5, 8, 12] },
  { key: 'setting', label: 'Setting', stat: 'total_assists', thresholds: [1, 4, 8, 15] },
  { key: 'blocking', label: 'Blocking', stat: 'total_blocks', thresholds: [0.5, 1, 2, 4] },
]

function deriveRating(perGame, thresholds) {
  if (perGame >= thresholds[3]) return 5
  if (perGame >= thresholds[2]) return 4
  if (perGame >= thresholds[1]) return 3
  if (perGame >= thresholds[0]) return 2
  return 1
}

function SegmentBar({ rating, max = 5 }) {
  return (
    <div className="flex gap-1 flex-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="h-3 flex-1 rounded"
          style={{
            background: i < rating
              ? (rating >= max ? '#FFD700' : '#4BB9EC')
              : 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
    </div>
  )
}

export default function ScoutingReportCard({ seasonStats, gamesPlayed, overallRating, skillRatings }) {
  const gp = gamesPlayed || seasonStats?.games_played || 0
  const hasCoachRatings = skillRatings && (skillRatings.serving_rating || skillRatings.attacking_rating)

  // Use coach evaluations if available (1-10 scale, shown as 10-segment bars)
  if (hasCoachRatings) {
    const skills = COACH_SKILLS
      .map(s => ({ ...s, rating: skillRatings[s.key] || 0 }))
      .filter(s => s.rating > 0) // Only show rated skills
    const coachOvr = skillRatings.overall_rating

    return (
      <div className="rounded-2xl p-4 h-full flex flex-col"
        style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Scouting Report
          </h3>
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-lynx-sky/15 text-lynx-sky">
            Coach Evaluated
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          {skills.map(skill => (
            <div key={skill.key} className="flex items-center gap-3">
              <span className="text-[10px] font-semibold w-[80px] shrink-0" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {skill.label}
              </span>
              <SegmentBar rating={skill.rating} max={10} />
              <span className="text-xs font-black w-6 text-right text-white">
                {skill.rating}
              </span>
            </div>
          ))}
        </div>
        {coachOvr > 0 && (
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold w-[80px] shrink-0" style={{ color: '#FFD700' }}>Overall</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${Math.min(100, coachOvr * 10)}%`, background: 'linear-gradient(90deg, #4BB9EC, #FFD700)' }} />
              </div>
              <span className="text-sm font-black" style={{ color: '#FFD700' }}>{coachOvr}/10</span>
            </div>
          </div>
        )}
        {skillRatings.coach_notes && (
          <p className="text-[10px] mt-2 italic line-clamp-2" style={{ color: 'rgba(255,255,255,0.30)' }}>
            "{skillRatings.coach_notes}"
          </p>
        )}
      </div>
    )
  }

  // Fallback: derive 5-level ratings from season stats
  const skills = DERIVED_SKILLS.map(s => {
    const total = seasonStats?.[s.stat] || 0
    const perGame = gp > 0 ? total / gp : 0
    return { ...s, rating: deriveRating(perGame, s.thresholds), perGame }
  })
  const avgRating = skills.length > 0
    ? Math.round(skills.reduce((s, sk) => s + sk.rating, 0) / skills.length)
    : 1
  const allSkills = [...skills, { key: 'awareness', label: 'Court Awareness', rating: avgRating }]

  return (
    <div className="rounded-2xl p-4 h-full flex flex-col"
      style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-[10px] font-bold uppercase tracking-[1.2px] mb-4" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Scouting Report
      </h3>
      <div className="flex-1 space-y-3">
        {allSkills.map(skill => (
          <div key={skill.key} className="flex items-center gap-3">
            <span className="text-[11px] font-semibold w-[90px] shrink-0" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {skill.label}
            </span>
            <SegmentBar rating={skill.rating} />
            <span className="text-xs font-black w-6 text-right text-white">
              {skill.rating}
            </span>
          </div>
        ))}
      </div>
      {overallRating > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold w-[90px] shrink-0" style={{ color: '#FFD700' }}>Overall</span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full"
                style={{ width: `${Math.min(100, overallRating)}%`, background: 'linear-gradient(90deg, #4BB9EC, #FFD700)' }} />
            </div>
            <span className="text-sm font-black" style={{ color: '#FFD700' }}>{overallRating}</span>
          </div>
        </div>
      )}
    </div>
  )
}
