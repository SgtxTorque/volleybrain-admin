// =============================================================================
// team-utils.js — Helpers for resolving a player's team(s) from team_players.
//
// Context: A player can be on multiple teams (multi-team assignment). Any
// read-side surface that wants "THE team" should use getPrimaryTeam (or
// getPrimaryTeamInfo) rather than team_players[0], because array order is
// not guaranteed and may shift when entries are added/removed.
//
// Priority: is_primary_team === true  →  first array entry  →  null
// =============================================================================

/**
 * Get the primary team_players row for a player.
 * @param {Array} teamPlayers - The player.team_players array.
 * @returns {Object|null} The primary team_players row, or null if the player has no teams.
 */
export function getPrimaryTeam(teamPlayers) {
  if (!Array.isArray(teamPlayers) || teamPlayers.length === 0) return null
  const primary = teamPlayers.find(tp => tp?.is_primary_team)
  return primary || teamPlayers[0]
}

/**
 * Get the primary team's nested teams object ({ id, name, color, ... }).
 * @param {Array} teamPlayers
 * @returns {Object|null}
 */
export function getPrimaryTeamInfo(teamPlayers) {
  const tp = getPrimaryTeam(teamPlayers)
  return tp?.teams || null
}

/**
 * Flatten team_players into a display-ready array.
 * @param {Array} teamPlayers
 * @returns {Array<{ id, name, color, isPrimary, jerseyNumber }>}
 */
export function getAllTeams(teamPlayers) {
  if (!Array.isArray(teamPlayers) || teamPlayers.length === 0) return []
  return teamPlayers.map(tp => ({
    id: tp.team_id || tp.teams?.id,
    name: tp.teams?.name || 'Team',
    color: tp.teams?.color || null,
    isPrimary: !!tp.is_primary_team,
    jerseyNumber: tp.jersey_number || null,
  }))
}
