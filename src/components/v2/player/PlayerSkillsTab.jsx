// =============================================================================
// PlayerSkillsTab — V2 skill ratings from coach evaluations
// Props-only.
// =============================================================================

export default function PlayerSkillsTab({
  skillRatings = null,
  overallRating = 0,
}) {
  const skills = skillRatings ? [
    { label: 'Serving', value: skillRatings.serving || 0 },
    { label: 'Passing', value: skillRatings.passing || 0 },
    { label: 'Setting', value: skillRatings.setting || 0 },
    { label: 'Hitting', value: skillRatings.hitting || 0 },
    { label: 'Blocking', value: skillRatings.blocking || 0 },
    { label: 'Defense', value: skillRatings.defense || 0 },
    { label: 'Court Sense', value: skillRatings.court_sense || 0 },
    { label: 'Hustle', value: skillRatings.hustle || 0 },
  ].filter(s => s.value > 0) : []

  const getBarColor = (val) => {
    if (val >= 9) return '#FFD700'
    if (val >= 7) return '#4BB9EC'
    if (val >= 5) return '#22C55E'
    return 'rgba(255,255,255,0.30)'
  }

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Overall Rating */}
      {overallRating > 0 && (
        <div style={{
          textAlign: 'center', marginBottom: 24,
          background: 'rgba(255,215,0,0.06)', borderRadius: 14, padding: '20px 16px',
          border: '1px solid rgba(255,215,0,0.10)',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#FFD700', lineHeight: 1 }}>
            {overallRating}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.40)', marginTop: 6,
          }}>
            Overall Rating
          </div>
        </div>
      )}

      {/* Skill Bars */}
      {skills.length > 0 ? (
        <>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'rgba(255,255,255,0.40)',
            marginBottom: 14,
          }}>
            Coach Evaluation
          </div>
          {skills.map((skill, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>
                  {skill.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: getBarColor(skill.value) }}>
                  {skill.value}/10
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: getBarColor(skill.value),
                  width: `${(skill.value / 10) * 100}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📊</span>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>
            No skill ratings yet — ask your coach for an evaluation!
          </div>
        </div>
      )}
    </div>
  )
}
