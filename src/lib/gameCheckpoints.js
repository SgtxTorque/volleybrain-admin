/**
 * Game Day Journey — Checkpoint computation
 *
 * Checkpoints:
 * 1. RSVP    — Have players responded? (event_rsvps)
 * 2. LINEUP  — Is a lineup set? (game_lineups)
 * 3. ATTEND  — Has attendance been taken? (event_attendance)
 * 4. GAME    — Is the game in progress or complete? (schedule_events.game_status)
 * 5. SCORES  — Are set/period scores entered? (schedule_events.game_status === 'completed')
 * 6. STATS   — Are player stats entered? (schedule_events.stats_entered)
 */

export const CHECKPOINTS = [
  { id: 'rsvp', label: 'RSVP', icon: '📋', phase: 'prep' },
  { id: 'lineup', label: 'Lineup', icon: '📐', phase: 'prep' },
  { id: 'attend', label: 'Attendance', icon: '✋', phase: 'gameday' },
  { id: 'game', label: 'Game', icon: '🏐', phase: 'gameday' },
  { id: 'scores', label: 'Scores', icon: '📊', phase: 'postgame' },
  { id: 'stats', label: 'Stats', icon: '⭐', phase: 'postgame', optional: true },
]

/**
 * Compute checkpoint states from game + related data
 * Returns: { [checkpointId]: { status, detail } }
 * status: 'not_started' | 'in_progress' | 'done' | 'warning' | 'skipped'
 */
export function computeCheckpoints(game, { rsvpData, hasLineup, attendanceData, rosterCount }) {
  const today = new Date().toISOString().split('T')[0]
  const gameDate = game.event_date
  const isToday = gameDate === today
  const isPast = gameDate < today
  const isCompleted = game.game_status === 'completed'

  // RSVP
  const rsvpCount = rsvpData?.length || 0
  const rsvpYes = rsvpData?.filter(r => r.status === 'yes' || r.status === 'attending').length || 0
  const rsvpNo = rsvpData?.filter(r => r.status === 'no' || r.status === 'not_attending').length || 0
  const rsvpPending = rosterCount - rsvpCount
  let rsvpStatus = 'not_started'
  let rsvpDetail = `${rsvpPending} pending`
  if (rsvpCount > 0 && rsvpPending === 0) { rsvpStatus = 'done'; rsvpDetail = `${rsvpYes} yes, ${rsvpNo} no` }
  else if (rsvpCount > 0) { rsvpStatus = 'in_progress'; rsvpDetail = `${rsvpYes} yes, ${rsvpPending} pending` }
  if (isCompleted) { rsvpStatus = rsvpCount > 0 ? 'done' : 'skipped' }

  // LINEUP
  let lineupStatus = hasLineup ? 'done' : 'not_started'
  let lineupDetail = hasLineup ? 'Set' : 'Not set'
  if (!hasLineup && (isToday || isPast)) lineupStatus = isPast ? 'skipped' : 'warning'
  if (isCompleted && !hasLineup) lineupStatus = 'skipped'

  // ATTENDANCE
  const attendCount = attendanceData?.length || 0
  let attendStatus = attendCount > 0 ? 'done' : 'not_started'
  let attendDetail = attendCount > 0 ? `${attendanceData.filter(a => a.status === 'present').length}/${attendCount} present` : 'Not taken'
  if (isCompleted && attendCount === 0) attendStatus = 'skipped'

  // GAME (in progress)
  let gameStatus = 'not_started'
  let gameDetail = ''
  if (isCompleted) {
    gameStatus = 'done'
    gameDetail = game.game_result === 'win' ? 'Won' : game.game_result === 'loss' ? 'Lost' : game.game_result === 'tie' ? 'Tied' : 'Completed'
  } else if (game.game_status === 'in_progress') {
    gameStatus = 'in_progress'
    gameDetail = 'In progress'
  } else if (isPast) {
    gameStatus = 'warning'
    gameDetail = 'Needs completion'
  }

  // SCORES
  let scoresStatus = 'not_started'
  let scoresDetail = 'Not entered'
  if (isCompleted) {
    scoresStatus = 'done'
    const ourScore = game.our_sets_won ?? game.our_score ?? 0
    const theirScore = game.opponent_sets_won ?? game.opponent_score ?? 0
    scoresDetail = `${ourScore}-${theirScore}`
  } else if (isPast) {
    scoresStatus = 'warning'
    scoresDetail = 'Enter scores'
  }

  // STATS
  let statsStatus = game.stats_entered ? 'done' : 'not_started'
  let statsDetail = game.stats_entered ? 'Entered' : 'Optional'
  if (isCompleted && !game.stats_entered) {
    statsStatus = 'not_started'
    statsDetail = 'Add stats to power leaderboards'
  }

  return {
    rsvp: { status: rsvpStatus, detail: rsvpDetail },
    lineup: { status: lineupStatus, detail: lineupDetail },
    attend: { status: attendStatus, detail: attendDetail },
    game: { status: gameStatus, detail: gameDetail },
    scores: { status: scoresStatus, detail: scoresDetail },
    stats: { status: statsStatus, detail: statsDetail },
  }
}

/**
 * Get the "current" checkpoint — what the coach should focus on next
 */
export function getCurrentCheckpoint(checkpoints) {
  // Priority: warnings first, then first not_started
  const warningId = CHECKPOINTS.find(cp => checkpoints[cp.id]?.status === 'warning')?.id
  if (warningId) return warningId

  const nextId = CHECKPOINTS.find(cp =>
    checkpoints[cp.id]?.status === 'not_started' && !cp.optional
  )?.id
  if (nextId) return nextId

  // All required done — suggest optional stats if not done
  const statsNotDone = checkpoints.stats?.status === 'not_started'
  if (statsNotDone) return 'stats'

  return null // all done
}

/**
 * Get completion percentage (excluding optional checkpoints)
 */
export function getCompletionPercent(checkpoints) {
  const required = CHECKPOINTS.filter(cp => !cp.optional)
  const done = required.filter(cp =>
    checkpoints[cp.id]?.status === 'done' || checkpoints[cp.id]?.status === 'skipped'
  )
  return Math.round((done.length / required.length) * 100)
}
