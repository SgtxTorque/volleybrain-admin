// =============================================================================
// ScoutingReportCard — Discrete 5-segment skill bars for player evaluation
// Always dark theme — does NOT use isDark toggle
// =============================================================================

const SKILLS = [
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
              ? (rating === 5 ? '#FFD700' : '#4BB9EC')
              : 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
    </div>
  )
}

export default function ScoutingReportCard({ seasonStats, gamesPlayed, overallRating }) {
  const gp = gamesPlayed || seasonStats?.games_played || 0
  const skills = SKILLS.map(s => {
    const total = seasonStats?.[s.stat] || 0
    const perGame = gp > 0 ? total / gp : 0
    return { ...s, rating: deriveRating(perGame, s.thresholds), perGame }
  })

  // Court Awareness = average of other skills, rounded
  const avgRating = skills.length > 0
    ? Math.round(skills.reduce((s, sk) => s + sk.rating, 0) / skills.length)
    : 1
  const allSkills = [...skills, { key: 'awareness', label: 'Court Awareness', rating: avgRating }]

  return (
    <div
      className="rounded-2xl p-4 h-full flex flex-col"
      style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}
    >
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
            <span className="text-xs font-black w-6 text-right" style={{ color: '#fff' }}>
              {skill.rating}
            </span>
          </div>
        ))}
      </div>

      {/* Overall Rating bar */}
      {overallRating > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold w-[90px] shrink-0" style={{ color: '#FFD700' }}>Overall</span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, overallRating)}%`, background: 'linear-gradient(90deg, #4BB9EC, #FFD700)' }}
              />
            </div>
            <span className="text-sm font-black" style={{ color: '#FFD700' }}>{overallRating}</span>
          </div>
        </div>
      )}
    </div>
  )
}
